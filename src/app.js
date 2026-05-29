const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const incidentRoutes = require("./routes/incidentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { mockAuth } = require("./middleware/mockAuth");
const { notFound, errorHandler } = require("./middleware/errorHandler");

/**
 * Express app composition (clean + modular)
 * - Security: helmet, rate limiting, CORS
 * - Parsing: express.json()
 * - Mock roles: middleware attaching req.user
 * - Routes: /api/incidents, /api/ai
 * - Central error handling at the end
 */
const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  // Mock "user" for role-based access control without JWT.
  app.use(mockAuth);

  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  app.use("/api/incidents", incidentRoutes);
  app.use("/api/ai", aiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };

