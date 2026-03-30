import * as Sentry from '@sentry/node';

let serverSentryInitialized = false;

function getServerSentryDsn(): string {
  return String(process.env.SENTRY_DSN || process.env.SENTRY_SERVER_DSN || '').trim();
}

function getServerSentryRelease(): string | undefined {
  const release = String(process.env.SENTRY_RELEASE || process.env.GIT_COMMIT_SHA || '').trim();
  return release || undefined;
}

function getServerSentryEnvironment(): string {
  return String(process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development').trim() || 'development';
}

export function initializeServerSentry(): boolean {
  if (serverSentryInitialized) return true;
  if (!getServerSentryDsn()) return false;

  Sentry.init({
    dsn: getServerSentryDsn(),
    environment: getServerSentryEnvironment(),
    release: getServerSentryRelease(),
    sendDefaultPii: false,
    initialScope: {
      tags: {
        app: 'timberequip-server',
      },
    },
  });

  serverSentryInitialized = true;
  return true;
}

export function captureServerException(
  error: unknown,
  context?: {
    path?: string;
    method?: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): void {
  if (!serverSentryInitialized) return;

  Sentry.withScope((scope) => {
    if (context?.path) scope.setTag('request_path', context.path);
    if (context?.method) scope.setTag('request_method', context.method);
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, value));
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureException(error);
  });
}
