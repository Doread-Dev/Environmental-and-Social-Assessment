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

  it.each(["production", "test"])(
    "hides the message of an unexpected error in %s (500 Server Error), and still logs it",
    (env) => {
      const err = new Error("db exploded: secret path C:\\data\\esms");
      const result = handle(err, { env });
      expect(result).toEqual({ status: 500, body: { success: false, error: "Server Error" } });
      expect(JSON.stringify(result.body)).not.toMatch(/exploded|secret|C:/);
      expect(console.error).toHaveBeenCalledWith(err);
    }
  );

  it("hides an unexpected error that carries its own 5xx status", () => {
    const err = Object.assign(new Error("upstream socket hang up"), { statusCode: 502 });
    expect(handle(err, { env: "production" })).toEqual({
      status: 502,
      body: { success: false, error: "Server Error" },
    });
  });

  it("answers Server Error when an error has no message, even in development", () => {
    expect(handle(new Error(""), { env: "development" }).body.error).toBe("Server Error");
    expect(handle(Object.assign(new Error(""), { statusCode: 418 })).body.error).toBe(
      "Server Error"
    );
  });

  it("keeps a 4xx message of a failed authentication, and hides even an ApiError 5xx there", () => {
    expect(handle(new ApiError(401, "Token expired"), { authError: true })).toEqual({
      status: 401,
      body: { success: false, error: "Token expired" },
    });
    expect(
      handle(new ApiError(500, "verify failed: key"), { authError: true, env: "production" })
    ).toEqual({ status: 500, body: { success: false, error: "Server Error" } });
  });

  it("adds no stack outside development, and none for an auth error in development", () => {
    expect(handle(new ApiError(400, "Bad"), { env: "production" }).body.stack).toBeUndefined();
    expect(
      handle(new ApiError(401, "Expired"), { authError: true, env: "development" }).body.stack
    ).toBeUndefined();
    expect(handle(new ApiError(400, "Bad"), { env: "development" }).body.stack).toContain("Bad");
  });

  it("keeps the message and stack of an unexpected error in development", () => {
    const body = handle(new Error("boom"), { env: "development" }).body;
    expect(body.error).toBe("boom");
    expect(body.stack).toContain("boom");
  });

  it("keeps the message of an ApiError with a 5xx status (written on purpose)", () => {
    expect(
      handle(new ApiError(503, "Backups are running, try again"), { env: "production" })
    ).toEqual({ status: 503, body: { success: false, error: "Backups are running, try again" } });
  });

  it("keeps a 4xx library error's own message", () => {
    const err = Object.assign(new Error("request entity too large"), { statusCode: 413 });
    expect(handle(err, { env: "production" })).toEqual({
      status: 413,
      body: { success: false, error: "request entity too large" },
    });
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

describe("error responses through the app", () => {
  afterEach(() => vi.restoreAllMocks());

  it("invalid JSON in a body answers 400 with a client-facing message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error).not.toBe("Server Error");
  });

  it("a thrown unexpected error answers 500 Server Error without its text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { token } = await loginAs("viewer");
    const Project = require("../../src/models/project.model");
    vi.spyOn(Project, "find").mockImplementation(() => {
      throw new Error("db exploded: secret path");
    });
    const res = await request(app).get("/api/v1/projects").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: "Server Error" });
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
