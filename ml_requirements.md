# Machine Learning Model Requirements for FreshLogic

## 1. Goal
Predict **Spoilage Probability** during transport.

## 2. Data Strategy: Synthetic "Golden Rules" (Indian Context)
We have created a database of **Indian Crops** (Mangoes, Dals, Gourds) with optimal conditions.
*   **Source File**: `backend/data/crop_storage_data.json` (Updated with Indian varieties).
*   **Generator Script**: `backend/data/generate_synthetic_data.py`

**Action for ML Engineer:**
1.  Run the generator script.
2.  It creates a CSV with ~100,000 rows.
3.  Train your model on this CSV.

## 3. Input Features
*   `temperature_c`
*   `humidity_percent`
*   `vpd_kpa` (Calculated)
*   `transit_hours`
*   `crop_type` (Local names included e.g., "Lady Finger (Okra/Bhindi)")

## 4. Output
*   `spoilage_risk` (0.0 to 1.0)
