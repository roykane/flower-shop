const rateLimit = require('express-rate-limit');

// General API rate limiter - 100 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter - stricter for login/register (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Order creation limiter - prevent spam orders
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 orders per minute
  message: {
    success: false,
    message: 'Quá nhiều đơn hàng, vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload limiter - prevent spam uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    message: 'Quá nhiều file upload, vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook limiter - allow more for automated systems
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 webhook calls per minute
  message: {
    success: false,
    message: 'Too many webhook requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive operations (password reset, etc.)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 giờ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  orderLimiter,
  uploadLimiter,
  webhookLimiter,
  strictLimiter,
};
