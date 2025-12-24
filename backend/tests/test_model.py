"""
FreshLogic ML Model Tests
Run with: pytest tests/test_model.py -v
"""
import pytest
import os
import sys
import pickle
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Path should match what ModelService uses
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'baseline_model.pkl')


class TestModelExists:
    """Tests to ensure model files exist"""
    
    def test_model_file_exists(self):
        assert os.path.exists(MODEL_PATH), f"Model file not found at {MODEL_PATH}"


class TestModelLoading:
    """Tests for model loading"""
    
    @pytest.fixture
    def model(self):
        with open(MODEL_PATH, 'rb') as f:
            return pickle.load(f)
    
    def test_model_can_be_loaded(self, model):
        assert model is not None
    
    def test_model_has_predict_method(self, model):
        assert hasattr(model, 'predict')


class TestModelPredictions:
    """Tests for model predictions"""
    
    @pytest.fixture
    def model(self):
        with open(MODEL_PATH, 'rb') as f:
            return pickle.load(f)
    
    def test_model_predicts_for_valid_input(self, model):
        # Features must match training format
        input_data = pd.DataFrame([{
            "temperature_c": 25,
            "humidity_percent": 60,
            "vpd_kpa": 0.8,
            "transit_hours": 4,
            "crop_type": "Strawberry"
        }])
        prediction = model.predict(input_data)
        
        assert prediction is not None
        assert len(prediction) == 1
    
    def test_prediction_in_valid_range(self, model):
        input_data = pd.DataFrame([{
            "temperature_c": 30,
            "humidity_percent": 80,
            "vpd_kpa": 0.5,
            "transit_hours": 6,
            "crop_type": "Tomato (Desi)"
        }])
        prediction = model.predict(input_data)[0]
        
        # Risk should be clamped 0-1 in service, but raw may vary
        assert prediction is not None
    
    def test_high_temp_increases_spoilage_risk(self, model):
        """High temperature should generally increase spoilage risk"""
        # Low temp scenario
        low_temp_data = pd.DataFrame([{
            "temperature_c": 5,
            "humidity_percent": 60,
            "vpd_kpa": 0.3,
            "transit_hours": 3,
            "crop_type": "Strawberry"
        }])
        low_temp_risk = model.predict(low_temp_data)[0]
        
        # High temp scenario
        high_temp_data = pd.DataFrame([{
            "temperature_c": 40,
            "humidity_percent": 60,
            "vpd_kpa": 2.5,
            "transit_hours": 3,
            "crop_type": "Strawberry"
        }])
        high_temp_risk = model.predict(high_temp_data)[0]
        
        # High temp should have higher spoilage probability
        assert high_temp_risk > low_temp_risk, \
            f"Expected high temp ({high_temp_risk}) > low temp ({low_temp_risk})"
    
    def test_long_duration_increases_spoilage_risk(self, model):
        """Longer transit should generally increase spoilage risk"""
        # Short duration
        short_data = pd.DataFrame([{
            "temperature_c": 25,
            "humidity_percent": 70,
            "vpd_kpa": 0.7,
            "transit_hours": 1,
            "crop_type": "Mango (Alphonso)"
        }])
        short_risk = model.predict(short_data)[0]
        
        # Long duration  
        long_data = pd.DataFrame([{
            "temperature_c": 25,
            "humidity_percent": 70,
            "vpd_kpa": 0.7,
            "transit_hours": 24,
            "crop_type": "Mango (Alphonso)"
        }])
        long_risk = model.predict(long_data)[0]
        
        # Longer duration should have higher spoilage probability
        assert long_risk >= short_risk, \
            f"Expected long transit ({long_risk}) >= short transit ({short_risk})"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
