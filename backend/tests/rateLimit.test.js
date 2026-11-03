import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { app, require } from "./helpers/app.js";

const { userOrIpKey } = require("../../src/middlewares/rateLimiter");
const parseTrustProxy = require("../../src/config/trustProxy");

const fakeReq = (authorization) => ({ headers: { authorization }, ip: "10.0.0.7" });

describe("API rate limit key (D8)", () => {
  it("uses the user id for a valid token", () => {
    const token = jwt.sign({ sub: "abc123" }, process.env.JWT_SECRET);
    expect(userOrIpKey(fakeReq(`Bearer ${token}`))).toBe("user:abc123");
  });

  it.each([
    ["no token", undefined],
    ["a malformed token", "Bearer nope"],
    [
      "a forged token",
      `Bearer ${jwt.sign({ sub: "abc123" }, "another-secret-long-enough-0000000")}`,
    ],
  ])("falls back to the IP for %s", (_name, header) => {
    expect(userOrIpKey(fakeReq(header))).toBe("ip:10.0.0.7");
  });

  it("gives two users behind the same IP separate budgets", () => {
    const a = jwt.sign({ sub: "user-a" }, process.env.JWT_SECRET);
    const b = jwt.sign({ sub: "user-b" }, process.env.JWT_SECRET);
    expect(userOrIpKey(fakeReq(`Bearer ${a}`))).not.toBe(userOrIpKey(fakeReq(`Bearer ${b}`)));
  });
});

describe("TRUST_PROXY (D6)", () => {
  it.each([
    [undefined, false],
    ["", false],
    ["false", false],
    ["0", false],
    ["true", 1],
    ["TRUE", 1],
    ["2", 2],
    ["loopback", "loopback"],
    ["10.0.0.0/8, 127.0.0.1", "10.0.0.0/8, 127.0.0.1"],
  ])("%j → %j", (raw, expected) => {
    expect(parseTrustProxy(raw)).toEqual(expected);
  });

  it("is off by default", () => {
    expect(app.get("trust proxy")).toBe(false);
  });
});
