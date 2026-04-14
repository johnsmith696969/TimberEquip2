import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedSearch } from '../types';

const {
  authMock,
  fetchMock,
  getDocMock,
  setDocMock,
  updateDocMock,
  deleteDocMock,
  arrayUnionMock,
  arrayRemoveMock,
  onSnapshotMock,
  serverTimestampMock,
  getDocFromServerMock,
  collectionMock,
  getDocsMock,
  queryMock,
  whereMock,
  docMock,
  orderByMock,
  limitMock,
} = vi.hoisted(() => ({
  authMock: {
    currentUser: null as any,
  },
  fetchMock: vi.fn(),
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
  updateDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  arrayUnionMock: vi.fn((...args: unknown[]) => ({ kind: 'arrayUnion', args })),
  arrayRemoveMock: vi.fn((...args: unknown[]) => ({ kind: 'arrayRemove', args })),
  onSnapshotMock: vi.fn(),
  serverTimestampMock: vi.fn(() => 'SERVER_TIMESTAMP'),
  getDocFromServerMock: vi.fn(),
  collectionMock: vi.fn((...args: unknown[]) => ({ kind: 'collection', args })),
  getDocsMock: vi.fn(),
  queryMock: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  whereMock: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  docMock: vi.fn((...args: unknown[]) => ({ kind: 'doc', args })),
  orderByMock: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  limitMock: vi.fn((...args: unknown[]) => ({ kind: 'limit', args })),
}));

vi.mock('../firebase', () => ({
  db: {},
  auth: authMock,
}));

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  getDoc: getDocMock,
  setDoc: setDocMock,
  updateDoc: updateDocMock,
  arrayUnion: arrayUnionMock,
  arrayRemove: arrayRemoveMock,
  onSnapshot: onSnapshotMock,
  serverTimestamp: serverTimestampMock,
  getDocFromServer: getDocFromServerMock,
  collection: collectionMock,
  getDocs: getDocsMock,
  query: queryMock,
  where: whereMock,
  deleteDoc: deleteDocMock,
  orderBy: orderByMock,
  limit: limitMock,
}));

import { userService } from '../services/userService';

const SAVED_SEARCH_CACHE_PREFIX = 'fes:saved-search-cache:';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as any;
}

function setAuthenticatedUser(uid = 'user-1') {
  authMock.currentUser = {
    uid,
    email: 'user@example.com',
    getIdToken: vi.fn().mockResolvedValue('token-123'),
  };
}

function cacheKey(uid = 'user-1') {
  return `${SAVED_SEARCH_CACHE_PREFIX}${uid}`;
}

function makeSavedSearch(overrides: Partial<SavedSearch> = {}): SavedSearch {
  return {
    id: overrides.id || 'search-1',
    userUid: overrides.userUid || 'user-1',
    name: overrides.name || 'Forwarders under $400k',
    filters: overrides.filters || { category: 'Forwarders' },
    alertEmail: overrides.alertEmail || 'user@example.com',
    alertPreferences: overrides.alertPreferences || {
      newListingAlerts: true,
      priceDropAlerts: true,
      soldStatusAlerts: false,
      restockSimilarAlerts: false,
    },
    status: overrides.status || 'active',
    createdAt: overrides.createdAt || '2026-03-30T00:00:00.000Z',
    updatedAt: overrides.updatedAt,
  };
}

describe('userService saved-search cache coverage', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    fetchMock.mockReset();
    getDocMock.mockReset();
    setDocMock.mockReset();
    updateDocMock.mockReset();
    deleteDocMock.mockReset();
    getDocsMock.mockReset();
    window.localStorage.clear();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('prepends a newly created saved search into the authenticated cache', async () => {
    setAuthenticatedUser();
    const cached = [makeSavedSearch({ id: 'search-old', name: 'Old Search' })];
    window.localStorage.setItem(cacheKey(), JSON.stringify(cached));

    fetchMock.mockResolvedValueOnce(jsonResponse({
      savedSearch: makeSavedSearch({ id: 'search-new', name: 'Fresh Search' }),
    }));

    const createdId = await userService.createSavedSearch({
      name: 'Fresh Search',
      filters: { manufacturer: 'Tigercat' },
      alertEmail: 'user@example.com',
      alertPreferences: {
        newListingAlerts: true,
        priceDropAlerts: false,
        soldStatusAlerts: false,
        restockSimilarAlerts: true,
      },
    });

    expect(createdId).toBe('search-new');
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/v1/account/saved-searches');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer token-123',
      }),
    });

    const updatedCache = JSON.parse(window.localStorage.getItem(cacheKey()) || '[]') as SavedSearch[];
    expect(updatedCache.map((entry) => entry.id)).toEqual(['search-new', 'search-old']);
  });

  it('hydrates saved searches from the account API and persists the cache', async () => {
    setAuthenticatedUser();
    const savedSearches = [
      makeSavedSearch({ id: 'search-1' }),
      makeSavedSearch({ id: 'search-2', name: 'Skidders' }),
    ];

    fetchMock.mockResolvedValueOnce(jsonResponse({ savedSearches }));

    const result = await userService.getSavedSearches();

    expect(result).toEqual(savedSearches);
    expect(JSON.parse(window.localStorage.getItem(cacheKey()) || '[]')).toEqual(savedSearches);
  });

  it('falls back to cached saved searches when the live request hits a quota error', async () => {
    setAuthenticatedUser();
    const cached = [makeSavedSearch({ id: 'cached-1', name: 'Cached Search' })];
    window.localStorage.setItem(cacheKey(), JSON.stringify(cached));
    fetchMock.mockRejectedValueOnce(new Error('Quota exceeded for quota metric free daily read units per project'));

    const result = await userService.getSavedSearches();

    expect(result).toEqual(cached);
  });

  it('updates the cached saved search after a successful authenticated patch', async () => {
    setAuthenticatedUser();
    const cached = [
      makeSavedSearch({ id: 'search-1', name: 'Original Name' }),
      makeSavedSearch({ id: 'search-2', name: 'Keep Me' }),
    ];
    window.localStorage.setItem(cacheKey(), JSON.stringify(cached));

    fetchMock.mockResolvedValueOnce(jsonResponse({
      savedSearch: makeSavedSearch({ id: 'search-1', name: 'Updated Name' }),
    }));

    await userService.updateSavedSearch('search-1', { name: 'Updated Name' });

    const updatedCache = JSON.parse(window.localStorage.getItem(cacheKey()) || '[]') as SavedSearch[];
    expect(updatedCache.find((entry) => entry.id === 'search-1')?.name).toBe('Updated Name');
    expect(updatedCache.find((entry) => entry.id === 'search-2')?.name).toBe('Keep Me');
  });

  it('removes the saved search from cache after a successful authenticated delete', async () => {
    setAuthenticatedUser();
    const cached = [
      makeSavedSearch({ id: 'search-1' }),
      makeSavedSearch({ id: 'search-2' }),
    ];
    window.localStorage.setItem(cacheKey(), JSON.stringify(cached));

    fetchMock.mockResolvedValueOnce(jsonResponse({ deleted: true }));

    await userService.deleteSavedSearch('search-1');

    const updatedCache = JSON.parse(window.localStorage.getItem(cacheKey()) || '[]') as SavedSearch[];
    expect(updatedCache.map((entry) => entry.id)).toEqual(['search-2']);
  });
});
