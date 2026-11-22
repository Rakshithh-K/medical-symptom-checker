const mongoose = require("mongoose");

const symptomCheckSchema = new mongoose.Schema(
    {
        selectedSymptoms: {
            type: [String],
            required: true
        },

        predictions: [
            {
                disease: {
                    type: String,
                    required: true
                },
                model_score: {
                    type: Number,
                    required: true
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const SymptomCheck = mongoose.model(
    "SymptomCheck",
    symptomCheckSchema
);

module.exports = SymptomCheck;