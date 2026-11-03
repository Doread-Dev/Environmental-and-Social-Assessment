// Resolves the test database URI and refuses anything that is not a *_test database.

const DEFAULT_BASE_URI = "mongodb://127.0.0.1:27017/esms";

// mongodb://host[,host2]/<db>?<options>
const URI_PATTERN = /^(mongodb(?:\+srv)?:\/\/[^/?]+)\/?([^?]*)(\?.*)?$/;

function parseUri(uri) {
  const match = URI_PATTERN.exec(uri);
  if (!match) throw new Error(`Unrecognised MongoDB URI: ${uri}`);
  return { hosts: match[1], dbName: match[2], query: match[3] || "" };
}

// MONGODB_URI_TEST wins; otherwise MONGODB_URI with "_test" appended to its database name.
function resolveTestUri(env = process.env) {
  if (env.MONGODB_URI_TEST) return env.MONGODB_URI_TEST;
  const { hosts, dbName, query } = parseUri(env.MONGODB_URI || DEFAULT_BASE_URI);
  const name = dbName || "esms";
  return `${hosts}/${name.endsWith("_test") ? name : `${name}_test`}${query}`;
}

function assertTestDbName(dbName) {
  if (!dbName || !dbName.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${dbName}": name must end in "_test".`
    );
  }
}

function assertTestUri(uri) {
  assertTestDbName(parseUri(uri).dbName);
}

export { resolveTestUri, assertTestUri, assertTestDbName };
