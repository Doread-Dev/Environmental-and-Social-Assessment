import { describe, expect, it } from "vitest";
import { mongoose } from "./helpers/app.js";
import { assertTestUri, resolveTestUri } from "./helpers/testDb.js";

describe("test database guard", () => {
  it("derives <db>_test from MONGODB_URI", () => {
    expect(resolveTestUri({ MONGODB_URI: "mongodb://127.0.0.1:27017/esms" })).toBe(
      "mongodb://127.0.0.1:27017/esms_test"
    );
    expect(
      resolveTestUri({ MONGODB_URI: "mongodb+srv://u:p@cluster.example.com/esms?retryWrites=true" })
    ).toBe("mongodb+srv://u:p@cluster.example.com/esms_test?retryWrites=true");
  });

  it("prefers MONGODB_URI_TEST", () => {
    expect(
      resolveTestUri({
        MONGODB_URI: "mongodb://127.0.0.1:27017/esms",
        MONGODB_URI_TEST: "mongodb://127.0.0.1:27017/other_test",
      })
    ).toBe("mongodb://127.0.0.1:27017/other_test");
  });

  it("refuses a database whose name does not end in _test", () => {
    expect(() => assertTestUri("mongodb://127.0.0.1:27017/esms")).toThrow(/Refusing/);
    expect(() => assertTestUri("mongodb://127.0.0.1:27017")).toThrow(/Refusing/);
    expect(() => assertTestUri("mongodb://127.0.0.1:27017/esms_test")).not.toThrow();
  });

  it("is connected to a *_test database", () => {
    expect(mongoose.connection.name).toMatch(/_test$/);
  });
});
