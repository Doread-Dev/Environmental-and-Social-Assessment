const User = require("../models/user.model");
const JobTitle = require("../models/jobTitle.model");
const ApiError = require("../utils/ApiError");
const { can } = require("../config/permissions");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");

// What a non-admin sees: enough for the "Responsible" pickers, active users only (D4).
const PICKER_FIELDS = "name job_title is_active";

// Admin (manage_users): every account, inactive ones included. Everyone else: active users with
// minimal fields.
const listUsers = async (viewer) => {
  if (can(viewer.role, "manage_users")) {
    return User.find().populate("job_title").sort({ createdAt: -1 });
  }
  return User.find({ is_active: true }, PICKER_FIELDS).populate("job_title").sort({ name: 1 });
};

const findUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// "" or null clears the job title; an id must exist.
const resolveJobTitle = async (jobTitle) => {
  if (!jobTitle) return null;
  if (!(await JobTitle.exists({ _id: jobTitle }))) throw new ApiError(400, "Unknown job title");
  return jobTitle;
};

// The last active admin can be neither deactivated nor given another role: someone must still be
// able to manage users (the break-glass CLI aside).
const assertNotLastActiveAdmin = async (user, message) => {
  if (user.role !== "admin" || !user.is_active) return;
  const others = await User.countDocuments({
    _id: { $ne: user._id },
    role: "admin",
    is_active: true,
  });
  if (others === 0) throw new ApiError(409, message);
};

const populated = (user) => user.populate("job_title");

// New accounts get a temporary password, returned once, that must be changed at first login.
const createUser = async ({ job_title: jobTitle, ...fields }) => {
  const email = fields.email.toLowerCase();
  if (await User.exists({ email })) throw new ApiError(409, "Email already in use");
  const temporaryPassword = generateTemporaryPassword();
  const user = await User.create({
    ...fields,
    email,
    job_title: await resolveJobTitle(jobTitle),
    password: temporaryPassword,
    must_change_password: true,
  });
  return { user: await populated(user), temporary_password: temporaryPassword };
};

const updateUser = async (id, { job_title: jobTitle, ...fields }) => {
  const user = await findUser(id);
  if (fields.role && fields.role !== user.role) {
    await assertNotLastActiveAdmin(user, "Cannot change the role of the last active admin");
  }
  Object.assign(user, fields);
  if (jobTitle !== undefined) user.job_title = await resolveJobTitle(jobTitle);
  await user.save();
  return populated(user);
};

// Deactivated users cannot log in and their tokens stop working on the next request (D4).
const setActive = async (id, active) => {
  const user = await findUser(id);
  if (!active) await assertNotLastActiveAdmin(user, "Cannot deactivate the last active admin");
  user.is_active = active;
  await user.save();
  return populated(user);
};

// D22: a new one-time password, shown to the admin once; the user must change it at next login.
// Until then the account's existing tokens only reach /auth/me and /auth/password.
const resetPassword = async (id) => {
  const user = await findUser(id);
  const temporaryPassword = generateTemporaryPassword();
  user.password = temporaryPassword;
  user.must_change_password = true;
  await user.save();
  return { user: await populated(user), temporary_password: temporaryPassword };
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  setActive,
  resetPassword,
};
