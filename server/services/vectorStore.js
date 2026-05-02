// services/vectorStore.js
//
// Responsibilities:
//   1. Take LangChain Document chunks + embeddings → build FAISS index
//   2. Persist index to disk at /faiss_indexes/{sessionId}/
//   3. Load existing index from disk for a given sessionId
//   4. Run similarity search (query vector vs stored vectors)
//   5. Delete index files (session cleanup)
//
// Files written per session:
//   /faiss_indexes/{sessionId}/index.faiss    ← binary vector index
//   /faiss_indexes/{sessionId}/docstore.json  ← chunkId → text mapping

import { FaissStore }         from '@langchain/community/vectorstores/faiss';
import { getEmbeddingsModel } from './embedder.js';
import path                   from 'path';
import fs                     from 'fs';
import { fileURLToPath }      from 'url';
import logger                 from '../utils/logger.js';

// ── ESM __dirname shim ───────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Base directory for all FAISS indexes ────────────────────
const FAISS_BASE_DIR = path.resolve(
  __dirname,
  '..',
  process.env.FAISS_INDEX_DIR || './faiss_indexes'
);

// ── getIndexPath ─────────────────────────────────────────────
// Returns the directory path for a given session's FAISS index.
// All index operations use this to stay consistent.
//
// @param  {string} sessionId
// @returns {string} absolute path

const getIndexPath = (sessionId) => path.join(FAISS_BASE_DIR, sessionId);

// ── saveIndex ────────────────────────────────────────────────
// Core indexing function. Called once per resume upload.
//
// Flow:
//   chunks[] (Document[])
//     → FaissStore.fromDocuments()     ← builds index + embeds in one call
//     → vectorStore.save(dirPath)      ← writes index.faiss + docstore.json
//
// FaissStore.fromDocuments() internally:
//   1. Calls embeddings.embedDocuments(chunks) → float[][] via Ada-002
//   2. Builds FAISS flat index from those vectors
//   3. Stores vector ID → Document mapping in docstore
//
// @param  {Document[]} chunks    - from chunkText() in embedder.js
// @param  {string}     sessionId - unique ID for this upload session
// @returns {object}    { chunkCount, indexPath }

export const saveIndex = async (chunks, sessionId) => {
  const indexPath = getIndexPath(sessionId);

  // ── Create session directory ───────────────────────────────
  if (!fs.existsSync(indexPath)) {
    fs.mkdirSync(indexPath, { recursive: true });
    logger.info(`Created FAISS index dir: ${indexPath}`);
  }

  logger.info(
    `Building FAISS index — ${chunks.length} chunks, session: ${sessionId}`
  );

  // ── Build index + embed in one LangChain call ──────────────
  // getEmbeddingsModel() returns the same Ada-002 config used everywhere.
  // fromDocuments() batches the embedding calls automatically.
  let vectorStore;
  try {
    vectorStore = await FaissStore.fromDocuments(
      chunks,
      getEmbeddingsModel()
    );
  } catch (err) {
    // Clean up empty directory if indexing fails
    fs.rmSync(indexPath, { recursive: true, force: true });
    throw new Error(`FAISS indexing failed: ${err.message}`);
  }

  // ── Persist to disk ────────────────────────────────────────
  // Writes:
  //   {indexPath}/index.faiss     — binary flat vector index
  //   {indexPath}/docstore.json   — JSON mapping: vectorId → Document
  try {
    await vectorStore.save(indexPath);
  } catch (err) {
    throw new Error(`FAISS save failed: ${err.message}`);
  }

  // ── Verify files were written ──────────────────────────────
  const faissFile    = path.join(indexPath, 'faiss.index');
  const docstoreFile = path.join(indexPath, 'docstore.json');

  // LangChain writes 'faiss.index' (not 'index.faiss') — note the naming
  const indexExists    = fs.existsSync(faissFile) || fs.existsSync(path.join(indexPath, 'index.faiss'));
  const docstoreExists = fs.existsSync(docstoreFile);

  if (!docstoreExists) {
    logger.warn(`docstore.json not found at ${indexPath} — index may be incomplete`);
  }

  logger.info(
    `FAISS index saved — session: ${sessionId}, ` +
    `chunks: ${chunks.length}, path: ${indexPath}`
  );

  return {
    chunkCount: chunks.length,
    indexPath,
  };
};

