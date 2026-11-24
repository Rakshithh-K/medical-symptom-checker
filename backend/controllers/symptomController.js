const axios = require("axios");
const mongoose = require("mongoose");
const SymptomCheck = require("../models/SymptomCheck");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;


// 1. Fetch all available symptoms
const getSymptoms = async (req, res) => {
    try {
        const response = await axios.get(
            `${ML_SERVICE_URL}/symptoms`
        );

        res.status(200).json(response.data);

    } catch (error) {
        res.status(502).json({
            status: "error",
            message: "Unable to fetch symptoms from ML service"
        });
    }
};


// Reusable function to get ML predictions
const getPredictions = async (symptoms) => {
    const response = await axios.post(
        `${ML_SERVICE_URL}/predict`,
        { symptoms }
    );

    return response.data.predictions;
};


// 2. Create a symptom check
const createSymptomCheck = async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Please select at least one symptom"
            });
        }

        // Get predictions including descriptions from Flask
        const predictions = await getPredictions(symptoms);

        // Save predictions to MongoDB.
        // Mongoose stores only disease and model_score.
        const symptomCheck = await SymptomCheck.create({
            selectedSymptoms: symptoms,
            predictions
        });

        // Return the original predictions with descriptions.
        res.status(201).json({
            status: "success",
            message: "Symptom check created successfully",
            data: {
                ...symptomCheck.toObject(),
                predictions
            }
        });

    } catch (error) {
        res.status(error.response ? 400 : 502).json({
            status: "error",
            message: error.response?.data?.message ||
                "Unable to process symptom check"
        });
    }
};


// 3. Get all previous symptom checks
const getHistory = async (req, res) => {
    try {
        const history = await SymptomCheck.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            count: history.length,
            data: history
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Unable to fetch symptom history"
        });
    }
};


// 4. Get one symptom check by ID
const getHistoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid symptom check ID"
            });
        }

        const history = await SymptomCheck.findById(id);

        if (!history) {
            return res.status(404).json({
                status: "error",
                message: "Symptom check not found"
            });
        }

        res.status(200).json({
            status: "success",
            data: history
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Unable to fetch symptom check"
        });
    }
};


// 5. Update an existing symptom check
const updateSymptomCheck = async (req, res) => {
    try {
        const { id } = req.params;
        const { symptoms } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid symptom check ID"
            });
        }

        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Please select at least one symptom"
            });
        }

        const symptomCheck = await SymptomCheck.findById(id);

        if (!symptomCheck) {
            return res.status(404).json({
                status: "error",
                message: "Symptom check not found"
            });
        }

        // Get updated predictions including descriptions
        const predictions = await getPredictions(symptoms);

        symptomCheck.selectedSymptoms = symptoms;
        symptomCheck.predictions = predictions;

        await symptomCheck.save();

        res.status(200).json({
            status: "success",
            message: "Symptom check updated successfully",
            data: {
                ...symptomCheck.toObject(),
                predictions
            }
        });

    } catch (error) {
        res.status(error.response ? 400 : 502).json({
            status: "error",
            message: error.response?.data?.message ||
                "Unable to update symptom check"
        });
    }
};


// 6. Delete a symptom check
const deleteSymptomCheck = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid symptom check ID"
            });
        }

        const deletedCheck = await SymptomCheck.findByIdAndDelete(id);

        if (!deletedCheck) {
            return res.status(404).json({
                status: "error",
                message: "Symptom check not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Symptom check deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Unable to delete symptom check"
        });
    }
};


module.exports = {
    getSymptoms,
    createSymptomCheck,
    getHistory,
    getHistoryById,
    updateSymptomCheck,
    deleteSymptomCheck
};