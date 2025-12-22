import winston from 'winston';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';

const isProduction = process.env.NODE_ENV === 'production';

const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const meta = Object.keys(metadata).length 
    ? ` :: ${JSON.stringify(metadata)}` 
    : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${meta}`;
});

const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'h:mm:ss A' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  customFormat
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: { service: 'quarterdeck-api' },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

if (isProduction) {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

export const httpLogger = (req: any, res: any, responseTime: number, responseBody?: any) => {
  const logData = {
    method: req.method,
    path: req.originalUrl || req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Request', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

export default logger;
