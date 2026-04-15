import { describe, expect, it } from 'vitest';
import { buildSearchPageCopy } from '../utils/searchPageCopy';
import type { FullEquipmentTaxonomy } from '../services/taxonomyService';

const TEST_TAXONOMY: FullEquipmentTaxonomy = {
  'Logging Equipment': {
    Forwarders: {
      Ponsse: ['Buffalo'],
      'John Deere': ['1110G'],
    },
    Skidders: {
      'John Deere': ['648L-II'],
    },
  },
};

describe('search page copy', () => {
  it('separates category title from inventory count', () => {
    const copy = buildSearchPageCopy({
      filters: { category: 'Logging Equipment' },
      resultCount: 2,
      taxonomy: TEST_TAXONOMY,
    });

    expect(copy.title).toBe('Logging Equipment For Sale');
    expect(copy.countLabel).toBe('2 Machines Available');
  });

  it('uses parent category context for subcategory routes', () => {
    const copy = buildSearchPageCopy({
      filters: { category: 'Logging Equipment', subcategory: 'Forwarders' },
      categoryRoute: {
        categoryName: 'Forwarders',
        subcategoryName: 'Forwarders',
        parentCategoryName: 'Logging Equipment',
        slug: 'forwarders',
        isTopLevel: false,
      },
      resultCount: 1,
      taxonomy: TEST_TAXONOMY,
    });

    expect(copy.title).toBe('Logging Equipment Forwarders For Sale');
    expect(copy.countLabel).toBe('1 Machine Available');
    expect(copy.description).toContain('Logging Equipment Forwarders for sale');
  });

  it('infers manufacturer and subcategory intent from query text', () => {
    const copy = buildSearchPageCopy({
      filters: { q: 'Ponsse forwarder' },
      resultCount: 4,
      taxonomy: TEST_TAXONOMY,
    });

    expect(copy.title).toBe('Ponsse Forwarders For Sale');
  });
});
