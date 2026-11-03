const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

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

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return forwardAuthError(res, next, new ApiError(401, "Unauthorized"));
    if (!roles.length || roles.includes(req.user.role)) return next();
    return forwardAuthError(res, next, new ApiError(403, "Forbidden"));
  };

module.exports = {
  auth,
  requireRole,
  bearerToken,
  verifyToken,
};
