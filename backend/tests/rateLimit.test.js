import { describe, expect, it } from "vitest";
import fs from "node:fs";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app, require } from "./helpers/app.js";

const { userOrIpKey, loginLimiter } = require("../../src/middlewares/rateLimiter");
const { ipKeyGenerator } = require("express-rate-limit");
const parseTrustProxy = require("../../src/config/trustProxy");

const fakeReq = (authorization, ip = "10.0.0.7") => ({ headers: { authorization }, ip });

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

describe("IP key through ipKeyGenerator (express-rate-limit 8, D63 d)", () => {
  it("uses express-rate-limit 8", () => {
    const pkg = JSON.parse(fs.readFileSync("node_modules/express-rate-limit/package.json", "utf8"));
    expect(pkg.version).toMatch(/^8\.\d+\.\d+$/);
  });

  it("two IPv6 addresses of the same /56 subnet share one bucket", () => {
    const a = userOrIpKey(fakeReq(undefined, "2001:db8:abcd:12ff::1"));
    const b = userOrIpKey(fakeReq(undefined, "2001:db8:abcd:1200:ffff:ffff:ffff:fffe"));
    expect(a).toBe(b);
    expect(a).toBe(`ip:${ipKeyGenerator("2001:db8:abcd:12ff::1")}`);
    expect(a).toBe("ip:2001:db8:abcd:1200::/56");
  });

  it("an IPv6 address of another subnet gets its own bucket", () => {
    expect(userOrIpKey(fakeReq(undefined, "2001:db8:abcd:1300::1"))).not.toBe(
      userOrIpKey(fakeReq(undefined, "2001:db8:abcd:1200::1"))
    );
  });

  it("an IPv4 address (also IPv4-mapped IPv6) is its own key", () => {
    expect(userOrIpKey(fakeReq(undefined, "10.0.0.7"))).toBe("ip:10.0.0.7");
    expect(userOrIpKey(fakeReq(undefined, "::ffff:10.0.0.7"))).toBe("ip:10.0.0.7");
    expect(userOrIpKey(fakeReq(undefined, "10.0.0.8"))).not.toBe("ip:10.0.0.7");
  });

  it("a signed-in user keeps the per-user key whatever the IP", () => {
    const token = jwt.sign({ sub: "abc123" }, process.env.JWT_SECRET);
    expect(userOrIpKey(fakeReq(`Bearer ${token}`, "2001:db8::1"))).toBe("user:abc123");
  });

  it("the login limit counts IPv6 clients of one subnet together", async () => {
    const tiny = express();
    tiny.set("trust proxy", 1);
    tiny.post("/login", loginLimiter, (req, res) => res.status(401).json({ success: false }));

    // 10 failed attempts from addresses of one /56, then an 11th from yet another one: refused.
    for (let i = 0; i < 10; i += 1) {
      const res = await request(tiny)
        .post("/login")
        .set("X-Forwarded-For", `2001:db8:abcd:12${i.toString(16).padStart(2, "0")}::${i + 1}`);
      expect(res.status).toBe(401);
    }
    const blocked = await request(tiny)
      .post("/login")
      .set("X-Forwarded-For", "2001:db8:abcd:12aa::99");
    expect(blocked.status).toBe(429);

    // Another subnet still has its own budget.
    const other = await request(tiny).post("/login").set("X-Forwarded-For", "2001:db8:ffff::1");
    expect(other.status).toBe(401);
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
