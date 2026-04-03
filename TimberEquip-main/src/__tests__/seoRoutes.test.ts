import { describe, it, expect } from 'vitest';
import {
  normalizeSeoSlug,
  titleCaseSlug,
  buildCategoryPath,
  buildManufacturerPath,
  buildManufacturerModelPath,
  buildStateCategoryPath,
  buildManufacturerCategoryPath,
  buildDealerPath,
  isDealerRole,
  getStateFromLocation,
  MARKET_ROUTE_LABELS,
  CANONICAL_MARKET_ROUTE_KEY,
} from '../utils/seoRoutes';

describe('normalizeSeoSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSeoSlug('  Hello World  ')).toBe('hello-world');
  });

  it('replaces ampersands with and', () => {
    expect(normalizeSeoSlug('Parts & Service')).toBe('parts-and-service');
  });

  it('removes special characters', () => {
    expect(normalizeSeoSlug("John Deere's #1 (Best)")).toBe('john-deere-s-1-best');
  });

  it('collapses multiple hyphens', () => {
    expect(normalizeSeoSlug('foo---bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(normalizeSeoSlug('-hello-')).toBe('hello');
  });

  it('returns fallback for empty string', () => {
    expect(normalizeSeoSlug('', 'default')).toBe('default');
  });

  it('returns fallback for whitespace-only', () => {
    expect(normalizeSeoSlug('   ', 'default')).toBe('default');
  });
});

describe('titleCaseSlug', () => {
  it('converts slug to title case', () => {
    expect(titleCaseSlug('feller-bunchers')).toBe('Feller Bunchers');
  });

  it('handles single word', () => {
    expect(titleCaseSlug('skidders')).toBe('Skidders');
  });

  it('handles empty string', () => {
    expect(titleCaseSlug('')).toBe('');
  });
});

describe('buildCategoryPath', () => {
  it('builds correct path', () => {
    expect(buildCategoryPath('Feller Bunchers')).toBe('/categories/feller-bunchers');
  });

  it('uses fallback for empty', () => {
    expect(buildCategoryPath('')).toBe('/categories/equipment');
  });
});

describe('buildManufacturerPath', () => {
  it('builds correct path', () => {
    expect(buildManufacturerPath('John Deere')).toBe('/manufacturers/john-deere');
  });
});

describe('buildManufacturerModelPath', () => {
  it('builds correct path', () => {
    expect(buildManufacturerModelPath('John Deere', '748L-II')).toBe('/manufacturers/john-deere/models/748l-ii');
  });
});

describe('buildStateCategoryPath', () => {
  it('builds correct path', () => {
    expect(buildStateCategoryPath('Wisconsin', 'Skidders')).toBe('/states/wisconsin/skidders-for-sale');
  });
});

describe('buildManufacturerCategoryPath', () => {
  it('builds correct path', () => {
    expect(buildManufacturerCategoryPath('CAT', 'Feller Bunchers')).toBe('/manufacturers/cat/feller-bunchers-for-sale');
  });
});

describe('buildDealerPath', () => {
  it('prefers storefrontSlug', () => {
    expect(buildDealerPath({ id: 'uid123', storefrontSlug: 'acme-logging' })).toBe('/dealers/acme-logging');
  });

  it('falls back to id', () => {
    expect(buildDealerPath({ id: 'uid123', storefrontSlug: '' })).toBe('/dealers/uid123');
  });
});

describe('isDealerRole', () => {
  it('returns true for dealer roles', () => {
    expect(isDealerRole('dealer')).toBe(true);
    expect(isDealerRole('dealer_manager')).toBe(true);
    expect(isDealerRole('dealer_staff')).toBe(true);
  });

  it('returns true for admin roles', () => {
    expect(isDealerRole('admin')).toBe(true);
    expect(isDealerRole('super_admin')).toBe(true);
    expect(isDealerRole('developer')).toBe(true);
  });

  it('returns false for non-dealer roles', () => {
    expect(isDealerRole('member')).toBe(false);
    expect(isDealerRole('individual_seller')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDealerRole(undefined)).toBe(false);
  });
});

describe('getStateFromLocation', () => {
  it('extracts state from city, state, country format', () => {
    expect(getStateFromLocation('Madison, Wisconsin, USA')).toBe('Wisconsin');
  });

  it('extracts state from state-only', () => {
    expect(getStateFromLocation('Wisconsin')).toBe('Wisconsin');
  });

  it('returns empty for undefined', () => {
    expect(getStateFromLocation(undefined)).toBe('');
  });
});

describe('constants', () => {
  it('exports MARKET_ROUTE_LABELS', () => {
    expect(MARKET_ROUTE_LABELS.forestry).toBe('forestry-equipment-for-sale');
    expect(MARKET_ROUTE_LABELS.logging).toBe('logging-equipment-for-sale');
  });

  it('exports CANONICAL_MARKET_ROUTE_KEY', () => {
    expect(CANONICAL_MARKET_ROUTE_KEY).toBe('forestry');
  });
});
