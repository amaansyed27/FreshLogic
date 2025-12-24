import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, f1_score, classification_report

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "backend", "data", "synthetic_spoilage_data.csv")
MODEL_DIR = os.path.join(MODEL_DIR := os.path.join(BASE_DIR, "model"), "")
REGRESSOR_PATH = os.path.join(MODEL_DIR, "baseline_model.pkl")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "classifier_model.pkl")
ENSEMBLE_PATH = os.path.join(MODEL_DIR, "ensemble_model.pkl")

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

if not os.path.exists(DATA_PATH):
    print(f"Error: Data file not found at {DATA_PATH}")
    exit(1)

print("=" * 60)
print("🌾 FreshLogic Ensemble Model Training")
print("=" * 60)
print("\nLoading Data...")
df = pd.read_csv(DATA_PATH)
print(f"   Samples: {len(df):,}")
print(f"   Crops: {df['crop_type'].nunique()}")

# Features
X = df[["temperature_c", "humidity_percent", "vpd_kpa", "transit_hours", "crop_type"]]
y_regression = df["spoilage_risk"]  # Continuous 0.0-1.0
y_classification = df["label_safe"]  # Binary: 1=Safe, 0=Spoiled

# Preprocessing Pipeline
categorical_features = ["crop_type"]
numerical_features = ["temperature_c", "humidity_percent", "vpd_kpa", "transit_hours"]

preprocessor = ColumnTransformer(
    transformers=[
        ("num", "passthrough", numerical_features),
        ("cat", OneHotEncoder(handle_unknown='ignore'), categorical_features),
    ]
)

# Train-Test Split (same split for both models)
X_train, X_test, y_reg_train, y_reg_test, y_cls_train, y_cls_test = train_test_split(
    X, y_regression, y_classification, test_size=0.2, random_state=42
)

# ========== MODEL 1: REGRESSOR ==========
print("\n" + "-" * 40)
print("📈 Training REGRESSOR (RandomForest)...")
print("-" * 40)

regressor_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
])

regressor_pipeline.fit(X_train, y_reg_train)

# Evaluate Regressor
reg_preds = regressor_pipeline.predict(X_test)
mae = mean_absolute_error(y_reg_test, reg_preds)
r2 = r2_score(y_reg_test, reg_preds)

print(f"   ✅ MAE: {mae:.4f}")
print(f"   ✅ R² Score: {r2:.4f}")

# Save Regressor (backward compatible)
with open(REGRESSOR_PATH, "wb") as f:
    pickle.dump(regressor_pipeline, f)
print(f"   💾 Saved: {REGRESSOR_PATH}")

# ========== MODEL 2: CLASSIFIER ==========
print("\n" + "-" * 40)
print("🏷️  Training CLASSIFIER (RandomForest)...")
print("-" * 40)

classifier_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("model", RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
])

classifier_pipeline.fit(X_train, y_cls_train)

# Evaluate Classifier
cls_preds = classifier_pipeline.predict(X_test)
cls_proba = classifier_pipeline.predict_proba(X_test)[:, 1]  # Probability of being Safe

accuracy = accuracy_score(y_cls_test, cls_preds)
f1 = f1_score(y_cls_test, cls_preds)

print(f"   ✅ Accuracy: {accuracy:.4f}")
print(f"   ✅ F1 Score: {f1:.4f}")
print("\n   Classification Report:")
print("   " + classification_report(y_cls_test, cls_preds).replace("\n", "\n   "))

# Save Classifier
with open(CLASSIFIER_PATH, "wb") as f:
    pickle.dump(classifier_pipeline, f)
print(f"   💾 Saved: {CLASSIFIER_PATH}")

# ========== ENSEMBLE MODEL (Combined) ==========
print("\n" + "-" * 40)
print("🔗 Creating ENSEMBLE Model...")
print("-" * 40)

ensemble = {
    "regressor": regressor_pipeline,
    "classifier": classifier_pipeline,
    "version": "1.0.0",
    "metrics": {
        "regressor": {"mae": mae, "r2": r2},
        "classifier": {"accuracy": accuracy, "f1": f1}
    }
}

with open(ENSEMBLE_PATH, "wb") as f:
    pickle.dump(ensemble, f)
print(f"   💾 Saved: {ENSEMBLE_PATH}")

# ========== COMBINED METRICS ==========
print("\n" + "=" * 60)
print("📊 ENSEMBLE PERFORMANCE SUMMARY")
print("=" * 60)
print(f"   Regressor  → MAE: {mae:.4f}, R²: {r2:.4f}")
print(f"   Classifier → Accuracy: {accuracy:.2%}, F1: {f1:.4f}")
print("\n   The ensemble uses BOTH models:")
print("   • Regressor: Predicts exact spoilage risk (0.0-1.0)")
print("   • Classifier: Confirms Safe/Spoiled with confidence %")
print("   • Combined: Higher confidence when both models agree")
print("=" * 60)
