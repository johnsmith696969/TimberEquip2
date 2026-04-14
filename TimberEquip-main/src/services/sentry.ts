import * as Sentry from '@sentry/react';
import type { UserProfile } from '../types';

let browserSentryInitialized = false;

function getBrowserSentryDsn(): string {
  return String(import.meta.env.VITE_SENTRY_DSN || '').trim();
}

function getBrowserSentryRelease(): string | undefined {
  const release = String(import.meta.env.VITE_SENTRY_RELEASE || import.meta.env.VITE_GIT_COMMIT_SHA || '').trim();
  return release || undefined;
}

function getBrowserSentryEnvironment(): string {
  return String(import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development').trim() || 'development';
}

function getBrowserTracingSampleRate(): number | undefined {
  const raw = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);
  if (!Number.isFinite(raw) || raw < 0) return undefined;
  return raw;
}

export function isBrowserSentryEnabled(): boolean {
  return Boolean(getBrowserSentryDsn());
}

export function initializeBrowserSentry(): void {
  if (browserSentryInitialized || !isBrowserSentryEnabled()) return;

  Sentry.init({
    dsn: getBrowserSentryDsn(),
    environment: getBrowserSentryEnvironment(),
    release: getBrowserSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: getBrowserTracingSampleRate(),
    normalizeDepth: 6,
    initialScope: {
      tags: {
        app: 'forestry-equipment-sales-web',
      },
    },
  });

  browserSentryInitialized = true;
}

export function setSentryUserContext(user: UserProfile | null | undefined): void {
  if (!browserSentryInitialized) return;

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.uid,
    email: user.email || undefined,
    username: user.displayName || undefined,
  });

  Sentry.setTag('account_role', user.role || 'unknown');
  if (user.activeSubscriptionPlanId) {
    Sentry.setTag('subscription_plan', user.activeSubscriptionPlanId);
  }
}

export function captureBrowserException(error: unknown, context?: Record<string, unknown>): void {
  if (!browserSentryInitialized) return;

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
