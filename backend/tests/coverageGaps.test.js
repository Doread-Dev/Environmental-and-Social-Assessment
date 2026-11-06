// Phase 12 (D76 3): modules with logic that had no direct test — the error handler's branches,
// ApiError, the monitoring record read by id, the MongoDB connection failure and a real server
// start (src/server.js: settings → MongoDB → listen → /health → clean shutdown).
import { afterEach, describe, expect, it, vi } from "vitest";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, loginAs, seedLookups } from "./helpers/fixtures.js";

const errorHandler = require("../../src/middlewares/errorHandler");
const ApiError = require("../../src/utils/ApiError");
const connectDB = require("../../src/config/database");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const Indicator = require("../../src/models/indicator.model");

/** Runs the error handler on `err` and returns { status, body }. */
function handle(err, { authError = false, env = "test" } = {}) {
  const saved = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  const res = {
    locals: authError ? { authenticationError: true } : {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    errorHandler(err, {}, res, () => {});
  } finally {
    process.env.NODE_ENV = saved;
  }
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

describe("errorHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("turns a Mongoose validation error into 400 with every message", () => {
    const err = new mongoose.Error.ValidationError();
    err.addError("title", new mongoose.Error.ValidatorError({ message: "Title is required" }));
    err.addError(
      "location",
      new mongoose.Error.ValidatorError({ message: "Location is required" })
    );
    expect(handle(err)).toEqual({
      status: 400,
      body: { success: false, error: "Title is required, Location is required" },
    });
  });

  it("turns a Joi error into 400", () => {
    const err = Object.assign(new Error("x"), {
      isJoi: true,
      details: [{ message: '"a" is required' }, { message: '"b" must be a number' }],
    });
    expect(handle(err).body.error).toBe('"a" is required, "b" must be a number');
    expect(handle(err).status).toBe(400);
  });

  it("maps a cast error to 404 and a duplicate key to 409", () => {
    expect(handle(Object.assign(new Error("Cast"), { name: "CastError" })).status).toBe(404);
    expect(handle(Object.assign(new Error("dup"), { code: 11000 }))).toEqual({
      status: 409,
      body: { success: false, error: "Duplicate field value entered" },
    });
  });

  it("answers 500 for an unexpected error and adds the stack only in development", () => {
    const err = new Error("boom");
    expect(handle(err)).toEqual({ status: 500, body: { success: false, error: "boom" } });
    expect(handle(err, { env: "development" }).body.stack).toContain("boom");
  });

  it("hides internals of a failed authentication (no stack, generic 500 message)", () => {
    const err = new Error("jwt library exploded");
    expect(handle(err, { authError: true, env: "development" })).toEqual({
      status: 500,
      body: { success: false, error: "Server Error" },
    });
  });

  it("adds a string code of an ApiError, never another kind of code", () => {
    const coded = Object.assign(new ApiError(403, "Change it"), {
      code: "PASSWORD_CHANGE_REQUIRED",
    });
    expect(handle(coded).body).toEqual({
      success: false,
      error: "Change it",
      code: "PASSWORD_CHANGE_REQUIRED",
    });
    const numeric = Object.assign(new ApiError(409, "Busy"), { code: 7 });
    expect(handle(numeric).body).toEqual({ success: false, error: "Busy" });
  });
});

describe("ApiError", () => {
  it("keeps status, operational flag and a given stack", () => {
    const err = new ApiError(418, "Teapot", false, "custom stack");
    expect(err).toBeInstanceOf(Error);
    expect(err).toMatchObject({ statusCode: 418, message: "Teapot", isOperational: false });
    expect(err.stack).toBe("custom stack");
    expect(new ApiError(400, "Bad").stack).toContain("Bad");
  });
});

describe("GET /monitoring/:id", () => {
  it("returns one record with its project, indicator and responsible", async () => {
    await seedLookups();
    const { token, user } = await loginAs("project_manager");
    const project = await createProject({ stage: "semp_complete" });
    const indicator = await Indicator.findOne();
    const record = await MonitoringRecord.create({
      project: project._id,
      indicator: indicator._id,
      scores: { baseline: "4" },
      responsible: user._id,
    });

    const res = await request(app)
      .get(`/api/v1/monitoring/${record._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ scores: { baseline: "4" } });
    expect(res.body.data.indicator.name).toBe(indicator.name);
    expect(res.body.data.project.title).toBe(project.title);
    expect(res.body.data.responsible.name).toBe(user.name);
  });

  it("answers 404 for an unknown record", async () => {
    const { token } = await loginAs("viewer");
    const res = await request(app)
      .get(`/api/v1/monitoring/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("connectDB", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs and exits with 1 when MongoDB cannot be reached", async () => {
    vi.spyOn(mongoose, "connect").mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await connectDB();

    expect(error).toHaveBeenCalledWith("MongoDB connection error:", "ECONNREFUSED");
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("connects with a 10 s server selection timeout", async () => {
    const connect = vi.spyOn(mongoose, "connect").mockResolvedValueOnce(mongoose);
    vi.spyOn(console, "log").mockImplementation(() => {});
    await connectDB();
    expect(connect).toHaveBeenCalledWith(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  });
});

describe("server.js", () => {
  const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  // A port that is free right now (asked from the OS, then released)
  const freePort = () =>
    new Promise((resolve) => {
      const probe = net.createServer().listen(0, "127.0.0.1", () => {
        const { port } = probe.address();
        probe.close(() => resolve(String(port)));
      });
    });

  it("connects, listens, answers /health and stops on a signal", async () => {
    const child = spawn(process.execPath, [path.join(backend, "src/server.js")], {
      env: { ...process.env, PORT: await freePort(), HOST: "127.0.0.1", NODE_ENV: "test" },
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    try {
      const port = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`no start: ${output}`)), 20000);
        child.stdout.on("data", () => {
          const match = /Server running on 127\.0\.0\.1, port (\d+)/.exec(output);
          if (match) {
            clearTimeout(timer);
            resolve(match[1]);
          }
        });
        child.on("exit", (code) => reject(new Error(`exited ${code}: ${output}`)));
      });
      expect(output).toMatch(/MongoDB connected/);
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      expect(res.status).toBe(200);
    } finally {
      const stopped = new Promise((resolve) => child.on("exit", resolve));
      child.kill("SIGINT");
      await stopped;
    }
  }, 30000);
});
