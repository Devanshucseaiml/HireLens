import logger from './logger.js';

const REQUIRED_ENV_VARS = [
  'GEMINI_API_KEY',
  'JWT_SECRET',
];

const DEFAULT_ENV_VALUES = {
  PORT: '5001',
  UPLOAD_DIR: './uploads',
  FAISS_INDEX_DIR: './faiss_indexes',
  TOP_K_RESULTS: '2',
};

export const validateEnv = () => {
  // Fill non-sensitive defaults so production deploys don't fail when optional vars are omitted.
  Object.entries(DEFAULT_ENV_VALUES).forEach(([key, value]) => {
    if (typeof process.env[key] !== 'string' || process.env[key].trim() === '') {
      process.env[key] = value;
    }
  });

  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.includes('change-in-production')) {
    logger.error('JWT_SECRET appears to be a placeholder. Set a strong production secret.');
    process.exit(1);
  }

  logger.info('Environment validated ✓');
};

export default validateEnv;
