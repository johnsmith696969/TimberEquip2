import { describe, it, expect, vi } from 'vitest';

// Mock Firebase — same pattern as billingService.test.ts
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null, onAuthStateChanged: vi.fn(() => vi.fn()) },
  storage: {},
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock('../services/taxonomyService', () => ({
  taxonomyService: { addCategory: vi.fn(), addSubcategory: vi.fn() },
}));

vi.mock('../utils/roleScopes', () => ({
  isDealerSellerRole: (role?: string | null) =>
    ['dealer', 'pro_dealer'].includes((role || '').trim().toLowerCase()),
  isOperatorOnlyRole: vi.fn(() => false),
}));

import {
  normalize,
  slugify,
  formatManufacturerName,
  validateListingQuality,
  shouldValidateListingQualityOnUpdate,
  isAdminPublisherRole,
  isVerifiedSellerRole,
  getFeaturedListingCapForRole,
  canReadAllFinancingRequests,
  canReadAllCalls,
  calculateInquirySpamSignal,
  isPublicBlogPost,
} from '../services/equipment/listingHelpers';

// ── String helpers ──────────────────────────────────────────────────────────

describe('normalize', () => {
  it('lowercases and trims input', () => {
    expect(normalize('  Hello World  ')).toBe('hello world');
  });

  it('returns empty string for null/undefined', () => {
    expect(normalize(null)).toBe('');
    expect(normalize(undefined)).toBe('');
  });
});

describe('slugify', () => {
  it('converts to lowercase slug', () => {
    expect(slugify('Feller Bunchers & Harvesters')).toBe('feller-bunchers-and-harvesters');
  });

  it('strips leading/trailing hyphens', () => {
    expect(slugify('  --Hello--  ')).toBe('hello');
  });
});

describe('formatManufacturerName', () => {
  it('capitalizes each word', () => {
    const result = formatManufacturerName('john deere');
    expect(result).toMatch(/John/);
    expect(result).toMatch(/Deere/);
  });
});

// ── Listing quality validation ──────────────────────────────────────────────

describe('validateListingQuality', () => {
  const validListing = {
    category: 'Logging Equipment',
    subcategory: 'Feller Bunchers',
    title: 'Tigercat 1075B Feller Buncher',
    make: 'Tigercat',
    model: '1075B',
    year: 2022,
    hours: 5000,
    condition: 'Used',
    price: 100000,
    location: 'Portland, OR',
    images: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'],
  };

  it('returns empty array for a valid listing', () => {
    expect(validateListingQuality(validListing)).toEqual([]);
  });

  it('requires category', () => {
    const errors = validateListingQuality({ ...validListing, category: '' });
    expect(errors).toContain('Category is required.');
  });

  it('requires subcategory', () => {
    const errors = validateListingQuality({ ...validListing, subcategory: '' });
    expect(errors).toContain('Subcategory is required.');
  });

  it('requires title', () => {
    const errors = validateListingQuality({ ...validListing, title: '' });
    expect(errors).toContain('Listing title is required.');
  });

  it('requires manufacturer (make)', () => {
    const errors = validateListingQuality({ ...validListing, make: '', manufacturer: '' } as any);
    expect(errors).toContain('Manufacturer is required.');
  });

  it('requires model', () => {
    const errors = validateListingQuality({ ...validListing, model: '' });
    expect(errors).toContain('Model is required.');
  });

  it('requires year', () => {
    const errors = validateListingQuality({ ...validListing, year: 0 });
    expect(errors).toContain('Year is required.');
  });

  it('requires valid hours', () => {
    const errors = validateListingQuality({ ...validListing, hours: -1 });
    expect(errors).toContain('Operating hours are required.');
  });

  it('requires condition', () => {
    const errors = validateListingQuality({ ...validListing, condition: '' });
    expect(errors).toContain('Condition is required.');
  });

  it('requires valid price', () => {
    const errors = validateListingQuality({ ...validListing, price: -100 });
    expect(errors).toContain('Price is required.');
  });

  it('requires location', () => {
    const errors = validateListingQuality({ ...validListing, location: '' });
    expect(errors).toContain('Location is required.');
  });

  it('requires minimum 5 images', () => {
    const errors = validateListingQuality({ ...validListing, images: ['1.jpg'] });
    expect(errors).toContain('Minimum 5 images are required.');
  });

  it('rejects more than 40 images', () => {
    const images = Array.from({ length: 41 }, (_, i) => `${i}.jpg`);
    const errors = validateListingQuality({ ...validListing, images });
    expect(errors).toContain('Maximum 40 images are allowed.');
  });

  it('validates video URLs are http/https', () => {
    const errors = validateListingQuality({ ...validListing, videoUrls: ['ftp://bad.mp4'] } as any);
    expect(errors).toContain('All video URLs must be valid http/https links.');
  });

  it('accepts valid video URLs', () => {
    const errors = validateListingQuality({ ...validListing, videoUrls: ['https://youtube.com/watch?v=abc'] } as any);
    expect(errors).toEqual([]);
  });

  it('validates hydraulics leak status when conditionChecklist provided', () => {
    const errors = validateListingQuality({
      ...validListing,
      conditionChecklist: { hydraulicsLeakStatus: 'maybe' },
    } as any);
    expect(errors).toContain('Hydraulics leak status must be set to yes or no when provided.');
  });

  it('returns multiple errors at once', () => {
    const errors = validateListingQuality({});
    expect(errors.length).toBeGreaterThanOrEqual(8);
  });
});

