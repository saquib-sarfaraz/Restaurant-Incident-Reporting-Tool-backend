const mongoose = require("mongoose");

/**
 * Incident model (MongoDB / Mongoose)
 * - Enforces required fields and enums for consistent data quality.
 * - `timestamps: true` automatically manages `createdAt` and `updatedAt`.
 */
const incidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "title is required"], trim: true },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: "Other"
    },
    location: {
      type: String,
      required: [true, "location is required"],
      trim: true
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low"
    },
    status: {
      type: String,
      enum: ["Open", "Under Review", "In Progress", "Resolved"],
      default: "Open"
    },
    /**
     * Mock role support (no JWT):
     * - Stored for auditability and to support "staff vs manager" reporting views.
     */
    role: {
      type: String,
      enum: ["staff", "manager"],
      default: "staff"
    },
    reportedBy: { type: String, trim: true, default: "anonymous" },
    assignedManager: { type: String, trim: true, default: "" },
    resolutionNotes: { type: String, trim: true, default: "" },
    storeName: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

/**
 * Helpful index for fast search/filtering (internship-assessment friendly).
 * - We use regex search in controllers; indexing key fields reduces scan cost.
 */
incidentSchema.index({ status: 1, severity: 1, category: 1, storeName: 1 });
incidentSchema.index({ title: 1 });
incidentSchema.index({ description: 1 });

module.exports = mongoose.model("Incident", incidentSchema);
