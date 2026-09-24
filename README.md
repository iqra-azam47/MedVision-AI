# 🩺 MedVision AI — Clinical Document Decoder

> An intelligent, multilingual clinical decision-support application that decodes complex diagnostic lab reports, blood panels, and handwritten medical prescriptions into patient-friendly insights, dietary precautions, and medication schedules.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Render-38bdf8?style=for-the-badge&logo=render)](https://medvision-ai-9ni3.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black?style=for-the-badge&logo=flask)](https://palletsprojects.com/p/flask/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)

---

## 🌐 Live Application
Access the deployed application directly:  
🔗 **[https://medvision-ai-9ni3.onrender.com/](https://medvision-ai-9ni3.onrender.com/)**

---

## 💡 About The Project

Medical reports and prescriptions are often filled with clinical jargon, abbreviations, and handwritten shorthand that patients find difficult to interpret. This information gap frequently leads to anxiety, dosage mistakes, and missed precautions.

**MedVision AI** bridges this gap by acting as an empathetic, intelligent medical document interpreter. It ingests multi-format diagnostic files (PDFs, images, camera captures) and outputs clear, structured health breakdowns in the patient's preferred language.

---

## ✨ Key Features

- **🌐 Tri-Lingual Support:**
  - **English:** Clinical, standardized medical breakdowns.
  - **Urdu Script (اردو):** Full native Urdu script analysis rendered with proper right-to-left (RTL) formatting.
  - **Roman Urdu:** Simple, everyday conversational Urdu written in Latin script for widespread local understanding.

- **🔬 Biomarker Analysis & Status Cards:**
  - Automatically identifies key parameters (e.g., Hemoglobin, Platelets, WBC, Glucose).
  - Flags values against standard clinical reference ranges using dynamic status badges: `Normal`, `High`, or `Low`.

- **💊 Medication & Dosage Timetable:**
  - Extracts prescribed drugs, dosage frequencies, and morning/night schedules.
  - **1-Click Calendar Sync:** Generates `.ics` calendar files to set smartphone reminders for prescribed medication timings.

- **🛡️ Drug Safety & Contraindication Alerts:**
  - Scans for dangerous drug-to-drug interactions.
  - Highlights specific food or beverage precautions (e.g., foods to avoid when taking specific antibiotics or iron supplements).

- **🥗 Evidence-Based Diet & Lifestyle Guidance:**
  - Clearly separated, color-coded **Recommended Nutrition (Do's)** and **Strict Precautions (Don'ts)** tailored to test results.

- **📊 Comparative Report Tracking:**
  - Allows uploading a baseline/previous report alongside a current report to evaluate clinical improvement or disease progression over time.

- **💬 Follow-up AI Consultation Chat:**
  - Context-aware chatbot enabling users to ask follow-up questions directly about their uploaded report.

- **🔊 Audio Summaries & PDF Export:**
  - Dual-language text-to-speech synthesis (English & Urdu).
  - Print-optimized stylesheet for saving clean, consult-ready PDF summaries.

---

## 🏗️ System Architecture

```text
┌─────────────────────────┐
│     Client Browser      │ (Vanilla JS, CSS Grid, Live Camera, Marked.js)
└────────────┬────────────┘
             │ HTTP POST (Document Multipart / JSON)
             ▼
┌─────────────────────────┐
│   Flask Backend Server  │ (app.py — Route handling, Session, CORS)
└────────────┬────────────┘
             │ File Stream / Bytes
             ▼
┌─────────────────────────┐
│    Document Processor   │ (pypdfium2 / Pillow — Multi-page PDF to Image)
└────────────┬────────────┘
             │ High-Resolution Image Buffers + Language Directives
             ▼
┌─────────────────────────┐
│    Google Gemini API    │ (Multimodal Vision Engine & Structured JSON Parsing)
└────────────┬────────────┘
             │ Validated JSON Schema Response
             ▼
┌─────────────────────────┐
│ Interactive UI Renderer │ (Biomarkers, Timetable, Safety Alerts, RTL Urdu)
└─────────────────────────┘
🛠️ Tech Stack
Backend: Python 3, Flask, Gunicorn

AI / LLM: Google Gemini API (google-genai SDK)

Document Processing: pypdfium2 (PDF rendering engine), Pillow (Image manipulation)

Frontend: Vanilla JavaScript (ES6+), Modern Semantic HTML5, Custom Responsive CSS (Dark Mode, Glassmorphism, Print Engine)

Deployment Platform: Render

📂 Project Structure
Bash
MedVision-AI/
├── app.py                     # Flask application entry point and API routes
├── config.py                  # Environment variable configuration
├── requirements.txt           # Project dependencies
├── Procfile                   # Process file for cloud deployment (Gunicorn)
├── services/
│   └── vision_analyzer.py    # Core AI integration, prompt design, and JSON decoders
├── static/
│   ├── css/
│   │   └── style.css          # Dark-mode styling, RTL Urdu support, print media queries
│   └── js/
│       └── app.js             # Client UI handlers, live camera modal, audio synthesis
└── templates/
    └── index.html             # Main dashboard template with splash screen
🚀 Local Setup & Installation
Clone and run the application locally on your machine:

1. Clone Repository
Bash
git clone [https://github.com/iqra-azam47/MedVision-AI.git](https://github.com/iqra-azam47/MedVision-AI.git)
cd MedVision-AI
2. Set Up Virtual Environment   
Bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
3. Install Dependencies   
Bash
pip install -r requirements.txt
4. Configure Environment Variables
Create a .env file in the root directory:

Code snippet
GOOGLE_API_KEY=your_gemini_api_key_here
SECRET_KEY=medvision-super-secret-key-2026
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
5. Run Development Server
Bash
python app.py
Open your browser and navigate to:

http://127.0.0.1:5000

⚠️ Medical Disclaimer
MedVision AI is strictly an educational decision-support tool. It does not provide medical diagnoses, treatment prescriptions, or definitive medical advice. Clinical document interpretations should always be reviewed and confirmed by a certified physician or licensed healthcare provider.

👩‍💻 Author & Maintainer
Crafted with ❤️ by Iqra Azam

Department of Computer Science, University of the Punjab
