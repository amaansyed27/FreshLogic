"""
FreshLogic Crop Data Synchronization Tests
Run with: pytest tests/test_crop_sync.py -v

These tests verify that frontend and backend crop lists are synchronized.
"""
import pytest
import json
import os


# Paths
BACKEND_CROP_DATA = os.path.join(os.path.dirname(__file__), '..', 'data', 'crop_storage_data.json')
FRONTEND_CROPS_TS = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'constants', 'crops.ts')


def get_backend_crops():
    """Load crops from backend JSON"""
    with open(BACKEND_CROP_DATA) as f:
        return sorted(set(c['name'] for c in json.load(f)))


def get_frontend_crops():
    """Parse crops from frontend TypeScript file"""
    with open(FRONTEND_CROPS_TS, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract array contents between first [ and ].sort()
    start = content.find('export const CROP_LIST = [')
    if start == -1:
        return []
    
    start = content.find('[', start)
    end = content.find('].sort()', start)
    if end == -1:
        end = content.find('];', start)
    
    array_content = content[start+1:end]
    
    # Parse string values
    crops = []
    in_string = False
    current = ''
    
    for char in array_content:
        if char == '"' and not in_string:
            in_string = True
            current = ''
        elif char == '"' and in_string:
            in_string = False
            if current.strip():
                crops.append(current)
        elif in_string:
            current += char
    
    return sorted(set(crops))


class TestCropSynchronization:
    """Tests to ensure frontend and backend crops are synchronized"""
    
    @pytest.fixture
    def backend_crops(self):
        return get_backend_crops()
    
    @pytest.fixture
    def frontend_crops(self):
        return get_frontend_crops()
    
    def test_backend_has_92_crops(self, backend_crops):
        """Backend should have exactly 92 crops"""
        assert len(backend_crops) == 92, f"Backend has {len(backend_crops)} crops, expected 92"
    
    def test_frontend_has_92_crops(self, frontend_crops):
        """Frontend should have exactly 92 crops"""
        assert len(frontend_crops) == 92, f"Frontend has {len(frontend_crops)} crops, expected 92"
    
    def test_frontend_contains_all_backend_crops(self, backend_crops, frontend_crops):
        """Every backend crop should be in frontend"""
        missing = set(backend_crops) - set(frontend_crops)
        assert not missing, f"Frontend missing crops: {missing}"
    
    def test_backend_contains_all_frontend_crops(self, backend_crops, frontend_crops):
        """Every frontend crop should be in backend"""
        extra = set(frontend_crops) - set(backend_crops)
        assert not extra, f"Frontend has extra crops not in backend: {extra}"
    
    def test_crops_are_identical(self, backend_crops, frontend_crops):
        """Frontend and backend crop lists should be identical"""
        assert backend_crops == frontend_crops


class TestCropDataQuality:
    """Tests for crop data quality"""
    
    def test_all_crops_have_storage_data(self):
        """Every crop should have temp/humidity ranges"""
        with open(BACKEND_CROP_DATA) as f:
            crops = json.load(f)
        
        for crop in crops:
            assert 'temp_min' in crop, f"{crop['name']} missing temp_min"
            assert 'temp_max' in crop, f"{crop['name']} missing temp_max"
            assert 'humidity_min' in crop, f"{crop['name']} missing humidity_min"
            assert 'humidity_max' in crop, f"{crop['name']} missing humidity_max"
    
    def test_temp_ranges_are_valid(self):
        """Temperature min should be less than max"""
        with open(BACKEND_CROP_DATA) as f:
            crops = json.load(f)
        
        for crop in crops:
            assert crop['temp_min'] <= crop['temp_max'], \
                f"{crop['name']}: temp_min ({crop['temp_min']}) > temp_max ({crop['temp_max']})"
    
    def test_humidity_ranges_are_valid(self):
        """Humidity min should be less than max and within 0-100"""
        with open(BACKEND_CROP_DATA) as f:
            crops = json.load(f)
        
        for crop in crops:
            assert crop['humidity_min'] <= crop['humidity_max'], \
                f"{crop['name']}: humidity_min ({crop['humidity_min']}) > humidity_max ({crop['humidity_max']})"
            assert 0 <= crop['humidity_min'] <= 100, f"{crop['name']}: invalid humidity_min"
            assert 0 <= crop['humidity_max'] <= 100, f"{crop['name']}: invalid humidity_max"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
