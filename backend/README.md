# Neuro-Sentry Backend

A FastAPI-based backend with **automatic Ollama model detection**, **GPU-optimized LLM support**, **comprehensive logging**, and **security threat analysis**.

Neuro-Sentry is designed to intelligently select the best available LLM (CPU or GPU), provide real-time inference, and maintain detailed operational logs for observability and debugging.

---

## 🚀 Features

- ✅ **Auto-detects available Ollama models** Priority order:
  1. `llama3-gpu` (GPU-optimized)
  2. `llama3`
  3. `mistral`
  4. First available model
- ⚡ **GPU-accelerated LLM inference** (when available)
- 🛡️ **Security threat detection & prompt analysis**
- 📊 **Usage & statistics tracking**
- 📝 **Comprehensive backend logging**

---

## 📂 Project Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   └── utils/
├── logs/
│   └── backend_TIMESTAMP.log
├── requirements.txt
└── README.md
🛠️ Quick StartFrom the backend directory:Setup (First Time Only)Bashpython3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
Run the BackendBashsource venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
The server will start at: http://localhost:8000📜 LoggingAll backend logs are automatically stored in: backend/logs/backend_TIMESTAMP.logView Logs in Real TimeBashtail -f backend/logs/backend_*.log
Logs include:Model detection resultsAPI requests & responsesLLM interaction eventsError traces & system warnings🧠 Model Detection LogicNeuro-Sentry automatically detects and selects the best available Ollama model at startup based on the following selection priority:llama3-gpu – GPU-optimized (preferred)llama3 – CPU fallbackmistral – Alternative fallbackAny available modelYou can verify the active model via backend logs or the GET /health endpoint.🔌 API EndpointsMethodEndpointDescriptionGET/Service infoGET/healthHealth check & active modelPOST/chatDirect LLM chatPOST/api/promptSecurity threat analysisGET/api/statsUsage statisticsGET/api/logsRecent backend logs🏎️ Ollama GPU Model: llama3-gpuOverviewThis backend supports a GPU-forced Ollama model named llama3-gpu, created using a custom Modelfile to ensure consistent GPU offloading.Key Concept: Ollama models are neither CPU-only nor GPU-only. GPU utilization is determined at runtime via configuration parameters—specifically num_gpu.Modelfile ConfigurationFilename: ModelfileDockerfileFROM llama3

PARAMETER num_gpu 99
PARAMETER num_ctx 4096
PARAMETER num_keep 24
Parameter ExplanationParameterDescriptionFROM llama3Uses default llama3 model as basenum_gpu 99Forces maximum GPU layer offloading (auto-clamped by VRAM)num_ctx 4096Sets context window sizenum_keep 24Preserves tokens across turnsCreation & VerificationBash# Create the model
ollama create llama3-gpu -f Modelfile

# Verify configuration
ollama show llama3-gpu
Confirming GPU UtilizationRun the Model: ollama run llama3-gpuMonitor GPU: Run nvidia-smi in a separate terminal. Increased VRAM usage confirms success.📈 GPU Tuning ReferenceAvailable VRAMRecommended num_gpu4 GB35–456 GB55–708 GB80–9912 GB+99Note: Setting num_gpu to 99 is safe—Ollama automatically clamps the value based on your hardware's actual capacity.🔮 Future Improvements[ ] Automatic GPU VRAM detection[ ] Dynamic num_gpu tuning at runtime[ ] Enhanced performance metrics[ ] Extended security rule sets
