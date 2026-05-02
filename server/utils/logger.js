// utils/logger.js
// Thin logger wrapper — swap for Winston/Pino in production
// without changing any other file

const timestamp = () => new Date().toISOString();

const logger = {
  info:  (...args) => console.log(`[${timestamp()}] INFO `, ...args),
  warn:  (...args) => console.warn(`[${timestamp()}] WARN `, ...args),
  error: (...args) => console.error(`[${timestamp()}] ERROR`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp()}] DEBUG`, ...args);
    }
  },
};

export default logger;
