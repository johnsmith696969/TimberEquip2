import { db, auth } from '../../firebase';
import { collection, getDoc, getDocs, doc, query, where } from 'firebase/firestore';
import type { Listing, NewsPost } from '../../types';
import { isDealerSellerRole } from '../../utils/roleScopes';
import { taxonomyService } from '../taxonomyService';
import {
  PUBLIC_LISTINGS_CACHE_KEY,
  HOME_MARKETPLACE_CACHE_KEY,
  readBrowserCache,
  clearPrivateBrowserCachePrefix,
  clearPrivateBrowserCacheScope,
} from './apiHelpers';
import type { HomeMarketplaceData } from './types';

// ── String helpers ──────────────────────────────────────────────────────────

export function normalize(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatManufacturerName(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export const toMillis = (value: unknown): number | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : undefined;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : undefined;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { seconds?: number; nanoseconds?: number };
    if (typeof maybeTimestamp.seconds === 'number') {
      const nanos = typeof maybeTimestamp.nanoseconds === 'number' ? maybeTimestamp.nanoseconds : 0;
      return maybeTimestamp.seconds * 1000 + Math.floor(nanos / 1e6);
    }
  }
  return undefined;
};

export const stripHtml = (value: unknown): string =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ── Listing image normalization ─────────────────────────────────────────────

export function normalizeListingImages(listing: Listing): Listing {
  const variants = Array.isArray(listing.imageVariants) ? listing.imageVariants : [];
  const variantImages = variants
    .map((variant) => String(variant?.detailUrl || variant?.thumbnailUrl || '').trim())
    .filter(Boolean);
  const rawImages = Array.isArray(listing.images) ? listing.images : [];
  const normalizedImages = variantImages.length > 0
    ? variantImages
    : rawImages;
  const rawTitles = Array.isArray(listing.imageTitles) ? listing.imageTitles : [];
  const imageTitles = normalizedImages.map((_, index) => String(rawTitles[index] || '').trim()).slice(0, normalizedImages.length);

  return {
    ...listing,
    images: normalizedImages,
    imageTitles,
  };
}

// ── Listing quality validation ──────────────────────────────────────────────

