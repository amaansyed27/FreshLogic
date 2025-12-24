from google import genai
from google.genai import types
import os
import json
import sys

# Hack to import from sibling directory if not in path (FastAPI usually handles this, but good for standalone testing)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.rag_service import rag_service

class FreshLogicAgent:
    def __init__(self):
        # Initialize Gemini Client
        self.client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self.model = "gemini-2.5-flash" 

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
        
        # Handle Telemetry Text (Legacy vs New)
        if "route_summary" in telemetry_data:
            summary_text = telemetry_data["route_summary"]
            avg_temp = telemetry_data.get("avg_temp", "N/A")
            telemetry_text = f"""
            - CROP BEING TRANSPORTED: {crop_name}
            - Route: {summary_text}
            - Avg Temperature: {avg_temp}°C
            - Avg Humidity: {telemetry_data.get('avg_humidity')}%
            - Duration: {telemetry_data.get('duration_hours')} hrs
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
        - ML Predicted Spoilage Risk: {spoilage_risk.get('spoilage_risk', 0) * 100:.1f}% ({spoilage_risk.get('status')})
        - Estimated Shelf Life Remaining: {spoilage_risk.get('days_remaining', 'N/A')} days
        
        USER QUERY: {user_query or "Provide a comprehensive analysis of this trip."}
        
        INSTRUCTIONS:
        1. You ARE analyzing {crop_name}. Do NOT ask "what crop" - you already know it's {crop_name}.
        2. CHECK the Internal Knowledge Base. Does the Avg Temp ({telemetry_data.get('avg_temp', 'N/A')}°C) violate the optimal temp rules for {crop_name}?
        3. IF yes, flag it immediately and cite the internal rule.
        4. Explain WHY the ML predicted {spoilage_risk.get('status')} based on the conditions.
        5. Provide 2-3 actionable recommendations specific to {crop_name}.
        6. Keep your response concise but informative (200-300 words max).
        """

        # 4. Call Gemini
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=context,
                config=types.GenerateContentConfig(
                    # tools=self.tools, # Disabling Search to fix INVALID_ARGUMENT error
                    temperature=0.3 
                )
            )
            return response.text
        except Exception as e:
            return f"Agent Error: {str(e)}"

agent_service = FreshLogicAgent()
