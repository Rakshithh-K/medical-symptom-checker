const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

const SYSTEM_INSTRUCTIONS = `
You are an educational AI health information assistant.

Your task is to explain possible health conditions based on:
1. User-selected symptoms.
2. Predictions from an experimental Random Forest model.
3. Disease descriptions supplied by the application.

Important rules:
- Never claim to diagnose a disease.
- Do not present model scores as medical probabilities.
- Explain why each predicted condition might relate to the symptoms.
- Do not invent symptoms or medical facts.
- Clearly communicate uncertainty.
- Provide general health information only.
- Recommend professional medical evaluation when appropriate.
- Never prescribe medication or dosage.
- Return valid JSON only.

IMPORTANT FOLLOW-UP QUESTION REQUIREMENTS:

Generate 3 to 5 relevant follow-up questions based on the selected symptoms and predicted conditions.

For EVERY question, you MUST generate:
1. The question itself.
2. An explanation of what a YES answer might indicate.
3. An explanation of what a NO answer might indicate.

Both explanations must be generated in this same response.

Do not generate questions without their Yes and No explanations.

Keep explanations medically cautious, simple, and informative.
Do not claim that a Yes or No answer confirms or rules out a disease.
Do not make assumptions about symptoms the user has not reported.

Use this exact JSON structure:

{
    "summary": "string",
    "symptomAnalysis": "string",
    "possibleReasons": [
        {
            "disease": "string",
            "explanation": "string",
            "relatedSymptoms": ["string"]
        }
    ],
    "additionalQuestions": [
        {
            "question": "string",
            "yesExplanation": "string",
            "noExplanation": "string"
        }
    ],
    "generalAdvice": ["string"]
}
`;


// Parse JSON responses from AI providers
const parseAIResponse = (response) => {
    if (!response || typeof response !== "string") {
        throw new Error("AI returned an empty response");
    }

    const cleanedResponse = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(cleanedResponse);
    } catch (error) {
        throw new Error("AI returned an invalid JSON response");
    }
};


// Generate explanation using Gemini
const generateWithGemini = async (input) => {

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing");
    }

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.interactions.create({
        model: "gemini-3.6-flash",

        input: `${SYSTEM_INSTRUCTIONS}

Analyze the following symptom information:

${JSON.stringify(input)}

Return only valid JSON following the specified structure.
Every additional question must contain question, yesExplanation, and noExplanation.`,

        store: false
    });

    return parseAIResponse(response.output_text);
};


// Generate explanation using OpenAI
const generateWithOpenAI = async (input) => {

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is missing");
    }

    const OpenAI = require("openai");

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
        model: "gpt-4.1-mini",

        instructions: `${SYSTEM_INSTRUCTIONS}

You must return the response in valid JSON format.
The response must contain the word JSON as requested.
Do not include Markdown or text outside the JSON object.`,

        input: `
Analyze the following symptom information.

Return the explanation in JSON format only.

${JSON.stringify(input)}
`,

        text: {
            format: {
                type: "json_object"
            }
        },

        store: false
    });

    return parseAIResponse(response.output_text);
};


// Get disease information from Flask service
const getDiseaseInformation = async (diseaseName) => {

    if (!ML_SERVICE_URL) {
        throw new Error("ML_SERVICE_URL is missing");
    }

    const response = await axios.get(
        `${ML_SERVICE_URL}/diseases/${encodeURIComponent(diseaseName)}`,
        {
            timeout: 5000
        }
    );

    return response.data.data;
};


