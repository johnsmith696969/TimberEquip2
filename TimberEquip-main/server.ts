import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import multer from 'multer';

dotenv.config();

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
  console.warn('Unable to load hybrid public pages handler for local routes.', error);
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
  | 'member'
  | 'buyer';

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
const MARKETPLACE_STATS_TTL_MS = 10 * 60 * 1000;

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
  if (normalized === 'member') return 'member';
  return 'buyer';
}

function canCreateManagedRole(parentRole: ManagedAccountRole, childRole: ManagedAccountRole): boolean {
  const adminManagedRoles: ManagedAccountRole[] = ['admin', 'developer', 'content_manager', 'editor', 'dealer', 'dealer_manager', 'dealer_staff', 'member', 'buyer'];
  const dealerManagedRoles: ManagedAccountRole[] = ['dealer_manager', 'dealer_staff', 'member', 'buyer'];

  if (parentRole === 'super_admin') return true;
  if (parentRole === 'admin' || parentRole === 'developer') return adminManagedRoles.includes(childRole);
  if (parentRole === 'dealer' || parentRole === 'dealer_manager') return dealerManagedRoles.includes(childRole);
  return false;
}

function isPrivilegedAdminEmail(email: unknown): boolean {
  return String(email || '').trim().toLowerCase() === 'caleb@forestryequipmentsales.com';
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
    productId: process.env.STRIPE_PRODUCT_OWNER_OPERATOR || process.env.STRIPE_PRODUCT_INDIVIDUAL || 'prod_UBpeOgS2Xbot2e',
    priceId: process.env.STRIPE_PRICE_OWNER_OPERATOR || process.env.STRIPE_PRICE_INDIVIDUAL || 'price_1TDRzJEFuycUwY0KZiFBQxTF',
  },
  dealer: {
    id: 'dealer',
    name: 'Dealer Ad Package',
    amountUsd: 499,
    listingCap: 50,
    productId: process.env.STRIPE_PRODUCT_DEALER || 'prod_UBpeHg3FydOSdD',
    priceId: process.env.STRIPE_PRICE_DEALER || 'price_1TDRzJEFuycUwY0KnU6HzAg2',
  },
  fleet_dealer: {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    amountUsd: 999,
    listingCap: 150,
    productId: process.env.STRIPE_PRODUCT_FLEET || 'prod_UBpek9mEeZPlyC',
    priceId: process.env.STRIPE_PRICE_FLEET || 'price_1TDRzKEFuycUwY0KPkBneTyh',
  },
};

const DEALER_MANAGED_ACCOUNT_LIMIT = 3;
const MANAGED_ACCOUNT_PLAN_IDS: ListingCheckoutPlanId[] = ['dealer', 'fleet_dealer'];

const checkoutPriceCache: Partial<Record<ListingCheckoutPlanId, string>> = {};

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

