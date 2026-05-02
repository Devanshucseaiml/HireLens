// utils/cleanup.js
// Deletes FAISS index directories older than INDEX_TTL_HOURS.
//
// Run manually:  node utils/cleanup.js
// Run on cron:   0 * * * * node /path/to/server/utils/cleanup.js
// Run on boot:   called from index.js startup

import 'dotenv/config';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const FAISS_BASE_DIR = path.resolve(
  __dirname,
  '..',
  process.env.FAISS_INDEX_DIR || './faiss_indexes'
);

const TTL_HOURS = parseInt(process.env.INDEX_TTL_HOURS || '24', 10);
const TTL_MS    = TTL_HOURS * 60 * 60 * 1000;

export const runCleanup = () => {
  if (!fs.existsSync(FAISS_BASE_DIR)) {
    logger.info('Cleanup: no faiss_indexes directory found, skipping');
    return { deleted: 0, kept: 0 };
  }

  const now     = Date.now();
  const entries = fs.readdirSync(FAISS_BASE_DIR);
  let deleted   = 0;
  let kept      = 0;

  entries.forEach((sessionId) => {
    const fullPath = path.join(FAISS_BASE_DIR, sessionId);

    try {
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) return;

      const ageMs = now - stat.birthtimeMs;

      if (ageMs > TTL_MS) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        logger.info(
          `Cleanup: deleted session ${sessionId} ` +
          `(age: ${(ageMs / 3600000).toFixed(1)}h)`
        );
        deleted++;
      } else {
        kept++;
      }
    } catch (err) {
      logger.warn(`Cleanup: failed to process ${sessionId}: ${err.message}`);
    }
  });

  logger.info(`Cleanup complete — deleted: ${deleted}, kept: ${kept}`);
  return { deleted, kept };
};

// ── Run directly if called as a script ──────────────────────
// node utils/cleanup.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCleanup();
}