describe('shouldValidateListingQualityOnUpdate', () => {
  it('returns true when updating a quality field', () => {
    expect(shouldValidateListingQualityOnUpdate({ price: 5000 } as any)).toBe(true);
  });

  it('returns false when updating a non-quality field', () => {
    expect(shouldValidateListingQualityOnUpdate({ description: 'updated' } as any)).toBe(false);
  });
});

// ── Role & permission checks ────────────────────────────────────────────────

describe('isAdminPublisherRole', () => {
  it('returns true for super_admin', () => {
    expect(isAdminPublisherRole('super_admin')).toBe(true);
  });

  it('returns true for admin', () => {
    expect(isAdminPublisherRole('admin')).toBe(true);
  });

  it('returns true for developer', () => {
    expect(isAdminPublisherRole('developer')).toBe(true);
  });

  it('returns false for dealer', () => {
    expect(isAdminPublisherRole('dealer')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isAdminPublisherRole(null)).toBe(false);
    expect(isAdminPublisherRole(undefined)).toBe(false);
  });
});

describe('isVerifiedSellerRole', () => {
  it('returns true for dealer', () => {
    expect(isVerifiedSellerRole('dealer')).toBe(true);
  });

  it('returns true for pro_dealer', () => {
    expect(isVerifiedSellerRole('pro_dealer')).toBe(true);
  });

  it('returns false for individual_seller', () => {
    expect(isVerifiedSellerRole('individual_seller')).toBe(false);
  });
});

describe('getFeaturedListingCapForRole', () => {
  it('returns Infinity for admin roles', () => {
    expect(getFeaturedListingCapForRole('super_admin')).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns 3 for dealer', () => {
    expect(getFeaturedListingCapForRole('dealer')).toBe(3);
  });

  it('returns 0 for unknown roles', () => {
    expect(getFeaturedListingCapForRole('viewer')).toBe(0);
  });
});

describe('canReadAllFinancingRequests', () => {
  it('returns true for admin', () => {
    expect(canReadAllFinancingRequests('admin')).toBe(true);
  });

  it('returns false for dealer', () => {
    expect(canReadAllFinancingRequests('dealer')).toBe(false);
  });
});

describe('canReadAllCalls', () => {
  it('returns true for super_admin', () => {
    expect(canReadAllCalls('super_admin')).toBe(true);
  });

  it('returns false for null', () => {
    expect(canReadAllCalls(null)).toBe(false);
  });
});

// ── Inquiry spam detection ──────────────────────────────────────────────────

describe('calculateInquirySpamSignal', () => {
  const validInquiry = {
    buyerEmail: 'buyer@example.org',
    buyerPhone: '1234567890',
    message: 'I am interested in this Tigercat feller buncher, can we set up a call?',
  };

  it('returns zero score for a legitimate inquiry', () => {
    const result = calculateInquirySpamSignal(validInquiry);
    expect(result.spamScore).toBe(0);
    expect(result.spamFlags).toEqual([]);
  });

  it('flags suspicious email domains', () => {
    const result = calculateInquirySpamSignal({ ...validInquiry, buyerEmail: 'test@example.com' });
    expect(result.spamFlags).toContain('disposable_email');
    expect(result.spamScore).toBeGreaterThanOrEqual(20);
  });

  it('flags missing @ in email', () => {
    const result = calculateInquirySpamSignal({ ...validInquiry, buyerEmail: 'notanemail' });
    expect(result.spamFlags).toContain('suspicious_email');
  });

  it('flags short phone numbers', () => {
    const result = calculateInquirySpamSignal({ ...validInquiry, buyerPhone: '12345' });
    expect(result.spamFlags).toContain('invalid_phone');
    expect(result.spamScore).toBeGreaterThanOrEqual(20);
  });

  it('flags very short messages', () => {
    const result = calculateInquirySpamSignal({ ...validInquiry, message: 'hi' });
    expect(result.spamFlags).toContain('very_short_message');
    expect(result.spamScore).toBeGreaterThanOrEqual(20);
  });

  it('flags spam keywords', () => {
    const result = calculateInquirySpamSignal({
      ...validInquiry,
      message: 'Please contact me on whatsapp for urgent transfer via western union',
    });
    expect(result.spamFlags).toContain('spam_keywords');
    expect(result.spamScore).toBeGreaterThanOrEqual(40);
  });

  it('caps spam score at 100', () => {
    const result = calculateInquirySpamSignal({
      buyerEmail: 'bad',
      buyerPhone: '123',
      message: 'whatsapp telegram crypto western union urgent transfer wire now',
    });
    expect(result.spamScore).toBeLessThanOrEqual(100);
  });

  it('accumulates multiple flags', () => {
    const result = calculateInquirySpamSignal({
      buyerEmail: 'x@test.com',
      buyerPhone: '123',
      message: 'hi',
    });
    expect(result.spamFlags).toContain('disposable_email');
    expect(result.spamFlags).toContain('invalid_phone');
    expect(result.spamFlags).toContain('very_short_message');
    expect(result.spamScore).toBe(60);
  });
});

// ── Blog post helpers ───────────────────────────────────────────────────────

describe('isPublicBlogPost', () => {
  it('returns true for published status', () => {
    expect(isPublicBlogPost({ status: 'published' })).toBe(true);
  });

  it('returns true for published reviewStatus', () => {
    expect(isPublicBlogPost({ reviewStatus: 'published' })).toBe(true);
  });

  it('returns false for draft', () => {
    expect(isPublicBlogPost({ status: 'draft' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPublicBlogPost(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPublicBlogPost(undefined)).toBe(false);
  });
});
