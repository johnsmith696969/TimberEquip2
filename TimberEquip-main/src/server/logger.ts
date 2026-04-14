import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Structured logger for the Express server.
 * - Production: JSON output (parsed natively by Cloud Logging / Cloud Run)
 * - Development: Human-readable output via pino-pretty (installed as devDependency)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {
        // Cloud Logging severity field mapping
        messageKey: 'message',
        formatters: {
          level(label: string) {
            // Map pino levels to Cloud Logging severity
            const severityMap: Record<string, string> = {
              trace: 'DEBUG',
              debug: 'DEBUG',
              info: 'INFO',
              warn: 'WARNING',
              error: 'ERROR',
              fatal: 'CRITICAL',
            };
            return { severity: severityMap[label] || 'DEFAULT' };
          },
        },
      }
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
});

export default logger;
