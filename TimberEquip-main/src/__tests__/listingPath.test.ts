import { describe, it, expect } from 'vitest';
import {
  isPublicQaOrTestRecord,
  sanitizePublicSeoLabel,
  buildListingSeoSlug,
  encodeListingPublicKey,
  decodeListingPublicKey,
  buildListingPath,
  NOINDEX_ROBOTS,
} from '../utils/listingPath';

// ---------- isPublicQaOrTestRecord ----------
describe('isPublicQaOrTestRecord', () => {
  it('detects "test" as a standalone token', () => {
    expect(isPublicQaOrTestRecord('test')).toBe(true);
  });

  it('detects "qa" case-insensitively', () => {
    expect(isPublicQaOrTestRecord('QA')).toBe(true);
  });

  it('detects "demo" in a compound string', () => {
    expect(isPublicQaOrTestRecord('my-demo-listing')).toBe(true);
  });

  it('returns false for clean values', () => {
    expect(isPublicQaOrTestRecord('John Deere 648L')).toBe(false);
  });

  it('returns false for null/undefined/empty', () => {
    expect(isPublicQaOrTestRecord(null, undefined, '')).toBe(false);
  });

  it('short-circuits on first match across multiple values', () => {
    expect(isPublicQaOrTestRecord('clean', 'also clean', 'sandbox')).toBe(true);
  });

  it('does not false-positive on "contest" or "testing123"', () => {
    // "testing" IS a disallowed token, but "contest" is not
    expect(isPublicQaOrTestRecord('contest')).toBe(false);
  });

  it('detects "staging" keyword', () => {
    expect(isPublicQaOrTestRecord('staging-listing')).toBe(true);
  });

  it('handles numeric values', () => {
    expect(isPublicQaOrTestRecord(12345)).toBe(false);
  });
});

// ---------- sanitizePublicSeoLabel ----------
describe('sanitizePublicSeoLabel', () => {
  it('removes "test" keyword', () => {
    expect(sanitizePublicSeoLabel('test listing')).toBe('listing');
  });

  it('removes multiple keywords', () => {
    expect(sanitizePublicSeoLabel('qa test demo item')).toBe('item');
  });

  it('replaces underscores and pipes with spaces', () => {
    expect(sanitizePublicSeoLabel('foo_bar|baz')).toBe('foo bar baz');
  });

  it('collapses multiple spaces', () => {
    expect(sanitizePublicSeoLabel('hello   world')).toBe('hello world');
  });

  it('returns fallback when result is empty', () => {
    expect(sanitizePublicSeoLabel('test demo', 'fallback')).toBe('fallback');
  });

  it('returns empty string when no fallback and result is empty', () => {
    expect(sanitizePublicSeoLabel('test')).toBe('');
  });

  it('preserves clean text', () => {
    expect(sanitizePublicSeoLabel('John Deere 648L')).toBe('John Deere 648L');
  });
});

// ---------- buildListingSeoSlug ----------
describe('buildListingSeoSlug', () => {
  const baseListing = {
    id: 'abc123',
    title: '2020 Cat 525D Skidder',
    year: 2020,
    model: '525D',
    category: 'Skidders',
    subcategory: 'Grapple Skidders',
    location: 'Duluth, Minnesota, USA',
    make: 'Caterpillar',
  };

  it('builds slug from year, manufacturer, model, subcategory, city, state', () => {
    const slug = buildListingSeoSlug(baseListing);
    expect(slug).toContain('2020');
    expect(slug).toContain('caterpillar');
    expect(slug).toContain('525d');
    expect(slug).toContain('grapple-skidders');
    expect(slug).toContain('duluth');
    expect(slug).toContain('minnesota');
  });

  it('uses machineType fallback "equipment" when category/subcategory are missing', () => {
    const slug = buildListingSeoSlug({
      id: 'x',
      title: 'Great Equipment',
      year: 0,
      model: '',
      category: '',
      subcategory: '',
      location: '',
    });
    // sanitizePublicSeoLabel defaults machineType to 'equipment', so slug is just 'equipment'
    expect(slug).toBe('equipment');
  });

  it('returns "equipment" when everything is empty (machineType fallback)', () => {
    const slug = buildListingSeoSlug({
      id: '',
      title: '',
      year: 0,
      model: '',
      category: '',
      subcategory: '',
      location: '',
    });
    expect(slug).toBe('equipment');
  });

  it('deduplicates slug parts', () => {
    const slug = buildListingSeoSlug({
      id: 'x',
      title: 'Skidder',
      year: 0,
      model: 'Skidder',
      category: 'Skidder',
      subcategory: '',
      location: '',
      make: 'Skidder',
    });
    // "skidder" should appear only once
    const parts = slug.split('-');
    const skidderCount = parts.filter((p) => p === 'skidder').length;
    expect(skidderCount).toBe(1);
  });

  it('produces a slug even with many input fields', () => {
    const slug = buildListingSeoSlug({
      id: 'x',
      title: 'Lots Of Words',
      year: 2024,
      model: 'Model X',
      category: 'Heavy Equipment',
      subcategory: 'Special Equipment',
      location: 'Long City, Long State, Country',
      make: 'Super Manufacturer',
    });
    // The slug should be non-empty and well-formed (no leading/trailing hyphens)
    expect(slug).toBeTruthy();
    expect(slug).not.toMatch(/^-|-$/);
    expect(slug).toContain('2024');
  });

  it('converts ampersands to "and"', () => {
    const slug = buildListingSeoSlug({
      id: 'x',
      title: '',
      year: 0,
      model: '',
      category: 'Trailers & Trucks',
      subcategory: '',
      location: '',
    });
    expect(slug).toContain('and');
    expect(slug).not.toContain('&');
  });

  it('uses manufacturer/brand as fallback for make', () => {
    const slug = buildListingSeoSlug({
      id: 'x',
      title: '',
      year: 2022,
      model: '648L',
      category: 'Skidders',
      subcategory: '',
      location: '',
      manufacturer: 'John Deere',
    });
    expect(slug).toContain('john-deere');
  });

  it('sanitizes test/qa keywords from slug parts', () => {
    const slug = buildListingSeoSlug({
      id: 'x',
      title: '',
      year: 2022,
      model: 'test model',
      category: 'Skidders',
      subcategory: '',
      location: '',
      make: 'Demo Corp',
    });
    expect(slug).not.toContain('test');
    expect(slug).not.toContain('demo');
  });
});

