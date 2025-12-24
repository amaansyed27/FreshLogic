
import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "synthetic_spoilage_data.csv")
model_dir = os.path.join(base_dir, "..", "model")
model_path = os.path.join(model_dir, "baseline_model.pkl")

os.makedirs(model_dir, exist_ok=True)

def train_model():
    print("⏳ Loading dataset...")
    if not os.path.exists(csv_path):
        print(f"Error: Dataset not found at {csv_path}")
        return

    df = pd.read_csv(csv_path)
    print(f"Dataset shape: {df.shape}")

    # Features and Target
    # We use crop_type (Categorical), temperature, humidity, transit_hours, vpd
    X = df[["crop_type", "temperature_c", "humidity_percent", "transit_hours", "vpd_kpa"]]
    y = df["spoilage_risk"]

    # Preprocessing
    # OneHotEncode 'crop_type' to handle all 92 crops
    categorical_features = ["crop_type"]
    numerical_features = ["temperature_c", "humidity_percent", "transit_hours", "vpd_kpa"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )

    # Pipeline: Preprocess -> Regressor
    model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🚀 Training Random Forest Model (this might take a moment)...")
    model.fit(X_train, y_train)

    # Validate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"✅ Training Complete.")
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"R2 Score: {r2:.4f}")

    # Save
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    
    print(f"💾 Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
