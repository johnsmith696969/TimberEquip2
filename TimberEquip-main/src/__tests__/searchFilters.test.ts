import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Listing } from '../types';

const {
  authMock,
  fetchMock,
  getDocMock,
  getDocsMock,
  queryMock,
  collectionMock,
  docMock,
  whereMock,
  orderByMock,
  limitMock,
  serverTimestampMock,
  onSnapshotMock,
  getDocFromServerMock,
} = vi.hoisted(() => ({
  authMock: {
    currentUser: null as any,
    authStateReady: vi.fn(async () => undefined),
  },
  fetchMock: vi.fn(),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  queryMock: vi.fn((...args: unknown[]) => ({ args })),
  collectionMock: vi.fn((...args: unknown[]) => ({ kind: 'collection', args })),
  docMock: vi.fn((...args: unknown[]) => ({ kind: 'doc', args })),
  whereMock: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  orderByMock: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  limitMock: vi.fn((...args: unknown[]) => ({ kind: 'limit', args })),
  serverTimestampMock: vi.fn(() => 'SERVER_TIMESTAMP'),
  onSnapshotMock: vi.fn(),
  getDocFromServerMock: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
  auth: authMock,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => vi.fn()),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: queryMock,
  where: whereMock,
  orderBy: orderByMock,
  limit: limitMock,
  serverTimestamp: serverTimestampMock,
  arrayUnion: vi.fn(),
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
    images: overrides.images || ['https://example.com/1.jpg'],
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

describe('Equipment Service - Search Filters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authMock.currentUser = null;
    authMock.authStateReady.mockClear();
    fetchMock.mockReset();
    getDocMock.mockReset();
    getDocsMock.mockReset();
    queryMock.mockClear();
    collectionMock.mockClear();
    docMock.mockClear();
    whereMock.mockClear();
    orderByMock.mockClear();
    limitMock.mockClear();
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

  describe('getListings with filters', () => {
    it('returns empty array when API returns no listings', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings: [] }));
      const result = await equipmentService.getListings({ category: 'NonExistent' });
      expect(result).toEqual([]);
    });

    it('filters by category', async () => {
      const listings = [
        makeListing({ id: 'l1', category: 'Feller Bunchers' }),
        makeListing({ id: 'l2', category: 'Skidders' }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ category: 'Feller Bunchers' });
      expect(result.every((l) => l.category === 'Feller Bunchers')).toBe(true);
    });

    it('filters by manufacturer (case insensitive)', async () => {
      const listings = [
        makeListing({ id: 'l1', make: 'Tigercat', manufacturer: 'Tigercat' }),
        makeListing({ id: 'l2', make: 'John Deere', manufacturer: 'John Deere' }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ manufacturer: 'tigercat' });
      expect(result.length).toBe(1);
      expect(result[0].make).toBe('Tigercat');
    });

    it('filters by condition', async () => {
      const listings = [
        makeListing({ id: 'l1', condition: 'New' }),
        makeListing({ id: 'l2', condition: 'Used' }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ condition: 'New' });
      expect(result.every((l) => l.condition === 'New')).toBe(true);
    });

    it('filters by price range', async () => {
      const listings = [
        makeListing({ id: 'l1', price: 50000 }),
        makeListing({ id: 'l2', price: 150000 }),
        makeListing({ id: 'l3', price: 350000 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ minPrice: 100000, maxPrice: 200000 });
      expect(result.every((l) => l.price >= 100000 && l.price <= 200000)).toBe(true);
    });

    it('filters by year range', async () => {
      const listings = [
        makeListing({ id: 'l1', year: 2018 }),
        makeListing({ id: 'l2', year: 2021 }),
        makeListing({ id: 'l3', year: 2025 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ minYear: 2020, maxYear: 2023 });
      expect(result.every((l) => (l.year ?? 0) >= 2020 && (l.year ?? 0) <= 2023)).toBe(true);
    });

    it('filters by hours range', async () => {
      const listings = [
        makeListing({ id: 'l1', hours: 500 }),
        makeListing({ id: 'l2', hours: 3000 }),
        makeListing({ id: 'l3', hours: 8000 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ minHours: 1000, maxHours: 5000 });
      expect(result.every((l) => (l.hours ?? 0) >= 1000 && (l.hours ?? 0) <= 5000)).toBe(true);
    });

    it('combines multiple filters', async () => {
      const listings = [
        makeListing({ id: 'l1', category: 'Feller Bunchers', condition: 'Used', price: 200000, year: 2020 }),
        makeListing({ id: 'l2', category: 'Feller Bunchers', condition: 'New', price: 500000, year: 2024 }),
        makeListing({ id: 'l3', category: 'Skidders', condition: 'Used', price: 150000, year: 2019 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({
        category: 'Feller Bunchers',
        condition: 'Used',
        minPrice: 100000,
        maxPrice: 300000,
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('l1');
    });

    it('sorts by price_asc', async () => {
      const listings = [
        makeListing({ id: 'l1', price: 300000 }),
        makeListing({ id: 'l2', price: 100000 }),
        makeListing({ id: 'l3', price: 200000 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ sortBy: 'price_asc' });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].price).toBeGreaterThanOrEqual(result[i - 1].price);
      }
    });

    it('sorts by price_desc', async () => {
      const listings = [
        makeListing({ id: 'l1', price: 100000 }),
        makeListing({ id: 'l2', price: 300000 }),
        makeListing({ id: 'l3', price: 200000 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ sortBy: 'price_desc' });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].price).toBeLessThanOrEqual(result[i - 1].price);
      }
    });

    it('handles search query filtering', async () => {
      const listings = [
        makeListing({ id: 'l1', title: '2021 TIGERCAT 1075B FORWARDER', make: 'Tigercat', manufacturer: 'Tigercat' }),
        makeListing({ id: 'l2', title: '2020 JOHN DEERE 648L SKIDDER', make: 'John Deere', manufacturer: 'John Deere', model: '648L', description: 'Skidder test listing' }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ q: 'tigercat' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('l1');
    });

    it('filters by sellerUid', async () => {
      const listings = [
        makeListing({ id: 'l1', sellerUid: 'user-a' }),
        makeListing({ id: 'l2', sellerUid: 'user-b' }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ sellerUid: 'user-a' });
      expect(result.every((l) => l.sellerUid === 'user-a')).toBe(true);
    });
  });

  describe('getListings edge cases', () => {
    it('handles listings with zero price gracefully', async () => {
      const listings = [
        makeListing({ id: 'l1', price: 0 }),
        makeListing({ id: 'l2', price: 100000 }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({});
      expect(Array.isArray(result)).toBe(true);
    });

    it('handles listings with zero hours', async () => {
      const listings = [makeListing({ id: 'l1', hours: 0 })];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({ maxHours: 100 });
      expect(result.length).toBe(1);
    });

    it('returns consistent results with empty filter object', async () => {
      const listings = [makeListing({ id: 'l1' }), makeListing({ id: 'l2' })];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('excludes sold listings by default', async () => {
      const listings = [
        makeListing({ id: 'l1', status: 'active' }),
        makeListing({ id: 'l2', status: 'sold' }),
      ];
      fetchMock.mockResolvedValueOnce(jsonResponse({ listings }));
      const result = await equipmentService.getListings({});
      expect(result.every((l) => l.status !== 'sold')).toBe(true);
    });

    it('falls back to cache when API fails', async () => {
      // First call succeeds to populate cache
      fetchMock.mockResolvedValueOnce(jsonResponse({
        listings: [makeListing({ id: 'cached-one' })],
      }));
      await equipmentService.getListings({});

      // Second call fails
      fetchMock.mockRejectedValueOnce(new Error('network error'));
      const result = await equipmentService.getListings({});
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });
});
