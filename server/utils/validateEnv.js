import logger from './logger.js';

const REQUIRED_ENV_VARS = [
  'GEMINI_API_KEY',
  'PORT',
  'FAISS_INDEX_DIR',
  'UPLOAD_DIR',
];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  logger.info('Environment validated ✓');
};

export default validateEnv;