function getRequestBaseUrl(req: express.Request): string {
  const forwardedProtoRaw = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwardedProtoRaw) ? forwardedProtoRaw[0] : forwardedProtoRaw;
  const proto = String(forwardedProto || req.protocol || '').split(',')[0].trim() || 'https';

  const forwardedHostRaw = req.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(forwardedHostRaw) ? forwardedHostRaw[0] : forwardedHostRaw;
  const host = String(forwardedHost || req.get('host') || '').split(',')[0].trim();

  if (host) {
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
  const PORT = 3000;

  app.get('/server-test', (req, res) => res.send('Server is alive and reachable'));

  // 1. Security Headers (WAF-like protection at app level)
  /*
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://challenges.cloudflare.com", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/", "https://*.googleapis.com", "https://*.firebaseio.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://picsum.photos", "https://*.stripe.com", "https://*.firebasestorage.googleapis.com", "https://*.googleusercontent.com"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.stripe.com", "https://api.stripe.com", "https://*.run.app"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://challenges.cloudflare.com", "https://www.google.com/recaptcha/", "https://*.stripe.com", "https://*.run.app", "https://ai.studio"],
        frameAncestors: ["'self'", "https://*.run.app", "https://ai.studio"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: false, // Disable HSTS for dev environment to avoid redirect loops
    referrerPolicy: { policy: 'no-referrer-when-downgrade' },
    frameguard: false, // Allow iframe rendering for AI Studio preview
  }));
  */

  // 2. Rate Limiting (DDoS protection)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for dev environment
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api/', limiter);

  // 3. CORS
  app.use(cors({
    origin: true,
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
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Idempotency check: Check if we've already processed this event
    const eventRef = db.collection('webhook_events').doc(event.id);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
      console.log(`Webhook event ${event.id} already processed.`);
      return res.json({ received: true, duplicate: true });
    }

    // Mark event as processed
    await eventRef.set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      type: event.type
    });

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
            }, { merge: true });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userUid = subscription.metadata.userUid;
          if (userUid) {
            await db.collection('subscriptions').doc(subscription.id).update({
              status: 'canceled',
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
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (dbErr) {
      console.error('Error updating database from webhook:', dbErr);
      // Still return 200 to Stripe to avoid retries if the error is persistent but not critical
    }

    res.json({ received: true });
  });

  // 5. Standard Middleware
  app.use(express.json());
  app.use(cookieParser());

  if (sharedDealerApiProxy) {
    app.all(/^\/api\/(admin\/dealer-feeds(?:\/.*)?|dealer(?:\/.*)?|public\/dealers\/.*|public\/dealer-embed\.js)$/i, async (req, res, next) => {
      try {
        await sharedDealerApiProxy?.(req, res);
      } catch (error) {
        next(error);
      }
    });
  }

  if (sharedPublicPagesProxy) {
    app.get(
      [
        '/sitemap.xml',
        '/logging-equipment-for-sale',
        '/forestry-equipment-for-sale',
        '/categories',
        '/categories/:categorySlug',
        '/manufacturers',
        '/manufacturers/:manufacturerSlug',
        '/manufacturers/:manufacturerSlug/:categorySaleSlug',
        '/states',
        '/states/:stateSlug/logging-equipment-for-sale',
        '/states/:stateSlug/forestry-equipment-for-sale',
        '/states/:stateSlug/:categorySaleSlug',
        '/dealers',
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
  /*
  const csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: 'none', // Required for cross-origin iframe
    },
  });

  // Apply CSRF to all non-webhook API routes
  app.use('/api', (req, res, next) => {
    if (req.path === '/billing/webhook') return next();
    csrfProtection(req, res, next);
  });

  // Provide CSRF token to frontend
  app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
  */
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: 'dummy-token' });
  });

  // 7. API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/billing/create-checkout-session', async (req, res) => {
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
      return res.status(500).json({ error: error?.message || 'Failed to create checkout session.' });
    }
  });

  app.get('/api/billing/checkout-session/:sessionId', async (req, res) => {
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
      return res.status(500).json({ error: error?.message || 'Failed to confirm checkout session.' });
    }
  });

  app.get('/api/marketplace-stats', async (req, res) => {
    try {
      const payload = await getMarketplaceStats();
      res.set('Cache-Control', 'public, max-age=600');
      res.json(payload);
    } catch (error: any) {
      console.error('Failed to compute marketplace stats:', error);
      res.status(500).json({ error: error?.message || 'Failed to load marketplace stats' });
    }
  });

  app.post('/api/recaptcha-assess', express.json(), async (req, res) => {
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
          body: JSON.stringify({ event: { token, siteKey: '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0', expectedAction: action } }),
        }
      );
      if (!response.ok) return res.json({ pass: true, score: null });
      const data: any = await response.json();
      const valid = data?.tokenProperties?.valid ?? true;
      const score: number | null = data?.riskAnalysis?.score ?? null;
      const pass = valid && (score === null || score >= 0.5);
      return res.json({ pass, score });
    } catch {
      return res.json({ pass: true, score: null }); // graceful degradation
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
      res.status(500).json({ error: error.message });
    }
  });

  // Secure File Upload Endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
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
      const actorIsDealer = ['dealer', 'dealer_manager'].includes(actorRole);

      if (!actorCanAdminister && !actorIsDealer) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const displayName = String(req.body?.displayName || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const role = normalizeRole(req.body?.role);
      const company = String(req.body?.company || '').trim();
      const phoneNumber = String(req.body?.phoneNumber || '').trim();
      const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
      const parentRole = actorCanAdminister && actorRole === 'buyer' ? 'super_admin' : actorRole;

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
      return res.status(500).json({ error: error?.message || 'Unable to create managed account.' });
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
      const actorIsDealer = ['dealer', 'dealer_manager'].includes(actorRole);

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
      return res.status(500).json({ error: error?.message || 'Dealer feed ingest failed.' });
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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

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
