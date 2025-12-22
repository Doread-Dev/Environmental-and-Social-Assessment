const mongoose = require("mongoose");

const roles = [
  "admin",
  "program_manager",
  "project_manager",
  "site_supervisor",
  "viewer",
];

const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    job_title: { type: mongoose.Schema.Types.ObjectId, ref: "JobTitle" },
    role: { type: String, enum: roles, default: "viewer" },
    is_active: { type: Boolean, default: true },
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

