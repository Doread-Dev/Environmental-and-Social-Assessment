// Break-glass password reset for any account (D24), e.g. when the only admin is locked out.
// Run it on the server; it talks to MongoDB directly, no login needed.
//
// Usage (from backend/, MONGODB_URI from .env):
//   node scripts/reset-password.js [--activate]                 # asks for email and password
//   RESET_EMAIL=... RESET_PASSWORD=... node scripts/reset-password.js [--activate]
// --activate also reactivates a deactivated account. The password is never printed.
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/user.model");
const { password: passwordRule } = require("../src/validators/auth.validator");
const { valueFrom } = require("./lib/prompt");

async function main() {
  const activate = process.argv.includes("--activate");
  const email = await valueFrom("RESET_EMAIL", "Email: ");
  const password = await valueFrom("RESET_PASSWORD", "New password: ", { hidden: true });

  // Same password policy as PUT /auth/password.
  const { error } = passwordRule.required().validate(password);
  if (error) throw new Error(error.details.map((d) => d.message).join(", "));

  await connectDB();
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) throw new Error(`No user with email ${email}`);

    user.password = password; // hashed by the model's pre-save hook
    // The operator chose this password: no forced change at next login (unlike an admin reset).
    user.must_change_password = false;
    if (activate) user.is_active = true;
    await user.save();

    console.log(`Password reset for ${user.email}${activate ? " (account active)" : ""}`);
    if (!user.is_active) {
      console.warn("Warning: this account is deactivated. Re-run with --activate to enable it.");
    }
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
