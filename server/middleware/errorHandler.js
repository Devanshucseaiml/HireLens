// middleware/errorHandler.js
import logger from '../utils/logger.js';

// ── Global error handler ─────────────────────────────────────
// Must have exactly 4 args — Express identifies error middleware
// by its signature, not its name.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`);

  // ── Multer-specific errors ───────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      detail: `Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB}MB`,
    });
  }

  if (err.message === 'Only PDF files are accepted') {
    return res.status(415).json({
      error: 'Unsupported file type',
      detail: 'Please upload a PDF file',
    });
  }

  if (err.code === 'INVALID_PDF_TEXT') {
    return res.status(422).json({
      error: 'PDF text extraction failed',
      detail: err.message,
    });
  }

  // ── Gemini API errors ────────────────────────────────────
  if (err.message?.includes('Gemini quota exceeded')) {
    return res.status(429).json({
      error: 'Gemini quota exceeded',
      detail: 'The free tier allows 15 requests per minute.',
    });
  }

  if (err.message?.includes('GEMINI_API_KEY')) {
    return res.status(500).json({
      error: 'Gemini API key missing',
      detail: 'Set GEMINI_API_KEY in server/.env before starting the server.',
    });
  }

  // ── Session / FAISS errors ───────────────────────────────
  if (err.message?.includes('FAISS index not found')) {
    return res.status(404).json({
      error: 'Session expired or not found',
      detail: 'Please re-upload your resume',
    });
  }

  // ── Generic fallback ─────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
