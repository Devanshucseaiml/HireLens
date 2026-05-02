// services/embedder.js
//
// Responsibilities:
//   1. Split raw resume text into overlapping chunks
//   2. Convert each chunk into a 384-dim local embedding
//      using @xenova/transformers (all-MiniLM-L6-v2)
//
// Why @xenova/transformers over OpenAI embeddings?
//   - Zero API cost — model runs locally in the Node.js process
//   - No rate limits, no network dependency after first download
//   - all-MiniLM-L6-v2 is purpose-built for semantic similarity
//   - Model (~90MB) downloads once to ~/.cache/huggingface/ on first run
//
// IMPORTANT — dimension change:
//   OpenAI Ada-002  → 1536-dim vectors
//   all-MiniLM-L6-v2 → 384-dim vectors
//
//   FAISS indexes are dimension-locked at creation time.
//   Delete all existing indexes before switching models:
//     rm -rf server/faiss_indexes/*

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Embeddings }                      from '@langchain/core/embeddings';
import { pipeline }                        from '@xenova/transformers';
import logger                              from '../utils/logger.js';

// ── Model config from .env ───────────────────────────────────
const MODEL_NAME = process.env.HUGGINGFACE_EMBEDDING_MODEL
  || 'Xenova/all-MiniLM-L6-v2';

// ── Singleton pipeline ───────────────────────────────────────
// @xenova/transformers downloads + caches the model on first call.
// We keep one pipeline instance alive for the server's lifetime
// so we pay the ~1-2s load cost only once, not per request.
//
// pipeline('feature-extraction', model) returns a function that
// accepts a string and returns a tensor of shape [1, tokens, 384].
// We mean-pool across the token dimension → one 384-dim vector.

let _pipelineInstance = null;

const getPipeline = async () => {
  if (!_pipelineInstance) {
    logger.info(`Loading embedding model: ${MODEL_NAME} (first load may take a moment)`);
    _pipelineInstance = await pipeline('feature-extraction', MODEL_NAME, {
      // Suppress the @xenova/transformers progress bar in server logs
      progress_callback: null,
    });
    logger.info(`Embedding model loaded: ${MODEL_NAME}`);
  }
  return _pipelineInstance;
};

// ── HuggingFaceLocalEmbeddings ───────────────────────────────
// LangChain expects an Embeddings subclass with two methods:
//
//   embedDocuments(texts: string[]) → Promise<number[][]>
//   embedQuery(text: string)        → Promise<number[]>
//
// We extend the base Embeddings class so our local model plugs
// directly into FaissStore.fromDocuments() and similaritySearch()
// without any changes to vectorStore.js.
//
// Mean pooling explained:
//   The model outputs one vector per token (shape: [tokens, 384]).
//   We average across all token vectors → one 384-dim sentence vector.
//   This is the standard technique for sentence-level embeddings.

class HuggingFaceLocalEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  // ── embedDocuments ─────────────────────────────────────────
  // Embeds an array of strings (chunks).
  // Called by FaissStore.fromDocuments() during indexing.
  //
  // We process sequentially (not Promise.all) to avoid
  // overwhelming the local model with parallel tensor ops.

  async embedDocuments(texts) {
    logger.info(`Embedding ${texts.length} chunks with ${MODEL_NAME}`);

    const extractor = await getPipeline();
    const embeddings = [];

    for (let i = 0; i < texts.length; i++) {
      const vector = await this._embed(extractor, texts[i]);
      embeddings.push(vector);

      // Progress log every 5 chunks for long resumes
      if ((i + 1) % 5 === 0 || i === texts.length - 1) {
        logger.debug(`  Embedded ${i + 1}/${texts.length} chunks`);
      }
    }

    logger.info(`Embedding complete — ${embeddings.length} vectors (dim: ${embeddings[0]?.length})`);
    return embeddings;
  }

  // ── embedQuery ─────────────────────────────────────────────
  // Embeds a single string (job description query).
  // Called by FaissStore.similaritySearch() at query time.
  // MUST use the same model as embedDocuments — enforced by singleton.

  async embedQuery(text) {
    logger.info(`Embedding query — length: ${text.length} chars`);
    const extractor = await getPipeline();
    return this._embed(extractor, text);
  }

  // ── _embed (private) ───────────────────────────────────────
  // Core embedding logic: text → mean-pooled 384-dim float array.
  //
  // Steps:
  //   1. extractor(text) → Tensor { data: Float32Array, dims: [1, tokens, 384] }
  //   2. Mean pool across token dimension (dim=1) → [1, 384]
  //   3. Flatten → plain JS number[] of length 384

  async _embed(extractor, text) {
    // truncate to avoid model's 512-token limit silently failing
    const truncated = text.slice(0, 2000);

    const output = await extractor(truncated, {
      pooling: 'mean',    // mean-pool across token dimension
      normalize: true,    // L2-normalize → cosine sim = dot product
    });

    // output.data is a Float32Array — convert to plain number[]
    // FAISS and LangChain both expect plain JS arrays
    return Array.from(output.data);
  }
}

// ── Text Splitter ─────────────────────────────────────────────
// RecursiveCharacterTextSplitter tries separators in order:
//   ["\n\n", "\n", ". ", " ", ""]
// Preserves paragraph → sentence → word boundaries.
//
// chunk_size    = 500  → specific enough for precise retrieval
// chunk_overlap = 50   → prevents meaning loss at boundaries

const createTextSplitter = () =>
  new RecursiveCharacterTextSplitter({
    chunkSize:      parseInt(process.env.CHUNK_SIZE    || '500', 10),
    chunkOverlap:   parseInt(process.env.CHUNK_OVERLAP || '50',  10),
    lengthFunction: (text) => Math.ceil(text.length / 4), // ~4 chars/token
  });

// ── chunkText ─────────────────────────────────────────────────
// Splits raw text into LangChain Document objects.
// Document = { pageContent: string, metadata: object }
//
// @param  {string} text      - cleaned resume text from pdfExtractor
// @param  {string} sessionId - tags each chunk's metadata
// @returns {Document[]}

export const chunkText = async (text, sessionId) => {
  logger.info(`Chunking text — length: ${text.length} chars, session: ${sessionId}`);

  const splitter  = createTextSplitter();
  const rawChunks = await splitter.createDocuments([text]);

  const chunks = rawChunks.map((doc, index) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      sessionId,
      chunkIndex: index,
      charCount:  doc.pageContent.length,
      source:     'resume',
    },
  }));

  logger.info(
    `Chunking complete — ${chunks.length} chunks, ` +
    `avg size: ${Math.round(text.length / chunks.length)} chars/chunk`
  );

  if (chunks.length < 3) {
    logger.warn(
      `Only ${chunks.length} chunks generated. ` +
      `Resume may be too short or extraction may have failed.`
    );
  }

  return chunks;
};

// ── getEmbeddingsModel ────────────────────────────────────────
// Returns our HuggingFaceLocalEmbeddings instance.
// Exported for use in vectorStore.js — same instance used for
// BOTH indexing and querying. Model consistency is guaranteed
// because both calls hit the same singleton pipeline.

export const getEmbeddingsModel = () => new HuggingFaceLocalEmbeddings();
