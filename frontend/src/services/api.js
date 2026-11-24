import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Fetch available symptoms
export const getSymptoms = async () => {
    const response = await api.get("/symptoms");
    return response.data;
};

// Create a symptom check
export const createSymptomCheck = async (symptoms) => {
    const response = await api.post("/symptoms/check", {
        symptoms
    });
    return response.data;
};

// Fetch symptom history
export const getHistory = async () => {
    const response = await api.get("/symptoms/history");
    return response.data;
};

// Fetch one history record
export const getHistoryById = async (id) => {
    const response = await api.get(`/symptoms/history/${id}`);
    return response.data;
};

// Update a symptom check
export const updateSymptomCheck = async (id, symptoms) => {
    const response = await api.put(`/symptoms/history/${id}`, {
        symptoms
    });
    return response.data;
};

// Delete a symptom check
export const deleteSymptomCheck = async (id) => {
    const response = await api.delete(`/symptoms/history/${id}`);
    return response.data;
};

// Fetch all diseases
export const getDiseases = async (search = "") => {
    const response = await api.get("/diseases", {
        params: { search }
    });

    return response.data;
};

// Fetch individual disease details
export const getDiseaseByName = async (name) => {
    const response = await api.get(
        `/diseases/${encodeURIComponent(name)}`
    );

    return response.data;
};

// Generate AI health explanation
export const generateAIExplanation = async (symptoms, predictions) => {
    const response = await api.post("/ai/explain", {
        symptoms,
        predictions
    });

    return response.data;
};