// Generate local Mock explanation
const generateMockExplanation = async (symptoms, predictions) => {

    const diseaseInformation = await Promise.all(
        predictions.map(async (prediction) => {

            try {
                const disease = await getDiseaseInformation(
                    prediction.disease
                );

                return {
                    disease: prediction.disease,
                    description: disease.description,

                    relatedSymptoms: disease.symptoms.filter(
                        (symptom) => symptoms.includes(symptom)
                    ),

                    precautions: disease.precautions
                };

            } catch (error) {

                console.error(
                    `Mock information failed for ${prediction.disease}:`,
                    error.message
                );

                return {
                    disease: prediction.disease,
                    description: "Disease information is unavailable.",
                    relatedSymptoms: [],
                    precautions: []
                };
            }
        })
    );

    return {
        summary:
            "This explanation uses information from the application's local disease dataset. No external AI provider was contacted.",

        symptomAnalysis:
            `You selected: ${symptoms.join(", ")}.`,

        possibleReasons: diseaseInformation,

        additionalQuestions: [
            {
                question: "How long have you experienced these symptoms?",
                yesExplanation: "The duration of symptoms is important. Persistent symptoms need medical evaluation.",
                noExplanation: "If symptoms started recently, monitor their duration and any changes."
            },
            {
                question: "Are your symptoms getting worse?",
                yesExplanation: "Worsening symptoms need medical evaluation. Seek urgent care if symptoms become severe.",
                noExplanation: "Stable symptoms are useful information, but persistent symptoms still deserve evaluation."
            },
            {
                question: "Have you noticed any other symptoms?",
                yesExplanation: "Additional symptoms help provide a more complete picture for a healthcare professional.",
                noExplanation: "You have not noticed additional symptoms. Continue monitoring for any changes."
            }
        ],

        generalAdvice: [
            "Monitor your symptoms.",
            "Keep track of any changes.",
            "Consult a qualified healthcare professional for an appropriate evaluation."
        ]
    };
};


// Validate AI response structure
const validateExplanation = (explanation) => {

    if (
        !explanation ||
        !Array.isArray(explanation.possibleReasons) ||
        !Array.isArray(explanation.additionalQuestions) ||
        !Array.isArray(explanation.generalAdvice)
    ) {
        throw new Error("AI returned an incomplete explanation");
    }

    const validQuestions = explanation.additionalQuestions.every(
        (item) =>
            typeof item.question === "string" &&
            typeof item.yesExplanation === "string" &&
            typeof item.noExplanation === "string"
    );

    if (!validQuestions) {
        throw new Error("AI returned incomplete follow-up answers");
    }

    return explanation;
};


// Main AI provider selection and fallback
const generateAIExplanation = async ({
    provider,
    symptoms,
    predictions
}) => {

    if (!["gemini", "openai", "mock"].includes(provider)) {
        throw new Error("Invalid AI provider selected");
    }

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
        throw new Error("At least one symptom is required");
    }

    if (!Array.isArray(predictions) || predictions.length === 0) {
        throw new Error("At least one disease prediction is required");
    }

    const input = {
        selectedSymptoms: symptoms,
        predictions
    };


    // MOCK MODE
    if (provider === "mock") {

        const explanation = await generateMockExplanation(
            symptoms,
            predictions
        );

        return {
            provider: "mock",
            fallbackUsed: false,
            explanation
        };
    }


    // Determine provider execution order
    const providers = provider === "gemini"
        ? ["gemini", "openai"]
        : ["openai", "gemini"];


    // Try primary provider and secondary provider
    for (const currentProvider of providers) {

        try {

            let explanation;

            if (currentProvider === "gemini") {

                console.log("Trying Gemini...");

                explanation = await generateWithGemini(input);

            } else {

                console.log("Trying OpenAI...");

                explanation = await generateWithOpenAI(input);
            }

            explanation = validateExplanation(explanation);

            console.log(
                `${currentProvider} generated the explanation successfully.`
            );

            return {
                provider: currentProvider,
                fallbackUsed: currentProvider !== provider,
                explanation
            };

        } catch (error) {

            console.error(
                `${currentProvider} failed:`,
                error.message
            );
        }
    }


    // Both AI providers failed.
    console.log("Both AI providers failed. Switching to Mock mode.");

    const explanation = await generateMockExplanation(
        symptoms,
        predictions
    );

    return {
        provider: "mock",
        fallbackUsed: true,
        explanation
    };
};


module.exports = {
    generateAIExplanation
};
