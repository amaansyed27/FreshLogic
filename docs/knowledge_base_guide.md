# FreshLogic Knowledge Base Guide (Vector DB)

This guide explains how to populate the ChromaDB Vector Store for our RAG pipeline.

## 1. What goes into the Vector DB?
We use the Vector DB to store "Ground Truth" rules that the AI Agent can reference if the ML model is unsure, or to explain *why* a risk is high.

### A. Crop Storage Profiles (The "Golden Rules")
We must ingest FAO/USDA storage guidelines.
*   **Format**: "Crop: [Name] | Optimal Temp: [Range] | Optimal Humidity: [Range] | Chilling Injury Temp: [Value]"
*   **Why**: If the ML model predicts "High Risk", the Agent can query this to say: *"Tomato risk is high because current temp is 28°C which exceeds the optimal 15°C limit."*

### B. Dynamic Information
*   **Past Trip Logs**: "Route Nashik-Pune in May typically sees 35°C heat spikes."

## 2. Setup Script (`scripts/ingest_knowledge.py`)

```python
import chroamdb

# 1. Initialize Client
client = chromadb.PersistentClient(path="./freshlogic_vectordb")
collection = client.get_or_create_collection(name="agri_knowledge")

# 2. Add "Golden Rules" (Example Data)
documents = [
    # Tomato
    "Tomato (Mature Green): Store at 12.5-15°C. Humidity 90-95%. Chilling injury below 10°C. High sensitivity to ethylene.",
    "Tomato (Ripe): Store at 7-10°C. Humidity 90-95%. Life: 3-5 days.",
    
    # Wheat
    "Wheat grains: Store below 15% moisture. Temperature < 25°C to prevent weevils.",
    
    # Strawberry
    "Strawberry: Store at 0-2°C. Humidity 90-95%. Extremely high respiration rate. Life: 5-7 days.",
    
    # General Rules
    "Vapor Pressure Deficit (VPD): High VPD (>1.0 kPa) causes dehydration/wilting. Low VPD (<0.2 kPa) causes fungal rot."
]

ids = ["tomato_green", "tomato_ripe", "wheat_storage", "strawberry_storage", "vpd_rule"]

collection.add(documents=documents, ids=ids)
print("Ingestion Complete.")
```

## 3. Usage in App
When user asks: *"Why is the wheat spoiling?"*
1.  **Agent RAG Query**: "Wheat storage conditions"
2.  **Retrieve**: "Store below 15% moisture..."
3.  **Live Data Check**: "Current Moisture is 20% (High Humidity)."
4.  **Agent Answer**: "The high humidity (20%) exceeds the recommended 15% limit for wheat, leading to potential fungal growth."