export function validateListingQuality(listing: Partial<Listing>): string[] {
  const errors: string[] = [];

  if (!listing.category) errors.push('Category is required.');
  if (!listing.subcategory) errors.push('Subcategory is required.');
  if (!listing.title) errors.push('Listing title is required.');
  if (!String(listing.make || listing.manufacturer || '').trim()) errors.push('Manufacturer is required.');
  if (!listing.model) errors.push('Model is required.');
  if (!listing.year) errors.push('Year is required.');
  if (listing.hours === undefined || listing.hours === null || !Number.isFinite(Number(listing.hours)) || Number(listing.hours) < 0) {
    errors.push('Operating hours are required.');
  }
  if (!listing.condition) errors.push('Condition is required.');
  if (listing.price === undefined || listing.price === null || !Number.isFinite(Number(listing.price)) || Number(listing.price) < 0) {
    errors.push('Price is required.');
  }
  if (!listing.location) errors.push('Location is required.');

  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
  if (imageCount < 5) errors.push('Minimum 5 images are required.');
  if (imageCount > 40) errors.push('Maximum 40 images are allowed.');

  if (listing.videoUrls && !listing.videoUrls.every((url) => /^https?:\/\//i.test(url))) {
    errors.push('All video URLs must be valid http/https links.');
  }

  const checklist = listing.conditionChecklist;
  if (checklist) {
    const hydraulicsLeakStatus = checklist.hydraulicsLeakStatus;
    if (hydraulicsLeakStatus && !['yes', 'no'].includes(hydraulicsLeakStatus)) {
      errors.push('Hydraulics leak status must be set to yes or no when provided.');
    }
  }

  return errors;
}

export const LISTING_QUALITY_FIELDS = new Set<keyof Listing>([
  'category',
  'subcategory',
  'title',
  'make',
  'manufacturer',
  'model',
  'year',
  'hours',
  'condition',
  'price',
  'location',
  'images',
  'imageVariants',
  'videoUrls',
  'conditionChecklist',
]);

export function shouldValidateListingQualityOnUpdate(updates: Partial<Listing>): boolean {
  return Object.keys(updates).some((key) => LISTING_QUALITY_FIELDS.has(key as keyof Listing));
}

// ── Role & permission checks ────────────────────────────────────────────────

export function isAdminPublisherRole(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer'].includes(normalize(role));
}

export function isVerifiedSellerRole(role?: string | null): boolean {
  return isDealerSellerRole(role);
}

export const FEATURED_LISTING_CAPS: Record<string, number> = {
  individual_seller: 1,
  dealer: 3,
  pro_dealer: 6,
};

export function getFeaturedListingCapForRole(role?: string | null): number {
  const normalizedRole = normalize(role);
  if (isAdminPublisherRole(normalizedRole)) return Number.POSITIVE_INFINITY;
  return FEATURED_LISTING_CAPS[normalizedRole] || 0;
}

export function canReadAllFinancingRequests(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer', 'content_manager', 'editor'].includes(normalize(role));
}

export function canReadAllCalls(role?: string | null): boolean {
  return ['super_admin', 'admin', 'developer'].includes(normalize(role));
}

// ── Auth & seller context ───────────────────────────────────────────────────

export async function resolveAuthSellerAccessSnapshot(): Promise<{ role: string; ownerUid: string; email: string }> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return { role: '', ownerUid: '', email: '' };
  }

  let role = '';
  let ownerUid = firebaseUser.uid;
  const email = normalize(firebaseUser.email);

  try {
    const tokenResult = await firebaseUser.getIdTokenResult();
    role = normalize(String(tokenResult.claims.role || ''));
    ownerUid = String(tokenResult.claims.parentAccountUid || firebaseUser.uid || '').trim() || firebaseUser.uid;
  } catch (error) {
    console.error('Unable to resolve auth seller access snapshot:', error);
  }

  return {
    role,
    ownerUid,
    email,
  };
}

export function isDemoListing(listing: Listing): boolean {
  const id = normalize(listing.id);
  const seller = normalize(listing.sellerUid || listing.sellerId);
  return id.startsWith('demo-') || id.startsWith('catalog-') || seller.includes('demo');
}

export async function getSellerFeatureContext(sellerUid?: string | null): Promise<{ ownerUid: string; role: string; featuredCap: number }> {
  const normalizedSellerUid = String(sellerUid || '').trim();
  if (!normalizedSellerUid) {
    return { ownerUid: '', role: '', featuredCap: 0 };
  }

  const authSnapshot = auth.currentUser?.uid === normalizedSellerUid
    ? await resolveAuthSellerAccessSnapshot()
    : { role: '', ownerUid: normalizedSellerUid, email: '' };

  let ownerUid = String(authSnapshot.ownerUid || normalizedSellerUid).trim() || normalizedSellerUid;
  let role = normalize(authSnapshot.role);

  try {
    const sellerSnapshot = await getDoc(doc(db, 'users', normalizedSellerUid));
    const sellerData = sellerSnapshot.exists() ? (sellerSnapshot.data() as Record<string, unknown>) : {};
    ownerUid = String(sellerData.parentAccountUid || ownerUid || normalizedSellerUid).trim() || normalizedSellerUid;
    const ownerSnapshot = ownerUid && ownerUid !== normalizedSellerUid ? await getDoc(doc(db, 'users', ownerUid)) : sellerSnapshot;
    const ownerData = ownerSnapshot.exists() ? (ownerSnapshot.data() as Record<string, unknown>) : sellerData;
    role = normalize(String(ownerData.role || sellerData.role || role || ''));
  } catch (error) {
    console.warn('Falling back to auth claims for seller feature context:', error);
  }

  return {
    ownerUid,
    role,
    featuredCap: getFeaturedListingCapForRole(role),
  };
}

