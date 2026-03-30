const Sentry = require('@sentry/node');

let sentryInitialized = false;

function getSentryDsn() {
  return String(process.env.SENTRY_DSN || process.env.SENTRY_SERVER_DSN || '').trim();
}

function initializeFunctionsSentry() {
  if (sentryInitialized) return true;
  if (!getSentryDsn()) return false;

  Sentry.init({
    dsn: getSentryDsn(),
    environment: String(process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || process.env.GCLOUD_PROJECT || 'production').trim(),
    release: String(process.env.SENTRY_RELEASE || process.env.K_REVISION || '').trim() || undefined,
    sendDefaultPii: false,
    initialScope: {
      tags: {
        app: 'timberequip-functions',
      },
    },
  });

  sentryInitialized = true;
  return true;
}

function captureFunctionsException(error, context = {}) {
  if (!sentryInitialized) return;

  Sentry.withScope((scope) => {
    if (context.path) scope.setTag('request_path', String(context.path));
    if (context.method) scope.setTag('request_method', String(context.method));
    if (context.handler) scope.setTag('handler', String(context.handler));
    if (context.tags && typeof context.tags === 'object') {
      Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, String(value)));
    }
    if (context.extra && typeof context.extra === 'object') {
      Object.entries(context.extra).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureException(error);
  });
}

module.exports = {
  initializeFunctionsSentry,
  captureFunctionsException,
};
