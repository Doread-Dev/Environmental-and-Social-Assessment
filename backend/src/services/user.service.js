const User = require("../models/user.model");
const JobTitle = require("../models/jobTitle.model");
const ApiError = require("../utils/ApiError");
const { can } = require("../config/permissions");
const { generateTemporaryPassword } = require("../utils/temporaryPassword");
const audit = require("./audit.service");
const { atomic } = require("../utils/transaction");

// What a non-admin sees: enough for the "Responsible" pickers, active users only (D4).
const PICKER_FIELDS = "name job_title is_active";

// Admin (manage_users): every account, inactive ones included. Everyone else: active users with
// minimal fields.
const listUsers = async (viewer) => {
  if (can(viewer, "manage_users")) {
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

// An admin cannot reset, deactivate or change the role of their own account here (v2.0.1): a
// self reset forced a password change before the one-time password could be shown and locked the
// only admin out. The own password changes in the profile (PUT /auth/password).
const assertNotSelf = (user, actor, message) => {
  if (actor && String(user._id) === String(actor._id)) throw new ApiError(409, message);
};

const populated = (user) => user.populate("job_title");

// Audit log (D65): the account acted on, by its copied name; never a password.
const userTarget = (user) => ({ type: "user", id: user._id, label: user.name });
const identity = (user) => ({ name: user.name, email: user.email });

// New accounts get a temporary password, returned once, that must be changed at first login.
const createUser = async ({ job_title: jobTitle, ...fields }, actor) => {
  const email = fields.email.toLowerCase();
  if (await User.exists({ email })) throw new ApiError(409, "Email already in use");
  const temporaryPassword = generateTemporaryPassword();
  const jobTitleId = await resolveJobTitle(jobTitle);
  // Each change and its entry in one transaction on a replica set (phase 11).
  const user = await atomic(async () => {
    const created = await User.create({
      ...fields,
      email,
      job_title: jobTitleId,
      password: temporaryPassword,
      must_change_password: true,
    });
    await audit.record(actor, "user.create", {
      target: userTarget(created),
      snapshot: { ...identity(created), role: created.role },
    });
    return created;
  });
  return { user: await populated(user), temporary_password: temporaryPassword };
};

// Only a role change is logged; name and job title edits are not (D65).
const updateUser = async (id, { job_title: jobTitle, ...fields }, actor) => {
  const user = await findUser(id);
  const oldRole = user.role;
  if (fields.role && fields.role !== oldRole) {
    await assertNotLastActiveAdmin(user, "Cannot change the role of the last active admin");
    assertNotSelf(user, actor, "You cannot change your own role");
  }
  Object.assign(user, fields);
  if (jobTitle !== undefined) user.job_title = await resolveJobTitle(jobTitle);
  await atomic(async () => {
    await user.save();
    if (user.role !== oldRole) {
      await audit.record(actor, "user.role_change", {
        target: userTarget(user),
        snapshot: identity(user),
        details: { from: oldRole, to: user.role },
      });
    }
  });
  return populated(user);
};

// Deactivated users cannot log in and their tokens stop working on the next request (D4).
const setActive = async (id, active, actor) => {
  const user = await findUser(id);
  if (!active) {
    await assertNotLastActiveAdmin(user, "Cannot deactivate the last active admin");
    assertNotSelf(user, actor, "You cannot deactivate your own account");
  }
  user.is_active = active;
  await atomic(async () => {
    await user.save();
    await audit.record(actor, active ? "user.reactivate" : "user.deactivate", {
      target: userTarget(user),
      snapshot: identity(user),
    });
  });
  return populated(user);
};

// D22: a new one-time password, shown to the admin once; the user must change it at next login.
// Until then the account's existing tokens only reach /auth/me and /auth/password.
const resetPassword = async (id, actor) => {
  const user = await findUser(id);
  assertNotSelf(
    user,
    actor,
    "You cannot reset your own password here. Change it in your profile (Change password)."
  );
  const temporaryPassword = generateTemporaryPassword();
  user.password = temporaryPassword;
  user.must_change_password = true;
  await atomic(async () => {
    await user.save();
    await audit.record(actor, "user.reset_password", {
      target: userTarget(user),
      snapshot: identity(user),
    });
  });
  return { user: await populated(user), temporary_password: temporaryPassword };
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  setActive,
  resetPassword,
};
