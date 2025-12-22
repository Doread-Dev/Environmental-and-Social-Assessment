const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) throw new ApiError(401, "Unauthorized");
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "Unauthorized");
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Unauthorized"));
  if (!roles.length || roles.includes(req.user.role)) return next();
  return next(new ApiError(403, "Forbidden"));
};

module.exports = {
  auth,
  requireRole,
};

