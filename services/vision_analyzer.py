import io
import time
import json
from PIL import Image
import pypdfium2 as pdfium
from google import genai
from config import Config

client = genai.Client(api_key=Config.GOOGLE_API_KEY)

MODELS_TO_TRY = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash"
]

def get_language_instructions(lang: str) -> str:
    lang = (lang or "english").lower().strip()
    if lang == "urdu":
        return """
CRITICAL LANGUAGE REQUIREMENT — URDU SCRIPT ONLY (اردو زبان):
- You MUST write 'clinical_markdown', 'diet_dos', 'diet_donts', and 'audio_summary_ur' entirely in native URDU SCRIPT (اردو رسم الخط).
- DO NOT use English alphabets or Roman Urdu for explanation! Use real Urdu characters (e.g. "یہ میڈیکل رپورٹ خون کے ٹیسٹ کی ہے۔", "خون میں ہیموگلوبن کی مقدار نارمل ہے۔", "پلیٹ لیٹس کم ہیں").
- Headings MUST be in Urdu: 
  ## ۱. خلاصہ (Overview)
  ## ۲. اہم نتائج (Key Findings)
  ## ۳. تفصیلی وضاحت (Detailed Explanation)
  ## ۴. غذا اور پرہیز (Dietary Guidance)
  ## ۵. ڈاکٹر سے ضروری سوالات (Questions for Doctor)
  ## ۶. انتباہ (Disclaimer)
"""
    elif lang == "roman_urdu":
        return """
CRITICAL LANGUAGE REQUIREMENT — ROMAN URDU ONLY:
- Write 'clinical_markdown', 'diet_dos', 'diet_donts', and 'audio_summary_ur' in clear ROMAN URDU (Urdu written in English alphabet, e.g. "Yeh report khoon ke test ki hai. Hemoglobin ki miqdaar theek hai.").
- Headings:
  ## 1. Overview
  ## 2. Key Findings
  ## 3. Detailed Explanation
  ## 4. Dietary Guidance
  ## 5. Questions for Doctor
  ## 6. Disclaimer
"""
    else:  # english
        return """
CRITICAL LANGUAGE REQUIREMENT — ENGLISH ONLY:
- Write the entire 'clinical_markdown', 'diet_dos', 'diet_donts', and 'audio_summary_en' in professional, clear ENGLISH.
- Headings:
  ## 1. Overview
  ## 2. Key Findings
  ## 3. Detailed Explanation
  ## 4. Dietary Guidance
  ## 5. Questions for Doctor
  ## 6. Disclaimer
"""

BASE_PROMPT = """
You are MedVision AI, a clinical document analyzer. Your sole task is to analyze medical documents for patient comprehension.

STRICT RELEVANCE & PRIVACY:
Do NOT mention any developer, university, creator, student name, or software origin in this analysis. Focus purely on medical findings, biomarkers, medication safety, diet, and clinical explanation.

FORMATTING MANDATE FOR clinical_markdown:
- ALWAYS use proper double line breaks (\\n\\n) between headings, paragraphs, and list items.
- Never write headings inline with paragraphs. Keep every section on a fresh line.

You MUST respond strictly in valid JSON format with the following schema:
{
  "document_type": "Lab Report / Prescription / Comparative Progress Analysis / Unknown",
  "biomarkers": [
    {"name": "Marker Name", "value": "Current Value", "range": "Reference range", "status": "Normal/High/Low"}
  ],
  "diet_dos": ["3 specific food or habit recommendations in the requested language"],
  "diet_donts": ["3 specific items or habits to strictly avoid in the requested language"],
  "medications": [
    {"medicine": "Medicine name", "timing": "Morning/Night", "hours": [9, 21], "instructions": "Usage detail"}
  ],
  "drug_interactions": [
    {"pair": "Drug A + Drug B", "severity": "Mild/Moderate/Severe", "warning": "Clinical risk explanation"}
  ],
  "food_warnings": [
    {"medicine": "Medicine name", "avoid": "Food/Drink to avoid", "reason": "Why to avoid"}
  ],
  "audio_summary_ur": "Voice summary in requested Urdu/Roman Urdu script.",
  "audio_summary_en": "Voice summary in English.",
  "clinical_markdown": "Full clinical breakdown strictly in the requested language and script."
}

Do not include any Markdown ticks or text outside the JSON object.
"""

