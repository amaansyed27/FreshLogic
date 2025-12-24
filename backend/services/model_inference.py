import pickle
import os
import pandas as pd
import numpy as np

class ModelService:
    def __init__(self, model_path: str = "model/baseline_model.pkl"):
        self.regressor = None
        self.classifier = None
        self.ensemble_loaded = False
        
        # Path: services/ -> backend/ -> model/
        services_dir = os.path.dirname(os.path.abspath(__file__))  # services/
        backend_dir = os.path.dirname(services_dir)  # backend/
        
        self.regressor_path = os.path.join(backend_dir, "model", "baseline_model.pkl")
        self.classifier_path = os.path.join(backend_dir, "model", "classifier_model.pkl")
        self.ensemble_path = os.path.join(backend_dir, "model", "ensemble_model.pkl")
        self.load_models()

    def load_models(self):
        """Load ensemble model (preferred) or individual models as fallback."""
        # Try loading ensemble first
        if os.path.exists(self.ensemble_path):
            try:
                with open(self.ensemble_path, "rb") as f:
                    ensemble = pickle.load(f)
                self.regressor = ensemble["regressor"]
                self.classifier = ensemble["classifier"]
                self.ensemble_loaded = True
                print(f"✅ Ensemble model loaded (v{ensemble.get('version', '?')})")
                print(f"   • Regressor: MAE={ensemble['metrics']['regressor']['mae']:.4f}")
                print(f"   • Classifier: F1={ensemble['metrics']['classifier']['f1']:.4f}")
                return
            except Exception as e:
                print(f"⚠️ Failed to load ensemble: {e}")
        
        # Fallback: Load individual models
        if os.path.exists(self.regressor_path):
            with open(self.regressor_path, "rb") as f:
                self.regressor = pickle.load(f)
            print(f"✅ Regressor loaded from {self.regressor_path}")
        else:
            print(f"⚠️ Warning: Regressor not found at {self.regressor_path}")
        
        if os.path.exists(self.classifier_path):
            with open(self.classifier_path, "rb") as f:
                self.classifier = pickle.load(f)
            print(f"✅ Classifier loaded from {self.classifier_path}")
        else:
            print(f"⚠️ Classifier not found - using regressor only")

    def calculate_vpd(self, temp, humidity):
        """Calculate Vapor Pressure Deficit (kPa)"""
        es = 0.6108 * np.exp(17.27 * temp / (temp + 237.3))
        actual_vapor_pressure = es * (humidity / 100.0)
        return round(es - actual_vapor_pressure, 2)

    def predict_spoilage(self, temperature: float, humidity: float, transit_hours: float, crop_type: str):
        """
        ENSEMBLE PREDICTION: Combines regressor + classifier for higher confidence.
        
        Returns:
            dict: {
                "spoilage_risk": float (0.0 - 1.0) - from regressor
                "classification": str ("Safe" / "Spoiled") - from classifier
                "confidence": float - how much both models agree
                "days_remaining": float
            }
        """
        if not self.regressor:
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
        
        try:
            # === REGRESSOR PREDICTION ===
            risk_score = self.regressor.predict(input_data)[0]
            risk_score = min(max(risk_score, 0.0), 1.0)
            
            # === CLASSIFIER PREDICTION (if available) ===
            classification = None
            safe_probability = None
            confidence = 0.0
            
            if self.classifier:
                cls_pred = self.classifier.predict(input_data)[0]
                cls_proba = self.classifier.predict_proba(input_data)[0]
                
                # cls_proba[0] = P(Spoiled), cls_proba[1] = P(Safe)
                safe_probability = cls_proba[1] if len(cls_proba) > 1 else cls_proba[0]
                classification = "Safe" if cls_pred == 1 else "Spoiled"
                
                # Calculate ensemble confidence (how much both models agree)
                # If regressor says low risk AND classifier says Safe with high prob → high confidence
                # If they disagree → lower confidence
                regressor_says_safe = risk_score < 0.3
                classifier_says_safe = cls_pred == 1
                
                if regressor_says_safe == classifier_says_safe:
                    # Models agree - high confidence
                    confidence = 0.7 + (0.3 * safe_probability if classifier_says_safe else 0.3 * (1 - safe_probability))
                else:
                    # Models disagree - medium confidence, favor more pessimistic
                    confidence = 0.4 + (0.1 * abs(risk_score - 0.5))
                
                # Adjust risk score slightly based on classifier if they disagree
                if classification == "Spoiled" and risk_score < 0.4:
                    risk_score = (risk_score + 0.4) / 2  # Bump up risk
                elif classification == "Safe" and risk_score > 0.6:
                    risk_score = (risk_score + 0.5) / 2  # Lower risk slightly
            
            # Estimate Days Remaining
            est_days = 10 * (1.0 - risk_score)
            
            # Final Status (combines both models)
            if risk_score > 0.7 or classification == "Spoiled":
                status = "Critical"
            elif risk_score > 0.3:
                status = "Warning"
            else:
                status = "Safe"
            
            result = {
                "spoilage_risk": round(risk_score, 3),
                "days_remaining": round(est_days, 1),
                "status": status,
                "calculated_vpd": vpd,
                "ensemble_used": self.classifier is not None
            }
            
            # Add classifier details if available
            if self.classifier:
                result["classification"] = classification
                result["safe_probability"] = round(safe_probability, 3)
                result["ensemble_confidence"] = round(confidence, 3)
            
            return result
            
        except Exception as e:
            print(f"Inference Error: {e}")
            return {"error": str(e), "spoilage_risk": 0}

    def predict_per_waypoint(self, telemetry_points: list, crop_type: str, total_transit_hours: float):
        """
        ENSEMBLE per-waypoint prediction.
        Predicts spoilage risk at EACH waypoint using both models.
        
        Returns:
            list: Per-waypoint predictions with cumulative risk and classification
        """
        if not self.regressor:
            return []
        
        predictions = []
        cumulative_exposure_risk = 0.0
        danger_count = 0
        
        for i, point in enumerate(telemetry_points):
            temp = point["internal_temp"]
            humidity = point["humidity"]
            exposure_hrs = point.get("exposure_hours", 0)
            cumulative_hrs = point.get("cumulative_hours", 0)
            
            vpd = self.calculate_vpd(temp, humidity)
            
            input_data = pd.DataFrame([{
                "temperature_c": temp,
                "humidity_percent": humidity,
                "vpd_kpa": vpd,
                "transit_hours": max(cumulative_hrs, 1),
                "crop_type": crop_type
            }])
            
            try:
                # Regressor prediction
                instant_risk = self.regressor.predict(input_data)[0]
                instant_risk = min(max(instant_risk, 0.0), 1.0)
                
                # Classifier prediction (if available)
                classification = None
                safe_prob = None
                if self.classifier:
                    cls_pred = self.classifier.predict(input_data)[0]
                    cls_proba = self.classifier.predict_proba(input_data)[0]
                    safe_prob = cls_proba[1] if len(cls_proba) > 1 else cls_proba[0]
                    classification = "Safe" if cls_pred == 1 else "Spoiled"
                    
                    # Adjust risk if classifier strongly disagrees
                    if classification == "Spoiled" and instant_risk < 0.4:
                        instant_risk = (instant_risk + 0.5) / 2
                    
            except Exception as e:
                print(f"Waypoint {i} prediction error: {e}")
                instant_risk = 0.0
                classification = None
                safe_prob = None
            
            # Calculate weighted contribution to cumulative risk
            if exposure_hrs > 0:
                weight = exposure_hrs / total_transit_hours if total_transit_hours > 0 else 0
                cumulative_exposure_risk += instant_risk * weight
            
            # Status determination (uses ensemble)
            if instant_risk > 0.7 or classification == "Spoiled":
                status = "Critical"
                danger_count += 1
            elif instant_risk > 0.3:
                status = "Warning"
            else:
                status = "Safe"
            
            waypoint_data = {
                "waypoint_num": point.get("waypoint_num", i + 1),
                "lat": point["lat"],
                "lng": point["lng"],
                "temperature": temp,
                "humidity": humidity,
                "vpd": vpd,
                "condition": point.get("condition", "Unknown"),
                "cumulative_km": point.get("cumulative_km", 0),
                "cumulative_hours": cumulative_hrs,
                "exposure_hours": exposure_hrs,
                "instant_risk": round(instant_risk, 3),
                "instant_status": status,
                "cumulative_risk": round(min(cumulative_exposure_risk, 1.0), 3)
            }
            
            # Add classifier info if available
            if self.classifier:
                waypoint_data["classification"] = classification
                waypoint_data["safe_probability"] = round(safe_prob, 3) if safe_prob else None
            
            predictions.append(waypoint_data)
        
        return predictions

    def analyze_route_risks(self, waypoint_predictions: list):
        """
        Analyze the route to find dangerous segments and temperature spikes.
        """
        if not waypoint_predictions:
            return {}
        
        temps = [p["temperature"] for p in waypoint_predictions]
        risks = [p["instant_risk"] for p in waypoint_predictions]
        
        # Find temperature extremes
        min_temp = min(temps)
        max_temp = max(temps)
        temp_variance = max_temp - min_temp
        
        # Find highest risk segment
        max_risk_idx = risks.index(max(risks))
        highest_risk_point = waypoint_predictions[max_risk_idx]
        
        # Find danger zones (risk > 0.5)
        danger_zones = [p for p in waypoint_predictions if p["instant_risk"] > 0.5]
        
        # Calculate time spent in danger
        danger_hours = sum(p["exposure_hours"] for p in danger_zones)
        
        return {
            "temp_min": round(min_temp, 1),
            "temp_max": round(max_temp, 1),
            "temp_variance": round(temp_variance, 1),
            "highest_risk_waypoint": highest_risk_point["waypoint_num"],
            "highest_risk_value": round(max(risks), 3),
            "highest_risk_temp": highest_risk_point["temperature"],
            "danger_zone_count": len(danger_zones),
            "danger_hours": round(danger_hours, 2),
            "route_risk_profile": "High Variance" if temp_variance > 10 else "Moderate" if temp_variance > 5 else "Stable"
        }

model_service = ModelService()
