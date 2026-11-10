const mongoose = require("mongoose");
const ApiError = require("./ApiError");
const normalizeResponsible = require("./responsible");
const validationMessage = require("./validationMessage");
const { withRevision } = require("./version");

const rowError = (index, message) => new ApiError(400, `Row ${index + 1}: ${message}`);

// Checks every row before anything is written: responsible rule (D55), row ids belong to this
// project and appear once, model validation. Returns { _id, fields } per row; throws 400 with
// the row number.
const prepareRows = async (Model, projectId, rows, existingIds) => {
  const seen = new Set();
  const prepared = [];
  for (const [index, row] of rows.entries()) {
    const { _id, ...rest } = row;
    if (_id && !existingIds.has(_id)) throw rowError(index, "not a row of this project");
    if (_id && seen.has(_id)) throw rowError(index, "row sent twice");
    if (_id) seen.add(_id);

    let fields;
    try {
      // Rows without a serial number are numbered by their position in the table.
      fields = normalizeResponsible({ ...rest, serial_number: rest.serial_number ?? index + 1 });
      await new Model({ ...fields, project: projectId }).validate();
    } catch (err) {
      throw rowError(index, validationMessage(err));
    }
    prepared.push({ _id, fields });
  }
  return prepared;
};

// Replaces a project's whole table (Tools 3 and 4) in one request (D32): a row with `_id` updates
// that row (id kept), a row without one is created, an existing row left out is deleted. Every
// row is checked first, so an invalid row leaves the table untouched; the writes then go out as
// one ordered bulkWrite, under the table's revision (D62); callers run it in atomic() so on a
// replica set the revision, the rows and the audit entry are one transaction (phase 11): `version` is the revision the client
// loaded; it is checked and raised in one conditional update right before the write, so two saves
// of the same revision cannot both pass (409). Returns the rows it deleted (as they were), for the
// audit log (D65), and the new revision.
const replaceProjectRows = async (Model, projectId, rows, { table, version }) => {
  const existing = await Model.find({ project: projectId }).sort({ serial_number: 1 }).lean();
  const existingIds = new Set(existing.map((row) => String(row._id)));
  const prepared = await prepareRows(Model, projectId, rows, existingIds);

  const project = new mongoose.Types.ObjectId(String(projectId));
  const keptIds = prepared
    .filter((row) => row._id)
    .map((row) => new mongoose.Types.ObjectId(row._id));
  const kept = new Set(keptIds.map(String));
  const removed = existing.filter((row) => !kept.has(String(row._id)));
  const revision = await withRevision(projectId, table, version, () =>
    Model.bulkWrite([
      // First, so it cannot match the rows inserted below.
      { deleteMany: { filter: { project, _id: { $nin: keptIds } } } },
      ...prepared.map(({ _id, fields }) =>
        _id
          ? { updateOne: { filter: { _id, project }, update: { $set: fields } } }
          : { insertOne: { document: { ...fields, project } } }
      ),
    ])
  );
  return { removed, revision };
};

module.exports = replaceProjectRows;
