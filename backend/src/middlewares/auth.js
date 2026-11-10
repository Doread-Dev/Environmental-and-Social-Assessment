const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { can, isPermission } = require("../config/permissions");

// Credential failures reported by jsonwebtoken. Any other verify error (e.g. a broken
// server key) is a server error, not the client's fault.
const credentialErrors = new Set([
  "jwt malformed",
  "invalid token",
  "jwt signature is required",
  "invalid algorithm",
  "invalid signature",
  "invalid nbf value",
  "invalid exp value",
]);

// Marks the response so errorHandler hides internals (message of 5xx, stack) for auth errors.
const forwardAuthError = (res, next, error) => {
  res.locals.authenticationError = true;
  return next(error);
};

// Returns the verified token payload, or null when the token is not valid credentials.
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (
      err instanceof jwt.TokenExpiredError ||
      err instanceof jwt.NotBeforeError ||
      (err instanceof jwt.JsonWebTokenError && credentialErrors.has(err.message))
    ) {
      return null;
    }
    throw err;
  }
};

const bearerToken = (req) => {
  const header = req.headers.authorization;
  const match = typeof header === "string" && /^Bearer (\S+)$/.exec(header);
  return match ? match[1] : null;
};

const auth = async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (!token) throw new ApiError(401, "Unauthorized");
    const payload = verifyToken(token);
    if (!payload) throw new ApiError(401, "Unauthorized");
    const user = await User.findById(payload.sub);
    // Deactivated users lose access immediately, even with an unexpired token.
    if (!user || !user.is_active) throw new ApiError(401, "Unauthorized");
    req.user = user;
    next();
  } catch (err) {
    forwardAuthError(res, next, err);
  }
};

// Route check by permission name (D66): the role → permission map lives in config/permissions.js
// only. An unknown name fails when the routes are loaded, not on the first request.
const requirePermission = (name) => {
  if (!isPermission(name)) throw new Error(`requirePermission: unknown permission "${name}"`);
  const check = (req, res, next) => {
    if (!req.user) return forwardAuthError(res, next, new ApiError(401, "Unauthorized"));
    if (can(req.user, name)) return next();
    return forwardAuthError(res, next, new ApiError(403, "Forbidden"));
  };
  // Read by the route-table tests.
  check.permission = name;
  return check;
};

// D22: after an admin reset (or on a new account) the user must pick their own password first.
// Mounted after auth() for every /api/v1 route except GET /auth/me and PUT /auth/password.
const PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";

const requirePasswordChanged = (req, res, next) => {
  if (!req.user?.must_change_password) return next();
  const error = new ApiError(403, "You must change your password before continuing");
  error.code = PASSWORD_CHANGE_REQUIRED;
  return next(error);
};

module.exports = {
  auth,
  requirePermission,
  requirePasswordChanged,
  PASSWORD_CHANGE_REQUIRED,
  bearerToken,
  verifyToken,
};
