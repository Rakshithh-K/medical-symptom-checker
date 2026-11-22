import re
import joblib
import pandas as pd

from pathlib import Path
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score, classification_report


# ==========================================
# 1. PROJECT PATHS
# ==========================================

BASE_DIR = Path(__file__).parent

DATASET_PATH = BASE_DIR / "dataset" / "dataset.csv"
MODEL_DIR = BASE_DIR / "model"

MODEL_DIR.mkdir(exist_ok=True)


# ==========================================
# 2. LOAD DATASET
# ==========================================

df = pd.read_csv(DATASET_PATH)

print("Original dataset shape:", df.shape)


# ==========================================
# 3. IDENTIFY SYMPTOM COLUMNS
# ==========================================

symptom_columns = [
    column for column in df.columns
    if column.startswith("Symptom_")
]


# ==========================================
# 4. NORMALIZE SYMPTOMS
# ==========================================

def normalize_symptom(symptom):

    if pd.isna(symptom):
        return None

    symptom = str(symptom).strip().lower()

    symptom = re.sub(r"\s+", "_", symptom)

    symptom = re.sub(r"_+", "_", symptom)

    return symptom if symptom else None


def extract_symptoms(row):

    symptoms = [
        normalize_symptom(value)
        for value in row[symptom_columns]
    ]

    return sorted(set(
        symptom for symptom in symptoms
        if symptom is not None
    ))


df["symptoms"] = df.apply(extract_symptoms, axis=1)

print("Symptom preprocessing completed.")


# ==========================================
# 5. REMOVE DUPLICATE COMBINATIONS
# ==========================================

df["symptom_key"] = df["symptoms"].apply(tuple)

conflicts = (
    df.groupby("symptom_key")["Disease"]
    .nunique()
)

if (conflicts > 1).any():
    raise ValueError(
        "Conflicting symptom combinations detected."
    )

df = df.drop_duplicates(
    subset="symptom_key"
).copy()

print("Cleaned dataset shape:", df.shape)


# ==========================================
# 6. MULTI-HOT ENCODING
# ==========================================

encoder = MultiLabelBinarizer()

X = encoder.fit_transform(df["symptoms"])

y = df["Disease"]

print("Feature matrix shape:", X.shape)

print("Total disease classes:", y.nunique())

print("Total symptom features:", len(encoder.classes_))


# ==========================================
# 7. CREATE RANDOM FOREST MODEL
# ==========================================

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)


# ==========================================
# 8. CROSS-VALIDATION
# ==========================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

predictions = cross_val_predict(
    model,
    X,
    y,
    cv=cv
)


# ==========================================
# 9. MODEL EVALUATION
# ==========================================

accuracy = accuracy_score(y, predictions)

print("\n========== MODEL EVALUATION ==========")

print(f"Cross-validation accuracy: {accuracy:.4f}")

print("\nClassification Report:")

print(
    classification_report(
        y,
        predictions,
        zero_division=0
    )
)


# ==========================================
# 10. TRAIN FINAL MODEL
# ==========================================

model.fit(X, y)

print("\nFinal model training completed.")


# ==========================================
# 11. SAVE TRAINED MODEL
# ==========================================

model_path = MODEL_DIR / "symptom_model.joblib"

joblib.dump(
    {
        "model": model,
        "encoder": encoder,
        "symptoms": list(encoder.classes_)
    },
    model_path
)

print("\nModel saved successfully!")

print("Model location:", model_path)