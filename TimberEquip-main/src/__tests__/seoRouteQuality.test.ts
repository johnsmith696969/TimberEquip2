import { describe, it, expect } from 'vitest';
import {
  meetsRouteThreshold,
  evaluateRouteQuality,
  filterLinksByRouteThreshold,
} from '../utils/seoRouteQuality';

describe('meetsRouteThreshold', () => {
  it('returns true when count meets threshold (category: 2)', () => {
    expect(meetsRouteThreshold('category', 2)).toBe(true);
    expect(meetsRouteThreshold('category', 10)).toBe(true);
  });

  it('returns false when count is below threshold', () => {
    expect(meetsRouteThreshold('category', 1)).toBe(false);
    expect(meetsRouteThreshold('category', 0)).toBe(false);
  });

  it('uses threshold of 3 for dealer', () => {
    expect(meetsRouteThreshold('dealer', 2)).toBe(false);
    expect(meetsRouteThreshold('dealer', 3)).toBe(true);
  });

  it('uses threshold of 2 for manufacturer', () => {
    expect(meetsRouteThreshold('manufacturer', 1)).toBe(false);
    expect(meetsRouteThreshold('manufacturer', 2)).toBe(true);
  });
});

describe('evaluateRouteQuality', () => {
  it('returns noindex with redirect for zero count', () => {
    const result = evaluateRouteQuality('category', 0, { fallbackPath: '/categories' });
    expect(result.qualifies).toBe(false);
    expect(result.robots).toBe('noindex, follow');
    expect(result.redirectPath).toBe('/categories');
  });

  it('returns noindex without redirect for below-threshold count', () => {
    const result = evaluateRouteQuality('category', 1);
    expect(result.qualifies).toBe(false);
    expect(result.robots).toBe('noindex, follow');
    expect(result.redirectPath).toBeNull();
  });

  it('returns qualifying for count at threshold', () => {
    const result = evaluateRouteQuality('category', 2);
    expect(result.qualifies).toBe(true);
    expect(result.robots).toBeUndefined();
    expect(result.redirectPath).toBeNull();
  });

  it('returns qualifying for count above threshold', () => {
    const result = evaluateRouteQuality('manufacturer', 50);
    expect(result.qualifies).toBe(true);
    expect(result.robots).toBeUndefined();
  });

  it('includes threshold and count in result', () => {
    const result = evaluateRouteQuality('dealer', 5);
    expect(result.threshold).toBe(3);
    expect(result.count).toBe(5);
  });
});

describe('filterLinksByRouteThreshold', () => {
  const links = [
    { label: 'Skidders', count: 5, path: '/categories/skidders' },
    { label: 'Chippers', count: 1, path: '/categories/chippers' },
    { label: 'Bunchers', count: 3, path: '/categories/bunchers' },
    { label: 'Empty', count: 0, path: '/categories/empty' },
  ];

  it('filters out links below threshold', () => {
    const filtered = filterLinksByRouteThreshold(links, 'category');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((l) => l.label)).toEqual(['Skidders', 'Bunchers']);
  });

  it('returns empty array when all below threshold', () => {
    const lowLinks = [{ label: 'A', count: 0, path: '/a' }];
    expect(filterLinksByRouteThreshold(lowLinks, 'category')).toHaveLength(0);
  });

  it('returns all when all meet threshold', () => {
    const highLinks = [
      { label: 'A', count: 10, path: '/a' },
      { label: 'B', count: 5, path: '/b' },
    ];
    expect(filterLinksByRouteThreshold(highLinks, 'category')).toHaveLength(2);
  });
});
