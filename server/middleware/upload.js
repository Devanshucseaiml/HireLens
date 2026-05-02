// middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

// ── Ensure upload directory exists ──────────────────────────
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Storage: write to disk (not memory) ─────────────────────
// Reason: PDFs can be large; memory storage risks OOM on
// concurrent uploads. Disk is safer. File is deleted after parse.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Sanitize original filename, prepend timestamp to avoid collisions
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

// ── File filter: PDFs only ───────────────────────────────────
// Reject at middleware level — never reaches route handler
const fileFilter = (_req, file, cb) => {
  const isPdf =
    file.mimetype === 'application/pdf' ||
    path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are accepted'), false);
  }
};

// ── Size limit from .env ─────────────────────────────────────
const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeMB * 1024 * 1024, // convert MB → bytes
    files: 1,                           // one file per request
  },
});

logger.info(`Multer configured — max size: ${maxSizeMB}MB, dir: ${uploadDir}`);

export default upload;
