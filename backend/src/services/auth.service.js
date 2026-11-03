const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { permissionsFor } = require("../config/permissions");

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });

const register = async (payload) => {
  const exists = await User.findOne({ email: payload.email.toLowerCase() });
  if (exists) throw new ApiError(400, "Email already in use");
  const user = await User.create(payload);
  const token = signToken(user);
  return { user, token };
};

const login = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(401, "Invalid credentials");
  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Invalid credentials");
  // Checked after the password, so the message never reveals account state to a guesser.
  if (!user.is_active) throw new ApiError(403, "Account is deactivated");
  const token = signToken(user);
  return { user, token };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).populate("job_title");
  return { user, permissions: permissionsFor(user.role) };
};

module.exports = {
  register,
  login,
  getMe,
};
