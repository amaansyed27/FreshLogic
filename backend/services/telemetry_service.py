import random
import time
import os
import httpx
import requests
from datetime import datetime

class TelemetryService:
    def __init__(self):
        self.owm_key = os.environ.get("OPENWEATHER_API_KEY")
        
    def get_coordinates(self, city_name: str):
        """Fetch Lat/Lon for a city using OpenStreetMap Nominatim."""
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={city_name}&format=json&limit=1"
            headers = {'User-Agent': 'FreshLogic_AI_Platform/1.0'}
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200 and len(response.json()) > 0:
                data = response.json()[0]
                return float(data["lat"]), float(data["lon"])
        except Exception as e:
            print(f"Geocoding Error: {e}")
        return None

    def get_route(self, start_city: str, end_city: str):
        """Fetch real route data from OSRM."""
        start_coords = self.get_coordinates(start_city)
        end_coords = self.get_coordinates(end_city)
        
        if not start_coords or not end_coords:
            return None
        
        # OSRM expects "lon,lat"
        start_str = f"{start_coords[1]},{start_coords[0]}"
        end_str = f"{end_coords[1]},{end_coords[0]}"
        
        try:
            url = f"http://router.project-osrm.org/route/v1/driving/{start_str};{end_str}?overview=false&steps=true"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "routes" in data and len(data["routes"]) > 0:
                    distance_km = data["routes"][0]["distance"] / 1000
                    duration_hrs = data["routes"][0]["duration"] / 3600
                    
                    # Extract roughly 10 waypoints for telemetry simulation
                    steps = data["routes"][0]["legs"][0]["steps"]
                    waypoints = []
                    for step in steps:
                        loc = step["maneuver"]["location"] # [lon, lat]
                        waypoints.append({"lat": loc[1], "lng": loc[0]})
                    
                    # Normalize to ~10 points if too many/few
                    if len(waypoints) > 10:
                        waypoints = waypoints[::len(waypoints)//10]
                        
                    return {
                        "start_coords": start_coords,
                        "end_coords": end_coords,
                        "distance_km": round(distance_km, 2),
                        "duration_hours": round(duration_hrs, 2),
                        "waypoints": waypoints
                    }
        except Exception as e:
            print(f"OSRM Error: {e}")
            
        return None

    def _get_live_weather(self, lat, lng):
        """Fetch real weather data if API key is present."""
        if not self.owm_key:
            return None
        
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&units=metric&appid={self.owm_key}"
            response = httpx.get(url, timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                return {
                    "temperature": data["main"]["temp"],
                    "humidity": data["main"]["humidity"],
                    "condition": data["weather"][0]["description"]
                }
        except Exception as e:
            print(f"Weather Fetch Error: {e}")
        return None
        
    def generate_trip_telemetry(self, route_data):
        """Generate telemetry for each waypoint."""
        telemetry_points = []
        real_weather_count = 0
        
        for point in route_data["waypoints"]:
            weather = self._get_live_weather(point["lat"], point["lng"])
            
            # Fallback if weather API fails (graceful degradation)
            if not weather:
                weather = {"temperature": 25, "humidity": 60, "condition": "Simulated (No API Key)"}
            else:
                real_weather_count += 1
                
            # No simulated "Internal Temp" offset anymore. 
            # We assume ambient temp = payload temp (non-reefer truck) or let the Agent handle reefer logic.
            # No fake "vibration" sensors.
            
            telemetry_points.append({
                "lat": point["lat"],
                "lng": point["lng"],
                "ambient_temp": weather["temperature"],
                "internal_temp": weather["temperature"], # Exact match to outside weather (Real)
                "humidity": weather["humidity"],
                "condition": weather["condition"]
            })
        
        # Log weather source for transparency
        total = len(route_data["waypoints"])
        if real_weather_count == total:
            print(f"🌤️ Weather: {real_weather_count}/{total} points from OpenWeatherMap (REAL)")
        elif real_weather_count > 0:
            print(f"⚠️ Weather: {real_weather_count}/{total} real, {total-real_weather_count} simulated")
        else:
            print(f"❌ Weather: All {total} points SIMULATED (set OPENWEATHER_API_KEY for real data)")
        
        return telemetry_points

telemetry_service = TelemetryService()

