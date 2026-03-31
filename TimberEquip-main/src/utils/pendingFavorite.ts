const PENDING_FAVORITE_STORAGE_KEY = 'fes:pending-favorite-intent';
const PENDING_FAVORITE_MAX_AGE_MS = 1000 * 60 * 60 * 6;

export type PendingFavoriteIntent = {
  listingId: string;
  returnTo: string;
  createdAt: string;
};

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function normalizeReturnPath(value: string): string {
  const trimmed = String(value || '').trim();
  return trimmed.startsWith('/') ? trimmed : '/';
}

export function getPendingFavoriteIntent(): PendingFavoriteIntent | null {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_FAVORITE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingFavoriteIntent>;
    const listingId = String(parsed?.listingId || '').trim();
    if (!listingId) {
      window.sessionStorage.removeItem(PENDING_FAVORITE_STORAGE_KEY);
      return null;
    }

    const createdAt = String(parsed?.createdAt || '').trim();
    const createdAtMs = createdAt ? Date.parse(createdAt) : NaN;
    if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > PENDING_FAVORITE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(PENDING_FAVORITE_STORAGE_KEY);
      return null;
    }

    return {
      listingId,
      returnTo: normalizeReturnPath(String(parsed?.returnTo || '/')),
      createdAt: new Date(createdAtMs).toISOString(),
    };
  } catch {
    try {
      window.sessionStorage.removeItem(PENDING_FAVORITE_STORAGE_KEY);
    } catch {
      // ignore storage cleanup failures
    }
    return null;
  }
}

export function setPendingFavoriteIntent(listingId: string, returnTo: string): void {
  if (!canUseSessionStorage()) return;

  const normalizedListingId = String(listingId || '').trim();
  if (!normalizedListingId) return;

  const payload: PendingFavoriteIntent = {
    listingId: normalizedListingId,
    returnTo: normalizeReturnPath(returnTo),
    createdAt: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(PENDING_FAVORITE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // best-effort only
  }
}

export function clearPendingFavoriteIntent(): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(PENDING_FAVORITE_STORAGE_KEY);
  } catch {
    // best-effort only
  }
}
