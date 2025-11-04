/**
 * Logger utility module
 * Provides consistent logging functionality throughout the application
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const LOG_LEVEL_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[35m', // Magenta
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
  }

  /**
   * Format log message with timestamp
   */
  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  /**
   * Log to console with colors
   */
  _logToConsole(level, message, data) {
    const formattedMessage = this._formatMessage(level, message, data);
    const color = LOG_LEVEL_COLORS[level] || '';
    console.log(`${color}${formattedMessage}${RESET_COLOR}`);
  }

  /**
   * Log to file
   */
  _logToFile(level, message, data) {
    if (!this.enableFile) return;

    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    const formattedMessage = this._formatMessage(level, message, data);

    try {
      fs.appendFileSync(logFile, formattedMessage + '\n');

      // Check file size and rotate if necessary
      const stats = fs.statSync(logFile);
      if (stats.size > this.maxFileSize) {
        this._rotateLogFile(logFile);
      }
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Rotate log file when it gets too large
   */
  _rotateLogFile(logFile) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newName = `${logFile}.${timestamp}`;
    fs.renameSync(logFile, newName);
  }

  /**
   * Check if a log level should be logged
   */
  _shouldLog(level) {
    const levels = Object.values(LOG_LEVELS);
    const currentLevelIndex = levels.indexOf(this.level);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex <= currentLevelIndex;
  }

  /**
   * Core logging method
   */
  _log(level, message, data) {
    if (!this._shouldLog(level)) return;

    if (this.enableConsole) {
      this._logToConsole(level, message, data);
    }

    this._logToFile(level, message, data);
  }

  // Public logging methods
  error(message, data) {
    this._log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Log API request/response
   */
  logRequest(req, message = '') {
    const requestInfo = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      message,
    };
    this.info('API Request', requestInfo);
  }

  /**
   * Log API response
   */
  logResponse(statusCode, duration, message = '') {
    const responseInfo = {
      statusCode,
      duration: `${duration}ms`,
      message,
    };
    this.info('API Response', responseInfo);
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation, collection, duration, message = '') {
    const dbInfo = {
      operation,
      collection,
      duration: `${duration}ms`,
      message,
    };
    this.debug('Database Operation', dbInfo);
  }
}

// Create singleton instance
const logger = new Logger({
  level: process.env.LOG_LEVEL || LOG_LEVELS.INFO,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
});

module.exports = logger;