export async function ensureFeaturedListingCapacity(params: { sellerUid?: string | null; listingId?: string; nextFeatured?: boolean }): Promise<{ ownerUid: string; role: string; featuredCap: number }> {
  const nextFeatured = !!params.nextFeatured;
  const context = await getSellerFeatureContext(params.sellerUid);

  if (!nextFeatured || !context.ownerUid || !Number.isFinite(context.featuredCap)) {
    return context;
  }

  if (context.featuredCap < 1) {
    throw new Error('This account role cannot mark listings as featured.');
  }

  const snapshot = await getDocs(query(collection(db, 'listings'), where('sellerUid', '==', context.ownerUid), where('featured', '==', true)));
  const activeFeaturedCount = snapshot.docs.filter((docSnapshot) => {
    if (params.listingId && docSnapshot.id === params.listingId) return false;
    const data = docSnapshot.data() as Partial<Listing>;
    return normalize(String(data.status || 'active')) !== 'sold';
  }).length;

  if (activeFeaturedCount >= context.featuredCap) {
    throw new Error(`This account can feature up to ${context.featuredCap} active ${context.featuredCap === 1 ? 'listing' : 'listings'}. Unfeature one before selecting another.`);
  }

  return context;
}

// ── Inquiry spam detection ──────────────────────────────────────────────────

const SPAM_PHRASES = [
  // Financial scam
  'whatsapp', 'telegram', 'crypto', 'bitcoin', 'western union', 'wire transfer',
  'money order', 'cashier check', 'send money', 'bank transfer', 'paypal gift',
  'zelle me', 'venmo me', 'urgent transfer', 'wire now',
  // Off-platform redirect
  'signal me', 'text me at', 'email me at', 'contact me outside',
  // Urgency/pressure
  'act now', 'limited time', 'don\'t miss', 'last chance',
  // Generic spam
  'click here', 'free shipping', 'no obligation', 'congratulations',
  'you\'ve been selected', 'dear sir', 'dear friend', 'dear madam',
];

const DISPOSABLE_EMAIL_DOMAINS = [
  'example.com', 'test.com', 'mailinator.com', 'guerrillamail.com',
  'tempmail.com', 'throwaway.email', 'yopmail.com', 'sharklasers.com',
  'grr.la', 'dispostable.com', 'maildrop.cc', 'trashmail.com',
];

