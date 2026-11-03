// Loads the CommonJS app through Node's own require so tests and app share one mongoose instance.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const app = require("../../src/app");
const mongoose = require("mongoose");

export { app, mongoose, require };
