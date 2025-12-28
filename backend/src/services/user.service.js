const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const listUsers = async () => {
  // password is stripped by toJSON
  const users = await User.find().sort({ createdAt: -1 });
  return users;
};

const getUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

module.exports = {
  listUsers,
  getUser,
};

