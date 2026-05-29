const Incident = require("../models/Incident");

/**
 * Controller helpers
 * - Minimal async wrapper to forward exceptions to centralized error middleware.
 */
const asyncHandler =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Filtering + Search
 * - Supports query filters: category, severity, status, storeName
 * - Supports `search` across title, description, storeName (case-insensitive)
 */
const buildIncidentQuery = (req) => {
  const { category, severity, status, storeName, search } = req.query;
  const query = {};

  if (category) query.category = String(category);
  if (severity) query.severity = String(severity);
  if (status) query.status = String(status);
  if (storeName) query.storeName = String(storeName);

  if (search) {
    const pattern = new RegExp(String(search), "i");
    query.$or = [{ title: pattern }, { description: pattern }, { storeName: pattern }];
  }

  return query;
};

/**
 * POST /api/incidents
 * Staff can create incidents (manager allowed too for convenience).
 */
const createIncident = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  const incident = await Incident.create({
    title: payload.title,
    description: payload.description,
    category: payload.category,
    location: payload.location,
    severity: payload.severity,
    status: payload.status,
    role: req.user?.role || "staff",
    reportedBy: req.user?.name || payload.reportedBy,
    storeName: payload.storeName
  });

  res.status(201).json({ success: true, data: incident });
});

/**
 * GET /api/incidents
 * - Staff: only their own incidents (reportedBy matches x-user-name)
 * - Manager: all incidents
 */
const getIncidents = asyncHandler(async (req, res) => {
  const filter = buildIncidentQuery(req);

  if (req.user?.role !== "manager") {
    filter.reportedBy = req.user?.name || "anonymous";
  }

  const incidents = await Incident.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: incidents });
});

/**
 * GET /api/incidents/:id
 * - Staff: can view only their own incident
 * - Manager: can view any incident
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  if (req.user?.role !== "manager" && incident.reportedBy !== (req.user?.name || "anonymous")) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  res.json({ success: true, data: incident });
});

/**
 * PUT /api/incidents/:id
 * - Staff: can update their own incident (non-status fields)
 * - Manager: can update any incident (full update)
 */
const updateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  const isManager = req.user?.role === "manager";
  const isOwner = incident.reportedBy === (req.user?.name || "anonymous");
  if (!isManager && !isOwner) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const payload = req.body || {};

  // Staff shouldn't change manager workflow fields via PUT.
  if (!isManager) {
    delete payload.status;
    delete payload.assignedManager;
    delete payload.resolutionNotes;
    delete payload.reportedBy;
    delete payload.role;
  }

  Object.assign(incident, payload);
  await incident.save();

  res.json({ success: true, data: incident });
});

/**
 * DELETE /api/incidents/:id
 * - Staff: can delete their own incident
 * - Manager: can delete any incident
 */
const deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  const isManager = req.user?.role === "manager";
  const isOwner = incident.reportedBy === (req.user?.name || "anonymous");
  if (!isManager && !isOwner) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  await incident.deleteOne();
  res.json({ success: true, data: { id: req.params.id } });
});

/**
 * PATCH /api/incidents/:id/status
 * Manager-only: can update status + assignedManager + resolutionNotes.
 */
const updateIncidentStatus = asyncHandler(async (req, res) => {
  if (req.user?.role !== "manager") {
    return res.status(403).json({ success: false, message: "Manager role required" });
  }

  const incident = await Incident.findById(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  const { status, assignedManager, resolutionNotes } = req.body || {};
  if (status !== undefined) incident.status = status;
  if (assignedManager !== undefined) incident.assignedManager = assignedManager;
  if (resolutionNotes !== undefined) incident.resolutionNotes = resolutionNotes;

  await incident.save();
  res.json({ success: true, data: incident });
});

/**
 * GET /api/incidents/stats
 * Dashboard analytics (manager-only by default).
 * Returns:
 * { totalIncidents, openIncidents, resolvedIncidents, criticalIncidents }
 */
const getIncidentStats = asyncHandler(async (req, res) => {
  if (req.user?.role !== "manager") {
    return res.status(403).json({ success: false, message: "Manager role required" });
  }

  const [totalIncidents, openIncidents, resolvedIncidents, criticalIncidents] = await Promise.all([
    Incident.countDocuments({}),
    Incident.countDocuments({ status: "Open" }),
    Incident.countDocuments({ status: "Resolved" }),
    Incident.countDocuments({ severity: "Critical" })
  ]);

  res.json({
    success: true,
    data: { totalIncidents, openIncidents, resolvedIncidents, criticalIncidents }
  });
});

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  updateIncidentStatus,
  getIncidentStats
};
