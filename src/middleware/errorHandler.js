/**
 * Centralized error handling
 * - Normalizes errors to the required response shape:
 *   { success:false, message:"Error message" }
 */
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const message =
    err?.name === "CastError"
      ? "Invalid resource id"
      : err?.code === 11000
        ? "Duplicate key error"
        : err?.message || "Server error";

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };

