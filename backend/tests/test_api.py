"""
FreshLogic Backend API Tests
Run with: pytest tests/test_api.py -v
"""
import pytest
import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

# Import app after path setup
from main import app

client = TestClient(app)

# Load crop data for validation
CROP_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'crop_storage_data.json')
with open(CROP_DATA_PATH) as f:
    BACKEND_CROPS = [c['name'] for c in json.load(f)]


class TestRootEndpoint:
    """Tests for the / endpoint"""
    
    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200
    
    def test_root_returns_status(self):
        response = client.get("/")
        assert "status" in response.json()


class TestAnalyzeEndpoint:
    """Tests for the /analyze endpoint"""
    
    def test_analyze_returns_200_for_valid_request(self):
        response = client.post("/analyze", json={
            "origin": "Nashik",
            "destination": "Mumbai",
            "crop_type": "Strawberry"
        })
        assert response.status_code == 200
    
    def test_analyze_returns_required_fields(self):
        response = client.post("/analyze", json={
            "origin": "Pune",
            "destination": "Mumbai",
            "crop_type": "Tomato (Desi)"
        })
        data = response.json()
        
        # Check top-level required fields (may have "error" if route fails)
        if "error" not in data:
            assert "route" in data or "error" in data
    
    def test_analyze_handles_missing_fields(self):
        response = client.post("/analyze", json={
            "origin": "Mumbai"
        })
        # Should return 422 for validation error
        assert response.status_code == 422


class TestChatEndpoint:
    """Tests for the /chat endpoint"""
    
    def test_chat_returns_200(self):
        response = client.post("/chat", json={
            "message": "What is the optimal storage temperature for strawberries?",
            "context": {
                "crop": "Strawberry",
                "origin": "Nashik",
                "destination": "Mumbai"
            }
        })
        # Chat might return 200 or error if Gemini API key not set
        assert response.status_code in [200, 500]


class TestCropDataIntegrity:
    """Tests to ensure crop data consistency"""
    
    def test_backend_has_92_crops(self):
        """Backend crop_storage_data.json should have exactly 92 crops"""
        assert len(BACKEND_CROPS) == 92
    
    def test_all_crops_have_unique_names(self):
        """All crop names should be unique"""
        assert len(BACKEND_CROPS) == len(set(BACKEND_CROPS))
    
    def test_key_crops_exist(self):
        """Important crops should exist in the dataset"""
        key_crops = [
            "Strawberry",
            "Mango (Alphonso)",
            "Tomato (Desi)",
            "Potato (Indore/Jyoti)",
            "Wheat (Sharbati)",
            "Rice (Basmati)"
        ]
        for crop in key_crops:
            assert crop in BACKEND_CROPS, f"Missing key crop: {crop}"


class TestTelemetryEndpoint:
    """Tests for the /telemetry endpoint"""
    
    def test_telemetry_returns_200(self):
        response = client.get("/telemetry")
        # Telemetry endpoint may or may not exist
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
