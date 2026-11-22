const express = require("express");

const {
    getSymptoms,
    createSymptomCheck,
    getHistory,
    getHistoryById,
    updateSymptomCheck,
    deleteSymptomCheck
} = require("../controllers/symptomController");

const router = express.Router();

router.get("/", getSymptoms);

router.post("/check", createSymptomCheck);

router.get("/history", getHistory);

router.get("/history/:id", getHistoryById);

router.put("/history/:id", updateSymptomCheck);

router.delete("/history/:id", deleteSymptomCheck);

module.exports = router;