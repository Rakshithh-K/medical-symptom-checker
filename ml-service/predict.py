import re
import joblib

from pathlib import Path


# Load the trained model
BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "model" / "symptom_model.joblib"

saved_data = joblib.load(MODEL_PATH)

model = saved_data["model"]
encoder = saved_data["encoder"]

available_symptoms = set(saved_data["symptoms"])


# Normalize symptom names
def normalize_symptom(symptom):

    symptom = str(symptom).strip().lower()

    symptom = re.sub(r"\s+", "_", symptom)

    symptom = re.sub(r"_+", "_", symptom)

    return symptom


# Predict possible diseases
def predict_diseases(user_symptoms, top_n=3):

    if not user_symptoms:
        raise ValueError("Please select at least one symptom.")

    normalized_symptoms = {
        normalize_symptom(symptom)
        for symptom in user_symptoms
    }

    unknown_symptoms = (
        normalized_symptoms - available_symptoms
    )

    if unknown_symptoms:
        raise ValueError(
            f"Unknown symptoms: {sorted(unknown_symptoms)}"
        )

    # Convert symptoms into numerical features
    input_features = encoder.transform([
        sorted(normalized_symptoms)
    ])

    # Get model scores
    scores = model.predict_proba(input_features)[0]

    # Rank predictions
    ranked_indices = scores.argsort()[::-1][:top_n]

    predictions = []

    for index in ranked_indices:

        predictions.append({
            "disease": model.classes_[index],
            "model_score": round(float(scores[index]) * 100, 2)
        })

    return predictions


# Test prediction
if __name__ == "__main__":

    symptoms = [
        "itching",
        "skin_rash",
        "nodal_skin_eruptions"
    ]

    results = predict_diseases(symptoms)

    print("\nSelected Symptoms:")

    print(symptoms)

    print("\nPossible Conditions:")

    for result in results:

        print(
            f"{result['disease']} "
            f"- Model score: {result['model_score']}%"
        )