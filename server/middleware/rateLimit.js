import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for the public resume API routes.
 *
 * @returns {import('express').RequestHandler} Express rate limiting middleware.
 */
const resumeRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '15', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Gemini free tier allows 15 req/min.',
  },
});

export default resumeRateLimit;
