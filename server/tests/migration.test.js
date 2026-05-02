import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest, describe, beforeEach, afterEach, expect, test } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const servicePath = path.resolve(__dirname, '../services/ai.service.js');

const createMockClient = () => ({
  models: {
    generateContent: jest.fn(),
    generateContentStream: jest.fn(),
  },
});

const loadService = async (mockClient) => {
  await jest.unstable_mockModule('@google/genai', () => ({
    GoogleGenAI: jest.fn(() => mockClient),
  }));

  return import(servicePath);
};

describe('Gemini migration service', () => {
  const originalEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    jest.resetModules();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    process.env.GEMINI_MODEL = originalEnv.GEMINI_MODEL;
    jest.restoreAllMocks();
  });

  test('generate() returns text from the mocked Gemini response', async () => {
    const mockClient = createMockClient();
    mockClient.models.generateContent.mockResolvedValue({ text: 'Resume analysis complete.' });

    const { generate } = await loadService(mockClient);

    await expect(generate('Analyze this resume')).resolves.toBe('Resume analysis complete.');
  });

  test('generateJSON() parses valid JSON text', async () => {
    const mockClient = createMockClient();
    mockClient.models.generateContent.mockResolvedValue({
      text: '{"ats_score":92,"match_percentage":84}',
    });

    const { generateJSON } = await loadService(mockClient);

    await expect(generateJSON('Return JSON')).resolves.toEqual({
      ats_score: 92,
      match_percentage: 84,
    });
  });

  test('generateJSON() retries fenced JSON and succeeds', async () => {
    const mockClient = createMockClient();
    mockClient.models.generateContent.mockResolvedValue({
      text: '```json\n{"ats_score":88,"match_percentage":91}\n```',
    });

    const { generateJSON } = await loadService(mockClient);

    await expect(generateJSON('Return JSON')).resolves.toEqual({
      ats_score: 88,
      match_percentage: 91,
    });
  });

  test('generate() throws a readable error on 429 quota errors', async () => {
    const mockClient = createMockClient();
    mockClient.models.generateContent.mockRejectedValue({
      status: 429,
      message: 'Too many requests',
    });

    const { generate } = await loadService(mockClient);

    await expect(generate('Analyze this resume')).rejects.toThrow(
      'Gemini quota exceeded (429). The free tier allows 15 requests per minute.'
    );
  });

  test("ai.service.js contains no 'ollama' references", async () => {
    const source = fs.readFileSync(servicePath, 'utf8');
    expect(source.toLowerCase()).not.toContain('ollama');
  });
});
