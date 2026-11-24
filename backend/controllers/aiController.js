const { generateAIExplanation } = require("../services/aiService");

 
const AI_PROVIDER = process.env.AI_PROVIDER
// Options: "gemini", "openai", "mock"

const generateExplanation = async (req, res) => {
    try {
        const { symptoms, predictions } = req.body;

        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Please provide at least one symptom."
            });
        }

        if (!Array.isArray(predictions) || predictions.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Please provide disease predictions first."
            });
        }

        const result = await generateAIExplanation({
            provider: AI_PROVIDER,
            symptoms,
            predictions
        });

        return res.status(200).json({
            status: "success",
            message: "AI explanation generated successfully.",
            data: result
        });

    } catch (error) {
        console.error("AI explanation error:", error.message);

        return res.status(500).json({
            status: "error",
            message: "Unable to generate the explanation."
        });
    }
};

module.exports = { generateExplanation };