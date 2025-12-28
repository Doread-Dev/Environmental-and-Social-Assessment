const User = require("../models/user.model");

const listUsers = async () => {
  return User.find().sort({ createdAt: -1 });
};

module.exports = {
  listUsers,
};

