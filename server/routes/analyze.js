// routes/analyze.js
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import upload              from '../middleware/upload.js';
import extractTextFromPDF  from '../services/pdfExtractor.js';
import { chunkText }       from '../services/embedder.js';      // Step 3 ✅
import { saveIndex,
         loadIndex,
         deleteIndex,
         similaritySearch } from '../services/vectorStore.js'; // Step 3 ✅
import logger from '../utils/logger.js';
import sanitizeAnalyzeInput from '../middleware/sanitize.js';

import { runRAGChain } from '../services/ragChain.js'; // Step 4 ✅

const router = Router();

// ────────────────────────────────────────────────────────────
// POST /api/upload
// Accepts: multipart/form-data { file: resume.pdf }
// Returns: { sessionId, pageCount, chunkCount, metadata }
// ────────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  // Multer populates req.file if upload succeeded
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  logger.info(`Upload received: ${req.file.originalname} (${req.file.size} bytes)`);

  // ── 1. Extract text from PDF ───────────────────────────────
  const { text, pageCount, metadata } = await extractTextFromPDF(req.file.path);

  // ── 2. Generate session ID ─────────────────────────────────
  // This ID links this upload → FAISS index → future /analyze calls
  const sessionId = uuidv4();

  // ── 3. Chunk the extracted text ───────────────────────────
  // RecursiveCharacterTextSplitter → Document[]
  // Each Document: { pageContent: string, metadata: { sessionId, chunkIndex, ... } }
  const chunks = await chunkText(text, sessionId);

  // ── 4. Build FAISS index + persist to disk ─────────────────
  // Ada-002 embeds all chunks, FAISS indexes vectors,
  // saves index.faiss + docstore.json to /faiss_indexes/{sessionId}/
  const { chunkCount, indexPath } = await saveIndex(chunks, sessionId);

  logger.info(
    `Session created: ${sessionId} — ` +
    `${pageCount} pages, ${chunkCount} chunks, index: ${indexPath}`
  );

  return res.status(200).json({
    sessionId,
    pageCount,
    chunkCount,
    metadata,
    message: 'Resume uploaded and indexed successfully',
  });
});

// ────────────────────────────────────────────────────────────
// POST /api/analyze
// Accepts: { sessionId, jobDescription }
// Returns: { ats_score, match_percentage, missing_skills, ... }
// ────────────────────────────────────────────────────────────
router.post('/analyze', sanitizeAnalyzeInput, async (req, res) => {
  const { sessionId, jobDescription } = req.body;

  // ── Input validation ───────────────────────────────────────
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (!jobDescription || jobDescription.trim().length < 20) {
    return res.status(400).json({
      error: 'jobDescription is required and must be at least 20 characters',
    });
  }

  logger.info(`Analyze request — session: ${sessionId}`);

  // ── Run RAG chain ─────────────────────────────────────────
  // 1. Loads FAISS index for this session from disk
  // 2. Embeds jobDescription → similarity search → top-k chunks
  // 3. Builds structured prompt (system role + rubric + context + JD)
  // 4. Calls GPT-4o with response_format: json_object
  // 5. Parses + validates the structured JSON response
  try {
  const result = await runRAGChain(sessionId, jobDescription);
  return res.status(200).json(result);
} catch (err) {
  logger.error(`Analyze failed: ${err.message}`);

  return res.status(500).json({
    error: "Analysis failed",
    message: err.message,
  });
}
});

// ────────────────────────────────────────────────────────────
// DELETE /api/session/:sessionId
// Cleans up FAISS index files for this session
// ────────────────────────────────────────────────────────────
router.delete('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  // ── Validation: sessionId should be a valid UUID ──────────
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId format' });
  }

  // ── Delete FAISS index ─────────────────────────────────────
  const wasDeleted = await deleteIndex(sessionId);

  logger.info(`Session deleted: ${sessionId}`);
  return res.status(200).json({ deleted: wasDeleted, sessionId });
});

// ────────────────────────────────────────────────────────────
// GET /api/health
// ────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
});

export default router;
