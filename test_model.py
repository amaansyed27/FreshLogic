import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, classification_report, f1_score
import numpy as np

# Load data
df = pd.read_csv('backend/data/synthetic_spoilage_data.csv')
X = df[['temperature_c', 'humidity_percent', 'vpd_kpa', 'transit_hours', 'crop_type']]
y = df['spoilage_risk']

# Load model
with open('backend/model/baseline_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Split same as training
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Predict
preds = model.predict(X_test)

# Regression metrics
print('=== REGRESSION METRICS ===')
print(f'MAE: {mean_absolute_error(y_test, preds):.4f}')
print(f'R2:  {r2_score(y_test, preds):.4f}')
print(f'RMSE: {np.sqrt(np.mean((y_test - preds)**2)):.4f}')

# Convert to classification (Safe <0.3, Warning 0.3-0.7, Critical >0.7)
def to_class(val):
    if val > 0.7: return 'Critical'
    elif val > 0.3: return 'Warning'
    return 'Safe'

y_true_class = [to_class(v) for v in y_test]
y_pred_class = [to_class(v) for v in preds]

print()
print('=== CLASSIFICATION METRICS (3-class) ===')
print(classification_report(y_true_class, y_pred_class, digits=4))
print(f'Macro F1: {f1_score(y_true_class, y_pred_class, average="macro"):.4f}')
print(f'Weighted F1: {f1_score(y_true_class, y_pred_class, average="weighted"):.4f}')
