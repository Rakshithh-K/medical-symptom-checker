const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

// Get all diseases
const getDiseases = async (req, res) => {
    try {
        const search = req.query.search || "";

        const response = await axios.get(
            `${ML_SERVICE_URL}/diseases`,
            {
                params: { search }
            }
        );

        res.status(200).json(response.data);

    } catch (error) {
        res.status(502).json({
            status: "error",
            message: "Unable to fetch diseases"
        });
    }
};

// Get disease details
const getDiseaseByName = async (req, res) => {
    try {
        const diseaseName = req.params.name;

        const response = await axios.get(
            `${ML_SERVICE_URL}/diseases/${encodeURIComponent(diseaseName)}`
        );

        res.status(200).json(response.data);

    } catch (error) {
        res.status(error.response?.status || 502).json({
            status: "error",
            message: error.response?.data?.message ||
                "Unable to fetch disease details"
        });
    }
};

module.exports = {
    getDiseases,
    getDiseaseByName
};