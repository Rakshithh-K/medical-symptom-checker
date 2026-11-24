from flask import Flask, request, jsonify
from pathlib import Path
import pandas as pd
import re

from predict import predict_diseases, available_symptoms

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
DATASET_DIR = BASE_DIR / "dataset"


# Load disease information from CSV files
description_df = pd.read_csv(
    DATASET_DIR / "symptom_Description.csv"
)

precaution_df = pd.read_csv(
    DATASET_DIR / "symptom_precaution.csv"
)

dataset_df = pd.read_csv(
    DATASET_DIR / "dataset.csv"
)


# Normalize symptom names
def normalize_symptom(symptom):
    symptom = str(symptom).strip().lower()
    symptom = re.sub(r"\s+", "_", symptom)
    symptom = re.sub(r"_+", "_", symptom)

    return symptom


# Load all disease information
def load_diseases():

    diseases = []

    for disease in sorted(dataset_df["Disease"].dropna().unique()):

        # Find disease description
        description_row = description_df[
            description_df["Disease"].str.lower() == disease.lower()
        ]

        # Find disease precautions
        precaution_row = precaution_df[
            precaution_df["Disease"].str.lower() == disease.lower()
        ]

        # Find associated symptoms
        disease_rows = dataset_df[
            dataset_df["Disease"] == disease
        ]

        symptoms = set()

        for column in dataset_df.columns:

            if column.startswith("Symptom_"):

                for symptom in disease_rows[column].dropna():
                    symptoms.add(normalize_symptom(symptom))

        # Get description
        description = ""

        if not description_row.empty:
            description = str(
                description_row.iloc[0]["Description"]
            )

        # Get precautions
        precautions = []

        if not precaution_row.empty:

            for column in precaution_df.columns:

                if column.startswith("Precaution_"):

                    value = precaution_row.iloc[0][column]

                    if pd.notna(value) and str(value).strip():
                        precautions.append(str(value).strip())

        diseases.append({
            "disease": disease,
            "description": description,
            "symptoms": sorted(symptoms),
            "precautions": precautions
        })

    return diseases


# Store disease information
disease_data = load_diseases()


# Health check
@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "Medical Symptom Checker ML Service is running"
    })


# Get all available symptoms
@app.route("/symptoms", methods=["GET"])
def get_symptoms():

    return jsonify({
        "status": "success",
        "total_symptoms": len(available_symptoms),
        "symptoms": sorted(available_symptoms)
    })


# Get all diseases and search diseases
@app.route("/diseases", methods=["GET"])
def get_diseases():

    search = request.args.get("search", "").strip().lower()

    results = disease_data

    if search:

        results = [
            disease for disease in disease_data
            if search in disease["disease"].lower()
        ]

    return jsonify({
        "status": "success",
        "count": len(results),
        "data": results
    })


# Get individual disease details
@app.route("/diseases/<path:disease_name>", methods=["GET"])
def get_disease(disease_name):

    disease_name = disease_name.strip().lower()

    disease = next(
        (
            item for item in disease_data
            if item["disease"].lower() == disease_name
        ),
        None
    )

    if not disease:

        return jsonify({
            "status": "error",
            "message": "Disease not found"
        }), 404

    return jsonify({
        "status": "success",
        "data": disease
    })


# Predict possible diseases
@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):

        return jsonify({
            "status": "error",
            "message": "Request body must contain valid JSON"
        }), 400

    symptoms = data.get("symptoms")

    if not isinstance(symptoms, list) or not symptoms:

        return jsonify({
            "status": "error",
            "message": "Please provide at least one symptom as a list"
        }), 400

    if not all(isinstance(symptom, str) for symptom in symptoms):

        return jsonify({
            "status": "error",
            "message": "Every symptom must be a string"
        }), 400

    try:

        # Generate disease predictions
        results = predict_diseases(symptoms)

        # Attach descriptions to predictions
        for prediction in results:

            disease_info = next(
                (
                    item for item in disease_data
                    if item["disease"].lower()
                    == prediction["disease"].lower()
                ),
                None
            )

            prediction["description"] = (
                disease_info["description"]
                if disease_info else ""
            )

        return jsonify({
            "status": "success",
            "selected_symptoms": symptoms,
            "predictions": results
        })

    except ValueError as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400


# Start Flask service
if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )