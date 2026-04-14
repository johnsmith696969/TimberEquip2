import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../types';

const {
  authMock,
  fetchMock,
  onAuthStateChangedMock,
  getDocMock,
  getDocsMock,
  setDocMock,
  updateDocMock,
  deleteDocMock,
  queryMock,
  collectionMock,
  docMock,
  whereMock,
  orderByMock,
  limitMock,
  serverTimestampMock,
  arrayUnionMock,
  onSnapshotMock,
  getDocFromServerMock,
} = vi.hoisted(() => ({
  authMock: {
    currentUser: null as any,
    authStateReady: vi.fn(async () => undefined),
  },
  fetchMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(() => vi.fn()),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  setDocMock: vi.fn(),
  updateDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  queryMock: vi.fn((...args: unknown[]) => ({ args })),
  collectionMock: vi.fn((...args: unknown[]) => ({ kind: 'collection', args })),
  docMock: vi.fn((...args: unknown[]) => ({ kind: 'doc', args })),
  whereMock: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  orderByMock: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  limitMock: vi.fn((...args: unknown[]) => ({ kind: 'limit', args })),
  serverTimestampMock: vi.fn(() => 'SERVER_TIMESTAMP'),
  arrayUnionMock: vi.fn((...args: unknown[]) => ({ kind: 'arrayUnion', args })),
  onSnapshotMock: vi.fn(),
  getDocFromServerMock: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
  auth: authMock,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  setDoc: setDocMock,
  updateDoc: updateDocMock,
  deleteDoc: deleteDocMock,
  query: queryMock,
  where: whereMock,
  orderBy: orderByMock,
  limit: limitMock,
  serverTimestamp: serverTimestampMock,
  arrayUnion: arrayUnionMock,
  onSnapshot: onSnapshotMock,
  getDocFromServer: getDocFromServerMock,
}));

vi.mock('../constants/equipmentData', () => ({
  EQUIPMENT_TAXONOMY: {},
}));

vi.mock('../utils/privilegedAdmin', () => ({
  isPrivilegedAdminEmail: vi.fn(() => false),
  SUPERADMIN_EMAIL: 'admin@example.com',
}));

import { equipmentService } from '../services/equipmentService';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as any;
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: overrides.id || 'listing-1',
    sellerUid: overrides.sellerUid || 'seller-1',
    sellerId: overrides.sellerId || 'seller-1',
    title: overrides.title || '2021 TIGERCAT 1075B',
    category: overrides.category || 'Logging Equipment',
    subcategory: overrides.subcategory || 'Forwarders',
    make: overrides.make || 'Tigercat',
    manufacturer: overrides.manufacturer || 'Tigercat',
    model: overrides.model || '1075B',
    year: overrides.year ?? 2021,
    price: overrides.price ?? 349000,
    currency: overrides.currency || 'USD',
    hours: overrides.hours ?? 3150,
    condition: overrides.condition || 'Used',
    description: overrides.description || 'Forwarder test listing',
    images: overrides.images || [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
      'https://example.com/4.jpg',
      'https://example.com/5.jpg',
    ],
    imageVariants: overrides.imageVariants || [],
    videoUrls: overrides.videoUrls || [],
    location: overrides.location || 'Atlanta, Georgia, United States',
    stockNumber: overrides.stockNumber || 'QA-1',
    serialNumber: overrides.serialNumber || 'SER-1',
    features: overrides.features || [],
    featured: overrides.featured ?? false,
    sellerVerified: overrides.sellerVerified ?? false,
    conditionChecklist: overrides.conditionChecklist || {
      engineChecked: false,
      undercarriageChecked: false,
      hydraulicsLeakStatus: '',
      serviceRecordsAvailable: false,
      partsManualAvailable: false,
      serviceManualAvailable: false,
    },
    specs: overrides.specs || {},
    views: overrides.views ?? 0,
    leads: overrides.leads ?? 0,
    status: overrides.status || 'active',
    createdAt: overrides.createdAt || '2026-03-29T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-03-29T00:00:00.000Z',
  } as Listing;
}

