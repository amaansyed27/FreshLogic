"""
FreshLogic Telemetry Service v2.0
Uses ONLY Google Cloud APIs - No OpenWeatherMap dependency
- Weather API for temperature, humidity, forecasts (PRIMARY)
- Routes API for traffic-aware routing
- Air Quality API for environmental conditions
- Pollen API for crop sensitivity
- Solar API for heat exposure
- Places API for facilities
"""

import os
import math
import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Optional, Tuple

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")


class GoogleTelemetryService:
    """
    Comprehensive telemetry service using Google Cloud APIs
    Replaces OpenWeatherMap with Air Quality + Pollen + Solar data
    """
    
    def __init__(self):
        self.api_key = GOOGLE_API_KEY
        self.timeout = 15.0
        self._cache = {}
    
    # ==================== GEOCODING ====================
    
    async def geocode(self, address: str) -> Optional[Dict]:
        """Convert address to coordinates using Google Geocoding API"""
        cache_key = f"geo:{address.lower()}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        if not self.api_key:
            # Fallback to Nominatim if no Google API key
            return await self._geocode_nominatim(address)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={"address": address, "key": self.api_key}
                )
                data = resp.json()
                
                if data.get("status") == "OK" and data.get("results"):
                    result = {
                        "lat": data["results"][0]["geometry"]["location"]["lat"],
                        "lon": data["results"][0]["geometry"]["location"]["lng"],
                        "formatted_address": data["results"][0]["formatted_address"],
                        "source": "google_geocoding"
                    }
                    self._cache[cache_key] = result
                    return result
            except Exception as e:
                print(f"Google Geocoding error: {e}")
        
        # Fallback
        return await self._geocode_nominatim(address)
    
    async def _geocode_nominatim(self, address: str) -> Optional[Dict]:
        """Fallback geocoding using OpenStreetMap Nominatim"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": address, "format": "json", "limit": 1},
                    headers={"User-Agent": "FreshLogic/2.0"}
                )
                data = resp.json()
                
                if data:
                    return {
                        "lat": float(data[0]["lat"]),
                        "lon": float(data[0]["lon"]),
                        "formatted_address": data[0].get("display_name", address),
                        "source": "nominatim_fallback"
                    }
            except Exception as e:
                print(f"Nominatim fallback error: {e}")
        return None
    
    # ==================== ROUTING ====================
    
    async def get_route(self, origin: str, destination: str) -> Optional[Dict]:
        """Get route using Google Routes API (traffic-aware)"""
        origin_geo = await self.geocode(origin)
        dest_geo = await self.geocode(destination)
        
        if not origin_geo or not dest_geo:
            return None
        
        if not self.api_key:
            return await self._get_route_osrm(origin_geo, dest_geo, origin, destination)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                # Use Routes API (newer, better than Directions API)
                resp = await client.post(
                    "https://routes.googleapis.com/directions/v2:computeRoutes",
                    headers={
                        "X-Goog-Api-Key": self.api_key,
                        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs.steps.startLocation,routes.legs.steps.endLocation,routes.legs.steps.distanceMeters"
                    },
                    json={
                        "origin": {
                            "location": {
                                "latLng": {"latitude": origin_geo["lat"], "longitude": origin_geo["lon"]}
                            }
                        },
                        "destination": {
                            "location": {
                                "latLng": {"latitude": dest_geo["lat"], "longitude": dest_geo["lon"]}
                            }
                        },
                        "travelMode": "DRIVE",
                        "routingPreference": "TRAFFIC_AWARE",
                        "computeAlternativeRoutes": False
                    }
                )
                data = resp.json()
                
                if data.get("routes"):
                    route = data["routes"][0]
                    duration_seconds = int(route["duration"].rstrip("s"))
                    
                    # Extract waypoints from steps
                    waypoints = []
                    if route.get("legs"):
                        for leg in route["legs"]:
                            for step in leg.get("steps", []):
                                start = step.get("startLocation", {}).get("latLng", {})
                                if start:
                                    waypoints.append({
                                        "lat": start.get("latitude"),
                                        "lon": start.get("longitude"),
                                        "lng": start.get("longitude")  # Backward compat
                                    })
                    
                    # Normalize to ~10-15 waypoints
                    if len(waypoints) > 15:
                        step = len(waypoints) // 12
                        waypoints = waypoints[::step]
                    
                    # Ensure first and last points are origin/destination
                    if waypoints:
                        waypoints[0] = {"lat": origin_geo["lat"], "lon": origin_geo["lon"], "lng": origin_geo["lon"]}
                        waypoints[-1] = {"lat": dest_geo["lat"], "lon": dest_geo["lon"], "lng": dest_geo["lon"]}
                    
                    return {
                        "origin_name": origin,
                        "destination_name": destination,
                        "origin": origin_geo,
                        "destination": dest_geo,
                        "distance_km": round(route["distanceMeters"] / 1000, 2),
                        "duration_hours": round(duration_seconds / 3600, 2),
                        "waypoints": waypoints,
                        "source": "google_routes_api"
                    }
            except Exception as e:
                print(f"Google Routes API error: {e}")
        
        # Fallback to OSRM
        return await self._get_route_osrm(origin_geo, dest_geo, origin, destination)
    
    async def _get_route_osrm(self, origin_geo: Dict, dest_geo: Dict, origin: str, destination: str) -> Optional[Dict]:
        """Fallback routing using OSRM"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                url = f"http://router.project-osrm.org/route/v1/driving/{origin_geo['lon']},{origin_geo['lat']};{dest_geo['lon']},{dest_geo['lat']}?overview=false&steps=true"
                resp = await client.get(url)
                data = resp.json()
                
                if data.get("routes"):
                    route = data["routes"][0]
                    steps = route.get("legs", [{}])[0].get("steps", [])
                    
                    waypoints = []
                    for step in steps:
                        loc = step.get("maneuver", {}).get("location", [])
                        if len(loc) == 2:
                            waypoints.append({"lat": loc[1], "lon": loc[0], "lng": loc[0]})
                    
                    if len(waypoints) > 12:
                        waypoints = waypoints[::len(waypoints)//10]
                    
                    return {
                        "origin_name": origin,
                        "destination_name": destination,
                        "origin": origin_geo,
                        "destination": dest_geo,
                        "distance_km": round(route["distance"] / 1000, 2),
                        "duration_hours": round(route["duration"] / 3600, 2),
                        "waypoints": waypoints,
                        "source": "osrm_fallback"
                    }
            except Exception as e:
                print(f"OSRM fallback error: {e}")
        return None
    
    # ==================== ENVIRONMENTAL DATA ====================
    
    async def get_air_quality(self, lat: float, lon: float) -> Dict:
        """Get air quality data using Google Air Quality API"""
        if not self.api_key:
            return self._simulated_air_quality()
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(
                    f"https://airquality.googleapis.com/v1/currentConditions:lookup?key={self.api_key}",
                    json={
                        "location": {"latitude": lat, "longitude": lon},
                        "extraComputations": ["LOCAL_AQI", "HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION"]
                    }
                )
                data = resp.json()
                
                if "indexes" in data:
                    aqi_data = data["indexes"][0] if data["indexes"] else {}
                    
                    # Extract temperature estimate from health recommendations
                    health_rec = data.get("healthRecommendations", {})
                    
                    return {
                        "aqi": aqi_data.get("aqi", 50),
                        "aqi_category": aqi_data.get("category", "Moderate"),
                        "dominant_pollutant": aqi_data.get("dominantPollutant", "pm25"),
                        "health_recommendation": health_rec.get("generalPopulation", ""),
                        "color": aqi_data.get("color", {}),
                        "source": "google_air_quality"
                    }
            except Exception as e:
                print(f"Air Quality API error: {e}")
        
        return self._simulated_air_quality()
    
    def _simulated_air_quality(self) -> Dict:
        """Simulated air quality for fallback"""
        import random
        return {
            "aqi": random.randint(30, 80),
            "aqi_category": "Moderate",
            "dominant_pollutant": "pm25",
            "health_recommendation": "Air quality is acceptable.",
            "source": "simulated"
        }
    
    async def get_pollen_data(self, lat: float, lon: float) -> Dict:
        """Get pollen data using Google Pollen API"""
        if not self.api_key:
            return {"pollen_index": 2, "category": "Low", "source": "simulated"}
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(
                    "https://pollen.googleapis.com/v1/forecast:lookup",
                    params={
                        "key": self.api_key,
                        "location.latitude": lat,
                        "location.longitude": lon,
                        "days": 1
                    }
                )
                data = resp.json()
                
                if "dailyInfo" in data and data["dailyInfo"]:
                    daily = data["dailyInfo"][0]
                    pollen_types = daily.get("pollenTypeInfo", [])
                    
                    # Aggregate pollen levels
                    max_index = 0
                    max_category = "Low"
                    for p in pollen_types:
                        idx = p.get("indexInfo", {}).get("value", 0)
                        if idx > max_index:
                            max_index = idx
                            max_category = p.get("indexInfo", {}).get("category", "Low")
                    
                    return {
                        "pollen_index": max_index,
                        "category": max_category,
                        "types": {p.get("displayName", ""): p.get("indexInfo", {}).get("value", 0) for p in pollen_types},
                        "source": "google_pollen"
                    }
            except Exception as e:
                print(f"Pollen API error: {e}")
        
        return {"pollen_index": 2, "category": "Low", "source": "simulated"}
    
    async def get_solar_data(self, lat: float, lon: float) -> Dict:
        """Get solar/sun exposure data using Google Solar API"""
        if not self.api_key:
            return {"sunshine_hours": 6, "high_exposure": False, "source": "simulated"}
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(
                    "https://solar.googleapis.com/v1/buildingInsights:findClosest",
                    params={
                        "key": self.api_key,
                        "location.latitude": lat,
                        "location.longitude": lon
                    }
                )
                data = resp.json()
                
                if "solarPotential" in data:
                    solar = data["solarPotential"]
                    yearly_hours = solar.get("maxSunshineHoursPerYear", 1800)
                    daily_avg = yearly_hours / 365
                    
                    return {
                        "sunshine_hours": round(daily_avg, 1),
                        "yearly_hours": yearly_hours,
                        "high_exposure": yearly_hours > 2000,
                        "source": "google_solar"
                    }
            except Exception as e:
                print(f"Solar API error: {e}")
        
        return {"sunshine_hours": 6, "high_exposure": False, "source": "simulated"}
    
    # ==================== GOOGLE WEATHER API (PRIMARY) ====================
    
    async def get_weather(self, lat: float, lon: float) -> Dict:
        """
        Get real-time weather data using Google Weather API
        This is the PRIMARY source for temperature, humidity, and conditions
        Endpoint: https://weather.googleapis.com/v1/currentConditions:lookup
        """
        if not self.api_key:
            return self._simulated_weather(lat, lon)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(
                    "https://weather.googleapis.com/v1/currentConditions:lookup",
                    params={
                        "key": self.api_key,
                        "location.latitude": lat,
                        "location.longitude": lon,
                        "unitsSystem": "METRIC"
                    }
                )
                data = resp.json()
                
                if "temperature" in data:
                    return {
                        "temperature": data["temperature"].get("degrees", 25),
                        "feels_like": data.get("feelsLikeTemperature", {}).get("degrees", 25),
                        "humidity": data.get("relativeHumidity", 50),
                        "condition": data.get("weatherCondition", {}).get("description", {}).get("text", "Unknown"),
                        "condition_type": data.get("weatherCondition", {}).get("type", "UNKNOWN"),
                        "icon_url": data.get("weatherCondition", {}).get("iconBaseUri", ""),
                        "uv_index": data.get("uvIndex", 0),
                        "wind_speed": data.get("wind", {}).get("speed", {}).get("value", 0),
                        "wind_direction": data.get("wind", {}).get("direction", {}).get("cardinal", ""),
                        "precipitation_probability": data.get("precipitation", {}).get("probability", {}).get("percent", 0),
                        "cloud_cover": data.get("cloudCover", 0),
                        "visibility_km": data.get("visibility", {}).get("distance", 10),
                        "pressure_mb": data.get("airPressure", {}).get("meanSeaLevelMillibars", 1013),
                        "dew_point": data.get("dewPoint", {}).get("degrees", 15),
                        "is_daytime": data.get("isDaytime", True),
                        "source": "google_weather_api"
                    }
            except Exception as e:
                print(f"Google Weather API error: {e}")
        
        return self._simulated_weather(lat, lon)
    
    async def get_weather_forecast(self, lat: float, lon: float, hours: int = 24) -> Dict:
        """
        Get hourly weather forecast using Google Weather API
        Useful for predicting conditions along route at arrival time
        """
        if not self.api_key:
            return {"hourly": [], "source": "simulated"}
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(
                    "https://weather.googleapis.com/v1/forecast/hours:lookup",
                    params={
                        "key": self.api_key,
                        "location.latitude": lat,
                        "location.longitude": lon,
                        "hours": min(hours, 240),  # Max 240 hours
                        "unitsSystem": "METRIC"
                    }
                )
                data = resp.json()
                
                if "hours" in data:
                    hourly = []
                    for h in data["hours"][:hours]:
                        hourly.append({
                            "time": h.get("interval", {}).get("startTime", ""),
                            "temperature": h.get("temperature", {}).get("degrees", 25),
                            "humidity": h.get("relativeHumidity", 50),
                            "precipitation_prob": h.get("precipitation", {}).get("probability", {}).get("percent", 0),
                            "condition": h.get("weatherCondition", {}).get("description", {}).get("text", "")
                        })
                    return {"hourly": hourly, "source": "google_weather_api"}
            except Exception as e:
                print(f"Weather Forecast API error: {e}")
        
        return {"hourly": [], "source": "simulated"}
    
    def _simulated_weather(self, lat: float, lon: float) -> Dict:
        """Simulated weather for fallback or demo"""
        import random
        # Base temp adjusted by latitude (cooler north)
        base_temp = 30 - abs(lat - 20) * 0.5
        # Seasonal adjustment for India
        month = datetime.now().month
        if month in [4, 5, 6]:  # Summer
            base_temp += 8
        elif month in [12, 1, 2]:  # Winter
            base_temp -= 8
        
        return {
            "temperature": round(base_temp + random.uniform(-3, 3), 1),
            "feels_like": round(base_temp + random.uniform(0, 5), 1),
            "humidity": random.randint(40, 80),
            "condition": random.choice(["Sunny", "Partly Cloudy", "Hazy", "Clear"]),
            "condition_type": "CLEAR",
            "uv_index": random.randint(3, 9),
            "wind_speed": random.randint(5, 25),
            "precipitation_probability": random.randint(0, 30),
            "cloud_cover": random.randint(0, 50),
            "source": "simulated"
        }

    async def get_environmental_conditions(self, lat: float, lon: float) -> Dict:
        """
        Get comprehensive environmental data for a waypoint
        Uses Google Weather API as PRIMARY source for temp/humidity
        Plus Air Quality + Pollen + Solar for additional crop-relevant data
        """
        # Run all API calls in parallel - Weather API is now primary
        weather_task = self.get_weather(lat, lon)
        air_task = self.get_air_quality(lat, lon)
        pollen_task = self.get_pollen_data(lat, lon)
        solar_task = self.get_solar_data(lat, lon)
        
        weather, air, pollen, solar = await asyncio.gather(
            weather_task, air_task, pollen_task, solar_task,
            return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(weather, Exception):
            weather = self._simulated_weather(lat, lon)
        if isinstance(air, Exception):
            air = self._simulated_air_quality()
        if isinstance(pollen, Exception):
            pollen = {"pollen_index": 2, "category": "Low"}
        if isinstance(solar, Exception):
            solar = {"sunshine_hours": 6, "high_exposure": False}
        
        # Use ACTUAL weather data from Google Weather API
        temperature = weather.get("temperature", 25)
        humidity = weather.get("humidity", 50)
        
        return {
            "temperature": round(temperature, 1),
            "humidity": round(humidity, 0),
            "feels_like": weather.get("feels_like", temperature),
            "weather_condition": weather.get("condition", "Unknown"),
            "uv_index": weather.get("uv_index", 5),
            "wind_speed": weather.get("wind_speed", 10),
            "precipitation_prob": weather.get("precipitation_probability", 0),
            "air_quality": air,
            "pollen": pollen,
            "solar": solar,
            "condition": self._get_condition_description(weather, air, pollen, solar),
            "environmental_risk": self._calculate_environmental_risk(weather, air, pollen, solar),
            "weather_source": weather.get("source", "unknown")
        }
    
    def _get_condition_description(self, weather: Dict, air: Dict, pollen: Dict, solar: Dict) -> str:
        """Generate human-readable condition description"""
        parts = []
        
        # Weather condition first
        weather_cond = weather.get("condition", "")
        if weather_cond:
            parts.append(weather_cond)
        
        # Temperature warning
        temp = weather.get("temperature", 25)
        if temp > 35:
            parts.append("Extreme heat")
        elif temp > 30:
            parts.append("Hot")
        
        # Air quality
        aqi = air.get("aqi", 50)
        if aqi > 100:
            parts.append("Poor air quality")
        
        # High sun exposure
        if solar.get("high_exposure"):
            parts.append("High sun exposure")
        
        # High pollen
        if pollen.get("pollen_index", 0) > 3:
            parts.append("High pollen")
        
        return ", ".join(parts) if parts else "Normal conditions"
    
    def _calculate_environmental_risk(self, weather: Dict, air: Dict, pollen: Dict, solar: Dict) -> float:
        """Calculate environmental risk score (0-1) based on all factors"""
        risk = 0.0
        
        # Temperature risk (0-0.35) - Most important for spoilage!
        temp = weather.get("temperature", 25)
        if temp > 40:
            risk += 0.35
        elif temp > 35:
            risk += 0.28
        elif temp > 32:
            risk += 0.2
        elif temp > 28:
            risk += 0.1
        
        # Humidity risk (0-0.25) - High humidity = faster spoilage
        humidity = weather.get("humidity", 50)
        if humidity > 85:
            risk += 0.25
        elif humidity > 75:
            risk += 0.15
        elif humidity > 65:
            risk += 0.08
        
        # Air quality risk (0-0.2)
        aqi = air.get("aqi", 50)
        if aqi > 150:
            risk += 0.2
        elif aqi > 100:
            risk += 0.12
        elif aqi > 50:
            risk += 0.05
        
        # Precipitation risk (0-0.1) - Rain can damage exposed produce
        precip_prob = weather.get("precipitation_probability", 0)
        if precip_prob > 70:
            risk += 0.1
        elif precip_prob > 40:
            risk += 0.05
        
        # UV/Solar risk (0-0.1)
        uv_index = weather.get("uv_index", 5)
        if uv_index > 8:
            risk += 0.1
        elif uv_index > 6:
            risk += 0.05
        
        return min(1.0, risk)
    
    # ==================== TELEMETRY GENERATION ====================
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula (km)"""
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    async def generate_trip_telemetry(self, route_data: Dict) -> List[Dict]:
        """
        Generate comprehensive telemetry for each waypoint
        Uses Google APIs for environmental data
        """
        telemetry_points = []
        waypoints = route_data.get("waypoints", [])
        total_distance = route_data.get("distance_km", 100)
        total_hours = route_data.get("duration_hours", 3)
        
        if not waypoints:
            return []
        
        # Calculate segment distances
        segment_distances = [0]
        for i in range(1, len(waypoints)):
            dist = self._calculate_distance(
                waypoints[i-1]["lat"], waypoints[i-1].get("lon", waypoints[i-1].get("lng")),
                waypoints[i]["lat"], waypoints[i].get("lon", waypoints[i].get("lng"))
            )
            segment_distances.append(dist)
        
        total_segment_dist = sum(segment_distances) or total_distance
        
        # Fetch environmental data for all waypoints in parallel
        env_tasks = [
            self.get_environmental_conditions(
                wp["lat"], 
                wp.get("lon", wp.get("lng"))
            ) 
            for wp in waypoints
        ]
        
        print(f"🌍 Fetching environmental data for {len(waypoints)} waypoints...")
        env_results = await asyncio.gather(*env_tasks, return_exceptions=True)
        
        cumulative_time = 0
        cumulative_distance = 0
        google_data_count = 0
        
        for i, (waypoint, env_data) in enumerate(zip(waypoints, env_results)):
            # Handle exceptions
            if isinstance(env_data, Exception):
                env_data = {
                    "temperature": 28,
                    "humidity": 65,
                    "condition": "Data unavailable",
                    "environmental_risk": 0.2,
                    "air_quality": {"source": "error"},
                    "pollen": {},
                    "solar": {}
                }
            else:
                if env_data.get("air_quality", {}).get("source") == "google_air_quality":
                    google_data_count += 1
            
            segment_dist = segment_distances[i]
            segment_time = (segment_dist / total_segment_dist) * total_hours if total_segment_dist > 0 else 0
            cumulative_time += segment_time
            cumulative_distance += segment_dist
            
            # Exposure hours until next waypoint
            if i < len(waypoints) - 1:
                next_dist = segment_distances[i + 1] if i + 1 < len(segment_distances) else 0
                exposure_hours = (next_dist / total_segment_dist) * total_hours if total_segment_dist > 0 else 0
            else:
                exposure_hours = 0
            
            telemetry_points.append({
                "waypoint_num": i + 1,
                "lat": waypoint["lat"],
                "lon": waypoint.get("lon", waypoint.get("lng")),
                "lng": waypoint.get("lon", waypoint.get("lng")),  # Backward compat
                
                # Temperature & Humidity (estimated from environmental data)
                "ambient_temp": env_data["temperature"],
                "internal_temp": env_data["temperature"],  # Will be adjusted by model
                "weather_temp": env_data["temperature"],
                "humidity": env_data["humidity"],
                "condition": env_data["condition"],
                
                # Environmental details
                "air_quality": env_data.get("air_quality", {}),
                "pollen": env_data.get("pollen", {}),
                "solar": env_data.get("solar", {}),
                "environmental_risk": env_data.get("environmental_risk", 0),
                
                # Distance & Time
                "segment_km": round(segment_dist, 2),
                "distance_km": round(cumulative_distance, 2),
                "cumulative_km": round(cumulative_distance, 2),
                "cumulative_hours": round(cumulative_time, 2),
                "hours_elapsed": round(cumulative_time, 2),
                "exposure_hours": round(exposure_hours, 2)
            })
        
        # Log data source
        total = len(waypoints)
        if google_data_count == total:
            print(f"✅ Environmental data: {google_data_count}/{total} from Google APIs")
        elif google_data_count > 0:
            print(f"⚠️ Environmental data: {google_data_count}/{total} from Google, {total-google_data_count} simulated")
        else:
            print(f"⚠️ Environmental data: All {total} simulated (set GOOGLE_API_KEY for real data)")
        
        return telemetry_points


# ==================== SYNC WRAPPER ====================

class TelemetryService:
    """
    Synchronous wrapper for backward compatibility
    Wraps the async GoogleTelemetryService
    """
    
    def __init__(self):
        self._async_service = GoogleTelemetryService()
    
    def _run_async(self, coro):
        """Run async coroutine in sync context"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            # If already in async context, create task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        else:
            return loop.run_until_complete(coro)
    
    def get_coordinates(self, city_name: str) -> Optional[Tuple[float, float]]:
        """Get coordinates for a city"""
        result = self._run_async(self._async_service.geocode(city_name))
        if result:
            return (result["lat"], result["lon"])
        return None
    
    def get_route(self, start_city: str, end_city: str) -> Optional[Dict]:
        """Get route between two cities"""
        return self._run_async(self._async_service.get_route(start_city, end_city))
    
    def generate_trip_telemetry(self, route_data: Dict) -> List[Dict]:
        """Generate telemetry for all waypoints"""
        return self._run_async(self._async_service.generate_trip_telemetry(route_data))


# Singleton instance
telemetry_service = TelemetryService()
google_telemetry_service = GoogleTelemetryService()  # Async version
