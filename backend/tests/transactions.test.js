// Transactions (phase 11). On a replica set (the server, the "Backend (replica set)" CI job) a
// critical action and its audit entry, and a bulk save with its revision, are one transaction:
// when any part fails nothing is written. On a standalone MongoDB (local development, the
// "Backend" CI job) the same code runs without one, as before phase 11. The tests of the
// transaction path skip themselves on a standalone server; EXPECT_TRANSACTIONS=true makes sure the
// replica-set job really runs them.
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app, mongoose, require } from "./helpers/app.js";
import { createProject, createUser, loginAs, seedLookups } from "./helpers/fixtures.js";

const AuditLog = require("../../src/models/auditLog.model");
const Project = require("../../src/models/project.model");
const Screening = require("../../src/models/screening.model");
const User = require("../../src/models/user.model");
const ManagementActivity = require("../../src/models/managementActivity.model");
const MitigationPlan = require("../../src/models/mitigationPlan.model");
const MonitoringRecord = require("../../src/models/monitoringRecord.model");
const ProjectFile = require("../../src/models/projectFile.model");
const LibraryDocument = require("../../src/models/libraryDocument.model");
const Indicator = require("../../src/models/indicator.model");
const TableRevision = require("../../src/models/tableRevision.model");
const audit = require("../../src/services/audit.service");
const { withRevision } = require("../../src/utils/version");
const {
  supportsTransactions,
  forceTransactions,
  atomic,
  inTransaction,
} = require("../../src/utils/transaction");

const PDF = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");
const auth = (token) => ({ Authorization: `Bearer ${token}` });
const api = (method, url, token) => request(app)[method](`/api/v1${url}`).set(auth(token));

let replicaSet = false;
beforeAll(async () => {
  replicaSet = await supportsTransactions();
});
afterEach(() => {
  vi.restoreAllMocks();
  forceTransactions(null);
});

// Skips a test of the transaction path on a standalone server.
const onReplicaSet = (name, fn) =>
  it(name, async (ctx) => {
    if (!replicaSet) ctx.skip();
    await fn();
  });

const failAudit = () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  return vi.spyOn(AuditLog, "create").mockRejectedValueOnce(new Error("disk full"));
};

// Lets the real write run (inside the transaction), then fails: only a rollback undoes it.
const failAfterWrite = (Model, method) => {
  const original = Model[method].bind(Model);
  return vi.spyOn(Model, method).mockImplementationOnce(async (...args) => {
    await original(...args);
    throw new Error("connection lost");
  });
};

const revisionOf = async (project, table) =>
  (await TableRevision.findOne({ project: project._id, table }).lean())?.revision ?? 0;

describe("the test server", () => {
  it("is a replica set when the CI job says so (EXPECT_TRANSACTIONS)", async (ctx) => {
    if (!process.env.EXPECT_TRANSACTIONS) ctx.skip();
    expect(replicaSet).toBe(process.env.EXPECT_TRANSACTIONS === "true");
  });

  it("atomic() runs in a transaction exactly when the server supports one", async () => {
    expect(await atomic(async () => inTransaction())).toBe(replicaSet);
    expect(inTransaction()).toBe(false);
    forceTransactions(false);
    expect(await atomic(async () => inTransaction())).toBe(false);
  });
});

