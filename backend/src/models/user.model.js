const mongoose = require("mongoose");

const { ROLES } = require("../config/roles");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    job_title: { type: mongoose.Schema.Types.ObjectId, ref: "JobTitle" },
    role: { type: String, enum: ROLES, default: "viewer" },
    is_active: { type: Boolean, default: true },
    // Set by an admin password reset or account creation (D22): until the user picks their own
    // password, every endpoint except GET /auth/me and PUT /auth/password answers 403.
    must_change_password: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