def convert_to_pil_images(file_bytes: bytes, mime_type: str):
    images = []
    if mime_type == "application/pdf" or file_bytes.startswith(b"%PDF"):
        try:
            pdf = pdfium.PdfDocument(file_bytes)
            num_pages = min(len(pdf), 2)
            for i in range(num_pages):
                images.append(pdf[i].render(scale=2).to_pil())
        except Exception as e:
            print(f"PDF extract error: {e}")
    else:
        try:
            images.append(Image.open(io.BytesIO(file_bytes)))
        except Exception as e:
            print(f"Image load error: {e}")
    return images

def analyze_medical_image(file_bytes: bytes, mime_type: str, user_query: str = "", selected_lang: str = "english", past_bytes: bytes = None, past_mime: str = None) -> dict:
    current_images = convert_to_pil_images(file_bytes, mime_type)
    if not current_images:
        return {"error": "Could not read the primary document."}

    lang_instruction = get_language_instructions(selected_lang)
    full_prompt = BASE_PROMPT + "\n\n" + lang_instruction

    prompt_content = [full_prompt]

    if past_bytes:
        past_images = convert_to_pil_images(past_bytes, past_mime)
        prompt_content.append("DOCUMENT 1: PREVIOUS / OLDER MEDICAL REPORT:")
        prompt_content.extend(past_images)
        prompt_content.append("DOCUMENT 2: CURRENT / NEW MEDICAL REPORT TO COMPARE:")
        prompt_content.extend(current_images)
        prompt_content.append("Compare Document 2 against Document 1. Highlight health progress, biomarker improvements, and persistent issues.")
    else:
        prompt_content.extend(current_images)

    user_note = f"User specific question: {user_query}\n" if user_query else ""
    user_note += f"MANDATORY: Output the entire analysis in {selected_lang.upper()} as strictly instructed."
    prompt_content.append(user_note)

    last_error = ""
    for model_name in MODELS_TO_TRY:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt_content,
                    config={"response_mime_type": "application/json"}
                )
                if response and response.text:
                    clean_json = response.text.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.startswith("```"):
                        clean_json = clean_json[3:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    
                    data = json.loads(clean_json.strip())

                    return {
                        "analysis": data.get("clinical_markdown", "Analysis completed."),
                        "biomarkers": data.get("biomarkers", []),
                        "diet": {
                            "dos": data.get("diet_dos", []),
                            "donts": data.get("diet_donts", [])
                        },
                        "medications": data.get("medications", []),
                        "drug_interactions": data.get("drug_interactions", []),
                        "food_warnings": data.get("food_warnings", []),
                        "audio_ur": data.get("audio_summary_ur", "Aapki report tayar hai."),
                        "audio_en": data.get("audio_summary_en", "Your report is ready."),
                        "lang": selected_lang
                    }
            except Exception as e:
                err_msg = str(e)
                last_error = err_msg
                if "503" in err_msg or "high demand" in err_msg.lower():
                    time.sleep(1.5)
                    continue
                else:
                    break

    return {"error": f"Service temporarily busy. Details: {last_error}"}

def ask_followup_question(report_context: str, question: str) -> str:
    prompt = f"""
You are MedVision AI assistant.

DEVELOPER IDENTITY (ONLY REVEAL IF ASKED):
If, and ONLY IF, the user explicitly asks about who made, developed, or created you (e.g., 'who made you', 'who developed this', 'tumhe kisne banaya', 'developer kaun hai'):
Reply: "Mujhe Iqra Azam ne develop kiya hai, jo University of the Punjab mein Computer Science ki student hain (unhone yeh project apne 7th semester mein develop kiya)."

OTHERWISE:
Do not mention Iqra Azam, Punjab University, or your creation history. Answer the user's question regarding their medical report, progress, drug safety, diet, or medicines accurately in the EXACT script and language of the user's question.

Report context:
{report_context}

User question:
"{question}"
"""
    last_error = ""
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_error = str(e)
            continue

    return f"Could not answer question at this time. Details: {last_error}"