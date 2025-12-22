const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "12h",
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
  const token = signToken(user);
  return { user, token };
};

module.exports = {
  register,
  login,
};

