const rateLimit = require('express-rate-limit');

// General API rate limit: 1000 requests per 7 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 7 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for login: 10 attempts per 15 minutes (skip successful requests)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, loginLimiter };
