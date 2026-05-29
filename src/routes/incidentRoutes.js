const express = require("express");
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  updateIncidentStatus,
  getIncidentStats
} = require("../controllers/incidentController");

/**
 * Incident routes
 * Base URL: /api/incidents
 *
 * Endpoints:
 * - POST   /           Create incident
 * - GET    /           Get incidents (filter + search supported)
 * - GET    /stats      Dashboard analytics (manager-only)
 * - GET    /:id        Get single incident
 * - PUT    /:id        Update incident
 * - DELETE /:id        Delete incident
 * - PATCH  /:id/status Manager updates status/assignment/resolutionNotes
 */
const router = express.Router();

router.get("/stats", getIncidentStats);

router.route("/").post(createIncident).get(getIncidents);

router
  .route("/:id")
  .get(getIncidentById)
  .put(updateIncident)
  .delete(deleteIncident);

router.patch("/:id/status", updateIncidentStatus);

module.exports = router;

