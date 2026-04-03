import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import multer from 'multer';
import { captureServerException, initializeServerSentry } from './sentry.server.js';

dotenv.config();
initializeServerSentry();

// Startup env var validation — warn on missing recommended vars
{
  const recommended = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RECAPTCHA_API_KEY'];
  const missing = recommended.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[startup] Missing recommended environment variables: ${missing.join(', ')}`);
  }
}

process.on('uncaughtException', (error) => {
  captureServerException(error, {
    tags: { process_event: 'uncaughtException' },
  });
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  captureServerException(reason, {
    tags: { process_event: 'unhandledRejection' },
  });
  console.error('Unhandled rejection:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let sharedDealerApiProxy: ((req: express.Request, res: express.Response) => Promise<unknown> | unknown) | null = null;
let sharedPublicPagesProxy: ((req: express.Request, res: express.Response, next?: express.NextFunction) => Promise<unknown> | unknown) | null = null;
try {
  const publicPagesModule = require(path.join(__dirname, 'functions', 'public-pages.js')) as {
    handlePublicPagesRequest?: (req: express.Request, res: express.Response, next?: express.NextFunction) => Promise<unknown> | unknown;
  };
  sharedPublicPagesProxy = typeof publicPagesModule.handlePublicPagesRequest === 'function' ? publicPagesModule.handlePublicPagesRequest : null;
} catch (error) {
  console.warn('Unable to load public pages handler for local routes.', error);
}

try {
  const functionsModule = require(path.join(__dirname, 'functions', 'index.js')) as {
    apiProxy?: (req: express.Request, res: express.Response) => Promise<unknown> | unknown;
  };
  sharedDealerApiProxy = typeof functionsModule.apiProxy === 'function' ? functionsModule.apiProxy : null;
} catch (error) {
  console.warn('Unable to load Firebase Functions apiProxy for local dealer feed routes.', error);
}

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
const firebaseProjectId = String(process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || firebaseConfig.projectId || '').trim() || firebaseConfig.projectId;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseProjectId,
  });
}

const db = admin.firestore();
const auth = admin.auth();

type MarketplaceStatsPayload = {
  monthlyActiveBuyers: number;
  avgEquipmentValue: number;
  globalReachCountries: number;
  conversionRate: number;
  asOf: string;
};

type ManagedAccountRole =
  | 'super_admin'
  | 'admin'
  | 'developer'
  | 'content_manager'
  | 'editor'
  | 'dealer'
  | 'dealer_manager'
  | 'dealer_staff'
  | 'individual_seller'
  | 'member';

type DealerFeedItem = {
  externalId?: string;
  title?: string;
  category?: string;
  subcategory?: string;
  make?: string;
  manufacturer?: string;
  model?: string;
  year?: number | string;
  price?: number | string;
  currency?: string;
  hours?: number | string;
  condition?: string;
  description?: string;
  location?: string;
  images?: string[];
  specs?: Record<string, unknown>;
};

let marketplaceStatsCache: { value: MarketplaceStatsPayload; fetchedAt: number } | null = null;
let publicNewsCache: { value: Record<string, unknown>[]; fetchedAt: number } | null = null;
const MARKETPLACE_STATS_TTL_MS = 10 * 60 * 1000;
const PUBLIC_NEWS_TTL_MS = 5 * 60 * 1000;
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAMES = ['csrf-token', 'x-csrf-token'];

function getCsrfCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getRequestCsrfCookieToken(req: express.Request): string | null {
  const raw = req.cookies?.[CSRF_COOKIE_NAME];
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  return normalized || null;
}

function ensureCsrfCookieToken(req: express.Request, res: express.Response): string {
  const existingToken = getRequestCsrfCookieToken(req);
  if (existingToken) return existingToken;

  const freshToken = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, freshToken, getCsrfCookieOptions());
  return freshToken;
}

function getRequestCsrfHeaderToken(req: express.Request): string | null {
  for (const headerName of CSRF_HEADER_NAMES) {
    const raw = req.get(headerName);
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }
  return null;
}

function tokensMatch(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function csrfProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path === '/billing/webhook' || req.path === '/webhooks/stripe') return next();
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return next();

  const cookieToken = ensureCsrfCookieToken(req, res);
  const headerToken = getRequestCsrfHeaderToken(req);
  if (!headerToken || !tokensMatch(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  return next();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    const ts = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof ts.toDate === 'function') {
      const parsed = ts.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof ts.seconds === 'number') {
      return new Date(ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6));
    }
  }
  return null;
}

function getCountryFromLocation(location: unknown): string | null {
  if (typeof location !== 'string') return null;
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function normalizeRole(value: unknown): ManagedAccountRole {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'super_admin') return 'super_admin';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'developer') return 'developer';
  if (normalized === 'content_manager') return 'content_manager';
  if (normalized === 'editor') return 'editor';
  if (normalized === 'dealer') return 'dealer';
  if (normalized === 'dealer_manager') return 'dealer_manager';
  if (normalized === 'dealer_staff') return 'dealer_staff';
  if (normalized === 'individual_seller') return 'individual_seller';
  if (normalized === 'member' || normalized === 'buyer') return 'member';
  return 'member';
}

function canCreateManagedRole(parentRole: ManagedAccountRole, childRole: ManagedAccountRole): boolean {
  const adminManagedRoles: ManagedAccountRole[] = ['admin', 'developer', 'content_manager', 'editor', 'dealer', 'dealer_manager', 'dealer_staff', 'member'];
  const dealerManagedRoles: ManagedAccountRole[] = ['dealer_manager', 'dealer_staff', 'member'];

  if (parentRole === 'super_admin') return true;
  if (parentRole === 'admin' || parentRole === 'developer') return adminManagedRoles.includes(childRole);
  if (parentRole === 'dealer' || parentRole === 'dealer_manager') return dealerManagedRoles.includes(childRole);
  return false;
}

const PRIVILEGED_ADMIN_EMAILS: ReadonlySet<string> = new Set(
  (process.env.PRIVILEGED_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
);

function isPrivilegedAdminEmail(email: unknown): boolean {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.length > 0 && PRIVILEGED_ADMIN_EMAILS.has(normalized);
}

function canAdministrateAccountRole(role: unknown): boolean {
  return ['super_admin', 'admin', 'developer'].includes(String(role || '').trim().toLowerCase());
}

function normalizeNonEmptyString(value: unknown, fallback = ''): string {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function timestampValueToIso(value: unknown): string | null {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString() : null;
}

function stripHtml(value: unknown): string {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isPublishedPublicBlogPost(post: Record<string, unknown>): boolean {
  const status = normalizeNonEmptyString(post.status).toLowerCase();
  const reviewStatus = normalizeNonEmptyString(post.reviewStatus).toLowerCase();
  return status === 'published' || reviewStatus === 'published';
}

function serializePublicLegacyNewsPost(id: string, data: Record<string, unknown>) {
  const summary = normalizeNonEmptyString(data.summary) || stripHtml(data.content).slice(0, 220);
  return {
    id,
    title: normalizeNonEmptyString(data.title, 'Untitled'),
    summary,
    content: normalizeNonEmptyString(data.content),
    author: normalizeNonEmptyString(data.author, 'Forestry Equipment Sales Editorial'),
    date: timestampValueToIso(data.date) || timestampValueToIso(data.updatedAt) || timestampValueToIso(data.createdAt) || new Date().toISOString(),
    image: normalizeNonEmptyString(data.image) || '/Forestry_Equipment_Sales_Logo.png?v=20260327c',
    category: normalizeNonEmptyString(data.category, 'Industry News'),
    seoTitle: normalizeNonEmptyString(data.seoTitle),
    seoDescription: normalizeNonEmptyString(data.seoDescription),
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((keyword) => typeof keyword === 'string') : [],
    seoSlug: normalizeNonEmptyString(data.seoSlug),
  };
}

function serializePublicCmsNewsPost(id: string, data: Record<string, unknown>) {
  const summary = normalizeNonEmptyString(data.excerpt) || stripHtml(data.content).slice(0, 220);
  return {
    id: `blog-${id}`,
    title: normalizeNonEmptyString(data.title, 'Untitled'),
    summary,
    content: normalizeNonEmptyString(data.content),
    author: normalizeNonEmptyString(data.authorName, 'Forestry Equipment Sales Editorial'),
    date: timestampValueToIso(data.updatedAt) || timestampValueToIso(data.createdAt) || new Date().toISOString(),
    image: normalizeNonEmptyString(data.image) || '/Forestry_Equipment_Sales_Logo.png?v=20260327c',
    category: normalizeNonEmptyString(data.category, 'Industry News'),
    seoTitle: normalizeNonEmptyString(data.seoTitle),
    seoDescription: normalizeNonEmptyString(data.seoDescription),
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((keyword) => typeof keyword === 'string') : [],
    seoSlug: normalizeNonEmptyString(data.seoSlug),
  };
}

async function getPublicNewsFeedPayload(): Promise<Record<string, unknown>[]> {
  if (publicNewsCache && Date.now() - publicNewsCache.fetchedAt < PUBLIC_NEWS_TTL_MS) {
    return publicNewsCache.value;
  }

  try {
    const [legacyNewsResult, cmsPostsResult] = await Promise.allSettled([
      db.collection('news').get(),
      db.collection('blogPosts').orderBy('updatedAt', 'desc').limit(36).get(),
    ]);

    const legacyNews = legacyNewsResult.status === 'fulfilled'
      ? legacyNewsResult.value.docs.map((docSnapshot) => serializePublicLegacyNewsPost(docSnapshot.id, docSnapshot.data() || {}))
      : [];

    const cmsPosts = cmsPostsResult.status === 'fulfilled'
      ? cmsPostsResult.value.docs
          .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() || {}) }))
          .filter((post) => isPublishedPublicBlogPost(post))
          .map((post) => serializePublicCmsNewsPost(String(post.id || ''), post))
      : [];

    if (legacyNewsResult.status === 'rejected' && cmsPostsResult.status === 'rejected') {
      const firstError = legacyNewsResult.reason || cmsPostsResult.reason;
      if (publicNewsCache) {
        console.warn('Using cached public news feed because live reads failed:', firstError);
        return publicNewsCache.value;
      }
      throw (firstError instanceof Error ? firstError : new Error('Unable to load public news feed.'));
    }

    const merged = [...cmsPosts, ...legacyNews].sort((left, right) => {
      const leftDate = Date.parse(String(left.date || '')) || 0;
      const rightDate = Date.parse(String(right.date || '')) || 0;
      return rightDate - leftDate;
    });

    publicNewsCache = {
      value: merged,
      fetchedAt: Date.now(),
    };

    return merged;
  } catch (error) {
    if (publicNewsCache) {
      console.warn('Falling back to cached public news feed after live read failure:', error);
      return publicNewsCache.value;
    }

    throw error;
  }
}

async function getPublicNewsPostPayload(id: string): Promise<Record<string, unknown> | null> {
  const normalizedId = normalizeNonEmptyString(id);
  if (!normalizedId) return null;

  const cachedPost = publicNewsCache?.value.find((post) => normalizeNonEmptyString(post.id) === normalizedId);
  if (cachedPost) {
    return cachedPost;
  }

  if (normalizedId.startsWith('blog-')) {
    const cmsDocId = normalizedId.slice(5);
    if (!cmsDocId) return null;

    const snapshot = await db.collection('blogPosts').doc(cmsDocId).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() || {};
    if (!isPublishedPublicBlogPost(data)) return null;
    return serializePublicCmsNewsPost(snapshot.id, data);
  }

  const legacySnapshot = await db.collection('news').doc(normalizedId).get();
  if (!legacySnapshot.exists) return null;
  return serializePublicLegacyNewsPost(legacySnapshot.id, legacySnapshot.data() || {});
}

function serializeInquiryDoc(docSnapshot: FirebaseFirestore.QueryDocumentSnapshot): Record<string, unknown> {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    listingId: normalizeNonEmptyString(data.listingId),
    sellerUid: normalizeNonEmptyString(data.sellerUid || data.sellerId) || undefined,
    sellerId: normalizeNonEmptyString(data.sellerId || data.sellerUid) || undefined,
    buyerUid: normalizeNonEmptyString(data.buyerUid) || undefined,
    buyerName: normalizeNonEmptyString(data.buyerName, 'Unknown Buyer'),
    buyerEmail: normalizeNonEmptyString(data.buyerEmail),
    buyerPhone: normalizeNonEmptyString(data.buyerPhone),
    message: normalizeNonEmptyString(data.message),
    type: normalizeNonEmptyString(data.type, 'Inquiry'),
    status: normalizeNonEmptyString(data.status, 'New'),
    assignedToUid: normalizeNonEmptyString(data.assignedToUid) || null,
    assignedToName: normalizeNonEmptyString(data.assignedToName) || null,
    responseTimeMinutes: typeof data.responseTimeMinutes === 'number' ? data.responseTimeMinutes : null,
    spamScore: typeof data.spamScore === 'number' ? data.spamScore : 0,
    createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
    updatedAt: timestampValueToIso(data.updatedAt) || undefined,
  };
}

function serializeCallDoc(docSnapshot: FirebaseFirestore.QueryDocumentSnapshot): Record<string, unknown> {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    listingId: normalizeNonEmptyString(data.listingId),
    listingTitle: normalizeNonEmptyString(data.listingTitle) || undefined,
    sellerId: normalizeNonEmptyString(data.sellerId || data.sellerUid),
    sellerUid: normalizeNonEmptyString(data.sellerUid || data.sellerId) || undefined,
    sellerName: normalizeNonEmptyString(data.sellerName) || undefined,
    sellerPhone: normalizeNonEmptyString(data.sellerPhone) || undefined,
    callerUid: normalizeNonEmptyString(data.callerUid) || null,
    callerName: normalizeNonEmptyString(data.callerName, 'Unknown Caller'),
    callerEmail: normalizeNonEmptyString(data.callerEmail) || undefined,
    callerPhone: normalizeNonEmptyString(data.callerPhone),
    duration: normalizeFiniteNumber(data.duration, 0),
    status: normalizeNonEmptyString(data.status, 'Completed'),
    source: normalizeNonEmptyString(data.source) || undefined,
    isAuthenticated: Boolean(data.isAuthenticated),
    createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
  };
}

function serializeSellerPayloadFromStorefront(snapshotId: string, data: Record<string, unknown> = {}): Record<string, unknown> {
  const rawRole = normalizeNonEmptyString(data.role, 'member').toLowerCase();
  const isDealerRole = ['dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(rawRole);
  return {
    id: snapshotId,
    uid: snapshotId,
    name: normalizeNonEmptyString(data.storefrontName || data.displayName, 'Forestry Equipment Sales Seller'),
    type: isDealerRole ? 'Dealer' : 'Private',
    role: normalizeNonEmptyString(data.role, 'member'),
    storefrontSlug: normalizeNonEmptyString(data.storefrontSlug),
    location: normalizeNonEmptyString(data.location, 'Unknown'),
    phone: normalizeNonEmptyString(data.phone),
    email: normalizeNonEmptyString(data.email),
    website: normalizeNonEmptyString(data.website),
    logo: normalizeNonEmptyString(data.logo),
    coverPhotoUrl: normalizeNonEmptyString(data.coverPhotoUrl),
    storefrontName: normalizeNonEmptyString(data.storefrontName),
    storefrontTagline: normalizeNonEmptyString(data.storefrontTagline),
    storefrontDescription: normalizeNonEmptyString(data.storefrontDescription),
    seoTitle: normalizeNonEmptyString(data.seoTitle),
    seoDescription: normalizeNonEmptyString(data.seoDescription),
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((keyword) => typeof keyword === 'string') : [],
    twilioPhoneNumber: normalizeNonEmptyString(data.twilioPhoneNumber),
    rating: 5,
    totalListings: 0,
    memberSince: timestampValueToIso(data.createdAt) || new Date().toISOString(),
    verified: Boolean(data.storefrontEnabled),
  };
}

function serializeSellerPayloadFromUser(snapshotId: string, data: Record<string, unknown> = {}): Record<string, unknown> {
  const rawRole = normalizeNonEmptyString(data.role, 'member').toLowerCase();
  const isDealerRole = ['dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(rawRole);
  return {
    id: snapshotId,
    uid: snapshotId,
    name: normalizeNonEmptyString(data.displayName || data.name, 'Forestry Equipment Sales Seller'),
    type: isDealerRole ? 'Dealer' : 'Private',
    role: normalizeNonEmptyString(data.role, 'member'),
    storefrontSlug: normalizeNonEmptyString(data.storefrontSlug),
    location: normalizeNonEmptyString(data.location, 'Unknown'),
    phone: normalizeNonEmptyString(data.phoneNumber),
    email: normalizeNonEmptyString(data.email),
    website: normalizeNonEmptyString(data.website),
    logo: normalizeNonEmptyString(data.photoURL || data.profileImage),
    coverPhotoUrl: normalizeNonEmptyString(data.coverPhotoUrl),
    storefrontName: normalizeNonEmptyString(data.storefrontName || data.displayName),
    storefrontTagline: normalizeNonEmptyString(data.storefrontTagline),
    storefrontDescription: normalizeNonEmptyString(data.storefrontDescription || data.about),
    seoTitle: normalizeNonEmptyString(data.seoTitle),
    seoDescription: normalizeNonEmptyString(data.seoDescription),
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((keyword) => typeof keyword === 'string') : [],
    twilioPhoneNumber: normalizeNonEmptyString(data.twilioPhoneNumber),
    rating: 5,
    totalListings: 0,
    memberSince: timestampValueToIso(data.createdAt) || new Date().toISOString(),
    verified: true,
  };
}

function hasActiveDealerDirectorySubscription(data: Record<string, unknown> = {}): boolean {
  const role = normalizeNonEmptyString(data.role).toLowerCase();
  if (!['dealer', 'pro_dealer'].includes(role)) {
    return false;
  }

  if (!Boolean(data.storefrontEnabled)) {
    return false;
  }

  // If a subscription record exists, verify it is active/trialing.
  // If no subscription is set yet, allow the dealer through so the
  // directory populates while Firestore data is bootstrapped.
  const activeSubscriptionPlanId = normalizeNonEmptyString(data.activeSubscriptionPlanId).toLowerCase();
  const subscriptionStatus = normalizeNonEmptyString(data.subscriptionStatus).toLowerCase();
  if (activeSubscriptionPlanId && subscriptionStatus) {
    return ['dealer', 'fleet_dealer'].includes(activeSubscriptionPlanId)
      && ['active', 'trialing'].includes(subscriptionStatus);
  }

  return true;
}

function buildMarketplaceListingPayload(listingId: string, rawListing: Record<string, unknown>): Record<string, unknown> {
  const listing = rawListing || {};
  const make = normalizeNonEmptyString(listing.make || listing.manufacturer || listing.brand);
  const images = normalizeImageUrls(Array.isArray(listing.images) ? listing.images : []);

  return {
    id: String(listingId),
    sellerUid: normalizeNonEmptyString(listing.sellerUid || listing.sellerId) || undefined,
    sellerId: normalizeNonEmptyString(listing.sellerId || listing.sellerUid) || undefined,
    title: normalizeNonEmptyString(listing.title, 'Equipment Listing'),
    category: normalizeNonEmptyString(listing.category, 'Equipment'),
    subcategory: normalizeNonEmptyString(listing.subcategory || listing.category, 'Equipment'),
    make,
    manufacturer: normalizeNonEmptyString(listing.manufacturer || make),
    model: normalizeNonEmptyString(listing.model),
    year: normalizeFiniteNumber(listing.year, 0),
    price: normalizeFiniteNumber(listing.price, 0),
    currency: normalizeNonEmptyString(listing.currency, 'USD'),
    hours: normalizeFiniteNumber(listing.hours, 0),
    condition: normalizeNonEmptyString(listing.condition, 'Used'),
    description: normalizeNonEmptyString(listing.description),
    images,
    location: normalizeNonEmptyString(listing.location),
    status: normalizeNonEmptyString(listing.status, 'active'),
    approvalStatus: normalizeNonEmptyString(listing.approvalStatus, 'pending'),
    paymentStatus: normalizeNonEmptyString(listing.paymentStatus, 'pending'),
    featured: Boolean(listing.featured),
    views: normalizeFiniteNumber(listing.views, 0),
    leads: normalizeFiniteNumber(listing.leads, 0),
    createdAt: timestampValueToIso(listing.createdAt) || new Date().toISOString(),
    updatedAt: timestampValueToIso(listing.updatedAt) || undefined,
  };
}

async function getFirestoreQueryCount(query: FirebaseFirestore.Query): Promise<number> {
  const countMethod = (query as FirebaseFirestore.Query & { count?: () => FirebaseFirestore.AggregateQuery<any> }).count;
  if (typeof countMethod === 'function') {
    const aggregateSnapshot = await countMethod.call(query).get();
    const aggregateData = typeof aggregateSnapshot?.data === 'function'
      ? (aggregateSnapshot.data() as { count?: number })
      : {};
    return Number(aggregateData?.count || 0);
  }

  const snapshot = await query.get();
  return snapshot.size;
}

function computeAdminOverviewMarketSentiment(input: {
  conversionRate: number;
  inventoryTurnoverRate: number;
  liveListings: number;
}): string {
  if (input.liveListings <= 0) return 'Idle';
  if (input.conversionRate >= 12 || input.inventoryTurnoverRate >= 18) return 'Bullish';
  if (input.conversionRate >= 5 || input.inventoryTurnoverRate >= 8) return 'Stable';
  return 'Cautious';
}

async function buildAdminOverviewBootstrapPayload() {
  const [
    totalListingsResult,
    liveListingsResult,
    pendingReviewResult,
    rejectedListingsResult,
    soldListingsResult,
    recentListingsResult,
    inquiriesResult,
    recentCallsResult,
    callCountResult,
    activeUsersResult,
  ] = await Promise.allSettled([
    getFirestoreQueryCount(db.collection('listings')),
    getFirestoreQueryCount(
      db.collection('listings')
        .where('approvalStatus', '==', 'approved')
        .where('paymentStatus', '==', 'paid')
        .where('status', '==', 'active')
    ),
    getFirestoreQueryCount(db.collection('listings').where('approvalStatus', '==', 'pending')),
    getFirestoreQueryCount(db.collection('listings').where('approvalStatus', '==', 'rejected')),
    getFirestoreQueryCount(db.collection('listings').where('status', '==', 'sold')),
    db.collection('listings').orderBy('createdAt', 'desc').limit(5).get(),
    db.collection('inquiries').orderBy('createdAt', 'desc').limit(250).get(),
    db.collection('calls').orderBy('createdAt', 'desc').limit(5).get(),
    getFirestoreQueryCount(db.collection('calls')),
    getFirestoreQueryCount(db.collection('users').where('accountStatus', '==', 'active')),
  ]);

  const unwrapCount = (result: PromiseSettledResult<number>) => result.status === 'fulfilled' ? result.value : 0;

  const totalListings = unwrapCount(totalListingsResult);
  const liveListings = unwrapCount(liveListingsResult);
  const pendingReview = unwrapCount(pendingReviewResult);
  const rejectedListings = unwrapCount(rejectedListingsResult);
  const soldListings = unwrapCount(soldListingsResult);
  const callVolume = unwrapCount(callCountResult);
  const activeUsers = unwrapCount(activeUsersResult);

  const recentListings = recentListingsResult.status === 'fulfilled'
    ? recentListingsResult.value.docs.map((docSnapshot) => buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {}))
    : [];

  const recentCalls = recentCallsResult.status === 'fulfilled'
    ? recentCallsResult.value.docs.map((docSnapshot) => serializeCallDoc(docSnapshot))
    : [];

  let totalLeads = 0;
  let wonInquiries = 0;
  let avgResponseTimeMinutes: number | null = null;
  if (inquiriesResult.status === 'fulfilled') {
    const inquiries = inquiriesResult.value.docs.map((docSnapshot) => serializeInquiryDoc(docSnapshot));
    totalLeads = inquiries.length;
    wonInquiries = inquiries.filter((inquiry) => inquiry.status === 'Won').length;
    const responseSamples = inquiries
      .map((inquiry) => Number(inquiry.responseTimeMinutes))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (responseSamples.length > 0) {
      const totalResponseTime = responseSamples.reduce((sum, value) => sum + value, 0);
      avgResponseTimeMinutes = Number((totalResponseTime / responseSamples.length).toFixed(1));
    }
  }

  const conversionRate = totalLeads > 0 ? Number(((wonInquiries / totalLeads) * 100).toFixed(1)) : 0;
  const inventoryTurnoverRate = totalListings > 0 ? Number(((soldListings / totalListings) * 100).toFixed(1)) : 0;

  return {
    metrics: {
      visibleEquipment: liveListings,
      totalLeads,
      callVolume,
      activeUsers,
      conversionRate,
      avgResponseTimeMinutes,
      marketSentiment: computeAdminOverviewMarketSentiment({
        conversionRate,
        inventoryTurnoverRate,
        liveListings,
      }),
      inventoryTurnoverRate,
    },
    listingSummary: {
      totalListings,
      liveListings,
      pendingReview,
      rejectedListings,
      soldListings,
    },
    recentListings,
    recentCalls,
    partial: false,
    degradedSections: [],
    errors: {},
    firestoreQuotaLimited: false,
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeDealerFeedListing(item: DealerFeedItem, sellerUid: string, sourceName: string) {
  const externalId = normalizeNonEmptyString(item.externalId);
  const make = normalizeNonEmptyString(item.make || item.manufacturer, 'Unknown');
  const model = normalizeNonEmptyString(item.model, 'Unknown');
  const title = normalizeNonEmptyString(item.title, `${make} ${model}`.trim());
  const category = normalizeNonEmptyString(item.category, 'Uncategorized');

  const year = normalizeFiniteNumber(item.year, new Date().getFullYear());
  const price = Math.max(0, normalizeFiniteNumber(item.price, 0));
  const hours = Math.max(0, normalizeFiniteNumber(item.hours, 0));
  const images = normalizeImageUrls(item.images);

  return {
    sellerUid,
    sellerId: sellerUid,
    title,
    category,
    subcategory: normalizeNonEmptyString(item.subcategory, category),
    make,
    manufacturer: make,
    model,
    year,
    price,
    currency: normalizeNonEmptyString(item.currency, 'USD'),
    hours,
    condition: normalizeNonEmptyString(item.condition, 'Used'),
    description: normalizeNonEmptyString(item.description, `${title} imported from dealer feed.`),
    location: normalizeNonEmptyString(item.location, 'Unknown'),
    images,
    specs: item.specs && typeof item.specs === 'object' ? item.specs : {},
    featured: false,
    views: 0,
    leads: 0,
    status: 'pending',
    approvalStatus: 'pending',
    paymentStatus: 'pending',
    marketValueEstimate: null,
    sellerVerified: true,
    qualityValidated: true,
    externalSource: {
      sourceName,
      externalId,
      importedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function getMarketplaceStats(): Promise<MarketplaceStatsPayload> {
  const now = Date.now();
  if (marketplaceStatsCache && now - marketplaceStatsCache.fetchedAt < MARKETPLACE_STATS_TTL_MS) {
    return marketplaceStatsCache.value;
  }

  const [listingsSnap, inquiriesSnap] = await Promise.all([
    db.collection('listings').where('approvalStatus', '==', 'approved').get(),
    db.collection('inquiries').get(),
  ]);

  let priceSum = 0;
  let pricedListingCount = 0;
  let totalViews = 0;
  let totalLeads = 0;
  const countries = new Set<string>();

  listingsSnap.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const status = String(data.status || 'active').toLowerCase();
    if (status === 'sold') return;

    const price = typeof data.price === 'number' ? data.price : Number(data.price || 0);
    if (Number.isFinite(price) && price > 0) {
      priceSum += price;
      pricedListingCount += 1;
    }

    const views = typeof data.views === 'number' ? data.views : Number(data.views || 0);
    const leads = typeof data.leads === 'number' ? data.leads : Number(data.leads || 0);
    if (Number.isFinite(views) && views > 0) totalViews += views;
    if (Number.isFinite(leads) && leads > 0) totalLeads += leads;

    const country = getCountryFromLocation(data.location);
    if (country) countries.add(country);
  });

  const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const activeBuyerKeys = new Set<string>();

  inquiriesSnap.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const createdAt = parseDate(data.createdAt);
    if (!createdAt || createdAt < cutoff) return;

    const buyerKey =
      (typeof data.buyerUid === 'string' && data.buyerUid) ||
      (typeof data.buyerEmail === 'string' && data.buyerEmail.toLowerCase()) ||
      (typeof data.buyerPhone === 'string' && data.buyerPhone) ||
      null;

    if (buyerKey) activeBuyerKeys.add(buyerKey);
  });

  const payload: MarketplaceStatsPayload = {
    monthlyActiveBuyers: activeBuyerKeys.size,
    avgEquipmentValue: pricedListingCount > 0 ? Math.round(priceSum / pricedListingCount) : 0,
    globalReachCountries: countries.size,
    conversionRate: totalViews > 0 ? Number(((totalLeads / totalViews) * 100).toFixed(1)) : 0,
    asOf: new Date(now).toISOString(),
  };

  marketplaceStatsCache = { value: payload, fetchedAt: now };
  return payload;
}

// Secure File Upload Configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'));
    }
  },
});

// Mock Virus Scanning Function
async function scanFileForViruses(buffer: Buffer): Promise<boolean> {
  // In a real production environment, you would integrate with a service like ClamAV or a cloud-based scanner (e.g., VirusTotal API)
  // For this implementation, we'll perform a basic check for known malicious signatures (simulated)
  console.log('Scanning file for viruses...');
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate scan time
  
  // Basic check for common malicious patterns (very rudimentary)
  const maliciousPatterns = [Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')];
  for (const pattern of maliciousPatterns) {
    if (buffer.includes(pattern)) {
      console.warn('Virus detected in file!');
      return false;
    }
  }
  
  return true; // File is clean
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    })
  : null;

type ListingCheckoutPlanId = 'individual_seller' | 'dealer' | 'fleet_dealer';
type ListingCheckoutPlan = {
  id: ListingCheckoutPlanId;
  name: string;
  amountUsd: number;
  listingCap: number;
  productId: string;
  priceId?: string;
};

const LISTING_CHECKOUT_PLANS: Record<ListingCheckoutPlanId, ListingCheckoutPlan> = {
  individual_seller: {
    id: 'individual_seller',
    name: 'Owner Operator Ad Program',
    amountUsd: 39,
    listingCap: 1,
    productId: process.env.STRIPE_PRODUCT_OWNER_OPERATOR || process.env.STRIPE_PRODUCT_INDIVIDUAL || '',
    priceId: process.env.STRIPE_PRICE_OWNER_OPERATOR || process.env.STRIPE_PRICE_INDIVIDUAL || '',
  },
  dealer: {
    id: 'dealer',
    name: 'Dealer Ad Package',
    amountUsd: 499,
    listingCap: 50,
    productId: process.env.STRIPE_PRODUCT_DEALER || '',
    priceId: process.env.STRIPE_PRICE_DEALER || '',
  },
  fleet_dealer: {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    amountUsd: 999,
    listingCap: 150,
    productId: process.env.STRIPE_PRODUCT_FLEET || '',
    priceId: process.env.STRIPE_PRICE_FLEET || '',
  },
};

const DEALER_MANAGED_ACCOUNT_LIMIT = 3;
const MANAGED_ACCOUNT_PLAN_IDS: ListingCheckoutPlanId[] = ['dealer', 'fleet_dealer'];

const checkoutPriceCache: Partial<Record<ListingCheckoutPlanId, string>> = {};
const LOCAL_BILLING_STUB_SESSION_PREFIX = 'local_stub';

function isLocalBillingStubEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
    && String(process.env.LOCAL_BILLING_STUB || '').trim().toLowerCase() === 'true';
}

function buildLocalBillingStubSessionId(scope: 'listing' | 'account', planId: string, listingId: string | null, uid: string): string {
  const safePlanId = String(planId || 'unknown').trim() || 'unknown';
  const safeListingId = String(listingId || '').trim() || 'none';
  const safeUid = String(uid || 'anonymous').trim() || 'anonymous';
  return [LOCAL_BILLING_STUB_SESSION_PREFIX, scope, safePlanId, safeListingId, safeUid].join('__');
}

function parseLocalBillingStubSessionId(sessionId: string): {
  scope: 'listing' | 'account';
  planId: string | null;
  listingId: string | null;
  uid: string | null;
} | null {
  const normalized = String(sessionId || '').trim();
  if (!normalized.startsWith(`${LOCAL_BILLING_STUB_SESSION_PREFIX}__`)) {
    return null;
  }

  const parts = normalized.split('__');
  if (parts.length < 5) return null;

  const scope = parts[1] === 'account' ? 'account' : parts[1] === 'listing' ? 'listing' : null;
  if (!scope) return null;

  return {
    scope,
    planId: parts[2] && parts[2] !== 'unknown' ? parts[2] : null,
    listingId: parts[3] && parts[3] !== 'none' ? parts[3] : null,
    uid: parts[4] && parts[4] !== 'anonymous' ? parts[4] : null,
  };
}

function buildLocalBillingStubSummary(decodedToken: admin.auth.DecodedIdToken): Record<string, unknown> {
  const claimedRole = String(decodedToken.role || '').trim() || 'member';
  return {
    stripeCustomerId: 'cus_local_stub',
    planId: null,
    subscriptionStatus: null,
    listingCap: 0,
    managedAccountCap: 0,
    currentSubscriptionId: null,
    currentPeriodEnd: null,
    subscriptionStartDate: null,
    role: claimedRole,
    accountAccessSource: claimedRole === 'member' ? 'free_member' : 'admin_override',
    accountStatus: 'active',
    entitlement: null,
    localBillingStub: true,
  };
}

function getListingCheckoutPlan(rawPlanId: unknown): ListingCheckoutPlan | null {
  const planId = String(rawPlanId || '').trim() as ListingCheckoutPlanId;
  if (!planId || !(planId in LISTING_CHECKOUT_PLANS)) {
    return null;
  }
  return LISTING_CHECKOUT_PLANS[planId];
}

async function getManagedAccountSeatContext(ownerUid: string): Promise<{
  ownerUid: string;
  seatLimit: number;
  seatCount: number;
  activePlanIds: string[];
}> {
  const normalizedOwnerUid = String(ownerUid || '').trim();
  if (!normalizedOwnerUid) {
    return { ownerUid: '', seatLimit: 0, seatCount: 0, activePlanIds: [] };
  }

  const [subscriptionsSnap, managedAccountsSnap] = await Promise.all([
    db.collection('subscriptions').where('userUid', '==', normalizedOwnerUid).where('status', '==', 'active').get(),
    db.collection('users').where('parentAccountUid', '==', normalizedOwnerUid).get(),
  ]);

  const activePlanIds = Array.from(
    new Set(
      subscriptionsSnap.docs
        .map((doc) => String(doc.data()?.planId || '').trim())
        .filter((planId) => MANAGED_ACCOUNT_PLAN_IDS.includes(planId as ListingCheckoutPlanId))
    )
  );

  const seatCount = managedAccountsSnap.docs.filter((doc) => {
    const status = String(doc.data()?.accountStatus || 'active').trim().toLowerCase();
    return status !== 'suspended';
  }).length;

  return {
    ownerUid: normalizedOwnerUid,
    seatLimit: activePlanIds.length > 0 ? DEALER_MANAGED_ACCOUNT_LIMIT : 0,
    seatCount,
    activePlanIds,
  };
}

const TRUSTED_HOSTS = new Set([
  'timberequip.com',
  'www.timberequip.com',
  'www.forestryequipmentsales.com',
  'forestryequipmentsales.com',
  'mobile-app-equipment-sales.web.app',
  'mobile-app-equipment-sales.firebaseapp.com',
  'timberequip-staging.web.app',
  'localhost:3000',
  'localhost:5173',
]);

function getRequestBaseUrl(req: express.Request): string {
  const forwardedProtoRaw = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwardedProtoRaw) ? forwardedProtoRaw[0] : forwardedProtoRaw;
  const proto = String(forwardedProto || req.protocol || '').split(',')[0].trim() || 'https';

  const forwardedHostRaw = req.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(forwardedHostRaw) ? forwardedHostRaw[0] : forwardedHostRaw;
  const host = String(forwardedHost || req.get('host') || '').split(',')[0].trim().toLowerCase();

  if (host && TRUSTED_HOSTS.has(host)) {
    return `${proto}://${host}`;
  }

  return process.env.PUBLIC_APP_URL || 'https://timberequip.com';
}

