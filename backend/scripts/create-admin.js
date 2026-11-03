// Creates an admin account (D7): the only way to create the first user.
//
// Usage (from backend/, MONGODB_URI from .env):
//   node scripts/create-admin.js                       # asks for name, email, password
//   ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin.js
// The password is never printed. Fails if the email is already in use (use reset-password.js).
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/user.model");
const { registerSchema } = require("../src/validators/auth.validator");
const { valueFrom } = require("./lib/prompt");

async function main() {
  const name = await valueFrom("ADMIN_NAME", "Name: ");
  const email = await valueFrom("ADMIN_EMAIL", "Email: ");
  const password = await valueFrom("ADMIN_PASSWORD", "Password: ", { hidden: true });

  // Same rules as POST /auth/register (role is set here, not by the caller).
  const { error, value } = registerSchema.validate({ name, email, password });
  if (error) throw new Error(error.details.map((d) => d.message).join(", "));

  await connectDB();
  try {
    if (await User.exists({ email: value.email.toLowerCase() })) {
      throw new Error(`A user with email ${value.email} already exists (use reset-password.js)`);
    }
    const user = await User.create({ ...value, role: "admin", is_active: true });
    console.log(`Admin created: ${user.email}`);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
