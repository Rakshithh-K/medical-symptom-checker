require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const symptomRoutes = require("./routes/symptomRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/symptoms", symptomRoutes);

// Database connection
connectDB();

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Medical Symptom Checker Backend is running"
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});