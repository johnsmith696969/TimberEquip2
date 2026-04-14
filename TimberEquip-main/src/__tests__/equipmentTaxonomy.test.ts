import { describe, expect, it } from 'vitest';
import {
  getTaxonomyManufacturerOptions,
  getTaxonomyModelOptions,
  getTaxonomySubcategoryOptions,
  resolveEquipmentTaxonomySelection,
} from '../utils/equipmentTaxonomy';
import type { FullEquipmentTaxonomy } from '../services/taxonomyService';

const TEST_TAXONOMY: FullEquipmentTaxonomy = {
  'Logging Equipment': {
    Skidders: {
      Tigercat: ['620E'],
      'John Deere': ['648L-II'],
    },
    Forwarders: {
      'John Deere': ['1110G'],
    },
  },
  Trucks: {
    'Log Trucks': {
      Kenworth: ['T880'],
    },
  },
};

describe('equipment taxonomy utilities', () => {
  it('resolves a raw subcategory stored in category back to its top-level category', () => {
    expect(
      resolveEquipmentTaxonomySelection(TEST_TAXONOMY, {
        category: 'Skidders',
        manufacturer: 'tigercat',
        model: '620e',
      })
    ).toEqual({
      category: 'Logging Equipment',
      subcategory: 'Skidders',
      manufacturer: 'Tigercat',
      model: '620E',
    });
  });

  it('narrows subcategories and manufacturers by the selected category', () => {
    expect(getTaxonomySubcategoryOptions(TEST_TAXONOMY, 'Logging Equipment')).toEqual([
      'Forwarders',
      'Skidders',
    ]);

    expect(getTaxonomyManufacturerOptions(TEST_TAXONOMY, 'Logging Equipment', 'Skidders')).toEqual([
      'John Deere',
      'Tigercat',
    ]);
  });

  it('narrows model options to the selected manufacturer and branch', () => {
    expect(getTaxonomyModelOptions(TEST_TAXONOMY, 'Logging Equipment', 'Skidders', 'Tigercat')).toEqual([
      '620E',
    ]);

    expect(getTaxonomyModelOptions(TEST_TAXONOMY, 'Logging Equipment', ['Forwarders', 'Skidders'], 'John Deere')).toEqual([
      '1110G',
      '648L-II',
    ]);
  });
});
