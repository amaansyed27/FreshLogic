from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import numpy as np
import uuid
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="FreshLogic API", version="2.0.0")

# CORS Setup - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.telemetry_service_v2 import telemetry_service
from services.model_inference import model_service
from services.session_cache import session_cache
from services.translation_service import translate_text, translate_report, get_supported_languages
from agents.gemini_agent import agent_service
from pydantic import BaseModel
from typing import Optional

class AnalysisRequest(BaseModel):
    origin: str
    destination: str
    crop_type: str
    user_query: str = None
    session_id: str = None  # Optional session ID for caching
    language: str = "en"  # Language for response (default: English)

class ChatRequest(BaseModel):
    session_id: str
    message: str
    context: Optional[dict] = None  # Fallback if cache miss
    language: str = "en"  # Language for response

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "hi"

@app.get("/")
def read_root():
    return {"status": "FreshLogic Backend Online", "version": "2.0.0", "endpoints": ["/analyze", "/chat", "/translate", "/languages", "/health"]}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0", "cache_active": True}

@app.get("/languages")
def list_languages():
    """Get list of supported languages for Indian farmers"""
    return {
        "languages": get_supported_languages(),
        "default": "en",
        "recommended_for_farmers": ["hi", "ta", "te", "kn", "mr"]
    }

@app.post("/translate")
async def translate_endpoint(request: TranslateRequest):
    """Translate text to target language"""
    translated = await translate_text(request.text, request.target_language)
    return {
        "original": request.text,
        "translated": translated,
        "language": request.target_language
    }

@app.post("/chat")
async def quick_chat(request: ChatRequest):
    """
    FAST chat endpoint - uses cached context, no re-analysis.
    Response time: 1-3 seconds (vs 5-15 seconds for /analyze)
    """
    # Try to get cached context
    cached = session_cache.get(request.session_id)
    
    if not cached and not request.context:
        return {
            "error": "Session expired or not found. Please run analysis again.",
            "session_expired": True
        }
    
    # Use cached data or fallback context
    context = cached if cached else request.context
    
    # Quick chat - only calls Gemini, no external APIs
    response = agent_service.quick_chat(
        message=request.message,
        context=context
    )
    
    # Translate if needed (non-English language requested)
    translated = False
    if request.language and request.language != 'en':
        try:
            response = await translate_text(response, request.language)
            translated = True
        except Exception as e:
            print(f"Translation failed: {e}")
            # Return original response if translation fails
    
    return {
        "response": response,
        "session_id": request.session_id,
        "cached": cached is not None,
        "translated": translated,
        "language": request.language
    }

@app.post("/analyze")
def analyze_telemetry(request: AnalysisRequest):
    try:
        # Generate or use provided session ID
        session_id = request.session_id or str(uuid.uuid4())
        
        # 1. Get Real Route & Telemetry
        route_data = telemetry_service.get_route(request.origin, request.destination)
        
        if not route_data:
            return {"error": f"Could not find route from {request.origin} to {request.destination}"}
            
        trip_telemetry = telemetry_service.generate_trip_telemetry(route_data)
        
        # 2. Aggregate Data for Model (Avg Temp/Humidity along the route)
        temps = [p["internal_temp"] for p in trip_telemetry]
        humidities = [p["humidity"] for p in trip_telemetry]
        
        avg_temp = float(np.mean(temps))
        avg_humidity = float(np.mean(humidities))
        duration_hours = route_data["duration_hours"]
        
        # 3. Run Overall Inference (average-based)
        risk_analysis = model_service.predict_spoilage(
            temperature=avg_temp,
            humidity=avg_humidity,
            transit_hours=duration_hours,
            crop_type=request.crop_type
        )
        
        # 4. NEW: Per-Waypoint Risk Analysis (comprehensive)
        waypoint_predictions = model_service.predict_per_waypoint(
            telemetry_points=trip_telemetry,
            crop_type=request.crop_type,
            total_transit_hours=duration_hours
        )
        
        # 5. NEW: Route Risk Analysis (find danger zones)
        route_risk_analysis = model_service.analyze_route_risks(waypoint_predictions)

        # 6. Agent Reasoning with enhanced context
        context_data = {
            "metadata": {
                "crop": request.crop_type
            },
            "origin": request.origin,
            "destination": request.destination,
            "crop_type": request.crop_type,
            "distance_km": route_data["distance_km"],
            "duration_hours": duration_hours,
            "avg_temp": round(avg_temp, 2),
            "avg_humidity": round(avg_humidity, 2),
            "temp_min": route_risk_analysis.get("temp_min", avg_temp),
            "temp_max": route_risk_analysis.get("temp_max", avg_temp),
            "temp_variance": route_risk_analysis.get("temp_variance", 0),
            "danger_zones": route_risk_analysis.get("danger_zone_count", 0),
            "danger_hours": route_risk_analysis.get("danger_hours", 0),
            "highest_risk_waypoint": route_risk_analysis.get("highest_risk_waypoint", 1),
            "highest_risk_temp": route_risk_analysis.get("highest_risk_temp", avg_temp),
            "waypoints_sampled": len(trip_telemetry),
            "route_summary": f"Transporting {request.crop_type} from {request.origin} to {request.destination} ({route_data['distance_km']} km)"
        }
        
        agent_response = agent_service.analyze_situation(
            telemetry_data=context_data,
            spoilage_risk=risk_analysis,
            user_query=request.user_query
        )

        # Cache context for fast follow-up chat queries
        cache_context = {
            **context_data,
            "risk_analysis": risk_analysis
        }
        session_cache.set(session_id, cache_context)

        return {
            "session_id": session_id,  # Return session ID for chat
            "route": route_data,
            "telemetry_points": trip_telemetry,
            "waypoint_predictions": waypoint_predictions,  # NEW: Per-waypoint risk data
            "route_risk_analysis": route_risk_analysis,    # NEW: Danger zone analysis
            "risk_analysis": risk_analysis,
            "agent_insight": agent_response,
            "spoilage_risk": {
                "probability": risk_analysis.get("spoilage_risk", 0),
                "status": risk_analysis.get("status", "Unknown"),
                "days_remaining": risk_analysis.get("days_remaining", 0)
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "trace": traceback.format_exc()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
