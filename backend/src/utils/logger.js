const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for file output (no colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory path
const logsDir = path.join(__dirname, '../../logs');

// Define transports
const transports = [
  // Console transport - always enabled
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports only in production or if LOG_TO_FILE is set
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Helper methods for common logging patterns
logger.logRequest = (req, message = 'Request received') => {
  logger.http(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?._id,
  });
};

logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };

  if (req) {
    errorInfo.method = req.method;
    errorInfo.url = req.originalUrl;
    errorInfo.userId = req.user?._id;
  }

  logger.error('Error occurred', errorInfo);
};

logger.logOrder = (order, action) => {
  logger.info(`Order ${action}`, {
    orderId: order._id,
    orderCode: order.orderCode,
    total: order.total,
    status: order.orderStatus,
  });
};

logger.logAuth = (userId, action, success = true) => {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth: ${action}`, { userId, success });
};

logger.logNewsletter = (email, action) => {
  logger.info(`Newsletter: ${action}`, { email });
};

module.exports = logger;
