const rateLimit = require('express-rate-limit');

// General rate limiter for all endpoints
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for write operations (POST, PATCH)
// 30 requests per 15 minutes per IP
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many write requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiter for read operations (GET)
// 200 requests per 15 minutes per IP
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many read requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  writeLimiter,
  readLimiter,
};
