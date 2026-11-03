import request from "supertest";
import { app, require } from "./app.js";

const User = require("../../src/models/user.model");
const { seedLookupData } = require("../../src/db/seed");

const ROLES = [
  "environmental_specialist",
  "program_manager",
  "project_manager",
  "environmental_focal_point",
  "viewer",
];

const TEST_PASSWORD = "test-password-123";

let userCounter = 0;

async function createUser(role = "environmental_specialist", overrides = {}) {
  userCounter += 1;
  const password = overrides.password || TEST_PASSWORD;
  const user = await User.create({
    name: `Test ${role} ${userCounter}`,
    email: `${role}.${userCounter}@example.com`,
    role,
    ...overrides,
    password,
  });
  return { user, password };
}

// Creates a user with the given role and logs in through the real API.
async function loginAs(role = "environmental_specialist", overrides = {}) {
  const { user, password } = await createUser(role, overrides);
  const res = await request(app).post("/api/v1/auth/login").send({ email: user.email, password });
  if (res.status !== 200) throw new Error(`Login as ${role} failed: ${res.status}`);
  return { user, token: res.body.data.token };
}

async function seedLookups() {
  await seedLookupData();
}

export { ROLES, TEST_PASSWORD, createUser, loginAs, seedLookups };