async function resolveStripePriceIdForPlan(plan: ListingCheckoutPlan): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured on this environment.');
  }

  const cached = checkoutPriceCache[plan.id];
  if (cached) return cached;

  if (plan.priceId) {
    checkoutPriceCache[plan.id] = plan.priceId;
    return plan.priceId;
  }

  const product = await stripe.products.retrieve(plan.productId, {
    expand: ['default_price'],
  });

  let priceId = '';
  if (typeof product.default_price === 'string') {
    priceId = product.default_price;
  } else if (product.default_price?.id) {
    priceId = product.default_price.id;
  }

  if (!priceId) {
    const prices = await stripe.prices.list({
      product: plan.productId,
      active: true,
      limit: 20,
    });
    const preferredPrice =
      prices.data.find((p) => p.type === 'recurring' && p.recurring?.interval === 'month') || prices.data[0];

    if (!preferredPrice?.id) {
      throw new Error(`No active Stripe price found for product ${plan.productId}.`);
    }

    priceId = preferredPrice.id;
  }

  checkoutPriceCache[plan.id] = priceId;
  return priceId;
}

async function getOrCreateStripeCustomer(userUid: string, email?: string, name?: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured on this environment.');
  }

  const userRef = db.collection('users').doc(userUid);
  const userSnap = await userRef.get();
  const existingCustomerId = String(userSnap.data()?.stripeCustomerId || '');

  if (existingCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(existingCustomerId);
      if (existingCustomer && !(existingCustomer as Stripe.DeletedCustomer).deleted) {
        return existingCustomerId;
      }
    } catch {
      // If the customer no longer exists, create a new one.
    }
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userUid,
    },
  });

  await userRef.set(
    {
      stripeCustomerId: customer.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return customer.id;
}

async function findExistingStripeCustomerId(userUid: string, email?: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured on this environment.');
  }

  const normalizedUserUid = String(userUid || '').trim();
  const userRef = db.collection('users').doc(normalizedUserUid);
  const userSnap = await userRef.get();
  const storedCustomerId = String(userSnap.data()?.stripeCustomerId || '').trim();

  if (storedCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(storedCustomerId);
      if (existingCustomer && !(existingCustomer as Stripe.DeletedCustomer).deleted) {
        return storedCustomerId;
      }
    } catch {
      // Fall through to email-based lookup if the stored customer no longer exists.
    }
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return '';
  }

  let startingAfter = '';

  do {
    const page = await stripe.customers.list({
      email: normalizedEmail,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    const exactMatch = page.data.find((customer) => {
      if ('deleted' in customer) return false;
      return String(customer.metadata?.userUid || '').trim() === normalizedUserUid;
    });
    if (exactMatch?.id) {
      return exactMatch.id;
    }

    const fallbackMatch = page.data.find((customer) => !('deleted' in customer));
    if (fallbackMatch?.id) {
      return fallbackMatch.id;
    }

    startingAfter = page.has_more && page.data.length > 0
      ? String(page.data[page.data.length - 1].id || '')
      : '';
  } while (startingAfter);

  return '';
}

async function finalizeListingPaymentFromCheckoutSession(
  session: Stripe.Checkout.Session,
  source: 'webhook' | 'confirm'
): Promise<{ paid: boolean; listingId: string | null; planId: string | null }> {
  const listingId = String(session.metadata?.listingId || '');
  const planId = String(session.metadata?.planId || '');
  const userUid = String(session.metadata?.userUid || '');
  const paymentComplete = session.payment_status === 'paid' || session.status === 'complete';

  if (!listingId || !planId || !userUid || !paymentComplete) {
    return { paid: false, listingId: listingId || null, planId: planId || null };
  }

  const knownPlan = getListingCheckoutPlan(planId);
  const amountPaidUsd = typeof session.amount_total === 'number' ? session.amount_total / 100 : knownPlan?.amountUsd || 0;

  await db.collection('listings').doc(listingId).set(
    {
      paymentStatus: 'paid',
      subscriptionPlanId: planId,
      subscriptionAmount: amountPaidUsd,
      listingCap: knownPlan?.listingCap || null,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db.collection('invoices').doc(session.id).set(
    {
      userUid,
      listingId,
      stripeInvoiceId: session.invoice || null,
      stripeCheckoutSessionId: session.id,
      amount: amountPaidUsd,
      currency: session.currency || 'usd',
      status: paymentComplete ? 'paid' : 'pending',
      items: [`${knownPlan?.name || planId} monthly listing plan`],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: paymentComplete ? admin.firestore.FieldValue.serverTimestamp() : null,
      source,
    },
    { merge: true }
  );

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || null;

  if (subscriptionId) {
    const currentPeriodEnd =
      typeof session.expires_at === 'number'
        ? admin.firestore.Timestamp.fromMillis(session.expires_at * 1000)
        : null;

    await db.collection('subscriptions').doc(subscriptionId).set(
      {
        userUid,
        listingId,
        planId,
        stripeSubscriptionId: subscriptionId,
        status: paymentComplete ? 'active' : 'pending',
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await db.collection('billingAuditLogs').add({
    action: 'CHECKOUT_SESSION_PAID',
    userUid,
    listingId,
    details: `Checkout ${session.id} marked listing ${listingId} paid via ${source}.`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { paid: true, listingId, planId };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // 1. Security Headers (WAF-like protection at app level)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/", "https://*.googleapis.com", "https://*.firebaseio.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://picsum.photos", "https://*.stripe.com", "https://*.firebasestorage.googleapis.com", "https://*.googleusercontent.com"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.stripe.com", "https://api.stripe.com", "https://*.run.app"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://challenges.cloudflare.com", "https://www.google.com/recaptcha/", "https://*.stripe.com", "https://*.run.app", "https://ai.studio"],
        frameAncestors: ["'self'", "https://*.run.app", "https://ai.studio"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: false, // Allow iframe rendering for AI Studio preview
  }));

  // 1b. Domain Migration — 301 redirect from legacy domain to canonical domain
  const CANONICAL_HOST = String(process.env.CANONICAL_HOST || '').trim();
  if (CANONICAL_HOST) {
    app.use((req, res, next) => {
      const host = (req.hostname || req.headers.host || '').replace(/:\d+$/, '').toLowerCase();
      if (host && host !== CANONICAL_HOST && host !== 'localhost' && host !== '127.0.0.1') {
        const target = `https://${CANONICAL_HOST}${req.originalUrl}`;
        return res.redirect(301, target);
      }
      next();
    });
  }

  // Trust first proxy (Cloud Run / Firebase Hosting) so express-rate-limit sees real client IPs
  app.set('trust proxy', 1);

  // 2. Rate Limiting (DDoS protection)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api/', limiter);

  // Stricter rate limits for sensitive endpoints
  const checkoutLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many checkout requests. Please try again in a minute.' },
  });
  app.use('/api/billing/create-checkout-session', checkoutLimiter);
  app.use('/api/billing/create-account-checkout-session', checkoutLimiter);

  const accountDeletionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { error: 'Too many account deletion requests. Please try again later.' },
  });
  app.use('/api/user/delete', accountDeletionLimiter);

  const portalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many billing portal requests. Please try again in a minute.' },
  });
  app.use('/api/billing/create-portal-session', portalLimiter);

  // 3. CORS
  const ALLOWED_ORIGINS: string[] = [
    'https://timberequip.com',
    'https://www.timberequip.com',
    'https://forestryequipmentsales.com',
    'https://mobile-app-equipment-sales.web.app',
    'https://mobile-app-equipment-sales.firebaseapp.com',
    'https://timberequip-staging.web.app',
  ];
  if (process.env.NODE_ENV !== 'production') {
    ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5173');
  }
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }));

  // 4. Stripe Webhook (Raw body needed for signature verification)
  app.post(['/api/billing/webhook', '/api/webhooks/stripe'], express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (!sig || !webhookSecret) throw new Error('Missing signature or secret');
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    // Idempotency check: atomic check-and-set via transaction to prevent race conditions
    const eventRef = db.collection('webhook_events').doc(event.id);
    let isDuplicate = false;
    try {
      await db.runTransaction(async (tx) => {
        const eventDoc = await tx.get(eventRef);
        if (eventDoc.exists) {
          isDuplicate = true;
          return;
        }
        tx.set(eventRef, {
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          type: event.type,
        });
      });
    } catch (txErr) {
      console.error('Webhook dedup transaction failed:', txErr);
      return res.status(500).json({ error: 'Internal error' });
    }
    if (isDuplicate) {
      console.log(`Webhook event ${event.id} already processed.`);
      return res.json({ received: true, duplicate: true });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'invoice.paid': {
          const invoice = event.data.object as any;
          const userUid = invoice.metadata?.userUid || invoice.subscription_details?.metadata?.userUid || invoice.subscription?.metadata?.userUid;
          
          if (userUid) {
            await db.collection('invoices').doc(invoice.id).set({
              userUid,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'paid',
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              items: invoice.lines.data.map(line => line.description),
            }, { merge: true });

            await db.collection('billingAuditLogs').add({
              action: 'INVOICE_PAID',
              userUid,
              invoiceId: invoice.id,
              details: `Invoice ${invoice.id} paid successfully via webhook.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const userUid = invoice.metadata?.userUid || invoice.subscription_details?.metadata?.userUid || invoice.subscription?.metadata?.userUid;
          if (userUid) {
            await db.collection('invoices').doc(invoice.id).set({
              userUid,
              stripeInvoiceId: invoice.id,
              status: 'failed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            await db.collection('billingAuditLogs').add({
              action: 'PAYMENT_FAILED',
              userUid,
              invoiceId: invoice.id,
              details: `Payment failed for invoice ${invoice.id}.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userUid = subscription.metadata.userUid;
          if (userUid) {
            await db.collection('subscriptions').doc(subscription.id).set({
              userUid,
              stripeSubscriptionId: subscription.id,
              planId: (subscription.items.data[0].plan as any).id,
              status: subscription.status,
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              ...((subscription as any).created ? { createdAt: admin.firestore.Timestamp.fromMillis((subscription as any).created * 1000) } : {}),
              ...((subscription as any).start_date ? { startDate: admin.firestore.Timestamp.fromMillis((subscription as any).start_date * 1000) } : {}),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            // If subscription becomes past_due or unpaid, suppress listing visibility
            const inactiveStatuses = ['past_due', 'unpaid', 'incomplete_expired'];
            if (inactiveStatuses.includes(subscription.status)) {
              const listingsSnap = await db.collection('listings')
                .where('sellerUid', '==', userUid)
                .get();
              const batch = db.batch();
              listingsSnap.docs.forEach((doc) => {
                const data = doc.data();
                if (!['sold', 'archived'].includes(String(data.status || '').toLowerCase())) {
                  batch.update(doc.ref, {
                    paymentStatus: 'pending',
                    status: 'pending',
                    lastLifecycleAction: 'billing_visibility_suppressed',
                    lastLifecycleActorUid: 'system',
                    lastLifecycleActorRole: 'system',
                    lastLifecycleReason: `Subscription ${subscription.status} — listings hidden until payment resolved.`,
                    lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  });
                }
              });
              if (listingsSnap.docs.length > 0) await batch.commit();

              await db.collection('billingAuditLogs').add({
                action: 'SUBSCRIPTION_BILLING_LAPSE',
                userUid,
                subscriptionId: subscription.id,
                details: `Subscription ${subscription.id} status changed to ${subscription.status}. Listings hidden.`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userUid = subscription.metadata.userUid;
          if (userUid) {
            await db.collection('subscriptions').doc(subscription.id).update({
              status: 'canceled',
              cancelAtPeriodEnd: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Hide all listings for this user and downgrade access
            const listingsSnap = await db.collection('listings')
              .where('sellerUid', '==', userUid)
              .get();
            const batch = db.batch();
            listingsSnap.docs.forEach((doc) => {
              const data = doc.data();
              if (!['sold', 'archived'].includes(String(data.status || '').toLowerCase())) {
                batch.update(doc.ref, {
                  paymentStatus: 'pending',
                  status: 'pending',
                  lastLifecycleAction: 'billing_visibility_suppressed',
                  lastLifecycleActorUid: 'system',
                  lastLifecycleActorRole: 'system',
                  lastLifecycleReason: 'Subscription deleted — listings hidden.',
                  lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }
            });
            if (listingsSnap.docs.length > 0) await batch.commit();

            // Downgrade user role to member
            const userDoc = await db.collection('users').doc(userUid).get();
            if (userDoc.exists) {
              await db.collection('users').doc(userUid).update({
                role: 'member',
                accountAccessSource: 'free_member',
                activeSubscriptionPlanId: null,
                subscriptionStatus: 'canceled',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }

            await db.collection('billingAuditLogs').add({
              action: 'SUBSCRIPTION_DELETED',
              userUid,
              subscriptionId: subscription.id,
              details: `Subscription ${subscription.id} deleted. Listings hidden and access downgraded.`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          break;
        }
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object as Stripe.Checkout.Session;
          await finalizeListingPaymentFromCheckoutSession(session, 'webhook');
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as any;
          const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice?.id;
          if (invoiceId && stripe) {
            try {
              const invoice = await stripe.invoices.retrieve(invoiceId);
              const invoiceSub = (invoice as any).subscription;
              const subId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub?.id;
              if (subId) {
                // Cancel the subscription immediately since a refund was issued
                const canceledSub = await stripe.subscriptions.cancel(subId);
                const refundUserUid = canceledSub.metadata?.userUid;

                // Update subscription record
                await db.collection('subscriptions').doc(subId).set({
                  status: 'canceled',
                  cancelAtPeriodEnd: true,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

                if (refundUserUid) {
                  // Hide all listings
                  const listingsSnap = await db.collection('listings')
                    .where('sellerUid', '==', refundUserUid)
                    .get();
                  const batch = db.batch();
                  listingsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    if (!['sold', 'archived'].includes(String(data.status || '').toLowerCase())) {
                      batch.update(doc.ref, {
                        paymentStatus: 'pending',
                        status: 'pending',
                        lastLifecycleAction: 'billing_visibility_suppressed',
                        lastLifecycleActorUid: 'system',
                        lastLifecycleActorRole: 'system',
                        lastLifecycleReason: 'Charge refunded — subscription canceled and listings hidden.',
                        lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                      });
                    }
                  });
                  if (listingsSnap.docs.length > 0) await batch.commit();

                  // Downgrade user role
                  const userDoc = await db.collection('users').doc(refundUserUid).get();
                  if (userDoc.exists) {
                    await db.collection('users').doc(refundUserUid).update({
                      role: 'member',
                      accountAccessSource: 'free_member',
                      activeSubscriptionPlanId: null,
                      subscriptionStatus: 'canceled',
                      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                  }

                  await db.collection('billingAuditLogs').add({
                    action: 'CHARGE_REFUNDED_SUBSCRIPTION_CANCELED',
                    userUid: refundUserUid,
                    subscriptionId: subId,
                    chargeId: charge.id,
                    details: `Charge ${charge.id} refunded. Subscription ${subId} canceled. Listings hidden and access downgraded.`,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                  });
                }

                console.log(`Charge refund processed: subscription ${subId} canceled, listings hidden.`);
              }
            } catch (refundErr: any) {
              console.error(`Failed to process charge refund enforcement: ${refundErr.message}`);
            }
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (dbErr) {
      console.error('Error updating database from webhook:', dbErr);
      return res.status(500).json({ error: 'Webhook processing failed.' });
    }

    res.json({ received: true });
  });

  // 5. Standard Middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  if (sharedDealerApiProxy) {
    const proxiedApiPattern = isLocalBillingStubEnabled()
      ? /^\/api\/(admin\/dealer-feeds(?:\/.*)?|admin\/billing\/bootstrap|admin\/listings\/review-summaries|dealer(?:\/.*)?|public\/dealers\/.*|public\/dealer-embed\.js|account\/listings(?:\/.*)?|listings\/[^/]+\/lifecycle|admin\/listings\/[^/]+\/lifecycle-audit)$/i
      : /^\/api\/(admin\/dealer-feeds(?:\/.*)?|admin\/billing\/bootstrap|admin\/listings\/review-summaries|dealer(?:\/.*)?|public\/dealers\/.*|public\/dealer-embed\.js|account\/listings(?:\/.*)?|listings\/[^/]+\/lifecycle|admin\/listings\/[^/]+\/lifecycle-audit|billing\/(?:create-checkout-session|create-account-checkout-session|create-portal-session|cancel-subscription|refresh-account-access|checkout-session\/[^/]+))$/i;

    app.all(proxiedApiPattern, async (req, res, next) => {
      try {
        await sharedDealerApiProxy?.(req, res);
      } catch (error) {
        next(error);
      }
    });
  }

  // Redirect /manufacturers and /states index routes to SPA equivalents
  app.get('/manufacturers', (_req, res) => res.redirect(302, '/dealers'));
  app.get('/states', (_req, res) => res.redirect(302, '/search'));
  app.get('/logging-equipment-for-sale', (_req, res) => res.redirect(301, '/forestry-equipment-for-sale'));

  if (sharedPublicPagesProxy) {
    // SSR only for deep parametric SEO routes (crawlers) + sitemap — NOT user-facing index pages
    app.get(
      [
        '/sitemap.xml',
        '/manufacturers/:manufacturerSlug',
        '/manufacturers/:manufacturerSlug/:categorySaleSlug',
        '/states/:stateSlug/forestry-equipment-for-sale',
        '/states/:stateSlug/:categorySaleSlug',
        '/dealers/:id',
        '/dealers/:id/inventory',
        '/dealers/:id/:categorySlug',
      ],
      async (req, res, next) => {
        try {
          await sharedPublicPagesProxy?.(req, res, next);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // 6. CSRF Protection
  // Double-submit token strategy that preserves the existing frontend contract
  // without depending on the archived `csurf` package.
  app.use('/api', (req, res, next) => {
    csrfProtection(req, res, next);
  });

  // Provide CSRF token to frontend
  app.get('/api/csrf-token', (req, res) => {
    const csrfToken = ensureCsrfCookieToken(req, res);
    res.json({ csrfToken });
  });

  // 7. API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/billing/create-checkout-session', async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const plan = getListingCheckoutPlan(req.body?.planId);
        const listingId = String(req.body?.listingId || '').trim();

        if (!plan) {
          return res.status(400).json({ error: 'Invalid listing plan.' });
        }
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const sessionId = buildLocalBillingStubSessionId('listing', plan.id, listingId, decodedToken.uid);
        const baseUrl = getRequestBaseUrl(req);
        return res.json({
          sessionId,
          url: `${baseUrl}/sell?checkout=success&session_id=${encodeURIComponent(sessionId)}&listingId=${encodeURIComponent(listingId)}&localBillingStub=1`,
          localBillingStub: true,
        });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const plan = getListingCheckoutPlan(req.body?.planId);
      const listingId = String(req.body?.listingId || '').trim();

      if (!plan) {
        return res.status(400).json({ error: 'Invalid listing plan.' });
      }
      if (!listingId) {
        return res.status(400).json({ error: 'Listing id is required.' });
      }

      const listingRef = db.collection('listings').doc(listingId);
      const listingSnap = await listingRef.get();
      if (!listingSnap.exists) {
        return res.status(404).json({ error: 'Listing not found.' });
      }

      const listing = listingSnap.data() || {};
      const listingOwnerUid = String(listing.sellerUid || listing.sellerId || '');
      if (!listingOwnerUid || listingOwnerUid !== uid) {
        return res.status(403).json({ error: 'You can only pay for your own listing.' });
      }

      if (String(listing.paymentStatus || '') === 'paid') {
        return res.status(409).json({ error: 'Listing is already paid.' });
      }

      const paidListingsSnap = await db
        .collection('listings')
        .where('sellerUid', '==', uid)
        .where('paymentStatus', '==', 'paid')
        .get();

      const activePaidListingsCount = paidListingsSnap.docs.filter((doc) => {
        if (doc.id === listingId) return false;
        const data = doc.data() as Record<string, unknown>;
        return String(data.status || 'active').toLowerCase() !== 'sold';
      }).length;

      if (activePaidListingsCount >= plan.listingCap) {
        return res.status(409).json({
          error: `Your ${plan.name} includes up to ${plan.listingCap} active ${plan.listingCap === 1 ? 'listing' : 'listings'}. Upgrade or mark one as sold before posting another.`,
        });
      }

      const baseUrl = getRequestBaseUrl(req);
      const priceId = await resolveStripePriceIdForPlan(plan);
      const customerId = await getOrCreateStripeCustomer(uid, decodedToken.email, decodedToken.name);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        success_url: `${baseUrl}/sell?checkout=success&session_id={CHECKOUT_SESSION_ID}&listingId=${encodeURIComponent(listingId)}`,
        cancel_url: `${baseUrl}/sell?checkout=canceled&listingId=${encodeURIComponent(listingId)}`,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: listingId,
        allow_promotion_codes: true,
        metadata: {
          userUid: uid,
          listingId,
          planId: plan.id,
          listingCap: String(plan.listingCap),
        },
        subscription_data: {
          metadata: {
            userUid: uid,
            listingId,
            planId: plan.id,
            listingCap: String(plan.listingCap),
          },
        },
      });

      if (!session.url) {
        return res.status(500).json({ error: 'Stripe checkout URL was not returned.' });
      }

      return res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Failed to create Stripe checkout session:', error);
      return res.status(500).json({ error: 'Failed to create checkout session.' });
    }
  });

  app.get('/api/billing/checkout-session/:sessionId', async (req, res) => {
    const stubSession = parseLocalBillingStubSessionId(String(req.params.sessionId || ''));
    if (!stripe && isLocalBillingStubEnabled() && stubSession) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        if (stubSession.uid && stubSession.uid !== decodedToken.uid) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        return res.json({
          sessionId: req.params.sessionId,
          status: 'complete',
          paid: true,
          listingId: stubSession.listingId,
          planId: stubSession.planId,
          scope: stubSession.scope,
          localBillingStub: true,
        });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const sessionId = String(req.params.sessionId || '').trim();
      if (!sessionId) {
        return res.status(400).json({ error: 'Session id is required.' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (String(session.metadata?.userUid || '') !== uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const finalized = await finalizeListingPaymentFromCheckoutSession(session, 'confirm');

      return res.json({
        sessionId: session.id,
        status: session.status,
        paid: finalized.paid,
        listingId: finalized.listingId,
        planId: finalized.planId,
      });
    } catch (error: any) {
      console.error('Failed to confirm Stripe checkout session:', error);
      return res.status(500).json({ error: 'Failed to confirm checkout session.' });
    }
  });

  app.post('/api/billing/create-portal-session', async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        await auth.verifyIdToken(idToken);
        const returnPathRaw = String(req.body?.returnPath || '/profile?tab=Account%20Settings').trim();
        const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/profile?tab=Account%20Settings';
        const baseUrl = getRequestBaseUrl(req);
        const separator = returnPath.includes('?') ? '&' : '?';
        return res.json({
          url: `${baseUrl}${returnPath}${separator}billingPortal=local-stub`,
          localBillingStub: true,
        });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = String(decodedToken.uid || '').trim();
      const email = String(decodedToken.email || '').trim().toLowerCase();
      const returnPathRaw = String(req.body?.returnPath || '/profile?tab=Account%20Settings').trim();
      const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/profile?tab=Account%20Settings';
      const baseUrl = getRequestBaseUrl(req);
      const separator = returnPath.includes('?') ? '&' : '?';

      const customerId = await findExistingStripeCustomerId(uid, email);
      if (!customerId) {
        return res.status(409).json({
          error: 'No active billing profile was found for this account yet. Choose an ad program before opening billing management.',
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}${returnPath}${separator}billingPortal=return`,
      });

      if (!session.url) {
        return res.status(500).json({ error: 'Stripe billing portal URL was not returned.' });
      }

      return res.json({
        url: session.url,
        stripeCustomerId: customerId,
      });
    } catch (error: any) {
      console.error('Failed to create billing portal session:', error);
      return res.status(500).json({ error: 'Failed to create billing portal session.' });
    }
  });

  app.post('/api/billing/cancel-subscription', async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        await auth.verifyIdToken(idToken);
        return res.json({
          success: true,
          message: 'Local billing stub: subscription cancellation simulated.',
          localBillingStub: true,
        });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
    }

    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = String(decodedToken.uid || '').trim();

      const userDoc = await db.collection('users').doc(uid).get();
      const subscriptionId = userDoc.data()?.currentSubscriptionId;
      if (!subscriptionId) {
        return res.status(404).json({ error: 'No active subscription found for this account.' });
      }

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return res.json({ success: true, message: 'Subscription will be canceled at the end of the current billing period.' });
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      return res.status(500).json({ error: 'Failed to cancel subscription.' });
    }
  });

  app.post('/api/billing/create-account-checkout-session', async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const plan = getListingCheckoutPlan(req.body?.planId);
        if (!plan) {
          return res.status(400).json({ error: 'Invalid seller plan.' });
        }

        const returnPathRaw = String(req.body?.returnPath || '/sell').trim();
        const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/sell';
        const baseUrl = getRequestBaseUrl(req);
        const separator = returnPath.includes('?') ? '&' : '?';
        const sessionId = buildLocalBillingStubSessionId('account', plan.id, null, decodedToken.uid);

        return res.json({
          sessionId,
          url: `${baseUrl}${returnPath}${separator}accountCheckout=success&session_id=${encodeURIComponent(sessionId)}&localBillingStub=1`,
          localBillingStub: true,
        });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(503).json({
      error: 'Account checkout should be served by the shared billing proxy in local development. If Stripe is unavailable locally, enable LOCAL_BILLING_STUB=true.',
    });
  });

  app.post('/api/billing/refresh-account-access', async (req, res) => {
    if (!stripe && isLocalBillingStubEnabled()) {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return res.json(buildLocalBillingStubSummary(decodedToken));
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(503).json({
      error: 'Account access refresh should be served by the shared billing proxy in local development. If Stripe is unavailable locally, enable LOCAL_BILLING_STUB=true.',
    });
  });

  app.get('/api/marketplace-stats', async (req, res) => {
    try {
      const payload = await getMarketplaceStats();
      res.set('Cache-Control', 'public, max-age=600');
      res.json(payload);
    } catch (error: any) {
      console.error('Failed to compute marketplace stats:', error);
      res.status(500).json({ error: 'Failed to load marketplace stats.' });
    }
  });

  app.get('/api/public/sellers/:identity', async (req, res) => {
    const requestedIdentity = normalizeNonEmptyString(req.params.identity);
    if (!requestedIdentity) {
      return res.status(400).json({ error: 'Seller identifier is required.' });
    }

    try {
      let storefrontSnapshot = await db.collection('storefronts').doc(requestedIdentity).get();
      if (!storefrontSnapshot.exists) {
        const storefrontSlugSnapshot = await db
          .collection('storefronts')
          .where('storefrontSlug', '==', requestedIdentity)
          .limit(1)
          .get();
        if (!storefrontSlugSnapshot.empty) {
          storefrontSnapshot = storefrontSlugSnapshot.docs[0];
        }
      }

      if (storefrontSnapshot.exists) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.json({ seller: serializeSellerPayloadFromStorefront(storefrontSnapshot.id, storefrontSnapshot.data() || {}) });
      }

      let userSnapshot = await db.collection('users').doc(requestedIdentity).get();
      if (!userSnapshot.exists) {
        const userSlugSnapshot = await db
          .collection('users')
          .where('storefrontSlug', '==', requestedIdentity)
          .limit(1)
          .get();
        if (!userSlugSnapshot.empty) {
          userSnapshot = userSlugSnapshot.docs[0];
        }
      }

      if (userSnapshot.exists) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.json({ seller: serializeSellerPayloadFromUser(userSnapshot.id, userSnapshot.data() || {}) });
      }

      return res.json({ seller: null });
    } catch (error: any) {
      console.error('Failed to resolve public seller:', error);
      return res.status(500).json({ error: 'Failed to load seller.' });
    }
  });

  app.get('/api/public/dealers', async (_req, res) => {
    try {
      const usersSnapshot = await db.collection('users').where('storefrontEnabled', '==', true).get();
      type PublicDealerDirectoryEntry = ReturnType<typeof serializeSellerPayloadFromUser> & { verified: boolean };
      const dealers = usersSnapshot.docs
        .map((snapshot) => {
          const data = snapshot.data() || {};
          if (!hasActiveDealerDirectorySubscription(data)) {
            return null;
          }

          return {
            ...serializeSellerPayloadFromUser(snapshot.id, data),
            verified: Boolean(data.storefrontEnabled),
          };
        })
        .filter((dealer): dealer is PublicDealerDirectoryEntry => Boolean(dealer))
        .sort((left, right) => {
          const leftName = normalizeNonEmptyString(left.storefrontName || left.name).toLowerCase();
          const rightName = normalizeNonEmptyString(right.storefrontName || right.name).toLowerCase();
          return leftName.localeCompare(rightName) || String(left.id || '').localeCompare(String(right.id || ''));
        });

      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ dealers });
    } catch (error: any) {
      console.error('Failed to load public dealer directory:', error);
      return res.status(500).json({ error: 'Failed to load dealers.' });
    }
  });

  app.get('/api/public/news', async (_req, res) => {
    try {
      const posts = await getPublicNewsFeedPayload();
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({
        posts,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to load public news feed:', error);
      return res.status(500).json({ error: 'Failed to load equipment news.' });
    }
  });

  app.get('/api/public/news/:id', async (req, res) => {
    try {
      const post = await getPublicNewsPostPayload(req.params.id);
      res.set('Cache-Control', 'public, max-age=300');
      return res.json({ post });
    } catch (error: any) {
      console.error('Failed to load public news article:', error);
      return res.status(500).json({ error: 'Failed to load the equipment news article.' });
    }
  });

  const recaptchaLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many reCAPTCHA requests. Please try again in a minute.' },
  });

  app.post('/api/recaptcha-assess', recaptchaLimiter, express.json(), async (req, res) => {
    const { token, action } = req.body || {};
    if (!token || !action) return res.status(400).json({ error: 'token and action required' });

    const apiKey = process.env.RECAPTCHA_API_KEY;
    if (!apiKey) {
      // Dev mode without key: pass everything through
      return res.json({ pass: true, score: null });
    }

    try {
      const response = await fetch(
        `https://recaptchaenterprise.googleapis.com/v1/projects/mobile-app-equipment-sales/assessments?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: { token, siteKey: process.env.RECAPTCHA_SITE_KEY || '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0', expectedAction: action } }),
        }
      );
      if (!response.ok) {
        console.error('reCAPTCHA API error:', response.status);
        return res.json({ pass: false, score: null });
      }
      const data: any = await response.json();
      const valid = data?.tokenProperties?.valid === true;
      const score: number | null = data?.riskAnalysis?.score ?? null;
      const pass = valid && (score === null || score >= 0.5);
      return res.json({ pass, score });
    } catch (err) {
      console.error('reCAPTCHA assessment error:', err);
      return res.json({ pass: false, score: null });
    }
  });

  // Automated Data Deletion Backend
  app.post('/api/user/delete', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // 1. Delete user data across collections
      const collections = ['listings', 'inquiries', 'financingRequests', 'invoices', 'subscriptions', 'consentLogs'];
      
      for (const coll of collections) {
        const snapshot = await db.collection(coll).where('userUid', '==', uid).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Special case for listings where field is 'sellerUid'
      const listingsSnapshot = await db.collection('listings').where('sellerUid', '==', uid).get();
      const listingsBatch = db.batch();
      listingsSnapshot.docs.forEach(doc => listingsBatch.delete(doc.ref));
      await listingsBatch.commit();

      // 2. Delete User Profile
      await db.collection('users').doc(uid).delete();

      // 3. Delete Firebase Auth User
      await auth.deleteUser(uid);

      // 4. Log the action
      await db.collection('auditLogs').add({
        action: 'ACCOUNT_DELETED_BY_USER',
        targetId: uid,
        targetType: 'user',
        details: `User ${uid} deleted their account and all associated data.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  // Secure File Upload Endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      await auth.verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      // 1. Virus Scanning
      const isClean = await scanFileForViruses(req.file.buffer);
      if (!isClean) {
        return res.status(400).json({ error: 'File check failed. Upload rejected.' });
      }

      // 2. Process the file (e.g., upload to Firebase Storage or process locally)
      // For this demo, we'll just return success and file info
      console.log(`File ${req.file.originalname} uploaded successfully and passed security checks.`);
      
      res.json({
        success: true,
        message: 'File uploaded and scanned successfully.',
        file: {
          name: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        }
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Internal server error during upload.' });
    }
  });

  app.post('/api/admin/users/create-managed-account', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const actorUid = decodedToken.uid;
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(actorUid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      const actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || ['super_admin', 'admin', 'developer'].includes(actorRole);
      const actorIsDealer = ['dealer', 'dealer_manager', 'pro_dealer'].includes(actorRole);

      if (!actorCanAdminister && !actorIsDealer) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const displayName = String(req.body?.displayName || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const role = normalizeRole(req.body?.role);
      const company = String(req.body?.company || '').trim();
      const phoneNumber = String(req.body?.phoneNumber || '').trim();
      const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
      const parentRole = actorCanAdminister && actorRole === 'member' ? 'super_admin' : actorRole;

      if (!displayName || !email) {
        return res.status(400).json({ error: 'Display name and email are required.' });
      }

      if (!canCreateManagedRole(parentRole, role)) {
        return res.status(403).json({ error: 'You do not have permission to create this account role.' });
      }

      if (actorIsDealer) {
        const seatContext = await getManagedAccountSeatContext(ownerUid);
        if (seatContext.seatLimit < 1) {
          return res.status(403).json({
            error: 'An active Dealer or Fleet Dealer subscription is required before adding managed accounts.',
          });
        }
        if (seatContext.seatCount >= seatContext.seatLimit) {
          return res.status(409).json({
            error: `Your current subscription includes up to ${seatContext.seatLimit} managed accounts. Remove one before adding another.`,
          });
        }
      }

      const existingUserByEmail = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingUserByEmail.empty) {
        return res.status(409).json({ error: 'An account with that email already exists.' });
      }

      const newUserRef = db.collection('users').doc();
      await newUserRef.set({
        uid: newUserRef.id,
        email,
        displayName,
        role,
        phoneNumber,
        company: company || String(actorDoc.data()?.company || '').trim(),
        parentAccountUid: ownerUid,
        accountStatus: 'pending',
        favorites: [],
        emailVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdByUid: actorUid,
        managedByRole: parentRole,
      });

      return res.status(201).json({
        id: newUserRef.id,
        seatLimit: actorIsDealer ? DEALER_MANAGED_ACCOUNT_LIMIT : null,
      });
    } catch (error: any) {
      console.error('Managed account creation failed:', error);
      return res.status(500).json({ error: 'Unable to create managed account.' });
    }
  });

  app.post('/api/admin/users/:userId/verify', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(decodedToken.uid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      if (!isPrivilegedAdminEmail(actorEmail) && !['super_admin', 'admin'].includes(actorRole)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const targetUid = String(req.params.userId || '').trim();
      if (!targetUid) return res.status(400).json({ error: 'Missing userId.' });

      await db.collection('users').doc(targetUid).update({ manuallyVerified: true });

      const listingsSnap = await db.collection('listings').where('sellerUid', '==', targetUid).get();
      const batch = db.batch();
      listingsSnap.docs.forEach((doc) => batch.update(doc.ref, { sellerVerified: true }));
      if (!listingsSnap.empty) await batch.commit();

      return res.json({ ok: true, listingsUpdated: listingsSnap.size });
    } catch (error: any) {
      console.error('Verify user failed:', error);
      return res.status(500).json({ error: 'Unable to verify user.' });
    }
  });

  app.post('/api/admin/users/:userId/unverify', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(decodedToken.uid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      if (!isPrivilegedAdminEmail(actorEmail) && !['super_admin', 'admin'].includes(actorRole)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const targetUid = String(req.params.userId || '').trim();
      if (!targetUid) return res.status(400).json({ error: 'Missing userId.' });

      await db.collection('users').doc(targetUid).update({ manuallyVerified: false });

      const targetDoc = await db.collection('users').doc(targetUid).get();
      const targetRole = normalizeRole(targetDoc.data()?.role);
      const autoVerifiedRoles = ['super_admin', 'admin', 'developer', 'dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff'];
      if (!autoVerifiedRoles.includes(targetRole)) {
        const listingsSnap = await db.collection('listings').where('sellerUid', '==', targetUid).get();
        const batch = db.batch();
        listingsSnap.docs.forEach((doc) => batch.update(doc.ref, { sellerVerified: false }));
        if (!listingsSnap.empty) await batch.commit();
      }

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Unverify user failed:', error);
      return res.status(500).json({ error: 'Unable to unverify user.' });
    }
  });

  app.post('/api/admin/dealer-feeds/ingest', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const actorUid = decodedToken.uid;
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const actorDoc = await db.collection('users').doc(actorUid).get();
      const actorRole = normalizeRole(actorDoc.data()?.role);
      const actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || ['super_admin', 'admin', 'developer'].includes(actorRole);
      const actorIsDealer = ['dealer', 'dealer_manager', 'pro_dealer'].includes(actorRole);

      if (!actorCanAdminister && !actorIsDealer) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const sourceName = normalizeNonEmptyString(req.body?.sourceName, 'dealer_feed');
      const explicitDealerId = normalizeNonEmptyString(req.body?.dealerId);
      const sellerUid = explicitDealerId || String(actorDoc.data()?.parentAccountUid || actorUid).trim();
      const dryRun = Boolean(req.body?.dryRun);
      const items = Array.isArray(req.body?.items) ? (req.body.items as DealerFeedItem[]) : [];

      if (!sellerUid) {
        return res.status(400).json({ error: 'dealerId could not be resolved.' });
      }
      if (items.length === 0) {
        return res.status(400).json({ error: 'items[] is required.' });
      }
      if (items.length > 1000) {
        return res.status(400).json({ error: 'Maximum 1000 items per ingest request.' });
      }

      if (actorIsDealer && !actorCanAdminister) {
        const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
        if (explicitDealerId && explicitDealerId !== ownerUid && explicitDealerId !== actorUid) {
          return res.status(403).json({ error: 'Dealers can only ingest to their own account scope.' });
        }
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const errors: Array<{ index: number; reason: string }> = [];

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        try {
          const normalized = normalizeDealerFeedListing(item, sellerUid, sourceName);
          if (!normalized.externalSource.externalId) {
            skipped += 1;
            continue;
          }

          const existing = await db
            .collection('listings')
            .where('sellerUid', '==', sellerUid)
            .where('externalSource.externalId', '==', normalized.externalSource.externalId)
            .limit(1)
            .get();

          if (dryRun) {
            if (existing.empty) created += 1;
            else updated += 1;
            continue;
          }

          if (existing.empty) {
            await db.collection('listings').add({
              ...normalized,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            created += 1;
          } else {
            await existing.docs[0].ref.set(normalized, { merge: true });
            updated += 1;
          }
        } catch (err: any) {
          errors.push({ index, reason: err?.message || 'Unknown ingest error' });
        }
      }

      const logPayload = {
        actorUid,
        actorRole,
        sellerUid,
        sourceName,
        dryRun,
        totalReceived: items.length,
        created,
        updated,
        skipped,
        errorCount: errors.length,
        errors: errors.slice(0, 100),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!dryRun) {
        await db.collection('dealerFeedIngestLogs').add(logPayload);
      }

      return res.json({
        ok: true,
        ...logPayload,
      });
    } catch (error: any) {
      console.error('Dealer feed ingest failed:', error);
      return res.status(500).json({ error: 'Dealer feed ingest failed.' });
    }
  });

  // Admin Operations Bootstrap
  app.get('/api/admin/bootstrap', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      const claimRole = String(decodedToken.role || '').trim().toLowerCase();
      const isAdminByClaim = canAdministrateAccountRole(claimRole);
      if (!isPrivilegedAdminEmail(actorEmail) && !isAdminByClaim) {
        const user = await db.collection('users').doc(decodedToken.uid).get();
        if (!canAdministrateAccountRole(user.data()?.role)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const authUsers: admin.auth.UserRecord[] = [];
      let nextPageToken: string | undefined;
      do {
        const listResult = await auth.listUsers(1000, nextPageToken);
        authUsers.push(...listResult.users);
        nextPageToken = listResult.pageToken;
      } while (nextPageToken);

      const profileRefs = authUsers.map((authUserRecord) => db.collection('users').doc(authUserRecord.uid));
      const profileSnaps = profileRefs.length > 0 ? await db.getAll(...profileRefs) : [];
      const profileMap = new Map(profileSnaps.map((snap) => [snap.id, snap]));

      const users = authUsers.map((authUserRecord) => {
        const snap = profileMap.get(authUserRecord.uid);
        const data = snap?.exists ? (snap.data() || {}) : {};
        const displayName = String(data.displayName || data.name || authUserRecord.displayName || authUserRecord.email || 'Unknown User').trim();
        const email = String(data.email || authUserRecord.email || '').trim().toLowerCase();
        const createdAt = String(data.createdAt || authUserRecord.metadata.creationTime || '');
        const updatedAt = String(data.updatedAt || '');
        const lastLogin = String(authUserRecord.metadata.lastSignInTime || data.lastLogin || updatedAt || createdAt || '');
        const authDisabled = Boolean(authUserRecord.disabled);
        const accountStatus = authDisabled ? 'suspended' : String(data.accountStatus || 'active');

        return {
          id: authUserRecord.uid,
          uid: authUserRecord.uid,
          name: displayName,
          displayName,
          email,
          phone: String(data.phoneNumber || '').trim(),
          phoneNumber: String(data.phoneNumber || '').trim(),
          company: String(data.company || '').trim(),
          role: String(data.role || authUserRecord.customClaims?.role || 'member'),
          status: authDisabled ? 'Suspended' : (accountStatus === 'pending' ? 'Pending' : 'Active'),
          accountStatus,
          authDisabled,
          emailVerified: Boolean(authUserRecord.emailVerified),
          lastLogin,
          lastActive: lastLogin,
          memberSince: createdAt,
          createdAt,
          updatedAt,
          totalListings: Number(data.totalListings || 0),
          totalLeads: Number(data.totalLeads || 0),
          parentAccountUid: String(data.parentAccountUid || '').trim() || undefined,
          manuallyVerified: Boolean(data.manuallyVerified),
        };
      }).sort((left, right) => {
        const leftTime = Date.parse(left.lastLogin || left.memberSince || '') || 0;
        const rightTime = Date.parse(right.lastLogin || right.memberSince || '') || 0;
        return rightTime - leftTime;
      });

      const userLimit = Math.min(Math.max(Number(req.query?.limit) || 200, 1), 1000);
      const userOffset = Math.max(Number(req.query?.offset) || 0, 0);
      const totalUsers = users.length;
      const paginatedUsers = users.slice(userOffset, userOffset + userLimit);

      const inquiryLimit = Math.min(Math.max(Number(req.query?.inquiryLimit) || 500, 1), 2000);
      const callLimit = Math.min(Math.max(Number(req.query?.callLimit) || 500, 1), 2000);

      const [inquiriesSnapshot, callsSnapshot] = await Promise.all([
        db.collection('inquiries').orderBy('createdAt', 'desc').limit(inquiryLimit).get(),
        db.collection('calls').orderBy('createdAt', 'desc').limit(callLimit).get(),
      ]);
      const includeOverview = ['1', 'true', 'yes'].includes(String(req.query?.includeOverview || '').trim().toLowerCase());
      const overview = includeOverview ? await buildAdminOverviewBootstrapPayload() : null;

      res.json({
        users: paginatedUsers,
        pagination: { total: totalUsers, offset: userOffset, limit: userLimit, hasMore: userOffset + userLimit < totalUsers },
        inquiries: inquiriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        calls: callsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        overview,
        partial: false,
        degradedSections: [],
        errors: {},
        firestoreQuotaLimited: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  // Admin Billing Endpoints
  app.get('/api/admin/billing/invoices', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await db.collection('users').doc(decodedToken.uid).get();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !canAdministrateAccountRole(user.data()?.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('invoices').orderBy('createdAt', 'desc').get();
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.get('/api/admin/billing/subscriptions', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await db.collection('users').doc(decodedToken.uid).get();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !canAdministrateAccountRole(user.data()?.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('subscriptions').get();
      const subscriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.get('/api/admin/billing/audit-logs', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await db.collection('users').doc(decodedToken.uid).get();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !canAdministrateAccountRole(user.data()?.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('billingAuditLogs').orderBy('timestamp', 'desc').limit(50).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  // ── Content Studio (Blog Posts) ──────────────────────────────────────────────
  const CONTENT_ROLES = ['super_admin', 'admin', 'developer', 'content_manager', 'editor'];

  app.get('/api/admin/content/blog-posts', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const role = String(userDoc.data()?.role || '').trim().toLowerCase();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !CONTENT_ROLES.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = await db.collection('blogPosts').orderBy('updatedAt', 'desc').get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(posts);
    } catch (error: any) {
      console.error('Failed to fetch blog posts:', error);
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  app.get('/api/admin/content/bootstrap', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const role = String(userDoc.data()?.role || '').trim().toLowerCase();
      const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
      if (!isPrivilegedAdminEmail(actorEmail) && !CONTENT_ROLES.includes(role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const errors: Record<string, string> = {};
      let posts: any[] = [];
      let media: any[] = [];
      let contentBlocks: any[] = [];

      try {
        const postsSnap = await db.collection('blogPosts').orderBy('updatedAt', 'desc').get();
        posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e: any) { console.error('Content bootstrap: posts fetch failed:', e); errors.posts = 'Failed to load posts.'; }

      try {
        const mediaSnap = await db.collection('media').orderBy('uploadedAt', 'desc').get();
        media = mediaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e: any) { console.error('Content bootstrap: media fetch failed:', e); errors.media = 'Failed to load media.'; }

      try {
        const blocksSnap = await db.collection('contentBlocks').get();
        contentBlocks = blocksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e: any) { console.error('Content bootstrap: blocks fetch failed:', e); errors.contentBlocks = 'Failed to load content blocks.'; }

      res.json({
        posts,
        media,
        contentBlocks,
        partial: Object.keys(errors).length > 0,
        degradedSections: Object.keys(errors),
        errors,
        firestoreQuotaLimited: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to fetch content bootstrap:', error);
      res.status(500).json({ error: 'An internal error occurred.' });
    }
  });

  // 8. Vite Middleware / Static Files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Known SPA routes — return 200 for these, 404 for everything else
    const SPA_ROUTES = new Set([
      '/', '/search', '/blog', '/admin', '/compare', '/categories', '/dealers',
      '/login', '/register', '/sell', '/dealer-os', '/financing', '/profile',
      '/about', '/about-us', '/faq', '/our-team', '/about/our-team', '/contact', '/ad-programs', '/subscription-success', '/logistics',
      '/auctions', '/privacy', '/terms', '/cookies', '/dmca', '/bookmarks', '/404',
      '/forestry-equipment-for-sale', '/logging-equipment-for-sale',
    ]);
    const SPA_ROUTE_PREFIXES = [
      '/equipment/', '/listing/', '/seller/', '/blog/', '/categories/',
      '/manufacturers/', '/states/', '/dealers/',
    ];

    app.get('*', (req, res) => {
      const cleanPath = req.path.split('?')[0].replace(/\/+$/, '') || '/';
      const isKnownRoute = SPA_ROUTES.has(cleanPath) || SPA_ROUTE_PREFIXES.some((prefix) => cleanPath.startsWith(prefix));
      if (!isKnownRoute) {
        res.status(404);
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    captureServerException(error, {
      path: req.originalUrl,
      method: req.method,
      tags: { handler: 'express' },
    });

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  captureServerException(error, {
    tags: { process_event: 'startServer' },
  });
  console.error(error);
});

// ─── Daily Inventory Snapshot Job ────────────────────────────────────────────
// Runs once on startup (writing today's snapshot if not already present) and
// then every 24 hours. Writes to inventorySnapshots/{YYYY-MM-DD} in Firestore.

async function takeInventorySnapshot(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const snapshotRef = db.collection('inventorySnapshots').doc(today);
    const existing = await snapshotRef.get();
    if (existing.exists) {
      console.log(`[InventorySnapshot] Snapshot for ${today} already exists — skipping.`);
      return;
    }

    const listingsSnapshot = await db
      .collection('listings')
      .where('approvalStatus', '==', 'approved')
      .get();

    const categoryCounts: Record<string, { activeCount: number; totalCount: number; totalValue: number }> = {};
    let globalActiveCount = 0;
    let globalTotalValue = 0;

    listingsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as Record<string, any>;
      const category: string = (data.category || 'Uncategorized').trim();
      const isSold = (data.status || 'active').toLowerCase() === 'sold';
      const price: number = typeof data.price === 'number' && Number.isFinite(data.price) ? data.price : 0;

      if (!categoryCounts[category]) {
        categoryCounts[category] = { activeCount: 0, totalCount: 0, totalValue: 0 };
      }

      categoryCounts[category].totalCount += 1;
      if (!isSold) {
        categoryCounts[category].activeCount += 1;
        categoryCounts[category].totalValue += price;
        globalActiveCount += 1;
        globalTotalValue += price;
      }
    });

    await snapshotRef.set({
      date: today,
      capturedAt: admin.firestore.FieldValue.serverTimestamp(),
      globalActiveCount,
      globalTotalValue,
      categories: categoryCounts,
    });

    console.log(
      `[InventorySnapshot] Snapshot written for ${today}: ${globalActiveCount} active listings across ${Object.keys(categoryCounts).length} categories.`
    );
  } catch (err) {
    console.error('[InventorySnapshot] Failed to write snapshot:', err);
  }
}

function canRunInventorySnapshotJob(): boolean {
  if (process.env.NODE_ENV === 'production') return true;

  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT);
}

// Run immediately on startup, then every 24 hours when credentials are available.
if (canRunInventorySnapshotJob()) {
  takeInventorySnapshot();
  setInterval(takeInventorySnapshot, 24 * 60 * 60 * 1000);
} else {
  console.log('[InventorySnapshot] Skipping snapshot job in local development because Google Cloud credentials are not configured.');
}
