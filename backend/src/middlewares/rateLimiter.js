const rateLimit = require("express-rate-limit");
const { bearerToken, verifyToken } = require("./auth");

// Limits each signed-in user separately (D8): users behind one office NAT/proxy don't share a
// budget. Runs before auth, so it only verifies the token (no DB lookup); anything without a
// valid token is limited by IP.
const userOrIpKey = (req) => {
  const token = bearerToken(req);
  try {
    const payload = token && verifyToken(token);
    if (payload?.sub) return `user:${payload.sub}`;
  } catch {
    // Unexpected verify error: fall back to IP; auth() reports the error itself.
  }
  return `ip:${req.ip}`;
};

// General API rate limit: 1000 requests per 7 minutes per user (or per IP when anonymous)
const apiLimiter = rateLimit({
  windowMs: 7 * 60 * 1000,
  max: 1000,
  keyGenerator: userOrIpKey,
  message: { success: false, error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for login, per IP: 10 failed attempts per 15 minutes (successes don't count)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, loginLimiter, userOrIpKey };
