# FreshLogic - AI Supply Chain Command Center 🚛🧠

FreshLogic is an advanced **Agentic AI platform** that acts as a "Race Engineer" for agricultural logistics. It combines **Real-time Telemetry**, **Physics-Based ML**, and **Generative AI** to predict and prevent food spoilage during transit.

## 🌟 Key Capabilities (Live & Implemented)

### 1. 🧠 Evaluative Agent (Gemini 2.5 + RAG)
*   **Engine**: Powered by Google's **Gemini 2.5 Flash**.
*   **RAG System**: Retrieves context from a local Knowledge Base of **92 Crops** (Golden Rules for storage).
*   **Role**: Analyzes telemetry + risk data to generate "Race Strat" advice (e.g., "Reroute to Pune due to heatwave").

### 2. 🔮 Physics-aware ML Model
*   **Engine**: **Random Forest Regressor** (`baseline_model.pkl`).
*   **Training**: Trained on **92,000+ points** of synthetic data generated using the **Arrhenius Equation** (Q10 Spoilage Physics).
*   **Function**: Predicts "Spoilage Risk %" based on Crop Type, Temperature, Humidity, and Transit Duration.

### 3. 🌍 Real-World Dynamic Telemetry
*   **Routing**: Uses **OSRM (Open Source Routing Machine)** to calculate real driving paths between cities.
*   **Geocoding**: Uses **Nominatim (OpenStreetMap)** to turn city names into Lat/Lon coordinates.
*   **Weather**: Uses **OpenWeatherMap** to fetch live ambient conditions along the route.

### 4. 🖥️ Command Center Interface
*   **New Design**: 3-Panel Workspace (Monitor, Chat, History).
*   **Dual Input**: Supports both Manual Dropdowns and **NLP Queries** (e.g., *"Analyze strawberry shipment from Nashik to Mumbai"*).

---

## 🛠️ Installation & Start Guide (Manual Setup)

Since we are running this locally for maximum control:

### 1. Prerequisites
*   **Python 3.9+**
*   **Node.js 18+**
*   **API Keys**: You need a `.env` file in `backend/` with:
    ```env
    GEMINI_API_KEY=your_key_here
    OPENWEATHER_API_KEY=your_key_here
    ```

### 2. Backend Setup (Terminal 1)
```bash
cd backend

# 1. Create & Activate Virtual Environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux

# 2. Install Dependencies
pip install -r requirements.txt

# 3. (Optional) Retrain Model & RAG
# The repo comes with pre-trained models, but to refresh:
# python data/train_model.py
# python data/ingest_knowledge_base.py

# 4. Start the API Server
python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000                                                                                                     
```

### 3. Frontend Setup (Terminal 2)
```bash
cd frontend

# 1. Install Dependencies
npm install

# 2. Start the Development Server
npm run dev
```

### 4. Access the App
*   **Dashboard**: Open [http://localhost:5173](http://localhost:5173) in your browser.
*   **API Docs**: View [http://localhost:8000/docs](http://localhost:8000/docs) for the backend Swagger UI.

---

## 📂 Project Structure

*   **`backend/agents`**: The Agentic Brain (Gemini + RAG integration).
*   **`backend/services`**:
    *   `telemetry_service.py`: Real-world OSRM routing & OpenWeatherMap integration.
    *   `rag_service.py`: Lightweight Vector Search (Numpy/Pickle).
    *   `model_inference.py`: ML Model loading & prediction.
*   **`backend/data`**:
    *   `crop_storage_data.json`: The "Golden Rules" database (92 crops).
    *   `synthetic_spoilage_data.csv`: The physics-generated training set.
*   **`frontend/src/components`**: React components (WorkspaceLayout, CommandBar, Dashboard).