describe.each([
  ["management", ManagementActivity, "activity_description"],
  ["mitigation", MitigationPlan, "output_description"],
])("bulk save of %s on a replica set", (table, Model, field) => {
  const setup = async () => {
    const project = await createProject({ stage: "assessment_approved" });
    const rows = await Model.insertMany([
      { project: project._id, serial_number: 1, [field]: "Keep" },
      { project: project._id, serial_number: 2, [field]: "Drop" },
    ]);
    const { token } = await loginAs("project_manager");
    const save = () =>
      api("put", `/projects/${project._id}/${table}`, token).send({
        version: 0,
        rows: [{ _id: rows[0]._id.toString(), [field]: "Edited" }, { [field]: "New" }],
      });
    const table0 = async () =>
      (await Model.find({ project: project._id }).sort({ serial_number: 1 }).lean()).map(
        (r) => r[field]
      );
    return { project, save, table0 };
  };

  onReplicaSet("a write that fails half-way writes nothing (rows and revision)", async () => {
    const { project, save, table0 } = await setup();
    failAfterWrite(Model, "bulkWrite");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await save();

    expect(res.status).toBe(500);
    expect(await table0()).toEqual(["Keep", "Drop"]);
    expect(await revisionOf(project, table)).toBe(0);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  onReplicaSet("a failed audit entry for the removed rows undoes the whole save", async () => {
    const { project, save, table0 } = await setup();
    failAudit();

    const res = await save();

    expect(res.status).toBe(500);
    expect(await table0()).toEqual(["Keep", "Drop"]);
    expect(await revisionOf(project, table)).toBe(0);
  });

  onReplicaSet("a successful save writes the rows, the revision and the entry", async () => {
    const { save, table0 } = await setup();

    const res = await save();

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(await table0()).toEqual(["Edited", "New"]);
    expect(await AuditLog.countDocuments({ action: `${table}.rows_removed` })).toBe(1);
  });
});

describe("bulk save of monitoring on a replica set", () => {
  onReplicaSet("a write that fails half-way writes nothing", async () => {
    await seedLookups();
    const [first, second] = await Indicator.find().sort({ _id: 1 }).limit(2);
    const project = await createProject({ stage: "semp_complete" });
    await MonitoringRecord.create({ project: project._id, indicator: first._id, total: "old" });
    const { token } = await loginAs("project_manager");
    failAfterWrite(MonitoringRecord, "bulkWrite");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await api("put", `/projects/${project._id}/monitoring`, token).send({
      version: 0,
      records: [
        { indicator: first._id.toString(), total: "new" },
        { indicator: second._id.toString(), total: "added" },
      ],
    });

    expect(res.status).toBe(500);
    const records = await MonitoringRecord.find({ project: project._id }).lean();
    expect(records.map((r) => r.total)).toEqual(["old"]);
    expect(await revisionOf(project, "monitoring")).toBe(0);
  });
});

describe("a critical action whose audit entry fails writes nothing (replica set)", () => {
  onReplicaSet("project archive and restore", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject();
    failAudit();
    expect((await api("patch", `/projects/${project._id}/archive`, token)).status).toBe(500);
    expect((await Project.findById(project._id)).archived).toBeFalsy();

    await Project.updateOne({ _id: project._id }, { archived: true });
    failAudit();
    expect((await api("patch", `/projects/${project._id}/restore`, token)).status).toBe(500);
    expect((await Project.findById(project._id)).archived).toBe(true);
  });

  onReplicaSet("project delete: the project, its tools and its files stay", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ stage: "screening_approved" });
    await Screening.updateOne({ project: project._id }, { status: "draft" });
    const uploaded = await api("post", `/projects/${project._id}/files`, token)
      .field("area", "documents")
      .field("category", "screening")
      .attach("file", PDF, "report.pdf");
    expect(uploaded.status).toBe(201);
    const file = await ProjectFile.findOne({ project: project._id }).lean();
    const onDisk = path.join(process.env.UPLOADS_DIR, String(project._id), file.stored_name);
    failAudit();

    const res = await api("delete", `/projects/${project._id}`, token);

    expect(res.status).toBe(500);
    expect(await Project.exists({ _id: project._id })).not.toBeNull();
    expect(await Screening.exists({ project: project._id })).not.toBeNull();
    expect(await ProjectFile.exists({ _id: file._id })).not.toBeNull();
    expect(fs.existsSync(onDisk)).toBe(true);
  });

  onReplicaSet("project purge: the entry is rolled back when the delete fails", async () => {
    const { token } = await loginAs("admin");
    const project = await createProject({ stage: "screening_approved", archived: true });
    failAfterWrite(Screening, "deleteMany");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await api("delete", `/projects/${project._id}/purge`, token);

    expect(res.status).toBe(500);
    expect(await Project.exists({ _id: project._id })).not.toBeNull();
    expect(await Screening.exists({ project: project._id })).not.toBeNull();
    expect(await AuditLog.countDocuments({ action: "project.purge" })).toBe(0);
  });

  onReplicaSet("file delete: the row and the file on disk stay", async () => {
    const { token } = await loginAs("project_manager");
    const project = await createProject();
    await api("post", `/projects/${project._id}/files`, token)
      .field("area", "documents")
      .field("category", "other")
      .attach("file", PDF, "keep.pdf");
    const file = await ProjectFile.findOne({ project: project._id }).lean();
    failAudit();

    const res = await api("delete", `/files/${file._id}`, token);

    expect(res.status).toBe(500);
    expect(await ProjectFile.exists({ _id: file._id })).not.toBeNull();
    expect(
      fs.existsSync(path.join(process.env.UPLOADS_DIR, String(project._id), file.stored_name))
    ).toBe(true);
  });

  onReplicaSet("library delete and replace: the document keeps its file", async () => {
    const { token } = await loginAs("admin");
    const created = await api("post", "/library", token)
      .field("title", "Guide")
      .attach("file", PDF, "guide.pdf");
    expect(created.status).toBe(201);
    const doc = await LibraryDocument.findOne().lean();
    const libraryDir = path.join(process.env.UPLOADS_DIR, "library");

    failAudit();
    expect((await api("delete", `/library/${doc._id}`, token)).status).toBe(500);
    expect(await LibraryDocument.exists({ _id: doc._id })).not.toBeNull();

    failAudit();
    const replaced = await api("put", `/library/${doc._id}/file`, token).attach(
      "file",
      PDF,
      "new.pdf"
    );
    expect(replaced.status).toBe(500);
    const after = await LibraryDocument.findById(doc._id).lean();
    expect(after.stored_name).toBe(doc.stored_name);
    expect(after.original_name).toBe("guide.pdf");
    // The old file is still there and the new one was removed again.
    expect(fs.readdirSync(libraryDir)).toEqual([doc.stored_name]);
  });

  onReplicaSet("user create, role change, deactivate and password reset", async () => {
    const { token } = await loginAs("admin");
    const { user, password } = await createUser("viewer");

    failAudit();
    const created = await api("post", "/users", token).send({
      name: "New Person",
      email: "new.person@example.com",
      role: "viewer",
    });
    expect(created.status).toBe(500);
    expect(await User.exists({ email: "new.person@example.com" })).toBeNull();

    failAudit();
    expect(
      (await api("put", `/users/${user._id}`, token).send({ role: "project_manager" })).status
    ).toBe(500);
    expect((await User.findById(user._id)).role).toBe("viewer");

    failAudit();
    expect((await api("patch", `/users/${user._id}/deactivate`, token)).status).toBe(500);
    expect((await User.findById(user._id)).is_active).toBe(true);

    failAudit();
    expect((await api("post", `/users/${user._id}/reset-password`, token)).status).toBe(500);
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.must_change_password).toBeFalsy();
  });
});

