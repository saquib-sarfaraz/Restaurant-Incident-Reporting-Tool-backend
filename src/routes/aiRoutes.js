const express = require("express");
const { analyzeIncident, getInsights } = require("../controllers/aiController");

/**
 * AI routes
 * Base URL: /api/ai
 * - POST /analyze  -> Groq analyzer (JSON output)
 * - GET  /insights -> Aggregated operational insights (manager-only)
 */
const router = express.Router();

router.post("/analyze", analyzeIncident);
router.get("/insights", getInsights);

module.exports = router;

