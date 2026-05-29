const Groq = require("groq-sdk");

/**
 * Groq service wrapper
 * - Keeps SDK details out of controllers (clean architecture).
 * - Uses JSON mode to force valid JSON output for the analyzer endpoint.
 */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const analyzeIncidentDescription = async (description) => {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error("GROQ_API_KEY is not set");
    err.statusCode = 500;
    throw err;
  }

  // eslint-disable-next-line no-console
  console.log("[groq] Analyzing incident description (chars):", String(description || "").length);

  const system = [
    "You are an operations assistant for a restaurant chain.",
    "Analyze the incident description.",
    "Return JSON only.",
    "Format:",
    '{"category":"","severity":"","summary":"","recommendedAction":""}',
    "Allowed Categories: POS Issue, Delivery Delay, Inventory, Kitchen Equipment, Customer Complaint, Staff Related, Other",
    "Allowed Severity: Low, Medium, High, Critical"
  ].join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: String(description || "") }
    ]
  });

  const content = completion?.choices?.[0]?.message?.content || "{}";
  // eslint-disable-next-line no-console
  console.log("[groq] Received response (chars):", String(content).length);
  return JSON.parse(content);
};

module.exports = { analyzeIncidentDescription };
