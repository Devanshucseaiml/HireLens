import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

if (!GEMINI_API_KEY) {
  throw new Error(
    'GEMINI_API_KEY is required. Set it before importing server/services/ai.service.js.'
  );
}

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

// Create one SDK client for the process so every call reuses the same auth setup.
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Detect whether a Gemini SDK error represents a 429 quota limit.
 *
 * @param {unknown} error - Error thrown by the SDK.
 * @returns {boolean} True when the error looks like a quota failure.
 */
const isQuotaError = (error) => {
  const status = error?.status ?? error?.statusCode ?? error?.code;
  return status === 429 || String(error?.message || '').includes('429');
};

/**
 * Remove leading and trailing Markdown code fences from a JSON response.
 *
 * @param {string} text - Raw model output.
 * @returns {string} The same text with common JSON fences removed.
 */
const stripJsonFences = (text) => text
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
  .trim();

/**
 * Convert an SDK error into a readable application error.
 *
 * @param {unknown} error - Error thrown while calling Gemini.
 * @returns {Error} A normalized error object.
 */
const toReadableError = (error) => {
  if (isQuotaError(error)) {
    return new Error(
      'Gemini quota exceeded (429). The free tier allows 15 requests per minute. Please retry later.'
    );
  }

  const message = error?.message || 'Unknown Gemini error';
  return new Error(`Gemini request failed: ${message}`);
};

/**
 * Generate plain text from Gemini for a prompt.
 *
 * @param {string} prompt - User prompt to send to Gemini.
 * @returns {Promise<string>} The generated response text.
 */
export async function generate(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response?.text?.trim?.() || String(response?.text || '').trim();

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * Generate a JSON object from Gemini output.
 *
 * @param {string} prompt - Base prompt to send to Gemini.
 * @returns {Promise<object>} Parsed JSON result.
 */
export async function generateJSON(prompt) {
  const responseText = await generate(`${prompt}\n\nReturn ONLY valid JSON. No markdown.`);

  try {
    return JSON.parse(responseText);
  } catch (firstError) {
    const stripped = stripJsonFences(responseText);

    try {
      return JSON.parse(stripped);
    } catch (secondError) {
      throw new Error(
        `Gemini JSON parsing failed after retry. First error: ${firstError.message}. ` +
        `Second error: ${secondError.message}. Preview: ${responseText.slice(0, 200)}`
      );
    }
  }
}

/**
 * Stream Gemini output chunks into a callback as they arrive.
 *
 * @param {string} prompt - Prompt to stream to Gemini.
 * @param {Function} onChunk - Callback invoked with each chunk of text.
 * @returns {Promise<void>} Resolves when the stream ends.
 */
export async function streamResponse(prompt, onChunk) {
  if (typeof onChunk !== 'function') {
    throw new TypeError('streamResponse requires an onChunk callback function.');
  }

  try {
    const response = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    for await (const chunk of response) {
      if (chunk?.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    throw toReadableError(error);
  }
}