export function calculateInquirySpamSignal(input: {
  buyerEmail: string;
  buyerPhone: string;
  message: string;
}): { spamScore: number; spamFlags: string[] } {
  const email = normalize(input.buyerEmail);
  const phone = normalize(input.buyerPhone);
  const message = normalize(input.message);
  const flags: string[] = [];
  let score = 0;

  // Email checks
  if (!email.includes('@')) {
    flags.push('suspicious_email');
    score += 25;
  } else {
    const domain = email.split('@')[1] || '';
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      flags.push('disposable_email');
      score += 20;
    }
  }

  // Phone check
  if (phone.replace(/\D/g, '').length < 10) {
    flags.push('invalid_phone');
    score += 20;
  }

  // Message length
  if (message.length < 15) {
    flags.push('very_short_message');
    score += 20;
  }

  // Spam keyword phrases
  const matchedSpamPhrases = SPAM_PHRASES.filter((phrase) => message.includes(phrase));
  if (matchedSpamPhrases.length > 0) {
    flags.push('spam_keywords');
    score += Math.min(40, matchedSpamPhrases.length * 15);
  }

  // Excessive URLs (3+)
  const urlCount = (message.match(/https?:\/\//g) || []).length;
  if (urlCount >= 3) {
    flags.push('excessive_urls');
    score += 15;
  }

  // Excessive ALL CAPS (>50% uppercase in messages >20 chars)
  if (message.length > 20) {
    const letters = message.replace(/[^a-zA-Z]/g, '');
    const upper = letters.replace(/[^A-Z]/g, '');
    if (letters.length > 0 && upper.length / letters.length > 0.5) {
      flags.push('excessive_caps');
      score += 10;
    }
  }

  // Repeated characters (same char 5+ times consecutively)
  if (/(.)\1{4,}/i.test(message)) {
    flags.push('repeated_chars');
    score += 10;
  }

  // Excessive special characters (>30% non-alphanumeric)
  if (message.length > 10) {
    const nonAlphaNum = message.replace(/[a-zA-Z0-9\s]/g, '').length;
    if (nonAlphaNum / message.length > 0.3) {
      flags.push('excessive_special_chars');
      score += 15;
    }
  }

  return {
    spamScore: Math.max(0, Math.min(100, score)),
    spamFlags: flags,
  };
}

// ── News/blog normalization ─────────────────────────────────────────────────

export const isPublicBlogPost = (post: Record<string, unknown> | null | undefined) => {
  const status = String(post?.status || '').trim().toLowerCase();
  const reviewStatus = String(post?.reviewStatus || '').trim().toLowerCase();
  return status === 'published' || reviewStatus === 'published';
};

export const mapBlogPostToNewsPost = (postId: string, post: Record<string, unknown>): NewsPost => {
  const dateMs = toMillis(post.updatedAt) || toMillis(post.createdAt) || Date.now();
  return {
    id: `blog-${postId}`,
    title: String(post.title || 'Untitled'),
    summary: String(post.excerpt || '').trim() || stripHtml(post.content).slice(0, 220),
    content: String(post.content || ''),
    author: String(post.authorName || 'Forestry Equipment Sales Editorial'),
    date: new Date(dateMs).toISOString(),
    image: String(post.image || '').trim() || '/Forestry_Equipment_Sales_Logo.png?v=20260405c',
    category: String(post.category || 'Industry News'),
    seoTitle: String(post.seoTitle || '').trim(),
    seoDescription: String(post.seoDescription || '').trim(),
    seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.filter((keyword): keyword is string => typeof keyword === 'string') : [],
    seoSlug: String(post.seoSlug || '').trim(),
  };
};

export const normalizeLegacyNewsPost = (postId: string, post: Record<string, unknown>): NewsPost => {
  const dateMs = toMillis(post.date) || toMillis(post.updatedAt) || toMillis(post.createdAt) || Date.now();
  return {
    id: postId,
    title: String(post.title || 'Untitled'),
    summary: String(post.summary || '').trim() || stripHtml(post.content).slice(0, 220),
    content: String(post.content || ''),
    author: String(post.author || 'Forestry Equipment Sales Editorial'),
    date: new Date(dateMs).toISOString(),
    image: String(post.image || '').trim() || '/Forestry_Equipment_Sales_Logo.png?v=20260405c',
    category: String(post.category || 'Industry News'),
    seoTitle: String(post.seoTitle || '').trim(),
    seoDescription: String(post.seoDescription || '').trim(),
    seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords.filter((keyword): keyword is string => typeof keyword === 'string') : [],
    seoSlug: String(post.seoSlug || '').trim(),
  };
};

// ── Listing time helpers ────────────────────────────────────────────────────

export const wasActiveAt = (listing: Listing, snapshotMs: number): boolean => {
  const createdMs = toMillis(listing.createdAt);
  if (createdMs === undefined || createdMs > snapshotMs) return false;

  const status = normalize(listing.status || 'active');
  if (!['sold', 'archived', 'expired'].includes(status)) return true;

  const soldAtMs = toMillis(listing.updatedAt);
  if (soldAtMs === undefined) return false;

  return soldAtMs > snapshotMs;
};

// ── Marketplace data normalization ──────────────────────────────────────────

export function normalizeHomeMarketplacePayload(payload?: Partial<HomeMarketplaceData> | null): HomeMarketplaceData {
  return {
    featuredListings: Array.isArray(payload?.featuredListings)
      ? payload.featuredListings.map((listing) => normalizeListingImages(listing as Listing))
      : [],
    recentSoldListings: Array.isArray(payload?.recentSoldListings)
      ? payload.recentSoldListings.map((listing) => normalizeListingImages(listing as Listing))
      : [],
    categoryMetrics: Array.isArray(payload?.categoryMetrics) ? payload.categoryMetrics : [],
    topLevelCategoryMetrics: Array.isArray(payload?.topLevelCategoryMetrics) ? payload.topLevelCategoryMetrics : [],
    heroStats: payload?.heroStats || { totalActive: 0, totalMarketValue: 0 },
    asOf: payload?.asOf,
  };
}

// ── Cache accessors ─────────────────────────────────────────────────────────

export function getCachedPublicListingsSnapshot(): Listing[] {
  const cached = readBrowserCache<Listing[]>(PUBLIC_LISTINGS_CACHE_KEY);
  return Array.isArray(cached) ? cached.map((listing) => normalizeListingImages(listing as Listing)) : [];
}

export function getCachedHomeMarketplaceSnapshot(): HomeMarketplaceData | null {
  const cached = readBrowserCache<Partial<HomeMarketplaceData>>(HOME_MARKETPLACE_CACHE_KEY);
  if (!cached) return null;
  return normalizeHomeMarketplacePayload(cached);
}

// ── Filter helpers ──────────────────────────────────────────────────────────

export function isCacheablePublicListingsRequest(filters?: import('../../types').ListingFilters): boolean {
  if (!filters) return true;

  return !Object.entries(filters).some(([key, value]) => {
    if (value === undefined || value === null || value === '') return false;
    return !['sortBy', 'inStockOnly'].includes(key);
  });
}

export function buildListingFilterSearchParams(filters?: import('../../types').ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  return params;
}

// ── Misc helpers ────────────────────────────────────────────────────────────

export type QuotaLimitedAccountPayload = {
  firestoreQuotaLimited?: boolean;
  source?: string;
  warning?: string;
};

export function isQuotaLimitedAccountPayload(payload: unknown): payload is QuotaLimitedAccountPayload {
  return Boolean(payload)
    && typeof payload === 'object'
    && Boolean((payload as QuotaLimitedAccountPayload).firestoreQuotaLimited);
}

export function autoAddTaxonomyEntry(listing: Partial<Listing>): void {
  const category = normalize(listing.category);
  const subcategory = normalize(listing.subcategory);
  const manufacturer = normalize((listing as any).make || (listing as any).manufacturer || '');
  const model = normalize(listing.model);

  if (category && subcategory && manufacturer) {
    taxonomyService.ensureTaxonomyEntry(category, subcategory, manufacturer, model).catch((error) => {
      console.warn('Auto-add taxonomy entry failed (non-blocking):', error);
    });
  }
}

export function invalidateListingRelatedCaches(listingId?: string): void {
  clearPrivateBrowserCachePrefix('account-listings:');
  clearPrivateBrowserCachePrefix('listing-lifecycle-audit:');
  clearPrivateBrowserCachePrefix('admin-listing-review-summary:');
  clearPrivateBrowserCachePrefix('seller-listings:');

  if (listingId) {
    clearPrivateBrowserCacheScope(`listing-lifecycle-audit:${listingId}`);
    clearPrivateBrowserCacheScope(`admin-listing-review-summary:${listingId}`);
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(PUBLIC_LISTINGS_CACHE_KEY);
      window.localStorage.removeItem(HOME_MARKETPLACE_CACHE_KEY);
    } catch (error) {
      console.warn('Unable to clear public marketplace caches after listing mutation:', error);
    }
  }
}