// ---------- encodeListingPublicKey / decodeListingPublicKey ----------
describe('encodeListingPublicKey', () => {
  it('encodes a listing ID to a URL-safe base64 string', () => {
    const encoded = encodeListingPublicKey('abc123');
    expect(encoded).toBeTruthy();
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('returns empty string for empty/null input', () => {
    expect(encodeListingPublicKey('')).toBe('');
    expect(encodeListingPublicKey(null as unknown as string)).toBe('');
  });

  it('trims whitespace before encoding', () => {
    const a = encodeListingPublicKey('abc123');
    const b = encodeListingPublicKey('  abc123  ');
    expect(a).toBe(b);
  });
});

describe('decodeListingPublicKey', () => {
  it('decodes back to the original listing ID', () => {
    const original = 'abc123';
    const encoded = encodeListingPublicKey(original);
    const decoded = decodeListingPublicKey(encoded);
    expect(decoded).toBe(original);
  });

  it('round-trips with special characters', () => {
    const original = 'listing-id_with.special+chars';
    const encoded = encodeListingPublicKey(original);
    const decoded = decodeListingPublicKey(encoded);
    expect(decoded).toBe(original);
  });

  it('returns empty string for empty input', () => {
    expect(decodeListingPublicKey('')).toBe('');
  });

  it('returns empty string for malformed base64', () => {
    expect(decodeListingPublicKey('!!!invalid!!!')).toBe('');
  });

  it('round-trips with long Firebase-style IDs', () => {
    const original = 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0';
    const encoded = encodeListingPublicKey(original);
    const decoded = decodeListingPublicKey(encoded);
    expect(decoded).toBe(original);
  });
});

// ---------- buildListingPath ----------
describe('buildListingPath', () => {
  it('builds path with slug and encoded public key', () => {
    const path = buildListingPath({
      id: 'listing123',
      title: '2020 Cat 525D',
      year: 2020,
      model: '525D',
      category: 'Skidders',
      subcategory: '',
      location: 'Duluth, MN',
      make: 'Caterpillar',
    });
    expect(path).toMatch(/^\/equipment\/.+\/.+$/);
    expect(path).toContain('/equipment/');
  });

  it('omits public key when listing ID is empty', () => {
    const path = buildListingPath({
      id: '',
      title: 'Some Listing',
      year: 2022,
      model: '',
      category: 'Equipment',
      subcategory: '',
      location: '',
    });
    expect(path).toMatch(/^\/equipment\/[^/]+$/);
    expect(path.split('/').length).toBe(3);
  });

  it('produces decodable public key in path', () => {
    const listingId = 'firebase-doc-id-123';
    const path = buildListingPath({
      id: listingId,
      title: 'Test Item',
      year: 2024,
      model: 'X1',
      category: 'Machines',
      subcategory: '',
      location: '',
    });
    const publicKey = path.split('/').pop()!;
    expect(decodeListingPublicKey(publicKey)).toBe(listingId);
  });
});

// ---------- NOINDEX_ROBOTS constant ----------
describe('NOINDEX_ROBOTS', () => {
  it('contains noindex and nofollow directives', () => {
    expect(NOINDEX_ROBOTS).toContain('noindex');
    expect(NOINDEX_ROBOTS).toContain('nofollow');
  });
});
