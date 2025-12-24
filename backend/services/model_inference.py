import pickle
import os
import pandas as pd
import numpy as np

class ModelService:
    def __init__(self, model_path: str = "model/baseline_model.pkl"):
        self.model = None
        # Adjust path to be relative to the running backend process
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Up one level from services/ -> backend (or /app)
        self.model_path = os.path.join(base_dir, "model", "baseline_model.pkl") 
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, "rb") as f:
                self.model = pickle.load(f)
            print(f"✅ Model loaded from {self.model_path}")
        else:
            print(f"⚠️ Warning: Model file not found at {self.model_path}. Run train_model.py first.")

    def calculate_vpd(self, temp, humidity):
        """Calculate Vapor Pressure Deficit (kPa)"""
        es = 0.6108 * np.exp(17.27 * temp / (temp + 237.3))
        actual_vapor_pressure = es * (humidity / 100.0)
        return round(es - actual_vapor_pressure, 2)

    def predict_spoilage(self, temperature: float, humidity: float, transit_hours: float, crop_type: str):
        """
        Returns:
            dict: {
                "spoilage_risk": float (0.0 - 1.0),
                "days_remaining": float
            }
        """
        if not self.model:
            return {"error": "Model not loaded", "spoilage_risk": 0, "status": "Unknown"}
            
        # 1. Prepare Input Frame
        vpd = self.calculate_vpd(temperature, humidity)
        input_data = pd.DataFrame([{
            "temperature_c": temperature,
            "humidity_percent": humidity,
            "vpd_kpa": vpd,
            "transit_hours": transit_hours,
            "crop_type": crop_type
        }])
        
        # 2. Predict
        try:
            risk_score = self.model.predict(input_data)[0]
            # Clamp
            risk_score = min(max(risk_score, 0.0), 1.0)
            
            # Estimate Days Remaining (Inverse of risk, simplified physics)
            # If risk is 0.1 (10%), maybe 10 days left. If 0.9 (90%), maybe 0.5 days.
            # Base life - (Base Life * Risk)
            est_days = 10 * (1.0 - risk_score)
            
            status = "Critical" if risk_score > 0.7 else "Warning" if risk_score > 0.3 else "Safe"
            
            return {
                "spoilage_risk": round(risk_score, 3),
                "days_remaining": round(est_days, 1),
                "status": status,
                "calculated_vpd": vpd
            }
        except Exception as e:
            print(f"Inference Error: {e}")
            return {"error": str(e), "spoilage_risk": 0}

model_service = ModelService()
