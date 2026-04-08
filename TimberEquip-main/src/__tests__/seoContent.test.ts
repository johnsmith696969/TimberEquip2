import { describe, it, expect } from 'vitest';
import { getManufacturerContent } from '../constants/manufacturerContent';
import { getSubcategoryContent, getParentCategory } from '../constants/subcategoryContent';

describe('manufacturerContent', () => {
  it('returns content for known manufacturers', () => {
    const catContent = getManufacturerContent('CATERPILLAR');
    expect(catContent).toBeTruthy();
    expect(catContent.description).toContain('Caterpillar');
    expect(catContent.founded).toBe(1925);
    expect(catContent.headquarters).toBeTruthy();
  });

  it('returns content for John Deere', () => {
    const content = getManufacturerContent('JOHN DEERE');
    expect(content).toBeTruthy();
    expect(content.description).toContain('John Deere');
    expect(content.founded).toBe(1837);
  });

  it('returns content for Tigercat', () => {
    const content = getManufacturerContent('TIGERCAT');
    expect(content).toBeTruthy();
    expect(content.description).toContain('Tigercat');
    expect(content.founded).toBe(1992);
  });

  it('returns a fallback description for unknown manufacturers', () => {
    const content = getManufacturerContent('UNKNOWN_BRAND_XYZ');
    expect(content).toBeTruthy();
    expect(content.description).toContain('UNKNOWN_BRAND_XYZ');
  });

  it('all known manufacturers have descriptions over 50 characters', () => {
    const knownMakes = ['CATERPILLAR', 'JOHN DEERE', 'TIGERCAT', 'TIMBERPRO', 'PONSSE', 'KOMATSU', 'BARKO', 'VOLVO', 'HITACHI'];
    for (const make of knownMakes) {
      const content = getManufacturerContent(make);
      expect(content, `Missing content for ${make}`).toBeTruthy();
      expect(content.description.length, `Short description for ${make}`).toBeGreaterThan(50);
    }
  });
});

describe('subcategoryContent', () => {
  it('returns content for Feller Bunchers', () => {
    const content = getSubcategoryContent('Feller Bunchers');
    expect(content).toBeTruthy();
    expect(content!.overview).toContain('Feller bunchers');
    expect(content!.buyingTips).toBeDefined();
    expect(content!.buyingTips!.length).toBeGreaterThan(0);
  });

  it('returns content for Skidders', () => {
    const content = getSubcategoryContent('Skidders');
    expect(content).toBeTruthy();
    expect(content!.overview).toContain('Skidder');
  });

  it('returns content for Harvesters', () => {
    const content = getSubcategoryContent('Harvesters');
    expect(content).toBeTruthy();
    expect(content!.overview).toContain('Harvester');
  });

  it('returns undefined for unknown subcategories', () => {
    const content = getSubcategoryContent('Nonexistent Category');
    expect(content).toBeUndefined();
  });

  it('all known subcategories have buying tips', () => {
    const subcategories = [
      'Feller Bunchers', 'Skidders', 'Harvesters', 'Forwarders',
      'Log Loaders', 'Chippers', 'Grinders', 'Mulchers',
    ];
    for (const sub of subcategories) {
      const content = getSubcategoryContent(sub);
      expect(content, `Missing content for ${sub}`).toBeTruthy();
      expect(content!.buyingTips, `Missing buying tips for ${sub}`).toBeDefined();
      expect(content!.buyingTips!.length, `Empty buying tips for ${sub}`).toBeGreaterThan(0);
    }
  });
});

describe('getParentCategory', () => {
  it('returns parent for Feller Bunchers', () => {
    const parent = getParentCategory('Feller Bunchers');
    expect(parent).toBeTruthy();
    expect(parent).toBe('Land Clearing Equipment');
  });

  it('returns parent for Skidders', () => {
    const parent = getParentCategory('Skidders');
    expect(parent).toBeTruthy();
    expect(typeof parent).toBe('string');
  });

  it('returns parent for Chippers', () => {
    const parent = getParentCategory('Chippers');
    expect(parent).toBeTruthy();
  });

  it('returns null for unknown subcategories', () => {
    const parent = getParentCategory('Imaginary Equipment');
    expect(parent).toBeNull();
  });
});
