# 🌾 FreshLogic - AI-Powered Crop Spoilage Prevention Platform

**FreshLogic** is an advanced **Agentic AI platform** designed to prevent food spoilage during agricultural transit. It combines **Real-time Weather Telemetry**, **Ensemble ML Models**, and **Generative AI (Gemini 2.5)** to provide farmers and logistics operators with actionable intelligence.

---

## 📊 Model Performance Summary

| Model | Type | MAE | R² Score | Accuracy | F1 Score |
|-------|------|-----|----------|----------|----------|
| **Regressor** | RandomForestRegressor | 0.0344 | 0.9741 | 96.4%* | 0.9636* |
| **Classifier** | RandomForestClassifier | N/A | N/A | 95.9% | 0.9626 |
| **Ensemble** | Combined (Both) | 0.0344 | 0.9741 | 95.9% | 0.9626 |

*\*Regressor converted to classification using 0.5 threshold*

**Training Dataset**: 92,000 samples across 92 crop types, generated using **Arrhenius Equation** (Q10 Spoilage Physics)

---

## 🌟 Key Features

### 1. 🧠 Evaluative AI Agent (Gemini 2.5 Flash + RAG)
- Powered by **Google Gemini 2.5 Flash** with function calling
- **RAG System** retrieves crop-specific storage rules from 92-crop knowledge base
- Generates actionable "Race Engineer" style recommendations

### 2. 🔮 Ensemble ML Model (Regressor + Classifier)
- **Regressor**: Predicts continuous spoilage risk (0.0 - 1.0)
- **Classifier**: Confirms Safe/Spoiled classification with confidence
- **Combined**: Higher confidence when both models agree

### 3. 🌍 Real-World Dynamic Telemetry
- **Routing**: OSRM (Open Source Routing Machine) for real driving paths
- **Geocoding**: Nominatim (OpenStreetMap) for city → coordinates
- **Weather**: OpenWeatherMap for live conditions at each waypoint

### 4. 📍 Per-Waypoint Risk Analysis
- Temperature, humidity, and risk tracked at every checkpoint
- Danger zone detection with exposure time calculation
- Cumulative risk progression throughout the route

### 5. 🖥️ Modern Dashboard Interface
- 3-Panel workspace (Monitor, Chat, History)
- Real-time charts with risk progression
- NLP queries supported (e.g., *"Analyze mango shipment from Nashik to Mumbai"*)

---

## 🛠️ Prerequisites

Before starting, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Python | 3.9+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

### API Keys Required

Create a `.env` file in the `backend/` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

Get your keys from:
- **Gemini**: https://aistudio.google.com/apikey
- **OpenWeather**: https://openweathermap.org/api

---

## 🚀 Quick Start

### Step 1: Clone & Navigate
```powershell
cd FreshLogic
```

### Step 2: Train the Models (Optional - pre-trained models included)

```powershell
# From the project root directory
python train_model.py
```

This will train and save:
- `model/baseline_model.pkl` - Regressor
- `model/classifier_model.pkl` - Classifier  
- `model/ensemble_model.pkl` - Combined Ensemble

**Expected Output:**
```
============================================================
🌾 FreshLogic Ensemble Model Training
============================================================
   Samples: 92,000
   Crops: 92

📈 Training REGRESSOR (RandomForest)...
   ✅ MAE: 0.0344
   ✅ R² Score: 0.9741

🏷️  Training CLASSIFIER (RandomForest)...
   ✅ Accuracy: 0.9593
   ✅ F1 Score: 0.9626

🔗 Creating ENSEMBLE Model...
   💾 Saved: ensemble_model.pkl
```

### Step 3: Copy Models to Backend
```powershell
Copy-Item -Path "model\*.pkl" -Destination "backend\model\" -Force
```

---

## 🖥️ Running the Application

### Terminal 1: Backend API Server

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the FastAPI server
python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
✅ Ensemble model loaded (v1.0.0)
   • Regressor: MAE=0.0344
   • Classifier: F1=0.9626
Loaded Knowledge Base: 92 items.
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2: Frontend Development Server

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the Vite dev server
npm run dev
```

**Expected Output:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:5173 | Main application UI |
| **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI documentation |
| **Health Check** | http://localhost:8000/ | API status endpoint |

---

## 📂 Project Structure

```
FreshLogic/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # API keys (create this!)
│   ├── agents/
│   │   └── gemini_agent.py     # Gemini 2.5 + RAG integration
│   ├── services/
│   │   ├── telemetry_service.py    # OSRM routing + OpenWeatherMap
│   │   ├── model_inference.py      # Ensemble ML model loading
│   │   └── rag_service.py          # Vector search (numpy/pickle)
│   ├── model/
│   │   ├── baseline_model.pkl      # RandomForest Regressor
│   │   ├── classifier_model.pkl    # RandomForest Classifier
│   │   └── ensemble_model.pkl      # Combined Ensemble
│   └── data/
│       ├── crop_storage_data.json      # 92 crop storage rules
│       ├── synthetic_spoilage_data.csv # 92K training samples
│       └── generate_synthetic_data.py  # Data generation script
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   └── components/
│   │       ├── Dashboard.tsx       # Route input & analysis
│   │       ├── LiveMonitor.tsx     # Telemetry charts
│   │       ├── IntelligencePanel.tsx # AI recommendations
│   │       └── ChatInterface.tsx   # Conversational AI
│   ├── package.json
│   └── vite.config.ts
│
├── train_model.py              # Ensemble model training script
└── README.md                   # This file
```

---

## 🔧 Troubleshooting

### Backend won't start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill the process using the port (replace PID)
taskkill /PID <PID> /F
```

### Models not loading
```powershell
# Verify models exist in backend/model/
dir backend\model\

# Should show:
# baseline_model.pkl
# classifier_model.pkl  
# ensemble_model.pkl
```

### API key errors
```powershell
# Verify .env file exists and has correct format
type backend\.env

# Should show:
# GEMINI_API_KEY=your_key
# OPENWEATHER_API_KEY=your_key
```

### Frontend build errors
```powershell
# Clear node_modules and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📈 API Response Example

```json
{
  "risk_analysis": {
    "spoilage_risk": 0.234,
    "days_remaining": 7.6,
    "status": "Safe",
    "classification": "Safe",
    "safe_probability": 0.876,
    "ensemble_confidence": 0.912,
    "ensemble_used": true
  },
  "route": {
    "distance_km": 148.5,
    "duration_hours": 3.2
  },
  "waypoint_predictions": [
    {
      "waypoint_num": 1,
      "temperature": 28.5,
      "humidity": 65,
      "instant_risk": 0.12,
      "cumulative_risk": 0.05,
      "classification": "Safe"
    }
  ],
  "route_risk_analysis": {
    "temp_variance": 8.5,
    "danger_zone_count": 2,
    "danger_hours": 1.5
  }
}
```

---

## 🏆 Hackathon Highlights

- ✅ **Real ML Model** - Not simulated, trained on 92K physics-based samples
- ✅ **Real Weather Data** - Live OpenWeatherMap integration
- ✅ **Real Routing** - OSRM calculates actual driving paths
- ✅ **Ensemble Approach** - Two models combined for higher confidence
- ✅ **Per-Waypoint Analysis** - Risk tracked at every checkpoint
- ✅ **Agentic AI** - Gemini 2.5 with RAG for crop-specific advice

---

## 📄 License

MIT License - Built for ML Mumbai GenAI Hackathon 2025

---

**Made with 🌾 for Indian Farmers**
