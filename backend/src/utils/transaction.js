const { AsyncLocalStorage } = require("node:async_hooks");
const mongoose = require("mongoose");

// Transactions (phase 11). On the server MongoDB runs as a single-node replica set (deploy/), so a
// critical action and its audit entry (D65), and a bulk save of Tools 3–5 with its revision (D62),
// either all happen or none does. A standalone MongoDB (local development, the standalone CI job)
// cannot run transactions: there the same code runs without one, as before phase 11 (every row is
// validated first, then one bulkWrite; a failed audit entry is logged).
//
// Mongoose attaches the transaction's session to every query, save and bulkWrite started inside
// the callback (AsyncLocalStorage), so services need no `session` argument.
mongoose.set("transactionAsyncLocalStorage", true);

const marker = new AsyncLocalStorage();

// Whether the connected server can run transactions: a replica set member or a mongos. Asked once
// per client (a reconnect gets a new client).
const supportByClient = new WeakMap();
let forced = null;

const supportsTransactions = async () => {
  if (forced !== null) return forced;
  const connection = mongoose.connection;
  if (connection.readyState !== 1) return false;
  const client = connection.getClient();
  if (!supportByClient.has(client)) {
    const hello = await connection.db.admin().command({ hello: 1 });
    supportByClient.set(client, Boolean(hello.setName) || hello.msg === "isdbgrid");
  }
  return supportByClient.get(client);
};

// True inside an atomic() callback that runs in a transaction.
const inTransaction = () => marker.getStore() === true;

/**
 * Runs `fn` in one transaction when the server supports it, else as it is. A nested call joins the
 * running transaction. Inside a transaction `fn` may run more than once (the driver retries a
 * transient conflict), so it must not do work outside MongoDB (files on disk go after it).
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
const atomic = async (fn) => {
  if (inTransaction() || !(await supportsTransactions())) return fn();
  let result;
  await mongoose.connection.transaction(async () => {
    result = await marker.run(true, fn);
  });
  return result;
};

/**
 * Tests only: `true` / `false` forces the transaction or the standalone path, `null` asks the
 * server again.
 * @param {boolean|null} value
 */
const forceTransactions = (value) => {
  forced = value;
};

module.exports = { atomic, inTransaction, supportsTransactions, forceTransactions };