function setAuthenticatedUser(role = 'dealer') {
  authMock.currentUser = {
    uid: 'user-1',
    email: 'dealer@example.com',
    getIdToken: vi.fn().mockResolvedValue('token-123'),
    getIdTokenResult: vi.fn().mockResolvedValue({
      claims: {
        role,
        parentAccountUid: 'user-1',
      },
    }),
  };
}

describe('equipmentService CRUD and query coverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authMock.currentUser = null;
    authMock.authStateReady.mockClear();
    fetchMock.mockReset();
    onAuthStateChangedMock.mockReset();
    getDocMock.mockReset();
    getDocsMock.mockReset();
    setDocMock.mockReset();
    updateDocMock.mockReset();
    deleteDocMock.mockReset();
    queryMock.mockClear();
    collectionMock.mockClear();
    docMock.mockClear();
    whereMock.mockClear();
    orderByMock.mockClear();
    limitMock.mockClear();
    serverTimestampMock.mockClear();
    arrayUnionMock.mockClear();
    onSnapshotMock.mockClear();
    getDocFromServerMock.mockClear();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    window.localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('filters and sorts public listings from the API response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      listings: [
        makeListing({ id: 'featured', featured: true, price: 360000, hours: 3200 }),
        makeListing({ id: 'match', price: 340000, hours: 3100 }),
        makeListing({ id: 'sold', status: 'sold' }),
        makeListing({ id: 'wrong-make', make: 'John Deere', manufacturer: 'John Deere' }),
      ],
    }));

    const listings = await equipmentService.getListings({
      manufacturer: 'tigercat',
      model: '1075',
      q: '1075B',
      sortBy: 'price_asc',
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/public/listings?');
    expect(listings.map((listing) => listing.id)).toEqual(['featured', 'match']);
  });

  it('uses the cached public listings snapshot when the live request fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      listings: [makeListing({ id: 'cached-one' })],
    }));

    const firstLoad = await equipmentService.getListings();
    expect(firstLoad.map((listing) => listing.id)).toEqual(['cached-one']);

    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const secondLoad = await equipmentService.getListings();

    expect(secondLoad.map((listing) => listing.id)).toEqual(['cached-one']);
  });

  it('creates an authenticated listing through the account API', async () => {
    setAuthenticatedUser('dealer');
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    getDocsMock.mockResolvedValue({ docs: [] });
    fetchMock.mockResolvedValueOnce(jsonResponse({
      listing: { id: 'created-listing-1' },
    }));

    const createdId = await equipmentService.addListing({
      ...makeListing({
        id: undefined,
        sellerUid: 'user-1',
        sellerId: 'user-1',
      }),
    });

    expect(createdId).toBe('created-listing-1');
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/account/listings');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer token-123',
      }),
    });
  });

  it('blocks featured listing creation when the dealer cap is exhausted', async () => {
    setAuthenticatedUser('dealer');
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    getDocsMock.mockResolvedValue({
      docs: [
        { id: 'a', data: () => ({ status: 'active' }) },
        { id: 'b', data: () => ({ status: 'active' }) },
        { id: 'c', data: () => ({ status: 'active' }) },
      ],
    });

    await expect(
      equipmentService.addListing(
        makeListing({
          sellerUid: 'user-1',
          sellerId: 'user-1',
          featured: true,
        })
      )
    ).rejects.toThrow('feature up to 3 active listings');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('updates and deletes authenticated listings through account APIs', async () => {
    setAuthenticatedUser('dealer');
    vi.spyOn(equipmentService, 'getListing').mockResolvedValue(makeListing({
      id: 'listing-77',
      sellerUid: 'user-1',
      sellerId: 'user-1',
    }));
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    getDocsMock.mockResolvedValue({ docs: [] });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await equipmentService.updateListing('listing-77', { price: 355000 });
    await equipmentService.deleteListing('listing-77');

    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/account/listings/listing-77');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' });
    expect(String(fetchMock.mock.calls[1][0])).toBe('/api/account/listings/listing-77');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
  });
});
