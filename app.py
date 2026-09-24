import os
from flask import Flask, render_template, request, jsonify
from config import Config
from services.vision_analyzer import analyze_medical_image, ask_followup_question

app = Flask(__name__)
app.config.from_object(Config)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No document uploaded"}), 400
        
        file = request.files["image"]
        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"error": "Please upload a valid JPG, PNG, WEBP, or PDF file."}), 400

        user_query = request.form.get("query", "").strip()
        # Default language english set kar di gayi hai
        selected_lang = request.form.get("lang", "english").strip()
        file_bytes = file.read()
        mime_type = file.mimetype or "image/jpeg"

        # Optional Past Report handling
        past_bytes = None
        past_mime = None
        if "past_image" in request.files:
            past_file = request.files["past_image"]
            if past_file.filename != "" and allowed_file(past_file.filename):
                past_bytes = past_file.read()
                past_mime = past_file.mimetype or "image/jpeg"

        result = analyze_medical_image(
            file_bytes=file_bytes, 
            mime_type=mime_type, 
            user_query=user_query, 
            selected_lang=selected_lang,
            past_bytes=past_bytes,
            past_mime=past_mime
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Server processing error: {str(e)}"}), 500

@app.route("/api/followup", methods=["POST"])
def followup():
    try:
        data = request.get_json() or {}
        report_context = data.get("report_context", "").strip()
        user_question = data.get("question", "").strip()

        if not user_question:
            return jsonify({"error": "Question cannot be empty"}), 400

        answer = ask_followup_question(report_context, user_question)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": f"Server processing error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)