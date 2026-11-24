const express = require("express");

const {
    getDiseases,
    getDiseaseByName
} = require("../controllers/diseaseController");

const router = express.Router();

router.get("/", getDiseases);

router.get("/:name", getDiseaseByName);

module.exports = router;