import { auth } from '../../firebase';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseAuthUser } from 'firebase/auth';

// ── Error handling ──────────────────────────────────────────────────────────

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  if (error instanceof Error && !/firestore|permission|quota/i.test(error.message)) {
    throw error;
  }
  console.error(`Firestore ${operationType} error on ${path || 'unknown'}`);
  throw new Error(`Firestore ${operationType} failed`);
}

// ── API fetch helpers ───────────────────────────────────────────────────────

export function getApiRequestUrls(input: RequestInfo | URL): string[] {
  const rawInput = typeof input === 'string' ? input : input instanceof URL ? input.toString() : String(input);
  if (typeof window === 'undefined' || !rawInput.startsWith('/api/')) {
    return [rawInput];
  }

  const urls = [rawInput];
  const hostname = window.location.hostname.trim().toLowerCase();
  if (hostname === 'www.timberequip.com') {
    urls.push(`https://timberequip.com${rawInput}`);
  }

  return Array.from(new Set(urls));
}

export async function fetchApiWithFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urls = getApiRequestUrls(input);
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await fetch(url, init);
      if (response.ok || index === urls.length - 1 || response.status !== 404) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (index === urls.length - 1) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error('Equipment API request failed');
}

export async function waitForAuthenticatedUser(timeoutMs = 4000): Promise<FirebaseAuthUser | null> {
  if (auth.currentUser) return auth.currentUser;

  return await new Promise((resolve) => {
    let settled = false;
    const timeoutHandle = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (settled || !nextUser) return;
      settled = true;
      window.clearTimeout(timeoutHandle);
      unsubscribe();
      resolve(nextUser);
    }, () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutHandle);
      unsubscribe();
      resolve(auth.currentUser);
    });
  });
}

export async function getAuthorizedJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  const currentUser = await waitForAuthenticatedUser();
  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetchApiWithFallback(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const fallbackMessage = rawBody.trim() || `Equipment request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

export async function getPublicJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetchApiWithFallback(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawBody = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const fallbackMessage = rawBody.trim() || `Public equipment request failed (${response.status}).`;
    throw new Error(String(payload?.error || fallbackMessage));
  }

  return payload as T;
}

export async function ensureAuthForWrite(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

// ── Browser cache ───────────────────────────────────────────────────────────

export const PUBLIC_LISTINGS_CACHE_KEY = 'te-public-listings-cache-v1';
export const HOME_MARKETPLACE_CACHE_KEY = 'te-home-marketplace-cache-v1';
export const PUBLIC_NEWS_CACHE_KEY = 'te-public-news-cache-v1';
export const PRIVATE_ACCOUNT_CACHE_PREFIX = 'te-account-cache-v1';

type BrowserCacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

export function readBrowserCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as BrowserCacheEnvelope<T> | T;
    if (parsed && typeof parsed === 'object' && 'data' in (parsed as BrowserCacheEnvelope<T>)) {
      return ((parsed as BrowserCacheEnvelope<T>).data ?? null) as T | null;
    }

    return parsed as T;
  } catch (error) {
    console.warn(`Unable to read browser cache for ${key}:`, error);
    return null;
  }
}

export function writeBrowserCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const envelope: BrowserCacheEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.warn(`Unable to write browser cache for ${key}:`, error);
  }
}

export function getPrivateBrowserCacheKey(scope: string): string {
  const uid = auth.currentUser?.uid || 'anonymous';
  return `${PRIVATE_ACCOUNT_CACHE_PREFIX}:${uid}:${scope}`;
}

export function readPrivateBrowserCache<T>(scope: string): T | null {
  return readBrowserCache<T>(getPrivateBrowserCacheKey(scope));
}

export function writePrivateBrowserCache<T>(scope: string, data: T): void {
  writeBrowserCache(getPrivateBrowserCacheKey(scope), data);
}

export function clearPrivateBrowserCacheScope(scope: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(getPrivateBrowserCacheKey(scope));
  } catch (error) {
    console.warn(`Unable to clear private browser cache for ${scope}:`, error);
  }
}

export function clearPrivateBrowserCachePrefix(scopePrefix: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keyPrefix = getPrivateBrowserCacheKey(scopePrefix);
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(keyPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn(`Unable to clear private browser cache prefix for ${scopePrefix}:`, error);
  }
}
