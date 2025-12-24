from google import genai
from google.genai import types
import os
import json
import sys
import time

# Hack to import from sibling directory if not in path (FastAPI usually handles this, but good for standalone testing)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.rag_service import rag_service

class FreshLogicAgent:
    def __init__(self):
        # Initialize Gemini Client
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        # Model fallback hierarchy (best to most lenient rate limits)
        self.model_hierarchy = [
            "gemini-3-flash",        # Primary - newest, best quality
            "gemini-2.5-flash",      # Fallback 1 - still great
            "gemini-2.5-flash-lite", # Fallback 2 - faster, cheaper
            "gemma-3-27b-it",        # Fallback 3 - open model, generous limits
        ]
        self.current_model_index = 0
        self.model = self.model_hierarchy[0]
        self.max_retries = 2  # Retries per model before switching
        self.retry_delay = 1.0  # seconds between retries

        # Define Tools
        self.tools = [
            types.Tool(
                google_search_retrieval=types.GoogleSearchRetrieval(
                    dynamic_retrieval_config=types.DynamicRetrievalConfig(
                        mode=types.DynamicRetrievalConfigMode.MODE_DYNAMIC,
                        dynamic_threshold=0.7,
                    )
                )
            )
        ]

    def analyze_situation(self, telemetry_data: dict, spoilage_risk: dict, user_query: str = None) -> str:
        """
        Analyzes the telemetry + risk data and generates an actionable insight.
        """
        
        # 1. Identify Context for RAG
        # Get crop name from context_data (passed from main.py)
        crop_name = "General Perishables"
        
        # Primary: Check metadata.crop (set by main.py)
        if "metadata" in telemetry_data and "crop" in telemetry_data["metadata"]:
            crop_name = telemetry_data["metadata"]["crop"]
        # Fallback: Check top-level crop_type
        elif "crop_type" in telemetry_data:
            crop_name = telemetry_data["crop_type"]
        
        # Log for debugging
        print(f"🌾 Agent: Processing crop = '{crop_name}'")

        # 2. Retrieve Knowledge (RAG)
        # Search Knowledge Base for "Optimal storage for [Crop]"
        print(f"🧠 Agent: Querying Knowledge Base for '{crop_name}'...")
        rag_results = rag_service.query_knowledge_base(f"Optimal conditions storage transport {crop_name}", n_results=3)
        
        rag_text = "No internal knowledge found."
        if rag_results:
            rag_text = ""
            for res in rag_results:
                rag_text += f"- {res['document']} (Confidence: {res['score']:.2f})\n"

        # 3. Construct Prompt with RAG Context
        
        # Handle Telemetry Text with comprehensive route analysis
        if "route_summary" in telemetry_data:
            summary_text = telemetry_data["route_summary"]
            avg_temp = telemetry_data.get("avg_temp", "N/A")
            temp_min = telemetry_data.get("temp_min", avg_temp)
            temp_max = telemetry_data.get("temp_max", avg_temp)
            temp_variance = telemetry_data.get("temp_variance", 0)
            danger_zones = telemetry_data.get("danger_zones", 0)
            danger_hours = telemetry_data.get("danger_hours", 0)
            
            telemetry_text = f"""
            - CROP BEING TRANSPORTED: {crop_name}
            - Route: {summary_text}
            - Distance: {telemetry_data.get('distance_km')} km
            - Transit Duration: {telemetry_data.get('duration_hours')} hours
            
            TEMPERATURE ANALYSIS ALONG ROUTE:
            - Average Temperature: {avg_temp}°C
            - Temperature Range: {temp_min}°C to {temp_max}°C (Variance: {temp_variance}°C)
            - Average Humidity: {telemetry_data.get('avg_humidity')}%
            
            RISK ZONES DETECTED:
            - Number of high-risk checkpoints: {danger_zones}
            - Time in danger zones: {danger_hours} hours
            - Highest risk at waypoint {telemetry_data.get('highest_risk_waypoint', 'N/A')} ({telemetry_data.get('highest_risk_temp', 'N/A')}°C)
            """
        else:
            telemetry_text = f"""
            - CROP BEING TRANSPORTED: {crop_name}
            - Truck ID: {telemetry_data.get('truck_id', 'Unknown')}
            - Current Temp: {telemetry_data.get('sensor_data', {}).get('temperature')}°C
            """

        context = f"""
        You are 'FreshLogic', an AI Chief Agronomist specializing in {crop_name} transport.
        
        SOURCE OF TRUTH (Internal Knowledge Base for {crop_name}):
        {rag_text}
        
        CURRENT TRIP REPORT:
        {telemetry_text}
        
        ML MODEL PREDICTION:
        - Overall Spoilage Risk: {spoilage_risk.get('spoilage_risk', 0) * 100:.1f}% ({spoilage_risk.get('status')})
        - Estimated Shelf Life After Delivery: {spoilage_risk.get('days_remaining', 'N/A')} days
        
        USER QUERY: {user_query or "Provide a comprehensive analysis of this trip."}
        
        INSTRUCTIONS:
        1. You ARE analyzing {crop_name}. Do NOT ask "what crop" - you already know it's {crop_name}.
        2. ANALYZE the temperature variance along the route. High variance (>10°C) is especially dangerous.
        3. CHECK the Internal Knowledge Base. Does ANY temperature along the route violate optimal rules for {crop_name}?
        4. HIGHLIGHT danger zones - where on the route is the crop at highest risk?
        5. Explain WHY the ML predicted {spoilage_risk.get('status')} based on the specific conditions.
        6. Provide 2-3 actionable recommendations (e.g., reefer truck, night transport, alternate route).
        7. Keep response CONCISE - max 150 words. Use bullet points. No fluff.
        8. Format with markdown: Use **bold** for key terms, bullet lists for recommendations.
        """

        # 4. Call Gemini with automatic model fallback
        while self.current_model_index < len(self.model_hierarchy):
            current_model = self.model_hierarchy[self.current_model_index]
            
            for attempt in range(self.max_retries):
                try:
                    print(f"🤖 Trying model: {current_model} (attempt {attempt + 1}/{self.max_retries})")
                    response = self.client.models.generate_content(
                        model=current_model,
                        contents=context,
                        config=types.GenerateContentConfig(
                            temperature=0.3 
                        )
                    )
                    # Success! Update current model for future calls
                    self.model = current_model
                    return response.text
                except Exception as e:
                    error_str = str(e)
                    if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                        if attempt < self.max_retries - 1:
                            wait_time = self.retry_delay * (2 ** attempt)
                            print(f"⚠️ Rate limited on {current_model}. Retrying in {wait_time}s...")
                            time.sleep(wait_time)
                            continue
                        else:
                            # Move to next model
                            print(f"❌ {current_model} exhausted. Switching to next model...")
                            break
                    else:
                        # Non-rate-limit error, try next model
                        print(f"⚠️ Error with {current_model}: {error_str[:100]}")
                        break
            
            # Move to next model in hierarchy
            self.current_model_index += 1
            if self.current_model_index < len(self.model_hierarchy):
                print(f"🔄 Falling back to: {self.model_hierarchy[self.current_model_index]}")
        
        # Reset for next request (allow retry from top next time)
        self.current_model_index = 0
        return "⚠️ All models exhausted. Please wait a minute and try again. (Rate limits will reset shortly)"

agent_service = FreshLogicAgent()
