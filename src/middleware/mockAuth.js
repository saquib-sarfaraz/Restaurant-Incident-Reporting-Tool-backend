/**
 * Mock auth / role handling (NO JWT required)
 * - Reads `x-user-role` and `x-user-name` headers.
 * - Attaches a minimal `req.user` used by controllers for access control.
 */
const mockAuth = (req, _res, next) => {
  const roleHeader = String(req.header("x-user-role") || "").toLowerCase();
  const role = roleHeader === "manager" ? "manager" : "staff";

  const name = String(req.header("x-user-name") || "anonymous").trim() || "anonymous";

  req.user = { role, name };
  next();
};

module.exports = { mockAuth };