// ── loadIndex ────────────────────────────────────────────────
// Loads a previously saved FAISS index from disk.
// Called at query time (POST /api/analyze).
//
// @param  {string} sessionId
// @returns {FaissStore} loaded vector store ready for similarity search
// @throws  if index directory doesn't exist (session expired or invalid)

export const loadIndex = async (sessionId) => {
  const indexPath = getIndexPath(sessionId);

  // ── Validate index exists ──────────────────────────────────
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `FAISS index not found for session: ${sessionId}. ` +
      `Session may have expired or resume was never uploaded.`
    );
  }

  logger.info(`Loading FAISS index — session: ${sessionId}, path: ${indexPath}`);

  try {
    // FaissStore.load() reads index.faiss + docstore.json
    // Must use the SAME embeddings model that was used during indexing
    const vectorStore = await FaissStore.load(
      indexPath,
      getEmbeddingsModel()
    );

    logger.info(`FAISS index loaded — session: ${sessionId}`);
    return vectorStore;
  } catch (err) {
    throw new Error(`Failed to load FAISS index: ${err.message}`);
  }
};

// ── similaritySearch ─────────────────────────────────────────
// Runs cosine similarity search against the stored index.
//
// How it works:
//   1. query text → Ada-002 → 1536-dim query vector
//   2. FAISS computes cosine similarity: score = (A·B) / (|A|×|B|)
//   3. Returns top-k Documents sorted by score (highest = most relevant)
//
// The returned Documents contain the original chunk text (pageContent)
// which is passed as context to GPT-4 in Step 4.
//
// @param  {FaissStore} vectorStore - loaded index from loadIndex()
// @param  {string}     query       - job description text
// @param  {number}     k           - number of chunks to retrieve
// @returns {Document[]}            - top-k most relevant resume chunks

export const similaritySearch = async (vectorStore, query, k) => {
  const topK = k || parseInt(process.env.TOP_K_RESULTS || '5', 10);

  logger.info(`Similarity search — query length: ${query.length} chars, k: ${topK}`);

  try {
    // withScore returns [Document, score][] so we can log relevance
    const resultsWithScore = await vectorStore.similaritySearchWithScore(
      query,
      topK
    );

    // Log scores for observability (helps tune TOP_K_RESULTS)
    resultsWithScore.forEach(([doc, score], i) => {
      logger.debug(
        `  Chunk ${i + 1}: score=${score.toFixed(4)}, ` +
        `chars=${doc.pageContent.length}, ` +
        `index=${doc.metadata.chunkIndex}`
      );
    });

    // Return just the Documents (scores served their logging purpose)
    return resultsWithScore.map(([doc]) => doc);
  } catch (err) {
    throw new Error(`Similarity search failed: ${err.message}`);
  }
};

// ── deleteIndex ──────────────────────────────────────────────
// Removes all FAISS index files for a session from disk.
// Called by DELETE /api/session/:sessionId and the TTL cleanup job.
//
// @param  {string} sessionId
// @returns {boolean} true if deleted, false if didn't exist

export const deleteIndex = async (sessionId) => {
  const indexPath = getIndexPath(sessionId);

  if (!fs.existsSync(indexPath)) {
    logger.warn(`Delete requested for non-existent index: ${sessionId}`);
    return false;
  }

  fs.rmSync(indexPath, { recursive: true, force: true });
  logger.info(`FAISS index deleted — session: ${sessionId}`);
  return true;
};

// ── listIndexes ──────────────────────────────────────────────
// Returns all session IDs that have indexes on disk.
// Used by cleanup job to find + delete expired indexes.
//
// @returns {Array<{sessionId, createdAt, sizeBytes}>}

export const listIndexes = () => {
  if (!fs.existsSync(FAISS_BASE_DIR)) return [];

  return fs.readdirSync(FAISS_BASE_DIR)
    .filter((name) => {
      const fullPath = path.join(FAISS_BASE_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    })
    .map((sessionId) => {
      const fullPath = path.join(FAISS_BASE_DIR, sessionId);
      const stat     = fs.statSync(fullPath);

      // Calculate total size of index files
      const files     = fs.readdirSync(fullPath);
      const sizeBytes = files.reduce((total, file) => {
        return total + fs.statSync(path.join(fullPath, file)).size;
      }, 0);

      return {
        sessionId,
        createdAt:  stat.birthtime,
        sizeBytes,
        sizeMB:     (sizeBytes / (1024 * 1024)).toFixed(2),
      };
    });
};
