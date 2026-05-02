// services/pdfExtractor.js
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import logger from '../utils/logger.js';

// ── extractTextFromPDF ───────────────────────────────────────
// Reads PDF from disk, extracts raw text, deletes the file.
//
// @param  {string} filePath  - absolute or relative path to PDF
// @returns {object}          - { text, pageCount, metadata }
// @throws                    - if file unreadable or parse fails

const extractTextFromPDF = async (filePath) => {
  let dataBuffer;

  // ── 1. Read file into buffer ───────────────────────────────
  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(`Could not read uploaded file: ${err.message}`);
  }

  // ── 2. Parse PDF ───────────────────────────────────────────
  let parsedText;
  let parsedInfo;
  try {
    const parser = new PDFParse({ data: dataBuffer });
    try {
      parsedText = await parser.getText();
      // Metadata is useful but non-critical for core analysis flow.
      parsedInfo = await parser.getInfo().catch(() => null);
    } finally {
      await parser.destroy();
    }
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}`);
  }

  // ── 3. Delete file immediately (PII hygiene) ───────────────
  // We have the text — the PDF is no longer needed.
  // This runs regardless of parse success.
  try {
    fs.unlinkSync(filePath);
    logger.info(`Deleted uploaded file: ${filePath}`);
  } catch (err) {
    // Non-fatal — log and continue. File cleanup job handles orphans.
    logger.warn(`Could not delete file ${filePath}: ${err.message}`);
  }

  // ── 4. Clean and validate extracted text ──────────────────
  const rawText = parsedText?.text || '';

  // Collapse excessive whitespace / blank lines
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')          // normalize line endings
    .replace(/\n{3,}/g, '\n\n')      // max 2 consecutive blank lines
    .replace(/[ \t]{2,}/g, ' ')      // collapse inline whitespace
    .trim();

  logger.debug(`PDF text extraction: raw ${rawText.length} chars → cleaned ${cleanedText.length} chars`);

  if (cleanedText.length < 10) {
    const error = new Error(
      'Extracted text is too short. The PDF may be image-based or empty. ' +
      'Please upload a text-selectable PDF. ' +
      '(Extracted: ' + cleanedText.length + ' chars)'
    );

    error.statusCode = 422;
    error.code = 'INVALID_PDF_TEXT';
    throw error;
  }

  logger.info(
    `PDF extracted — pages: ${parsedText?.total || 0}, ` +
    `chars: ${cleanedText.length}`
  );

  return {
    text: cleanedText,
    pageCount: parsedText?.total || 0,
    metadata: {
      // pdf-parse exposes these when available
      title:    parsedInfo?.info?.Title    || null,
      author:   parsedInfo?.info?.Author   || null,
      creator:  parsedInfo?.info?.Creator  || null,
    },
  };
};

export default extractTextFromPDF;
