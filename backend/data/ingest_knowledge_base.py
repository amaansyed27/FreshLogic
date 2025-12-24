
import json
import os
import pickle
import numpy as np
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Initialize Gemini Client
# Ensure GEMINI_API_KEY is set in your environment
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY environment variable not set.")
    exit(1)

client = genai.Client(api_key=api_key)

def get_embedding(text):
    """Generates embedding for a single text using Gemini."""
    try:
        response = client.models.embed_content(
            model="models/text-embedding-004",
            contents=text,
        )
        return response.embeddings[0].values
    except Exception as e:
        print(f"Error embedding text: {e}")
        return None

def ingest_golden_rules():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, "crop_storage_data.json")
    pkl_path = os.path.join(current_dir, "knowledge_base.pkl")
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        crop_data = json.load(f)

    documents = []
    metadatas = []
    ids = []
    embeddings = []

    print(f"Vectorizing {len(crop_data)} Golden Rules using Gemini (text-embedding-004)...")

    for i, crop in enumerate(crop_data):
        # Create a semantic text representation for the vector setup
        text_content = (
            f"Crop: {crop['name']}. "
            f"Category: {crop['category']}. "
            f"Optimal Temperature: {crop['temp_min']}°C to {crop['temp_max']}°C. "
            f"Optimal Humidity: {crop['humidity_min']}% to {crop['humidity_max']}%. "
            f"Storage Notes: {crop['notes']}"
        )
        
        print(f"[{i+1}/{len(crop_data)}] Embedding: {crop['name']}...")
        emb = get_embedding(text_content)
        
        if emb:
            documents.append(text_content)
            metadatas.append(crop)
            ids.append(f"rule_{crop['name'].replace(' ', '_').lower()}")
            embeddings.append(emb)

    # Convert embeddings to numpy array for efficient calculation
    embeddings_np = np.array(embeddings)

    # Save everything to a pickle file
    data_to_save = {
        "documents": documents,
        "metadatas": metadatas,
        "ids": ids,
        "embeddings": embeddings_np
    }

    with open(pkl_path, "wb") as f:
        pickle.dump(data_to_save, f)

    print(f"\n🎉 Knowledge Base Ingestion Complete!")
    print(f"Saved {len(documents)} vectors to {pkl_path}")

if __name__ == "__main__":
    ingest_golden_rules()
