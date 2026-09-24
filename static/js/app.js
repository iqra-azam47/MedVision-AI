// Splash Screen Handler
    const splashScreen = document.getElementById("splash-screen");
    const closeSplashBtn = document.getElementById("close-splash-btn");

    if (closeSplashBtn && splashScreen) {
        closeSplashBtn.addEventListener("click", () => {
            splashScreen.classList.add("fade-out");
            setTimeout(() => {
                splashScreen.style.display = "none";
            }, 300);
        });
    }

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");
    const dropZone = document.getElementById("drop-zone");
    const dropPrompt = document.getElementById("drop-prompt");
    const imagePreview = document.getElementById("image-preview");

    const enableCompare = document.getElementById("enable-compare");
    const dropZonePast = document.getElementById("drop-zone-past");
    const fileInputPast = document.getElementById("file-input-past");
    const dropPromptPast = document.getElementById("drop-prompt-past");
    const imagePreviewPast = document.getElementById("image-preview-past");

    const analyzeBtn = document.getElementById("analyze-btn");
    const userQuery = document.getElementById("user-query");
    const langSelect = document.getElementById("lang-select");
    const loadingState = document.getElementById("loading");
    const resultsContent = document.getElementById("results");
    
    const biomarkersContainer = document.getElementById("biomarkers-container");
    const dietContainer = document.getElementById("diet-container");
    const dosList = document.getElementById("dos-list");
    const dontsList = document.getElementById("donts-list");

    const medsContainer = document.getElementById("meds-container");
    const medsList = document.getElementById("meds-list");
    const syncCalBtn = document.getElementById("sync-cal-btn");

    const drugSafetyContainer = document.getElementById("drug-safety-container");
    const interactionAlerts = document.getElementById("interaction-alerts");
    const foodAlerts = document.getElementById("food-alerts");

    const actionControls = document.getElementById("action-controls");
    const ttsUrBtn = document.getElementById("tts-ur-btn");
    const ttsEnBtn = document.getElementById("tts-en-btn");
    const ttsStopBtn = document.getElementById("tts-stop-btn");
    const exportPdfBtn = document.getElementById("export-pdf-btn");

    const chatSection = document.getElementById("chat-section");
    const chatHistory = document.getElementById("chat-history");
    const followupInput = document.getElementById("followup-input");
    const sendFollowupBtn = document.getElementById("send-followup-btn");

    const openCamBtn = document.getElementById("open-cam-btn");
    const closeCamBtn = document.getElementById("close-cam-btn");
    const captureBtn = document.getElementById("capture-btn");
    const cameraModal = document.getElementById("camera-modal");
    const cameraFeed = document.getElementById("camera-feed");
    const cameraCanvas = document.getElementById("camera-canvas");

    let cameraStream = null;
    let selectedFile = null;
    let selectedPastFile = null;
    let latestReportText = "";
    let urduSummary = "";
    let englishSummary = "";
    let detectedMeds = [];

    // Helper to fix flattened markdown text, convert literal \n to real breaks & split headings
    function formatMarkdownText(rawText) {
        if (!rawText) return "";
        let str = String(rawText);

        // 1. Literal \n aur \r\n ko real newlines banao
        str = str.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

        // 2. Agar number ke baad dot ho jo heading ko list bana raha ho (e.g., "## 1. Overview" -> "## 1: Overview")
        str = str.replace(/(#{1,4}\s+[0-9\u0660-\u0669]+)\.\s+/g, "$1: ");

        // 3. Poori heading ko alag line par safe spacing do bina number ko tode
        str = str.replace(/([^\n])\s*(#{1,4}\s+[^\n]+)/g, "$1\n\n$2\n\n");

        // 4. Bullet points ko split karo
        str = str.replace(/([^\n])\s+-\s+([^\n]+)/g, "$1\n- $2");

        // 5. Bold subheadings
        str = str.replace(/([^\n])\s+(\*\*[^*]+:\*\*)/g, "$1\n\n$2");

        // 6. Clean up redundant linebreaks
        str = str.replace(/\n{3,}/g, "\n\n");

        return str.trim();
    }

    function parseMarkdownSafely(text) {
        const formatted = formatMarkdownText(text);
        if (typeof marked !== "undefined" && typeof marked.parse === "function") {
            return marked.parse(formatted);
        }
        return formatted.replace(/\n/g, "<br>");
    }

    let availableVoices = [];
    function refreshVoices() {
        availableVoices = window.speechSynthesis.getVoices();
    }
    refreshVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = refreshVoices;
    }

    if (enableCompare) {
        enableCompare.addEventListener("change", (e) => {
            if (e.target.checked) {
                if (dropZonePast) dropZonePast.classList.remove("hidden");
            } else {
                if (dropZonePast) dropZonePast.classList.add("hidden");
                selectedPastFile = null;
                if (imagePreviewPast) imagePreviewPast.classList.add("hidden");
                if (dropPromptPast) dropPromptPast.classList.remove("hidden");
            }
        });
    }

    if (dropZone) dropZone.addEventListener("click", () => fileInput && fileInput.click());
    if (dropZonePast) dropZonePast.addEventListener("click", () => fileInputPast && fileInputPast.click());

    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0], imagePreview, dropPrompt, (f) => selectedFile = f);
        });
    }

    if (fileInputPast) {
        fileInputPast.addEventListener("change", (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0], imagePreviewPast, dropPromptPast, (f) => selectedPastFile = f);
        });
    }

    function handleFile(file, imgEl, promptEl, setVar) {
        setVar(file);
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            if (imgEl) imgEl.classList.add("hidden");
            if (promptEl) {
                promptEl.innerHTML = `<div style="font-size: 2rem;">📄</div><p><strong>${file.name}</strong></p><span style="color:#4ade80;">PDF Loaded</span>`;
                promptEl.classList.remove("hidden");
            }
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (imgEl) {
                    imgEl.src = e.target.result;
                    imgEl.classList.remove("hidden");
                }
                if (promptEl) promptEl.classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
        if (analyzeBtn) analyzeBtn.removeAttribute("disabled");
    }

    // Camera Handlers
    if (openCamBtn) {
        openCamBtn.addEventListener("click", async () => {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                if (cameraFeed) cameraFeed.srcObject = cameraStream;
                if (cameraModal) cameraModal.classList.remove("hidden");
            } catch (err) {
                alert("Camera permission denied.");
            }
        });
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        if (cameraModal) cameraModal.classList.add("hidden");
    }

    if (closeCamBtn) closeCamBtn.addEventListener("click", stopCamera);

    if (captureBtn) {
        captureBtn.addEventListener("click", () => {
            if (!cameraFeed || !cameraFeed.videoWidth) return;
            cameraCanvas.width = cameraFeed.videoWidth;
            cameraCanvas.height = cameraFeed.videoHeight;
            cameraCanvas.getContext("2d").drawImage(cameraFeed, 0, 0);
            cameraCanvas.toBlob((blob) => {
                selectedFile = new File([blob], "camera_doc.jpg", { type: "image/jpeg" });
                if (imagePreview) {
                    imagePreview.src = cameraCanvas.toDataURL("image/jpeg");
                    imagePreview.classList.remove("hidden");
                }
                if (dropPrompt) dropPrompt.classList.add("hidden");
                if (analyzeBtn) analyzeBtn.removeAttribute("disabled");
                stopCamera();
            }, "image/jpeg", 0.95);
        });
    }

    // Analyze Click
    analyzeBtn.addEventListener("click", async () => {
        if (!selectedFile) return;

        stopSpeech();

        const formData = new FormData();
        formData.append("image", selectedFile);
        if (enableCompare && enableCompare.checked && selectedPastFile) {
            formData.append("past_image", selectedPastFile);
        }
        if (userQuery) formData.append("query", userQuery.value);
        if (langSelect) formData.append("lang", langSelect.value);

        analyzeBtn.disabled = true;
        if (loadingState) loadingState.classList.remove("hidden");
        if (resultsContent) resultsContent.innerHTML = "";
        
        if (biomarkersContainer) {
            biomarkersContainer.innerHTML = "";
            biomarkersContainer.classList.add("hidden");
        }
        if (dietContainer) dietContainer.classList.add("hidden");
        if (dosList) dosList.innerHTML = "";
        if (dontsList) dontsList.innerHTML = "";
        if (medsContainer) {
            medsContainer.classList.add("hidden");
            if (medsList) medsList.innerHTML = "";
        }
        detectedMeds = [];
        
        if (drugSafetyContainer) drugSafetyContainer.classList.add("hidden");
        if (interactionAlerts) interactionAlerts.innerHTML = "";
        if (foodAlerts) foodAlerts.innerHTML = "";
        
        if (chatSection) chatSection.classList.add("hidden");
        if (actionControls) actionControls.classList.add("hidden");
        if (ttsStopBtn) ttsStopBtn.classList.add("hidden");
        if (chatHistory) chatHistory.innerHTML = "";

        try {
            const res = await fetch("/api/analyze", { method: "POST", body: formData });
            const data = await res.json();

            if (data.error) {
                if (resultsContent) resultsContent.innerHTML = `<div class="error-msg">${data.error}</div>`;
            } else {
                latestReportText = data.analysis || "";
                urduSummary = data.audio_ur || "Aapki report tayar hai.";
                englishSummary = data.audio_en || "Your report analysis is ready.";
                detectedMeds = data.medications || [];

                if (resultsContent) {
                    if (langSelect && langSelect.value === "urdu") resultsContent.classList.add("rtl-text");
                    else resultsContent.classList.remove("rtl-text");
                }

                if (data.biomarkers && data.biomarkers.length > 0 && biomarkersContainer) {
                    renderBiomarkers(data.biomarkers);
                    biomarkersContainer.classList.remove("hidden");
                }

                if (data.diet && ( (data.diet.dos && data.diet.dos.length > 0) || (data.diet.donts && data.diet.donts.length > 0) ) && dietContainer) {
                    renderDiet(data.diet);
                    dietContainer.classList.remove("hidden");
                }

                if (detectedMeds.length > 0 && medsContainer) {
                    renderMedications(detectedMeds);
                    medsContainer.classList.remove("hidden");
                }

                const hasInter = data.drug_interactions && data.drug_interactions.length > 0;
                const hasFood = data.food_warnings && data.food_warnings.length > 0;
                if ((hasInter || hasFood) && drugSafetyContainer) {
                    renderDrugSafety(data.drug_interactions || [], data.food_warnings || []);
                    drugSafetyContainer.classList.remove("hidden");
                }

                if (resultsContent) {
                    resultsContent.innerHTML = parseMarkdownSafely(latestReportText);
                }
                if (chatSection) chatSection.classList.remove("hidden");
                if (actionControls) actionControls.classList.remove("hidden");
            }
        } catch (err) {
            console.error("UI Render Exception:", err);
            if (resultsContent) resultsContent.innerHTML = `<div class="error-msg">Display error occurred: ${err.message}</div>`;
        } finally {
            if (loadingState) loadingState.classList.add("hidden");
            analyzeBtn.disabled = false;
        }
    });

    function renderBiomarkers(markers) {
        if (!biomarkersContainer) return;
        biomarkersContainer.innerHTML = "";
        markers.forEach(m => {
            const card = document.createElement("div");
            card.classList.add("biomarker-card");
            let sClass = "status-normal";
            const s = (m.status || "").toLowerCase();
            if (s.includes("high") || s.includes("elevated")) sClass = "status-high";
            else if (s.includes("low")) sClass = "status-low";
            card.classList.add(sClass);
            card.innerHTML = `
                <div class="bio-header"><span class="bio-name">${m.name || "Test"}</span><span class="bio-badge">${m.status || "Info"}</span></div>
                <div class="bio-val">${m.value || "-"}</div>
                <div class="bio-range">Ref: ${m.range || "N/A"}</div>
            `;
            biomarkersContainer.appendChild(card);
        });
    }

    function renderDiet(diet) {
        if (dosList) {
            dosList.innerHTML = "";
            (diet.dos || []).forEach(item => {
                const li = document.createElement("li");
                li.textContent = item;
                dosList.appendChild(li);
            });
        }
        if (dontsList) {
            dontsList.innerHTML = "";
            (diet.donts || []).forEach(item => {
                const li = document.createElement("li");
                li.textContent = item;
                dontsList.appendChild(li);
            });
        }
    }

    function renderMedications(meds) {
        if (!medsList) return;
        medsList.innerHTML = "";
        meds.forEach(med => {
            const item = document.createElement("div");
            item.classList.add("med-item");
            item.innerHTML = `
                <div class="med-info"><strong>${med.medicine || "Medicine"}</strong><span>${med.instructions || "Follow prescription"}</span></div>
                <div class="med-timing">${med.timing || "As advised"}</div>
            `;
            medsList.appendChild(item);
        });
    }

    function renderDrugSafety(interactions, foodWarnings) {
        if (interactionAlerts) {
            interactionAlerts.innerHTML = "";
            interactions.forEach(inter => {
                const div = document.createElement("div");
                div.classList.add("safety-item", "interaction-item");
                div.innerHTML = `
                    <div class="safety-badge ${(inter.severity || "mild").toLowerCase()}">${inter.severity || "Alert"}</div>
                    <div class="safety-desc">
                        <strong>${inter.pair || ""}</strong>: ${inter.warning || ""}
                    </div>
                `;
                interactionAlerts.appendChild(div);
            });
        }

        if (foodAlerts) {
            foodAlerts.innerHTML = "";
            foodWarnings.forEach(fw => {
                const div = document.createElement("div");
                div.classList.add("safety-item", "food-warning-item");
                div.innerHTML = `
                    <div class="safety-badge food-badge">Food Caution</div>
                    <div class="safety-desc">
                        <strong>${fw.medicine || ""}</strong>: Avoid <em>${fw.avoid || ""}</em> (${fw.reason || ""})
                    </div>
                `;
                foodAlerts.appendChild(div);
            });
        }
    }

    // Audio Logic
    function playSpeech(text, langType) {
        stopSpeech();
        if (!text) return;
        refreshVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        if (langType === "urdu") {
            const v = availableVoices.find(v => v.lang.includes("ur") || v.lang.includes("hi"));
            if (v) utterance.voice = v;
            utterance.lang = "en-US";
        } else {
            const v = availableVoices.find(v => v.lang.includes("en"));
            if (v) utterance.voice = v;
            utterance.lang = "en-US";
        }
        utterance.onstart = () => ttsStopBtn && ttsStopBtn.classList.remove("hidden");
        utterance.onend = () => ttsStopBtn && ttsStopBtn.classList.add("hidden");
        utterance.onerror = () => ttsStopBtn && ttsStopBtn.classList.add("hidden");
        window.speechSynthesis.speak(utterance);
    }

    function stopSpeech() {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) window.speechSynthesis.cancel();
        if (ttsStopBtn) ttsStopBtn.classList.add("hidden");
    }

    if (ttsUrBtn) ttsUrBtn.addEventListener("click", () => playSpeech(urduSummary, "urdu"));
    if (ttsEnBtn) ttsEnBtn.addEventListener("click", () => playSpeech(englishSummary, "english"));
    if (ttsStopBtn) ttsStopBtn.addEventListener("click", stopSpeech);

    if (exportPdfBtn) exportPdfBtn.addEventListener("click", () => window.print());

    if (syncCalBtn) {
        syncCalBtn.addEventListener("click", () => {
            if (!detectedMeds.length) return;
            let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MedVision AI//EN\n";
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            detectedMeds.forEach((m, idx) => {
                const hours = m.hours && m.hours.length ? m.hours : [9];
                hours.forEach(hr => {
                    const hrFmt = String(hr).padStart(2, '0');
                    icsContent += `BEGIN:VEVENT\nUID:med-${Date.now()}-${idx}-${hr}@medvision\n`;
                    icsContent += `DTSTART:${dateStr}T${hrFmt}0000Z\nDURATION:PT15M\n`;
                    icsContent += `SUMMARY:Medicine: ${m.medicine}\nDESCRIPTION:${m.instructions || "Prescription"}\n`;
                    icsContent += `RRULE:FREQ=DAILY;COUNT=7\nEND:VEVENT\n`;
                });
            });
            icsContent += "END:VCALENDAR";
            const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute("download", "Medication_Reminders.ics");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    async function submitFollowUp() {
        if (!followupInput) return;
        const question = followupInput.value.trim();
        if (!question) return;
        appendMessage("user", question);
        followupInput.value = "";
        if (sendFollowupBtn) sendFollowupBtn.disabled = true;

        try {
            const res = await fetch("/api/followup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ report_context: latestReportText, question: question })
            });
            const data = await res.json();
            appendMessage("bot", data.answer || data.error);
        } catch (err) {
            appendMessage("bot", "Error getting answer. Please try again.");
        } finally {
            if (sendFollowupBtn) sendFollowupBtn.disabled = false;
        }
    }

    if (sendFollowupBtn) sendFollowupBtn.addEventListener("click", submitFollowUp);
    if (followupInput) {
        followupInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitFollowUp();
        });
    }

    function appendMessage(sender, text) {
        if (!chatHistory) return;
        const bubble = document.createElement("div");
        bubble.classList.add("chat-bubble", sender === "user" ? "user-bubble" : "bot-bubble");
        bubble.innerHTML = sender === "user" ? text : parseMarkdownSafely(text);
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});