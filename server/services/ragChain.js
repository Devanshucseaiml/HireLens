// services/ragChain.js
//
// RAG Analysis Pipeline — Gemini Edition
//
// Flow:
//   1. Load FAISS index from disk (per sessionId)
//   2. Embed job description → cosine similarity → top-k resume chunks
//   3. Format chunks into context block
//   4. Build structured prompt (role + schema + rubric + context + JD)
//   5. Send the prompt to Gemini through ai.service.js
//   6. Parse + validate the JSON response
//   7. Return typed analysis object

import { loadIndex,
         similaritySearch } from './vectorStore.js';
import { generateJSON }     from './ai.service.js';
import logger               from '../utils/logger.js';

// ── Gemini / retrieval config ────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TOP_K        = parseInt(process.env.TOP_K_RESULTS || '5', 10);


// ────────────────────────────────────────────────────────────
// buildContext
// ────────────────────────────────────────────────────────────
const buildContext = (chunks) =>
  chunks
    .map((doc, i) => {
      const idx = doc.metadata?.chunkIndex ?? i;
      return `--- RESUME SECTION ${i + 1} (chunk ${idx}) ---\n${doc.pageContent.trim()}`;
    })
    .join('\n\n');


// ────────────────────────────────────────────────────────────
// buildPrompt
// ────────────────────────────────────────────────────────────
const buildPrompt = (context, jobDescription) => `
You are an ATS resume analyzer.

Return ONLY valid JSON. No explanation, no markdown, no extra text.

STRICT FORMAT:
{
  "ats_score": number,
  "match_percentage": number,
  "missing_skills": [],
  "present_skills": [],
  "suggestions": []
}

RULES:
- JSON must be complete and valid
- Do NOT cut response
- Do NOT add trailing commas
- suggestions max 5 items

Job Description:
${jobDescription}

Resume Context:
${context}
`;


// ────────────────────────────────────────────────────────────
// validateAndNormalize
// ────────────────────────────────────────────────────────────
const validateAndNormalize = (parsed) => {
  const required = [
    'ats_score', 'match_percentage',
    'missing_skills', 'present_skills', 'suggestions',
  ];

  const missing = required.filter((k) => !(k in parsed));
  if (missing.length > 0) {
    throw new Error(`Model response missing required fields: ${missing.join(', ')}`);
  }

  const clamp = (val, min, max) =>
    Math.min(max, Math.max(min, Math.round(Number(val) || 0)));

  const toStringArray = (val) => {
    if (Array.isArray(val))      return val.map(String).filter(Boolean);
    if (typeof val === 'string') return val.length ? [val] : [];
    return [];
  };

  return {
    ats_score:        clamp(parsed.ats_score, 0, 100),
    match_percentage: clamp(parsed.match_percentage, 0, 100),
    missing_skills:   toStringArray(parsed.missing_skills).slice(0, 20),
    present_skills:   toStringArray(parsed.present_skills).slice(0, 20),
    suggestions:      toStringArray(parsed.suggestions).slice(0, 6),
  };
};


// ────────────────────────────────────────────────────────────
// runRAGChain — main export
// ────────────────────────────────────────────────────────────
export const runRAGChain = async (sessionId, jobDescription) => {
  const startTime = Date.now();
  logger.info(`RAG chain started — session: ${sessionId}, model: ${GEMINI_MODEL}`);

  // Step 1 — Load FAISS index from disk
  const vectorStore = await loadIndex(sessionId);

  // Step 2 — Embed JD + retrieve top-k relevant resume chunks
  const relevantChunks = await similaritySearch(
    vectorStore,
    jobDescription,
    TOP_K
  );

  if (relevantChunks.length === 0) {
    throw new Error(
      'No relevant resume content retrieved. FAISS index may be empty.'
    );
  }

  logger.info(`Retrieved ${relevantChunks.length} chunks — building prompt`);

  // Step 3 — Build context block + full prompt
  const context = buildContext(relevantChunks).slice(0, 3000);
  const prompt  = buildPrompt(context, jobDescription);

  logger.debug(`Prompt length: ${prompt.length} chars`);

  // Step 4 — Call Gemini through the shared AI service
  const parsed = await generateJSON(prompt);

  // Step 5 — Validate schema + normalize types
  const result = validateAndNormalize(parsed);

  const elapsed = Date.now() - startTime;

  logger.info(
    `RAG chain complete — ` +
    `ats_score: ${result.ats_score}, ` +
    `match: ${result.match_percentage}%, ` +
    `elapsed: ${elapsed}ms`
  );

  // Step 7 — Return result + metadata
  return {
    ...result,
    meta: {
      sessionId,
      model:            GEMINI_MODEL,
      chunksRetrieved:  relevantChunks.length,
      processingTimeMs: elapsed,
    },
  };
};
