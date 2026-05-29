const Incident = require("../models/Incident");
const { analyzeIncidentDescription } = require("../services/groqService");

const asyncHandler =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * POST /api/ai/analyze
 * - Sends incident description to Groq (llama-3.3-70b-versatile).
 * - Forces JSON output (via Groq JSON mode) and returns it to the client.
 */
const analyzeIncident = asyncHandler(async (req, res) => {
  const { description } = req.body || {};
  if (!description) {
    return res.status(400).json({ success: false, message: "description is required" });
  }

  const analysis = await analyzeIncidentDescription(description);
  res.json({ success: true, data: analysis });
});

/**
 * GET /api/ai/insights
 * Manager AI insights (no LLM required):
 * - Uses MongoDB aggregation over stored incidents.
 * - Returns required shape:
 *   { criticalIncidents, topCategory, averageSeverity, insight }
 */
const getInsights = asyncHandler(async (req, res) => {
  if (req.user?.role !== "manager") {
    return res.status(403).json({ success: false, message: "Manager role required" });
  }

  const severityToScore = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4
  };

  // Aggregation: count critical, top category, and average severity score.
  const [agg] = await Incident.aggregate([
    {
      $addFields: {
        severityScore: {
          $switch: {
            branches: [
              { case: { $eq: ["$severity", "Low"] }, then: 1 },
              { case: { $eq: ["$severity", "Medium"] }, then: 2 },
              { case: { $eq: ["$severity", "High"] }, then: 3 },
              { case: { $eq: ["$severity", "Critical"] }, then: 4 }
            ],
            default: 2
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        criticalIncidents: { $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] } },
        avgSeverityScore: { $avg: "$severityScore" }
      }
    }
  ]);

  const categoryAgg = await Incident.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const topCategory = categoryAgg?.[0]?._id || "Other";

  const avgScore = agg?.avgSeverityScore || 0;
  const roundScore = Math.max(1, Math.min(4, Math.round(avgScore || 1)));
  const averageSeverity =
    Object.entries(severityToScore).find(([, score]) => score === roundScore)?.[0] || "Medium";

  // Week-over-week insight for the top category.
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeekCount, lastWeekCount] = await Promise.all([
    Incident.countDocuments({ category: topCategory, createdAt: { $gte: sevenDaysAgo } }),
    Incident.countDocuments({
      category: topCategory,
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    })
  ]);

  let insight = `${topCategory} incidents are stable this week.`;
  if (lastWeekCount > 0) {
    const deltaPct = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
    if (deltaPct > 0) insight = `${topCategory} incidents have increased by ${deltaPct}% this week.`;
    if (deltaPct < 0) insight = `${topCategory} incidents have decreased by ${Math.abs(deltaPct)}% this week.`;
  } else if (thisWeekCount > 0) {
    insight = `${topCategory} incidents have increased this week.`;
  }

  res.json({
    success: true,
    data: {
      criticalIncidents: agg?.criticalIncidents || 0,
      topCategory,
      averageSeverity,
      insight
    }
  });
});

module.exports = { analyzeIncident, getInsights };

