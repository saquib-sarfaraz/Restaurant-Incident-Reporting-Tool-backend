const dotenv = require("dotenv");
dotenv.config();

const { createApp } = require("./app");
const { connectDB } = require("./config/db");

/**
 * Server bootstrap
 * - Loads env
 * - Connects MongoDB
 * - Starts HTTP server (Render-friendly: listens on PORT)
 */
const start = async () => {
  // eslint-disable-next-line no-console
  console.log("[boot] Starting backend with env:", {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 5000,
    MONGODB_URI_SET: Boolean(process.env.MONGODB_URI),
    GROQ_API_KEY_SET: Boolean(process.env.GROQ_API_KEY)
  });

  await connectDB();

  const app = createApp();
  const basePort = Number(process.env.PORT || 5000);

  /**
   * Dev-friendly port handling
   * - If PORT is already in use locally, try the next ports instead of crashing.
   * - In production (e.g., Render), we should NOT auto-shift ports.
   */
  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const maxAttempts = isProd ? 1 : 10;

  let attempt = 0;
  const listen = (port) => {
    const server = app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${port} (${process.env.NODE_ENV || "development"})`);
    });

    server.on("error", (err) => {
      if (!isProd && err && err.code === "EADDRINUSE" && attempt < maxAttempts - 1) {
        attempt += 1;
        const nextPort = port + 1;
        // eslint-disable-next-line no-console
        console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
        return listen(nextPort);
      }

      // eslint-disable-next-line no-console
      console.error("Failed to start server:", err);
      process.exit(1);
    });
  };

  listen(basePort);
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
