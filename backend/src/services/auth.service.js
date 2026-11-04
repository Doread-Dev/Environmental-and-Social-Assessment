const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { permissionsFor } = require("../config/permissions");
const { PASSWORD_MIN_LENGTH } = require("../validators/auth.validator");
const { maxUploadBytes, ALLOWED_EXTENSIONS } = require("../config/files");

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });

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

// The user (with must_change_password), what their role may do (D35) and the password policy.
const getMe = async (userId) => {
  const user = await User.findById(userId).populate("job_title");
  return {
    user,
    permissions: permissionsFor(user.role),
    password_rules: { min_length: PASSWORD_MIN_LENGTH },
    // So the client can check a file before sending it; the server checks again (D47).
    upload_rules: { max_bytes: maxUploadBytes(), extensions: ALLOWED_EXTENSIONS },
  };
};

// D23: every user changes their own password; this also ends a forced change (D22). 400, not 401,
// for a wrong current password: the session itself is valid.
const changePassword = async (user, currentPassword, newPassword) => {
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, "Current password is incorrect");
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from the current password");
  }
  user.password = newPassword; // hashed by the model's pre-save hook
  user.must_change_password = false;
  await user.save();
  return getMe(user._id);
};

module.exports = {
  login,
  getMe,
  changePassword,
};
