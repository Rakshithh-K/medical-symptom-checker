const express = require("express");

const {
    generateExplanation
} = require("../controllers/aiController");

const router = express.Router();

router.post("/explain", generateExplanation);

module.exports = router;