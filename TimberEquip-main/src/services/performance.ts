import { app } from '../firebase';

type FirebasePerformanceModule = typeof import('firebase/performance');
type FirebasePerformanceInstance = import('firebase/performance').FirebasePerformance;
type FirebaseTrace = import('firebase/performance').PerformanceTrace;
type TraceAttributes = Record<string, string | number | boolean | null | undefined>;
type TraceMetrics = Record<string, number | null | undefined>;

export interface ActivePerformanceTrace {
  putAttribute(key: string, value: string | number | boolean | null | undefined): void;
  putMetric(key: string, value: number | null | undefined): void;
  stop(metrics?: TraceMetrics): Promise<void>;
}

let performanceModulePromise: Promise<FirebasePerformanceModule | null> | null = null;
let performanceInstancePromise: Promise<FirebasePerformanceInstance | null> | null = null;

function normalizeAttributeValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeMetricValue(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

function getPerformanceEnabledFlag(): boolean {
  return String(import.meta.env.VITE_ENABLE_FIREBASE_PERFORMANCE || '').trim().toLowerCase() === 'true';
}

export function isFirebasePerformanceEnabled(): boolean {
  return typeof window !== 'undefined' && getPerformanceEnabledFlag();
}

async function getPerformanceModule(): Promise<FirebasePerformanceModule | null> {
  if (performanceModulePromise) return performanceModulePromise;

  performanceModulePromise = (async () => {
    if (!isFirebasePerformanceEnabled()) return null;

    try {
      const module = await import('firebase/performance');
      return module;
    } catch (error) {
      console.warn('Firebase Performance Monitoring module is unavailable:', error);
      return null;
    }
  })();

  return performanceModulePromise;
}

async function getPerformanceInstance(): Promise<FirebasePerformanceInstance | null> {
  if (performanceInstancePromise) return performanceInstancePromise;

  performanceInstancePromise = (async () => {
    const module = await getPerformanceModule();
    if (!module) return null;

    try {
      return module.getPerformance(app);
    } catch (error) {
      console.warn('Firebase Performance Monitoring could not initialize:', error);
      return null;
    }
  })();

  return performanceInstancePromise;
}

export async function initializePerformanceMonitoring(): Promise<boolean> {
  const instance = await getPerformanceInstance();
  return Boolean(instance);
}

export async function startPerformanceTrace(
  name: string,
  attributes?: TraceAttributes
): Promise<ActivePerformanceTrace | null> {
  const module = await getPerformanceModule();
  const instance = await getPerformanceInstance();
  if (!module || !instance) return null;

  try {
    const activeTrace = module.trace(instance, name);
    activeTrace.start();

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        const normalizedValue = normalizeAttributeValue(value);
        if (normalizedValue) {
          activeTrace.putAttribute(key, normalizedValue);
        }
      });
    }

    return {
      putAttribute(key, value) {
        const normalizedValue = normalizeAttributeValue(value);
        if (normalizedValue) {
          activeTrace.putAttribute(key, normalizedValue);
        }
      },
      putMetric(key, value) {
        const normalizedValue = normalizeMetricValue(value);
        if (normalizedValue !== null) {
          activeTrace.putMetric(key, normalizedValue);
        }
      },
      async stop(metrics) {
        if (metrics) {
          Object.entries(metrics).forEach(([key, value]) => {
            const normalizedValue = normalizeMetricValue(value);
            if (normalizedValue !== null) {
              activeTrace.putMetric(key, normalizedValue);
            }
          });
        }
        activeTrace.stop();
      },
    };
  } catch (error) {
    console.warn(`Unable to start Firebase Performance trace "${name}":`, error);
    return null;
  }
}

export async function withPerformanceTrace<T>(
  name: string,
  attributes: TraceAttributes | undefined,
  run: (trace: ActivePerformanceTrace | null) => Promise<T>
): Promise<T> {
  const activeTrace = await startPerformanceTrace(name, attributes);
  const startedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

  try {
    const result = await run(activeTrace);
    const durationMs = (typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()) - startedAt;
    activeTrace?.putAttribute('status', 'ok');
    activeTrace?.putMetric('duration_ms', durationMs);
    await activeTrace?.stop();
    return result;
  } catch (error) {
    const durationMs = (typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()) - startedAt;
    activeTrace?.putAttribute('status', 'error');
    activeTrace?.putAttribute('error_type', error instanceof Error ? error.name : 'unknown');
    activeTrace?.putMetric('duration_ms', durationMs);
    await activeTrace?.stop();
    throw error;
  }
}