describe("without transactions (standalone MongoDB)", () => {
  it("a bulk save still validates every row first and writes nothing on a bad row", async () => {
    forceTransactions(false);
    const project = await createProject({ stage: "assessment_approved" });
    await ManagementActivity.create({ project: project._id, activity_description: "Keep" });
    const { token } = await loginAs("project_manager");

    const res = await api("put", `/projects/${project._id}/management`, token).send({
      version: 0,
      rows: [
        { activity_description: "New" },
        { activity_description: "Bad", responsible: "x", responsible_text: "y" },
      ],
    });

    expect(res.status).toBe(400);
    const rows = await ManagementActivity.find({ project: project._id }).lean();
    expect(rows.map((r) => r.activity_description)).toEqual(["Keep"]);
    expect(await revisionOf(project, "management")).toBe(0);
  });

  it("a write that fails gives the revision back, so the client's version stays valid", async () => {
    forceTransactions(false);
    const project = await createProject({ stage: "assessment_approved" });
    const { token } = await loginAs("project_manager");
    vi.spyOn(ManagementActivity, "bulkWrite").mockRejectedValueOnce(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const send = () =>
      api("put", `/projects/${project._id}/management`, token).send({
        version: 0,
        rows: [{ activity_description: "New" }],
      });

    expect((await send()).status).toBe(500);
    expect(await revisionOf(project, "management")).toBe(0);
    expect((await send()).status).toBe(200);
  });

  it("a critical action still happens when its entry fails; the failure is logged", async () => {
    forceTransactions(false);
    const { token } = await loginAs("admin");
    const project = await createProject();
    failAudit();

    const res = await api("patch", `/projects/${project._id}/archive`, token);

    expect(res.status).toBe(200);
    expect((await Project.findById(project._id)).archived).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("project.archive"),
      "disk full"
    );
  });
});

// The transaction-only branches, also on a standalone server: the driver's transaction is replaced
// by a plain call, so atomic() marks its callback as "in a transaction" without a replica set.
describe("inside atomic() (simulated transaction, any server)", () => {
  const simulate = () => {
    forceTransactions(true);
    return vi.spyOn(mongoose.connection, "transaction").mockImplementation(async (fn) => fn());
  };

  it("runs the callback once inside the transaction and returns its result", async () => {
    const transaction = simulate();
    expect(await atomic(async () => (inTransaction() ? "inside" : "outside"))).toBe("inside");
    expect(transaction).toHaveBeenCalledTimes(1);
    // A nested call joins the running transaction instead of starting another.
    await atomic(() => atomic(async () => null));
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it("a failed audit entry throws, so the transaction rolls the action back", async () => {
    simulate();
    const { user } = await createUser("admin");
    failAudit();
    await expect(
      atomic(() => audit.record(user, "project.archive", { target: { type: "project" } }))
    ).rejects.toThrow("disk full");
  });

  it("a failed write under a claimed revision leaves the revision to the rollback", async () => {
    simulate();
    const project = await createProject();
    await expect(
      atomic(() =>
        withRevision(project._id, "management", 0, async () => {
          throw new Error("connection lost");
        })
      )
    ).rejects.toThrow("connection lost");
    // No real transaction here, so nothing undid the claim: in MongoDB the abort does.
    expect(await revisionOf(project, "management")).toBe(1);
  });

  it("supportsTransactions(): forced values win; not connected → false", async () => {
    forceTransactions(true);
    expect(await supportsTransactions()).toBe(true);
    forceTransactions(false);
    expect(await supportsTransactions()).toBe(false);
    forceTransactions(null);
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(0);
    expect(await supportsTransactions()).toBe(false);
  });
});

describe("createApp", () => {
  it("builds with request logging in development and production, and without a build", () => {
    const createApp = require("../../src/createApp");
    for (const NODE_ENV of ["development", "production"]) {
      expect(typeof createApp({ NODE_ENV, FRONTEND_DIST: "" })).toBe("function");
    }
  });
});
