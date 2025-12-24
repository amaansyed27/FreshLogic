import json
import random
import pandas as pd
import numpy as np
import os

# Load the Golden Rules
base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, "crop_storage_data.json")

with open(json_path, "r") as f:
    CROP_DATA = json.load(f)

OUTPUT_FILE = os.path.join(base_dir, "synthetic_spoilage_data.csv")
SAMPLES_PER_CROP = 1000

data = []

def calculate_vpd(temp, humidity):
    """Calculate Vapor Pressure Deficit (kPa)"""
    es = 0.6108 * np.exp(17.27 * temp / (temp + 237.3))
    actual_vapor_pressure = es * (humidity / 100.0)
    return max(0, es - actual_vapor_pressure)

def get_base_shelf_life(category):
    """Estimate max shelf life (in days) at optimal conditions based on category."""
    if "Berr" in category or "Leaf" in category or "Flower" in category:
        return random.uniform(7, 14) # Sensitive
    elif "Root" in category or "Onion" in category or "Potato" in category:
        return random.uniform(60, 180) # Hardy
    else:
        return random.uniform(20, 40) # General Fruits/Veg

print(f"Generating Physics-Based data for {len(CROP_DATA)} crops...")

for crop in CROP_DATA:
    name = crop["name"]
    category = crop.get("category", "General")
    opt_t_min = crop["temp_min"]
    
    # Physics Parameters
    # Q10: Rate of spoilage doubles every 10C rise?
    # Strawberries ~2.3, Leafy ~2.5, Onions ~1.5
    q10_factor = random.uniform(2.0, 2.5) 
    base_shelf_life_days = get_base_shelf_life(category)
    
    for _ in range(SAMPLES_PER_CROP):
        # 1. Generate random Environmental History
        # We simulate a trip where the avg temp might be high
        sim_temp = random.uniform(-2, 35)
        sim_humidity = random.uniform(30, 99)
        sim_hours = random.uniform(1, 168)  # 1 hour to 1 week
        
        # 2. Apply Arrhenius / Q10 Decay Model
        # Rate of Decay at Sim Temp relative to Opt Temp
        # If Sim > Opt, decay accelerates.
        # If Sim < Opt (Chilling), we model that separately as 'injury' risk
        
        delta_t = sim_temp - opt_t_min
        
        if delta_t >= 0:
            # Normal heat-driven decay
            decay_rate = q10_factor ** (delta_t / 10.0)
        else:
            # Cold Injury Zone (Physics matches chemistry breakdown + physical damage)
            # Cold injury accelerates decay differently (non-Arrhenius usually)
            # We approximate it as a high-risk factor
            decay_rate = 3.0 * abs(delta_t) # High penalty for freezing
            
        # Effective Time Consumed (in "Shelf Life Days")
        transit_days = sim_hours / 24.0
        life_consumed_days = transit_days * decay_rate
        
        # 3. Calculate Risk
        # Risk is % of shelf life consumed. If > 100%, it's spoiled.
        spoilage_risk = life_consumed_days / base_shelf_life_days
        
        # Add Humidity Penalty (VPD driven)
        # Low humidity = Shrivel (extra risk)
        # High humidity = Mold (extra risk)
        vpd = calculate_vpd(sim_temp, sim_humidity)
        
        if vpd > 1.5: # Too Dry
            spoilage_risk *= 1.2
        elif sim_humidity > 95: # Condensation/Mold
            spoilage_risk *= 1.3
            
        # Sigmoid squash to ensures 0-1 but keeps physics trend
        # We want the 'Physics' result to be the primary driver, but capped.
        final_risk = min(1.0, max(0.0, spoilage_risk))
        
        data.append({
            "crop_type": name,
            "category": category,
            "temperature_c": round(sim_temp, 1),
            "humidity_percent": round(sim_humidity, 1),
            "vpd_kpa": round(vpd, 2),
            "transit_hours": round(sim_hours, 1),
            "spoilage_risk": round(final_risk, 3), 
            "label_safe": 1 if final_risk < 0.5 else 0
        })

df = pd.DataFrame(data)
df.to_csv(OUTPUT_FILE, index=False)
print(f"Success! Generated {len(df)} rows with Q10 Physics Model.")
