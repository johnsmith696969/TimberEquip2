import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import crypto from 'crypto';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import multer from 'multer';
import { captureServerException, initializeServerSentry } from './sentry.server.js';
import logger from './src/server/logger.js';
import { setupAuctionSockets } from './src/server/auctionSocketServer.js';
import { registerPublicRoutes } from './src/server/routes/public.js';
import { registerUserRoutes } from './src/server/routes/user.js';
import { registerAdminRoutes } from './src/server/routes/admin.js';
import { registerBillingRoutes } from './src/server/routes/billing.js';
import { registerAuctionRoutes } from './src/server/routes/auctions.js';
import { registerManagedRolesRoutes } from './src/server/routes/managed-roles.js';
import type { Server as SocketIOServer } from 'socket.io';
import type { AuctionTimerManager } from './src/server/auctionTimerManager.js';
// Validation schemas are now imported by individual route modules

dotenv.config();
initializeServerSentry();

// ── Standardized API Response Helpers ─────────────────────────────────────────
// All new endpoints should use these helpers for consistent response envelopes.
// Existing endpoints will be migrated incrementally.
function apiSuccess<T>(res: express.Response, data: T, meta?: Record<string, unknown>) {
  return res.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function apiError(res: express.Response, status: number, code: string, message: string) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function apiPaginated<T>(res: express.Response, data: T[], pagination: { total: number; page: number; limit: number }) {
  return res.json({ success: true, data, meta: { pagination } });
}

// Startup env var validation — warn on missing recommended vars
{
  const recommended = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RECAPTCHA_API_KEY'];
  const missing = recommended.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.warn({ missing }, 'Missing recommended environment variables');
  }
}

process.on('uncaughtException', (error) => {
  captureServerException(error, {
    tags: { process_event: 'uncaughtException' },
  });
  logger.error({ err: error }, 'Uncaught exception');
});

