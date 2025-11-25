/**
 * Logger utility
 */

const log = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (Object.keys(data).length > 0) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      log('debug', message, data);
    }
  },
};

module.exports = { logger };

