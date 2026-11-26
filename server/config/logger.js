import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Format that strips sensitive fields (passwords, tokens, OTPs) from log strings
const redactSensitive = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = info.message
      .replace(/("?(?:password|token|otp|code)"?\s*:\s*)"[^"]+"/gi, '$1"********"')
      .replace(/((?:password|token|otp|code)=)[^\s&]+/gi, '$1********');
  }
  return info;
});

const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] [${level}]: ${stack || message}`;
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/cinepulse-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '14d',
  level: 'info'
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    redactSensitive(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        redactSensitive(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      )
    }),
    fileRotateTransport
  ]
});