process.on('unhandledRejection', (reason) => {
  captureServerException(reason, {
    tags: { process_event: 'unhandledRejection' },
  });
  logger.error({ err: reason }, 'Unhandled rejection');
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
  logger.warn({ err: error }, 'Unable to load public pages handler for local routes');
}

try {
  const functionsModule = require(path.join(__dirname, 'functions', 'index.js')) as {
    apiProxy?: (req: express.Request, res: express.Response) => Promise<unknown> | unknown;
  };
  sharedDealerApiProxy = typeof functionsModule.apiProxy === 'function' ? functionsModule.apiProxy : null;
} catch (error) {
  logger.warn({ err: error }, 'Unable to load Firebase Functions apiProxy for local dealer feed routes');
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

// ── Email Infrastructure (SendGrid via functions/) ──────────────────────────
let emailTemplates: Record<string, (...args: any[]) => { subject: string; html: string }> | null = null;
let sgMailModule: { setApiKey: (key: string) => void; send: (msg: Record<string, unknown>) => Promise<unknown> } | null = null;
let emailConfigured = false;

try {
  const emailTemplatesModule = require(path.join(__dirname, 'functions', 'email-templates', 'index.js')) as {
    templates: Record<string, (...args: any[]) => { subject: string; html: string }>;
  };
  emailTemplates = emailTemplatesModule.templates || null;
} catch (emailTemplateError) {
  logger.warn({ err: emailTemplateError }, 'Unable to load email templates from functions/email-templates');
}

try {
  sgMailModule = require(path.join(__dirname, 'functions', 'node_modules', '@sendgrid', 'mail')) as typeof sgMailModule;
  const sendgridApiKey = String(process.env.SENDGRID_API_KEY || '').trim();
  if (sgMailModule && sendgridApiKey) {
    sgMailModule.setApiKey(sendgridApiKey);
    emailConfigured = true;
  } else {
    logger.warn('SENDGRID_API_KEY not set; email notifications will be skipped');
  }
} catch (sgError) {
  logger.warn({ err: sgError }, 'Unable to load @sendgrid/mail from functions/node_modules');
}

const EMAIL_FROM_ADDRESS = String(process.env.EMAIL_FROM || 'noreply@forestryequipmentsales.com').trim();
const APP_BASE_URL = String(process.env.APP_URL || 'https://timberequip.com').replace(/\/+$/, '');

async function sendServerEmail({ to, cc, subject, html }: { to: string; cc?: string | string[]; subject: string; html: string }): Promise<void> {
  if (!emailConfigured || !sgMailModule) {
    logger.warn({ to }, 'Skipping email: email not configured');
    return;
  }
  const recipients = (Array.isArray(to) ? to : [to]).map((r: string) => String(r || '').trim()).filter(Boolean);
  if (recipients.length === 0) return;
  const ccList = (Array.isArray(cc) ? cc : (cc ? [cc] : []))
    .map((addr: string) => String(addr || '').trim())
    .filter(Boolean);

  for (const recipient of recipients) {
    const msg: Record<string, unknown> = {
      to: recipient,
      from: EMAIL_FROM_ADDRESS,
      subject,
      html,
    };
    if (ccList.length > 0) msg.cc = ccList;
    await sgMailModule.send(msg);
  }
  logger.info({ subject, recipients }, 'Email sent');
}

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
  imageUrls?: string[];
  imageTitles?: string[];
  videoUrls?: string[];
  stockNumber?: string;
  serialNumber?: string;
  dealerSourceUrl?: string;
  sourceUrl?: string;
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
        logger.warn({ err: firstError }, 'Using cached public news feed because live reads failed');
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
      logger.warn({ err: error }, 'Falling back to cached public news feed after live read failure');
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

function normalizeDealerFeedListing(item: DealerFeedItem, sellerUid: string, sourceName: string, existingListing?: Record<string, any>) {
  const existing = existingListing && typeof existingListing === 'object' ? existingListing : {} as Record<string, any>;
  const externalId = normalizeNonEmptyString(item.externalId);
  const make = normalizeNonEmptyString(item.make || item.manufacturer, 'Unknown');
  const model = normalizeNonEmptyString(item.model, 'Unknown');
  const title = normalizeNonEmptyString(item.title, `${make} ${model}`.trim());
  const category = normalizeNonEmptyString(item.category, 'Uncategorized');

  const year = normalizeFiniteNumber(item.year, normalizeFiniteNumber(existing.year, 0));
  const rawPrice = item.price !== undefined && item.price !== null && item.price !== '' ? Number(item.price) : NaN;
  const existPrice = existing.price !== undefined && existing.price !== null ? Number(existing.price) : NaN;
  const price = Math.max(0, Number.isFinite(rawPrice) ? rawPrice : Number.isFinite(existPrice) ? existPrice : 0);
  const callForPrice = !Number.isFinite(rawPrice) && !Number.isFinite(existPrice);
  const hours = Math.max(0, normalizeFiniteNumber(item.hours, normalizeFiniteNumber(existing.hours, 0)));
  const images = normalizeImageUrls(item.images || item.imageUrls);

  // Preserve existing status/approval/payment on re-sync (match Firebase Functions behavior)
  const existingStatus = normalizeNonEmptyString(existing.status).toLowerCase();
  const existingApprovalStatus = normalizeNonEmptyString(existing.approvalStatus).toLowerCase();
  const existingPaymentStatus = normalizeNonEmptyString(existing.paymentStatus).toLowerCase();

  let status = 'pending';
  if (existingStatus === 'sold') status = 'sold';
  else if (['active', 'pending'].includes(existingStatus)) status = existingStatus;

  let approvalStatus = 'pending';
  if (existingApprovalStatus === 'rejected') approvalStatus = 'rejected';
  else if (['approved', 'pending'].includes(existingApprovalStatus)) approvalStatus = existingApprovalStatus;

  let paymentStatus = 'pending';
  if (existingPaymentStatus === 'failed') paymentStatus = 'failed';
  else if (['paid', 'pending'].includes(existingPaymentStatus)) paymentStatus = existingPaymentStatus;

  const existingExternalSource = existing.externalSource && typeof existing.externalSource === 'object' ? existing.externalSource : {};

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
    callForPrice: callForPrice && !existing.callForPrice ? true : Boolean(existing.callForPrice),
    currency: normalizeNonEmptyString(item.currency, 'USD'),
    hours,
    condition: normalizeNonEmptyString(item.condition, 'Used'),
    description: normalizeNonEmptyString(item.description, `${title} imported from dealer feed.`),
    location: normalizeNonEmptyString(item.location, 'Unknown'),
    images,
    imageTitles: Array.isArray(item.imageTitles) ? item.imageTitles.slice(0, images.length) : [],
    videoUrls: Array.isArray(item.videoUrls) ? item.videoUrls.filter((u: string) => /^https?:\/\//i.test(u)).slice(0, 6) : [],
    stockNumber: normalizeNonEmptyString(item.stockNumber),
    serialNumber: normalizeNonEmptyString(item.serialNumber),
    specs: {
      ...(existing.specs && typeof existing.specs === 'object' ? existing.specs : {}),
      ...(item.specs && typeof item.specs === 'object' ? item.specs : {}),
    },
    featured: Boolean(existing.featured),
    views: Number(existing.views || 0),
    leads: Number(existing.leads || 0),
    status,
    approvalStatus,
    paymentStatus,
    marketValueEstimate: existing.marketValueEstimate ?? null,
    sellerVerified: existing.sellerVerified !== false,
    qualityValidated: existing.qualityValidated !== false,
    dataSource: 'dealer' as const,
    externalSource: {
      ...existingExternalSource,
      sourceName,
      externalId,
      stockNumber: normalizeNonEmptyString(item.stockNumber),
      serialNumber: normalizeNonEmptyString(item.serialNumber),
      dealerSourceUrl: normalizeNonEmptyString(item.dealerSourceUrl),
      importedAt: existingExternalSource.importedAt || admin.firestore.FieldValue.serverTimestamp(),
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
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
  logger.info('Scanning file for viruses');
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate scan time
  
  // Basic check for common malicious patterns (very rudimentary)
  const maliciousPatterns = [Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')];
  for (const pattern of maliciousPatterns) {
    if (buffer.includes(pattern)) {
      logger.warn('Virus detected in uploaded file');
      return false;
    }
  }
  
  return true; // File is clean
}

// --- Validated server config (fail-fast on missing secrets) ---
// Note: server.ts runs on Cloud Run where process.env is the standard
// secret injection mechanism. Cloud Functions use defineSecret() instead.
const serverConfig = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

const stripe = serverConfig.stripeSecretKey
  ? new Stripe(serverConfig.stripeSecretKey, {
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

const UNLIMITED_LISTING_CAP = 99999;

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
    amountUsd: 250,
    listingCap: 50,
    productId: process.env.STRIPE_PRODUCT_DEALER || '',
    priceId: process.env.STRIPE_PRICE_DEALER || '',
  },
  fleet_dealer: {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    amountUsd: 500,
    listingCap: UNLIMITED_LISTING_CAP,
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

function getTrialMonthsForPlan(planId: ListingCheckoutPlanId): number {
  switch (planId) {
    case 'dealer':
      return 6;
    case 'fleet_dealer':
      return 3;
    default:
      return 0;
  }
}

function buildTrialEndForPlan(planId: ListingCheckoutPlanId): number | null {
  const trialMonths = getTrialMonthsForPlan(planId);
  if (!trialMonths) return null;

  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + trialMonths);
  return Math.floor(nextDate.getTime() / 1000);
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

  const expectedUnitAmount = Math.round(Number(plan.amountUsd || 0) * 100);

  if (plan.priceId) {
    try {
      const pinnedPrice = await stripe.prices.retrieve(plan.priceId);
      if (
        pinnedPrice?.active
        && pinnedPrice.type === 'recurring'
        && pinnedPrice.recurring?.interval === 'month'
        && (!expectedUnitAmount || pinnedPrice.unit_amount === expectedUnitAmount)
      ) {
        checkoutPriceCache[plan.id] = plan.priceId;
        return plan.priceId;
      }
    } catch {
      // Fall through to product/default price discovery.
    }
  }

  const product = await stripe.products.retrieve(plan.productId, {
    expand: ['default_price'],
  });

  let priceId = '';
  if (
    typeof product.default_price !== 'string'
    && product.default_price?.id
    && product.default_price.active
    && product.default_price.type === 'recurring'
    && product.default_price.recurring?.interval === 'month'
    && (!expectedUnitAmount || product.default_price.unit_amount === expectedUnitAmount)
  ) {
    priceId = product.default_price.id;
  }

  if (!priceId) {
    const prices = await stripe.prices.list({
      product: plan.productId,
      active: true,
      limit: 20,
    });
    const preferredPrice =
      prices.data.find((p) => p.type === 'recurring' && p.recurring?.interval === 'month' && (!expectedUnitAmount || p.unit_amount === expectedUnitAmount))
      || prices.data.find((p) => p.type === 'recurring' && p.recurring?.interval === 'month')
      || prices.data[0];

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
        scriptSrc: [
          "'self'",
          ...(process.env.NODE_ENV === 'production' ? [] : ["'unsafe-inline'"]),
          "https://challenges.cloudflare.com",
          "https://www.google.com/recaptcha/",
          "https://www.gstatic.com/recaptcha/",
          "https://*.googleapis.com",
          "https://apis.google.com",
          "https://*.firebaseio.com",
          "https://www.recaptcha.net",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.stripe.com", "https://firebasestorage.googleapis.com", "https://*.firebasestorage.googleapis.com", "https://*.firebasestorage.app", "https://*.googleusercontent.com", "https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://timberequip.com", "https://forestryequipmentsales.com"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com", "https://*.firebasestorage.app", "https://*.stripe.com", "https://api.stripe.com", "https://*.run.app", "https://www.recaptcha.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://challenges.cloudflare.com", "https://www.google.com/recaptcha/", "https://apis.google.com", "https://*.firebaseapp.com", "https://*.stripe.com", "https://*.run.app", "https://www.recaptcha.net"],
        frameAncestors: ["'self'", "https://*.run.app"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        reportUri: ['/api/csp-report'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      [
        'camera=()',
        'microphone=()',
        'geolocation=(self)',
        'payment=(self "https://js.stripe.com")',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', '),
    );
    next();
  });

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

  // 2b. CSP Violation Reporting Endpoint
  const cspReportLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: '',
  });
  app.post('/api/csp-report', cspReportLimiter, express.json({ type: ['application/csp-report', 'application/json'] }), (req, res) => {
    const report = req.body?.['csp-report'] || req.body;
    if (report) {
      logger.warn({
        blockedUri: report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        documentUri: report['document-uri'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
      }, 'CSP Violation');
      captureServerException(new Error(`CSP Violation: ${report['violated-directive']} blocked ${report['blocked-uri']}`));
    }
    res.status(204).end();
  });

  // 3. CORS — production allowlist excludes staging/localhost
  const PRODUCTION_ORIGINS: string[] = [
    'https://timberequip.com',
    'https://www.timberequip.com',
    'https://mobile-app-equipment-sales.web.app',
    'https://mobile-app-equipment-sales.firebaseapp.com',
  ];
  const DEV_ORIGINS: string[] = [
    'https://timberequip-staging.web.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const ALLOWED_ORIGINS: string[] = process.env.NODE_ENV === 'production'
    ? PRODUCTION_ORIGINS
    : [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];
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


  // 5. Standard Middleware
  app.use(compression({ threshold: 1024 }));
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

  if (sharedPublicPagesProxy) {
    // Keep the sitemap on the shared public-pages handler, but let the SPA own
    // the public route families so we do not have two conflicting page owners.
    app.get(
      ['/sitemap.xml'],
      async (req, res, next) => {
        try {
          await sharedPublicPagesProxy?.(req, res, next);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // 6a. API Versioning — accept /api/v1/* and rewrite to /api/* for handlers
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api/v1/')) {
      req.url = req.url.replace('/api/v1/', '/api/');
    }
    next();
  });

  // 6b. API Version Header
  app.use('/api', (_req, res, next) => {
    res.setHeader('X-API-Version', 'v1');
    next();
  });

  // 6c. CSRF Protection
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

  // Enhanced health endpoint with component-level checks
  app.get('/api/health', async (_req, res) => {
    const timestamp = new Date().toISOString();
    const components: Record<string, { status: string; latencyMs?: number }> = {};
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check Firestore
    const fsStart = Date.now();
    try {
      await db.collection('_healthcheck').doc('ping').get();
      components.firestore = { status: 'healthy', latencyMs: Date.now() - fsStart };
    } catch {
      components.firestore = { status: 'unhealthy', latencyMs: Date.now() - fsStart };
      overall = 'degraded';
    }

    // Check Stripe
    if (stripe) {
      const stripeStart = Date.now();
      try {
        await stripe.balance.retrieve();
        components.stripe = { status: 'healthy', latencyMs: Date.now() - stripeStart };
      } catch {
        components.stripe = { status: 'degraded', latencyMs: Date.now() - stripeStart };
        if (overall === 'healthy') overall = 'degraded';
      }
    } else {
      components.stripe = { status: 'not_configured' };
    }

    // Server uptime
    components.server = { status: 'healthy', latencyMs: Math.round(process.uptime() * 1000) };

    const statusCode = overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: {
        status: overall,
        version: 'v1',
        timestamp,
        uptime: Math.round(process.uptime()),
        components,
      },
    });
  });

  // Public status endpoint (no auth, simplified for external monitoring)
  app.get('/_status', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 7a. Register route modules
  registerBillingRoutes(app, {
    db,
    auth,
    stripe,
    stripeWebhookSecret: serverConfig.stripeWebhookSecret,
    apiSuccess,
    apiError,
    getRequestBaseUrl,
    resolveStripePriceIdForPlan,
    getOrCreateStripeCustomer,
    findExistingStripeCustomerId,
    finalizeListingPaymentFromCheckoutSession,
    getListingCheckoutPlan,
    buildTrialEndForPlan,
    getManagedAccountSeatContext,
    isLocalBillingStubEnabled,
    buildLocalBillingStubSessionId,
    parseLocalBillingStubSessionId,
    buildLocalBillingStubSummary,
    UNLIMITED_LISTING_CAP,
  });

  registerPublicRoutes(app, {
    db,
    getMarketplaceStats,
    getPublicNewsFeedPayload,
    getPublicNewsPostPayload,
    serializeSellerPayloadFromStorefront,
    serializeSellerPayloadFromUser,
    hasActiveDealerDirectorySubscription,
    normalizeNonEmptyString,
  });

  registerUserRoutes(app, {
    db,
    auth,
    upload,
    scanFileForViruses,
    apiSuccess,
    apiError,
  });

  registerAdminRoutes(app, {
    db,
    auth,
    stripe,
    sendServerEmail,
    emailTemplates,
    isPrivilegedAdminEmail,
    canAdministrateAccountRole,
    normalizeRole,
    canCreateManagedRole,
    getManagedAccountSeatContext,
    buildAdminOverviewBootstrapPayload,
    serializeInquiryDoc,
    serializeCallDoc,
    normalizeDealerFeedListing,
    normalizeNonEmptyString,
    DEALER_MANAGED_ACCOUNT_LIMIT,
    APP_BASE_URL,
    EMAIL_FROM_ADDRESS,
  });

  registerManagedRolesRoutes(app, {
    db,
    auth,
    normalizeRole,
    isPrivilegedAdminEmail,
    sendServerEmail,
    emailTemplates,
    APP_BASE_URL,
  });

  const { closeLotByTimer } = registerAuctionRoutes(app, {
    db,
    auth,
    stripe,
    sendServerEmail,
    emailTemplates,
    getOrCreateStripeCustomer,
    isPrivilegedAdminEmail,
    canAdministrateAccountRole,
    parseDate,
    normalizeNonEmptyString,
    apiSuccess,
    apiError,
    APP_BASE_URL,
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
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      etag: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
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

  // ── WebSocket: create HTTP server and attach Socket.IO ──────────────────
  const httpServer = createHttpServer(app);
  const { io: socketIO, timerManager } = setupAuctionSockets(httpServer, db, auth);

  // Store references for use in route handlers
  (app as any).__socketIO = socketIO;
  (app as any).__timerManager = timerManager;

  // Load active auction timers on startup
  timerManager.loadActiveAuctions(db, async (auctionId: string, lotId: string) => {
    await closeLotByTimer(db, auctionId, lotId, socketIO);
  }).catch((err) => {
    logger.error({ err }, 'Failed to load auction timers on startup');
    captureServerException(err, { tags: { handler: 'timer-load' } });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT }, 'Server running (WebSocket enabled at /ws)');
  });
}

startServer().catch((error) => {
  captureServerException(error, {
    tags: { process_event: 'startServer' },
  });
  logger.fatal({ err: error }, 'Server startup failed');
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
      logger.info({ date: today }, 'Inventory snapshot already exists — skipping');
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

    logger.info({ date: today, activeCount: globalActiveCount, categoryCount: Object.keys(categoryCounts).length }, 'Inventory snapshot written');
  } catch (err) {
    logger.error({ err }, 'Failed to write inventory snapshot');
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
  logger.info('Skipping inventory snapshot job: Google Cloud credentials not configured');
}
