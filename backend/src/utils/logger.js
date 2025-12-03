import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (human-readable for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create transports array
const transports = [];

// Console transport (always enabled in development)
if (config.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    })
  );
}

// File transport - All logs
transports.push(
  new DailyRotateFile({
    filename: path.join(config.logging.dir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: logFormat,
    level: 'info',
  })
);

// File transport - Error logs only
transports.push(
  new DailyRotateFile({
    filename: path.join(config.logging.dir, 'errors-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: logFormat,
    level: 'error',
  })
);

// File transport - Audit logs (for sensitive actions)
transports.push(
  new DailyRotateFile({
    filename: path.join(config.logging.dir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: config.logging.maxSize,
    maxFiles: '365d', // Keep audit logs for 1 year
    format: logFormat,
    level: 'info',
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Add stream for Morgan HTTP logger
logger.stream = {
  write: message => {
    logger.info(message.trim());
  },
};

// Custom audit log function
logger.audit = (action, details) => {
  logger.info('AUDIT', {
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Custom error log function with context
logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export default logger;
