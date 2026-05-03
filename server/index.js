import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import 'express-async-errors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── ESM __dirname shim ───────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const [{ default: validateEnv }] = await Promise.all([
  import('./utils/validateEnv.js'),
]);

validateEnv();

const [
  { default: analyzeRouter },
  { default: exportRouter },
  { default: errorHandler },
  { default: logger },
  { runCleanup },
  { default: authRouter },
  { authMiddleware },
] = await Promise.all([
  import('./routes/analyze.js'),
  import('./routes/export.js'),
  import('./middleware/errorHandler.js'),
  import('./utils/logger.js'),
  import('./utils/cleanup.js'),
  import('./routes/auth.js'),
  import('./middleware/auth.js'),
]);

// ── Ensure required directories exist ───────────────────────
const dirs = [
  process.env.UPLOAD_DIR      || './uploads',
  process.env.FAISS_INDEX_DIR || './faiss_indexes',
];

dirs.forEach((dir) => {
  const resolved = path.resolve(__dirname, dir);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
    logger.info(`Created directory: ${resolved}`);
  }
});

// ── App ──────────────────────────────────────────────────────
const app = express();

// ── Middleware stack ────────────────────────────────────────

// 1. CORS — explicit headers middleware (handle credentials properly)

// Explicit CORS header fallback (handle credentials)
app.use((req, res, next) => {
  const origin = req.get('origin') || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 2. Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 3. Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    logger.debug(`→ ${req.method} ${req.path}`);
    next();
  });
}

// 4. Route rate limits
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const uploadRateLimit = rateLimit({
  windowMs: rateLimitWindowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_UPLOAD || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', retryAfter: '15 minutes' },
});

const analyzeRateLimit = rateLimit({
  windowMs: rateLimitWindowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_ANALYZE || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', retryAfter: '15 minutes' },
});

// ── Routes ───────────────────────────────────────────────────
// Auth routes (public — no auth required)
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/upload', authMiddleware, uploadRateLimit);
app.use('/api/analyze', authMiddleware, analyzeRateLimit);
app.use('/api/resume/upload', authMiddleware, uploadRateLimit);
app.use('/api/resume/analyze', authMiddleware, analyzeRateLimit);
app.use('/api/resume', authMiddleware, analyzeRouter);
app.use('/api', authMiddleware, analyzeRouter);
app.use('/api', authMiddleware, exportRouter);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler (must be last) ─────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment : ${process.env.NODE_ENV}`);
  logger.info(`Gemini model : ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`);

  // Run cleanup immediately on boot, then hourly via cron.
  runCleanup();
  cron.schedule('0 * * * *', () => {
    runCleanup();
  });
  logger.info('Cleanup cron scheduled: every hour');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use.`);
    logger.error('Set a different PORT in server/.env or stop the process using this port.');
    process.exit(1);
  }

  throw err;
});

export default app;