import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AMV_MIN_COMPARABLES } from '../utils/amvMatching';

vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
  arrayUnion: vi.fn(),
  onSnapshot: vi.fn(),
  getDocFromServer: vi.fn(),
}));

vi.mock('../constants/equipmentData', () => ({
  EQUIPMENT_TAXONOMY: [],
}));

vi.mock('../utils/privilegedAdmin', () => ({
  isPrivilegedAdminEmail: vi.fn(() => false),
  SUPERADMIN_EMAIL: 'calebhappy@gmail.com',
}));

import { equipmentService } from '../services/equipmentService';

type TestListing = {
  id: string;
  make?: string;
  manufacturer?: string;
  model: string;
  category?: string;
  price: number;
  year: number;
  hours: number;
};

function makeListing(overrides: Partial<TestListing> = {}): TestListing {
  return {
    id: overrides.id || 'listing-1',
    make: overrides.make || 'Tigercat',
    manufacturer: overrides.manufacturer,
    model: overrides.model || '1075B',
    category: overrides.category || 'Logging Equipment',
    price: overrides.price ?? 100000,
    year: overrides.year ?? 2022,
    hours: overrides.hours ?? 5000,
  };
}

describe('equipmentService market intelligence helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null AMV when comparable specs are incomplete', async () => {
    await expect(
      equipmentService.getMarketValue({
        manufacturer: 'Tigercat',
        model: '',
        price: 100000,
        year: 2022,
        hours: 5000,
      })
    ).resolves.toBeNull();
  });

  it('returns averaged AMV when enough comparables match the stricter rules', async () => {
    const getListingsSpy = vi.spyOn(equipmentService, 'getListings').mockResolvedValue([
      makeListing({ id: 'a', price: 98000, year: 2021, hours: 5200 }),
      makeListing({ id: 'b', price: 100000, year: 2022, hours: 5000 }),
      makeListing({ id: 'c', price: 102000, year: 2023, hours: 4800 }),
      makeListing({ id: 'ignored-model', model: '855E', price: 99000, year: 2022, hours: 5000 }),
    ] as any);

    const result = await equipmentService.getMarketValue({
      listingId: 'subject',
      category: 'Logging Equipment',
      manufacturer: 'Tigercat',
      model: '1075B',
      price: 100000,
      year: 2022,
      hours: 5000,
    });

    expect(getListingsSpy).toHaveBeenCalledWith({
      inStockOnly: false,
      manufacturer: 'Tigercat',
      model: '1075B',
    });
    expect(result).toBe(100000);
  });

  it('returns null AMV when fewer than the minimum comparable listings match', async () => {
    vi.spyOn(equipmentService, 'getListings').mockResolvedValue([
      makeListing({ id: 'a', price: 98000, year: 2021, hours: 5200 }),
      makeListing({ id: 'b', model: '855E', price: 102000, year: 2023, hours: 4800 }),
    ] as any);

    const result = await equipmentService.getMarketValue({
      manufacturer: 'Tigercat',
      model: '1075B',
      price: 100000,
      year: 2022,
      hours: 5000,
    });
    expect(result).toBeNull();
  });

  it('returns sorted market-match recommendations and respects the limit', async () => {
    vi.spyOn(equipmentService, 'getListings').mockResolvedValue([
      makeListing({ id: 'closest', price: 100000, year: 2022, hours: 5000 }),
      makeListing({ id: 'second', price: 101000, year: 2022, hours: 5100 }),
      makeListing({ id: 'third', price: 98000, year: 2021, hours: 5200 }),
      makeListing({ id: 'excluded-self', price: 100000, year: 2022, hours: 5000 }),
      makeListing({ id: 'wrong-price', price: 150000, year: 2022, hours: 5000 }),
    ] as any);

    const result = await equipmentService.getMarketMatchRecommendations(
      {
        listingId: 'excluded-self',
        category: 'Logging Equipment',
        make: 'Tigercat',
        model: '1075B',
        price: 100000,
        year: 2022,
        hours: 5000,
      },
      2
    );

    expect(result.map((listing) => listing.id)).toEqual(['closest', 'second']);
  });
});
