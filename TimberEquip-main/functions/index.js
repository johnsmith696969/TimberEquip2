const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { beforeUserCreated } = require('firebase-functions/v2/identity');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const sgMail = require('@sendgrid/mail');
const sharp = require('sharp');
const Stripe = require('stripe');
const { XMLParser } = require('fast-xml-parser');
const { randomUUID, randomBytes, createHash, createHmac, timingSafeEqual } = require('node:crypto');
const { templates } = require('./email-templates/index.js');
const { handlePublicPagesRequest } = require('./public-pages.js');
const {
  PUBLIC_SEO_COLLECTIONS,
  rebuildPublicSeoReadModel,
  syncPublicSeoForListingChange,
  syncPublicSeoForSellerChange,
} = require('./public-seo-read-model.js');
const {
  getFallbackMarketplaceListings,
  getFallbackMarketplaceHomeData,
  getFallbackMarketplaceCategoryMetrics,
  getFallbackMarketplaceStats,
} = require('./public-marketplace-fallback.js');
const { syncListingGovernanceArtifactsForWrite } = require('./listing-governance-artifacts.js');
const { buildAccountEntitlementSnapshot, buildCompactAccountState } = require('./account-entitlements.js');
const { buildLifecyclePatch } = require('./listing-lifecycle.js');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const { buildListingPublicPath, decodeListingPublicKey } = require('./listing-public-paths.js');
const { initializeFunctionsSentry, captureFunctionsException } = require('./sentry.js');
const { renderDealerWidgetScript } = require('./dealer-widget.js');

const RECAPTCHA_SITE_KEY = '6LdxzpIsAAAAADS0ws0EJT-ulSMBH5yO9uAWOqX0';
const RECAPTCHA_PROJECT_ID = 'mobile-app-equipment-sales';

if (!admin.apps.length) {
  admin.initializeApp();
}
initializeFunctionsSentry();

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

function resolveProjectId() {
  return normalizeNonEmptyString(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID, 'mobile-app-equipment-sales');
}

function resolveFirestoreDatabaseId() {
  const configuredDatabaseId = normalizeNonEmptyString(
    process.env.FIRESTORE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID,
    '',
  );

  if (configuredDatabaseId) {
    return configuredDatabaseId;
  }

  return resolveProjectId() === 'timberequip-staging' ? '(default)' : DEFAULT_FIRESTORE_DB_ID;
}

const FIRESTORE_DB_ID = resolveFirestoreDatabaseId();
function getDb() { return getFirestore(resolveFirestoreDatabaseId()); }
const LISTING_SEQUENCE_COUNTER_COLLECTION = 'systemCounters';
const LISTING_SEQUENCE_COUNTER_DOC = 'listingSequence';
const FIRST_SEQUENTIAL_LISTING_ID = 12000;

async function reserveNextSequentialListingId() {
  const db = getDb();
  const counterRef = db.collection(LISTING_SEQUENCE_COUNTER_COLLECTION).doc(LISTING_SEQUENCE_COUNTER_DOC);

  return db.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef);
    const currentValue = Number(counterSnapshot.data()?.lastIssuedId);
    let nextValue = Number.isFinite(currentValue) && currentValue >= FIRST_SEQUENTIAL_LISTING_ID
      ? Math.trunc(currentValue) + 1
      : FIRST_SEQUENTIAL_LISTING_ID;

    while (true) {
      const listingRef = db.collection('listings').doc(String(nextValue));
      const listingSnapshot = await transaction.get(listingRef);
      if (!listingSnapshot.exists) {
        transaction.set(counterRef, {
          lastIssuedId: nextValue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return String(nextValue);
      }

      nextValue += 1;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SendGrid configuration via Firebase secrets.
// Set up with:
//   firebase functions:secrets:set SENDGRID_API_KEY
//   firebase functions:secrets:set EMAIL_FROM
// ─────────────────────────────────────────────────────────────────────────────
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');
const EMAIL_FROM = defineSecret('EMAIL_FROM');
const ADMIN_EMAILS = defineSecret('ADMIN_EMAILS');
const FRED_API_KEY = defineSecret('FRED_API_KEY');
const GOOGLE_TRANSLATE_API_KEY = defineSecret('GOOGLE_TRANSLATE_API_KEY');
const EXCHANGERATE_API_KEY = defineSecret('EXCHANGERATE_API_KEY');
const GOOGLE_MAPS_API_KEY = defineSecret('GOOGLE_MAPS_API_KEY');
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const TWILIO_ACCOUNT_SID = defineSecret('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = defineSecret('TWILIO_AUTH_TOKEN');
const TWILIO_API_KEY_SID = defineSecret('TWILIO_API_KEY_SID');
const TWILIO_API_KEY_SECRET = defineSecret('TWILIO_API_KEY_SECRET');

let configuredSendGridApiKey = '';
const geocodeCache = new Map();
let publicNewsCache = null;
const PUBLIC_NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
const dealerFeedXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: true,
  trimValues: true,
});

function ensureSendGridClientConfigured() {
  const apiKey = String(SENDGRID_API_KEY.value() || '').trim();
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured.');
  }

  if (configuredSendGridApiKey !== apiKey) {
    sgMail.setApiKey(apiKey);
    configuredSendGridApiKey = apiKey;
  }
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function sendEmail({ to, subject, html, replyTo }) {
  ensureSendGridClientConfigured();
  const from = String(EMAIL_FROM.value() || '"Forestry Equipment Sales" <caleb@forestryequipmentsales.com>').trim();
  const resolvedReplyTo = String(replyTo || parseEmailAddress(from) || 'caleb@forestryequipmentsales.com').trim();
  const recipients = (Array.isArray(to) ? to : [to])
    .map((recipient) => String(recipient || '').trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error('No email recipients were provided.');
  }

  await sgMail.send({
    to: recipients,
    from,
    replyTo: resolvedReplyTo,
    subject,
    html,
    text: htmlToText(html),
  });

  logger.info(`Email sent to ${recipients.join(', ')}: ${subject}`);
}

function parseEmailAddress(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).trim().toLowerCase();
}

function getAdminRecipients() {
  const fromSecret = String(ADMIN_EMAILS.value() || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (fromSecret.length > 0) {
    return fromSecret;
  }

  const fallback = parseEmailAddress(String(EMAIL_FROM.value() || 'caleb@forestryequipmentsales.com').trim());
  return fallback ? [fallback] : ['caleb@forestryequipmentsales.com'];
}

const APP_URL = normalizeNonEmptyString(process.env.EMAIL_MARKETPLACE_URL || process.env.APP_URL, 'https://www.forestryequipmentsales.com');
const STAGING_APP_URL = 'https://timberequip-staging.web.app';
function resolveConfiguredAppUrl() {
  const projectId = String(process.env.GCLOUD_PROJECT || process.env.PROJECT_ID || '').trim().toLowerCase();
  if (projectId === 'timberequip-staging') {
    return STAGING_APP_URL;
  }
  return APP_URL;
}

function getEmailPreferenceSigningSecret() {
  const seed = [
    String(SENDGRID_API_KEY.value() || '').trim() || String(EMAIL_FROM.value() || '').trim() || 'forestry-equipment-sales-email',
    String(process.env.GCLOUD_PROJECT || process.env.PROJECT_ID || 'forestry-equipment-sales').trim(),
    'email-preferences',
  ].join('|');

  return createHash('sha256').update(seed).digest('hex');
}

function buildEmailPreferenceToken({ uid, email, scope = 'optional' }) {
  return createHmac('sha256', getEmailPreferenceSigningSecret())
    .update([
      normalizeNonEmptyString(uid),
      normalizeNonEmptyString(email).toLowerCase(),
      normalizeNonEmptyString(scope, 'optional').toLowerCase(),
    ].join('|'))
    .digest('hex');
}

function verifyEmailPreferenceToken({ uid, email, scope = 'optional', token }) {
  const expected = buildEmailPreferenceToken({ uid, email, scope });
  return signaturesMatch(expected, token);
}

function buildEmailUnsubscribeUrl({ uid, email, scope = 'optional' }) {
  const normalizedUid = normalizeNonEmptyString(uid);
  const normalizedEmail = normalizeNonEmptyString(email).toLowerCase();
  if (!normalizedUid || !normalizedEmail) return '';

  const params = new URLSearchParams({
    uid: normalizedUid,
    email: normalizedEmail,
    scope: normalizeNonEmptyString(scope, 'optional').toLowerCase(),
    token: buildEmailPreferenceToken({
      uid: normalizedUid,
      email: normalizedEmail,
      scope,
    }),
  });

  return `${resolveConfiguredAppUrl()}/unsubscribe?${params.toString()}`;
}
const PRIVILEGED_ADMIN_EMAILS = new Set([
  'caleb@forestryequipmentsales.com',
  'calebhappy@gmail.com',
]);
const FEATURED_LISTING_CAPS = Object.freeze({
  dealer: 3,
  pro_dealer: 6,
});

function getRoleDefaultListingCap(role) {
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole === 'dealer') return 50;
  if (normalizedRole === 'pro_dealer') return 150;
  return 0;
}

function getRoleDefaultManagedAccountCap(role) {
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole === 'dealer' || normalizedRole === 'pro_dealer') return 3;
  return 0;
}
const ACCOUNT_LISTING_CREATE_ALLOWED_KEYS = new Set([
  'id',
  'title',
  'category',
  'subcategory',
  'make',
  'manufacturer',
  'brand',
  'model',
  'year',
  'hours',
  'condition',
  'price',
  'salePrice',
  'currency',
  'location',
  'city',
  'state',
  'country',
  'latitude',
  'longitude',
  'serialNumber',
  'stockNumber',
  'description',
  'images',
  'imageTitles',
  'imageVariants',
  'videoUrls',
  'features',
  'specs',
  'specifications',
  'conditionChecklist',
  'featured',
  'featuredRank',
  'metaTitle',
  'metaDescription',
  'canonicalSlug',
  'contactPhone',
  'contactEmail',
]);
const ACCOUNT_LISTING_UPDATE_ALLOWED_KEYS = new Set(
  [...ACCOUNT_LISTING_CREATE_ALLOWED_KEYS].filter((key) => key !== 'id')
);
const ACCOUNT_LISTING_QUALITY_KEYS = new Set([
  'title',
  'category',
  'subcategory',
  'make',
  'manufacturer',
  'brand',
  'model',
  'year',
  'hours',
  'condition',
  'price',
  'salePrice',
  'currency',
  'location',
  'city',
  'state',
  'country',
  'images',
  'imageVariants',
  'videoUrls',
  'features',
  'specs',
  'specifications',
  'conditionChecklist',
  'metaTitle',
  'metaDescription',
  'canonicalSlug',
  'contactPhone',
  'contactEmail',
]);

function getDirectApiProxyUrl() {
  const projectId = resolveProjectId();
  return `https://us-central1-${projectId}.cloudfunctions.net/apiProxy`;
}
const STRIPE_WEBHOOK_DEDUPE_WINDOW_MS = 30 * 60 * 1000;
const recentStripeWebhookEvents = new Map();
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMITS = Object.freeze({
  sendVerificationEmail: 3,
  passwordReset: 5,
});
const recentAuthEndpointRequests = new Map();

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function pruneRecentStripeWebhookEvents(now = Date.now()) {
  for (const [eventId, expiresAt] of recentStripeWebhookEvents.entries()) {
    if (expiresAt <= now) {
      recentStripeWebhookEvents.delete(eventId);
    }
  }
}

function markRecentStripeWebhookEvent(eventId) {
  const normalizedEventId = String(eventId || '').trim();
  if (!normalizedEventId) return false;

  const now = Date.now();
  pruneRecentStripeWebhookEvents(now);
  const existingExpiry = recentStripeWebhookEvents.get(normalizedEventId);
  if (existingExpiry && existingExpiry > now) {
    return true;
  }

  recentStripeWebhookEvents.set(normalizedEventId, now + STRIPE_WEBHOOK_DEDUPE_WINDOW_MS);
  return false;
}

function pruneRecentAuthEndpointRequests(now = Date.now()) {
  for (const [key, bucket] of recentAuthEndpointRequests.entries()) {
    if (!bucket || bucket.resetAt <= now) {
      recentAuthEndpointRequests.delete(key);
    }
  }
}

function getRequestIp(req) {
  const forwardedFor = normalizeNonEmptyString(req.headers['cf-connecting-ip'])
    || normalizeNonEmptyString(req.headers['x-forwarded-for'])
    || normalizeNonEmptyString(req.headers['x-real-ip'])
    || normalizeNonEmptyString(req.ip)
    || normalizeNonEmptyString(req.socket?.remoteAddress)
    || 'unknown';

  return forwardedFor.split(',')[0].trim().toLowerCase();
}

function consumeAuthRateLimit(scope, req, identifier, limit = 5) {
  const normalizedScope = normalizeNonEmptyString(scope, 'auth');
  const normalizedIdentifier = normalizeNonEmptyString(identifier, 'anonymous').toLowerCase();
  const ipAddress = getRequestIp(req);
  const now = Date.now();

  pruneRecentAuthEndpointRequests(now);

  const key = `${normalizedScope}:${normalizedIdentifier}:${ipAddress}`;
  const currentBucket = recentAuthEndpointRequests.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    const nextBucket = {
      count: 1,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    };
    recentAuthEndpointRequests.set(key, nextBucket);
    return {
      allowed: true,
      remaining: Math.max(limit - nextBucket.count, 0),
      retryAfterSeconds: Math.ceil((nextBucket.resetAt - now) / 1000),
    };
  }

  if (currentBucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((currentBucket.resetAt - now) / 1000), 1),
    };
  }

  currentBucket.count += 1;
  recentAuthEndpointRequests.set(key, currentBucket);

  return {
    allowed: true,
    remaining: Math.max(limit - currentBucket.count, 0),
    retryAfterSeconds: Math.ceil((currentBucket.resetAt - now) / 1000),
  };
}

function normalizeUserRole(role) {
  const normalized = normalize(role);
  if (normalized === 'dealer_staff') return 'dealer';
  if (normalized === 'dealer_manager') return 'pro_dealer';
  return normalized;
}

function normalizeAccountAccessSource(source) {
  const normalized = normalize(source);
  if (['free_member', 'pending_checkout', 'subscription', 'admin_override', 'managed_account'].includes(normalized)) {
    return normalized;
  }
  return '';
}

function normalizeAccountStatus(status) {
  const normalized = normalize(status);
  if (['active', 'pending', 'suspended'].includes(normalized)) {
    return normalized;
  }
  return '';
}

function isSubscriptionExemptRole(role) {
  return ['super_admin', 'admin', 'developer', 'content_manager', 'editor'].includes(normalizeUserRole(role));
}

function isSellerSubscriptionRole(role) {
  return ['individual_seller', 'dealer', 'pro_dealer'].includes(normalizeUserRole(role));
}

function hasAdminOverrideSellerAccess(role, accessSource) {
  return isSellerSubscriptionRole(role) && normalizeAccountAccessSource(accessSource) === 'admin_override';
}

function buildAccessClaims(existingClaims = {}, overrides = {}) {
  const nextClaims = {
    ...existingClaims,
  };

  if ('role' in overrides) {
    nextClaims.role = normalizeUserRole(overrides.role || '');
  }

  if ('subscriptionPlanId' in overrides) {
    const planId = String(overrides.subscriptionPlanId || '').trim();
    if (planId) {
      nextClaims.subscriptionPlanId = planId;
    } else {
      delete nextClaims.subscriptionPlanId;
    }
  }

  if ('listingCap' in overrides) {
    const listingCap = Number(overrides.listingCap);
    if (Number.isFinite(listingCap) && listingCap > 0) {
      nextClaims.listingCap = listingCap;
    } else {
      delete nextClaims.listingCap;
    }
  }

  if ('managedAccountCap' in overrides) {
    const managedAccountCap = Number(overrides.managedAccountCap);
    if (Number.isFinite(managedAccountCap) && managedAccountCap > 0) {
      nextClaims.managedAccountCap = managedAccountCap;
    } else {
      delete nextClaims.managedAccountCap;
    }
  }

  if ('subscriptionStatus' in overrides) {
    const subscriptionStatus = String(overrides.subscriptionStatus || '').trim();
    if (subscriptionStatus) {
      nextClaims.subscriptionStatus = subscriptionStatus;
    } else {
      delete nextClaims.subscriptionStatus;
    }
  }

  if ('accountAccessSource' in overrides) {
    const accountAccessSource = normalizeAccountAccessSource(overrides.accountAccessSource);
    if (accountAccessSource) {
      nextClaims.accountAccessSource = accountAccessSource;
    } else {
      delete nextClaims.accountAccessSource;
    }
  }

  if ('accountStatus' in overrides) {
    const accountStatus = normalizeAccountStatus(overrides.accountStatus);
    if (accountStatus) {
      nextClaims.accountStatus = accountStatus;
    } else {
      delete nextClaims.accountStatus;
    }
  }

  if ('parentAccountUid' in overrides) {
    const parentAccountUid = String(overrides.parentAccountUid || '').trim();
    if (parentAccountUid) {
      nextClaims.parentAccountUid = parentAccountUid;
    } else {
      delete nextClaims.parentAccountUid;
    }
  }

  return nextClaims;
}

function deriveManualAccountAccessSource(actorRole, requestedRole, existingSource = '') {
  const normalizedExistingSource = normalizeAccountAccessSource(existingSource);
  if (normalizedExistingSource) return normalizedExistingSource;

  const normalizedActorRole = normalizeUserRole(actorRole);
  const normalizedRequestedRole = normalizeUserRole(requestedRole);

  if (normalizedActorRole === 'dealer' || normalizedActorRole === 'pro_dealer') {
    return normalizedRequestedRole === 'member' || normalizedRequestedRole === 'buyer'
      ? 'managed_account'
      : 'admin_override';
  }

  if (normalizedRequestedRole === 'member') return 'free_member';
  if (normalizedRequestedRole === 'buyer') return '';
  return 'admin_override';
}

function isPrivilegedAdminEmail(email) {
  return PRIVILEGED_ADMIN_EMAILS.has(normalize(email));
}

function includesNormalized(haystack, needle) {
  return normalize(haystack).includes(normalize(needle));
}

function normalizeNonEmptyString(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized || fallback;
}

function normalizeFiniteNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toFiniteNumberOrUndefined(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function stripUndefinedDeep(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => stripUndefinedDeep(entry))
      .filter((entry) => entry !== undefined);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
    const sanitizedValue = stripUndefinedDeep(entryValue);
    if (sanitizedValue !== undefined) {
      accumulator[key] = sanitizedValue;
    }
    return accumulator;
  }, {});
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function distanceMiles(aLat, aLng, bLat, bLng) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadiusMiles * c;
}

function parseLocationCoordinates(value) {
  const parts = String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) return null;

  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}

function splitLocationParts(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildLocationFallbackScore(targetLocation, candidateLocation) {
  const targetParts = splitLocationParts(targetLocation).map((part) => normalize(part));
  const candidateParts = splitLocationParts(candidateLocation).map((part) => normalize(part));

  if (targetParts.length === 0 || candidateParts.length === 0) return 0;

  let score = 0;
  if (normalize(targetLocation) === normalize(candidateLocation)) score += 100;
  if (targetParts[0] && candidateParts[0] && targetParts[0] === candidateParts[0]) score += 40;

  const targetRegion = targetParts[targetParts.length - 1] || '';
  const candidateRegion = candidateParts[candidateParts.length - 1] || '';
  if (targetRegion && candidateRegion && targetRegion === candidateRegion) score += 35;

  const secondaryTarget = targetParts[1] || '';
  const secondaryCandidate = candidateParts[1] || '';
  if (secondaryTarget && secondaryCandidate && secondaryTarget === secondaryCandidate) score += 25;

  return score;
}

function extractListingCoordinates(listing) {
  const lat = toFiniteNumberOrUndefined(listing?.latitude ?? listing?.specs?.latitude ?? listing?.specs?.lat);
  const lng = toFiniteNumberOrUndefined(listing?.longitude ?? listing?.specs?.longitude ?? listing?.specs?.lng ?? listing?.specs?.lon);
  if (lat === undefined || lng === undefined) return null;
  return { lat, lng };
}

function parseListingIdFromReference(reference) {
  const value = String(reference || '').trim();
  if (!value) return '';

  const listingUrlMatch = value.match(/\/listing\/([^/?#]+)/i);
  if (listingUrlMatch?.[1]) return listingUrlMatch[1].trim();

  const legacyEquipmentUrlMatch = value.match(/\/equipment\/[^/?#]+\/([^/?#]+)/i);
  if (legacyEquipmentUrlMatch?.[1]) {
    const decodedListingId = decodeListingPublicKey(legacyEquipmentUrlMatch[1].trim());
    if (decodedListingId) return decodedListingId;
  }

  const equipmentUrlMatch = value.match(/\/equipment\/([^/?#]+)/i);
  if (equipmentUrlMatch?.[1]) {
    const decodedListingId = decodeListingPublicKey(equipmentUrlMatch[1].trim());
    if (decodedListingId) return decodedListingId;
  }

  if (!value.includes('/') && !value.includes(' ') && value.length >= 8) {
    return value;
  }

  return '';
}

function buildCanonicalListingUrl(listingId, listing = {}) {
  const normalizedListingId = normalizeNonEmptyString(listingId);
  if (!normalizedListingId) {
    return `${APP_URL}/equipment`;
  }

  return `${APP_URL}${buildListingPublicPath({
    id: normalizedListingId,
    title: listing?.title,
    year: listing?.year,
    model: listing?.model,
    category: listing?.category,
    subcategory: listing?.subcategory,
    location: listing?.location,
    make: listing?.make || listing?.manufacturer || listing?.brand,
    manufacturer: listing?.manufacturer || listing?.make || listing?.brand,
    brand: listing?.brand || listing?.manufacturer || listing?.make,
  })}`;
}

async function geocodeLocation(address) {
  const normalizedAddress = String(address || '').trim();
  if (!normalizedAddress) return null;

  const directCoordinates = parseLocationCoordinates(normalizedAddress);
  if (directCoordinates) {
    return {
      lat: directCoordinates.lat,
      lng: directCoordinates.lng,
      formattedAddress: normalizedAddress,
      source: 'coordinates',
    };
  }

  const cacheKey = normalize(normalizedAddress);
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const apiKey = String(GOOGLE_MAPS_API_KEY.value() || '').trim();
  if (!apiKey) {
    geocodeCache.set(cacheKey, null);
    return null;
  }

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalizedAddress)}&key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) {
    throw new Error(`Google geocoding request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (payload.status !== 'OK' || !Array.isArray(payload.results) || payload.results.length === 0) {
    geocodeCache.set(cacheKey, null);
    return null;
  }

  const result = payload.results[0];
  const location = result?.geometry?.location;
  const geocoded = location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
    ? {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: String(result.formatted_address || normalizedAddress),
        source: 'google-geocode',
      }
    : null;

  geocodeCache.set(cacheKey, geocoded);
  return geocoded;
}

async function buildEmailVerificationLink(email) {
  try {
    return await admin.auth().generateEmailVerificationLink(email, {
      url: `${APP_URL}/login`,
    });
  } catch (error) {
    logger.warn(`Could not generate verification link for ${email}: ${error.message}`);
    return `${APP_URL}/login`;
  }
}

function resolveAppUrlFromRequest(req) {
  const origin = String(req.headers.origin || '').trim();
  if (/^https:\/\/timberequip-staging\.(web\.app|firebaseapp\.com)$/i.test(origin)) {
    return STAGING_APP_URL;
  }

  const host = String(req.headers.host || '').trim().toLowerCase();
  if (host === 'timberequip-staging.web.app' || host === 'timberequip-staging.firebaseapp.com') {
    return STAGING_APP_URL;
  }

  return APP_URL;
}

async function buildPasswordResetLink(email, continueUrl = `${APP_URL}/login`) {
  try {
    return await admin.auth().generatePasswordResetLink(email, {
      url: continueUrl,
    });
  } catch (error) {
    logger.warn(`Could not generate password reset link for ${email}: ${error.message}`);
    return continueUrl;
  }
}

async function sendPasswordResetEmailMessage({ email, displayName, requestedBy, continueUrl = `${APP_URL}/login` }) {
  const resetLink = await buildPasswordResetLink(email, continueUrl);
  const safeDisplayName = String(displayName || 'there').trim() || 'there';
  const safeRequestedBy = String(requestedBy || '').trim();
  const intro = safeRequestedBy
    ? `${safeRequestedBy} requested a password reset for your Forestry Equipment Sales account.`
    : 'We received a request to reset your Forestry Equipment Sales password.';

  await sendEmail({
    to: email,
    subject: 'Reset your Forestry Equipment Sales password',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 16px;">Password reset requested</h2>
        <p>Hello ${safeDisplayName},</p>
        <p>${intro}</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:4px;">Reset Password</a></p>
        <p>If you did not expect this email, you can ignore it.</p>
      </div>
    `,
  });
}

async function sendVoicemailNotificationEmailMessage({
  email,
  sellerName,
  callerNumber,
  callTimestamp,
  dashboardUrl,
}) {
  const safeSellerName = String(sellerName || 'there').trim() || 'there';
  const safeCallerNumber = String(callerNumber || 'Unknown caller').trim() || 'Unknown caller';
  const safeCallTimestamp = String(callTimestamp || '').trim() || new Date().toLocaleString('en-US');
  const safeDashboardUrl = String(dashboardUrl || `${APP_URL}/profile?tab=Calls`).trim() || `${APP_URL}/profile?tab=Calls`;

  await sendEmail({
    to: email,
    subject: 'New voicemail on Forestry Equipment Sales',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 16px;">New voicemail received</h2>
        <p>Hello ${safeSellerName},</p>
        <p>A caller left a voicemail on your Forestry Equipment Sales tracking number.</p>
        <ul style="padding-left: 18px;">
          <li><strong>Caller:</strong> ${safeCallerNumber}</li>
          <li><strong>Received:</strong> ${safeCallTimestamp}</li>
        </ul>
        <p>
          <a
            href="${safeDashboardUrl}"
            style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:4px;"
          >
            Review Voicemail
          </a>
        </p>
        <p>You can listen to the voicemail from your Calls tab inside Forestry Equipment Sales.</p>
      </div>
    `,
  });
}

async function sendVerificationEmailMessage({ email, displayName }) {
  const verificationLink = await buildEmailVerificationLink(email);
  const payload = templates.welcomeVerification({
    displayName: displayName || 'there',
    verificationLink,
  });

  await sendEmail({ to: email, ...payload });
}

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry || '').trim())
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function normalizeDelimitedStringList(value, maxItems = 40) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeNonEmptyString(entry))
      .filter(Boolean)
      .slice(0, maxItems);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => normalizeNonEmptyString(entry))
          .filter(Boolean)
          .slice(0, maxItems);
      }
    } catch (_) {
      // Fall back to delimiter parsing below.
    }
  }

  return trimmed
    .split(/[\n|]+/u)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeDelimitedUrlList(value, maxItems = 40) {
  return normalizeDelimitedStringList(value, maxItems)
    .filter((entry) => /^https?:\/\//i.test(entry));
}

function extractPrefixedSpecValues(item) {
  if (!isPlainObject(item)) return {};

  const specs = {};
  const prefixes = ['specs.', 'spec.', 'specs_', 'spec_'];

  for (const [rawKey, rawValue] of Object.entries(item)) {
    const normalizedKey = String(rawKey || '').trim();
    const lowerKey = normalizedKey.toLowerCase();
    const prefix = prefixes.find((candidate) => lowerKey.startsWith(candidate));
    if (!prefix) continue;

    const specKey = normalizedKey.slice(prefix.length).trim();
    if (!specKey || rawValue == null || rawValue === '') continue;
    specs[specKey] = rawValue;
  }

  return specs;
}

function normalizeFeedKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function flattenFeedImageUrls(value, depth = 0) {
  if (depth > 5 || value == null) return [];

  if (typeof value === 'string') {
    const candidate = value.trim();
    return /^https?:\/\//i.test(candidate) ? [candidate] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenFeedImageUrls(entry, depth + 1));
  }

  if (!isPlainObject(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const normalizedKey = normalizeFeedKey(key);
    if (['image', 'imageurl', 'imageurls', 'images', 'photo', 'photos', 'gallery', 'media', 'thumbnail', 'thumb', 'url', 'href', 'src', 'full', 'large'].includes(normalizedKey)) {
      return flattenFeedImageUrls(nestedValue, depth + 1);
    }
    return flattenFeedImageUrls(nestedValue, depth + 1);
  });
}

function findFeedValue(value, candidateKeys, depth = 0) {
  if (depth > 5 || value == null) return undefined;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFeedValue(entry, candidateKeys, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  if (!isPlainObject(value)) {
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (candidateKeys.has(normalizeFeedKey(key)) && nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
      return nestedValue;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const found = findFeedValue(nestedValue, candidateKeys, depth + 1);
    if (found !== undefined) return found;
  }

  return undefined;
}

function buildFallbackDealerFeedExternalId(item) {
  const pieces = [
    findFeedValue(item, new Set(['stocknumber', 'stock', 'stockid', 'sku'])),
    findFeedValue(item, new Set(['serialnumber', 'serial', 'vin'])),
    findFeedValue(item, new Set(['title', 'name', 'headline'])),
    findFeedValue(item, new Set(['model'])),
    findFeedValue(item, new Set(['year'])),
  ]
    .map((piece) => String(piece || '').trim().toLowerCase())
    .filter(Boolean)
    .map((piece) => piece.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));

  return pieces.join('-').slice(0, 120);
}

function extractDealerFeedItemsFromPayload(value, depth = 0) {
  if (depth > 6 || value == null) return [];

  if (Array.isArray(value)) {
    const objectEntries = value.filter(isPlainObject);
    if (objectEntries.length > 0) return objectEntries;

    for (const entry of value) {
      const nested = extractDealerFeedItemsFromPayload(entry, depth + 1);
      if (nested.length > 0) return nested;
    }
    return [];
  }

  if (!isPlainObject(value)) {
    return [];
  }

  const priorityKeys = ['items', 'listings', 'inventory', 'results', 'data', 'equipment', 'machines', 'units', 'records', 'entries', 'entry', 'products'];
  for (const priorityKey of priorityKeys) {
    const matchingEntry = Object.entries(value).find(([key]) => normalizeFeedKey(key) === normalizeFeedKey(priorityKey));
    if (!matchingEntry) continue;
    const nested = extractDealerFeedItemsFromPayload(matchingEntry[1], depth + 1);
    if (nested.length > 0) return nested;
  }

  for (const nestedValue of Object.values(value)) {
    const nested = extractDealerFeedItemsFromPayload(nestedValue, depth + 1);
    if (nested.length > 0) return nested;
  }

  return [value];
}

const DEALER_FEED_STATUS_VALUES = new Set(['active', 'paused', 'disabled']);
const DEALER_FEED_SYNC_MODE_VALUES = new Set(['pull', 'push', 'manual']);
const DEALER_FEED_SYNC_FREQUENCY_VALUES = new Set(['hourly', 'daily', 'weekly', 'manual']);
const DEALER_FEED_SOURCE_TYPE_VALUES = new Set(['auto', 'json', 'xml', 'csv']);
const DEALER_WEBHOOK_SIGNATURE_WINDOW_MS = 10 * 60 * 1000;

function sha256Hex(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

function maskSecret(value, visibleChars = 4) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (normalized.length <= visibleChars * 2) {
    return `${normalized.slice(0, 2)}…${normalized.slice(-2)}`;
  }
  return `${normalized.slice(0, visibleChars)}…${normalized.slice(-visibleChars)}`;
}

function normalizeDealerFeedStatus(value, fallback = 'active') {
  const normalized = normalizeNonEmptyString(value, fallback).toLowerCase();
  return DEALER_FEED_STATUS_VALUES.has(normalized) ? normalized : fallback;
}

function normalizeDealerFeedSyncMode(value, fallback = 'pull') {
  const normalized = normalizeNonEmptyString(value, fallback).toLowerCase();
  return DEALER_FEED_SYNC_MODE_VALUES.has(normalized) ? normalized : fallback;
}

function normalizeDealerFeedSyncFrequency(value, fallback = 'daily') {
  const normalized = normalizeNonEmptyString(value, fallback).toLowerCase();
  return DEALER_FEED_SYNC_FREQUENCY_VALUES.has(normalized) ? normalized : fallback;
}

function normalizeDealerFeedSourceType(value, fallback = 'auto') {
  const normalized = normalizeNonEmptyString(value, fallback).toLowerCase();
  return DEALER_FEED_SOURCE_TYPE_VALUES.has(normalized) ? normalized : fallback;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function looksLikeCsvPayload(payloadText) {
  const normalized = String(payloadText || '').trim();
  if (!normalized || normalized.startsWith('{') || normalized.startsWith('[') || normalized.startsWith('<')) {
    return false;
  }

  const lines = normalized
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return false;
  const header = parseCsvLine(lines[0]);
  const firstRow = parseCsvLine(lines[1]);
  return header.length > 1 && firstRow.length > 1;
}

function parseDealerFeedCsvText(payloadText) {
  const normalized = String(payloadText || '').replace(/^\uFEFF/u, '').trim();
  if (!normalized) {
    throw new Error('Feed payload is empty.');
  }

  const lines = normalized
    .split(/\r?\n/u)
    .map((line) => line.replace(/\r/u, ''))
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV feed payload must include a header row and at least one data row.');
  }

  const headers = parseCsvLine(lines[0]).map((header, index) => {
    const normalizedHeader = normalizeNonEmptyString(header);
    return normalizedHeader || `column_${index + 1}`;
  });

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });

  if (rows.length === 0) {
    throw new Error('No listing items were found in the supplied CSV payload.');
  }

  return rows;
}

function inferDealerFeedParserOrder(payloadText) {
  const normalized = String(payloadText || '').trim();
  if (!normalized) return ['json', 'xml', 'csv'];
  if (normalized.startsWith('{') || normalized.startsWith('[')) return ['json', 'csv', 'xml'];
  if (normalized.startsWith('<')) return ['xml', 'json', 'csv'];
  if (looksLikeCsvPayload(normalized)) return ['csv', 'json', 'xml'];
  return ['json', 'xml', 'csv'];
}

function generateDealerFeedApiKey() {
  return `tef_${randomBytes(24).toString('base64url')}`;
}

function generateDealerWebhookSecret() {
  return randomBytes(32).toString('hex');
}

function buildDealerFeedListingDocId(feedId, externalId) {
  return `${normalizeNonEmptyString(feedId, 'dealer-feed')}__${sha256Hex(externalId).slice(0, 32)}`;
}

function getNestedValue(target, rawPath) {
  const segments = String(rawPath || '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return undefined;

  let current = target;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    if (current == null || (typeof current !== 'object' && !isPlainObject(current))) {
      return undefined;
    }

    if (!(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function setNestedValue(target, rawPath, value) {
  const segments = String(rawPath || '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return;

  let current = target;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLeaf = index === segments.length - 1;
    if (isLeaf) {
      current[segment] = value;
      return;
    }

    if (!isPlainObject(current[segment])) {
      current[segment] = {};
    }
    current = current[segment];
  }
}

function normalizeDealerFieldMapping(fieldMapping) {
  if (!Array.isArray(fieldMapping)) return [];

  return fieldMapping
    .map((entry) => {
      const externalField = normalizeNonEmptyString(entry?.externalField || entry?.source);
      const timberequipField = normalizeNonEmptyString(entry?.timberequipField || entry?.target);
      if (!externalField || !timberequipField) return null;
      return { externalField, timberequipField };
    })
    .filter(Boolean);
}

function applyDealerFieldMapping(item, fieldMapping) {
  const normalizedFieldMapping = normalizeDealerFieldMapping(fieldMapping);
  const overrides = {};

  for (const mapping of normalizedFieldMapping) {
    let mappedValue = getNestedValue(item, mapping.externalField);
    if (mappedValue === undefined) {
      const leaf = mapping.externalField.split('.').map((segment) => segment.trim()).filter(Boolean).pop();
      if (leaf) {
        mappedValue = findFeedValue(item, new Set([normalizeFeedKey(mapping.externalField), normalizeFeedKey(leaf)]));
      }
    }

    if (mappedValue !== undefined) {
      setNestedValue(overrides, mapping.timberequipField, mappedValue);
    }
  }

  return overrides;
}

function buildDealerFeedWritePayload(input = {}, defaults = {}) {
  const feedUrl = normalizeNonEmptyString(input.feedUrl || input.apiEndpoint || defaults.feedUrl || defaults.apiEndpoint);
  const requestedSyncMode = normalizeNonEmptyString(input.syncMode || defaults.syncMode);
  const inferredSyncMode = feedUrl ? 'pull' : (normalizeNonEmptyString(input.rawInput || defaults.rawInput) ? 'push' : 'manual');
  const syncMode = normalizeDealerFeedSyncMode(requestedSyncMode || inferredSyncMode, inferredSyncMode);
  const nightlySyncEnabled = typeof input.nightlySyncEnabled === 'boolean'
    ? input.nightlySyncEnabled
    : typeof defaults.nightlySyncEnabled === 'boolean'
      ? defaults.nightlySyncEnabled
      : syncMode === 'pull';

  return {
    sellerUid: normalizeNonEmptyString(input.sellerUid || input.dealerId || defaults.sellerUid || defaults.dealerId),
    dealerName: normalizeNonEmptyString(input.dealerName || defaults.dealerName),
    dealerEmail: normalizeNonEmptyString(input.dealerEmail || defaults.dealerEmail),
    sourceName: normalizeNonEmptyString(input.sourceName || defaults.sourceName, 'Dealer Feed'),
    sourceType: normalizeDealerFeedSourceType(input.sourceType || defaults.sourceType || 'auto'),
    rawInput: normalizeNonEmptyString(
      Object.prototype.hasOwnProperty.call(input, 'rawInput') ? input.rawInput : defaults.rawInput
    ),
    feedUrl,
    apiEndpoint: feedUrl,
    status: normalizeDealerFeedStatus(input.status || defaults.status || 'active'),
    syncMode,
    syncFrequency: normalizeDealerFeedSyncFrequency(
      input.syncFrequency || defaults.syncFrequency || (nightlySyncEnabled ? 'daily' : 'manual'),
      nightlySyncEnabled ? 'daily' : 'manual'
    ),
    nightlySyncEnabled,
    autoPublish: Object.prototype.hasOwnProperty.call(input, 'autoPublish')
      ? Boolean(input.autoPublish)
      : Object.prototype.hasOwnProperty.call(defaults, 'autoPublish')
        ? Boolean(defaults.autoPublish)
        : false,
    fieldMapping: normalizeDealerFieldMapping(input.fieldMapping || defaults.fieldMapping),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function serializeDealerFeed(feedId, rawFeed, options = {}) {
  const feed = rawFeed || {};
  const directApiProxyUrl = getDirectApiProxyUrl();
  const webhookUrl = `${directApiProxyUrl}/dealer/webhook/${encodeURIComponent(feedId)}`;

  return {
    id: feedId,
    sellerUid: normalizeNonEmptyString(feed.sellerUid || feed.dealerId),
    dealerName: normalizeNonEmptyString(feed.dealerName),
    dealerEmail: normalizeNonEmptyString(feed.dealerEmail),
    sourceName: normalizeNonEmptyString(feed.sourceName, 'Dealer Feed'),
    sourceType: normalizeDealerFeedSourceType(feed.sourceType || 'auto'),
    rawInput: normalizeNonEmptyString(feed.rawInput),
    feedUrl: normalizeNonEmptyString(feed.feedUrl || feed.apiEndpoint),
    apiEndpoint: normalizeNonEmptyString(feed.apiEndpoint || feed.feedUrl),
    status: normalizeDealerFeedStatus(feed.status || 'active'),
    syncMode: normalizeDealerFeedSyncMode(feed.syncMode || 'pull', 'pull'),
    syncFrequency: normalizeDealerFeedSyncFrequency(feed.syncFrequency || 'manual', 'manual'),
    nightlySyncEnabled: Boolean(feed.nightlySyncEnabled),
    autoPublish: Boolean(feed.autoPublish),
    fieldMapping: normalizeDealerFieldMapping(feed.fieldMapping),
    totalListingsSynced: Number(feed.totalListingsSynced || 0),
    totalListingsActive: Number(feed.totalListingsActive || 0),
    totalListingsDeleted: Number(feed.totalListingsDeleted || 0),
    totalListingsCreated: Number(feed.totalListingsCreated || 0),
    totalListingsUpdated: Number(feed.totalListingsUpdated || 0),
    lastSyncAt: feed.lastSyncAt || null,
    nextSyncAt: feed.nextSyncAt || null,
    lastSyncStatus: normalizeNonEmptyString(feed.lastSyncStatus),
    lastSyncMessage: normalizeNonEmptyString(feed.lastSyncMessage),
    lastResolvedType: normalizeDealerFeedSourceType(feed.lastResolvedType || 'auto'),
    createdAt: feed.createdAt || null,
    updatedAt: feed.updatedAt || null,
    apiKeyMasked: normalizeNonEmptyString(feed.apiKeyPreview) || maskSecret(feed.apiKey),
    webhookSecretMasked: maskSecret(feed.webhookSecret),
    webhookUrl,
    ingestUrl: `${directApiProxyUrl}/dealer/ingest`,
    ...(options.includeSecrets ? {
      apiKey: normalizeNonEmptyString(feed.apiKey),
      webhookSecret: normalizeNonEmptyString(feed.webhookSecret),
    } : {}),
  };
}

async function ensureDealerFeedFromLegacyProfile(profileId, legacyProfile) {
  const normalizedProfileId = normalizeNonEmptyString(profileId);
  if (!normalizedProfileId) return null;

  const feedRef = getDb().collection('dealerFeeds').doc(normalizedProfileId);
  const existingFeedSnap = await feedRef.get();
  if (existingFeedSnap.exists) {
    const existingData = existingFeedSnap.data() || {};
    if (normalizeNonEmptyString(existingData.apiKey) && normalizeNonEmptyString(existingData.webhookSecret)) {
      return { id: existingFeedSnap.id, data: existingData, ref: feedRef, migrated: false };
    }
  }

  const legacy = legacyProfile || {};
  const writePayload = buildDealerFeedWritePayload(legacy, legacy);
  const apiKey = normalizeNonEmptyString(existingFeedSnap.data()?.apiKey, generateDealerFeedApiKey());
  const webhookSecret = normalizeNonEmptyString(existingFeedSnap.data()?.webhookSecret, generateDealerWebhookSecret());
  const syncFrequency = normalizeDealerFeedSyncFrequency(
    writePayload.syncFrequency || (writePayload.nightlySyncEnabled ? 'daily' : 'manual'),
    writePayload.nightlySyncEnabled ? 'daily' : 'manual'
  );

  await feedRef.set(
    {
      ...writePayload,
      syncFrequency,
      apiKey,
      apiKeyPreview: maskSecret(apiKey),
      webhookSecret,
      lastSyncAt: legacy.lastSyncAt || existingFeedSnap.data()?.lastSyncAt || null,
      lastSyncStatus: normalizeNonEmptyString(legacy.lastSyncStatus || existingFeedSnap.data()?.lastSyncStatus),
      lastSyncMessage: normalizeNonEmptyString(legacy.lastSyncMessage || existingFeedSnap.data()?.lastSyncMessage),
      lastResolvedType: normalizeDealerFeedSourceType(
        legacy.lastResolvedType || existingFeedSnap.data()?.lastResolvedType || writePayload.sourceType || 'auto'
      ),
      totalListingsActive: Number(existingFeedSnap.data()?.totalListingsActive || 0),
      totalListingsDeleted: Number(existingFeedSnap.data()?.totalListingsDeleted || 0),
      totalListingsSynced: Number(existingFeedSnap.data()?.totalListingsSynced || 0),
      totalListingsCreated: Number(existingFeedSnap.data()?.totalListingsCreated || 0),
      totalListingsUpdated: Number(existingFeedSnap.data()?.totalListingsUpdated || 0),
      nextSyncAt: writePayload.status === 'active' && writePayload.nightlySyncEnabled
        ? computeNextDealerFeedSyncAt(syncFrequency)
        : null,
      createdAt: legacy.createdAt || existingFeedSnap.data()?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedFromLegacyProfile: true,
      legacyProfileId: normalizedProfileId,
    },
    { merge: true }
  );

  const nextFeedSnap = await feedRef.get();
  return { id: nextFeedSnap.id, data: nextFeedSnap.data() || {}, ref: feedRef, migrated: true };
}

async function migrateLegacyDealerFeedProfilesForSeller(sellerUid) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  if (!normalizedSellerUid) return [];

  const legacySnap = await getDb()
    .collection('dealerFeedProfiles')
    .where('sellerUid', '==', normalizedSellerUid)
    .get();

  const migratedFeeds = [];
  for (const legacyDoc of legacySnap.docs) {
    const migrated = await ensureDealerFeedFromLegacyProfile(legacyDoc.id, legacyDoc.data() || {});
    if (migrated) {
      migratedFeeds.push(migrated);
    }
  }

  return migratedFeeds;
}

function timestampValueToSortableMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }
  if (typeof value?.seconds === 'number') {
    return value.seconds * 1000;
  }

  const date = value instanceof Date ? value : new Date(value);
  const millis = date.getTime();
  return Number.isNaN(millis) ? 0 : millis;
}

async function listDealerFeedAuditEntries(feedId, limitCount = 20) {
  const normalizedFeedId = normalizeNonEmptyString(feedId);
  if (!normalizedFeedId) return [];

  const auditSnap = await getDb()
    .collection('dealerAuditLogs')
    .where('dealerFeedId', '==', normalizedFeedId)
    .get();

  return auditSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((left, right) => timestampValueToSortableMs(right.timestamp) - timestampValueToSortableMs(left.timestamp))
    .slice(0, Math.max(1, Math.min(Number(limitCount || 20), 100)));
}

async function listDealerFeedIngestLogs({ sellerUid = '', limitCount = 20 } = {}) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  let queryRef = getDb().collection('dealerFeedIngestLogs');
  if (normalizedSellerUid) {
    queryRef = queryRef.where('sellerUid', '==', normalizedSellerUid);
  }

  const logsSnap = await queryRef.get();
  return logsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((left, right) => {
      const rightValue = timestampValueToSortableMs(right.createdAt || right.processedAt);
      const leftValue = timestampValueToSortableMs(left.createdAt || left.processedAt);
      return rightValue - leftValue;
    })
    .slice(0, Math.max(1, Math.min(Number(limitCount || 20), 100)));
}

async function listDealerFeedsForSeller(sellerUid) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  if (!normalizedSellerUid) {
    return [];
  }

  await migrateLegacyDealerFeedProfilesForSeller(normalizedSellerUid);
  const feedsSnap = await getDb()
    .collection('dealerFeeds')
    .where('sellerUid', '==', normalizedSellerUid)
    .get();

  return feedsSnap.docs
    .map((doc) => serializeDealerFeed(doc.id, doc.data() || {}))
    .sort((left, right) => timestampValueToSortableMs(right.updatedAt || right.createdAt) - timestampValueToSortableMs(left.updatedAt || left.createdAt));
}

async function buildDealerFeedBootstrapPayload({ sellerUid = '', limitCount = 20 } = {}) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  const errors = {};
  const degradedSections = [];
  let firestoreQuotaLimited = false;

  const [feedsResult, logsResult] = await Promise.allSettled([
    listDealerFeedsForSeller(normalizedSellerUid),
    listDealerFeedIngestLogs({
      sellerUid: normalizedSellerUid,
      limitCount,
    }),
  ]);

  const feeds =
    feedsResult.status === 'fulfilled'
      ? feedsResult.value
      : [];
  if (feedsResult.status !== 'fulfilled') {
    degradedSections.push('feeds');
    if (isFirestoreQuotaExceeded(feedsResult.reason)) {
      firestoreQuotaLimited = true;
      errors.feeds = 'Dealer feed profiles are temporarily unavailable because the Firestore daily read quota is exhausted.';
    } else {
      throw feedsResult.reason;
    }
  }

  const logs =
    logsResult.status === 'fulfilled'
      ? logsResult.value
      : [];
  if (logsResult.status !== 'fulfilled') {
    degradedSections.push('logs');
    if (isFirestoreQuotaExceeded(logsResult.reason)) {
      firestoreQuotaLimited = true;
      errors.logs = 'Dealer feed ingest logs are temporarily unavailable because the Firestore daily read quota is exhausted.';
    } else {
      throw logsResult.reason;
    }
  }

  return {
    feeds,
    logs,
    partial: degradedSections.length > 0,
    degradedSections: Array.from(new Set(degradedSections)),
    errors,
    firestoreQuotaLimited,
    fetchedAt: new Date().toISOString(),
  };
}

function getDealerFeedApiKeyFromRequest(req) {
  const headerValue = Array.isArray(req.headers['x-dealer-api-key'])
    ? req.headers['x-dealer-api-key'][0]
    : req.headers['x-dealer-api-key'];
  const authorizationValue = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const bearerToken = String(authorizationValue || '').trim().match(/^Bearer\s+(.+)$/i)?.[1] || '';
  return normalizeNonEmptyString(headerValue || bearerToken || req.body?.apiKey || req.query?.apiKey);
}

function getRawRequestBodyText(req) {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    return req.rawBody.toString('utf8');
  }
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }
  return '';
}

async function getDealerFeedStats(feedId) {
  const normalizedFeedId = normalizeNonEmptyString(feedId);
  if (!normalizedFeedId) {
    return {
      totalListingsActive: 0,
      totalListingsDeleted: 0,
      totalListingsSynced: 0,
    };
  }

  const snapshot = await getDb().collection('dealerListings').where('dealerFeedId', '==', normalizedFeedId).get();
  let totalListingsActive = 0;
  let totalListingsDeleted = 0;

  snapshot.docs.forEach((doc) => {
    const status = normalizeNonEmptyString(doc.data()?.status, 'active').toLowerCase();
    if (status === 'deleted' || status === 'archived') {
      totalListingsDeleted += 1;
    } else {
      totalListingsActive += 1;
    }
  });

  return {
    totalListingsActive,
    totalListingsDeleted,
    totalListingsSynced: snapshot.size,
  };
}

async function logDealerFeedAction({
  dealerFeedId,
  sellerUid,
  action,
  details,
  errorMessage = '',
  itemsProcessed = 0,
  itemsSucceeded = 0,
  itemsFailed = 0,
  metadata = null,
}) {
  const normalizedFeedId = normalizeNonEmptyString(dealerFeedId);
  if (!normalizedFeedId) return;

  await getDb().collection('dealerAuditLogs').add({
    dealerFeedId: normalizedFeedId,
    sellerUid: normalizeNonEmptyString(sellerUid),
    action: normalizeNonEmptyString(action, 'SYNC_EVENT'),
    details: normalizeNonEmptyString(details, 'Dealer feed event'),
    errorMessage: normalizeNonEmptyString(errorMessage),
    itemsProcessed: Number(itemsProcessed || 0),
    itemsSucceeded: Number(itemsSucceeded || 0),
    itemsFailed: Number(itemsFailed || 0),
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function computeDealerFeedEquipmentHash(item) {
  const serial = normalizeNonEmptyString(item?.serialNumber || item?.serial || item?.vin).toLowerCase();
  if (serial) {
    return sha256Hex(`serial:${serial}`);
  }

  const stock = normalizeNonEmptyString(item?.stockNumber || item?.externalId).toLowerCase();
  const make = normalizeNonEmptyString(item?.make || item?.manufacturer, 'unknown').toLowerCase();
  const model = normalizeNonEmptyString(item?.model, 'unknown').toLowerCase();
  const year = String(item?.year || '').trim();
  const condition = normalizeNonEmptyString(item?.condition, 'used').toLowerCase();
  const location = normalizeNonEmptyString(item?.location).toLowerCase();
  const hours = Number.isFinite(Number(item?.hours)) ? String(Math.round(Number(item.hours))) : '';
  const price = Number.isFinite(Number(item?.price)) ? String(Math.round(Number(item.price))) : '';

  return sha256Hex([make, model, year, stock, condition, hours, price, location].filter(Boolean).join('|'));
}

function buildDealerWebhookSignature(secret, timestamp, rawBody) {
  return createHmac('sha256', String(secret || '').trim())
    .update(`${String(timestamp || '').trim()}.${String(rawBody || '')}`)
    .digest('hex');
}

function parseDealerSignatureHeader(rawHeaderValue) {
  const value = String(rawHeaderValue || '').trim();
  if (!value) return '';
  if (!value.includes('=')) return value;
  return value.split('=').pop().trim();
}

function signaturesMatch(left, right) {
  const normalizedLeft = String(left || '').trim();
  const normalizedRight = String(right || '').trim();
  if (!normalizedLeft || !normalizedRight || normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(normalizedLeft), Buffer.from(normalizedRight));
  } catch (_) {
    return false;
  }
}

function computeNextDealerFeedSyncAt(syncFrequency, baseDate = new Date()) {
  const frequency = normalizeDealerFeedSyncFrequency(syncFrequency, 'daily');
  if (frequency === 'manual') return null;

  const next = new Date(baseDate.getTime());
  if (frequency === 'hourly') {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
  }

  return admin.firestore.Timestamp.fromDate(next);
}

function normalizeResolvedDealerFeedItem(item, fieldMapping = []) {
  if (!isPlainObject(item)) return null;

  const mappedValues = applyDealerFieldMapping(item, fieldMapping);
  const getMappedValue = (path) => getNestedValue(mappedValues, path);

  const externalId = normalizeNonEmptyString(
    getMappedValue('externalId') ||
      findFeedValue(item, new Set(['externalid', 'id', 'stocknumber', 'stock', 'sku', 'serialnumber', 'serial', 'vin'])),
    buildFallbackDealerFeedExternalId(item)
  );

  const manufacturer = normalizeNonEmptyString(
    getMappedValue('manufacturer') ||
      getMappedValue('make') ||
      findFeedValue(item, new Set(['manufacturer', 'make', 'brand'])),
    'Unknown'
  );
  const model = normalizeNonEmptyString(getMappedValue('model') || findFeedValue(item, new Set(['model'])), 'Unknown');
  const title = normalizeNonEmptyString(
    getMappedValue('title') || findFeedValue(item, new Set(['title', 'name', 'headline'])),
    `${manufacturer} ${model}`.trim()
  );
  const category = normalizeNonEmptyString(
    getMappedValue('category') || findFeedValue(item, new Set(['category', 'department', 'type'])),
    'Uncategorized'
  );
  const subcategory = normalizeNonEmptyString(
    getMappedValue('subcategory') || findFeedValue(item, new Set(['subcategory', 'class'])),
    category
  );
  const imageSource =
    getMappedValue('imageUrls') ||
    getMappedValue('images') ||
    findFeedValue(item, new Set(['images', 'imageurls', 'gallery', 'photos', 'media'])) ||
    item;
  const images = Array.from(new Set(flattenFeedImageUrls(imageSource))).slice(0, 40);
  const imageTitles = normalizeDelimitedStringList(
    getMappedValue('imageTitles') ||
      findFeedValue(item, new Set(['imagetitles', 'phototitles', 'captions', 'imagecaptions'])),
    40
  );
  const videoUrls = normalizeDelimitedUrlList(
    getMappedValue('videoUrls') ||
      findFeedValue(item, new Set(['videourls', 'videos', 'videolinks', 'video'])),
    6
  );
  const detectedSpecs = findFeedValue(item, new Set(['specs', 'specifications', 'attributes']));
  const mappedSpecs = getMappedValue('specs');
  const prefixedSpecs = extractPrefixedSpecValues(item);

  return {
    externalId,
    title,
    price: toFiniteNumberOrUndefined(
      getMappedValue('price') || findFeedValue(item, new Set(['price', 'saleprice', 'askingprice', 'listprice', 'amount']))
    ),
    currency: normalizeNonEmptyString(
      getMappedValue('currency') || findFeedValue(item, new Set(['currency', 'currencycode'])),
      'USD'
    ),
    year: toFiniteNumberOrUndefined(getMappedValue('year') || findFeedValue(item, new Set(['year']))),
    manufacturer,
    make: normalizeNonEmptyString(getMappedValue('make'), manufacturer),
    model,
    category,
    subcategory,
    condition: normalizeNonEmptyString(
      getMappedValue('condition') || findFeedValue(item, new Set(['condition', 'status'])),
      'Used'
    ),
    location: normalizeNonEmptyString(
      getMappedValue('location') || findFeedValue(item, new Set(['location', 'citystate', 'yardlocation', 'address'])),
      ''
    ),
    imageUrls: images,
    imageTitles,
    videoUrls,
    description: normalizeNonEmptyString(
      getMappedValue('description') || findFeedValue(item, new Set(['description', 'comments', 'details', 'remark', 'remarks'])),
      ''
    ),
    hours: toFiniteNumberOrUndefined(
      getMappedValue('hours') || findFeedValue(item, new Set(['hours', 'hourmeter', 'machinehours']))
    ),
    stockNumber: normalizeNonEmptyString(
      getMappedValue('stockNumber') || findFeedValue(item, new Set(['stocknumber', 'stock', 'stockid', 'sku'])),
      ''
    ),
    serialNumber: normalizeNonEmptyString(
      getMappedValue('serialNumber') || findFeedValue(item, new Set(['serialnumber', 'serial', 'vin'])),
      ''
    ),
    dealerSourceUrl: normalizeNonEmptyString(
      getMappedValue('dealerSourceUrl') ||
        getMappedValue('sourceUrl') ||
        findFeedValue(item, new Set(['sourceurl', 'source_url', 'url', 'link', 'permalink', 'landingpage'])),
      ''
    ),
    specs: {
      ...(isPlainObject(detectedSpecs) ? detectedSpecs : {}),
      ...(isPlainObject(mappedSpecs) ? mappedSpecs : {}),
      ...prefixedSpecs,
    },
  };
}

function parseDealerFeedPayload(rawInput, sourceType = 'auto', fieldMapping = []) {
  const payloadText = String(rawInput || '').trim();
  if (!payloadText) {
    throw new Error('Feed payload is empty.');
  }

  const normalizedType = normalizeNonEmptyString(sourceType, 'auto').toLowerCase();
  const parsers = normalizedType === 'json'
    ? ['json']
    : normalizedType === 'xml'
      ? ['xml']
      : normalizedType === 'csv'
        ? ['csv']
        : inferDealerFeedParserOrder(payloadText);

  let lastError = null;
  for (const parserType of parsers) {
    try {
      const parsed = parserType === 'json'
        ? JSON.parse(payloadText)
        : parserType === 'csv'
          ? parseDealerFeedCsvText(payloadText)
          : dealerFeedXmlParser.parse(payloadText);
      const items = extractDealerFeedItemsFromPayload(parsed)
        .map((item) => normalizeResolvedDealerFeedItem(item, fieldMapping))
        .filter((item) => item && item.externalId && item.title);

      if (items.length === 0) {
        throw new Error('No listing items were found in the supplied feed payload.');
      }

      return {
        detectedType: parserType,
        items,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to parse dealer feed payload.');
}

function isPrivateIpv4Host(hostname) {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return false;
  const octets = hostname.split('.').map((part) => Number(part));
  if (octets[0] === 10 || octets[0] === 127) return true;
  if (octets[0] === 192 && octets[1] === 168) return true;
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  return false;
}

function validateDealerFeedUrl(feedUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(String(feedUrl || '').trim());
  } catch (_) {
    throw new Error('Feed URL is invalid.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http and https feed URLs are supported.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (!hostname || ['localhost', '0.0.0.0'].includes(hostname) || hostname.endsWith('.local') || isPrivateIpv4Host(hostname)) {
    throw new Error('Local and private-network feed URLs are not allowed.');
  }

  return parsedUrl.toString();
}

function normalizeDealerFeedListing(item, sellerUid, sourceName, options = {}) {
  const existingListing = isPlainObject(options?.existingListing) ? options.existingListing : {};
  const feed = isPlainObject(options?.feed) ? options.feed : {};
  const externalId = normalizeNonEmptyString(
    item?.externalId || existingListing?.externalSource?.externalId || existingListing?.externalId
  );
  const make = normalizeNonEmptyString(item?.make || item?.manufacturer || existingListing?.make || existingListing?.manufacturer, 'Unknown');
  const model = normalizeNonEmptyString(item?.model || existingListing?.model, 'Unknown');
  const title = normalizeNonEmptyString(item?.title || existingListing?.title, `${make} ${model}`.trim());
  const category = normalizeNonEmptyString(item?.category || existingListing?.category, 'Uncategorized');
  const subcategory = normalizeNonEmptyString(item?.subcategory || existingListing?.subcategory, category);
  const year = normalizeFiniteNumber(item?.year, normalizeFiniteNumber(existingListing?.year, new Date().getFullYear()));
  const price = Math.max(0, normalizeFiniteNumber(item?.price, normalizeFiniteNumber(existingListing?.price, 0)));
  const hours = Math.max(0, normalizeFiniteNumber(item?.hours, normalizeFiniteNumber(existingListing?.hours, 0)));
  const images = normalizeImageUrls(item?.images || item?.imageUrls || existingListing?.images);
  const imageTitles = sanitizeListingCreateImageTitles(item?.imageTitles || existingListing?.imageTitles, images.length);
  const videoUrls = normalizeDelimitedUrlList(item?.videoUrls || existingListing?.videoUrls, 6);
  const stockNumber = normalizeNonEmptyString(item?.stockNumber || existingListing?.stockNumber);
  const serialNumber = normalizeNonEmptyString(item?.serialNumber || existingListing?.serialNumber);
  const dealerSourceUrl = normalizeNonEmptyString(
    item?.dealerSourceUrl || item?.sourceUrl || existingListing?.externalSource?.dealerSourceUrl
  );
  // New dealer inventory must always enter review before it becomes public.
  // Existing approved listings can retain their approved/paid state on later syncs.
  const autoPublish = false;
  const existingStatus = normalizeNonEmptyString(existingListing?.status).toLowerCase();
  const existingApprovalStatus = normalizeNonEmptyString(existingListing?.approvalStatus).toLowerCase();
  const existingPaymentStatus = normalizeNonEmptyString(existingListing?.paymentStatus).toLowerCase();
  const existingExternalSource = isPlainObject(existingListing?.externalSource) ? existingListing.externalSource : {};
  const dealerFeedId = normalizeNonEmptyString(options?.dealerFeedId || existingExternalSource?.dealerFeedId || feed.id);

  let status = autoPublish ? 'active' : 'pending';
  if (existingStatus === 'sold') {
    status = 'sold';
  } else if (!autoPublish && ['active', 'pending'].includes(existingStatus)) {
    status = existingStatus;
  }

  let approvalStatus = autoPublish ? 'approved' : 'pending';
  if (existingApprovalStatus === 'rejected') {
    approvalStatus = 'rejected';
  } else if (!autoPublish && ['approved', 'pending'].includes(existingApprovalStatus)) {
    approvalStatus = existingApprovalStatus;
  }

  let paymentStatus = autoPublish ? 'paid' : 'pending';
  if (existingPaymentStatus === 'failed') {
    paymentStatus = 'failed';
  } else if (!autoPublish && ['paid', 'pending'].includes(existingPaymentStatus)) {
    paymentStatus = existingPaymentStatus;
  }

  return {
    sellerUid,
    sellerId: sellerUid,
    title,
    category,
    subcategory,
    make,
    manufacturer: make,
    model,
    year,
    price,
    currency: normalizeNonEmptyString(item?.currency || existingListing?.currency, 'USD'),
    hours,
    condition: normalizeNonEmptyString(item?.condition || existingListing?.condition, 'Used'),
    description: normalizeNonEmptyString(item?.description || existingListing?.description, `${title} imported from dealer feed.`),
    location: normalizeNonEmptyString(item?.location || existingListing?.location, 'Unknown'),
    images,
    imageTitles,
    videoUrls,
    stockNumber,
    serialNumber,
    specs: {
      ...(isPlainObject(existingListing?.specs) ? existingListing.specs : {}),
      ...(item?.specs && typeof item.specs === 'object' ? item.specs : {}),
    },
    featured: Boolean(existingListing?.featured),
    views: Number(existingListing?.views || 0),
    leads: Number(existingListing?.leads || 0),
    status,
    approvalStatus,
    paymentStatus,
    publishedAt: autoPublish && !existingListing?.publishedAt
      ? admin.firestore.FieldValue.serverTimestamp()
      : existingListing?.publishedAt || null,
    marketValueEstimate: existingListing?.marketValueEstimate ?? null,
    sellerVerified: existingListing?.sellerVerified !== false,
    qualityValidated: existingListing?.qualityValidated !== false,
    dataSource: 'dealer',
    dealerFeedId: dealerFeedId || null,
    externalSource: {
      ...existingExternalSource,
      sourceName,
      externalId,
      dealerFeedId: dealerFeedId || null,
      dealerSourceUrl,
      stockNumber,
      serialNumber,
      importedAt: existingExternalSource?.importedAt || admin.firestore.FieldValue.serverTimestamp(),
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function fetchDealerFeedPayloadFromSource({ rawInput, feedUrl, requestedType = 'auto' }) {
  let payloadText = normalizeNonEmptyString(rawInput);
  let parseType = normalizeNonEmptyString(requestedType, 'auto').toLowerCase();

  if (!payloadText && !feedUrl) {
    throw new Error('Either rawInput or feedUrl is required.');
  }

  if (feedUrl) {
    const safeUrl = validateDealerFeedUrl(feedUrl);
    const response = await fetch(safeUrl, {
      headers: {
        Accept: 'application/json, application/xml, text/xml, text/csv, application/csv, text/plain;q=0.8, */*;q=0.5',
        'User-Agent': 'ForestryEquipmentSalesDealerFeedResolver/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status}.`);
    }

    payloadText = await response.text();
    if (parseType === 'auto') {
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('xml')) parseType = 'xml';
      else if (contentType.includes('json')) parseType = 'json';
      else if (contentType.includes('csv')) parseType = 'csv';
    }
  }

  return { payloadText, parseType };
}

async function resolveDealerFeedSource(params) {
  const sourceName = normalizeNonEmptyString(params?.sourceName, 'dealer_feed');
  const requestedType = normalizeNonEmptyString(params?.sourceType, 'auto').toLowerCase();
  const fieldMapping = normalizeDealerFieldMapping(params?.fieldMapping);
  const { payloadText, parseType } = await fetchDealerFeedPayloadFromSource({
    rawInput: params?.rawInput,
    feedUrl: params?.feedUrl,
    requestedType,
  });

  const resolved = parseDealerFeedPayload(payloadText, parseType, fieldMapping);
  const limitedItems = resolved.items.slice(0, 1000);

  return {
    ok: true,
    sourceName,
    detectedType: resolved.detectedType,
    itemCount: limitedItems.length,
    items: limitedItems,
    preview: limitedItems.slice(0, 25).map((item) => ({
      externalId: item.externalId,
      title: item.title,
      manufacturer: item.manufacturer,
      model: item.model,
      price: item.price || null,
      category: item.category,
    })),
  };
}

async function upsertEquipmentDuplicateRecord({
  equipmentHash,
  listingId,
  listing,
  dealerFeedId = '',
  dealerName = '',
  dealerSourceUrl = '',
  status = 'active',
}) {
  const normalizedHash = normalizeNonEmptyString(equipmentHash);
  const normalizedListingId = normalizeNonEmptyString(listingId);
  if (!normalizedHash || !normalizedListingId) return;

  const duplicateRef = getDb().collection('equipmentDuplicates').doc(normalizedHash);
  const duplicateSnap = await duplicateRef.get();
  const duplicateData = duplicateSnap.data() || {};
  const existingVariants = Array.isArray(duplicateData.variants) ? duplicateData.variants : [];
  const variantTimestamp = admin.firestore.Timestamp.now();
  const nextVariant = {
    listingId: normalizedListingId,
    source: 'dealer',
    price: Math.max(0, normalizeFiniteNumber(listing?.price, 0)),
    dealerFeedId: normalizeNonEmptyString(dealerFeedId),
    dealerName: normalizeNonEmptyString(dealerName),
    dealerSourceUrl: normalizeNonEmptyString(dealerSourceUrl),
    status: normalizeNonEmptyString(status, 'active'),
    syncedAt: variantTimestamp,
  };
  const variants = [
    ...existingVariants.filter((variant) => normalizeNonEmptyString(variant?.listingId) !== normalizedListingId),
    nextVariant,
  ].slice(-100);

  await duplicateRef.set(
    {
      equipmentHash: normalizedHash,
      make: normalizeNonEmptyString(listing?.make || listing?.manufacturer),
      model: normalizeNonEmptyString(listing?.model),
      year: toFiniteNumberOrUndefined(listing?.year) || null,
      engine: normalizeNonEmptyString(listing?.specs?.engine),
      horsepower: toFiniteNumberOrUndefined(listing?.specs?.horsepower) || null,
      transmission: normalizeNonEmptyString(listing?.specs?.transmission),
      variants,
      primaryListing: normalizeNonEmptyString(duplicateData.primaryListing, normalizedListingId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function processDealerListing({
  item,
  sellerUid,
  sourceName,
  feedId = '',
  feed = null,
  dryRun = false,
}) {
  const normalizedItem = normalizeResolvedDealerFeedItem(item, feed?.fieldMapping || []);
  if (!normalizedItem?.externalId) {
    return {
      action: 'skip',
      skipped: true,
      externalId: '',
      title: normalizeNonEmptyString(item?.title || normalizedItem?.title, 'Untitled Listing'),
    };
  }

  const normalizedFeedId = normalizeNonEmptyString(feedId);
  const dealerListingId = normalizedFeedId
    ? buildDealerFeedListingDocId(normalizedFeedId, normalizedItem.externalId)
    : '';
  const dealerListingRef = dealerListingId ? getDb().collection('dealerListings').doc(dealerListingId) : null;
  const dealerListingSnap = dealerListingRef ? await dealerListingRef.get() : null;
  const dealerListingData = dealerListingSnap?.data() || {};
  const existingListingId = normalizeNonEmptyString(dealerListingData.timberequipListingId);

  let listingRef = existingListingId ? getDb().collection('listings').doc(existingListingId) : null;
  let existingListingSnap = listingRef ? await listingRef.get() : null;

  if (!existingListingSnap?.exists) {
    const existingListingQuery = await getDb()
      .collection('listings')
      .where('externalSource.externalId', '==', normalizedItem.externalId)
      .limit(10)
      .get();
    const fallbackDoc = existingListingQuery.docs.find((doc) => {
      const data = doc.data() || {};
      const existingSellerUid = normalizeNonEmptyString(data.sellerUid || data.sellerId);
      const existingFeedId = normalizeNonEmptyString(data?.externalSource?.dealerFeedId || data?.dealerFeedId);
      return existingSellerUid === sellerUid && (!normalizedFeedId || !existingFeedId || existingFeedId === normalizedFeedId);
    });
    if (fallbackDoc) {
      listingRef = fallbackDoc.ref;
      existingListingSnap = fallbackDoc;
    }
  }

  const existingListing = existingListingSnap?.exists ? existingListingSnap.data() || {} : {};
  const normalizedListing = normalizeDealerFeedListing(normalizedItem, sellerUid, sourceName, {
    existingListing,
    feed,
    dealerFeedId: normalizedFeedId,
  });
  const equipmentHash = computeDealerFeedEquipmentHash(normalizedListing);
  const nextAction = existingListingSnap?.exists ? 'update' : 'insert';

  if (dryRun) {
    return {
      action: nextAction,
      skipped: false,
      externalId: normalizedItem.externalId,
      title: normalizedListing.title,
      equipmentHash,
      listingId: listingRef?.id || '',
      dealerListingId,
    };
  }

  if (!listingRef) {
    listingRef = getDb().collection('listings').doc();
  }

  const writePayload = {
    ...normalizedListing,
    equipmentHash,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(existingListingSnap?.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
  };

  await listingRef.set(writePayload, { merge: true });

  if (dealerListingRef) {
    await dealerListingRef.set(
      {
        dealerFeedId: normalizedFeedId,
        sellerUid,
        externalListingId: normalizedItem.externalId,
        timberequipListingId: listingRef.id,
        equipmentHash,
        status: normalizedListing.status === 'active' ? 'active' : 'archived',
        externalData: isPlainObject(item) ? item : normalizedItem,
        mappedData: normalizedListing,
        dealerSourceUrl: normalizeNonEmptyString(normalizedItem.dealerSourceUrl || normalizedListing?.externalSource?.dealerSourceUrl),
        dataSource: 'dealer',
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(dealerListingSnap?.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );
  }

  await upsertEquipmentDuplicateRecord({
    equipmentHash,
    listingId: listingRef.id,
    listing: normalizedListing,
    dealerFeedId: normalizedFeedId,
    dealerName: normalizeNonEmptyString(feed?.dealerName),
    dealerSourceUrl: normalizeNonEmptyString(normalizedItem.dealerSourceUrl || normalizedListing?.externalSource?.dealerSourceUrl),
    status: normalizedListing.status === 'active' ? 'active' : 'archived',
  });

  return {
    action: nextAction,
    skipped: false,
    externalId: normalizedItem.externalId,
    title: normalizedListing.title,
    equipmentHash,
    listingId: listingRef.id,
    dealerListingId,
  };
}

async function archiveMissingDealerFeedListings({
  feedId,
  sellerUid,
  activeExternalIds,
  dryRun = false,
}) {
  const normalizedFeedId = normalizeNonEmptyString(feedId);
  if (!normalizedFeedId) {
    return { archived: 0, archivedListingIds: [] };
  }

  const activeIds = new Set(
    Array.from(activeExternalIds || [])
      .map((value) => normalizeNonEmptyString(value))
      .filter(Boolean)
  );
  const archivedListingIds = [];
  const existingMappingsSnap = await getDb()
    .collection('dealerListings')
    .where('dealerFeedId', '==', normalizedFeedId)
    .get();

  let archived = 0;
  for (const mappingDoc of existingMappingsSnap.docs) {
    const mapping = mappingDoc.data() || {};
    const externalListingId = normalizeNonEmptyString(mapping.externalListingId);
    const mappingStatus = normalizeNonEmptyString(mapping.status, 'active').toLowerCase();
    if (!externalListingId || activeIds.has(externalListingId) || ['archived', 'deleted'].includes(mappingStatus)) {
      continue;
    }

    archived += 1;
    const listingId = normalizeNonEmptyString(mapping.timberequipListingId);
    if (listingId) {
      archivedListingIds.push(listingId);
    }

    if (dryRun) {
      continue;
    }

    await mappingDoc.ref.set(
      {
        status: 'archived',
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (listingId) {
      const listingRef = getDb().collection('listings').doc(listingId);
      const listingSnap = await listingRef.get();
      if (listingSnap.exists) {
        const listingData = listingSnap.data() || {};
        await applyListingLifecycleAction({
          listingRef,
          listingId,
          listing: listingData,
          action: 'archive',
          actorUid: 'dealer-feed-sync',
          actorRole: 'system',
          reason: `Dealer feed ${normalizedFeedId} no longer included this listing`,
        });
        await listingRef.set(
          {
            externalSource: {
              ...(isPlainObject(listingData.externalSource) ? listingData.externalSource : {}),
              archivedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );

        await upsertEquipmentDuplicateRecord({
          equipmentHash: normalizeNonEmptyString(mapping.equipmentHash || listingData.equipmentHash),
          listingId,
          listing: listingData,
          dealerFeedId: normalizedFeedId,
          dealerName: normalizeNonEmptyString(mapping.dealerName),
          dealerSourceUrl: normalizeNonEmptyString(mapping.dealerSourceUrl || listingData?.externalSource?.dealerSourceUrl),
          status: 'archived',
        });
      }
    }
  }

  return { archived, archivedListingIds };
}

async function ingestDealerFeedItems(params) {
  const actorUid = normalizeNonEmptyString(params?.actorUid, 'dealer-feed-sync');
  const actorRole = normalizeNonEmptyString(params?.actorRole, 'system');
  const sellerUid = normalizeNonEmptyString(params?.sellerUid || params?.dealerId);
  const sourceName = normalizeNonEmptyString(params?.sourceName, 'dealer_feed');
  const dryRun = Boolean(params?.dryRun);
  const normalizedFeedId = normalizeNonEmptyString(params?.feedId);
  const fullSync = params?.fullSync !== false;
  const items = Array.isArray(params?.items) ? params.items : [];
  const persistLog = params?.persistLog !== false;
  const syncContext = params?.syncContext && typeof params.syncContext === 'object' ? params.syncContext : null;
  let feed = params?.feed && typeof params.feed === 'object' ? params.feed : null;

  if (!sellerUid) {
    throw new Error('dealerId could not be resolved.');
  }
  if (items.length === 0) {
    throw new Error('items[] is required.');
  }
  if (items.length > 1000) {
    throw new Error('Maximum 1000 items per ingest request.');
  }

  if (normalizedFeedId && !feed) {
    const feedSnap = await getDb().collection('dealerFeeds').doc(normalizedFeedId).get();
    if (!feedSnap.exists) {
      throw new Error('Dealer feed configuration could not be found.');
    }
    feed = { id: feedSnap.id, ...feedSnap.data() };
  }

  const normalizedItems = items
    .map((item) => normalizeResolvedDealerFeedItem(item, feed?.fieldMapping || params?.fieldMapping || []))
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    throw new Error('No valid dealer feed items were supplied.');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  const preview = [];
  const activeExternalIds = new Set();

  for (let index = 0; index < normalizedItems.length; index += 1) {
    const item = normalizedItems[index];
    try {
      const result = await processDealerListing({
        item,
        sellerUid,
        sourceName,
        feedId: normalizedFeedId,
        feed,
        dryRun,
      });

      if (result.skipped || !result.externalId) {
        skipped += 1;
        if (preview.length < 50) {
          preview.push({
            externalId: result.externalId || '',
            title: result.title,
            action: 'skip',
          });
        }
        continue;
      }

      activeExternalIds.add(result.externalId);
      const nextAction = result.action === 'update' ? 'update' : 'insert';
      if (preview.length < 50) {
        preview.push({
          externalId: result.externalId,
          title: result.title,
          action: nextAction,
        });
      }

      if (nextAction === 'insert') {
        created += 1;
      } else {
        updated += 1;
      }
    } catch (err) {
      errors.push({ index, reason: err?.message || 'Unknown ingest error' });
    }
  }

  let archived = 0;
  if (normalizedFeedId && fullSync) {
    const archiveResult = await archiveMissingDealerFeedListings({
      feedId: normalizedFeedId,
      sellerUid,
      activeExternalIds,
      dryRun,
    });
    archived = archiveResult.archived;
  }

  const errorMessages = errors.map(({ index, reason }) => `Item ${index + 1}: ${reason}`);
  const processed = normalizedItems.length;
  const upserted = created + updated;

  const logPayload = {
    actorUid,
    actorRole,
    sellerUid,
    dealerId: sellerUid,
    sourceName,
    dryRun,
    feedId: normalizedFeedId || null,
    totalReceived: normalizedItems.length,
    processed,
    created,
    updated,
    upserted,
    skipped,
    archived,
    errorCount: errors.length,
    errors: errorMessages.slice(0, 100),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(syncContext ? { syncContext } : {}),
  };

  if (!dryRun && persistLog) {
    await getDb().collection('dealerFeedIngestLogs').add(logPayload);
  }

  if (normalizedFeedId && !dryRun) {
    const stats = await getDealerFeedStats(normalizedFeedId);
    await getDb().collection('dealerFeeds').doc(normalizedFeedId).set(
      {
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSyncStatus: errors.length > 0 ? 'partial' : 'success',
        lastSyncMessage: `Processed ${processed} listings, upserted ${upserted}, archived ${archived}.`,
        totalListingsActive: stats.totalListingsActive,
        totalListingsDeleted: stats.totalListingsDeleted,
        totalListingsSynced: stats.totalListingsSynced,
        totalListingsCreated: admin.firestore.FieldValue.increment(created),
        totalListingsUpdated: admin.firestore.FieldValue.increment(updated),
        nextSyncAt: feed?.status === 'active' && feed?.nightlySyncEnabled
          ? computeNextDealerFeedSyncAt(feed?.syncFrequency || 'daily')
          : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await logDealerFeedAction({
      dealerFeedId: normalizedFeedId,
      sellerUid,
      action: errors.length > 0 ? 'SYNC_PARTIAL' : 'SYNC_SUCCESS',
      details: `Processed ${processed} listings from ${sourceName}.`,
      errorMessage: errorMessages[0] || '',
      itemsProcessed: processed,
      itemsSucceeded: upserted,
      itemsFailed: errors.length + skipped,
      metadata: {
        sourceName,
        created,
        updated,
        archived,
        dryRun,
        ...(syncContext ? { syncContext } : {}),
      },
    });
  }

  return {
    ok: true,
    processed,
    upserted,
    skipped,
    archived,
    errors: errorMessages,
    dryRun,
    preview,
    created,
    updated,
    dealerId: sellerUid,
    sellerUid,
    sourceName,
  };
}

function buildPublicDealerListingPayload(listingId, rawListing, dealer) {
  const listing = rawListing || {};
  const images = Array.isArray(listing.images)
    ? listing.images.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];

  return {
    id: listingId,
    sellerUid: dealer.sellerUid,
    title: normalizeNonEmptyString(listing.title, 'Equipment Listing'),
    category: normalizeNonEmptyString(listing.category, 'Uncategorized'),
    subcategory: normalizeNonEmptyString(listing.subcategory),
    make: normalizeNonEmptyString(listing.make || listing.manufacturer),
    manufacturer: normalizeNonEmptyString(listing.manufacturer || listing.make),
    model: normalizeNonEmptyString(listing.model),
    year: toFiniteNumberOrUndefined(listing.year) || null,
    price: toFiniteNumberOrUndefined(listing.price) || 0,
    currency: normalizeNonEmptyString(listing.currency, 'USD'),
    hours: toFiniteNumberOrUndefined(listing.hours) || null,
    condition: normalizeNonEmptyString(listing.condition, 'Used'),
    location: normalizeNonEmptyString(listing.location),
    description: normalizeNonEmptyString(listing.description),
    featured: Boolean(listing.featured),
    images,
    image: images[0] || '',
    listingUrl: buildCanonicalListingUrl(listingId, listing),
    dealerUrl: `${APP_URL}/dealers/${encodeURIComponent(dealer.publicId)}`,
    stockNumber: normalizeNonEmptyString(listing.stockNumber),
    externalId: normalizeNonEmptyString(listing?.externalSource?.externalId),
    sourceName: normalizeNonEmptyString(listing?.externalSource?.sourceName),
    updatedAt: timestampValueToIso(listing.updatedAt),
    createdAt: timestampValueToIso(listing.createdAt),
  };
}

function isPublicDealerListingVisible(listing) {
  const approvalStatus = normalizeNonEmptyString(listing?.approvalStatus, '').toLowerCase();
  const paymentStatus = normalizeNonEmptyString(listing?.paymentStatus, '').toLowerCase();
  const status = normalizeNonEmptyString(listing?.status, 'active').toLowerCase();

  if (approvalStatus !== 'approved') return false;
  if (paymentStatus !== 'paid') return false;
  if (['sold', 'expired', 'archived', 'pending'].includes(status)) return false;

  const expiresAt = listing?.expiresAt;
  const expiresAtMs = typeof expiresAt?.toMillis === 'function'
    ? expiresAt.toMillis()
    : expiresAt?.seconds
      ? expiresAt.seconds * 1000
      : expiresAt
        ? new Date(expiresAt).getTime()
        : null;

  return !expiresAtMs || Number.isNaN(expiresAtMs) || expiresAtMs > Date.now();
}

async function resolvePublicDealer(identity) {
  const normalizedIdentity = normalizeNonEmptyString(identity);
  if (!normalizedIdentity) {
    throw new Error('Dealer identifier is required.');
  }

  const db = getDb();
  let sellerSnap = await db.collection('storefronts').doc(normalizedIdentity).get();

  if (!sellerSnap.exists) {
    const storefrontSlugSnapshot = await db.collection('storefronts').where('storefrontSlug', '==', normalizedIdentity).limit(1).get();
    if (!storefrontSlugSnapshot.empty) {
      sellerSnap = storefrontSlugSnapshot.docs[0];
    }
  }

  if (!sellerSnap.exists) {
    sellerSnap = await db.collection('users').doc(normalizedIdentity).get();
  }

  if (!sellerSnap.exists) {
    const userSlugSnapshot = await db.collection('users').where('storefrontSlug', '==', normalizedIdentity).limit(1).get();
    if (!userSlugSnapshot.empty) {
      sellerSnap = userSlugSnapshot.docs[0];
    }
  }

  if (!sellerSnap.exists) {
    throw new Error('Dealer storefront was not found.');
  }

  const data = sellerSnap.data() || {};
  const sellerUid = sellerSnap.id;
  const publicId = normalizeNonEmptyString(data.storefrontSlug, sellerUid);

  return {
    sellerUid,
    publicId,
    storefrontSlug: publicId,
    storefrontName: normalizeNonEmptyString(data.storefrontName || data.displayName, 'Dealer Storefront'),
    storefrontTagline: normalizeNonEmptyString(data.storefrontTagline),
    storefrontDescription: normalizeNonEmptyString(data.storefrontDescription || data.about),
    location: normalizeNonEmptyString(data.location),
    phone: normalizeNonEmptyString(data.phone || data.phoneNumber),
    email: normalizeNonEmptyString(data.email),
    website: normalizeNonEmptyString(data.website),
    logo: normalizeNonEmptyString(data.logo || data.photoURL),
  };
}

async function getPublicDealerListings(sellerUid, options = {}) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  const limitCount = Math.max(1, Math.min(Number(options.limitCount || 24), 100));
  const featuredOnly = Boolean(options.featuredOnly);

  const [sellerUidSnapshot, sellerIdSnapshot] = await Promise.all([
    getDb().collection('listings').where('sellerUid', '==', normalizedSellerUid).get(),
    getDb().collection('listings').where('sellerId', '==', normalizedSellerUid).get(),
  ]);

  const seen = new Set();
  const listings = [...sellerUidSnapshot.docs, ...sellerIdSnapshot.docs]
    .filter((docSnap) => {
      if (seen.has(docSnap.id)) return false;
      seen.add(docSnap.id);
      return true;
    })
    .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() || {} }))
    .filter(({ data }) => isPublicDealerListingVisible(data))
    .filter(({ data }) => !featuredOnly || Boolean(data.featured))
    .sort((left, right) => {
      const featuredDelta = Number(Boolean(right.data.featured)) - Number(Boolean(left.data.featured));
      if (featuredDelta !== 0) return featuredDelta;
      const leftTime = new Date(timestampValueToIso(left.data.createdAt) || 0).getTime() || 0;
      const rightTime = new Date(timestampValueToIso(right.data.createdAt) || 0).getTime() || 0;
      return rightTime - leftTime;
    })
    .slice(0, limitCount);

  return listings;
}

function renderDealerEmbedHtml({ dealer, listings, feedUrl, featuredOnly }) {
  const cards = listings.map((listing) => {
    const priceValue = Number(listing.price || 0);
    const formattedPrice = priceValue > 0
      ? `${listing.currency || 'USD'} ${priceValue.toLocaleString()}`
      : 'Request Price';
    const location = listing.location || 'Location available on request';
    const subtitle = [listing.year, listing.make || listing.manufacturer, listing.model].filter(Boolean).join(' ');
    const badge = listing.featured ? '<span class="te-badge">Featured</span>' : '';
    const image = listing.image
      ? `<img src="${listing.image}" alt="${listing.title}" loading="lazy" />`
      : '<div class="te-image-placeholder">Inventory</div>';

    return `
      <article class="te-card">
        <a class="te-card-link" href="${listing.listingUrl}" target="_blank" rel="noopener noreferrer">
          <div class="te-image-wrap">${image}</div>
          <div class="te-card-body">
            <div class="te-card-top">${badge}<span class="te-category">${listing.category || 'Equipment'}</span></div>
            <h3>${listing.title}</h3>
            <p class="te-subtitle">${subtitle || 'Equipment listing'}</p>
            <div class="te-meta">
              <span>${formattedPrice}</span>
              <span>${location}</span>
            </div>
          </div>
        </a>
      </article>
    `;
  }).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${dealer.storefrontName} Inventory</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f2; color: #171717; }
      .te-shell { padding: 20px; }
      .te-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; margin-bottom: 20px; align-items: end; }
      .te-title { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
      .te-copy { margin: 8px 0 0; font-size: 13px; color: #525252; max-width: 720px; }
      .te-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      .te-button { appearance: none; border: 1px solid #171717; background: #171717; color: white; text-decoration: none; padding: 10px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .te-button.te-secondary { background: transparent; color: #171717; }
      .te-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
      .te-card { background: white; border: 1px solid #d4d4d4; min-height: 100%; }
      .te-card-link { color: inherit; text-decoration: none; display: flex; flex-direction: column; min-height: 100%; }
      .te-image-wrap { aspect-ratio: 4 / 3; background: #e5e5e5; overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .te-image-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .te-image-placeholder { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #737373; }
      .te-card-body { padding: 16px; display: grid; gap: 10px; }
      .te-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
      .te-badge { display: inline-flex; padding: 4px 8px; background: #d97706; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
      .te-category { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #737373; }
      h3 { margin: 0; font-size: 18px; line-height: 1.2; }
      .te-subtitle { margin: 0; font-size: 12px; color: #525252; }
      .te-meta { display: grid; gap: 6px; font-size: 12px; font-weight: 700; }
      .te-empty { padding: 32px; background: white; border: 1px dashed #a3a3a3; font-size: 13px; color: #525252; }
      @media (max-width: 640px) { .te-shell { padding: 16px; } .te-title { font-size: 20px; } }
    </style>
  </head>
  <body>
    <div class="te-shell">
      <header class="te-header">
        <div>
          <h1 class="te-title">${dealer.storefrontName}${featuredOnly ? ' Featured Inventory' : ' Inventory'}</h1>
          <p class="te-copy">${dealer.storefrontDescription || dealer.storefrontTagline || 'Live inventory syndicated from Forestry Equipment Sales DealerOS.'}</p>
        </div>
        <div class="te-actions">
          <a class="te-button" href="${APP_URL}/dealers/${encodeURIComponent(dealer.publicId)}" target="_blank" rel="noopener noreferrer">View Dealer Page</a>
          <a class="te-button te-secondary" href="${feedUrl}" target="_blank" rel="noopener noreferrer">JSON Feed</a>
        </div>
      </header>
      ${listings.length > 0 ? `<section class="te-grid">${cards}</section>` : '<div class="te-empty">No inventory is currently available for this dealer feed.</div>'}
    </div>
  </body>
</html>`;
}

function listingMatchesSavedSearch(listing, savedSearch) {
  const filters = savedSearch.filters || {};
  const listingText = [listing.title, listing.category, listing.subcategory, listing.make, listing.manufacturer, listing.model, listing.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const locationParts = String(listing.location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const listingCountry = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
  const listingState = locationParts.length > 1 ? locationParts[locationParts.length - 2] : '';

  if (filters.q && !listingText.includes(normalize(filters.q))) return false;
  if (filters.category && normalize(listing.category) !== normalize(filters.category)) return false;
  if (filters.subcategory && normalize(listing.subcategory) !== normalize(filters.subcategory)) return false;
  if (filters.manufacturer && ![listing.make, listing.manufacturer, listing.brand].some((value) => normalize(value) === normalize(filters.manufacturer))) return false;
  if (filters.model && !includesNormalized(listing.model, filters.model)) return false;
  if (filters.condition && normalize(listing.condition) !== normalize(filters.condition)) return false;
  if (filters.state && !includesNormalized(listingState, filters.state)) return false;
  if (filters.country && !includesNormalized(listingCountry, filters.country)) return false;

  const minPrice = Number(filters.minPrice || 0);
  const maxPrice = Number(filters.maxPrice || 0);
  const minYear = Number(filters.minYear || 0);
  const maxYear = Number(filters.maxYear || 0);
  const minHours = Number(filters.minHours || 0);
  const maxHours = Number(filters.maxHours || 0);

  if (minPrice && Number(listing.price || 0) < minPrice) return false;
  if (maxPrice && Number(listing.price || 0) > maxPrice) return false;
  if (minYear && Number(listing.year || 0) < minYear) return false;
  if (maxYear && Number(listing.year || 0) > maxYear) return false;
  if (minHours && Number(listing.hours || 0) < minHours) return false;
  if (maxHours && Number(listing.hours || 0) > maxHours) return false;

  return true;
}

function listingLooselyMatchesSavedSearch(listing, savedSearch) {
  const filters = savedSearch.filters || {};
  if (listingMatchesSavedSearch(listing, savedSearch)) return false;

  const locationParts = String(listing.location || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const listingCountry = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
  const listingState = locationParts.length > 1 ? locationParts[locationParts.length - 2] : '';
  const listingText = [listing.title, listing.category, listing.subcategory, listing.make, listing.manufacturer, listing.model, listing.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (filters.category && normalize(listing.category) !== normalize(filters.category)) return false;
  if (filters.subcategory && normalize(listing.subcategory) !== normalize(filters.subcategory)) return false;
  if (filters.manufacturer && ![listing.make, listing.manufacturer, listing.brand].some((value) => normalize(value) === normalize(filters.manufacturer))) return false;
  if (filters.condition && normalize(listing.condition) !== normalize(filters.condition)) return false;
  if (filters.state && !includesNormalized(listingState, filters.state)) return false;
  if (filters.country && !includesNormalized(listingCountry, filters.country)) return false;

  const hasIdentityFilter = Boolean(filters.category || filters.subcategory || filters.manufacturer || filters.model || filters.q);
  if (!hasIdentityFilter) return false;

  const qSimilar = !filters.q || listingText.includes(normalize(filters.q));
  const modelSimilar = !filters.model || includesNormalized(listing.model, filters.model);
  return qSimilar || modelSimilar || Boolean(filters.category || filters.subcategory || filters.manufacturer);
}

function formatListingMoney(listing, explicitPrice) {
  return `${listing.currency || 'USD'} ${Number(explicitPrice ?? listing.price ?? 0).toLocaleString()}`;
}

async function getSavedSearchDisplayName(savedSearch) {
  let displayName = 'there';
  if (!savedSearch.userUid) return displayName;

  const userSnap = await getDb().collection('users').doc(savedSearch.userUid).get();
  if (userSnap.exists) {
    displayName = userSnap.data().displayName || displayName;
  }

  return displayName;
}

async function getOptionalEmailUserContext(userUid, cache = new Map()) {
  const normalizedUid = normalizeNonEmptyString(userUid);
  if (!normalizedUid) {
    return {
      displayName: 'there',
      email: '',
      emailNotificationsEnabled: true,
    };
  }

  if (cache.has(normalizedUid)) {
    return cache.get(normalizedUid);
  }

  const userSnap = await getDb().collection('users').doc(normalizedUid).get();
  const userData = userSnap.exists ? (userSnap.data() || {}) : {};
  const context = {
    displayName: normalizeNonEmptyString(userData.displayName, 'there'),
    email: normalizeNonEmptyString(userData.email).toLowerCase(),
    emailNotificationsEnabled: userData.emailNotificationsEnabled !== false,
  };

  cache.set(normalizedUid, context);
  return context;
}

/**
 * Deliver webhook notifications to all active subscriptions for a dealer.
 * Fire-and-forget: failures are logged but never throw.
 */
async function deliverDealerWebhooks(sellerUid, eventType, listingId, listingData) {
  if (!sellerUid) return;
  try {
    const snap = await getDb()
      .collection('dealerWebhookSubscriptions')
      .where('dealerUid', '==', sellerUid)
      .where('active', '==', true)
      .get();
    if (snap.empty) return;

    const payload = JSON.stringify({
      event: eventType,
      listingId,
      listing: {
        title: listingData.title || '',
        price: listingData.price || 0,
        status: listingData.status || 'active',
        make: listingData.make || listingData.manufacturer || '',
        model: listingData.model || '',
        year: listingData.year || null,
        condition: listingData.condition || '',
        location: listingData.location || '',
      },
      timestamp: new Date().toISOString(),
    });

    const deliveries = [];
    snap.forEach((doc) => {
      const sub = doc.data() || {};
      if (!sub.callbackUrl) return;
      if (Array.isArray(sub.events) && sub.events.length > 0 && !sub.events.includes(eventType)) return;
      const signature = createHmac('sha256', sub.secret || '').update(payload).digest('hex');
      deliveries.push(
        fetch(sub.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-FES-Signature': `sha256=${signature}`,
            'X-FES-Event': eventType,
          },
          body: payload,
          signal: AbortSignal.timeout(10000),
        })
          .then(async (resp) => {
            if (resp.ok) {
              await getDb().collection('dealerWebhookSubscriptions').doc(doc.id).update({
                lastDeliveryAt: admin.firestore.FieldValue.serverTimestamp(),
                failureCount: 0,
              });
            } else {
              const newFailCount = (sub.failureCount || 0) + 1;
              const updateData = {
                lastDeliveryAt: admin.firestore.FieldValue.serverTimestamp(),
                failureCount: newFailCount,
              };
              if (newFailCount >= 10) updateData.active = false;
              await getDb().collection('dealerWebhookSubscriptions').doc(doc.id).update(updateData);
              logger.warn('Webhook delivery failed', { subId: doc.id, status: resp.status, failureCount: newFailCount });
            }
          })
          .catch(async (err) => {
            const newFailCount = (sub.failureCount || 0) + 1;
            const updateData = { failureCount: newFailCount };
            if (newFailCount >= 10) updateData.active = false;
            await getDb().collection('dealerWebhookSubscriptions').doc(doc.id).update(updateData);
            logger.warn('Webhook delivery error', { subId: doc.id, error: err.message, failureCount: newFailCount });
          })
      );
    });
    await Promise.allSettled(deliveries);
  } catch (error) {
    logger.warn('deliverDealerWebhooks failed', { sellerUid, eventType, error: error.message });
  }
}

async function notifyMatchingSavedSearches(listingId, listing) {
  const listingUrl = buildCanonicalListingUrl(listingId, listing);
  const listingPrice = formatListingMoney(listing);
  const searchSnap = await getDb().collection('savedSearches').where('status', '==', 'active').get();
  const userContextCache = new Map();

  if (searchSnap.empty) return;

  await Promise.all(
    searchSnap.docs.map(async (searchDoc) => {
      const savedSearch = searchDoc.data();
      const recipient = savedSearch.alertEmail;
      if (!recipient) return;
      const userContext = await getOptionalEmailUserContext(savedSearch.userUid, userContextCache);
      if (savedSearch.userUid && userContext.emailNotificationsEnabled === false) return;
      const unsubscribeUrl = buildEmailUnsubscribeUrl({
        uid: savedSearch.userUid,
        email: userContext.email || recipient,
        scope: 'optional',
      });

      const exactMatch = listingMatchesSavedSearch(listing, savedSearch);
      const similarMatch = listingLooselyMatchesSavedSearch(listing, savedSearch);

      if (savedSearch.alertPreferences?.newListingAlerts && exactMatch) {
        const emailPayload = templates.newMatchingListing({
          displayName: userContext.displayName,
          searchName: savedSearch.name || 'Saved Search',
          listingTitle: listing.title || 'New Equipment Listing',
          listingUrl,
          listingPrice,
          location: listing.location || 'Unknown',
          unsubscribeUrl,
        });

        await sendEmail({ to: recipient, ...emailPayload });
        return;
      }

      if (savedSearch.alertPreferences?.restockSimilarAlerts && similarMatch) {
        const emailPayload = templates.similarListingRestocked({
          displayName: userContext.displayName,
          searchName: savedSearch.name || 'Saved Search',
          listingTitle: listing.title || 'Equipment Listing',
          listingUrl,
          listingPrice,
          location: listing.location || 'Unknown',
          unsubscribeUrl,
        });

        await sendEmail({ to: recipient, ...emailPayload });
      }
    })
  );
}

async function notifySavedSearchPriceDrop(listingId, before, after) {
  const listingUrl = buildCanonicalListingUrl(listingId, after);
  const previousPrice = formatListingMoney(after, before.price);
  const currentPrice = formatListingMoney(after, after.price);
  const searchSnap = await getDb().collection('savedSearches').where('status', '==', 'active').get();
  const userContextCache = new Map();

  if (searchSnap.empty) return;

  await Promise.all(
    searchSnap.docs.map(async (searchDoc) => {
      const savedSearch = searchDoc.data();
      if (!savedSearch.alertPreferences?.priceDropAlerts) return;
      if (!savedSearch.alertEmail) return;
      if (!listingMatchesSavedSearch(after, savedSearch)) return;
      const userContext = await getOptionalEmailUserContext(savedSearch.userUid, userContextCache);
      if (savedSearch.userUid && userContext.emailNotificationsEnabled === false) return;

      const emailPayload = templates.matchingListingPriceDrop({
        displayName: userContext.displayName,
        searchName: savedSearch.name || 'Saved Search',
        listingTitle: after.title || 'Equipment Listing',
        listingUrl,
        previousPrice,
        currentPrice,
        location: after.location || 'Unknown',
        unsubscribeUrl: buildEmailUnsubscribeUrl({
          uid: savedSearch.userUid,
          email: userContext.email || savedSearch.alertEmail,
          scope: 'optional',
        }),
      });

      await sendEmail({ to: savedSearch.alertEmail, ...emailPayload });
    })
  );
}

async function notifySavedSearchSoldStatus(listingId, listing) {
  const listingUrl = buildCanonicalListingUrl(listingId, listing);
  const searchSnap = await getDb().collection('savedSearches').where('status', '==', 'active').get();
  const userContextCache = new Map();

  if (searchSnap.empty) return;

  await Promise.all(
    searchSnap.docs.map(async (searchDoc) => {
      const savedSearch = searchDoc.data();
      if (!savedSearch.alertPreferences?.soldStatusAlerts) return;
      if (!savedSearch.alertEmail) return;
      if (!listingMatchesSavedSearch(listing, savedSearch)) return;
      const userContext = await getOptionalEmailUserContext(savedSearch.userUid, userContextCache);
      if (savedSearch.userUid && userContext.emailNotificationsEnabled === false) return;

      const emailPayload = templates.matchingListingSold({
        displayName: userContext.displayName,
        searchName: savedSearch.name || 'Saved Search',
        listingTitle: listing.title || 'Equipment Listing',
        listingUrl,
        location: listing.location || 'Unknown',
        unsubscribeUrl: buildEmailUnsubscribeUrl({
          uid: savedSearch.userUid,
          email: userContext.email || savedSearch.alertEmail,
          scope: 'optional',
        }),
      });

      await sendEmail({ to: savedSearch.alertEmail, ...emailPayload });
    })
  );
}

const THUMB_MAX_BYTES = 50 * 1024;       // 50KB thumbnails (card grids)
const DETAIL_MAX_BYTES = 120 * 1024;     // 120KB detail images (listing pages)
const THUMB_MAX_WIDTH = 480;
const DETAIL_MAX_WIDTH = 1600;

const AVIF_QUALITIES = [60, 55, 50, 45, 40, 35, 30, 25];

function buildFirebaseDownloadUrl(bucket, path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

function resolveStorageBucketName() {
  const explicitBucket = normalizeNonEmptyString(
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.STORAGE_BUCKET
  );
  if (explicitBucket) return explicitBucket;

  const rawFirebaseConfig = normalizeNonEmptyString(process.env.FIREBASE_CONFIG);
  if (rawFirebaseConfig) {
    try {
      const parsed = JSON.parse(rawFirebaseConfig);
      const configuredBucket = normalizeNonEmptyString(parsed?.storageBucket);
      if (configuredBucket) return configuredBucket;
    } catch (error) {
      logger.warn(`Unable to parse FIREBASE_CONFIG for storage bucket resolution: ${error.message}`);
    }
  }

  const projectId = normalizeNonEmptyString(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.PROJECT_ID);
  if (projectId) {
    return `${projectId}.firebasestorage.app`;
  }

  return 'mobile-app-equipment-sales.firebasestorage.app';
}

// ── Watermark compositing ───────────────────────────────────────────────────
const WATERMARK_PATH = require('node:path').join(__dirname, 'watermark.png');
let _watermarkBuffer = null;

async function getWatermarkBuffer() {
  if (!_watermarkBuffer) {
    try {
      _watermarkBuffer = require('node:fs').readFileSync(WATERMARK_PATH);
    } catch (err) {
      logger.warn('Watermark file not found – images will not be watermarked.', err.message);
    }
  }
  return _watermarkBuffer;
}

/**
 * Composite the brand watermark onto an image buffer.
 * Places an upright watermark at ~9 % of image width, ~28 % opacity,
 * in the bottom-right corner with a small margin.
 */
async function applyWatermark(imageBuffer, opacity = 0.28) {
  const wmSource = await getWatermarkBuffer();
  if (!wmSource) return imageBuffer;

  try {
    const meta = await sharp(imageBuffer).metadata();
    const imgWidth = meta.width || 800;
    const imgHeight = meta.height || 600;

    const wmWidth = Math.max(Math.round(imgWidth * 0.09), 24);
    const margin = Math.round(imgWidth * 0.04);

    const resizedWatermark = await sharp(wmSource)
      .resize({ width: wmWidth, fit: 'inside', withoutEnlargement: false })
      .ensureAlpha()
      .composite([{
        input: Buffer.from(
          `<svg width="${wmWidth}" height="${wmWidth}"><rect width="100%" height="100%" fill-opacity="0"/></svg>`
        ),
        blend: 'dest-in',
      }])
      .png()
      .toBuffer();

    // Apply opacity by reducing alpha channel
    const wmMeta = await sharp(resizedWatermark).metadata();
    const wmH = wmMeta.height || wmWidth;
    const opacityWatermark = await sharp(resizedWatermark)
      .ensureAlpha()
      .raw()
      .toBuffer()
      .then((rawBuf) => {
        for (let i = 3; i < rawBuf.length; i += 4) {
          rawBuf[i] = Math.round(rawBuf[i] * opacity);
        }
        return sharp(rawBuf, { raw: { width: wmMeta.width || wmWidth, height: wmH, channels: 4 } })
          .png()
          .toBuffer();
      });

    const left = Math.max(imgWidth - wmWidth - margin, 0);
    const top = Math.max(imgHeight - wmH - margin, 0);

    return sharp(imageBuffer)
      .composite([{ input: opacityWatermark, left, top }])
      .toBuffer();
  } catch (err) {
    logger.warn('Watermark compositing failed – returning unwatermarked image.', err.message);
    return imageBuffer;
  }
}

async function compressToAvifTarget(inputBuffer, width, targetBytes, watermarkOpacity = 0.28) {
  const widthSteps = [width, Math.round(width * 0.85), Math.round(width * 0.72), Math.round(width * 0.6), Math.round(width * 0.5), Math.round(width * 0.4)]
    .filter((candidate, index, array) => candidate > 0 && array.indexOf(candidate) === index);
  let best = null;

  for (const targetWidth of widthSteps) {
    for (const quality of AVIF_QUALITIES) {
      const resized = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: targetWidth,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();

      const watermarked = await applyWatermark(resized, watermarkOpacity);

      const output = await sharp(watermarked)
        .avif({ quality })
        .toBuffer();

      best = output;
      if (output.byteLength <= targetBytes) {
        return output;
      }
    }
  }

  throw new Error(`Unable to compress source image under ${Math.round(targetBytes / 1024)}KB AVIF target.`);
}

exports.generateListingImageVariants = onObjectFinalized(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 120,
    bucket: resolveStorageBucketName(),
  },
  async (event) => {
    const object = event.data;
    const bucketName = object.bucket;
    const filePath = object.name || '';
    const contentType = object.contentType || '';

    if (!bucketName || !filePath) {
      logger.warn('Missing storage event data.');
      return;
    }

    // Process only source images to avoid loops.
    // Expected path: listings/{listingId}/images/source/{filename}
    const sourceMatch = filePath.match(/^listings\/([^/]+)\/images\/source\/(.+)$/);
    if (!sourceMatch) return;

    if (!contentType.startsWith('image/')) {
      logger.info(`Skipping non-image file: ${filePath}`);
      return;
    }

    const listingId = sourceMatch[1];
    const originalName = sourceMatch[2];
    const outputBaseName = originalName.replace(/\.[^/.]+$/, '');

    const detailPath = `listings/${listingId}/images/detail/${outputBaseName}.avif`;
    const thumbPath = `listings/${listingId}/images/thumb/${outputBaseName}.avif`;

    const bucket = admin.storage().bucket(bucketName);
    const sourceFile = bucket.file(filePath);

    logger.info(`Generating variants for ${filePath}`);

    const [sourceBuffer] = await sourceFile.download();

    const [detailBuffer, thumbBuffer] = await Promise.all([
      compressToAvifTarget(sourceBuffer, DETAIL_MAX_WIDTH, DETAIL_MAX_BYTES, 0.28),
      compressToAvifTarget(sourceBuffer, THUMB_MAX_WIDTH, THUMB_MAX_BYTES, 0.08),
    ]);

    const detailToken = randomUUID();
    const thumbToken = randomUUID();

    await Promise.all([
      bucket.file(detailPath).save(detailBuffer, {
        metadata: {
          contentType: 'image/avif',
          metadata: {
            firebaseStorageDownloadTokens: detailToken,
            variant: 'detail',
            listingId,
            sourcePath: filePath,
          },
        },
      }),
      bucket.file(thumbPath).save(thumbBuffer, {
        metadata: {
          contentType: 'image/avif',
          metadata: {
            firebaseStorageDownloadTokens: thumbToken,
            variant: 'thumbnail',
            listingId,
            sourcePath: filePath,
          },
        },
      }),
    ]);

    const detailUrl = buildFirebaseDownloadUrl(bucketName, detailPath, detailToken);
    const thumbnailUrl = buildFirebaseDownloadUrl(bucketName, thumbPath, thumbToken);

    const listingRef = getDb().collection('listings').doc(listingId);
    await listingRef.set(
      {
        images: admin.firestore.FieldValue.arrayUnion(detailUrl),
        imageVariants: admin.firestore.FieldValue.arrayUnion({
          detailUrl,
          thumbnailUrl,
          format: 'image/avif',
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info(`Finished variants for listing ${listingId}`);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRIGGER: New inquiry → notify seller + confirm to buyer
// Firestore path: inquiries/{inquiryId}
// ─────────────────────────────────────────────────────────────────────────────
exports.onInquiryCreated = onDocumentCreated(
  {
    document: 'inquiries/{inquiryId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const inquiry = event.data?.data();
    if (!inquiry) return;

    const { sellerUid, sellerId, listingId, message, buyerName, buyerEmail, buyerPhone } = inquiry;
    const sellerDocId = sellerUid || sellerId || '';

    // Look up listing and seller in parallel
    const [listingSnap, sellerSnap] = await Promise.all([
      getDb().collection('listings').doc(listingId).get(),
      sellerDocId ? getDb().collection('users').doc(sellerDocId).get() : Promise.resolve(null),
    ]);

    if (!listingSnap.exists || !sellerSnap?.exists) {
      logger.warn(`onInquiryCreated: listing or seller not found for inquiry ${event.params.inquiryId}; proceeding with fallback email payload.`);
    }

    const listing = listingSnap.exists ? listingSnap.data() : {};
    const seller = sellerSnap?.exists ? sellerSnap.data() : {};
    const listingTitle = listing.title || 'Equipment Listing';
    const sellerName = seller.displayName || 'Seller';
    const sellerEmail = seller.email;
    const listingUrl = buildCanonicalListingUrl(listingId, listing);

    const errors = [];

    // Notify seller
    if (sellerEmail) {
      try {
        const { subject, html } = templates.leadNotification({
          sellerName,
          buyerName: buyerName || 'A buyer',
          buyerEmail: buyerEmail || '',
          buyerPhone: buyerPhone || '',
          listingTitle,
          listingUrl,
          message: message || '',
        });
        await sendEmail({ to: sellerEmail, subject, html });
      } catch (err) {
        errors.push(`seller email failed: ${err.message}`);
        logger.error('Failed to send lead notification to seller', err);
      }
    }

    // Confirm to buyer
    if (buyerEmail) {
      try {
        const { subject, html } = templates.inquiryConfirmation({
          buyerName: buyerName || 'Buyer',
          listingTitle,
          listingUrl,
          sellerName,
          inquiryType: inquiry.type || 'Inquiry',
        });
        await sendEmail({ to: buyerEmail, subject, html });
      } catch (err) {
        errors.push(`buyer confirmation failed: ${err.message}`);
        logger.error('Failed to send inquiry confirmation to buyer', err);
      }
    }

    // Copy admin inbox on all inquiry leads (inquiry, financing, shipping, etc.)
    try {
      const adminPayload = templates.adminInquiryAlert({
        inquiryType: inquiry.type || 'Inquiry',
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        listingTitle,
        listingUrl,
        message: message || '',
        sellerUid: sellerDocId || '',
      });
      await sendEmail({ to: getAdminRecipients(), ...adminPayload });
    } catch (err) {
      errors.push(`admin inquiry copy failed: ${err.message}`);
      logger.error('Failed to send inquiry admin copy', err);
    }

    if (errors.length) {
      logger.warn(`onInquiryCreated partial failure: ${errors.join(', ')}`);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRIGGER: New user → send welcome + email verification
// Auth trigger via Firestore user profile creation
// Firestore path: users/{uid}
// ─────────────────────────────────────────────────────────────────────────────
exports.onUserProfileCreated = onDocumentCreated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM],
  },
  async (event) => {
    const profile = event.data?.data();
    if (!profile?.email) return;
    if (String(profile.onboardingSource || '').trim() === 'managed_invite') return;

    try {
      await sendVerificationEmailMessage({
        email: profile.email,
        displayName: profile.displayName || 'there',
      });
    } catch (err) {
      logger.error('Failed to send welcome email', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TRIGGER: Listing status change → notify seller on approval or rejection
// Firestore path: listings/{listingId}
// ─────────────────────────────────────────────────────────────────────────────
exports.onListingStatusChanged = onDocumentUpdated(
  {
    document: 'listings/{listingId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM],
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const prevApproval = before.approvalStatus;
    const newApproval = after.approvalStatus;
    const previousStatus = normalize(before.status || 'active');
    const newStatus = normalize(after.status || 'active');
    const beforePrice = Number(before.price || 0);
    const afterPrice = Number(after.price || 0);

    if (newApproval === 'approved' && prevApproval !== 'approved') {
      await notifyMatchingSavedSearches(event.params.listingId, after);
    }

    if (previousStatus !== 'sold' && newStatus === 'sold') {
      await notifySavedSearchSoldStatus(event.params.listingId, after);
      void deliverDealerWebhooks(after.sellerUid || after.sellerId, 'listing.sold', event.params.listingId, after);
    }

    if (previousStatus !== 'deleted' && newStatus === 'deleted') {
      void deliverDealerWebhooks(after.sellerUid || after.sellerId, 'listing.deleted', event.params.listingId, after);
    }

    if (
      newApproval === 'approved' &&
      prevApproval === 'approved' &&
      previousStatus !== 'sold' &&
      newStatus !== 'sold' &&
      beforePrice > 0 &&
      afterPrice > 0 &&
      afterPrice < beforePrice
    ) {
      await notifySavedSearchPriceDrop(event.params.listingId, before, after);
    }

    /* Deliver webhook for any approved listing update */
    if (newApproval === 'approved' && newStatus !== 'sold' && newStatus !== 'deleted') {
      void deliverDealerWebhooks(after.sellerUid || after.sellerId, 'listing.updated', event.params.listingId, after);
    }

    if (prevApproval === newApproval) return;
    if (newApproval !== 'approved' && newApproval !== 'rejected') return;

    const sellerUid = after.sellerUid || after.sellerId;
    if (!sellerUid) return;

    const sellerSnap = await getDb().collection('users').doc(sellerUid).get();
    if (!sellerSnap.exists) return;

    const seller = sellerSnap.data();
    const sellerEmail = seller.email;
    if (!sellerEmail) return;

    const listingTitle = after.title || 'Your Listing';
    const listingUrl = buildCanonicalListingUrl(event.params.listingId, after);

    try {
      let emailPayload;
      if (newApproval === 'approved') {
        emailPayload = templates.listingApproved({ sellerName: seller.displayName || 'Seller', listingTitle, listingUrl });
      } else {
        const editUrl = `${APP_URL}/sell?edit=${event.params.listingId}`;
        emailPayload = templates.listingRejected({
          sellerName: seller.displayName || 'Seller',
          listingTitle,
          reason: after.rejectionReason || '',
          editUrl,
        });
      }
      await sendEmail({ to: sellerEmail, ...emailPayload });
    } catch (err) {
      logger.error('Failed to send listing status email', err);
    }
  }
);

exports.onListingCreated = onDocumentCreated(
  {
    document: 'listings/{listingId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM],
  },
  async (event) => {
    const listing = event.data?.data();
    if (!listing) return;

    const sellerUid = String(listing.sellerUid || listing.sellerId || '').trim();
    let seller = null;
    if (sellerUid) {
      const sellerSnap = await getDb().collection('users').doc(sellerUid).get();
      if (sellerSnap.exists) {
        seller = sellerSnap.data();
      }
    }

    const sellerEmail = String(seller?.email || '').trim();
    const sellerName = String(seller?.displayName || 'Seller').trim();
    const listingTitle = String(listing.title || 'Your Listing').trim();
    const listingUrl = buildCanonicalListingUrl(event.params.listingId, listing);
    const dashboardUrl = `${APP_URL}/profile?tab=${encodeURIComponent('My Listings')}`;

    if (listing.approvalStatus === 'approved') {
      await notifyMatchingSavedSearches(event.params.listingId, listing);
      void deliverDealerWebhooks(sellerUid, 'listing.created', event.params.listingId, listing);

      if (sellerEmail) {
        try {
          const payload = templates.listingApproved({
            sellerName,
            listingTitle,
            listingUrl,
          });
          await sendEmail({ to: sellerEmail, ...payload });
        } catch (error) {
          logger.error('Failed to send listing approved email on create', error);
        }
      }
      return;
    }

    if (sellerEmail) {
      try {
        const payload = templates.listingSubmitted({
          sellerName,
          listingTitle,
          dashboardUrl,
          reviewEta: 'Typically within 1 business day',
        });
        await sendEmail({ to: sellerEmail, ...payload });
      } catch (error) {
        logger.error('Failed to send listing submitted email', error);
      }
    }
  }
);

exports.syncPublicSeoReadModelOnListingWrite = onDocumentWritten(
  {
    document: 'listings/{listingId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
  },
  async (event) => {
    const listingId = event.params.listingId;
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;
    invalidateMarketplaceCaches();

    const [seoResult, governanceResult] = await Promise.allSettled([
      syncPublicSeoForListingChange({
        listingId,
        before,
        after,
      }),
      syncListingGovernanceArtifactsForWrite({
        db: getDb(),
        listingId,
        before,
        after,
      }),
    ]);

    if (seoResult.status === 'rejected') {
      logger.error('Failed to sync public SEO read model for listing write', {
        listingId,
        error: seoResult.reason instanceof Error ? seoResult.reason.message : seoResult.reason,
      });
    }

    if (governanceResult.status === 'rejected') {
      logger.error('Failed to sync listing governance artifacts for listing write', {
        listingId,
        error: governanceResult.reason instanceof Error ? governanceResult.reason.message : governanceResult.reason,
      });
    }
  }
);

exports.syncPublicSeoReadModelOnUserWrite = onDocumentWritten(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
  },
  async (event) => {
    try {
      await syncPublicSeoForSellerChange(event.params.uid);
    } catch (error) {
      logger.error('Failed to sync public SEO read model for user write', {
        uid: event.params.uid,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
);

exports.syncPublicSeoReadModelOnStorefrontWrite = onDocumentWritten(
  {
    document: 'storefronts/{uid}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
  },
  async (event) => {
    try {
      await syncPublicSeoForSellerChange(event.params.uid);
    } catch (error) {
      logger.error('Failed to sync public SEO read model for storefront write', {
        uid: event.params.uid,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
);

exports.rebuildPublicSeoReadModelScheduled = onSchedule(
  {
    schedule: 'every 6 hours',
    region: 'us-central1',
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async () => {
    try {
      await rebuildPublicSeoReadModel();
    } catch (error) {
      logger.error('Failed to rebuild public SEO read model on schedule', error);
    }
  }
);

exports.onMediaKitRequestCreated = onDocumentCreated(
  {
    document: 'mediaKitRequests/{requestId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const request = event.data?.data();
    if (!request) return;

    const adminPayload = templates.mediaKitRequest({
      requesterName: request.firstName || '',
      companyName: request.companyName || '',
      email: request.email || '',
      phone: request.phone || '',
      notes: request.notes || '',
    });

    await sendEmail({ to: getAdminRecipients(), ...adminPayload });

    if (request.email) {
      try {
        const confirmationPayload = templates.mediaKitRequestConfirmation({
          requesterName: request.firstName || 'there',
          requestType: request.requestType || 'media-kit',
          companyName: request.companyName || '',
          supportUrl: `${APP_URL}/ad-programs`,
        });

        await sendEmail({ to: request.email, ...confirmationPayload });
      } catch (error) {
        logger.error('Failed to send media kit confirmation email', error);
      }
    }
  }
);

exports.onFinancingRequestCreated = onDocumentCreated(
  {
    document: 'financingRequests/{requestId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const request = event.data?.data();
    if (!request) return;

    const payload = templates.financingRequestAdmin({
      applicantName: request.applicantName || '',
      applicantEmail: request.applicantEmail || '',
      applicantPhone: request.applicantPhone || '',
      company: request.company || '',
      requestedAmount: request.requestedAmount || null,
      listingId: request.listingId || '',
      message: request.message || '',
    });

    await sendEmail({ to: getAdminRecipients(), ...payload });

    if (request.applicantEmail) {
      try {
        const confirmationPayload = templates.financingRequestConfirmation({
          applicantName: request.applicantName || 'there',
          requestedAmount: typeof request.requestedAmount === 'number' ? request.requestedAmount : null,
          company: request.company || '',
          dashboardUrl: `${APP_URL}/profile?tab=${encodeURIComponent('Financing')}`,
        });
        await sendEmail({ to: request.applicantEmail, ...confirmationPayload });
      } catch (error) {
        logger.error('Failed to send financing confirmation email', error);
      }
    }
  }
);

exports.onContactRequestCreated = onDocumentCreated(
  {
    document: 'contactRequests/{requestId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
  },
  async (event) => {
    const request = event.data?.data();
    if (!request) return;

    const payload = templates.contactRequestAdmin({
      name: request.name || '',
      email: request.email || '',
      category: request.category || '',
      message: request.message || '',
      source: request.source || 'contact-page',
    });

    await sendEmail({ to: getAdminRecipients(), ...payload });

    if (request.email) {
      try {
        const confirmationPayload = templates.contactRequestConfirmation({
          name: request.name || 'there',
          category: request.category || 'General Support',
          supportUrl: `${APP_URL}/contact`,
        });
        await sendEmail({ to: request.email, ...confirmationPayload });
      } catch (error) {
        logger.error('Failed to send contact confirmation email', error);
      }
    }
  }
);

exports.onSubscriptionCreated = onDocumentCreated(
  {
    document: 'subscriptions/{subscriptionId}',
    database: FIRESTORE_DB_ID,
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM],
  },
  async (event) => {
    const subscription = event.data?.data();
    if (!subscription?.userUid) return;

    const userSnap = await getDb().collection('users').doc(subscription.userUid).get();
    if (!userSnap.exists) return;

    const user = userSnap.data();
    if (!user.email) return;

    const payload = templates.subscriptionCreated({
      displayName: user.displayName || 'there',
      planName: getPlanDisplayName(subscription.planId),
    });

    await sendEmail({ to: user.email, ...payload });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED: Daily check for subscriptions expiring in exactly 7 days
// ─────────────────────────────────────────────────────────────────────────────
exports.subscriptionExpiryReminder = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM],
  },
  async (_context) => {
    const now = admin.firestore.Timestamp.now();
    const in7Days = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    const in8Days = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
    );

    // Find subscriptions expiring in the next 7–8 day window (catches daily runs)
    const snap = await admin
      .firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '>=', in7Days)
      .where('currentPeriodEnd', '<', in8Days)
      .get();

    if (snap.empty) {
      logger.info('subscriptionExpiryReminder: no subscriptions expiring in 7 days');
      return;
    }

    const renewUrl = `${APP_URL}/profile#subscription`;
    const errors = [];

    await Promise.all(
      snap.docs.map(async (subDoc) => {
        const sub = subDoc.data();
        const userSnap = await getDb().collection('users').doc(sub.userUid).get();
        if (!userSnap.exists) return;

        const user = userSnap.data();
        if (!user.email) return;

        const expiryDate = sub.currentPeriodEnd
          .toDate()
          .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        try {
          const { subject, html } = templates.subscriptionExpiring({
            displayName: user.displayName || 'Seller',
            planName: getPlanDisplayName(sub.planId),
            expiryDate,
            renewUrl,
          });
          await sendEmail({ to: user.email, subject, html });
        } catch (err) {
          errors.push(err.message);
          logger.error(`Failed to send expiry reminder to ${user.email}`, err);
        }
      })
    );

    logger.info(`subscriptionExpiryReminder: processed ${snap.size} subs. Errors: ${errors.length}`);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED: Daily check for subscriptions that expired today
// ─────────────────────────────────────────────────────────────────────────────
exports.subscriptionExpiredNotice = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM],
  },
  async (_context) => {
    const now = admin.firestore.Timestamp.now();
    const yesterday = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const snap = await admin
      .firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '>=', yesterday)
      .where('currentPeriodEnd', '<', now)
      .get();

    if (snap.empty) return;

    const renewUrl = `${APP_URL}/profile#subscription`;

    await Promise.all(
      snap.docs.map(async (subDoc) => {
        const sub = subDoc.data();

        // Mark subscription as expired
        await subDoc.ref.update({ status: 'past_due' });

        const userSnap = await getDb().collection('users').doc(sub.userUid).get();
        if (!userSnap.exists) return;

        const user = userSnap.data();
        if (!user.email) return;

        try {
          const { subject, html } = templates.subscriptionExpired({
            displayName: user.displayName || 'Seller',
            planName: getPlanDisplayName(sub.planId),
            renewUrl,
          });
          await sendEmail({ to: user.email, subject, html });
        } catch (err) {
          logger.error(`Failed to send expired notice to ${user.email}`, err);
        }
      })
    );

    logger.info(`subscriptionExpiredNotice: processed ${snap.size} expired subs`);
  }
);

exports.expireListingsByDate = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
  },
  async () => {
    const now = admin.firestore.Timestamp.now();

    const snap = await getDb()
      .collection('listings')
      .where('approvalStatus', '==', 'approved')
      .where('paymentStatus', '==', 'paid')
      .where('status', '==', 'active')
      .where('expiresAt', '<=', now)
      .get();

    if (snap.empty) {
      logger.info('expireListingsByDate: no listings to expire');
      return;
    }

    for (const docSnap of snap.docs) {
      await applyListingLifecycleAction({
        listingRef: docSnap.ref,
        listingId: docSnap.id,
        listing: docSnap.data() || {},
        action: 'expire',
        actorUid: 'system',
        actorRole: 'system',
        reason: 'Automatic expiration window reached',
      });
    }
    logger.info(`expireListingsByDate: expired ${snap.size} listings`);
  }
);

exports.dealerFeedNightlySync = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'America/Chicago',
    region: 'us-central1',
  },
  async () => {
    const [feedSnap, legacySnap] = await Promise.all([
      getDb()
        .collection('dealerFeeds')
        .where('status', '==', 'active')
        .get(),
      getDb()
        .collection('dealerFeedProfiles')
        .where('nightlySyncEnabled', '==', true)
        .get(),
    ]);

    for (const legacyDoc of legacySnap.docs) {
      await ensureDealerFeedFromLegacyProfile(legacyDoc.id, legacyDoc.data() || {});
    }

    const refreshedFeedSnap = legacySnap.empty
      ? feedSnap
      : await getDb()
        .collection('dealerFeeds')
        .where('status', '==', 'active')
        .get();

    const candidateFeeds = refreshedFeedSnap.docs
      .map((doc) => ({ ref: doc.ref, id: doc.id, data: doc.data() || {} }))
      .filter(({ data }) => Boolean(data.nightlySyncEnabled) && normalizeDealerFeedStatus(data.status || 'active') === 'active');

    if (candidateFeeds.length === 0) {
      logger.info('dealerFeedNightlySync: no enabled dealer feeds found');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const feedEntry of candidateFeeds) {
      const feed = feedEntry.data || {};
      const sellerUid = normalizeNonEmptyString(feed.sellerUid);
      const sourceName = normalizeNonEmptyString(feed.sourceName, 'dealer_feed');

      if (!sellerUid) {
        failureCount += 1;
        await feedEntry.ref.set(
          {
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSyncStatus: 'failed',
            lastSyncMessage: 'sellerUid is missing from this dealer feed.',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        continue;
      }

      try {
        const resolved = await resolveDealerFeedSource({
          sourceName,
          sourceType: feed.sourceType,
          rawInput: feed.rawInput,
          feedUrl: feed.feedUrl || feed.apiEndpoint,
          fieldMapping: feed.fieldMapping,
        });

        const result = await ingestDealerFeedItems({
          actorUid: 'dealer-feed-nightly-sync',
          actorRole: 'system',
          sellerUid,
          sourceName,
          feedId: feedEntry.id,
          feed: { id: feedEntry.id, ...feed },
          dryRun: false,
          items: resolved.items,
          fullSync: true,
          persistLog: true,
          syncContext: {
            trigger: 'nightly-2am-cst',
            feedId: feedEntry.id,
          },
        });

        successCount += 1;
        await feedEntry.ref.set(
          {
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSyncStatus: 'success',
            lastSyncMessage: `Processed ${result.processed} items, upserted ${result.upserted}, archived ${result.archived || 0}.`,
            lastResolvedType: resolved.detectedType,
            nextSyncAt: computeNextDealerFeedSyncAt(feed.syncFrequency || 'daily'),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        failureCount += 1;
        logger.error(`dealerFeedNightlySync failed for feed ${feedEntry.id}`, error);
        await feedEntry.ref.set(
          {
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSyncStatus: 'failed',
            lastSyncMessage: error instanceof Error ? error.message : 'Nightly sync failed.',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        await logDealerFeedAction({
          dealerFeedId: feedEntry.id,
          sellerUid,
          action: 'SYNC_FAILED',
          details: `Nightly sync failed for ${sourceName}.`,
          errorMessage: error instanceof Error ? error.message : 'Nightly sync failed.',
          metadata: {
            trigger: 'nightly-2am-cst',
          },
        });
      }
    }

    logger.info(`dealerFeedNightlySync: completed with ${successCount} success and ${failureCount} failure feeds`);
  }
);

function createDealerPerformanceAccumulator(name = '', email = '', role = '') {
  return {
    name,
    email,
    role,
    listings: 0,
    leadForms: 0,
    calls: 0,
    connectedCalls: 0,
    qualifiedCalls: 0,
    missedCalls: 0,
    totalViews: 0,
    topMachinesMap: {},
  };
}

function updateDealerPerformanceMachineMetric(summary, listingId, fallbackTitle, updates = {}) {
  const normalizedListingId = normalizeNonEmptyString(listingId, 'unknown-listing');
  const existing = summary.topMachinesMap[normalizedListingId] || {
    listingId: normalizedListingId,
    title: normalizeNonEmptyString(fallbackTitle, normalizedListingId),
    inquiryCount: 0,
    callCount: 0,
    viewCount: 0,
  };

  existing.title = normalizeNonEmptyString(fallbackTitle, existing.title || normalizedListingId);
  existing.inquiryCount += Number(updates.inquiryCount || 0);
  existing.callCount += Number(updates.callCount || 0);
  existing.viewCount += Number(updates.viewCount || 0);
  summary.topMachinesMap[normalizedListingId] = existing;
}

function finalizeDealerPerformanceSummary(summary) {
  const topMachines = Object.values(summary.topMachinesMap || {})
    .sort((left, right) => {
      const rightScore = right.inquiryCount * 100 + right.callCount * 50 + right.viewCount;
      const leftScore = left.inquiryCount * 100 + left.callCount * 50 + left.viewCount;
      return rightScore - leftScore;
    })
    .slice(0, 5)
    .map((machine) => ({
      listingId: machine.listingId,
      title: machine.title,
      inquiryCount: machine.inquiryCount,
      callCount: machine.callCount,
      viewCount: machine.viewCount,
      count: machine.inquiryCount + machine.callCount,
    }));

  return {
    name: summary.name,
    email: summary.email,
    role: summary.role,
    listings: summary.listings,
    leadForms: summary.leadForms,
    calls: summary.calls,
    connectedCalls: summary.connectedCalls,
    qualifiedCalls: summary.qualifiedCalls,
    missedCalls: summary.missedCalls,
    totalViews: summary.totalViews,
    topMachines,
  };
}

async function buildDealerPerformanceReport({
  startDate,
  endDate,
  periodLabel,
} = {}) {
  const resolvedEndDate = endDate instanceof Date ? endDate : new Date();
  const resolvedStartDate = startDate instanceof Date
    ? startDate
    : new Date(resolvedEndDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  const normalizedPeriodLabel = normalizeNonEmptyString(
    periodLabel,
    `Last 30 Days ending ${resolvedEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
  );

  const sellerRoles = ['individual_seller', 'dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff'];
  const [usersSnap, callsSnap, inquiriesSnap, listingViewsSnap, activeListingsSnap] = await Promise.all([
    getDb().collection('users').where('role', 'in', sellerRoles).get(),
    getDb()
      .collection('calls')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(resolvedStartDate))
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(resolvedEndDate))
      .get(),
    getDb()
      .collection('inquiries')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(resolvedStartDate))
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(resolvedEndDate))
      .get(),
    getDb()
      .collection('listingViewEvents')
      .where('viewedAt', '>=', admin.firestore.Timestamp.fromDate(resolvedStartDate))
      .where('viewedAt', '<', admin.firestore.Timestamp.fromDate(resolvedEndDate))
      .get(),
    getDb()
      .collection('listings')
      .where('status', '==', 'active')
      .where('approvalStatus', '==', 'approved')
      .get(),
  ]);

  const summaryBySeller = {};
  const ensureSellerSummary = (sellerUid, profile = {}) => {
    const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
    if (!normalizedSellerUid) return null;
    if (!summaryBySeller[normalizedSellerUid]) {
      summaryBySeller[normalizedSellerUid] = createDealerPerformanceAccumulator(
        normalizeNonEmptyString(profile.name || profile.displayName, 'Seller'),
        normalizeNonEmptyString(profile.email),
        normalizeUserRole(profile.role),
      );
    }
    return summaryBySeller[normalizedSellerUid];
  };

  usersSnap.docs.forEach((userDoc) => {
    const data = userDoc.data() || {};
    ensureSellerSummary(userDoc.id, {
      name: data.displayName || data.name,
      email: data.email,
      role: data.role,
    });
  });

  activeListingsSnap.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() || {};
    const sellerUid = normalizeNonEmptyString(data.sellerUid || data.sellerId);
    const summary = ensureSellerSummary(sellerUid);
    if (!summary) return;
    summary.listings += 1;
    updateDealerPerformanceMachineMetric(summary, docSnapshot.id, normalizeNonEmptyString(data.title, docSnapshot.id));
  });

  inquiriesSnap.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() || {};
    const sellerUid = normalizeNonEmptyString(data.sellerUid || data.sellerId);
    const summary = ensureSellerSummary(sellerUid);
    if (!summary) return;

    if (normalizeNonEmptyString(data.type, 'Inquiry').toLowerCase() !== 'call') {
      summary.leadForms += 1;
    }

    updateDealerPerformanceMachineMetric(
      summary,
      normalizeNonEmptyString(data.listingId, docSnapshot.id),
      normalizeNonEmptyString(data.listingTitle, normalizeNonEmptyString(data.listingId, docSnapshot.id)),
      { inquiryCount: 1 },
    );
  });

  callsSnap.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() || {};
    const sellerUid = normalizeNonEmptyString(data.sellerUid || data.sellerId);
    const summary = ensureSellerSummary(sellerUid);
    if (!summary) return;

    const duration = toFiniteNumberOrUndefined(data.duration) || 0;
    const status = normalizeNonEmptyString(data.status).toLowerCase();

    summary.calls += 1;
    if (duration > 0 && status === 'completed') summary.connectedCalls += 1;
    if (duration >= 60) summary.qualifiedCalls += 1;
    if (['missed', 'voicemail', 'no_answer', 'no-answer'].includes(status)) summary.missedCalls += 1;

    updateDealerPerformanceMachineMetric(
      summary,
      normalizeNonEmptyString(data.listingId, docSnapshot.id),
      normalizeNonEmptyString(data.listingTitle, normalizeNonEmptyString(data.listingId, docSnapshot.id)),
      { callCount: 1 },
    );
  });

  listingViewsSnap.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() || {};
    const sellerUid = normalizeNonEmptyString(data.sellerUid || data.sellerId);
    const summary = ensureSellerSummary(sellerUid);
    if (!summary) return;

    summary.totalViews += 1;
    updateDealerPerformanceMachineMetric(
      summary,
      normalizeNonEmptyString(data.listingId, docSnapshot.id),
      normalizeNonEmptyString(data.listingTitle, normalizeNonEmptyString(data.listingId, docSnapshot.id)),
      { viewCount: 1 },
    );
  });

  const sellerSummaries = Object.entries(summaryBySeller)
    .map(([sellerUid, summary]) => ({
      sellerUid,
      ...finalizeDealerPerformanceSummary(summary),
    }))
    .sort((left, right) => (right.leadForms + right.calls + right.totalViews) - (left.leadForms + left.calls + left.totalViews));

  return {
    periodLabel: normalizedPeriodLabel,
    periodStartIso: resolvedStartDate.toISOString(),
    periodEndIso: resolvedEndDate.toISOString(),
    sellerSummaries,
    totals: sellerSummaries.reduce((totals, summary) => ({
      listings: totals.listings + summary.listings,
      leadForms: totals.leadForms + summary.leadForms,
      calls: totals.calls + summary.calls,
      connectedCalls: totals.connectedCalls + summary.connectedCalls,
      qualifiedCalls: totals.qualifiedCalls + summary.qualifiedCalls,
      missedCalls: totals.missedCalls + summary.missedCalls,
      totalViews: totals.totalViews + summary.totalViews,
    }), {
      listings: 0,
      leadForms: 0,
      calls: 0,
      connectedCalls: 0,
      qualifiedCalls: 0,
      missedCalls: 0,
      totalViews: 0,
    }),
  };
}

// ---------------------------------------------------------------------------
// Monthly Dealer Report — 1st of each month at 9 AM Eastern
// ---------------------------------------------------------------------------
exports.monthlyDealerReport = onSchedule(
  {
    schedule: '0 9 1 * *',
    timeZone: 'America/New_York',
    region: 'us-central1',
    secrets: [SENDGRID_API_KEY, EMAIL_FROM, ADMIN_EMAILS],
  },
  async () => {
    const report = await buildDealerPerformanceReport();
    if (!report.sellerSummaries.length) {
      logger.info('monthlyDealerReport: no sellers found');
      return;
    }

    const adminSummaries = [];

    for (const summary of report.sellerSummaries) {
      if (!summary.email) continue;

      const userSnapshot = await getDb().collection('users').doc(summary.sellerUid).get().catch(() => null);
      const userData = userSnapshot?.data?.() || {};
      if (userData.emailNotificationsEnabled === false) {
        logger.info(`monthlyDealerReport: skipped seller report for ${summary.sellerUid} because optional emails are disabled`);
        continue;
      }

      try {
        const { subject, html } = templates.dealerMonthlyReport({
          sellerName: summary.name,
          monthLabel: report.periodLabel,
          totalListings: summary.listings,
          leadForms: summary.leadForms,
          callButtonClicks: summary.calls,
          connectedCalls: summary.connectedCalls,
          qualifiedCalls: summary.qualifiedCalls,
          missedCalls: summary.missedCalls,
          totalViews: summary.totalViews,
          topMachines: summary.topMachines,
          dashboardUrl: 'https://www.forestryequipmentsales.com/profile',
          unsubscribeUrl: buildEmailUnsubscribeUrl({
            uid: summary.sellerUid,
            email: summary.email,
            scope: 'optional',
          }),
        });
        await sendEmail({ to: summary.email, subject, html });
      } catch (emailError) {
        logger.error(`monthlyDealerReport: failed to send report to ${summary.sellerUid}`, emailError);
      }

      adminSummaries.push({
        name: summary.name,
        listings: summary.listings,
        leads: summary.leadForms,
        calls: summary.calls,
        qualifiedCalls: summary.qualifiedCalls,
        totalViews: summary.totalViews,
      });
    }

    // Send consolidated admin summary to super_admins
    if (adminSummaries.length > 0) {
      try {
        const { subject, html } = templates.dealerMonthlyReportAdminSummary({
          monthLabel: report.periodLabel,
          sellerSummaries: adminSummaries,
          dashboardUrl: 'https://www.forestryequipmentsales.com/admin',
        });
        await sendEmail({ to: getAdminRecipients(), subject, html });
      } catch (adminEmailError) {
        logger.error('monthlyDealerReport: failed to send admin summary', adminEmailError);
      }
    }

    logger.info(`monthlyDealerReport: sent ${adminSummaries.length} seller reports for ${report.periodLabel}`);
  }
);

const marketRatesCache = {
  value: null,
  fetchedAt: 0,
};

const currencyRatesCache = new Map();
const CURRENCY_RATES_TTL_MS = 60 * 60 * 1000;

async function getCurrencyRatesPayload(baseCurrency) {
  const base = String(baseCurrency || 'USD').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(base)) {
    throw new Error('Invalid base currency code');
  }

  const now = Date.now();
  const cached = currencyRatesCache.get(base);
  if (cached && now - cached.fetchedAt < CURRENCY_RATES_TTL_MS) {
    return cached.payload;
  }

  const apiKey = EXCHANGERATE_API_KEY.value();
  if (!apiKey) {
    throw new Error('Currency API key not configured');
  }

  // Primary endpoint for exchangerate-api.com paid/free v6 plans.
  const v6Url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
  let response = await fetch(v6Url, { headers: { Accept: 'application/json' } });

  if (response.ok) {
    const json = await response.json();
    if (json?.result === 'success' && json?.conversion_rates && typeof json.conversion_rates === 'object') {
      const payload = {
        base,
        asOf: json?.time_last_update_utc || new Date().toISOString(),
        source: 'exchangerate-api',
        rates: json.conversion_rates,
      };
      currencyRatesCache.set(base, { payload, fetchedAt: now });
      return payload;
    }
  }

  // Fallback endpoint shape used by some exchangerate-api deployments.
  const fallbackUrl = `https://api.exchangerate-api.com/v4/latest/${base}?apikey=${apiKey}`;
  response = await fetch(fallbackUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Currency API request failed with ${response.status}`);
  }

  const fallbackJson = await response.json();
  if (!fallbackJson?.rates || typeof fallbackJson.rates !== 'object') {
    throw new Error('Currency API payload missing rates');
  }

  const payload = {
    base,
    asOf: fallbackJson?.date || new Date().toISOString(),
    source: 'exchangerate-api',
    rates: fallbackJson.rates,
  };

  currencyRatesCache.set(base, { payload, fetchedAt: now });
  return payload;
}

async function fredLatest(seriesId) {
  const key = FRED_API_KEY.value();
  if (!key) return null;

  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', key);
  url.searchParams.set('limit', '1');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('file_type', 'json');

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const json = await response.json();
  const obs = json?.observations?.[0];
  if (!obs || obs.value === '.') return null;
  const value = parseFloat(obs.value);
  if (!Number.isFinite(value)) return null;
  return { value, date: obs.date };
}

async function fetchSofr() {
  const response = await fetch('https://www.newyorkfed.org/api/rss/seriesRate.rss?serieskeyids=SOFR');
  if (!response.ok) return null;
  const text = await response.text();
  const valueMatch = text.match(/<fr:value>([\d.]+)<\/fr:value>/);
  const dateMatch = text.match(/<pubDate>([^<]+)<\/pubDate>/);
  if (!valueMatch) return null;
  const value = parseFloat(valueMatch[1]);
  if (!Number.isFinite(value)) return null;
  const date = dateMatch ? new Date(dateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  return { value, date };
}

async function fetchTreasuryRates() {
  const today = new Date();
  const yyyymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${yyyymm}`;
  const response = await fetch(url, { headers: { Accept: 'application/xml, text/xml' } });
  if (!response.ok) return null;
  const text = await response.text();
  const entries = text.split('<entry>');
  const last = entries[entries.length - 1] || '';

  const extract = (tag) => {
    const match = last.match(new RegExp(`<d:${tag}[^>]*>([\\d.]+)<`));
    return match ? parseFloat(match[1]) : undefined;
  };

  const dateMatch = last.match(/<d:NEW_DATE[^>]*>([\d-]+)/);
  return {
    bc5: extract('BC_5YEAR'),
    bc10: extract('BC_10YEAR'),
    date: dateMatch ? dateMatch[1].split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

async function getMarketRatesPayload() {
  const now = Date.now();
  if (marketRatesCache.value && now - marketRatesCache.fetchedAt < 4 * 60 * 60 * 1000) {
    return marketRatesCache.value;
  }

  const fallback = {
    primeRate: { value: 7.5, asOf: '2026-01-15', source: 'fallback' },
    sofr: { value: 4.33, asOf: '2026-01-15', source: 'fallback' },
    treasury5y: { value: 4.2, asOf: '2026-01-15', source: 'fallback' },
    treasury10y: { value: 4.5, asOf: '2026-01-15', source: 'fallback' },
    equipmentLendingEst: { value: 9.0, asOf: '2026-01-15', source: 'fallback' },
  };

  try {
    const [prime, dgs5, dgs10, sofr, treasury] = await Promise.all([
      fredLatest('DPRIME').catch(() => null),
      fredLatest('DGS5').catch(() => null),
      fredLatest('DGS10').catch(() => null),
      fetchSofr().catch(() => null),
      fetchTreasuryRates().catch(() => null),
    ]);

    const primeValue = prime?.value ?? fallback.primeRate.value;
    const payload = {
      primeRate: {
        value: primeValue,
        asOf: prime?.date ?? fallback.primeRate.asOf,
        source: prime ? 'fred' : 'fallback',
      },
      sofr: {
        value: sofr?.value ?? fallback.sofr.value,
        asOf: sofr?.date ?? fallback.sofr.asOf,
        source: sofr ? 'nyfed' : 'fallback',
      },
      treasury5y: {
        value: dgs5?.value ?? treasury?.bc5 ?? fallback.treasury5y.value,
        asOf: dgs5?.date ?? treasury?.date ?? fallback.treasury5y.asOf,
        source: dgs5 ? 'fred' : treasury?.bc5 ? 'treasury' : 'fallback',
      },
      treasury10y: {
        value: dgs10?.value ?? treasury?.bc10 ?? fallback.treasury10y.value,
        asOf: dgs10?.date ?? treasury?.date ?? fallback.treasury10y.asOf,
        source: dgs10 ? 'fred' : treasury?.bc10 ? 'treasury' : 'fallback',
      },
      equipmentLendingEst: {
        value: Number((primeValue + 1.5).toFixed(2)),
        asOf: new Date().toISOString().split('T')[0],
        source: prime ? 'fred' : 'fallback',
      },
    };

    marketRatesCache.value = payload;
    marketRatesCache.fetchedAt = now;
    return payload;
  } catch (error) {
    logger.error('Market rates API failed', error);
    return fallback;
  }
}

let marketplaceStatsCache = null;
const MARKETPLACE_STATS_TTL_MS = 10 * 60 * 1000;
let publicActiveListingsCache = null;
let publicSoldListingsCache = null;
let publicCategoryMetricsCache = null;
let publicHomeDataCache = null;
const PUBLIC_LISTINGS_TTL_MS = 60 * 1000;

function invalidateMarketplaceCaches() {
  publicActiveListingsCache = null;
  publicSoldListingsCache = null;
  publicCategoryMetricsCache = null;
  publicHomeDataCache = null;
  marketplaceStatsCache = null;
}

function parseCreatedAt(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6));
  }
  return null;
}

function getCountryFromLocation(location) {
  if (typeof location !== 'string') return null;
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

function getStateFromMarketplaceLocation(location) {
  if (typeof location !== 'string') return null;
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts[parts.length - 2];
  }

  return parts[0] || null;
}

function serializeSellerPayloadFromStorefront(snapshotId, data = {}) {
  const rawRole = normalizeNonEmptyString(data.role, 'buyer').toLowerCase();
  const isDealerRole = ['dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(rawRole);
  return {
    id: snapshotId,
    uid: snapshotId,
    name: normalizeNonEmptyString(data.storefrontName || data.displayName, 'Forestry Equipment Sales Seller'),
    type: isDealerRole ? 'Dealer' : 'Private',
    role: normalizeNonEmptyString(data.role, 'buyer'),
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

function serializeSellerPayloadFromUser(snapshotId, data = {}) {
  const rawRole = normalizeNonEmptyString(data.role, 'buyer').toLowerCase();
  const isDealerRole = ['dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff', 'admin', 'super_admin', 'developer'].includes(rawRole);
  return {
    id: snapshotId,
    uid: snapshotId,
    name: normalizeNonEmptyString(data.displayName || data.name, 'Forestry Equipment Sales Seller'),
    type: isDealerRole ? 'Dealer' : 'Private',
    role: normalizeNonEmptyString(data.role, 'buyer'),
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

function serializeInquiryDoc(docSnapshot) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    listingId: normalizeNonEmptyString(data.listingId) || undefined,
    sellerUid: normalizeNonEmptyString(data.sellerUid) || undefined,
    sellerId: normalizeNonEmptyString(data.sellerId) || undefined,
    buyerUid: data.buyerUid == null ? undefined : normalizeNonEmptyString(data.buyerUid) || undefined,
    buyerName: normalizeNonEmptyString(data.buyerName),
    buyerEmail: normalizeNonEmptyString(data.buyerEmail),
    buyerPhone: normalizeNonEmptyString(data.buyerPhone),
    message: normalizeNonEmptyString(data.message),
    type: normalizeNonEmptyString(data.type, 'Inquiry'),
    status: normalizeNonEmptyString(data.status, 'New'),
    assignedToUid: data.assignedToUid == null ? null : normalizeNonEmptyString(data.assignedToUid) || null,
    assignedToName: data.assignedToName == null ? null : normalizeNonEmptyString(data.assignedToName) || null,
    internalNotes: Array.isArray(data.internalNotes)
      ? data.internalNotes
          .filter((note) => note && typeof note === 'object')
          .map((note) => ({
            id: normalizeNonEmptyString(note.id) || `${docSnapshot.id}-note`,
            text: normalizeNonEmptyString(note.text),
            authorUid: normalizeNonEmptyString(note.authorUid) || undefined,
            authorName: normalizeNonEmptyString(note.authorName) || undefined,
            createdAt: normalizeNonEmptyString(note.createdAt, new Date().toISOString()),
          }))
      : [],
    firstResponseAt: timestampValueToIso(data.firstResponseAt) || normalizeNonEmptyString(data.firstResponseAt) || undefined,
    spamScore: toFiniteNumberOrUndefined(data.spamScore),
    spamFlags: Array.isArray(data.spamFlags) ? data.spamFlags.filter((flag) => typeof flag === 'string') : [],
    updatedAt: timestampValueToIso(data.updatedAt) || null,
    duration: toFiniteNumberOrUndefined(data.duration),
    recordingUrl: normalizeNonEmptyString(data.recordingUrl) || undefined,
    createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
  };
}

function serializeCallDoc(docSnapshot) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    listingId: normalizeNonEmptyString(data.listingId),
    listingTitle: normalizeNonEmptyString(data.listingTitle) || undefined,
    sellerId: normalizeNonEmptyString(data.sellerId),
    sellerUid: normalizeNonEmptyString(data.sellerUid) || undefined,
    sellerName: normalizeNonEmptyString(data.sellerName) || undefined,
    sellerPhone: normalizeNonEmptyString(data.sellerPhone) || undefined,
    callerUid: data.callerUid == null ? null : normalizeNonEmptyString(data.callerUid) || null,
    callerName: normalizeNonEmptyString(data.callerName),
    callerEmail: normalizeNonEmptyString(data.callerEmail) || undefined,
    callerPhone: normalizeNonEmptyString(data.callerPhone),
    duration: toFiniteNumberOrUndefined(data.duration) || 0,
    status: normalizeNonEmptyString(data.status, 'Completed'),
    source: normalizeNonEmptyString(data.source) || undefined,
    isAuthenticated: Boolean(data.isAuthenticated),
    recordingUrl: normalizeNonEmptyString(data.recordingUrl) || undefined,
    twilioCallSid: normalizeNonEmptyString(data.twilioCallSid) || undefined,
    twilioFromNumber: normalizeNonEmptyString(data.twilioFromNumber) || undefined,
    twilioToNumber: normalizeNonEmptyString(data.twilioToNumber) || undefined,
    completedAt: timestampValueToIso(data.completedAt) || normalizeNonEmptyString(data.completedAt) || undefined,
    createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
  };
}

function serializeContentBlockRecord(docSnapshot) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    type: normalizeNonEmptyString(data.type, 'text'),
    content: normalizeNonEmptyString(data.content),
    caption: normalizeNonEmptyString(data.caption) || undefined,
    title: normalizeNonEmptyString(data.title) || undefined,
    label: normalizeNonEmptyString(data.label) || undefined,
    order: toFiniteNumberOrUndefined(data.order) || 0,
  };
}

function serializeMediaLibraryRecord(docSnapshot) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    url: normalizeNonEmptyString(data.url),
    filename: normalizeNonEmptyString(data.filename || data.fileName),
    mimeType: normalizeNonEmptyString(data.mimeType || data.fileType),
    sizeBytes: toFiniteNumberOrUndefined(data.sizeBytes || data.fileSize),
    altText: normalizeNonEmptyString(data.altText) || undefined,
    tags: Array.isArray(data.tags) ? data.tags.filter((entry) => typeof entry === 'string') : [],
    uploadedBy: normalizeNonEmptyString(data.uploadedBy),
    uploadedByName: normalizeNonEmptyString(data.uploadedByName) || undefined,
    createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
  };
}

function serializeBlogPostRecord(docSnapshot) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    title: normalizeNonEmptyString(data.title, 'Untitled Post'),
    excerpt: normalizeNonEmptyString(data.excerpt) || undefined,
    content: normalizeNonEmptyString(data.content),
    authorUid: normalizeNonEmptyString(data.authorUid),
    authorName: normalizeNonEmptyString(data.authorName, 'Forestry Equipment Sales'),
    category: normalizeNonEmptyString(data.category, 'News'),
    tags: Array.isArray(data.tags) ? data.tags.filter((entry) => typeof entry === 'string') : [],
    image: normalizeNonEmptyString(data.image) || undefined,
    status: normalizeNonEmptyString(data.status, 'draft'),
    reviewStatus: normalizeNonEmptyString(data.reviewStatus, normalizeNonEmptyString(data.status, 'draft')),
    scheduledAt: timestampValueToIso(data.scheduledAt) || normalizeNonEmptyString(data.scheduledAt) || null,
    seoTitle: normalizeNonEmptyString(data.seoTitle) || undefined,
    seoDescription: normalizeNonEmptyString(data.seoDescription) || undefined,
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((entry) => typeof entry === 'string') : [],
    seoSlug: normalizeNonEmptyString(data.seoSlug) || undefined,
    blocks: Array.isArray(data.blocks)
      ? data.blocks
          .filter((entry) => entry && typeof entry === 'object')
          .map((entry, index) => ({
            id: normalizeNonEmptyString(entry.id) || `${docSnapshot.id}-block-${index + 1}`,
            type: normalizeNonEmptyString(entry.type, 'text'),
            content: normalizeNonEmptyString(entry.content),
            caption: normalizeNonEmptyString(entry.caption) || undefined,
            title: normalizeNonEmptyString(entry.title) || undefined,
            label: normalizeNonEmptyString(entry.label) || undefined,
            order: toFiniteNumberOrUndefined(entry.order) || index,
          }))
      : [],
    revisions: Array.isArray(data.revisions)
      ? data.revisions
          .filter((entry) => entry && typeof entry === 'object')
          .map((entry, index) => ({
            id: normalizeNonEmptyString(entry.id) || `${docSnapshot.id}-revision-${index + 1}`,
            title: normalizeNonEmptyString(entry.title),
            content: normalizeNonEmptyString(entry.content),
            authorUid: normalizeNonEmptyString(entry.authorUid),
            authorName: normalizeNonEmptyString(entry.authorName),
            savedAt: normalizeNonEmptyString(entry.savedAt, new Date().toISOString()),
            note: normalizeNonEmptyString(entry.note) || undefined,
          }))
      : [],
    createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
    updatedAt: timestampValueToIso(data.updatedAt) || timestampValueToIso(data.createdAt) || new Date().toISOString(),
  };
}

function serializePublicNewsPostFromBlog(docSnapshot) {
  const record = serializeBlogPostRecord(docSnapshot);
  return {
    id: `blog-${record.id}`,
    title: record.title,
    summary: normalizeNonEmptyString(record.excerpt) || htmlToText(record.content).slice(0, 220),
    content: record.content,
    author: normalizeNonEmptyString(record.authorName, 'Forestry Equipment Sales Editorial'),
    date: normalizeNonEmptyString(record.updatedAt || record.createdAt, new Date().toISOString()),
    image: normalizeNonEmptyString(record.image, '/Forestry_Equipment_Sales_Logo.png?v=20260327c'),
    category: normalizeNonEmptyString(record.category, 'Industry News'),
    seoTitle: normalizeNonEmptyString(record.seoTitle) || undefined,
    seoDescription: normalizeNonEmptyString(record.seoDescription) || undefined,
    seoKeywords: Array.isArray(record.seoKeywords) ? record.seoKeywords : [],
    seoSlug: normalizeNonEmptyString(record.seoSlug) || undefined,
  };
}

function serializePublicNewsPostFromLegacy(docSnapshot) {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    title: normalizeNonEmptyString(data.title, 'Untitled'),
    summary: normalizeNonEmptyString(data.summary) || htmlToText(data.content).slice(0, 220),
    content: normalizeNonEmptyString(data.content),
    author: normalizeNonEmptyString(data.author, 'Forestry Equipment Sales Editorial'),
    date: timestampValueToIso(data.date) || timestampValueToIso(data.updatedAt) || timestampValueToIso(data.createdAt) || new Date().toISOString(),
    image: normalizeNonEmptyString(data.image, '/Forestry_Equipment_Sales_Logo.png?v=20260327c'),
    category: normalizeNonEmptyString(data.category, 'Industry News'),
    seoTitle: normalizeNonEmptyString(data.seoTitle) || undefined,
    seoDescription: normalizeNonEmptyString(data.seoDescription) || undefined,
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords.filter((entry) => typeof entry === 'string') : [],
    seoSlug: normalizeNonEmptyString(data.seoSlug) || undefined,
  };
}

async function getPublicNewsFeedPayload() {
  if (publicNewsCache && Date.now() - publicNewsCache.fetchedAt < PUBLIC_NEWS_CACHE_TTL_MS) {
    return publicNewsCache.posts;
  }

  const [legacyNewsResult, blogPostsResult] = await Promise.allSettled([
    getDb().collection('news').get(),
    getDb().collection('blogPosts').orderBy('updatedAt', 'desc').limit(36).get(),
  ]);

  const legacyNews = legacyNewsResult.status === 'fulfilled'
    ? legacyNewsResult.value.docs.map((docSnapshot) => serializePublicNewsPostFromLegacy(docSnapshot))
    : [];

  const blogPosts = blogPostsResult.status === 'fulfilled'
    ? blogPostsResult.value.docs
        .map((docSnapshot) => serializeBlogPostRecord(docSnapshot))
        .filter((post) => {
          const status = normalizeNonEmptyString(post.status).toLowerCase();
          const reviewStatus = normalizeNonEmptyString(post.reviewStatus || post.status).toLowerCase();
          return status === 'published' || reviewStatus === 'published';
        })
        .map((post) => ({
          id: `blog-${post.id}`,
          title: post.title,
          summary: normalizeNonEmptyString(post.excerpt) || htmlToText(post.content).slice(0, 220),
          content: post.content,
          author: normalizeNonEmptyString(post.authorName, 'Forestry Equipment Sales Editorial'),
          date: normalizeNonEmptyString(post.updatedAt || post.createdAt, new Date().toISOString()),
          image: normalizeNonEmptyString(post.image, '/Forestry_Equipment_Sales_Logo.png?v=20260327c'),
          category: normalizeNonEmptyString(post.category, 'Industry News'),
          seoTitle: normalizeNonEmptyString(post.seoTitle) || undefined,
          seoDescription: normalizeNonEmptyString(post.seoDescription) || undefined,
          seoKeywords: Array.isArray(post.seoKeywords) ? post.seoKeywords : [],
          seoSlug: normalizeNonEmptyString(post.seoSlug) || undefined,
        }))
    : [];

  if (legacyNewsResult.status === 'rejected' && blogPostsResult.status === 'rejected') {
    const firstError = legacyNewsResult.reason || blogPostsResult.reason;
    if (Array.isArray(publicNewsCache?.posts)) {
      logger.warn('Using cached public news feed because live reads failed.', {
        error: firstError instanceof Error ? firstError.message : String(firstError || ''),
      });
      return publicNewsCache.posts;
    }
    throw (firstError instanceof Error ? firstError : new Error('Unable to load public news feed.'));
  }

  const posts = [...blogPosts, ...legacyNews].sort((left, right) => {
    const leftDate = Date.parse(normalizeNonEmptyString(left.date)) || 0;
    const rightDate = Date.parse(normalizeNonEmptyString(right.date)) || 0;
    return rightDate - leftDate;
  });

  publicNewsCache = {
    posts,
    fetchedAt: Date.now(),
  };

  return posts;
}

async function getPublicNewsPostPayload(id) {
  const normalizedId = normalizeNonEmptyString(id);
  if (!normalizedId) {
    return null;
  }

  const cachedPost = Array.isArray(publicNewsCache?.posts)
    ? publicNewsCache.posts.find((post) => normalizeNonEmptyString(post.id) === normalizedId)
    : null;
  if (cachedPost) {
    return cachedPost;
  }

  if (normalizedId.startsWith('blog-')) {
    const blogPostId = normalizedId.slice(5);
    if (!blogPostId) {
      return null;
    }

    const docSnapshot = await getDb().collection('blogPosts').doc(blogPostId).get();
    if (!docSnapshot.exists) {
      return null;
    }

    const record = serializeBlogPostRecord(docSnapshot);
    const status = normalizeNonEmptyString(record.status).toLowerCase();
    const reviewStatus = normalizeNonEmptyString(record.reviewStatus || record.status).toLowerCase();
    if (status !== 'published' && reviewStatus !== 'published') {
      return null;
    }

    return serializePublicNewsPostFromBlog(docSnapshot);
  }

  const docSnapshot = await getDb().collection('news').doc(normalizedId).get();
  if (!docSnapshot.exists) {
    return null;
  }

  return serializePublicNewsPostFromLegacy(docSnapshot);
}

function buildMarketplaceListingPayload(listingId, rawListing) {
  const listing = rawListing || {};
  const rawImages = Array.isArray(listing.images)
    ? listing.images
    : listing.image
      ? [listing.image]
      : [];
  const images = normalizeImageUrls(rawImages);
  const make = normalizeNonEmptyString(listing.make || listing.manufacturer || listing.brand);

  return {
    id: String(listingId),
    sellerUid: normalizeNonEmptyString(listing.sellerUid || listing.sellerId),
    sellerId: normalizeNonEmptyString(listing.sellerId || listing.sellerUid),
    title: normalizeNonEmptyString(listing.title, 'Equipment Listing'),
    category: normalizeNonEmptyString(listing.category, 'Equipment'),
    subcategory: normalizeNonEmptyString(listing.subcategory || listing.category, 'Equipment'),
    make,
    manufacturer: normalizeNonEmptyString(listing.manufacturer || make),
    brand: normalizeNonEmptyString(listing.brand || make),
    model: normalizeNonEmptyString(listing.model),
    year: toFiniteNumberOrUndefined(listing.year) || 0,
    price: toFiniteNumberOrUndefined(listing.price) || 0,
    currency: normalizeNonEmptyString(listing.currency, 'USD'),
    hours: toFiniteNumberOrUndefined(listing.hours) || 0,
    condition: normalizeNonEmptyString(listing.condition, 'Used'),
    description: normalizeNonEmptyString(listing.description),
    images,
    imageTitles: sanitizeListingCreateImageTitles(listing.imageTitles, images.length),
    imageVariants: sanitizeListingCreateImageVariants(listing.imageVariants),
    location: normalizeNonEmptyString(listing.location),
    stockNumber: normalizeNonEmptyString(listing.stockNumber),
    serialNumber: normalizeNonEmptyString(listing.serialNumber),
    latitude: toFiniteNumberOrUndefined(listing.latitude),
    longitude: toFiniteNumberOrUndefined(listing.longitude),
    features: Array.isArray(listing.features) ? listing.features.filter((entry) => typeof entry === 'string') : [],
    videoUrls: Array.isArray(listing.videoUrls)
      ? listing.videoUrls.map((entry) => normalizeNonEmptyString(entry)).filter(Boolean).slice(0, 6)
      : [],
    status: normalizeNonEmptyString(listing.status, 'active'),
    approvalStatus: normalizeNonEmptyString(listing.approvalStatus, 'pending'),
    approvedBy: normalizeNonEmptyString(listing.approvedBy),
    paymentStatus: normalizeNonEmptyString(listing.paymentStatus, 'pending'),
    subscriptionPlanId: normalizeNonEmptyString(listing.subscriptionPlanId),
    publishedAt: timestampValueToIso(listing.publishedAt) || normalizeNonEmptyString(listing.publishedAt),
    expiresAt: timestampValueToIso(listing.expiresAt) || normalizeNonEmptyString(listing.expiresAt),
    soldAt: timestampValueToIso(listing.soldAt) || normalizeNonEmptyString(listing.soldAt),
    archivedAt: timestampValueToIso(listing.archivedAt) || normalizeNonEmptyString(listing.archivedAt),
    approvedAt: timestampValueToIso(listing.approvedAt) || normalizeNonEmptyString(listing.approvedAt),
    rejectedAt: timestampValueToIso(listing.rejectedAt) || normalizeNonEmptyString(listing.rejectedAt),
    rejectedBy: normalizeNonEmptyString(listing.rejectedBy),
    rejectionReason: normalizeNonEmptyString(listing.rejectionReason),
    lastLifecycleAction: normalizeNonEmptyString(listing.lastLifecycleAction),
    lastLifecycleAt: timestampValueToIso(listing.lastLifecycleAt) || normalizeNonEmptyString(listing.lastLifecycleAt),
    marketValueEstimate: toFiniteNumberOrUndefined(listing.marketValueEstimate) ?? null,
    featured: Boolean(listing.featured),
    views: toFiniteNumberOrUndefined(listing.views) || 0,
    leads: toFiniteNumberOrUndefined(listing.leads) || 0,
    createdAt:
      timestampValueToIso(listing.createdAt) ||
      normalizeNonEmptyString(listing.createdAtIso) ||
      timestampValueToIso(listing.lastmod) ||
      new Date().toISOString(),
    updatedAt:
      timestampValueToIso(listing.updatedAt) ||
      normalizeNonEmptyString(listing.updatedAtIso) ||
      timestampValueToIso(listing.lastmod) ||
      null,
    specs: typeof listing.specs === 'object' && listing.specs ? listing.specs : {},
  };
}

function toMarketplaceNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeMarketplaceText(value) {
  return String(value || '').trim().toLowerCase();
}

function isVerifiedSellerRole(role, manuallyVerified) {
  if (manuallyVerified === true) return true;
  return ['super_admin', 'admin', 'developer', 'dealer', 'pro_dealer', 'dealer_manager', 'dealer_staff'].includes(normalizeUserRole(role));
}

function getFeaturedListingCapForRole(role) {
  const normalizedRole = normalizeUserRole(role);
  if (canAdministrateAccount(normalizedRole)) return Number.POSITIVE_INFINITY;
  return FEATURED_LISTING_CAPS[normalizedRole] || 0;
}

function sanitizeListingCreateImages(value) {
  return normalizeImageUrls(Array.isArray(value) ? value : []);
}

function sanitizeListingCreateImageTitles(value, imageCount = 0) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeNonEmptyString(entry).slice(0, 120))
    .slice(0, Math.max(0, imageCount));
}

function sanitizeListingCreateImageVariants(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      thumbnailUrl: normalizeNonEmptyString(entry.thumbnailUrl),
      detailUrl: normalizeNonEmptyString(entry.detailUrl),
      format: normalizeNonEmptyString(entry.format),
    }))
    .filter((entry) => entry.thumbnailUrl || entry.detailUrl)
    .slice(0, 40);
}

function sanitizeListingConditionChecklist(value) {
  if (!value || typeof value !== 'object') {
    return {
      engineChecked: false,
      undercarriageChecked: false,
      hydraulicsLeakStatus: '',
      serviceRecordsAvailable: false,
      partsManualAvailable: false,
      serviceManualAvailable: false,
    };
  }

  return {
    engineChecked: Boolean(value.engineChecked),
    undercarriageChecked: Boolean(value.undercarriageChecked),
    hydraulicsLeakStatus: normalizeNonEmptyString(value.hydraulicsLeakStatus),
    serviceRecordsAvailable: Boolean(value.serviceRecordsAvailable),
    partsManualAvailable: Boolean(value.partsManualAvailable),
    serviceManualAvailable: Boolean(value.serviceManualAvailable),
  };
}

function sanitizeListingCreatePayload(rawListing = {}) {
  const listingInput = rawListing && typeof rawListing === 'object' ? rawListing : {};
  const picked = {};

  for (const [key, value] of Object.entries(listingInput)) {
    if (!ACCOUNT_LISTING_CREATE_ALLOWED_KEYS.has(key)) continue;
    picked[key] = value;
  }

  const manufacturer = normalizeNonEmptyString(picked.manufacturer || picked.make || picked.brand);
  const specs = picked.specs && typeof picked.specs === 'object'
    ? picked.specs
    : (picked.specifications && typeof picked.specifications === 'object' ? picked.specifications : {});
  const images = sanitizeListingCreateImages(picked.images);

  return stripUndefinedDeep({
    id: normalizeNonEmptyString(picked.id),
    title: normalizeNonEmptyString(picked.title),
    category: normalizeNonEmptyString(picked.category),
    subcategory: normalizeNonEmptyString(picked.subcategory),
    make: manufacturer,
    manufacturer,
    brand: normalizeNonEmptyString(picked.brand || manufacturer),
    model: normalizeNonEmptyString(picked.model),
    year: toFiniteNumberOrUndefined(picked.year) || 0,
    hours: toFiniteNumberOrUndefined(picked.hours) || 0,
    condition: normalizeNonEmptyString(picked.condition),
    price: toFiniteNumberOrUndefined(picked.price) || 0,
    salePrice: toFiniteNumberOrUndefined(picked.salePrice) ?? null,
    currency: normalizeNonEmptyString(picked.currency, 'USD'),
    location: normalizeNonEmptyString(picked.location),
    city: normalizeNonEmptyString(picked.city),
    state: normalizeNonEmptyString(picked.state),
    country: normalizeNonEmptyString(picked.country),
    latitude: toFiniteNumberOrUndefined(picked.latitude),
    longitude: toFiniteNumberOrUndefined(picked.longitude),
    serialNumber: normalizeNonEmptyString(picked.serialNumber),
    stockNumber: normalizeNonEmptyString(picked.stockNumber),
    description: normalizeNonEmptyString(picked.description),
    images,
    imageTitles: sanitizeListingCreateImageTitles(picked.imageTitles, images.length),
    imageVariants: sanitizeListingCreateImageVariants(picked.imageVariants),
    videoUrls: Array.isArray(picked.videoUrls)
      ? picked.videoUrls.map((entry) => normalizeNonEmptyString(entry)).filter(Boolean).slice(0, 6)
      : [],
    features: Array.isArray(picked.features)
      ? picked.features.map((entry) => normalizeNonEmptyString(entry)).filter(Boolean).slice(0, 40)
      : [],
    specs,
    conditionChecklist: sanitizeListingConditionChecklist(picked.conditionChecklist),
    featured: Boolean(picked.featured),
    featuredRank: toFiniteNumberOrUndefined(picked.featuredRank) ?? null,
    metaTitle: normalizeNonEmptyString(picked.metaTitle),
    metaDescription: normalizeNonEmptyString(picked.metaDescription),
    canonicalSlug: normalizeNonEmptyString(picked.canonicalSlug),
    contactPhone: normalizeNonEmptyString(picked.contactPhone),
    contactEmail: normalizeNonEmptyString(picked.contactEmail).toLowerCase(),
  });
}

function validateListingCreatePayload(listing) {
  const errors = [];

  if (!listing.category) errors.push('Category is required.');
  if (!listing.subcategory) errors.push('Subcategory is required.');
  if (!listing.title) errors.push('Listing title is required.');
  if (!String(listing.make || listing.manufacturer || '').trim()) errors.push('Manufacturer is required.');
  if (!listing.model) errors.push('Model is required.');
  if (!listing.year || Number(listing.year) <= 0) errors.push('Year is required.');
  if (!Number.isFinite(Number(listing.hours)) || Number(listing.hours) < 0) errors.push('Operating hours are required.');
  if (!listing.condition) errors.push('Condition is required.');
  if (!Number.isFinite(Number(listing.price)) || Number(listing.price) < 0) errors.push('Price is required.');
  if (!listing.location) errors.push('Location is required.');

  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
  if (imageCount < 5) errors.push('Minimum 5 images are required.');
  if (imageCount > 40) errors.push('Maximum 40 images are allowed.');

  if (Array.isArray(listing.videoUrls) && !listing.videoUrls.every((url) => /^https?:\/\//i.test(String(url || '')))) {
    errors.push('All video URLs must be valid http/https links.');
  }

  const hydraulicsLeakStatus = normalize(listing?.conditionChecklist?.hydraulicsLeakStatus);
  if (hydraulicsLeakStatus && !['yes', 'no'].includes(hydraulicsLeakStatus)) {
    errors.push('Hydraulics leak status must be set to yes or no when provided.');
  }

  return errors;
}

function sanitizeListingUpdatePayload(existingListing = {}, rawUpdates = {}) {
  const requestedUpdates = rawUpdates && typeof rawUpdates === 'object' ? rawUpdates : {};
  const requestedKeys = new Set(Object.keys(requestedUpdates));
  const mergedSanitized = sanitizeListingCreatePayload({
    ...existingListing,
    ...requestedUpdates,
  });

  if (
    !requestedKeys.has('location') &&
    (requestedKeys.has('city') || requestedKeys.has('state') || requestedKeys.has('country'))
  ) {
    mergedSanitized.location = [
      normalizeNonEmptyString(requestedUpdates.city, normalizeNonEmptyString(existingListing.city)),
      normalizeNonEmptyString(requestedUpdates.state, normalizeNonEmptyString(existingListing.state)),
      normalizeNonEmptyString(requestedUpdates.country, normalizeNonEmptyString(existingListing.country)),
    ].filter(Boolean).join(', ');
  }

  const sanitizedUpdates = {};

  for (const key of requestedKeys) {
    if (!ACCOUNT_LISTING_UPDATE_ALLOWED_KEYS.has(key)) continue;

    if (key === 'specifications' || key === 'specs') {
      sanitizedUpdates.specs = mergedSanitized.specs;
      sanitizedUpdates.specifications = mergedSanitized.specs;
      continue;
    }

    if (key === 'make' || key === 'manufacturer' || key === 'brand') {
      sanitizedUpdates.make = mergedSanitized.make;
      sanitizedUpdates.manufacturer = mergedSanitized.manufacturer;
      sanitizedUpdates.brand = mergedSanitized.brand;
      continue;
    }

    sanitizedUpdates[key] = mergedSanitized[key];
  }

  if (
    requestedKeys.has('city') ||
    requestedKeys.has('state') ||
    requestedKeys.has('country') ||
    requestedKeys.has('location')
  ) {
    sanitizedUpdates.city = mergedSanitized.city;
    sanitizedUpdates.state = mergedSanitized.state;
    sanitizedUpdates.country = mergedSanitized.country;
    sanitizedUpdates.location = mergedSanitized.location;
  }

  if (requestedKeys.has('featured')) {
    sanitizedUpdates.featured = Boolean(mergedSanitized.featured);
  }

  return {
    sanitizedUpdates: stripUndefinedDeep(sanitizedUpdates),
    mergedSanitized,
    shouldValidateQuality: [...requestedKeys].some((key) => ACCOUNT_LISTING_QUALITY_KEYS.has(key)),
  };
}

async function countSellerListingsForCapacity(sellerUid, options = {}) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  if (!normalizedSellerUid) return 0;

  const snapshot = options.featuredOnly
    ? await getDb().collection('listings').where('sellerUid', '==', normalizedSellerUid).where('featured', '==', true).get()
    : await getDb().collection('listings').where('sellerUid', '==', normalizedSellerUid).get();

  return snapshot.docs.filter((docSnapshot) => {
    if (options.excludeListingId && docSnapshot.id === options.excludeListingId) return false;
    const data = docSnapshot.data() || {};
    return normalizeNonEmptyString(data.status, 'active').toLowerCase() !== 'sold';
  }).length;
}

function toMarketplaceMillis(value) {
  if (!value) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate().getTime();
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value?.seconds === 'number') {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return undefined;
}

function sortMarketplaceListings(listings, sortBy = 'newest', keyword = '') {
  const normalizedKeyword = normalizeMarketplaceText(keyword);
  const withFeaturedPriority = (compare) => {
    return [...listings].sort((left, right) => {
      const featuredDelta = Number(Boolean(right.featured)) - Number(Boolean(left.featured));
      if (featuredDelta !== 0) return featuredDelta;
      return compare(left, right);
    });
  };

  const relevanceScore = (listing) => {
    if (!normalizedKeyword) return 0;
    const title = normalizeMarketplaceText(listing.title);
    const make = normalizeMarketplaceText(listing.make || listing.manufacturer || listing.brand);
    const model = normalizeMarketplaceText(listing.model);
    const description = normalizeMarketplaceText(listing.description);
    const stockNumber = normalizeMarketplaceText(listing.stockNumber);
    const serialNumber = normalizeMarketplaceText(listing.serialNumber);

    let score = 0;
    if (title.includes(normalizedKeyword)) score += 15;
    if (make.includes(normalizedKeyword)) score += 20;
    if (model.includes(normalizedKeyword)) score += 25;
    if (description.includes(normalizedKeyword)) score += 5;
    if (stockNumber.includes(normalizedKeyword)) score += 30;
    if (serialNumber.includes(normalizedKeyword)) score += 30;
    if (`${make} ${model}`.includes(normalizedKeyword)) score += 10;
    if (title.startsWith(normalizedKeyword) || model.startsWith(normalizedKeyword)) score += 8;
    return score;
  };

  if (sortBy === 'price_asc') {
    return [...listings].sort((left, right) => left.price - right.price);
  }
  if (sortBy === 'price_desc') {
    return [...listings].sort((left, right) => right.price - left.price);
  }
  if (sortBy === 'popular') {
    return withFeaturedPriority((left, right) => (right.views + right.leads * 3) - (left.views + left.leads * 3));
  }
  if (sortBy === 'relevance' && normalizedKeyword) {
    return withFeaturedPriority((left, right) => relevanceScore(right) - relevanceScore(left));
  }

  return withFeaturedPriority((left, right) => {
    const leftTime = toMarketplaceMillis(left.updatedAt || left.createdAt) || 0;
    const rightTime = toMarketplaceMillis(right.updatedAt || right.createdAt) || 0;
    return rightTime - leftTime;
  });
}

function filterMarketplaceListings(listings, filters = {}, options = {}) {
  const includeUnapproved = Boolean(options.includeUnapproved);
  const nowMs = Date.now();
  let filtered = [...listings];

  if (!includeUnapproved) {
    filtered = filtered.filter((listing) => {
      const status = normalizeMarketplaceText(listing.status || 'active');
      const approvalStatus = normalizeMarketplaceText(listing.approvalStatus || 'pending');
      const paymentStatus = normalizeMarketplaceText(listing.paymentStatus || 'pending');
      if (approvalStatus !== 'approved') return false;
      if (paymentStatus !== 'paid') return false;
      if (status === 'archived' || status === 'expired' || status === 'pending') return false;
      if (status === 'sold') return true;
      const expiresAtMs = toMarketplaceMillis(listing.expiresAt);
      return expiresAtMs === undefined || expiresAtMs > nowMs;
    });
  }

  if (filters.q) {
    const searchStr = normalizeMarketplaceText(filters.q);
    filtered = filtered.filter((listing) => {
      return (
        normalizeMarketplaceText(listing.title).includes(searchStr) ||
        normalizeMarketplaceText(listing.make).includes(searchStr) ||
        normalizeMarketplaceText(listing.manufacturer).includes(searchStr) ||
        normalizeMarketplaceText(listing.model).includes(searchStr) ||
        normalizeMarketplaceText(listing.description).includes(searchStr) ||
        normalizeMarketplaceText(listing.stockNumber).includes(searchStr) ||
        normalizeMarketplaceText(listing.serialNumber).includes(searchStr)
      );
    });
  }

  if (filters.inStockOnly !== false) {
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.status || 'active') !== 'sold');
  }

  if (filters.featured) {
    filtered = filtered.filter((listing) => Boolean(listing.featured));
  }

  if (filters.category) {
    const category = normalizeMarketplaceText(filters.category);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.category) === category);
  }

  if (filters.subcategory) {
    const subcategory = normalizeMarketplaceText(filters.subcategory);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.subcategory) === subcategory);
  }

  if (filters.manufacturer) {
    const manufacturer = normalizeMarketplaceText(filters.manufacturer);
    filtered = filtered.filter((listing) => {
      const make = normalizeMarketplaceText(listing.make || listing.manufacturer || listing.brand);
      return make.includes(manufacturer);
    });
  }

  if (filters.model) {
    const model = normalizeMarketplaceText(filters.model);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.model).includes(model));
  }

  if (filters.state) {
    const state = normalizeMarketplaceText(filters.state);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(getStateFromMarketplaceLocation(listing.location)).includes(state));
  }

  if (filters.country) {
    const country = normalizeMarketplaceText(filters.country);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(getCountryFromLocation(listing.location)).includes(country));
  }

  if (filters.sellerUid) {
    const sellerUid = normalizeMarketplaceText(filters.sellerUid);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.sellerUid || listing.sellerId) === sellerUid);
  }

  const minPrice = toMarketplaceNumber(filters.minPrice);
  if (minPrice !== undefined) filtered = filtered.filter((listing) => listing.price >= minPrice);

  const maxPrice = toMarketplaceNumber(filters.maxPrice);
  if (maxPrice !== undefined) filtered = filtered.filter((listing) => listing.price <= maxPrice);

  const minYear = toMarketplaceNumber(filters.minYear);
  if (minYear !== undefined) filtered = filtered.filter((listing) => listing.year >= minYear);

  const maxYear = toMarketplaceNumber(filters.maxYear);
  if (maxYear !== undefined) filtered = filtered.filter((listing) => listing.year <= maxYear);

  const minHours = toMarketplaceNumber(filters.minHours);
  if (minHours !== undefined) filtered = filtered.filter((listing) => listing.hours >= minHours);

  const maxHours = toMarketplaceNumber(filters.maxHours);
  if (maxHours !== undefined) filtered = filtered.filter((listing) => listing.hours <= maxHours);

  if (filters.condition) {
    const condition = normalizeMarketplaceText(filters.condition);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.condition) === condition);
  }

  if (filters.location) {
    const location = normalizeMarketplaceText(filters.location);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.location).includes(location));
  }

  if (filters.stockNumber) {
    const stockNumber = normalizeMarketplaceText(filters.stockNumber);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.stockNumber).includes(stockNumber));
  }

  if (filters.serialNumber) {
    const serialNumber = normalizeMarketplaceText(filters.serialNumber);
    filtered = filtered.filter((listing) => normalizeMarketplaceText(listing.serialNumber).includes(serialNumber));
  }

  if (filters.attachment) {
    const attachment = normalizeMarketplaceText(filters.attachment);
    filtered = filtered.filter((listing) => Array.isArray(listing.specs?.attachments)
      && listing.specs.attachments.some((entry) => normalizeMarketplaceText(entry).includes(attachment)));
  }

  if (filters.feature) {
    const feature = normalizeMarketplaceText(filters.feature);
    filtered = filtered.filter((listing) => {
      const topLevelFeatures = Array.isArray(listing.features) ? listing.features : [];
      const specFeatures = Array.isArray(listing.specs?.features) ? listing.specs.features : [];
      return [...topLevelFeatures, ...specFeatures].some((entry) => normalizeMarketplaceText(entry).includes(feature));
    });
  }

  const locationRadius = toMarketplaceNumber(filters.locationRadius);
  const locationCenterLat = toMarketplaceNumber(filters.locationCenterLat);
  const locationCenterLng = toMarketplaceNumber(filters.locationCenterLng);
  if (locationRadius !== undefined && locationRadius > 0 && locationCenterLat !== undefined && locationCenterLng !== undefined) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const distanceMiles = (aLat, aLng, bLat, bLng) => {
      const earthRadiusMiles = 3958.8;
      const dLat = toRadians(bLat - aLat);
      const dLng = toRadians(bLng - aLng);
      const aa =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
      return earthRadiusMiles * c;
    };

    filtered = filtered.filter((listing) => {
      const lat = toMarketplaceNumber(listing.latitude ?? listing.specs?.latitude ?? listing.specs?.lat);
      const lng = toMarketplaceNumber(listing.longitude ?? listing.specs?.longitude ?? listing.specs?.lng ?? listing.specs?.lon);
      if (lat === undefined || lng === undefined) return false;
      return distanceMiles(locationCenterLat, locationCenterLng, lat, lng) <= locationRadius;
    });
  }

  return sortMarketplaceListings(filtered, normalizeNonEmptyString(filters.sortBy, 'newest'), normalizeNonEmptyString(filters.q));
}

async function loadActivePublicListings() {
  const now = Date.now();
  if (publicActiveListingsCache && now - publicActiveListingsCache.fetchedAt < PUBLIC_LISTINGS_TTL_MS) {
    return publicActiveListingsCache.value;
  }

  try {
    const snapshot = await getDb().collection('listings').where('approvalStatus', '==', 'approved').get();
    const listings = snapshot.docs
      .map((docSnapshot) => buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {}))
      .filter((listing) => {
        const paymentStatus = normalizeMarketplaceText(listing.paymentStatus || 'pending');
        const status = normalizeMarketplaceText(listing.status || 'active');
        if (paymentStatus !== 'paid') return false;
        if (status === 'archived' || status === 'expired' || status === 'pending' || status === 'sold') return false;
        const expiresAtMs = toMarketplaceMillis(listing.expiresAt);
        return expiresAtMs === undefined || expiresAtMs > now;
      });
    publicActiveListingsCache = { value: listings, fetchedAt: now };
    return listings;
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }

    logger.warn('Serving emergency public listings snapshot because Firestore public read quota is exhausted.', {
      collection: 'listings',
    });
    const listings = getFallbackMarketplaceListings();
    publicActiveListingsCache = { value: listings, fetchedAt: now };
    return listings;
  }
}

async function loadSoldMarketplaceListings() {
  const now = Date.now();
  if (publicSoldListingsCache && now - publicSoldListingsCache.fetchedAt < PUBLIC_LISTINGS_TTL_MS) {
    return publicSoldListingsCache.value;
  }

  try {
    const snapshot = await getDb().collection('listings').where('status', '==', 'sold').get();
    const listings = snapshot.docs
      .map((docSnapshot) => buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {}))
      .filter((listing) => normalizeMarketplaceText(listing.approvalStatus) === 'approved' && normalizeMarketplaceText(listing.paymentStatus) === 'paid');

    publicSoldListingsCache = { value: listings, fetchedAt: now };
    return listings;
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }

    logger.warn('Serving empty sold-listings snapshot because Firestore public read quota is exhausted.', {
      collection: 'listings',
    });
    const listings = getFallbackMarketplaceHomeData().recentSoldListings || [];
    publicSoldListingsCache = { value: listings, fetchedAt: now };
    return listings;
  }
}

function buildPublicMetricsPayload(listings, selectLabel) {
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const byCategory = new Map();

  listings.forEach((listing) => {
    const category = normalizeNonEmptyString(selectLabel(listing), 'Uncategorized');
    const existing = byCategory.get(category) || [];
    existing.push(listing);
    byCategory.set(category, existing);
  });

  return [...byCategory.entries()]
    .map(([category, categoryListings]) => {
      const activeListings = categoryListings.filter((listing) => normalizeMarketplaceText(listing.status || 'active') !== 'sold');
      const previousWeekCount = categoryListings.filter((listing) => {
        const createdAtMs = toMarketplaceMillis(listing.createdAt) || 0;
        return createdAtMs <= weekAgoMs;
      }).length;
      const activeCount = activeListings.length;
      const weeklyChangePercent = previousWeekCount === 0 ? 0 : ((activeCount - previousWeekCount) / previousWeekCount) * 100;
      const averagePrice =
        activeCount > 0
          ? Math.round(activeListings.reduce((sum, listing) => sum + (Number.isFinite(listing.price) ? listing.price : 0), 0) / activeCount)
          : null;

      return {
        category,
        activeCount,
        previousWeekCount,
        weeklyChangePercent: Number(weeklyChangePercent.toFixed(1)),
        averagePrice,
      };
    })
    .sort((left, right) => right.activeCount - left.activeCount);
}

function buildPublicCategoryMetricsPayload(listings) {
  return buildPublicMetricsPayload(listings, (listing) => listing.subcategory || listing.category);
}

function buildTopLevelCategoryMetricsPayload(listings) {
  return buildPublicMetricsPayload(listings, (listing) => listing.category);
}

async function getPublicCategoryMetricsPayload() {
  const now = Date.now();
  if (publicCategoryMetricsCache && now - publicCategoryMetricsCache.fetchedAt < PUBLIC_LISTINGS_TTL_MS) {
    return publicCategoryMetricsCache.value;
  }

  try {
    const listings = await loadActivePublicListings();
    const metrics = buildPublicCategoryMetricsPayload(listings);
    publicCategoryMetricsCache = { value: metrics, fetchedAt: now };
    return metrics;
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }

    logger.warn('Serving emergency category metrics snapshot because Firestore public read quota is exhausted.');
    const metrics = getFallbackMarketplaceCategoryMetrics();
    publicCategoryMetricsCache = { value: metrics, fetchedAt: now };
    return metrics;
  }
}

async function getPublicHomeDataPayload() {
  const now = Date.now();
  if (publicHomeDataCache && now - publicHomeDataCache.fetchedAt < PUBLIC_LISTINGS_TTL_MS) {
    return publicHomeDataCache.value;
  }

  try {
    const [activeListings, soldListings, categoryMetrics] = await Promise.all([
      loadActivePublicListings(),
      loadSoldMarketplaceListings(),
      getPublicCategoryMetricsPayload(),
    ]);
    const topLevelCategoryMetrics = buildTopLevelCategoryMetricsPayload(activeListings);

    const featuredListings = sortMarketplaceListings(
      activeListings.filter((listing) => Boolean(listing.featured)),
      'newest',
      ''
    ).slice(0, 12);

    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentSoldListings = sortMarketplaceListings(
      soldListings.filter((listing) => (toMarketplaceMillis(listing.updatedAt || listing.createdAt) || 0) >= sevenDaysAgo),
      'newest',
      ''
    ).slice(0, 12);

    const totalMarketValue = activeListings.reduce((sum, listing) => sum + (Number.isFinite(listing.price) ? listing.price : 0), 0);

    const payload = {
      featuredListings,
      recentSoldListings,
      categoryMetrics,
      topLevelCategoryMetrics,
      heroStats: {
        totalActive: activeListings.length,
        totalMarketValue,
      },
      asOf: new Date(now).toISOString(),
    };

    publicHomeDataCache = { value: payload, fetchedAt: now };
    return payload;
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }

    logger.warn('Serving emergency home marketplace snapshot because Firestore public read quota is exhausted.');
    const payload = getFallbackMarketplaceHomeData();
    publicHomeDataCache = { value: payload, fetchedAt: now };
    return payload;
  }
}

function parseMarketplaceListingFilters(queryParams = {}) {
  const readBoolean = (value, defaultValue = undefined) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(normalized)) return true;
    if (['0', 'false', 'no'].includes(normalized)) return false;
    return defaultValue;
  };

  const readString = (value) => {
    const normalized = normalizeNonEmptyString(value);
    return normalized || undefined;
  };

  return {
    q: readString(queryParams.q),
    featured: readBoolean(queryParams.featured, false),
    inStockOnly: readBoolean(queryParams.inStockOnly, true),
    category: readString(queryParams.category),
    subcategory: readString(queryParams.subcategory),
    manufacturer: readString(queryParams.manufacturer),
    model: readString(queryParams.model),
    state: readString(queryParams.state),
    country: readString(queryParams.country),
    sellerUid: readString(queryParams.sellerUid),
    minPrice: readString(queryParams.minPrice),
    maxPrice: readString(queryParams.maxPrice),
    minYear: readString(queryParams.minYear),
    maxYear: readString(queryParams.maxYear),
    minHours: readString(queryParams.minHours),
    maxHours: readString(queryParams.maxHours),
    condition: readString(queryParams.condition),
    location: readString(queryParams.location),
    locationRadius: readString(queryParams.locationRadius),
    locationCenterLat: readString(queryParams.locationCenterLat),
    locationCenterLng: readString(queryParams.locationCenterLng),
    attachment: readString(queryParams.attachment),
    feature: readString(queryParams.feature),
    stockNumber: readString(queryParams.stockNumber),
    serialNumber: readString(queryParams.serialNumber),
    sortBy: readString(queryParams.sortBy) || 'newest',
  };
}

async function getMarketplaceStatsPayload() {
  const now = Date.now();
  if (marketplaceStatsCache && now - marketplaceStatsCache.fetchedAt < MARKETPLACE_STATS_TTL_MS) {
    return marketplaceStatsCache.value;
  }

  try {
    const [listingsSnap, inquiriesSnap] = await Promise.all([
      getDb().collection('listings').where('approvalStatus', '==', 'approved').get(),
      getDb().collection('inquiries').get(),
    ]);

    let priceSum = 0;
    let pricedListingCount = 0;
    let totalViews = 0;
    let totalLeads = 0;
    const countries = new Set();

    listingsSnap.docs.forEach((doc) => {
      const data = doc.data() || {};
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
    const activeBuyerKeys = new Set();

    inquiriesSnap.docs.forEach((doc) => {
      const data = doc.data() || {};
      const createdAt = parseCreatedAt(data.createdAt);
      if (!createdAt || createdAt < cutoff) return;

      const buyerKey = data.buyerUid || (data.buyerEmail ? String(data.buyerEmail).toLowerCase() : null) || data.buyerPhone || null;
      if (buyerKey) activeBuyerKeys.add(String(buyerKey));
    });

    const payload = {
      monthlyActiveBuyers: activeBuyerKeys.size,
      avgEquipmentValue: pricedListingCount > 0 ? Math.round(priceSum / pricedListingCount) : 0,
      globalReachCountries: countries.size,
      conversionRate: totalViews > 0 ? Number(((totalLeads / totalViews) * 100).toFixed(1)) : 0,
      asOf: new Date(now).toISOString(),
    };

    marketplaceStatsCache = { value: payload, fetchedAt: now };
    return payload;
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }

    logger.warn('Serving emergency marketplace stats snapshot because Firestore public read quota is exhausted.');
    const payload = getFallbackMarketplaceStats();
    marketplaceStatsCache = { value: payload, fetchedAt: now };
    return payload;
  }
}

async function assessRecaptchaToken(token, action) {
  const client = new RecaptchaEnterpriseServiceClient();
  const projectPath = client.projectPath(RECAPTCHA_PROJECT_ID);
  const request = {
    assessment: {
      event: { token, siteKey: RECAPTCHA_SITE_KEY },
    },
    parent: projectPath,
  };
  const [response] = await client.createAssessment(request);
  if (!response.tokenProperties.valid) {
    logger.warn('reCAPTCHA token invalid:', response.tokenProperties.invalidReason);
    return { valid: false, score: 0 };
  }
  if (response.tokenProperties.action !== action) {
    logger.warn('reCAPTCHA action mismatch', { expected: action, got: response.tokenProperties.action });
    return { valid: false, score: 0 };
  }
  return { valid: true, score: response.riskAnalysis.score };
}

const LISTING_CHECKOUT_PLANS = {
  individual_seller: {
    id: 'individual_seller',
    name: 'Owner-Operator Ad Program',
    amountUsd: 39,
    listingCap: 1,
    productId: 'prod_UBpeOgS2Xbot2e',
    priceId: 'price_1TDRzJEFuycUwY0KZiFBQxTF',
  },
  dealer: {
    id: 'dealer',
    name: 'Dealer Ad Package',
    amountUsd: 499,
    listingCap: 50,
    productId: 'prod_UBpeHg3FydOSdD',
    priceId: 'price_1TDRzJEFuycUwY0KnU6HzAg2',
  },
  fleet_dealer: {
    id: 'fleet_dealer',
    name: 'Pro Dealer Ad Package',
    amountUsd: 999,
    listingCap: 150,
    productId: 'prod_UBpek9mEeZPlyC',
    priceId: 'price_1TDRzKEFuycUwY0KPkBneTyh',
  },
};

const DEALER_MANAGED_ACCOUNT_LIMIT = 3;
const MANAGED_ACCOUNT_PLAN_IDS = ['dealer', 'fleet_dealer'];
const MAX_OWNER_OPERATOR_LISTINGS = 10;
const SELLER_PROGRAM_AGREEMENT_VERSION = 'seller-program-global-v2026-03-26';
const SELLER_PROGRAM_TERMS_PATH = '/terms';
const SELLER_PROGRAM_PRIVACY_PATH = '/privacy';

function getSellerProgramStatementLabel(planId) {
  return planId === 'dealer' || planId === 'fleet_dealer'
    ? 'FES-DealerOS'
    : 'Forestry Equipment Sales';
}

function getPlanInvoiceDisplayName(planId) {
  if (planId === 'dealer') return 'FES-DealerOS Dealer Subscription';
  if (planId === 'fleet_dealer') return 'FES-DealerOS Pro Dealer Subscription';
  return 'Owner-Operator Ad Program';
}

function getCheckoutStatementDescriptorSuffix(planId) {
  if (planId === 'dealer' || planId === 'fleet_dealer') {
    return 'DEALEROS';
  }
  return 'OWNER OPS';
}

function getSellerProgramScope(planId) {
  return planId === 'dealer' || planId === 'fleet_dealer'
    ? 'dealeros'
    : 'owner_operator';
}

function sanitizeEnrollmentString(value, maxLength = 255) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeConsentFlag(value) {
  return value === true || value === 'true';
}

function validateSellerProgramEnrollment(rawEnrollment, planId) {
  const enrollment = rawEnrollment && typeof rawEnrollment === 'object' ? rawEnrollment : null;
  if (!enrollment) {
    return { error: 'Seller enrollment details are required before checkout.' };
  }

  const legalFullName = sanitizeEnrollmentString(enrollment.legalFullName, 120);
  const legalTitle = sanitizeEnrollmentString(enrollment.legalTitle, 120);
  const companyName = sanitizeEnrollmentString(enrollment.companyName, 200);
  const billingEmail = sanitizeEnrollmentString(enrollment.billingEmail, 320).toLowerCase();
  const phoneNumber = sanitizeEnrollmentString(enrollment.phoneNumber, 80);
  const website = sanitizeEnrollmentString(enrollment.website, 240);
  const country = sanitizeEnrollmentString(enrollment.country, 100);
  const taxIdOrVat = sanitizeEnrollmentString(enrollment.taxIdOrVat, 120);
  const notes = sanitizeEnrollmentString(enrollment.notes, 1000);
  const legalTermsVersion = sanitizeEnrollmentString(enrollment.legalTermsVersion, 80) || SELLER_PROGRAM_AGREEMENT_VERSION;
  const acceptedTerms = normalizeConsentFlag(enrollment.acceptedTerms);
  const acceptedPrivacy = normalizeConsentFlag(enrollment.acceptedPrivacy);
  const acceptedRecurringBilling = normalizeConsentFlag(enrollment.acceptedRecurringBilling);
  const acceptedVisibilityPolicy = normalizeConsentFlag(enrollment.acceptedVisibilityPolicy);
  const acceptedAuthority = normalizeConsentFlag(enrollment.acceptedAuthority);

  if (!legalFullName || !legalTitle || !billingEmail || !phoneNumber || !country) {
    return { error: 'Legal contact name, title, billing email, phone number, and billing country are required.' };
  }

  if ((planId === 'dealer' || planId === 'fleet_dealer') && !companyName) {
    return { error: 'Dealer and Pro Dealer enrollments require the dealership or business entity name.' };
  }

  if (!acceptedTerms || !acceptedPrivacy || !acceptedRecurringBilling || !acceptedVisibilityPolicy || !acceptedAuthority) {
    return { error: 'All seller legal acknowledgements must be accepted before checkout.' };
  }

  return {
    value: {
      legalFullName,
      legalTitle,
      companyName,
      billingEmail,
      phoneNumber,
      website,
      country,
      taxIdOrVat,
      notes,
      legalTermsVersion,
      acceptedTerms,
      acceptedPrivacy,
      acceptedRecurringBilling,
      acceptedVisibilityPolicy,
      acceptedAuthority,
      acceptedAtIso: new Date().toISOString(),
      scope: getSellerProgramScope(planId),
      statementLabel: getSellerProgramStatementLabel(planId),
    },
  };
}

async function recordSellerProgramCheckoutIntent({
  userUid,
  planId,
  customerId,
  subscriptionQuantity,
  session,
  enrollment,
}) {
  if (!userUid || !planId || !session?.id || !enrollment) return;

  const now = admin.firestore.FieldValue.serverTimestamp();
  const applicationRef = getDb().collection('sellerProgramApplications').doc(session.id);
  const consentRef = getDb().collection('consentLogs').doc();
  const userRef = getDb().collection('users').doc(userUid);

  await runFirestoreTaskWithQuotaTolerance(
    () => Promise.all([
      applicationRef.set(
        {
          userUid,
          planId,
          stripeCustomerId: customerId || null,
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId: null,
          checkoutUrl: session.url || null,
          statementLabel: enrollment.statementLabel,
          legalScope: enrollment.scope,
          legalTermsVersion: enrollment.legalTermsVersion,
          legalAcceptedAtIso: enrollment.acceptedAtIso,
          legalContactName: enrollment.legalFullName,
          legalContactTitle: enrollment.legalTitle,
          companyName: enrollment.companyName || null,
          billingEmail: enrollment.billingEmail,
          phoneNumber: enrollment.phoneNumber,
          website: enrollment.website || null,
          country: enrollment.country,
          taxIdOrVat: enrollment.taxIdOrVat || null,
          notes: enrollment.notes || null,
          acceptedTerms: true,
          acceptedPrivacy: true,
          acceptedRecurringBilling: true,
          acceptedVisibilityPolicy: true,
          acceptedAuthority: true,
          subscriptionQuantity,
          status: 'checkout_started',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      ),
      consentRef.set({
        userUid,
        consentType: 'seller_program_checkout',
        planId,
        statementLabel: enrollment.statementLabel,
        legalScope: enrollment.scope,
        legalTermsVersion: enrollment.legalTermsVersion,
        acceptedAtIso: enrollment.acceptedAtIso,
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedRecurringBilling: true,
        acceptedVisibilityPolicy: true,
        acceptedAuthority: true,
        stripeCheckoutSessionId: session.id,
        createdAt: now,
      }),
      upsertSellerProgramAgreementAcceptance({
        agreementId: session.id,
        userUid,
        actorUid: userUid,
        planId,
        statementLabel: enrollment.statementLabel,
        legalScope: enrollment.scope,
        agreementVersion: enrollment.legalTermsVersion,
        checkoutSessionId: session.id,
        stripeCustomerId: customerId || null,
        source: enrollment.source || 'ad_programs_form',
        acceptedAtIso: enrollment.acceptedAtIso,
        status: 'checkout_started',
        checkoutState: 'started',
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedRecurringBilling: true,
        acceptedVisibilityPolicy: true,
        acceptedAuthority: true,
        metadata: {
          subscriptionQuantity,
          billingEmail: enrollment.billingEmail,
          country: enrollment.country,
        },
      }),
      userRef.set(
        {
          sellerProgramAgreementVersion: enrollment.legalTermsVersion,
          sellerProgramAgreementAcceptedAt: now,
          sellerProgramAgreementPlanId: planId,
          sellerProgramAgreementScope: enrollment.scope,
          sellerProgramAgreementStatementLabel: enrollment.statementLabel,
          sellerProgramAgreementAcceptedTerms: true,
          sellerProgramAgreementAcceptedPrivacy: true,
          sellerProgramAgreementAcceptedRecurringBilling: true,
          sellerProgramAgreementAcceptedVisibilityPolicy: true,
          sellerProgramAgreementAcceptedAuthority: true,
          sellerProgramBillingCountry: enrollment.country,
          billingEmail: enrollment.billingEmail,
          legalContactName: enrollment.legalFullName,
          legalContactTitle: enrollment.legalTitle,
          updatedAt: now,
          ...(enrollment.companyName ? { company: enrollment.companyName } : {}),
          ...(enrollment.phoneNumber ? { phoneNumber: enrollment.phoneNumber } : {}),
          ...(enrollment.website ? { website: enrollment.website } : {}),
        },
        { merge: true }
      ),
    ]),
    'Seller program checkout enrollment persistence',
    {
      userUid,
      planId,
      sessionId: session.id,
    }
  );
}

async function finalizeSellerProgramCheckoutArtifacts({
  userUid,
  planId,
  session,
  subscriptionId,
  source,
}) {
  if (!userUid || !planId || !session?.id) return;

  const now = admin.firestore.FieldValue.serverTimestamp();
  const agreementVersion = sanitizeEnrollmentString(session.metadata?.legalTermsVersion, 80) || null;
  const legalAcceptedAtIso = sanitizeEnrollmentString(session.metadata?.legalTermsAcceptedAt, 80) || null;
  const statementLabel = getSellerProgramStatementLabel(planId);
  const legalScope = getSellerProgramScope(planId);
  const stripeConsentAccepted = session.consent?.terms_of_service === 'accepted' || normalizeConsentFlag(session.metadata?.legalTermsAccepted);

  await runFirestoreTaskWithQuotaTolerance(
    () => Promise.all([
      getDb().collection('sellerProgramApplications').doc(session.id).set(
        {
          status: stripeConsentAccepted ? 'checkout_confirmed' : 'checkout_processing',
          stripeSubscriptionId: subscriptionId || null,
          statementLabel,
          legalScope,
          legalTermsVersion: agreementVersion,
          legalAcceptedAtIso: legalAcceptedAtIso || null,
          stripeConsentAccepted,
          finalizedAt: now,
          updatedAt: now,
          finalizedVia: source,
        },
        { merge: true }
      ),
      getDb().collection('users').doc(userUid).set(
        {
          sellerProgramAgreementVersion: agreementVersion,
          sellerProgramAgreementAcceptedAt: now,
          sellerProgramAgreementPlanId: planId,
          sellerProgramAgreementScope: legalScope,
          sellerProgramAgreementStatementLabel: statementLabel,
          sellerProgramStripeConsentAccepted: stripeConsentAccepted,
          updatedAt: now,
        },
        { merge: true }
      ),
      upsertSellerProgramAgreementAcceptance({
        agreementId: session.id,
        userUid,
        actorUid: userUid,
        planId,
        statementLabel,
        legalScope,
        agreementVersion,
        checkoutSessionId: session.id,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : '',
        stripeSubscriptionId: subscriptionId || null,
        source,
        acceptedAtIso: legalAcceptedAtIso || null,
        status: stripeConsentAccepted ? 'checkout_confirmed' : 'checkout_processing',
        checkoutState: stripeConsentAccepted ? 'confirmed' : 'processing',
        acceptedTerms: stripeConsentAccepted,
        acceptedPrivacy: stripeConsentAccepted,
        acceptedRecurringBilling: stripeConsentAccepted,
        acceptedVisibilityPolicy: stripeConsentAccepted,
        acceptedAuthority: stripeConsentAccepted,
        metadata: {
          stripeConsentAccepted,
        },
        finalized: true,
      }),
    ]),
    'Seller program checkout finalization persistence',
    {
      userUid,
      planId,
      sessionId: session.id,
      subscriptionId: subscriptionId || null,
      source,
    }
  );
}

function getListingCheckoutPlan(rawPlanId) {
  const planId = String(rawPlanId || '').trim();
  if (!planId || !Object.prototype.hasOwnProperty.call(LISTING_CHECKOUT_PLANS, planId)) {
    return null;
  }
  return LISTING_CHECKOUT_PLANS[planId];
}

function getSellerRoleForPlan(planId) {
  if (planId === 'individual_seller') return 'individual_seller';
  if (planId === 'fleet_dealer') return 'pro_dealer';
  return 'dealer';
}

function inferPlanIdFromStripeIdentifiers({ productId = '', priceId = '' } = {}) {
  const normalizedProductId = String(productId || '').trim();
  const normalizedPriceId = String(priceId || '').trim();

  for (const [candidatePlanId, plan] of Object.entries(LISTING_CHECKOUT_PLANS)) {
    if (normalizedPriceId && String(plan?.priceId || '').trim() === normalizedPriceId) {
      return candidatePlanId;
    }
    if (normalizedProductId && String(plan?.productId || '').trim() === normalizedProductId) {
      return candidatePlanId;
    }
  }

  return '';
}

function inferPlanIdFromStripeSubscription(rawSubscription) {
  const metadataPlanId = String(rawSubscription?.metadata?.planId || '').trim();
  if (metadataPlanId && getListingCheckoutPlan(metadataPlanId)) {
    return metadataPlanId;
  }

  const firstItem = rawSubscription?.items?.data?.[0] || null;
  const priceId = String(firstItem?.price?.id || firstItem?.plan?.id || '').trim();
  const productId = typeof firstItem?.price?.product === 'string'
    ? firstItem.price.product
    : String(firstItem?.price?.product?.id || firstItem?.plan?.product || '').trim();

  return inferPlanIdFromStripeIdentifiers({ productId, priceId });
}

function getPlanDisplayName(planId) {
  const plan = getListingCheckoutPlan(planId);
  return plan?.name || String(planId || 'subscription').trim() || 'subscription';
}

function clampOwnerOperatorQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(MAX_OWNER_OPERATOR_LISTINGS, Math.floor(parsed)));
}

function resolveSubscriptionQuantityForPlan(planId, quantity, listingCap) {
  if (planId !== 'individual_seller') return 1;
  if (Number.isFinite(Number(quantity)) && Number(quantity) > 0) {
    return clampOwnerOperatorQuantity(quantity);
  }
  if (Number.isFinite(Number(listingCap)) && Number(listingCap) > 0) {
    return clampOwnerOperatorQuantity(listingCap);
  }
  return 1;
}

function emptyAccountSubscriptionAccessSummary() {
  return {
    planId: null,
    listingCap: 0,
    managedAccountCap: 0,
    subscriptionStatus: 'pending',
    currentSubscriptionId: null,
    currentPeriodEndIso: null,
    ownerOperatorQuantity: 0,
  };
}

function buildAccountSubscriptionAccessSummary(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return emptyAccountSubscriptionAccessSummary();
  }

  let ownerOperatorQuantity = 0;
  let hasDealer = false;
  let hasFleetDealer = false;
  let dealerSubId = null;
  let fleetSubId = null;
  let ownerSubId = null;
  let dealerStatus = null;
  let fleetStatus = null;
  let ownerStatus = null;
  let maxPeriodEndMillis = 0;

  entries.forEach((entry) => {
    const planId = String(entry?.planId || '').trim();
    const checkoutScope = String(entry?.checkoutScope || '').trim();
    const listingId = String(entry?.listingId || '').trim();

    const isAccountSubscription = checkoutScope === 'account' || (checkoutScope === '' && !listingId);
    if (!isAccountSubscription) return;

    const status = String(entry?.status || '').trim();
    const cancelAtPeriodEnd = Boolean(entry?.cancelAtPeriodEnd);
    const rawCurrentPeriodEndMillis = Number(entry?.currentPeriodEndMillis);
    const currentPeriodEndMillis = Number.isFinite(rawCurrentPeriodEndMillis)
      ? rawCurrentPeriodEndMillis
      : entry?.currentPeriodEnd && typeof entry.currentPeriodEnd.toMillis === 'function'
        ? entry.currentPeriodEnd.toMillis()
        : 0;
    const hasRemainingPeriod = currentPeriodEndMillis > Date.now();
    const retainsAccess = statusAllowsSellerAccess(status, cancelAtPeriodEnd, hasRemainingPeriod);
    if (!retainsAccess) return;

    if (currentPeriodEndMillis > maxPeriodEndMillis) {
      maxPeriodEndMillis = currentPeriodEndMillis;
    }

    if (planId === 'fleet_dealer') {
      hasFleetDealer = true;
      fleetSubId = fleetSubId || String(entry?.subscriptionId || '').trim() || null;
      fleetStatus = fleetStatus || status;
      return;
    }

    if (planId === 'dealer') {
      hasDealer = true;
      dealerSubId = dealerSubId || String(entry?.subscriptionId || '').trim() || null;
      dealerStatus = dealerStatus || status;
      return;
    }

    if (planId === 'individual_seller') {
      ownerSubId = ownerSubId || String(entry?.subscriptionId || '').trim() || null;
      ownerStatus = ownerStatus || status;
      const quantity = resolveSubscriptionQuantityForPlan(planId, entry?.subscriptionQuantity, entry?.listingCap);
      ownerOperatorQuantity += quantity;
    }
  });

  ownerOperatorQuantity = Math.min(MAX_OWNER_OPERATOR_LISTINGS, ownerOperatorQuantity);
  const currentPeriodEndIso = maxPeriodEndMillis > 0 ? new Date(maxPeriodEndMillis).toISOString() : null;

  if (hasFleetDealer) {
    return {
      planId: 'fleet_dealer',
      listingCap: LISTING_CHECKOUT_PLANS.fleet_dealer.listingCap,
      managedAccountCap: DEALER_MANAGED_ACCOUNT_LIMIT,
      subscriptionStatus: fleetStatus || 'active',
      currentSubscriptionId: fleetSubId,
      currentPeriodEndIso,
      ownerOperatorQuantity,
    };
  }

  if (hasDealer) {
    return {
      planId: 'dealer',
      listingCap: LISTING_CHECKOUT_PLANS.dealer.listingCap,
      managedAccountCap: DEALER_MANAGED_ACCOUNT_LIMIT,
      subscriptionStatus: dealerStatus || 'active',
      currentSubscriptionId: dealerSubId,
      currentPeriodEndIso,
      ownerOperatorQuantity,
    };
  }

  if (ownerOperatorQuantity > 0) {
    return {
      planId: 'individual_seller',
      listingCap: ownerOperatorQuantity,
      managedAccountCap: 0,
      subscriptionStatus: ownerStatus || 'active',
      currentSubscriptionId: ownerSubId,
      currentPeriodEndIso,
      ownerOperatorQuantity,
    };
  }

  return {
    planId: null,
    listingCap: 0,
    managedAccountCap: 0,
    subscriptionStatus: 'pending',
    currentSubscriptionId: null,
    currentPeriodEndIso,
    ownerOperatorQuantity,
  };
}

function getMostRelevantStripeAccountSubscriptionEntry(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  return entries
    .filter((entry) => {
      const checkoutScope = String(entry?.checkoutScope || '').trim();
      const listingId = String(entry?.listingId || '').trim();
      return checkoutScope === 'account' || (checkoutScope === '' && !listingId);
    })
    .sort((left, right) => {
      const leftPeriodEnd = Number(left?.currentPeriodEndMillis || 0);
      const rightPeriodEnd = Number(right?.currentPeriodEndMillis || 0);
      return rightPeriodEnd - leftPeriodEnd;
    })[0] || null;
}

async function listStripeAccountSubscriptionEntries(stripe, customerId) {
  const normalizedCustomerId = String(customerId || '').trim();
  if (!stripe || !normalizedCustomerId) return [];

  const entries = [];
  let startingAfter = '';

  do {
    const page = await stripe.subscriptions.list({
      customer: normalizedCustomerId,
      status: 'all',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    page.data.forEach((subscription) => {
      const metadata = subscription?.metadata || {};
      const inferredPlanId = inferPlanIdFromStripeSubscription(subscription);
      entries.push({
        subscriptionId: String(subscription?.id || '').trim(),
        planId: inferredPlanId || String(metadata.planId || '').trim(),
        checkoutScope: String(metadata.checkoutScope || '').trim(),
        listingId: String(metadata.listingId || '').trim(),
        status: normalizeStripeSubscriptionStatus(subscription?.status),
        cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
        currentPeriodEndMillis: typeof subscription?.current_period_end === 'number'
          ? Math.floor(subscription.current_period_end) * 1000
          : 0,
        subscriptionQuantity: subscription?.items?.data?.[0]?.quantity,
        listingCap: metadata.listingCap,
        createdMillis: typeof subscription?.created === 'number'
          ? Math.floor(subscription.created) * 1000
          : 0,
      });
    });

    startingAfter = page.has_more && page.data.length > 0
      ? String(page.data[page.data.length - 1].id || '')
      : '';
  } while (startingAfter);

  return entries;
}

async function runFirestoreTaskWithQuotaTolerance(task, description, context = {}) {
  try {
    return {
      ok: true,
      skipped: false,
      value: await task(),
    };
  } catch (error) {
    if (isFirestoreQuotaExceeded(error)) {
      logger.warn(`${description} skipped because Firestore quota is exhausted.`, context);
      return {
        ok: false,
        skipped: true,
        value: null,
        error,
      };
    }
    throw error;
  }
}

function buildAccountStateFromSources(userData = {}, authRecord = null, overrides = {}) {
  const authClaims = authRecord?.customClaims || {};
  const role = normalizeUserRole(
    overrides.role
    ?? userData.role
    ?? authClaims.role
    ?? 'buyer'
  );
  const accountStatus = normalizeAccountStatus(
    overrides.accountStatus
    ?? userData.accountStatus
    ?? authClaims.accountStatus
    ?? 'active'
  ) || 'active';
  const accountAccessSource = normalizeAccountAccessSource(
    overrides.accountAccessSource
    ?? userData.accountAccessSource
    ?? authClaims.accountAccessSource
  ) || null;
  const activeSubscriptionPlanId = String(
    overrides.activeSubscriptionPlanId
    ?? userData.activeSubscriptionPlanId
    ?? authClaims.subscriptionPlanId
    ?? ''
  ).trim() || null;
  const subscriptionStatus = String(
    overrides.subscriptionStatus
    ?? userData.subscriptionStatus
    ?? authClaims.subscriptionStatus
    ?? ''
  ).trim() || null;
  const rawListingCap = Number.isFinite(Number(
    overrides.listingCap
    ?? userData.listingCap
    ?? authClaims.listingCap
  ))
    ? Number(
      overrides.listingCap
      ?? userData.listingCap
      ?? authClaims.listingCap
    )
    : 0;
  const rawManagedAccountCap = Number.isFinite(Number(
    overrides.managedAccountCap
    ?? userData.managedAccountCap
    ?? authClaims.managedAccountCap
  ))
    ? Number(
      overrides.managedAccountCap
      ?? userData.managedAccountCap
      ?? authClaims.managedAccountCap
    )
    : 0;
  const listingCap = rawListingCap > 0 ? rawListingCap : getRoleDefaultListingCap(role);
  const managedAccountCap = rawManagedAccountCap > 0 ? rawManagedAccountCap : getRoleDefaultManagedAccountCap(role);
  const currentSubscriptionId = String(
    overrides.currentSubscriptionId
    ?? userData.currentSubscriptionId
    ?? ''
  ).trim() || null;
  const rawCurrentPeriodEnd = overrides.currentPeriodEnd ?? userData.currentPeriodEnd ?? '';
  const currentPeriodEnd = typeof rawCurrentPeriodEnd?.toDate === 'function'
    ? rawCurrentPeriodEnd.toDate().toISOString()
    : (String(rawCurrentPeriodEnd || '').trim() || null);

  return {
    role,
    accountStatus,
    accountAccessSource,
    activeSubscriptionPlanId,
    subscriptionStatus,
    listingCap,
    managedAccountCap,
    currentSubscriptionId,
    currentPeriodEnd,
  };
}

function deriveAccountProfileOnboardingIntent(userData = {}, accountState = {}) {
  const currentIntent = normalizeNonEmptyString(userData.onboardingIntent);
  if (currentIntent) return currentIntent;
  if (accountState.activeSubscriptionPlanId) return accountState.activeSubscriptionPlanId;
  if (accountState.accountAccessSource === 'free_member' || accountState.role === 'member') return 'free_member';
  return null;
}

function buildStorefrontSlugValue(value, fallback = 'timber-equip-storefront') {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || fallback;
}

function supportsEnterpriseStorefrontRole(role) {
  return ['individual_seller', 'dealer', 'pro_dealer', 'admin', 'super_admin'].includes(normalizeUserRole(role));
}

function sanitizeAccountProfilePatchPayload(rawPayload = {}) {
  const payload = rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload) ? rawPayload : {};
  const sanitized = {};

  const assignString = (key, maxLength = 255, { lower = false } = {}) => {
    if (!(key in payload)) return;
    let value = String(payload[key] ?? '').trim();
    if (lower) value = value.toLowerCase();
    sanitized[key] = value.slice(0, maxLength);
  };

  assignString('displayName', 100);
  assignString('email', 320, { lower: true });
  assignString('phoneNumber', 80);
  assignString('company', 200);
  assignString('website', 240);
  assignString('about', 5000);
  assignString('bio', 1200);
  assignString('location', 240);
  assignString('photoURL', 2000);
  assignString('coverPhotoUrl', 2000);
  assignString('preferredLanguage', 16);
  assignString('preferredCurrency', 12);
  assignString('storefrontName', 180);
  assignString('storefrontSlug', 200);
  assignString('storefrontTagline', 240);
  assignString('storefrontDescription', 5000);
  assignString('seoTitle', 200);
  assignString('seoDescription', 600);
  assignString('mfaPhoneNumber', 80);
  assignString('mfaDisplayName', 120);

  if ('emailNotificationsEnabled' in payload) {
    sanitized.emailNotificationsEnabled = Boolean(payload.emailNotificationsEnabled);
  }

  if ('mfaEnabled' in payload) {
    sanitized.mfaEnabled = Boolean(payload.mfaEnabled);
  }

  if ('mfaMethod' in payload) {
    const normalizedMethod = normalizeNonEmptyString(payload.mfaMethod).toLowerCase();
    sanitized.mfaMethod = normalizedMethod === 'sms' ? 'sms' : null;
  }

  if ('mfaEnrolledAt' in payload) {
    sanitized.mfaEnrolledAt = normalizeNonEmptyString(payload.mfaEnrolledAt) || null;
  }

  if ('seoKeywords' in payload) {
    sanitized.seoKeywords = Array.isArray(payload.seoKeywords)
      ? payload.seoKeywords
        .map((keyword) => String(keyword || '').trim())
        .filter(Boolean)
        .slice(0, 30)
      : [];
  }

  return sanitized;
}

function serializeAccountProfileData(uid, userData = {}, authRecord = null, overrides = {}) {
  const normalizedUid = normalizeNonEmptyString(uid);
  const normalizedEmail = normalizeNonEmptyString(
    overrides.email
      ?? userData.email
      ?? authRecord?.email
  ).toLowerCase();
  const privilegedAdmin = isPrivilegedAdminEmail(normalizedEmail);
  const accountState = buildAccountStateFromSources(userData, authRecord, {
    ...(privilegedAdmin
      ? {
          role: 'super_admin',
          accountStatus: 'active',
          accountAccessSource: 'admin_override',
        }
      : {}),
    ...overrides,
  });
  const entitlement = buildAccountEntitlementSnapshot(accountState);
  const enrolledFactors = Array.isArray(authRecord?.multiFactor?.enrolledFactors)
    ? authRecord.multiFactor.enrolledFactors
    : [];
  const smsFactor = enrolledFactors.find((factor) => String(factor?.factorId || '').trim().toLowerCase() === 'phone');
  const emailVerified = authRecord ? Boolean(authRecord.emailVerified) : Boolean(userData.emailVerified);

  return {
    uid: normalizedUid,
    email: normalizedEmail,
    displayName: normalizeNonEmptyString(
      userData.displayName
      || userData.name
      || authRecord?.displayName,
      'Forestry Equipment Sales User'
    ),
    role: accountState.role || 'buyer',
    emailNotificationsEnabled: userData.emailNotificationsEnabled !== false,
    preferredLanguage: normalizeNonEmptyString(userData.preferredLanguage) || undefined,
    preferredCurrency: normalizeNonEmptyString(userData.preferredCurrency) || undefined,
    photoURL: normalizeNonEmptyString(userData.photoURL || authRecord?.photoURL) || '',
    coverPhotoUrl: normalizeNonEmptyString(userData.coverPhotoUrl) || '',
    phoneNumber: normalizeNonEmptyString(userData.phoneNumber || authRecord?.phoneNumber) || '',
    twilioPhoneNumber: normalizeNonEmptyString(userData.twilioPhoneNumber) || '',
    company: normalizeNonEmptyString(userData.company) || '',
    website: normalizeNonEmptyString(userData.website) || '',
    about: normalizeNonEmptyString(userData.about) || '',
    bio: normalizeNonEmptyString(userData.bio) || '',
    location: normalizeNonEmptyString(userData.location) || '',
    storefrontEnabled: Boolean(userData.storefrontEnabled),
    storefrontSlug: normalizeNonEmptyString(userData.storefrontSlug) || '',
    storefrontName: normalizeNonEmptyString(userData.storefrontName) || '',
    storefrontTagline: normalizeNonEmptyString(userData.storefrontTagline) || '',
    storefrontDescription: normalizeNonEmptyString(userData.storefrontDescription) || '',
    seoTitle: normalizeNonEmptyString(userData.seoTitle) || '',
    seoDescription: normalizeNonEmptyString(userData.seoDescription) || '',
    seoKeywords: Array.isArray(userData.seoKeywords)
      ? userData.seoKeywords.filter((keyword) => typeof keyword === 'string')
      : [],
    parentAccountUid: normalizeNonEmptyString(userData.parentAccountUid) || null,
    accountStatus: accountState.accountStatus,
    accountAccessSource: accountState.accountAccessSource,
    onboardingIntent: deriveAccountProfileOnboardingIntent(userData, accountState),
    activeSubscriptionPlanId: accountState.activeSubscriptionPlanId,
    subscriptionStatus: accountState.subscriptionStatus,
    listingCap: accountState.listingCap,
    managedAccountCap: accountState.managedAccountCap,
    currentSubscriptionId: accountState.currentSubscriptionId,
    currentPeriodEnd: accountState.currentPeriodEnd,
    entitlement,
    stripeCustomerId: normalizeNonEmptyString(userData.stripeCustomerId) || '',
    mfaEnabled: Boolean(smsFactor || userData.mfaEnabled),
    mfaMethod: smsFactor ? 'sms' : (normalizeNonEmptyString(userData.mfaMethod) === 'sms' ? 'sms' : null),
    mfaPhoneNumber: normalizeNonEmptyString(smsFactor?.phoneNumber || userData.mfaPhoneNumber) || null,
    mfaDisplayName: normalizeNonEmptyString(smsFactor?.displayName || userData.mfaDisplayName) || null,
    mfaEnrolledAt:
      normalizeNonEmptyString(userData.mfaEnrolledAt)
      || normalizeNonEmptyString(smsFactor?.enrollmentTime)
      || null,
    favorites: Array.isArray(userData.favorites)
      ? userData.favorites.filter((favorite) => typeof favorite === 'string')
      : [],
    emailVerified,
    createdAt:
      timestampValueToIso(userData.createdAt)
      || timestampValueToIso(authRecord?.metadata?.creationTime)
      || new Date().toISOString(),
  };
}

function buildSeatContextProfileFallback(actorUid, profile = {}) {
  const activePlanId = normalizeNonEmptyString(profile.activeSubscriptionPlanId).toLowerCase();
  const activePlanIds = MANAGED_ACCOUNT_PLAN_IDS.includes(activePlanId) ? [activePlanId] : [];
  return {
    ownerUid: actorUid,
    seatLimit: Number(profile.managedAccountCap) || (activePlanIds.length > 0 ? DEALER_MANAGED_ACCOUNT_LIMIT : 0),
    seatCount: 0,
    activePlanIds,
  };
}

async function buildAccountBootstrapPayload(decodedToken, options = {}) {
  const stripe = options?.stripe || null;
  const actorUid = normalizeNonEmptyString(decodedToken?.uid);
  const actorEmail = normalizeNonEmptyString(decodedToken?.email);
  const actorDisplayName =
    normalizeNonEmptyString(decodedToken?.name) ||
    normalizeNonEmptyString(decodedToken?.displayName) ||
    'Forestry Equipment Sales User';
  const actorPhotoUrl = normalizeNonEmptyString(decodedToken?.picture);

  let authRecord = null;
  try {
    authRecord = await getAuthUserRecordSafe(actorUid);
  } catch (error) {
    logger.warn('Unable to load auth record for account bootstrap API.', {
      actorUid,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  let profileDocExists = false;
  let firestoreQuotaLimited = false;
  let profileSource = 'auth_fallback';
  let userData = {};

  try {
    const userSnapshot = await getDb().collection('users').doc(actorUid).get();
    if (userSnapshot.exists) {
      userData = userSnapshot.data() || {};
      profileDocExists = true;
      profileSource = 'firestore';
    }
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }

    firestoreQuotaLimited = true;
    logger.warn('Account bootstrap API falling back to auth-only data because Firestore quota is exhausted.', {
      actorUid,
    });
  }

  const baseAccountState = buildAccountStateFromSources(userData, authRecord);
  const stripeCustomerId = normalizeNonEmptyString(userData.stripeCustomerId);
  let subscriptionSummary = emptyAccountSubscriptionAccessSummary();
  try {
    subscriptionSummary = await resolveAccountSubscriptionAccessSummary(actorUid, {
      stripe,
      customerId: stripeCustomerId,
      skipFirestore: firestoreQuotaLimited || !!stripeCustomerId,
    });
  } catch (error) {
    logger.warn('Account bootstrap API could not resolve live subscription summary.', {
      actorUid,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const subscriptionOverrides = {};
  const effectivePlanId = normalizeNonEmptyString(subscriptionSummary.planId);
  if (effectivePlanId) {
    subscriptionOverrides.activeSubscriptionPlanId = effectivePlanId;
    subscriptionOverrides.subscriptionStatus = normalizeNonEmptyString(subscriptionSummary.subscriptionStatus) || 'active';
    subscriptionOverrides.listingCap = Number.isFinite(Number(subscriptionSummary.listingCap))
      ? Number(subscriptionSummary.listingCap)
      : baseAccountState.listingCap;
    subscriptionOverrides.managedAccountCap = Number.isFinite(Number(subscriptionSummary.managedAccountCap))
      ? Number(subscriptionSummary.managedAccountCap)
      : baseAccountState.managedAccountCap;
    subscriptionOverrides.currentSubscriptionId = normalizeNonEmptyString(subscriptionSummary.currentSubscriptionId) || null;
    subscriptionOverrides.currentPeriodEnd = subscriptionSummary.currentPeriodEndIso || null;
    if (!isSubscriptionExemptRole(baseAccountState.role)) {
      subscriptionOverrides.role = getSellerRoleForPlan(effectivePlanId);
      subscriptionOverrides.accountAccessSource = 'subscription';
      subscriptionOverrides.accountStatus = 'active';
    }
  }

  const profile = serializeAccountProfileData(actorUid, userData, authRecord, {
    uid: actorUid,
    email: actorEmail,
    displayName: authRecord?.displayName || actorDisplayName,
    photoURL: authRecord?.photoURL || actorPhotoUrl || null,
    emailVerified: authRecord ? Boolean(authRecord.emailVerified) : Boolean(decodedToken?.email_verified),
    ...subscriptionOverrides,
  });

  const normalizedRole = normalizeNonEmptyString(profile.role).toLowerCase();
  const shouldLoadSeatContext =
    Number(profile.managedAccountCap) > 0 ||
    ['dealer', 'pro_dealer', 'admin', 'super_admin', 'developer'].includes(normalizedRole);

  let seatContext = null;
  let seatContextSource = 'not_applicable';
  if (shouldLoadSeatContext) {
    try {
      seatContext = await getManagedAccountSeatContext(actorUid);
      seatContextSource = 'firestore';
    } catch (error) {
      if (!isFirestoreQuotaExceeded(error)) {
        throw error;
      }

      firestoreQuotaLimited = true;
      seatContext = buildSeatContextProfileFallback(actorUid, profile);
      seatContextSource = 'profile_fallback';
      logger.warn('Account bootstrap API falling back to profile-derived seat context because Firestore quota is exhausted.', {
        actorUid,
      });
    }
  }

  return {
    profile,
    source: profileSource,
    profileDocExists,
    firestoreQuotaLimited,
    seatContext,
    seatContextSource,
    fetchedAt: new Date().toISOString(),
  };
}

async function listAdminDirectoryUsersPayload() {
  const authUsers = [];
  let nextPageToken;
  do {
    const listResult = await admin.auth().listUsers(1000, nextPageToken);
    authUsers.push(...listResult.users);
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  if (authUsers.length === 0) {
    return {
      users: [],
      firestoreQuotaLimited: false,
      degradedSections: [],
      errors: {},
    };
  }

  const db = getDb();
  const uidChunks = [];
  for (let i = 0; i < authUsers.length; i += 500) {
    uidChunks.push(authUsers.slice(i, i + 500));
  }

  const profileDocMap = {};
  let firestoreProfilesAvailable = true;
  try {
    await Promise.all(
      uidChunks.map(async (chunk) => {
        const refs = chunk.map((authUserRecord) => db.collection('users').doc(authUserRecord.uid));
        const snaps = await db.getAll(...refs);
        snaps.forEach((snap) => {
          profileDocMap[snap.id] = snap;
        });
      })
    );
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }
    firestoreProfilesAvailable = false;
    logger.warn('Admin user directory falling back to auth-only data because Firestore quota is exhausted.', {
      authUserCount: authUsers.length,
    });
  }

  const users = authUsers.map((authRecord) => {
    const snap = profileDocMap[authRecord.uid];
    const data = snap && snap.exists ? (snap.data() || {}) : {};

    const authDisabled = Boolean(authRecord.disabled);
    const rawAccountStatus = normalize(String(data.accountStatus || 'active'));
    const accountStatus = ['active', 'pending', 'suspended'].includes(rawAccountStatus)
      ? rawAccountStatus
      : (authDisabled ? 'suspended' : 'active');
    const displayName = String(data.displayName || data.name || authRecord.displayName || '').trim();
    const email = String(data.email || authRecord.email || '').trim().toLowerCase();
    const phone = String(data.phoneNumber || '').trim();
    const createdAt = timestampValueToIso(data.createdAt) || timestampValueToIso(authRecord.metadata?.creationTime);
    const updatedAt = timestampValueToIso(data.updatedAt);
    const lastLogin =
      timestampValueToIso(authRecord.metadata?.lastSignInTime) ||
      timestampValueToIso(data.lastLogin) ||
      updatedAt ||
      createdAt;
    const fallbackRole = isPrivilegedAdminEmail(email)
      ? 'super_admin'
      : normalizeUserRole(String(authRecord.customClaims?.role || 'buyer'));
    const role = firestoreProfilesAvailable && isSupportedUserRole(String(data.role || ''))
      ? String(data.role)
      : fallbackRole;
    const fallbackAccountStatus = authDisabled ? 'suspended' : 'active';

    return {
      id: authRecord.uid,
      uid: authRecord.uid,
      name: displayName || email || 'Unknown User',
      displayName: displayName || email || 'Unknown User',
      email,
      phone,
      phoneNumber: phone,
      company: String(data.company || '').trim(),
      role,
      status: toAccountStatusLabel(accountStatus, authDisabled),
      accountStatus: firestoreProfilesAvailable ? accountStatus : fallbackAccountStatus,
      authDisabled,
      emailVerified: Boolean(authRecord.emailVerified),
      lastLogin,
      lastActive: lastLogin,
      memberSince: createdAt,
      createdAt,
      updatedAt,
      totalListings: Number(data.totalListings || 0),
      totalLeads: Number(data.totalLeads || 0),
      parentAccountUid: String(data.parentAccountUid || '').trim() || undefined,
    };
  });

  users.sort((left, right) => {
    const leftTime = Date.parse(left.lastLogin || left.memberSince || '') || 0;
    const rightTime = Date.parse(right.lastLogin || right.memberSince || '') || 0;
    return rightTime - leftTime;
  });

  return {
    users,
    firestoreQuotaLimited: !firestoreProfilesAvailable,
    degradedSections: firestoreProfilesAvailable ? [] : ['users_profile_enrichment'],
    errors: firestoreProfilesAvailable
      ? {}
      : {
          users: 'User profile enrichment is temporarily unavailable because the Firestore daily read quota is exhausted.',
      },
  };
}

async function getFirestoreQueryCount(query) {
  if (query && typeof query.count === 'function') {
    const aggregateSnapshot = await query.count().get();
    const aggregateData = typeof aggregateSnapshot?.data === 'function' ? aggregateSnapshot.data() : {};
    return Number(aggregateData?.count || 0);
  }

  const snapshot = await query.get();
  return snapshot.size;
}

function computeAdminOverviewMarketSentiment({ conversionRate, inventoryTurnoverRate, liveListings }) {
  if (liveListings <= 0) {
    return 'Idle';
  }

  if (conversionRate >= 12 || inventoryTurnoverRate >= 18) {
    return 'Bullish';
  }

  if (conversionRate >= 5 || inventoryTurnoverRate >= 8) {
    return 'Stable';
  }

  return 'Cautious';
}

async function buildAdminOverviewBootstrapPayload() {
  const db = getDb();
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

  const errors = {};
  const degradedSections = [];
  let firestoreQuotaLimited = false;

  const resolveCount = (label, result, fallbackValue = 0) => {
    if (result.status === 'fulfilled') {
      return Number.isFinite(result.value) ? result.value : fallbackValue;
    }

    degradedSections.push(label);
    if (isFirestoreQuotaExceeded(result.reason)) {
      firestoreQuotaLimited = true;
      errors[label] = 'Temporarily unavailable because the Firestore daily read quota is exhausted.';
      return fallbackValue;
    }

    throw result.reason;
  };

  const totalListings = resolveCount('listings_total', totalListingsResult);
  const liveListings = resolveCount('listings_live', liveListingsResult);
  const pendingReview = resolveCount('listings_pending', pendingReviewResult);
  const rejectedListings = resolveCount('listings_rejected', rejectedListingsResult);
  const soldListings = resolveCount('listings_sold', soldListingsResult);
  const callVolume = resolveCount('calls_total', callCountResult);
  const activeUsers = resolveCount('users_active', activeUsersResult);

  let recentListings = [];
  if (recentListingsResult.status === 'fulfilled') {
    recentListings = recentListingsResult.value.docs.map((docSnapshot) => (
      buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {})
    ));
  } else if (isFirestoreQuotaExceeded(recentListingsResult.reason)) {
    firestoreQuotaLimited = true;
    degradedSections.push('recent_listings');
    errors.recent_listings = 'Recent inventory is temporarily unavailable because the Firestore daily read quota is exhausted.';
  } else {
    throw recentListingsResult.reason;
  }

  let recentCalls = [];
  if (recentCallsResult.status === 'fulfilled') {
    recentCalls = recentCallsResult.value.docs.map((docSnapshot) => serializeCallDoc(docSnapshot));
  } else if (isFirestoreQuotaExceeded(recentCallsResult.reason)) {
    firestoreQuotaLimited = true;
    degradedSections.push('recent_calls');
    errors.recent_calls = 'Recent calls are temporarily unavailable because the Firestore daily read quota is exhausted.';
  } else {
    throw recentCallsResult.reason;
  }

  let totalInquiries = 0;
  let wonInquiries = 0;
  if (inquiriesResult.status === 'fulfilled') {
    const inquiries = inquiriesResult.value.docs.map((docSnapshot) => serializeInquiryDoc(docSnapshot));
    totalInquiries = inquiries.length;
    wonInquiries = inquiries.filter((inquiry) => inquiry.status === 'Won').length;
  } else if (isFirestoreQuotaExceeded(inquiriesResult.reason)) {
    firestoreQuotaLimited = true;
    degradedSections.push('inquiries_summary');
    errors.inquiries_summary = 'Inquiry summary is temporarily unavailable because the Firestore daily read quota is exhausted.';
  } else {
    throw inquiriesResult.reason;
  }

  const conversionRate = totalInquiries > 0
    ? Number(((wonInquiries / totalInquiries) * 100).toFixed(1))
    : 0;
  const inventoryTurnoverRate = totalListings > 0
    ? Number(((soldListings / totalListings) * 100).toFixed(1))
    : 0;

  return {
    metrics: {
      visibleEquipment: liveListings,
      totalLeads: totalInquiries,
      callVolume,
      activeUsers,
      conversionRate,
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
    partial: degradedSections.length > 0,
    degradedSections: Array.from(new Set(degradedSections)),
    errors,
    firestoreQuotaLimited,
    fetchedAt: new Date().toISOString(),
  };
}

async function buildAdminOperationsBootstrapPayload(options = {}) {
  const includeOverview = options.includeOverview === true;
  const overviewPromise = includeOverview
    ? buildAdminOverviewBootstrapPayload()
    : Promise.resolve(null);

  const [usersResult, inquiriesResult, callsResult, overviewResult] = await Promise.allSettled([
    listAdminDirectoryUsersPayload(),
    getDb().collection('inquiries').orderBy('createdAt', 'desc').get(),
    getDb().collection('calls').orderBy('createdAt', 'desc').get(),
    overviewPromise,
  ]);

  const errors = {};
  const degradedSections = [];
  let firestoreQuotaLimited = false;

  let users = [];
  if (usersResult.status === 'fulfilled') {
    users = Array.isArray(usersResult.value.users) ? usersResult.value.users : [];
    if (usersResult.value.firestoreQuotaLimited) {
      firestoreQuotaLimited = true;
    }
    if (Array.isArray(usersResult.value.degradedSections)) {
      degradedSections.push(...usersResult.value.degradedSections);
    }
    if (usersResult.value.errors && typeof usersResult.value.errors === 'object') {
      Object.assign(errors, usersResult.value.errors);
    }
  } else {
    throw usersResult.reason;
  }

  const inquiries =
    inquiriesResult.status === 'fulfilled'
      ? inquiriesResult.value.docs.map((docSnapshot) => serializeInquiryDoc(docSnapshot))
      : [];
  if (inquiriesResult.status !== 'fulfilled') {
    degradedSections.push('inquiries');
    if (isFirestoreQuotaExceeded(inquiriesResult.reason)) {
      firestoreQuotaLimited = true;
      errors.inquiries = 'Admin inquiries are temporarily unavailable because the Firestore daily read quota is exhausted.';
    } else {
      throw inquiriesResult.reason;
    }
  }

  const calls =
    callsResult.status === 'fulfilled'
      ? callsResult.value.docs.map((docSnapshot) => serializeCallDoc(docSnapshot))
      : [];
  if (callsResult.status !== 'fulfilled') {
    degradedSections.push('calls');
    if (isFirestoreQuotaExceeded(callsResult.reason)) {
      firestoreQuotaLimited = true;
      errors.calls = 'Admin calls are temporarily unavailable because the Firestore daily read quota is exhausted.';
    } else {
      throw callsResult.reason;
    }
  }

  let overview = null;
  if (overviewResult.status === 'fulfilled' && overviewResult.value) {
    overview = overviewResult.value;
    if (overviewResult.value.firestoreQuotaLimited) {
      firestoreQuotaLimited = true;
    }
    if (Array.isArray(overviewResult.value.degradedSections)) {
      degradedSections.push(...overviewResult.value.degradedSections.map((section) => `overview:${section}`));
    }
    if (overviewResult.value.errors && typeof overviewResult.value.errors === 'object') {
      Object.entries(overviewResult.value.errors).forEach(([key, value]) => {
        if (!errors[`overview_${key}`] && value) {
          errors[`overview_${key}`] = value;
        }
      });
    }
  } else if (includeOverview && overviewResult.status === 'rejected' && isFirestoreQuotaExceeded(overviewResult.reason)) {
    firestoreQuotaLimited = true;
    degradedSections.push('overview');
    errors.overview = 'Admin overview is temporarily unavailable because the Firestore daily read quota is exhausted.';
  } else if (includeOverview && overviewResult.status === 'rejected') {
    throw overviewResult.reason;
  }

  return {
    users,
    inquiries,
    calls,
    overview,
    partial: degradedSections.length > 0,
    degradedSections: Array.from(new Set(degradedSections)),
    errors,
    firestoreQuotaLimited,
    fetchedAt: new Date().toISOString(),
  };
}

async function writeAccountAuditLog({
  eventType,
  actorUid = '',
  targetUid = '',
  source = '',
  reason = '',
  previousState = null,
  nextState = null,
  metadata = {},
}) {
  const normalizedEventType = String(eventType || '').trim();
  const normalizedTargetUid = String(targetUid || '').trim();
  if (!normalizedEventType || !normalizedTargetUid) return;

  const payload = {
    eventType: normalizedEventType,
    actorUid: String(actorUid || '').trim() || null,
    targetUid: normalizedTargetUid,
    source: String(source || '').trim() || null,
    reason: String(reason || '').trim() || null,
    previousState: previousState || null,
    nextState: nextState || null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await runFirestoreTaskWithQuotaTolerance(
    () => getDb().collection('accountAuditLogs').add(payload),
    'Account audit log write',
    {
      eventType: normalizedEventType,
      actorUid: payload.actorUid,
      targetUid: normalizedTargetUid,
      source: payload.source,
    }
  );
}

async function applyListingLifecycleAction({
  listingRef,
  listingId,
  listing,
  action,
  actorUid = '',
  actorRole = '',
  reason = '',
  metadata = {},
}) {
  const normalizedListingId = String(listingId || listingRef?.id || '').trim();
  if (!listingRef || !normalizedListingId || !listing) {
    throw new Error('Listing lifecycle action requires an existing listing reference and data.');
  }

  const { patch, currentLifecycleState } = buildLifecyclePatch({
    listingId: normalizedListingId,
    listing,
    action,
    actorUid,
    actorRole,
    reason,
    metadata,
  });

  await listingRef.set(patch, { merge: true });
  return { patch, currentLifecycleState };
}

async function upsertSellerProgramAgreementAcceptance({
  agreementId,
  userUid,
  actorUid = '',
  planId,
  statementLabel = '',
  legalScope = '',
  agreementVersion = '',
  checkoutSessionId = '',
  stripeCustomerId = '',
  stripeSubscriptionId = '',
  source = '',
  acceptedAtIso = '',
  status = '',
  checkoutState = '',
  acceptedTerms = false,
  acceptedPrivacy = false,
  acceptedRecurringBilling = false,
  acceptedVisibilityPolicy = false,
  acceptedAuthority = false,
  metadata = {},
  finalized = false,
}) {
  const normalizedAgreementId = String(agreementId || '').trim();
  const normalizedUserUid = String(userUid || '').trim();
  const normalizedPlanId = String(planId || '').trim();
  if (!normalizedAgreementId || !normalizedUserUid || !normalizedPlanId) return;

  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload = {
    userUid: normalizedUserUid,
    actorUid: String(actorUid || normalizedUserUid).trim() || normalizedUserUid,
    planId: normalizedPlanId,
    statementLabel: String(statementLabel || '').trim() || null,
    legalScope: String(legalScope || '').trim() || null,
    agreementVersion: String(agreementVersion || '').trim() || null,
    checkoutSessionId: String(checkoutSessionId || normalizedAgreementId).trim() || normalizedAgreementId,
    stripeCustomerId: String(stripeCustomerId || '').trim() || null,
    stripeSubscriptionId: String(stripeSubscriptionId || '').trim() || null,
    source: String(source || '').trim() || null,
    acceptedAtIso: String(acceptedAtIso || '').trim() || null,
    acceptedTerms: Boolean(acceptedTerms),
    acceptedPrivacy: Boolean(acceptedPrivacy),
    acceptedRecurringBilling: Boolean(acceptedRecurringBilling),
    acceptedVisibilityPolicy: Boolean(acceptedVisibilityPolicy),
    acceptedAuthority: Boolean(acceptedAuthority),
    status: String(status || '').trim() || null,
    checkoutState: String(checkoutState || '').trim() || null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    updatedAt: now,
  };

  if (finalized) {
    payload.finalizedAt = now;
  } else {
    payload.createdAt = now;
  }

  await runFirestoreTaskWithQuotaTolerance(
    () => getDb().collection('sellerProgramAgreementAcceptances').doc(normalizedAgreementId).set(payload, { merge: true }),
    'Seller program agreement acceptance persistence',
    {
      agreementId: normalizedAgreementId,
      userUid: normalizedUserUid,
      planId: normalizedPlanId,
      source: payload.source,
    }
  );
}

async function resolveAccountSubscriptionAccessSummary(userUid, options = {}) {
  const normalizedUserUid = String(userUid || '').trim();
  if (!normalizedUserUid) {
    return emptyAccountSubscriptionAccessSummary();
  }

  const stripe = options?.stripe || null;
  const customerId = String(options?.customerId || '').trim();
  const skipFirestore = Boolean(options?.skipFirestore);

  if (skipFirestore && stripe && customerId) {
    const stripeEntries = await listStripeAccountSubscriptionEntries(stripe, customerId);
    return buildAccountSubscriptionAccessSummary(stripeEntries);
  }

  try {
    const subscriptionsSnap = await getDb().collection('subscriptions').where('userUid', '==', normalizedUserUid).get();
    const entries = subscriptionsSnap.docs.map((doc) => ({
      subscriptionId: doc.id,
      ...(doc.data() || {}),
    }));
    return buildAccountSubscriptionAccessSummary(entries);
  } catch (error) {
    if (isFirestoreQuotaExceeded(error) && stripe && customerId) {
      const stripeEntries = await listStripeAccountSubscriptionEntries(stripe, customerId);
      return buildAccountSubscriptionAccessSummary(stripeEntries);
    }
    throw error;
  }
}

function shouldBypassFirestoreForStripeSync(source = '') {
  return String(source || '').trim().toLowerCase().startsWith('webhook:');
}

function statusAllowsSellerAccess(status, cancelAtPeriodEnd, hasRemainingPeriod) {
  return status === 'active'
    || status === 'trialing'
    || (status === 'canceled' && cancelAtPeriodEnd && hasRemainingPeriod);
}

function firestoreTimestampToIso(value) {
  if (!value || typeof value.toDate !== 'function') return null;
  return value.toDate().toISOString();
}

async function applyAccountSubscriptionToUserProfile({ stripe = null, stripeCustomerId = '', userUid, planId, subscriptionStatus, subscriptionId, currentPeriodEnd, cancelAtPeriodEnd = false, source, skipFirestore = false }) {
  const normalizedUserUid = String(userUid || '').trim();
  const normalizedPlanId = String(planId || '').trim();
  if (!normalizedUserUid || !normalizedPlanId) return;

  const userRef = getDb().collection('users').doc(normalizedUserUid);
  let existingUser = {};
  let existingRole = 'buyer';
  let existingAccessSource = '';
  let resolvedStripeCustomerId = String(stripeCustomerId || '').trim();
  let firestoreQuotaLimited = false;

  if (!skipFirestore) {
    try {
      const userSnap = await userRef.get();
      existingUser = userSnap.data() || {};
      existingRole = normalizeUserRole(existingUser.role);
      existingAccessSource = normalizeAccountAccessSource(existingUser.accountAccessSource);
      resolvedStripeCustomerId = resolvedStripeCustomerId || String(existingUser.stripeCustomerId || '').trim();
    } catch (error) {
      if (!isFirestoreQuotaExceeded(error)) {
        throw error;
      }
      firestoreQuotaLimited = true;
      const authUserRecord = await getAuthUserRecordSafe(normalizedUserUid);
      existingRole = normalizeUserRole(String(authUserRecord?.customClaims?.role || ''));
      existingAccessSource = normalizeAccountAccessSource(authUserRecord?.customClaims?.accountAccessSource);
    }
  } else {
    const authUserRecord = await getAuthUserRecordSafe(normalizedUserUid);
    existingRole = normalizeUserRole(String(authUserRecord?.customClaims?.role || ''));
    existingAccessSource = normalizeAccountAccessSource(authUserRecord?.customClaims?.accountAccessSource);
  }

  const authUserRecord = await getAuthUserRecordSafe(normalizedUserUid);
  const previousCompactState = buildCompactAccountState(
    buildAccountStateFromSources(existingUser, authUserRecord)
  );

  const summary = await resolveAccountSubscriptionAccessSummary(normalizedUserUid, {
    stripe,
    customerId: resolvedStripeCustomerId,
    skipFirestore: skipFirestore || firestoreQuotaLimited,
  });
  const retainsSellerAccess = !!summary.planId;
  const normalizedIncomingSubscriptionStatus = normalizeStripeSubscriptionStatus(subscriptionStatus);
  const effectiveSubscriptionStatus = retainsSellerAccess
    ? summary.subscriptionStatus
    : normalizedIncomingSubscriptionStatus;
  const nextRole = isSubscriptionExemptRole(existingRole)
    ? existingRole
    : retainsSellerAccess && summary.planId
      ? getSellerRoleForPlan(summary.planId)
      : 'member';
  const nextAccessSource = isSubscriptionExemptRole(existingRole)
    ? normalizeAccountAccessSource(existingAccessSource) || 'admin_override'
    : retainsSellerAccess
      ? 'subscription'
      : 'free_member';

  const updatePayload = {
    activeSubscriptionPlanId: summary.planId,
    subscriptionStatus: effectiveSubscriptionStatus,
    listingCap: summary.listingCap,
    managedAccountCap: summary.managedAccountCap,
    currentSubscriptionId: summary.currentSubscriptionId,
    currentPeriodEnd: summary.currentPeriodEndIso,
    accountStatus: nextAccessSource === 'pending_checkout' ? 'pending' : 'active',
    accountAccessSource: nextAccessSource,
    onboardingIntent: normalizedPlanId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!isSubscriptionExemptRole(existingRole)) {
    updatePayload.role = nextRole;
  }

  if (!skipFirestore) {
    await runFirestoreTaskWithQuotaTolerance(
      () => userRef.set(updatePayload, { merge: true }),
      'Account subscription profile sync',
      {
        userUid: normalizedUserUid,
        planId: normalizedPlanId,
        source,
      }
    );
  }

  if (authUserRecord) {
    const existingClaims = authUserRecord.customClaims || {};
    const nextClaims = buildAccessClaims(existingClaims, {
      role: isSubscriptionExemptRole(existingRole)
        ? normalizeUserRole(String(existingClaims.role || existingRole || 'buyer'))
        : nextRole,
      subscriptionPlanId: summary.planId,
      listingCap: summary.listingCap,
      managedAccountCap: summary.managedAccountCap,
      subscriptionStatus: effectiveSubscriptionStatus,
      accountStatus: updatePayload.accountStatus,
      accountAccessSource: isSubscriptionExemptRole(existingRole)
        ? normalizeAccountAccessSource(existingClaims.accountAccessSource) || 'admin_override'
        : nextAccessSource,
    });
    const nextCompactState = buildCompactAccountState(
      buildAccountStateFromSources(existingUser, authUserRecord, {
        role: nextClaims.role,
        accountStatus: nextClaims.accountStatus || updatePayload.accountStatus,
        accountAccessSource: nextClaims.accountAccessSource || nextAccessSource,
        activeSubscriptionPlanId: summary.planId,
        subscriptionStatus: effectiveSubscriptionStatus,
        listingCap: summary.listingCap,
        managedAccountCap: summary.managedAccountCap,
        currentSubscriptionId: summary.currentSubscriptionId,
        currentPeriodEnd: summary.currentPeriodEndIso,
      })
    );

    await admin.auth().setCustomUserClaims(normalizedUserUid, nextClaims);

    if (JSON.stringify(previousCompactState) !== JSON.stringify(nextCompactState)) {
      await writeAccountAuditLog({
        eventType: 'SELLER_ENTITLEMENT_SYNC',
        actorUid: null,
        targetUid: normalizedUserUid,
        source,
        reason: `Applied ${normalizedPlanId || 'seller'} subscription sync`,
        previousState: previousCompactState,
        nextState: nextCompactState,
        metadata: {
          requestedPlanId: normalizedPlanId,
          effectivePlanId: summary.planId || null,
          requestedSubscriptionStatus: normalizedIncomingSubscriptionStatus || null,
          effectiveSubscriptionStatus: effectiveSubscriptionStatus || null,
          cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
          firestoreQuotaLimited,
        },
      });
    }
  }

  if (!skipFirestore) {
    const shouldKeepListingsPublic = retainsSellerAccess || canAdministrateAccount(existingRole);
    try {
      const listingSnapshots = await Promise.all([
        getDb().collection('listings').where('sellerUid', '==', normalizedUserUid).get(),
        getDb().collection('listings').where('sellerId', '==', normalizedUserUid).get(),
      ]);
      const listingMap = new Map();
      listingSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          listingMap.set(docSnap.id, docSnap);
        });
      });

      if (listingMap.size > 0) {
        let batch = getDb().batch();
        let batchOps = 0;
        let updatedListings = 0;

        for (const listingSnap of listingMap.values()) {
          const listingData = listingSnap.data() || {};
          const nextPaymentStatus = shouldKeepListingsPublic ? 'paid' : 'pending';
          if (String(listingData.paymentStatus || '').trim().toLowerCase() === nextPaymentStatus) {
            continue;
          }

          batch.set(
            listingSnap.ref,
            {
              paymentStatus: nextPaymentStatus,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          batchOps += 1;
          updatedListings += 1;

          if (batchOps >= 400) {
            await batch.commit();
            batch = getDb().batch();
            batchOps = 0;
          }
        }

        if (batchOps > 0) {
          await batch.commit();
        }

        if (updatedListings > 0) {
          await getDb().collection('billingAuditLogs').add({
            action: shouldKeepListingsPublic ? 'ACCOUNT_LISTINGS_RESTORED' : 'ACCOUNT_LISTINGS_HIDDEN',
            userUid: normalizedUserUid,
            listingId: null,
            details: `${shouldKeepListingsPublic ? 'Restored' : 'Suppressed'} public visibility for ${updatedListings} listings after ${normalizedPlanId} subscription sync via ${source}.`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    } catch (error) {
      if (isFirestoreQuotaExceeded(error)) {
        logger.warn('Skipping account listing visibility sync because Firestore quota is exhausted.', {
          userUid: normalizedUserUid,
          planId: normalizedPlanId,
          shouldKeepListingsPublic,
        });
      } else {
        throw error;
      }
    }

    await runFirestoreTaskWithQuotaTolerance(
      () => getDb().collection('billingAuditLogs').add({
        action: 'ACCOUNT_SUBSCRIPTION_SYNC',
        userUid: normalizedUserUid,
        listingId: null,
        details: `Applied ${normalizedPlanId} subscription access as ${subscriptionStatus} via ${source}. Effective plan: ${summary.planId || 'none'}, listing cap: ${summary.listingCap}.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
      'Account subscription billing audit log write',
      {
        userUid: normalizedUserUid,
        planId: normalizedPlanId,
        source,
      }
    );
  }

  // ── Twilio number lifecycle ──
  try {
    if (retainsSellerAccess && summary.planId) {
      await provisionTwilioNumberForSeller(normalizedUserUid, summary.planId);
    } else if (!retainsSellerAccess) {
      await releaseTwilioNumberForSeller(normalizedUserUid);
    }
  } catch (twilioError) {
    logger.error('Twilio number lifecycle failed (non-fatal).', {
      userUid: normalizedUserUid,
      planId: summary.planId,
      retainsSellerAccess,
      error: String(twilioError?.message || twilioError),
    });
  }
}

async function getManagedAccountSeatContext(ownerUid) {
  const normalizedOwnerUid = String(ownerUid || '').trim();
  if (!normalizedOwnerUid) {
    return {
      ownerUid: '',
      seatLimit: 0,
      seatCount: 0,
      activePlanIds: [],
    };
  }

  const [subscriptionsSnap, managedAccountsSnap] = await Promise.all([
    getDb()
      .collection('subscriptions')
      .where('userUid', '==', normalizedOwnerUid)
      .where('status', '==', 'active')
      .get(),
    getDb()
      .collection('users')
      .where('parentAccountUid', '==', normalizedOwnerUid)
      .get(),
  ]);

  const activePlanIds = Array.from(
    new Set(
      subscriptionsSnap.docs
        .map((doc) => String(doc.data()?.planId || '').trim())
        .filter((planId) => MANAGED_ACCOUNT_PLAN_IDS.includes(planId))
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

function createStripeClient() {
  const secret = String(STRIPE_SECRET_KEY.value() || '').trim();
  if (!secret) return null;
  return new Stripe(secret, {
    apiVersion: '2026-02-25.clover',
    timeout: 15000,
    maxNetworkRetries: 1,
  });
}

// ── Twilio client ───────────────────────────────────────────────────────────
function createTwilioClient() {
  const sid = String(TWILIO_ACCOUNT_SID.value() || '').trim();
  const token = String(TWILIO_AUTH_TOKEN.value() || '').trim();
  const apiKeySid = String(TWILIO_API_KEY_SID.value() || '').trim();
  const apiKeySecret = String(TWILIO_API_KEY_SECRET.value() || '').trim();

  if (sid && apiKeySid && apiKeySecret) {
    return require('twilio')(apiKeySid, apiKeySecret, { accountSid: sid });
  }

  if (sid && token) {
    return require('twilio')(sid, token);
  }

  return null;
}

function extractAreaCode(phoneNumber) {
  const digits = String(phoneNumber || '').replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1, 4);
  if (digits.length === 10) return digits.substring(0, 3);
  return '';
}

function validateTwilioRequest(req) {
  // Twilio webhook signature validation still relies on the account auth token.
  const token = String(TWILIO_AUTH_TOKEN.value() || '').trim();
  if (!token) return false;
  const twilio = require('twilio');
  const sig = req.headers['x-twilio-signature'] || '';
  const url = `${resolveConfiguredAppUrl()}${req.originalUrl || req.url}`;
  return twilio.validateRequest(token, sig, url, req.body || {});
}

function mapTwilioStatusToCallLogStatus(twilioStatus) {
  switch (String(twilioStatus || '').toLowerCase()) {
    case 'completed': return 'Completed';
    case 'busy':
    case 'no-answer':
    case 'canceled':
    case 'failed':
      return 'Missed';
    default: return 'Initiated';
  }
}

function shouldOfferTwilioVoicemailFallback(twilioStatus) {
  const normalizedStatus = String(twilioStatus || '').trim().toLowerCase();
  return ['busy', 'no-answer', 'canceled', 'failed'].includes(normalizedStatus);
}

function buildTwilioVoicemailTwiml(voicemailUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We could not reach the seller. Please leave a voicemail after the tone and Forestry Equipment Sales will deliver it to the seller.</Say>
  <Record action="${voicemailUrl}" method="POST" recordingStatusCallback="${voicemailUrl}" recordingStatusCallbackMethod="POST" maxLength="120" playBeep="true" trim="trim-silence" />
  <Say voice="Polly.Joanna">We did not receive a voicemail. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

function buildTwilioBasicAuthHeader() {
  const sid = String(TWILIO_ACCOUNT_SID.value() || '').trim();
  const token = String(TWILIO_AUTH_TOKEN.value() || '').trim();
  if (!sid || !token) {
    return '';
  }

  return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
}

function normalizeTwilioRecordingUrl(recordingUrl) {
  const value = String(recordingUrl || '').trim();
  if (!value) return '';
  return value.endsWith('.mp3') ? value : `${value}.mp3`;
}

function isAllowedTwilioRecordingUrl(recordingUrl) {
  const value = String(recordingUrl || '').trim();
  if (!value) return false;

  try {
    const url = new URL(value);
    return /^https:$/i.test(url.protocol) && /(^|\.)twilio\.com$/i.test(url.hostname);
  } catch (_error) {
    return false;
  }
}

async function streamTwilioRecordingToResponse(recordingUrl, res) {
  const normalizedRecordingUrl = normalizeTwilioRecordingUrl(recordingUrl);
  if (!normalizedRecordingUrl || !isAllowedTwilioRecordingUrl(normalizedRecordingUrl)) {
    return res.status(404).json({ error: 'Recording not available.' });
  }

  const authorization = buildTwilioBasicAuthHeader();
  if (!authorization) {
    return res.status(503).json({ error: 'Twilio recording access is not configured.' });
  }

  const upstreamResponse = await fetch(normalizedRecordingUrl, {
    method: 'GET',
    headers: {
      Authorization: authorization,
    },
  });

  if (!upstreamResponse.ok) {
    const statusCode = upstreamResponse.status === 404 ? 404 : 502;
    return res.status(statusCode).json({ error: 'Unable to retrieve voicemail recording right now.' });
  }

  const contentType = upstreamResponse.headers.get('content-type') || 'audio/mpeg';
  const body = Buffer.from(await upstreamResponse.arrayBuffer());
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'private, max-age=0, no-store');
  return res.status(200).send(body);
}

async function provisionTwilioNumberForSeller(userUid, planId) {
  if (!isSellerSubscriptionRole(getSellerRoleForPlan(planId))) return;

  const twilioClient = createTwilioClient();
  if (!twilioClient) {
    logger.warn('Twilio client not configured; skipping number provisioning.', { userUid, planId });
    return;
  }

  // Look up seller phone to determine area code
  const userSnap = await getDb().collection('users').doc(userUid).get();
  const userData = userSnap.data() || {};
  const sellerRealPhone = String(userData.phoneNumber || '').trim();
  const areaCode = extractAreaCode(sellerRealPhone);

  const webhookBaseUrl = `${resolveConfiguredAppUrl()}/api/twilio/voice`;
  const voiceUrl = `${webhookBaseUrl}/inbound`;
  const statusCallback = `${webhookBaseUrl}/status`;
  const friendlyName = `FES-${userUid.substring(0, 8)}`;

  // Check if seller already has an active Twilio number
  const existingSnap = await getDb().collection('twilioNumbers')
    .where('sellerUid', '==', userUid)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (!existingSnap.empty) {
    const existingDoc = existingSnap.docs[0];
    const existingData = existingDoc.data() || {};

    if (existingData.twilioPhoneSid) {
      try {
        await twilioClient.incomingPhoneNumbers(existingData.twilioPhoneSid).update({
          voiceUrl,
          voiceMethod: 'POST',
          statusCallback,
          statusCallbackMethod: 'POST',
          friendlyName,
        });
      } catch (error) {
        logger.warn('Unable to refresh webhook config for existing Twilio number.', {
          userUid,
          twilioPhoneSid: existingData.twilioPhoneSid,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await existingDoc.ref.set({
      sellerRealPhone,
      sellerName: String(userData.displayName || userData.storefrontName || existingData.sellerName || ''),
      planId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const existingNumber = normalizeNonEmptyString(existingDoc.id);
    if (existingNumber) {
      const existingBatch = getDb().batch();
      existingBatch.set(getDb().collection('users').doc(userUid), { twilioPhoneNumber: existingNumber }, { merge: true });
      existingBatch.set(getDb().collection('storefronts').doc(userUid), { twilioPhoneNumber: existingNumber }, { merge: true });
      await existingBatch.commit();
    }

    logger.info('Seller already has an active Twilio number; webhook config refreshed.', { userUid });
    return;
  }

  // Search for available local number matching area code
  let availableNumbers = [];
  try {
    if (areaCode) {
      availableNumbers = await twilioClient.availablePhoneNumbers('US').local.list({ areaCode, limit: 1 });
    }
    if (!availableNumbers.length) {
      availableNumbers = await twilioClient.availablePhoneNumbers('US').local.list({ limit: 1 });
    }
  } catch (err) {
    logger.error('Failed to search Twilio numbers.', { userUid, error: err.message });
    return;
  }

  if (!availableNumbers.length) {
    logger.error('No available Twilio numbers found.', { userUid, areaCode });
    return;
  }

  // Purchase the number
  const purchased = await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: availableNumbers[0].phoneNumber,
    voiceUrl,
    voiceMethod: 'POST',
    statusCallback,
    statusCallbackMethod: 'POST',
    friendlyName,
  });

  // Store mapping in Firestore
  await getDb().collection('twilioNumbers').doc(purchased.phoneNumber).set({
    sellerUid: userUid,
    sellerRealPhone,
    sellerName: String(userData.displayName || userData.storefrontName || ''),
    planId,
    twilioPhoneSid: purchased.sid,
    provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'active',
    releasedAt: null,
  });

  // Write Twilio number to user and storefront docs
  const batch = getDb().batch();
  batch.set(getDb().collection('users').doc(userUid), { twilioPhoneNumber: purchased.phoneNumber }, { merge: true });
  batch.set(getDb().collection('storefronts').doc(userUid), { twilioPhoneNumber: purchased.phoneNumber }, { merge: true });
  await batch.commit();

  logger.info('Twilio number provisioned.', { userUid, twilioNumber: purchased.phoneNumber });
}

async function releaseTwilioNumberForSeller(userUid) {
  const twilioClient = createTwilioClient();
  if (!twilioClient) return;

  const snapshot = await getDb().collection('twilioNumbers')
    .where('sellerUid', '==', userUid)
    .where('status', '==', 'active')
    .get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      await twilioClient.incomingPhoneNumbers(data.twilioPhoneSid).remove();
    } catch (err) {
      logger.error('Failed to release Twilio number.', { userUid, sid: data.twilioPhoneSid, error: err.message });
    }
    await doc.ref.set({ status: 'released', releasedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  const batch = getDb().batch();
  batch.set(getDb().collection('users').doc(userUid), { twilioPhoneNumber: admin.firestore.FieldValue.delete() }, { merge: true });
  const sfSnap = await getDb().collection('storefronts').doc(userUid).get();
  if (sfSnap.exists) {
    batch.set(sfSnap.ref, { twilioPhoneNumber: admin.firestore.FieldValue.delete() }, { merge: true });
  }
  await batch.commit();

  logger.info('Twilio number(s) released.', { userUid, count: snapshot.size });
}

// ── Twilio voice webhook handlers ──────────────────────────────────────────
async function handleTwilioInboundCall(req, res) {
  if (!validateTwilioRequest(req)) {
    logger.warn('Invalid Twilio request signature.', { path: req.path });
    res.set('Content-Type', 'text/xml');
    return res.status(403).send('<Response><Say>Unauthorized.</Say></Response>');
  }

  const calledNumber = String(req.body?.To || '').trim();
  const callerNumber = String(req.body?.From || '').trim();
  const callSid = String(req.body?.CallSid || '').trim();

  const numberDoc = await getDb().collection('twilioNumbers').doc(calledNumber).get();
  if (!numberDoc.exists || numberDoc.data()?.status !== 'active') {
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(
      '<Response><Say voice="Polly.Joanna">This number is no longer in service. Please visit forestry equipment sales dot com.</Say><Hangup/></Response>'
    );
  }

  const mapping = numberDoc.data();
  const sellerRealPhone = String(mapping.sellerRealPhone || '').trim();

  if (!sellerRealPhone) {
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(
      '<Response><Say voice="Polly.Joanna">The seller phone number is not available. Please try again later.</Say><Hangup/></Response>'
    );
  }

  // Create call log
  const callDocRef = getDb().collection('calls').doc();
  await callDocRef.set({
    id: callDocRef.id,
    twilioCallSid: callSid,
    callerPhone: callerNumber,
    callerName: '',
    callerUid: null,
    sellerUid: mapping.sellerUid || '',
    sellerId: mapping.sellerUid || '',
    sellerName: mapping.sellerName || '',
    sellerPhone: sellerRealPhone,
    listingId: '',
    listingTitle: '',
    duration: 0,
    status: 'Initiated',
    source: 'twilio_inbound',
    isAuthenticated: false,
    recordingUrl: null,
    twilioFromNumber: callerNumber,
    twilioToNumber: calledNumber,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const statusUrl = `${resolveConfiguredAppUrl()}/api/twilio/voice/status`;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">This call is monitored and recorded by Forestry Equipment Sales.</Say>
  <Dial record="record-from-answer-dual" action="${statusUrl}" method="POST" timeout="30" callerId="${calledNumber}">
    <Number statusCallbackEvent="initiated ringing answered completed" statusCallback="${statusUrl}" statusCallbackMethod="POST">${sellerRealPhone}</Number>
  </Dial>
</Response>`;

  res.set('Content-Type', 'text/xml');
  return res.status(200).send(twiml);
}

async function handleTwilioCallStatus(req, res) {
  // Status callbacks don't always have valid signatures when sent as action callbacks
  const callSid = String(req.body?.CallSid || '').trim();
  const callStatus = String(req.body?.DialCallStatus || req.body?.CallStatus || '').trim();
  const callDuration = parseInt(req.body?.CallDuration || req.body?.Duration || '0', 10) || 0;
  const recordingUrl = String(req.body?.RecordingUrl || '').trim() || null;

  if (!callSid) {
    res.set('Content-Type', 'text/xml');
    return res.status(200).send('<Response/>');
  }

  const callsSnap = await getDb().collection('calls')
    .where('twilioCallSid', '==', callSid)
    .limit(1)
    .get();

  if (!callsSnap.empty) {
    const mappedStatus = mapTwilioStatusToCallLogStatus(callStatus);
    await callsSnap.docs[0].ref.set({
      duration: callDuration,
      status: mappedStatus,
      recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
      twilioCallStatus: callStatus,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  res.set('Content-Type', 'text/xml');
  if (String(req.body?.DialCallStatus || '').trim() && shouldOfferTwilioVoicemailFallback(callStatus)) {
    const voicemailUrl = `${resolveConfiguredAppUrl()}/api/twilio/voice/voicemail`;
    return res.status(200).send(buildTwilioVoicemailTwiml(voicemailUrl));
  }

  return res.status(200).send('<Response/>');
}

async function handleTwilioVoicemail(req, res) {
  const callSid = String(req.body?.CallSid || '').trim();
  const recordingUrl = String(req.body?.RecordingUrl || '').trim();
  const recordingStatus = String(req.body?.RecordingStatus || '').trim();
  const recordingDuration = parseInt(req.body?.RecordingDuration || req.body?.CallDuration || '0', 10) || 0;

  if (!callSid) {
    res.set('Content-Type', 'text/xml');
    return res.status(200).send('<Response><Hangup/></Response>');
  }

  const callsSnap = await getDb().collection('calls')
    .where('twilioCallSid', '==', callSid)
    .limit(1)
    .get();

  if (callsSnap.empty) {
    res.set('Content-Type', 'text/xml');
    return res.status(200).send('<Response><Hangup/></Response>');
  }

  const callDoc = callsSnap.docs[0];
  const callData = callDoc.data() || {};
  const normalizedRecordingUrl = normalizeTwilioRecordingUrl(recordingUrl);
  const updates = {
    status: normalizedRecordingUrl ? 'Voicemail' : (callData.status || 'Missed'),
    duration: recordingDuration || Number(callData.duration || 0) || 0,
    recordingUrl: normalizedRecordingUrl || callData.recordingUrl || null,
    twilioCallStatus: recordingStatus || callData.twilioCallStatus || 'voicemail',
    voicemailCapturedAt: normalizedRecordingUrl
      ? admin.firestore.FieldValue.serverTimestamp()
      : (callData.voicemailCapturedAt || null),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await callDoc.ref.set(updates, { merge: true });

  const shouldNotifyByEmail =
    Boolean(normalizedRecordingUrl)
    && String(recordingStatus || '').trim().toLowerCase() === 'completed'
    && !callData.voicemailEmailSentAt;

  if (shouldNotifyByEmail) {
    const sellerUid = normalizeNonEmptyString(callData.sellerUid || callData.sellerId);
    const appUrl = resolveConfiguredAppUrl();
    let sellerEmail = '';
    let sellerName = normalizeNonEmptyString(callData.sellerName);

    if (sellerUid) {
      const sellerSnap = await getDb().collection('users').doc(sellerUid).get();
      const sellerData = sellerSnap.data() || {};
      sellerEmail = normalizeNonEmptyString(sellerData.email);
      sellerName = sellerName || normalizeNonEmptyString(sellerData.displayName || sellerData.storefrontName);
    }

    if (sellerEmail && !/@example\.com$/i.test(sellerEmail)) {
      try {
        await sendVoicemailNotificationEmailMessage({
          email: sellerEmail,
          sellerName,
          callerNumber: normalizeNonEmptyString(callData.callerPhone || callData.twilioFromNumber, 'Unknown caller'),
          callTimestamp: timestampValueToIso(callData.createdAt) || new Date().toISOString(),
          dashboardUrl: `${appUrl}/profile?tab=Calls`,
        });
        await callDoc.ref.set({
          voicemailEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        logger.error('Failed to send voicemail notification email.', {
          sellerUid,
          email: sellerEmail,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else if (sellerEmail) {
      logger.info('Skipping voicemail notification email for staging/example mailbox.', { sellerUid, email: sellerEmail });
    }
  }

  res.set('Content-Type', 'text/xml');
  return res.status(200).send('<Response><Say voice="Polly.Joanna">Thank you. Your message has been recorded.</Say><Hangup/></Response>');
}

function getRequestBaseUrl(req) {
  const forwardedProtoRaw = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwardedProtoRaw) ? forwardedProtoRaw[0] : forwardedProtoRaw;
  const proto = String(forwardedProto || '').split(',')[0].trim() || 'https';

  const forwardedHostRaw = req.headers['x-forwarded-host'];
  const forwardedHost = Array.isArray(forwardedHostRaw) ? forwardedHostRaw[0] : forwardedHostRaw;
  const host = String(forwardedHost || req.get('host') || '').split(',')[0].trim();

  if (host) {
    return `${proto}://${host}`;
  }
  return APP_URL;
}

async function getDecodedUserFromBearer(req) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return null;
  return admin.auth().verifyIdToken(idToken);
}

async function getListingLifecycleActorContext(req, listing = null) {
  const decodedToken = await getDecodedUserFromBearer(req);
  if (!decodedToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const actorUid = String(decodedToken.uid || '').trim();
  const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
  const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);
  const isAdminActor = canAdministrateAccount(tokenRole);
  const tokenParentAccountUid = String(decodedToken.parentAccountUid || decodedToken.claims?.parentAccountUid || '').trim();
  const ownerScopeUid = tokenParentAccountUid || actorUid;

  if (!listing) {
    return {
      decodedToken,
      actorUid,
      actorEmail,
      actorRole: tokenRole,
      isAdminActor,
      ownerScopeUid,
    };
  }

  const listingOwnerUid = normalizeNonEmptyString(listing?.sellerUid || listing?.sellerId);
  if (!listingOwnerUid) {
    return { error: 'Listing owner is missing.', status: 409 };
  }

  if (isAdminActor || listingOwnerUid === actorUid || listingOwnerUid === ownerScopeUid) {
    return {
      decodedToken,
      actorUid,
      actorEmail,
      actorRole: tokenRole,
      isAdminActor,
      ownerScopeUid,
      listingOwnerUid,
    };
  }

  return { error: 'Forbidden', status: 403 };
}

async function resolveStripePriceIdForPlan(stripe, plan) {
  if (plan.priceId) {
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
    const preferred = prices.data.find((p) => p.type === 'recurring' && p.recurring?.interval === 'month') || prices.data[0];
    if (!preferred?.id) {
      throw new Error(`No active Stripe price found for product ${plan.productId}.`);
    }
    priceId = preferred.id;
  }

  return priceId;
}

async function findExistingStripeCustomerId(stripe, userUid, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!stripe || !normalizedEmail) return '';

  let startingAfter = '';

  do {
    const page = await stripe.customers.list({
      email: normalizedEmail,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    const exactMatch = page.data.find((customer) => {
      if (customer.deleted) return false;
      return String(customer.metadata?.userUid || '').trim() === String(userUid || '').trim();
    });
    if (exactMatch?.id) {
      return exactMatch.id;
    }

    const fallbackMatch = page.data.find((customer) => !customer.deleted);
    if (fallbackMatch?.id) {
      return fallbackMatch.id;
    }

    startingAfter = page.has_more && page.data.length > 0
      ? String(page.data[page.data.length - 1].id || '')
      : '';
  } while (startingAfter);

  return '';
}

async function getOrCreateStripeCustomer(stripe, userUid, email, name) {
  const userRef = getDb().collection('users').doc(userUid);
  let existingCustomerId = '';
  let firestoreQuotaLimited = false;

  try {
    const userSnap = await userRef.get();
    existingCustomerId = String(userSnap.data()?.stripeCustomerId || '');
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }
    firestoreQuotaLimited = true;
  }

  if (existingCustomerId) {
    logger.info('getOrCreateStripeCustomer: reusing stored Stripe customer id', { userUid });
    try {
      const existingCustomer = await stripe.customers.retrieve(existingCustomerId);
      if (existingCustomer && !existingCustomer.deleted) {
        return existingCustomerId;
      }
    } catch {
      // If Stripe customer cannot be retrieved, a new one will be created.
    }
  }

  if (!existingCustomerId) {
    logger.info('getOrCreateStripeCustomer: searching Stripe customers by email', { userUid });
    existingCustomerId = await findExistingStripeCustomerId(stripe, userUid, email);
    if (existingCustomerId && !firestoreQuotaLimited) {
      await userRef.set(
        {
          stripeCustomerId: existingCustomerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return existingCustomerId;
    }
    if (existingCustomerId) {
      return existingCustomerId;
    }
  }

  logger.info('getOrCreateStripeCustomer: creating new Stripe customer', { userUid });
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userUid },
  });

  if (!firestoreQuotaLimited) {
    await userRef.set(
      {
        stripeCustomerId: customer.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return customer.id;
}

async function resolveExistingStripeCustomerId(stripe, userUid, email) {
  if (!stripe) return '';

  let storedCustomerId = '';

  try {
    const userSnap = await getDb().collection('users').doc(String(userUid || '').trim()).get();
    storedCustomerId = String(userSnap.data()?.stripeCustomerId || '').trim();
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }
    logger.warn('Skipping stored Stripe customer lookup because Firestore quota is exhausted.', {
      userUid,
    });
  }

  if (storedCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(storedCustomerId);
      if (existingCustomer && !existingCustomer.deleted) {
        return storedCustomerId;
      }
    } catch (error) {
      logger.warn('Stored Stripe customer id could not be retrieved; falling back to email lookup.', {
        userUid,
        storedCustomerId,
        error: String(error?.message || error || ''),
      });
    }
  }

  return findExistingStripeCustomerId(stripe, userUid, email);
}

async function finalizeListingPaymentFromCheckoutSession(session, source) {
  const listingId = String(session.metadata?.listingId || '');
  const planId = String(session.metadata?.planId || '');
  const userUid = String(session.metadata?.userUid || '');
  const paid = session.payment_status === 'paid';

  if (!listingId || !planId || !userUid || !paid) {
    return { paid: false, listingId: listingId || null, planId: planId || null };
  }

  const plan = getListingCheckoutPlan(planId);
  const amountUsd = typeof session.amount_total === 'number' ? session.amount_total / 100 : plan?.amountUsd || 0;
  const fallbackPeriodEndDate = new Date();
  fallbackPeriodEndDate.setMonth(fallbackPeriodEndDate.getMonth() + 1);
  let listingExpiresAt = admin.firestore.Timestamp.fromDate(fallbackPeriodEndDate);

  await getDb().collection('invoices').doc(String(session.invoice || session.id)).set(
    {
      userUid,
      listingId,
      stripeInvoiceId: session.invoice || null,
      stripeCheckoutSessionId: session.id,
      amount: amountUsd,
      currency: session.currency || 'usd',
      status: 'paid',
      items: [`${plan?.name || planId} monthly listing plan`],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      source,
    },
    { merge: true }
  );

  const subscriptionObject = typeof session.subscription === 'object' && session.subscription ? session.subscription : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;
  if (subscriptionId) {
    const periodEnd = subscriptionObject?.current_period_end;
    const currentPeriodEnd = typeof periodEnd === 'number'
      ? admin.firestore.Timestamp.fromMillis(periodEnd * 1000)
      : null;

    if (currentPeriodEnd) {
      listingExpiresAt = currentPeriodEnd;
    }

    await getDb().collection('subscriptions').doc(subscriptionId).set(
      {
        userUid,
        listingId,
        planId,
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  const listingRef = getDb().collection('listings').doc(listingId);
  const listingSnap = await listingRef.get();
  if (listingSnap.exists) {
    await applyListingLifecycleAction({
      listingRef,
      listingId,
      listing: listingSnap.data() || {},
      action: 'payment_confirmed',
      actorUid: userUid,
      actorRole: 'system',
      reason: `Listing checkout paid via ${source}`,
      metadata: {
        planId,
        amountUsd,
        currentPeriodEnd: listingExpiresAt,
      },
    });
  }

  await getDb().collection('billingAuditLogs').add({
    action: 'CHECKOUT_SESSION_PAID',
    userUid,
    listingId,
    details: `Checkout ${session.id} marked listing ${listingId} paid via ${source}.`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { paid: true, listingId, planId };
}

async function finalizeAccountPaymentFromCheckoutSession(stripe, session, source) {
  const planId = String(session.metadata?.planId || '');
  const userUid = String(session.metadata?.userUid || '');
  const paid = session.payment_status === 'paid';

  if (!planId || !userUid || !paid) {
    return { paid: false, listingId: null, planId: planId || null, scope: 'account' };
  }

  const plan = getListingCheckoutPlan(planId);
  const amountUsd = typeof session.amount_total === 'number' ? session.amount_total / 100 : plan?.amountUsd || 0;
  const subscriptionObject = typeof session.subscription === 'object' && session.subscription ? session.subscription : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;
  const rawQuantity = subscriptionObject?.items?.data?.[0]?.quantity;
  const requestedQuantity = Number(session.metadata?.subscriptionQuantity || 1);
  const subscriptionQuantity = planId === 'individual_seller'
    ? resolveSubscriptionQuantityForPlan(planId, rawQuantity, requestedQuantity)
    : 1;
  const listingCap = plan?.id === 'individual_seller'
    ? subscriptionQuantity * (plan?.listingCap || 1)
    : plan?.listingCap || 0;
  const currentPeriodEnd = typeof subscriptionObject?.current_period_end === 'number'
    ? admin.firestore.Timestamp.fromMillis(subscriptionObject.current_period_end * 1000)
    : null;
  const statementLabel = getSellerProgramStatementLabel(planId);
  const bypassFirestore = shouldBypassFirestoreForStripeSync(source);

  if (!bypassFirestore) {
    await runFirestoreTaskWithQuotaTolerance(
      () => getDb().collection('invoices').doc(String(session.invoice || session.id)).set(
        {
          userUid,
          listingId: null,
          stripeInvoiceId: session.invoice || null,
          stripeCheckoutSessionId: session.id,
          amount: amountUsd,
          currency: session.currency || 'usd',
          status: 'paid',
          statementLabel,
          items: [`${getPlanInvoiceDisplayName(planId)} x${subscriptionQuantity}`],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          source,
        },
        { merge: true }
      ),
      'Account checkout invoice persistence',
      {
        sessionId: session.id,
        userUid,
        planId,
        source,
      }
    );

    if (subscriptionId) {
      await runFirestoreTaskWithQuotaTolerance(
        () => getDb().collection('subscriptions').doc(subscriptionId).set(
          {
            userUid,
            listingId: null,
            planId,
            stripeSubscriptionId: subscriptionId,
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodEnd,
            checkoutScope: 'account',
            subscriptionQuantity,
            listingCap,
            statementLabel,
            legalTermsVersion: sanitizeEnrollmentString(session.metadata?.legalTermsVersion, 80) || null,
            legalAcceptedAtIso: sanitizeEnrollmentString(session.metadata?.legalTermsAcceptedAt, 80) || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        ),
        'Account checkout subscription persistence',
        {
          sessionId: session.id,
          subscriptionId,
          userUid,
          planId,
          source,
        }
      );
    }
  }

  await applyAccountSubscriptionToUserProfile({
    stripe,
    stripeCustomerId: String(session.customer || '').trim(),
    userUid,
    planId,
    subscriptionStatus: 'active',
    subscriptionId,
    currentPeriodEnd,
    source,
    skipFirestore: bypassFirestore,
  });
  if (!bypassFirestore) {
    await finalizeSellerProgramCheckoutArtifacts({
      userUid,
      planId,
      session,
      subscriptionId,
      source,
    });
  }

  return { paid: true, listingId: null, planId, scope: 'account' };
}

async function finalizeCheckoutSession(stripe, session, source) {
  const checkoutScope = String(session.metadata?.checkoutScope || '').trim();
  if (checkoutScope === 'account') {
    return finalizeAccountPaymentFromCheckoutSession(stripe, session, source);
  }

  const listingResult = await finalizeListingPaymentFromCheckoutSession(session, source);
  return { ...listingResult, scope: 'listing' };
}

function normalizeStripeSubscriptionStatus(rawStatus) {
  const status = String(rawStatus || '').toLowerCase();
  if (status === 'active' || status === 'trialing' || status === 'canceled' || status === 'past_due') {
    return status;
  }
  if (status === 'unpaid' || status === 'incomplete' || status === 'incomplete_expired') {
    return 'past_due';
  }
  return 'past_due';
}

function stripeUnixToTimestamp(rawUnixSeconds) {
  if (typeof rawUnixSeconds !== 'number' || !Number.isFinite(rawUnixSeconds) || rawUnixSeconds <= 0) {
    return null;
  }
  return admin.firestore.Timestamp.fromMillis(Math.floor(rawUnixSeconds) * 1000);
}

async function resolveUserUidFromStripeCustomerId(stripeCustomerId, stripe = null) {
  const normalizedCustomerId = String(stripeCustomerId || '').trim();
  if (!normalizedCustomerId) return '';

  try {
    const usersSnap = await getDb()
      .collection('users')
      .where('stripeCustomerId', '==', normalizedCustomerId)
      .limit(1)
      .get();

    if (!usersSnap.empty) {
      return usersSnap.docs[0].id;
    }
  } catch (error) {
    if (!isFirestoreQuotaExceeded(error)) {
      throw error;
    }
    logger.warn('Skipping Firestore customer lookup because quota is exhausted.', {
      stripeCustomerId: normalizedCustomerId,
    });
  }

  if (!stripe) return '';

  try {
    const customer = await stripe.customers.retrieve(normalizedCustomerId);
    if (customer && !customer.deleted) {
      return String(customer.metadata?.userUid || '').trim();
    }
  } catch (error) {
    logger.warn('Unable to resolve user uid from Stripe customer metadata.', {
      stripeCustomerId: normalizedCustomerId,
      error: String(error?.message || error || ''),
    });
  }

  return '';
}

async function syncSubscriptionStateFromStripeObject(stripe, rawSubscription, source) {
  const stripeSubscriptionId = String(rawSubscription?.id || '').trim();
  if (!stripeSubscriptionId) return;

  const metadata = rawSubscription?.metadata || {};
  const subscriptionStatus = normalizeStripeSubscriptionStatus(rawSubscription?.status);
  const cancelAtPeriodEnd = Boolean(rawSubscription?.cancel_at_period_end);
  const currentPeriodEnd = stripeUnixToTimestamp(rawSubscription?.current_period_end);
  const nowUnix = Math.floor(Date.now() / 1000);
  const rawPeriodEndUnix = typeof rawSubscription?.current_period_end === 'number' ? rawSubscription.current_period_end : 0;
  const hasRemainingPeriod = rawPeriodEndUnix > nowUnix;
  const inferredPlanId = inferPlanIdFromStripeSubscription(rawSubscription);

  let userUid = String(metadata.userUid || '').trim();
  if (!userUid) {
    userUid = await resolveUserUidFromStripeCustomerId(rawSubscription?.customer, stripe);
  }

  const listingId = String(metadata.listingId || '').trim();
  const planId = inferredPlanId || String(metadata.planId || '').trim();
  const checkoutScope = String(metadata.checkoutScope || '').trim();
  const rawQuantity = rawSubscription?.items?.data?.[0]?.quantity;
  const requestedQuantity = Number(metadata.subscriptionQuantity || 1);
  const subscriptionQuantity = planId === 'individual_seller'
    ? resolveSubscriptionQuantityForPlan(planId, rawQuantity, requestedQuantity)
    : 1;
  const plan = getListingCheckoutPlan(planId);
  const listingCap = plan?.id === 'individual_seller'
    ? subscriptionQuantity * (plan?.listingCap || 1)
    : plan?.listingCap || 0;
  const statementLabel = getSellerProgramStatementLabel(planId);
  const bypassFirestore = shouldBypassFirestoreForStripeSync(source);

  if (!bypassFirestore) {
    await runFirestoreTaskWithQuotaTolerance(
      () => getDb().collection('subscriptions').doc(stripeSubscriptionId).set(
        {
          userUid: userUid || null,
          listingId: listingId || null,
          planId: planId || null,
          stripeSubscriptionId,
          checkoutScope: checkoutScope || (listingId ? 'listing' : 'account'),
          status: subscriptionStatus,
          cancelAtPeriodEnd,
          currentPeriodEnd,
          ...(typeof rawSubscription?.created === 'number' ? { createdAt: admin.firestore.Timestamp.fromMillis(rawSubscription.created * 1000) } : {}),
          ...(typeof rawSubscription?.start_date === 'number' ? { startDate: admin.firestore.Timestamp.fromMillis(rawSubscription.start_date * 1000) } : {}),
          subscriptionQuantity,
          listingCap,
          statementLabel,
          legalTermsVersion: sanitizeEnrollmentString(metadata.legalTermsVersion, 80) || null,
          legalAcceptedAtIso: sanitizeEnrollmentString(metadata.legalTermsAcceptedAt, 80) || null,
          legalScope: sanitizeEnrollmentString(metadata.legalScope, 60) || getSellerProgramScope(planId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source,
        },
        { merge: true }
      ),
      'Stripe subscription record sync',
      {
        subscriptionId: stripeSubscriptionId,
        userUid,
        planId,
        source,
      }
    );
  }

  const shouldRetainListingAccess =
    statusAllowsSellerAccess(subscriptionStatus, cancelAtPeriodEnd, hasRemainingPeriod);

  if (listingId && !bypassFirestore) {
    await runFirestoreTaskWithQuotaTolerance(
      async () => {
        const listingRef = getDb().collection('listings').doc(listingId);
        const listingSnap = await listingRef.get();
        if (!listingSnap.exists) {
          return;
        }

        const listingData = listingSnap.data() || {};
        if (shouldRetainListingAccess) {
          await applyListingLifecycleAction({
            listingRef,
            listingId,
            listing: listingData,
            action: 'payment_confirmed',
            actorUid: userUid || 'system',
            actorRole: 'system',
            reason: `Stripe subscription sync retained listing visibility via ${source}`,
            metadata: {
              planId,
              currentPeriodEnd,
            },
          });
        } else {
          await listingRef.set(
            {
              paymentStatus: 'pending',
              status: ['sold', 'archived'].includes(String(listingData.status || '').toLowerCase())
                ? String(listingData.status || '').toLowerCase()
                : 'pending',
              expiresAt: currentPeriodEnd || null,
              lastLifecycleAction: 'billing_visibility_suppressed',
              lastLifecycleActorUid: userUid || 'system',
              lastLifecycleActorRole: 'system',
              lastLifecycleReason: `Subscription access inactive via ${source}`,
              lastLifecycleAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      },
      'Listing subscription visibility sync',
      {
        subscriptionId: stripeSubscriptionId,
        listingId,
        userUid,
        planId,
        source,
      }
    );
  }

  if (userUid && planId && (checkoutScope === 'account' || !listingId)) {
    await applyAccountSubscriptionToUserProfile({
      stripe,
      stripeCustomerId: String(rawSubscription?.customer || '').trim(),
      userUid,
      planId,
      subscriptionStatus,
      subscriptionId: stripeSubscriptionId,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      source,
      skipFirestore: bypassFirestore,
    });
  }

  if (userUid && !bypassFirestore) {
    await runFirestoreTaskWithQuotaTolerance(
      () => getDb().collection('billingAuditLogs').add({
        action: 'STRIPE_SUBSCRIPTION_SYNC',
        userUid,
        listingId: listingId || null,
        details: `Synced ${stripeSubscriptionId} as ${subscriptionStatus} via ${source}.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
      'Stripe subscription audit log write',
      {
        subscriptionId: stripeSubscriptionId,
        userUid,
        listingId: listingId || null,
        source,
      }
    );
  }
}

function canAdministrateAccount(role) {
  return ['super_admin', 'admin', 'developer'].includes(role);
}

function canAccessContentStudio(role) {
  return ['super_admin', 'admin', 'developer', 'content_manager', 'editor'].includes(normalizeUserRole(role));
}

function getActorRoleFromDecodedToken(decodedToken) {
  return normalizeUserRole(String(decodedToken?.role || decodedToken?.claims?.role || ''));
}

function buildSyntheticUserDoc(uid, data) {
  const snapshotData = { ...(data || {}) };
  return {
    id: uid,
    exists: true,
    data: () => snapshotData,
  };
}

function buildAdminActorContextFromToken(decodedToken, actorUid, actorEmail, actorRole, extraProfile = {}) {
  return {
    decodedToken,
    actorUid,
    actorEmail,
    actorDoc: buildSyntheticUserDoc(actorUid, {
      uid: actorUid,
      email: actorEmail,
      role: actorRole,
      displayName: String(decodedToken?.name || '').trim() || 'Forestry Equipment Sales Admin',
      ...extraProfile,
    }),
    actorRole,
  };
}

function buildSerializableAuthRecord(authRecord, overrides = {}) {
  if (!authRecord && !overrides) return null;
  return {
    uid: authRecord?.uid || overrides.uid || '',
    email: overrides.email ?? authRecord?.email ?? '',
    displayName: overrides.displayName ?? authRecord?.displayName ?? '',
    disabled: overrides.disabled ?? Boolean(authRecord?.disabled),
    emailVerified: overrides.emailVerified ?? Boolean(authRecord?.emailVerified),
    customClaims: {
      ...(authRecord?.customClaims || {}),
      ...(overrides.customClaims || {}),
    },
    metadata: {
      creationTime: overrides.creationTime ?? authRecord?.metadata?.creationTime ?? '',
      lastSignInTime: overrides.lastSignInTime ?? authRecord?.metadata?.lastSignInTime ?? '',
    },
  };
}

function isSupportedUserRole(role) {
  return ['super_admin', 'admin', 'developer', 'content_manager', 'editor', 'dealer', 'pro_dealer', 'individual_seller', 'member', 'buyer'].includes(normalizeUserRole(role));
}

function isAuthUserNotFound(error) {
  return error?.code === 'auth/user-not-found';
}

function isFirestoreQuotaExceeded(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return error?.code === 8 || message.includes('resource_exhausted') || message.includes('quota limit exceeded');
}

function getQuotaExceededApiMessage(path) {
  const normalizedPath = String(path || '').trim().toLowerCase();
  if (normalizedPath.startsWith('/billing/')) {
    return 'Seller billing is temporarily unavailable because the Firestore daily read quota is exhausted.';
  }
  if (normalizedPath.startsWith('/admin/')) {
    return 'This admin action is temporarily unavailable because the Firestore daily read quota is exhausted.';
  }
  return 'This action is temporarily unavailable because the Firestore daily read quota is exhausted.';
}

function buildQuotaLimitedPayload(key, fallbackValue, warning, extra = {}) {
  return {
    [key]: fallbackValue,
    firestoreQuotaLimited: true,
    source: 'quota_fallback',
    warning,
    ...extra,
  };
}

function isCacheablePublicApiRoute(method, path) {
  const normalizedMethod = String(method || 'GET').trim().toUpperCase();
  const normalizedPath = String(path || '').trim();
  if (normalizedMethod !== 'GET') {
    return false;
  }

  return (
    /^\/public\/dealers\/[^/]+\/feed\.json$/i.test(normalizedPath)
    || /^\/public\/dealers\/[^/]+\/embed$/i.test(normalizedPath)
    || normalizedPath === '/public/dealer-embed.js'
    || normalizedPath === '/market-rates'
    || normalizedPath === '/marketplace-stats'
    || normalizedPath === '/public/listings'
    || normalizedPath === '/public/listings/by-id'
    || normalizedPath === '/public/category-metrics'
    || normalizedPath === '/public/home-data'
    || normalizedPath === '/currency-rates'
  );
}

function applyApiResponseCachePolicy(res, req, path) {
  const normalizedPath = String(path || '').trim();
  const isSensitiveRoute = (
    normalizedPath.startsWith('/admin/')
    || normalizedPath.startsWith('/account/')
    || normalizedPath.startsWith('/dealer/')
    || normalizedPath.startsWith('/billing/')
    || normalizedPath.startsWith('/auth/')
    || normalizedPath.startsWith('/translate')
  );

  res.append('Vary', 'Origin');
  if (isSensitiveRoute) {
    res.append('Vary', 'Authorization');
    res.append('Vary', 'X-Dealer-Api-Key');
  }

  if (isCacheablePublicApiRoute(req?.method, normalizedPath)) {
    return;
  }

  res.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
}

function timestampValueToIso(value) {
  if (!value) return '';
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function serializeLifecycleStateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  return {
    lifecycleState: normalizeNonEmptyString(snapshot.lifecycleState),
    reviewState: normalizeNonEmptyString(snapshot.reviewState),
    paymentState: normalizeNonEmptyString(snapshot.paymentState),
    inventoryState: normalizeNonEmptyString(snapshot.inventoryState),
    visibilityState: normalizeNonEmptyString(snapshot.visibilityState),
    isPublic: Boolean(snapshot.isPublic),
    publishedAt: timestampValueToIso(snapshot.publishedAt) || null,
    expiresAt: timestampValueToIso(snapshot.expiresAt) || null,
    soldAt: timestampValueToIso(snapshot.soldAt) || null,
    rawStatus: normalizeNonEmptyString(snapshot.rawStatus),
    rawApprovalStatus: normalizeNonEmptyString(snapshot.rawApprovalStatus),
    rawPaymentStatus: normalizeNonEmptyString(snapshot.rawPaymentStatus),
  };
}

function serializeListingLifecycleAuditReport(docSnapshot) {
  if (!docSnapshot?.exists) return null;
  const data = docSnapshot.data() || {};

  return {
    listingId: docSnapshot.id,
    status: normalizeNonEmptyString(data.status, 'pending'),
    summary: normalizeNonEmptyString(data.summary),
    createdAt: timestampValueToIso(data.createdAt) || null,
    updatedAt: timestampValueToIso(data.updatedAt) || null,
    actorUid: normalizeNonEmptyString(data.actorUid || data.createdByUid),
    anomalyCodes: Array.isArray(data.anomalyCodes) ? data.anomalyCodes.map((code) => normalizeNonEmptyString(code)).filter(Boolean) : [],
    anomalyCount: normalizeFiniteNumber(data.anomalyCount, 0),
    shadowState: serializeLifecycleStateSnapshot(data.shadowState),
    rawState: data.rawState && typeof data.rawState === 'object'
      ? {
          ...data.rawState,
          publishedAt: timestampValueToIso(data.rawState.publishedAt) || null,
          expiresAt: timestampValueToIso(data.rawState.expiresAt) || null,
          soldAt: timestampValueToIso(data.rawState.soldAt) || null,
        }
      : null,
    governanceSnapshot: data.governanceSnapshot && typeof data.governanceSnapshot === 'object'
      ? {
          ...data.governanceSnapshot,
          publishedAt: timestampValueToIso(data.governanceSnapshot.publishedAt) || null,
          expiresAt: timestampValueToIso(data.governanceSnapshot.expiresAt) || null,
          soldAt: timestampValueToIso(data.governanceSnapshot.soldAt) || null,
        }
      : null,
  };
}

function serializeListingMediaAuditRecord(docSnapshot) {
  if (!docSnapshot?.exists) return null;
  const data = docSnapshot.data() || {};

  return {
    listingId: docSnapshot.id,
    status: normalizeNonEmptyString(data.status, 'pending'),
    summary: normalizeNonEmptyString(data.summary),
    createdAt: timestampValueToIso(data.createdAt) || null,
    updatedAt: timestampValueToIso(data.updatedAt) || null,
    imageCount: normalizeFiniteNumber(data.imageCount, 0),
    primaryImagePresent: Boolean(data.primaryImagePresent),
    validationErrors: Array.isArray(data.validationErrors)
      ? data.validationErrors.map((code) => normalizeNonEmptyString(code)).filter(Boolean)
      : [],
  };
}

function serializeListingLifecycleTransitionRecord(docSnapshot) {
  const data = docSnapshot.data() || {};

  return {
    id: docSnapshot.id,
    listingId: normalizeNonEmptyString(data.listingId),
    transitionType: normalizeNonEmptyString(data.transitionType, 'governance_shadow_sync'),
    actorUid: normalizeNonEmptyString(data.actorUid, 'system'),
    createdAt: timestampValueToIso(data.createdAt) || null,
    artifactSource: normalizeNonEmptyString(data.artifactSource),
    anomalyCodes: Array.isArray(data.anomalyCodes) ? data.anomalyCodes.map((code) => normalizeNonEmptyString(code)).filter(Boolean) : [],
    fromState: serializeLifecycleStateSnapshot(data.fromState),
    toState: serializeLifecycleStateSnapshot(data.toState),
  };
}

function serializeListingLifecycleReviewSummaryRecord(docSnapshot) {
  if (!docSnapshot?.exists) return null;
  const data = docSnapshot.data() || {};

  return {
    listingId: docSnapshot.id,
    status: normalizeNonEmptyString(data.status, 'pending'),
    summary: normalizeNonEmptyString(data.summary),
    anomalyCodes: Array.isArray(data.anomalyCodes) ? data.anomalyCodes.map((code) => normalizeNonEmptyString(code)).filter(Boolean) : [],
    anomalyCount: normalizeFiniteNumber(data.anomalyCount, 0),
    shadowState: serializeLifecycleStateSnapshot(data.shadowState),
    rawState: data.rawState && typeof data.rawState === 'object'
      ? {
          ...data.rawState,
          publishedAt: timestampValueToIso(data.rawState.publishedAt) || null,
          expiresAt: timestampValueToIso(data.rawState.expiresAt) || null,
          soldAt: timestampValueToIso(data.rawState.soldAt) || null,
        }
      : null,
    updatedAt: timestampValueToIso(data.updatedAt) || null,
  };
}

function serializeAccountAuditLogRecord(docSnapshot) {
  if (!docSnapshot?.exists) return null;
  const data = docSnapshot.data() || {};

  return {
    id: docSnapshot.id,
    eventType: normalizeNonEmptyString(data.eventType, 'ACCOUNT_EVENT'),
    actorUid: normalizeNonEmptyString(data.actorUid) || null,
    targetUid: normalizeNonEmptyString(data.targetUid),
    source: normalizeNonEmptyString(data.source) || null,
    reason: normalizeNonEmptyString(data.reason) || null,
    previousState: data.previousState && typeof data.previousState === 'object' ? data.previousState : null,
    nextState: data.nextState && typeof data.nextState === 'object' ? data.nextState : null,
    metadata: data.metadata && typeof data.metadata === 'object' ? data.metadata : {},
    createdAt: timestampValueToIso(data.createdAt) || null,
  };
}

function serializeSellerProgramAgreementAcceptanceRecord(docSnapshot) {
  if (!docSnapshot?.exists) return null;
  const data = docSnapshot.data() || {};

  return {
    id: docSnapshot.id,
    userUid: normalizeNonEmptyString(data.userUid),
    actorUid: normalizeNonEmptyString(data.actorUid) || null,
    planId: normalizeNonEmptyString(data.planId),
    statementLabel: normalizeNonEmptyString(data.statementLabel) || null,
    legalScope: normalizeNonEmptyString(data.legalScope) || null,
    agreementVersion: normalizeNonEmptyString(data.agreementVersion) || null,
    checkoutSessionId: normalizeNonEmptyString(data.checkoutSessionId) || null,
    stripeCustomerId: normalizeNonEmptyString(data.stripeCustomerId) || null,
    stripeSubscriptionId: normalizeNonEmptyString(data.stripeSubscriptionId) || null,
    source: normalizeNonEmptyString(data.source) || null,
    acceptedAtIso: normalizeNonEmptyString(data.acceptedAtIso) || null,
    status: normalizeNonEmptyString(data.status) || null,
    checkoutState: normalizeNonEmptyString(data.checkoutState) || null,
    acceptedTerms: Boolean(data.acceptedTerms),
    acceptedPrivacy: Boolean(data.acceptedPrivacy),
    acceptedRecurringBilling: Boolean(data.acceptedRecurringBilling),
    acceptedVisibilityPolicy: Boolean(data.acceptedVisibilityPolicy),
    acceptedAuthority: Boolean(data.acceptedAuthority),
    createdAt: timestampValueToIso(data.createdAt) || null,
    updatedAt: timestampValueToIso(data.updatedAt) || null,
    finalizedAt: timestampValueToIso(data.finalizedAt) || null,
    metadata: data.metadata && typeof data.metadata === 'object' ? data.metadata : {},
  };
}

function toAccountStatusLabel(accountStatus, authDisabled) {
  if (authDisabled || accountStatus === 'suspended') return 'Suspended';
  if (accountStatus === 'pending') return 'Pending';
  return 'Active';
}

async function getAdminActorContext(req) {
  const decodedToken = await getDecodedUserFromBearer(req);
  if (!decodedToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const actorUid = decodedToken.uid;
  const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
  const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);

  if (canAdministrateAccount(tokenRole)) {
    return buildAdminActorContextFromToken(decodedToken, actorUid, actorEmail, tokenRole);
  }

  if (isPrivilegedAdminEmail(actorEmail)) {
    return buildAdminActorContextFromToken(decodedToken, actorUid, actorEmail, 'super_admin');
  }

  let actorDoc;
  try {
    actorDoc = await getDb().collection('users').doc(actorUid).get();
  } catch (error) {
    if (isFirestoreQuotaExceeded(error)) {
      return {
        error: 'Admin account data is temporarily unavailable because the Firestore daily read quota is exhausted.',
        status: 503,
      };
    }
    throw error;
  }
  const actorRole = normalizeUserRole(String(actorDoc.data()?.role || ''));
  const canManageUsers = canAdministrateAccount(actorRole);

  if (!canManageUsers) {
    return { error: 'Forbidden', status: 403 };
  }

  return {
    decodedToken,
    actorUid,
    actorEmail,
    actorDoc,
    actorRole,
  };
}

async function getContentActorContext(req) {
  const decodedToken = await getDecodedUserFromBearer(req);
  if (!decodedToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const actorUid = decodedToken.uid;
  const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
  const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);

  if (canAccessContentStudio(tokenRole)) {
    return buildAdminActorContextFromToken(decodedToken, actorUid, actorEmail, tokenRole);
  }

  let actorDoc;
  try {
    actorDoc = await getDb().collection('users').doc(actorUid).get();
  } catch (error) {
    if (isFirestoreQuotaExceeded(error)) {
      return {
        error: 'Content Studio access is temporarily unavailable because the Firestore daily read quota is exhausted.',
        status: 503,
      };
    }
    throw error;
  }

  const actorRole = normalizeUserRole(String(actorDoc.data()?.role || ''));
  if (!canAccessContentStudio(actorRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  return {
    decodedToken,
    actorUid,
    actorEmail,
    actorDoc,
    actorRole,
  };
}

async function getDealerFeedActorContext(req) {
  const decodedToken = await getDecodedUserFromBearer(req);
  if (!decodedToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const actorUid = decodedToken.uid;
  const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
  const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);

  if (canAdministrateAccount(tokenRole)) {
    return {
      ...buildAdminActorContextFromToken(decodedToken, actorUid, actorEmail, tokenRole),
      actorCanAdminister: true,
      actorIsDealer: false,
      ownerUid: actorUid,
    };
  }

  if (isPrivilegedAdminEmail(actorEmail)) {
    return {
      ...buildAdminActorContextFromToken(decodedToken, actorUid, actorEmail, 'super_admin'),
      actorRole: 'super_admin',
      actorCanAdminister: true,
      actorIsDealer: false,
      ownerUid: actorUid,
    };
  }

  let actorDoc;
  try {
    actorDoc = await getDb().collection('users').doc(actorUid).get();
  } catch (error) {
    if (isFirestoreQuotaExceeded(error)) {
      return {
        error: 'Dealer feed access is temporarily unavailable because the Firestore daily read quota is exhausted.',
        status: 503,
      };
    }
    throw error;
  }
  const actorRole = normalizeUserRole(String(actorDoc.data()?.role || ''));
  const actorCanAdminister = canAdministrateAccount(actorRole);
  const actorIsDealer = isDealerManagedRole(actorRole);

  if (!actorCanAdminister && !actorIsDealer) {
    return { error: 'Forbidden', status: 403 };
  }

  return {
    decodedToken,
    actorUid,
    actorEmail,
    actorDoc,
    actorRole,
    actorCanAdminister,
    actorIsDealer,
    ownerUid: normalizeNonEmptyString(actorDoc.data()?.parentAccountUid || actorUid),
  };
}

function canAccessDealerFeedSellerUid(actorContext, sellerUid) {
  const normalizedSellerUid = normalizeNonEmptyString(sellerUid);
  if (!normalizedSellerUid || !actorContext) return false;
  if (actorContext.actorCanAdminister) return true;
  return normalizedSellerUid === actorContext.ownerUid || normalizedSellerUid === actorContext.actorUid;
}

async function getAuthorizedDealerFeedContext(req, feedId) {
  const actorContext = await getDealerFeedActorContext(req);
  if (actorContext.error) {
    return actorContext;
  }

  const normalizedFeedId = normalizeNonEmptyString(feedId);
  if (!normalizedFeedId) {
    return { error: 'Dealer feed ID is required.', status: 400 };
  }

  const feedRef = getDb().collection('dealerFeeds').doc(normalizedFeedId);
  let feedSnap = await feedRef.get();
  if (!feedSnap.exists) {
    const legacySnap = await getDb().collection('dealerFeedProfiles').doc(normalizedFeedId).get();
    if (legacySnap.exists) {
      await ensureDealerFeedFromLegacyProfile(legacySnap.id, legacySnap.data() || {});
      feedSnap = await feedRef.get();
    }
  }

  if (!feedSnap.exists) {
    return { error: 'Dealer feed not found.', status: 404 };
  }

  const feedData = feedSnap.data() || {};
  if (!canAccessDealerFeedSellerUid(actorContext, feedData.sellerUid || feedData.dealerId)) {
    return { error: 'Forbidden', status: 403 };
  }

  return {
    ...actorContext,
    feedRef,
    feedSnap,
    feed: { id: feedSnap.id, ...feedData },
  };
}

async function getDealerFeedContextFromApiKey(req, explicitFeedId = '') {
  const apiKey = getDealerFeedApiKeyFromRequest(req);
  if (!apiKey) {
    return { error: 'Dealer API key is required.', status: 401 };
  }

  let feedSnap = null;
  const normalizedFeedId = normalizeNonEmptyString(explicitFeedId || req.body?.feedId || req.query?.feedId);
  if (normalizedFeedId) {
    const candidateSnap = await getDb().collection('dealerFeeds').doc(normalizedFeedId).get();
    if (candidateSnap.exists && normalizeNonEmptyString(candidateSnap.data()?.apiKey) === apiKey) {
      feedSnap = candidateSnap;
    }
  }

  if (!feedSnap) {
    const feedQuery = await getDb()
      .collection('dealerFeeds')
      .where('apiKey', '==', apiKey)
      .limit(1)
      .get();
    if (!feedQuery.empty) {
      feedSnap = feedQuery.docs[0];
    }
  }

  if (!feedSnap?.exists) {
    return { error: 'Dealer feed credentials are invalid.', status: 401 };
  }

  return {
    feedRef: feedSnap.ref,
    feedSnap,
    feed: { id: feedSnap.id, ...feedSnap.data() },
  };
}

function verifyDealerWebhookRequest(feed, req) {
  const webhookSecret = normalizeNonEmptyString(feed?.webhookSecret);
  if (!webhookSecret) return { ok: true };

  const providedSignature = parseDealerSignatureHeader(req.headers['x-dealer-signature']);
  if (!providedSignature) {
    return { ok: false, error: 'Missing dealer webhook signature.', status: 401 };
  }

  const rawBody = getRawRequestBodyText(req);
  const timestampHeader = normalizeNonEmptyString(req.headers['x-dealer-timestamp']);
  if (timestampHeader) {
    const requestTimestamp = Number(timestampHeader);
    if (!Number.isFinite(requestTimestamp)) {
      return { ok: false, error: 'Dealer webhook timestamp is invalid.', status: 401 };
    }
    if (Math.abs(Date.now() - requestTimestamp) > DEALER_WEBHOOK_SIGNATURE_WINDOW_MS) {
      return { ok: false, error: 'Dealer webhook signature is expired.', status: 401 };
    }

    const computedSignature = buildDealerWebhookSignature(webhookSecret, timestampHeader, rawBody);
    if (!signaturesMatch(computedSignature, providedSignature)) {
      return { ok: false, error: 'Dealer webhook signature is invalid.', status: 401 };
    }
    return { ok: true };
  }

  const fallbackSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (!signaturesMatch(fallbackSignature, providedSignature)) {
    return { ok: false, error: 'Dealer webhook signature is invalid.', status: 401 };
  }

  return { ok: true };
}

async function getAuthUserRecordSafe(uid) {
  try {
    return await admin.auth().getUser(uid);
  } catch (error) {
    if (isAuthUserNotFound(error)) {
      return null;
    }
    throw error;
  }
}

function serializeAdminUserData(uid, data = {}, authRecord = null) {
  const authDisabled = Boolean(authRecord?.disabled);
  const rawAccountStatus = normalize(String(data.accountStatus || 'active'));
  const accountStatus = ['active', 'pending', 'suspended'].includes(rawAccountStatus)
    ? rawAccountStatus
    : (authDisabled ? 'suspended' : 'active');
  const displayName = String(data.displayName || data.name || authRecord?.displayName || '').trim();
  const email = String(data.email || authRecord?.email || '').trim().toLowerCase();
  const phone = String(data.phoneNumber || '').trim();
  const createdAt = timestampValueToIso(data.createdAt) || timestampValueToIso(authRecord?.metadata?.creationTime);
  const updatedAt = timestampValueToIso(data.updatedAt);
  const lastLogin =
    timestampValueToIso(authRecord?.metadata?.lastSignInTime) ||
    timestampValueToIso(data.lastLogin) ||
    updatedAt ||
    createdAt;
  const accountState = buildAccountStateFromSources(data, authRecord, {
    accountStatus,
  });
  const entitlement = buildAccountEntitlementSnapshot(accountState);

  return {
    id: uid,
    uid,
    name: displayName || email || 'Unknown User',
    displayName: displayName || email || 'Unknown User',
    email,
    phone,
    phoneNumber: phone,
    company: String(data.company || '').trim(),
    role: isSupportedUserRole(String(data.role || '')) ? normalizeUserRole(String(data.role || '')) : 'buyer',
    status: toAccountStatusLabel(accountStatus, authDisabled),
    accountStatus,
    authDisabled,
    emailVerified: authRecord ? Boolean(authRecord.emailVerified) : Boolean(data.emailVerified),
    lastLogin,
    lastActive: lastLogin,
    memberSince: createdAt,
    createdAt,
    updatedAt,
    totalListings: Number(data.totalListings || 0),
    totalLeads: Number(data.totalLeads || 0),
    parentAccountUid: String(data.parentAccountUid || '').trim() || undefined,
    accountAccessSource: accountState.accountAccessSource,
    activeSubscriptionPlanId: accountState.activeSubscriptionPlanId,
    subscriptionStatus: accountState.subscriptionStatus,
    listingCap: accountState.listingCap,
    managedAccountCap: accountState.managedAccountCap,
    currentSubscriptionId: accountState.currentSubscriptionId,
    currentPeriodEnd: accountState.currentPeriodEnd,
    entitlement,
  };
}

async function serializeAdminUser(userDoc) {
  const data = userDoc.data() || {};
  const authRecord = await getAuthUserRecordSafe(userDoc.id);
  return serializeAdminUserData(userDoc.id, data, authRecord);
}

function canCreateManagedRole(parentRole, childRole) {
  const normalizedParentRole = normalizeUserRole(parentRole);
  const normalizedChildRole = normalizeUserRole(childRole);
  const adminManagedRoles = ['admin', 'developer', 'content_manager', 'editor', 'dealer', 'pro_dealer', 'individual_seller', 'member', 'buyer'];
  const dealerManagedRoles = ['member', 'buyer'];

  if (normalizedParentRole === 'super_admin') return true;
  if (normalizedParentRole === 'admin' || normalizedParentRole === 'developer') return adminManagedRoles.includes(normalizedChildRole);
  if (normalizedParentRole === 'dealer' || normalizedParentRole === 'pro_dealer') return dealerManagedRoles.includes(normalizedChildRole);
  return false;
}

function isDealerManagedRole(role) {
  return ['dealer', 'pro_dealer'].includes(normalizeUserRole(role));
}

function generateTemporaryPassword() {
  return `TE-${randomBytes(9).toString('base64url')}!7a`;
}

function buildTemplateTestPayload(templateKey) {
  const normalizedTemplateKey = String(templateKey || '').trim();
  const listingUrl = buildCanonicalListingUrl('test-listing-001', {
    title: '2024 Tigercat 1165 Harvester',
    year: 2024,
    make: 'Tigercat',
    model: '1165',
    location: 'Grand Rapids, Minnesota',
  });
  const renewUrl = `${APP_URL}/profile#subscription`;

  switch (normalizedTemplateKey) {
    case 'subscriptionCreated':
      return templates.subscriptionCreated({
        displayName: 'Caleb',
        planName: 'Dealer Ad Package',
      });
    case 'subscriptionExpired':
      return templates.subscriptionExpired({
        displayName: 'Caleb',
        planName: 'Dealer Ad Package',
        renewUrl,
      });
    case 'subscriptionExpiring':
      return templates.subscriptionExpiring({
        displayName: 'Caleb',
        planName: 'Dealer Ad Package',
        expiryDate: 'April 1, 2026',
        renewUrl,
      });
    case 'mediaKitRequestConfirmation':
      return templates.mediaKitRequestConfirmation({
        requesterName: 'Caleb',
        requestType: 'media-kit',
        companyName: 'Forestry Equipment Sales Media',
        supportUrl: `${APP_URL}/ad-programs`,
      });
    case 'partnerRequestConfirmation':
      return templates.mediaKitRequestConfirmation({
        requesterName: 'Caleb',
        requestType: 'support',
        companyName: 'Partner Co',
        supportUrl: `${APP_URL}/ad-programs`,
      });
    case 'financingRequestConfirmation':
      return templates.financingRequestConfirmation({
        applicantName: 'Caleb',
        requestedAmount: 185000,
        company: 'North Woods Logging',
        dashboardUrl: `${APP_URL}/profile?tab=${encodeURIComponent('Financing')}`,
      });
    case 'logisticsInquiryConfirmation':
      return templates.inquiryConfirmation({
        buyerName: 'Caleb',
        listingTitle: '2020 Tigercat 635H Skidder',
        listingUrl,
        sellerName: 'Forestry Equipment Sales Dealer',
        inquiryType: 'Shipping',
      });
    case 'financingInquiryConfirmation':
      return templates.inquiryConfirmation({
        buyerName: 'Caleb',
        listingTitle: '2020 Tigercat 635H Skidder',
        listingUrl,
        sellerName: 'Forestry Equipment Sales Dealer',
        inquiryType: 'Financing',
      });
    case 'contactRequestConfirmation':
      return templates.contactRequestConfirmation({
        name: 'Caleb',
        category: 'Partner With Us',
        supportUrl: `${APP_URL}/contact`,
      });
    default:
      return null;
  }
}

exports.publicPagesProxy = handlePublicPagesRequest;

exports.publicPages = onRequest(
  {
    region: 'us-central1',
    cors: true,
  },
  async (req, res) => handlePublicPagesRequest(req, res)
);

exports.apiProxy = onRequest(
  {
    region: 'us-central1',
    cors: true,
    secrets: [
      SENDGRID_API_KEY,
      EMAIL_FROM,
      FRED_API_KEY,
      GOOGLE_TRANSLATE_API_KEY,
      EXCHANGERATE_API_KEY,
      GOOGLE_MAPS_API_KEY,
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
    ],
  },
  async (req, res) => {
    let path = '/';
    try {
      path = (req.path || '/').replace(/^\/api/, '') || '/';

      // ── Twilio voice webhooks (no CORS, no auth, TwiML responses) ──
      if (req.method === 'POST' && path === '/twilio/voice/inbound') {
        return handleTwilioInboundCall(req, res);
      }
      if (req.method === 'POST' && path === '/twilio/voice/status') {
        return handleTwilioCallStatus(req, res);
      }
      if (req.method === 'POST' && path === '/twilio/voice/voicemail') {
        return handleTwilioVoicemail(req, res);
      }

      applyApiResponseCachePolicy(res, req, path);
      const stripe = createStripeClient();

      const publicDealerFeedMatch = path.match(/^\/public\/dealers\/([^/]+)\/feed\.json$/i);
      if (req.method === 'GET' && publicDealerFeedMatch) {
        const dealerIdentity = decodeURIComponent(publicDealerFeedMatch[1] || '');

        // Private feed: check X-Dealer-Feed-Key if privateFeedEnabled
        const dealer = await resolvePublicDealer(dealerIdentity);
        if (dealer.privateFeedEnabled) {
          const feedKey = req.headers['x-dealer-feed-key'] || '';
          if (!feedKey || feedKey !== dealer.privateFeedApiKey) {
            res.set('Access-Control-Allow-Origin', '*');
            return res.status(401).json({ error: 'This feed requires authentication. Include X-Dealer-Feed-Key header.' });
          }
        }

        const limitCount = Math.max(1, Math.min(Number(req.query.limit || 24), 100));
        const featuredOnly = ['1', 'true', 'yes'].includes(String(req.query.featuredOnly || '').trim().toLowerCase());
        const listings = await getPublicDealerListings(dealer.sellerUid, { limitCount, featuredOnly });
        const payload = listings.map(({ id, data }) => buildPublicDealerListingPayload(id, data, dealer));

        // Compute updatedAt from the most recent listing
        const latestUpdate = listings.reduce((latest, { data }) => {
          const ts = data.updatedAt || data.createdAt;
          const d = ts && typeof ts.toDate === 'function' ? ts.toDate() : ts ? new Date(ts) : null;
          return d && (!latest || d > latest) ? d : latest;
        }, null);
        const updatedAt = latestUpdate ? latestUpdate.toISOString() : new Date().toISOString();

        // ETag / conditional request support
        const crypto = require('crypto');
        const etagSource = `${dealer.sellerUid}:${payload.length}:${updatedAt}:${limitCount}:${featuredOnly}`;
        const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

        if (req.headers['if-none-match'] === etag) {
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
          res.set('ETag', etag);
          return res.status(304).end();
        }

        const ifModifiedSince = req.headers['if-modified-since'];
        if (ifModifiedSince && latestUpdate) {
          const clientDate = new Date(ifModifiedSince);
          if (!isNaN(clientDate.getTime()) && latestUpdate <= clientDate) {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
            res.set('ETag', etag);
            return res.status(304).end();
          }
        }

        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        res.set('ETag', etag);
        res.set('Last-Modified', updatedAt);
        return res.status(200).json({
          dealer: {
            id: dealer.sellerUid,
            slug: dealer.publicId,
            storefrontName: dealer.storefrontName,
            storefrontTagline: dealer.storefrontTagline,
            storefrontDescription: dealer.storefrontDescription,
            website: dealer.website,
            phone: dealer.phone,
            email: dealer.email,
            location: dealer.location,
            logo: dealer.logo || '',
          },
          count: payload.length,
          featuredOnly,
          updatedAt,
          feedUrl: `${APP_URL}/api/public/dealers/${encodeURIComponent(dealer.publicId)}/feed.json`,
          listings: payload,
        });
      }

      const publicDealerEmbedMatch = path.match(/^\/public\/dealers\/([^/]+)\/embed$/i);
      if (req.method === 'GET' && publicDealerEmbedMatch) {
        const dealer = await resolvePublicDealer(decodeURIComponent(publicDealerEmbedMatch[1] || ''));
        const limitCount = Math.max(1, Math.min(Number(req.query.limit || 12), 60));
        const featuredOnly = ['1', 'true', 'yes'].includes(String(req.query.featuredOnly || '').trim().toLowerCase());
        const listings = await getPublicDealerListings(dealer.sellerUid, { limitCount, featuredOnly });
        const payload = listings.map(({ id, data }) => buildPublicDealerListingPayload(id, data, dealer));
        const feedUrl = `${APP_URL}/api/public/dealers/${encodeURIComponent(dealer.publicId)}/feed.json${featuredOnly ? '?featuredOnly=true' : ''}`;

        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderDealerEmbedHtml({ dealer, listings: payload, feedUrl, featuredOnly }));
      }

      if (req.method === 'GET' && path === '/public/dealer-embed.js') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        res.set('Content-Type', 'application/javascript; charset=utf-8');
        return res.status(200).send(`(function(){var script=document.currentScript;var dealer=script&&script.dataset?script.dataset.dealer:'';var targetId=script&&script.dataset?script.dataset.target:'';var limit=script&&script.dataset&&script.dataset.limit?script.dataset.limit:'12';var featuredOnly=script&&script.dataset&&script.dataset.featuredOnly?script.dataset.featuredOnly:'false';if(!dealer){console.error('Forestry Equipment Sales dealer embed requires data-dealer.');return;}var target=targetId?document.getElementById(targetId):null;if(!target){target=document.createElement('div');if(script&&script.parentNode){script.parentNode.insertBefore(target,script.nextSibling);}else{document.body.appendChild(target);}}var iframe=document.createElement('iframe');var params=new URLSearchParams();if(limit)params.set('limit',limit);if(featuredOnly)params.set('featuredOnly',featuredOnly);iframe.src='${APP_URL}/api/public/dealers/'+encodeURIComponent(dealer)+'/embed?'+params.toString();iframe.loading='lazy';iframe.style.width='100%';iframe.style.minHeight=(script&&script.dataset&&script.dataset.height?script.dataset.height:'980')+'px';iframe.style.border='0';iframe.style.display='block';iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');target.innerHTML='';target.appendChild(iframe);})();`);
      }

      /* ── Dealer Widget JS (Web Component) ──────────────────────── */
      if (req.method === 'GET' && path === '/public/dealer-widget.js') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
        res.set('Content-Type', 'application/javascript; charset=utf-8');
        return res.status(200).send(renderDealerWidgetScript(APP_URL));
      }

      /* ── Dealer Widget Config (public, read-only) ─────────────── */
      const widgetConfigMatch = path.match(/^\/public\/dealers\/([^/]+)\/widget-config$/i);
      if (req.method === 'GET' && widgetConfigMatch) {
        try {
          const dealer = await resolvePublicDealer(decodeURIComponent(widgetConfigMatch[1] || ''));
          const configDoc = await getDb().collection('dealerWidgetConfigs').doc(dealer.sellerUid).get();
          const config = configDoc.exists ? (configDoc.data() || {}) : {};
          res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
          res.set('Access-Control-Allow-Origin', '*');
          return res.status(200).json({
            config: {
              cardStyle: config.cardStyle || 'fes-native',
              accentColor: config.accentColor || '#16A34A',
              fontFamily: config.fontFamily || '',
              darkMode: Boolean(config.darkMode),
              showInquiry: config.showInquiry !== false,
              showCall: config.showCall !== false,
              showDetails: config.showDetails !== false,
              pageSize: Number(config.pageSize) || 12,
              dealerPhone: String(dealer.phone || ''),
              dealerName: String(dealer.storefrontName || dealer.name || ''),
            },
          });
        } catch (error) {
          if (error && error.message && error.message.includes('not found')) {
            return res.status(404).json({ error: 'Dealer not found.' });
          }
          throw error;
        }
      }

      /* ── Public Dealer Inquiry (unauthenticated) ──────────────── */
      const publicInquiryMatch = path.match(/^\/public\/dealers\/([^/]+)\/inquiry$/i);
      if (req.method === 'POST' && publicInquiryMatch) {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
          return res.status(204).send('');
        }

        const dealer = await resolvePublicDealer(decodeURIComponent(publicInquiryMatch[1] || ''));
        const body = req.body || {};
        const buyerName = String(body.name || '').trim();
        const buyerEmail = String(body.email || '').trim().toLowerCase();
        const buyerPhone = String(body.phone || '').trim();
        const message = String(body.message || '').trim();
        const listingId = String(body.listingId || '').trim();

        if (!buyerName || !buyerEmail) {
          return res.status(400).json({ error: 'Name and email are required.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
          return res.status(400).json({ error: 'Invalid email address.' });
        }

        const inquiryDoc = {
          sellerUid: dealer.sellerUid,
          listingId: listingId || null,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || null,
          message: message || 'Submitted via dealer widget embed.',
          status: 'New',
          source: 'dealer_widget',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await getDb().collection('inquiries').add(inquiryDoc);

        /* Send email notification to dealer */
        try {
          const dealerEmail = String(dealer.email || '').trim().toLowerCase();
          if (dealerEmail) {
            await sgMail.send({
              to: dealerEmail,
              from: { email: 'noreply@forestryequipmentsales.com', name: 'Forestry Equipment Sales' },
              subject: `New Inquiry from ${buyerName}${listingId ? ` — Listing ${listingId}` : ''}`,
              html: `<p><strong>${buyerName}</strong> (${buyerEmail}${buyerPhone ? `, ${buyerPhone}` : ''}) submitted an inquiry via your dealer widget embed.</p>${message ? `<p>${message.replace(/\n/g, '<br>')}</p>` : ''}<p><a href="${APP_URL}/dealer-os">Open DealerOS</a></p>`,
            });
          }
        } catch (emailError) {
          logger.warn('Failed to send widget inquiry notification email', { error: emailError.message });
        }

        return res.status(200).json({ success: true });
      }

      /* ── CORS preflight for public dealer endpoints ─────────── */
      if (req.method === 'OPTIONS' && path.match(/^\/public\/dealers\/[^/]+\/(inquiry|widget-config)$/i)) {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '86400');
        return res.status(204).send('');
      }

      if (req.method === 'POST' && (path === '/billing/webhook' || path === '/webhooks/stripe')) {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const webhookSecret = String(STRIPE_WEBHOOK_SECRET.value() || '').trim();
        const signature = Array.isArray(req.headers['stripe-signature'])
          ? req.headers['stripe-signature'][0]
          : req.headers['stripe-signature'];
        if (!webhookSecret || !signature) {
          return res.status(400).json({ error: 'Missing Stripe webhook signature or secret.' });
        }

        let event;
        try {
          event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
        } catch (error) {
          logger.error('Stripe webhook signature verification failed', error);
          return res.status(400).send('Invalid signature');
        }

        if (markRecentStripeWebhookEvent(event.id)) {
          logger.info('Ignoring duplicate Stripe webhook event already handled on this instance.', {
            eventId: event.id,
            eventType: event.type,
          });
          return res.status(200).json({ received: true, duplicate: true });
        }

        try {
          if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            await finalizeCheckoutSession(stripe, event.data.object, `webhook:${event.type}`);
          }

          if (
            event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated' ||
            event.type === 'customer.subscription.deleted'
          ) {
            await syncSubscriptionStateFromStripeObject(stripe, event.data.object, `webhook:${event.type}`);
          }

          if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
            const invoiceObject = event.data.object || {};
            const metadata = invoiceObject.metadata || invoiceObject.parent?.subscription_details?.metadata || invoiceObject.subscription_details?.metadata || {};
            const userUid = String(metadata.userUid || '').trim() || await resolveUserUidFromStripeCustomerId(invoiceObject.customer, stripe);
            const planName = getPlanDisplayName(metadata.planId);
            if (event.type === 'invoice.payment_succeeded') {
              const invoiceEmail =
                String(invoiceObject.customer_email || '').trim().toLowerCase() ||
                String(invoiceObject.customer_details?.email || '').trim().toLowerCase();

              if (invoiceEmail) {
                const payload = templates.invoicePaidReceipt({
                  displayName: String(invoiceObject.customer_name || '').trim() || 'there',
                  invoiceNumber: invoiceObject.number || invoiceObject.id,
                  amountPaid: typeof invoiceObject.amount_paid === 'number' ? invoiceObject.amount_paid / 100 : 0,
                  currency: invoiceObject.currency || 'usd',
                  planName,
                  hostedInvoiceUrl: invoiceObject.hosted_invoice_url || '',
                  invoicePdfUrl: invoiceObject.invoice_pdf || '',
                });
                await sendEmail({ to: invoiceEmail, ...payload });
              }
            }

            const rawSubscriptionId = typeof invoiceObject.subscription === 'string'
              ? invoiceObject.subscription
              : invoiceObject.subscription?.id;

            if (rawSubscriptionId) {
              const latestSubscription = await stripe.subscriptions.retrieve(rawSubscriptionId);
              await syncSubscriptionStateFromStripeObject(stripe, latestSubscription, `webhook:${event.type}`);
            }
          }

          // Handle charge refunds: cancel the associated subscription and enforce listing visibility
          if (event.type === 'charge.refunded') {
            const charge = event.data.object || {};
            const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice?.id;
            if (invoiceId) {
              try {
                const invoice = await stripe.invoices.retrieve(invoiceId);
                const subId = typeof invoice.subscription === 'string'
                  ? invoice.subscription
                  : invoice.subscription?.id;
                if (subId) {
                  // Cancel the subscription immediately (not at period end) since a refund was issued
                  const canceledSub = await stripe.subscriptions.cancel(subId);
                  await syncSubscriptionStateFromStripeObject(stripe, canceledSub, `webhook:${event.type}`);
                  logger.info('Charge refund triggered subscription cancellation and visibility enforcement.', {
                    chargeId: charge.id,
                    invoiceId,
                    subscriptionId: subId,
                  });
                }
              } catch (refundSyncErr) {
                logger.error('Failed to enforce subscription cancellation after charge refund.', {
                  chargeId: charge.id,
                  invoiceId,
                  error: refundSyncErr?.message || refundSyncErr,
                });
              }
            }
          }

          return res.status(200).json({ received: true });
        } catch (processingError) {
          logger.error('Stripe webhook processing failed', processingError);
          recentStripeWebhookEvents.delete(String(event.id || '').trim());
          return res.status(500).json({ error: 'Webhook processing failed. Retry expected.' });
        }
      }

      if (req.method === 'POST' && path === '/billing/create-checkout-session') {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const uid = decodedToken.uid;
        const plan = getListingCheckoutPlan(req.body?.planId);
        const listingId = String(req.body?.listingId || '').trim();

        if (!plan) {
          return res.status(400).json({ error: 'Invalid listing plan.' });
        }
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const listingRef = getDb().collection('listings').doc(listingId);
        const listingSnap = await listingRef.get();
        if (!listingSnap.exists) {
          return res.status(404).json({ error: 'Listing not found.' });
        }

        const listing = listingSnap.data() || {};
        const ownerUid = String(listing.sellerUid || listing.sellerId || '');
        if (!ownerUid || ownerUid !== uid) {
          return res.status(403).json({ error: 'You can only pay for your own listing.' });
        }

        if (String(listing.paymentStatus || '') === 'paid') {
          return res.status(409).json({ error: 'Listing is already paid.' });
        }

        const paidListingsSnap = await getDb()
          .collection('listings')
          .where('sellerUid', '==', uid)
          .where('paymentStatus', '==', 'paid')
          .get();

        const activePaidListingsCount = paidListingsSnap.docs.filter((doc) => {
          if (doc.id === listingId) return false;
          const listingData = doc.data() || {};
          return String(listingData.status || 'active').toLowerCase() !== 'sold';
        }).length;

        if (activePaidListingsCount >= plan.listingCap) {
          return res.status(409).json({
            error: `Your ${plan.name} includes up to ${plan.listingCap} active ${plan.listingCap === 1 ? 'listing' : 'listings'}. Upgrade or mark one as sold before posting another.`,
          });
        }

        const customerId = await getOrCreateStripeCustomer(stripe, uid, decodedToken.email, decodedToken.name);
        const priceId = await resolveStripePriceIdForPlan(stripe, plan);
        const baseUrl = getRequestBaseUrl(req);

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: customerId,
          success_url: `${baseUrl}/sell?checkout=success&session_id={CHECKOUT_SESSION_ID}&listingId=${encodeURIComponent(listingId)}`,
          cancel_url: `${baseUrl}/sell?checkout=canceled&listingId=${encodeURIComponent(listingId)}`,
          line_items: [{
            price: priceId,
            quantity: 1,
          }],
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

        return res.status(200).json({
          sessionId: session.id,
          url: session.url,
        });
      }

      if ((req.method === 'GET' || req.method === 'POST') && path === '/email-preferences/unsubscribe') {
        const payload = req.method === 'GET' ? req.query : req.body;
        const uid = normalizeNonEmptyString(payload?.uid);
        const email = normalizeNonEmptyString(payload?.email).toLowerCase();
        const scope = normalizeNonEmptyString(payload?.scope, 'optional').toLowerCase();
        const token = normalizeNonEmptyString(payload?.token);

        if (!uid || !email || !token) {
          return res.status(400).json({ error: 'Missing unsubscribe parameters.' });
        }

        if (!verifyEmailPreferenceToken({ uid, email, scope, token })) {
          return res.status(401).json({ error: 'This unsubscribe link is invalid or has expired.' });
        }

        const userRef = getDb().collection('users').doc(uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
          return res.status(404).json({ error: 'Subscriber not found.' });
        }

        const userData = userSnap.data() || {};
        const storedEmail = normalizeNonEmptyString(userData.email).toLowerCase();
        if (!storedEmail || storedEmail !== email) {
          return res.status(404).json({ error: 'Subscriber not found.' });
        }

        if (req.method === 'GET') {
          return res.status(200).json({
            email,
            displayName: normalizeNonEmptyString(userData.displayName, 'there'),
            scope,
            emailNotificationsEnabled: userData.emailNotificationsEnabled !== false,
          });
        }

        await userRef.set(
          {
            emailNotificationsEnabled: false,
            emailOptOutAt: admin.firestore.FieldValue.serverTimestamp(),
            emailOptOutSource: 'unsubscribe_link',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return res.status(200).json({
          success: true,
          email,
          scope,
          emailNotificationsEnabled: false,
        });
      }

      if (req.method === 'POST' && path === '/auth/send-verification-email') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const verificationRateLimit = consumeAuthRateLimit(
          'send-verification-email',
          req,
          decodedToken.uid,
          AUTH_RATE_LIMITS.sendVerificationEmail,
        );

        if (!verificationRateLimit.allowed) {
          res.set('Retry-After', String(verificationRateLimit.retryAfterSeconds));
          logger.warn('Verification email endpoint rate limit exceeded.', {
            uid: decodedToken.uid,
            ipAddress: getRequestIp(req),
          });
          return res.status(429).json({
            error: 'Too many verification email requests. Please wait before trying again.',
            retryAfterSeconds: verificationRateLimit.retryAfterSeconds,
          });
        }

        const userRecord = await admin.auth().getUser(decodedToken.uid);
        if (userRecord.emailVerified) {
          return res.status(200).json({ sent: false, alreadyVerified: true });
        }

        const profileSnap = await getDb().collection('users').doc(decodedToken.uid).get();
        const profile = profileSnap.data() || {};
        const email = String(userRecord.email || decodedToken.email || '').trim();

        if (!email) {
          return res.status(400).json({ error: 'No email address is available for this account.' });
        }

        await sendVerificationEmailMessage({
          email,
          displayName: String(profile.displayName || userRecord.displayName || 'there').trim(),
        });

        return res.status(200).json({ sent: true });
      }

      if (req.method === 'POST' && path === '/auth/password-reset') {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!/.+@.+\..+/.test(email)) {
          return res.status(400).json({
            error: 'Please enter a valid email address.',
            code: 'auth/invalid-email',
          });
        }

        const passwordResetRateLimit = consumeAuthRateLimit(
          'password-reset',
          req,
          email,
          AUTH_RATE_LIMITS.passwordReset,
        );

        if (!passwordResetRateLimit.allowed) {
          res.set('Retry-After', String(passwordResetRateLimit.retryAfterSeconds));
          logger.warn('Password reset endpoint rate limit exceeded.', {
            email,
            ipAddress: getRequestIp(req),
          });
          return res.status(429).json({
            error: 'Too many password reset requests. Please wait before trying again.',
            code: 'auth/too-many-requests',
            retryAfterSeconds: passwordResetRateLimit.retryAfterSeconds,
          });
        }

        const continueUrl = `${resolveAppUrlFromRequest(req)}/login`;

        try {
          let displayName = 'there';
          try {
            const userRecord = await admin.auth().getUserByEmail(email);
            displayName = String(userRecord.displayName || 'there').trim() || 'there';
          } catch (error) {
            if (isAuthUserNotFound(error)) {
              return res.status(200).json({ sent: true });
            }
            throw error;
          }

          await sendPasswordResetEmailMessage({
            email,
            displayName,
            continueUrl,
          });

          return res.status(200).json({ sent: true });
        } catch (error) {
          logger.error('Failed to send self-service password reset email', error);
          return res.status(500).json({
            error: 'Unable to send password reset email right now.',
            code: 'auth/internal-error',
          });
        }
      }

      if (req.method === 'POST' && path === '/auth/bootstrap-profile-role') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const email = String(decodedToken.email || '').trim().toLowerCase();
        if (!isPrivilegedAdminEmail(email)) {
          return res.status(403).json({ error: 'This account is not allowed to self-promote.' });
        }

        const uid = String(decodedToken.uid || '').trim();
        if (!uid) {
          return res.status(400).json({ error: 'Missing authenticated user id.' });
        }

        const userRecord = await admin.auth().getUser(uid);
        const userRef = getDb().collection('users').doc(uid);
        const profileSnap = await userRef.get();
        const profile = profileSnap.data() || {};

        await userRef.set(
          {
            uid,
            email,
            displayName: String(profile.displayName || userRecord.displayName || decodedToken.name || 'Forestry Equipment Sales Admin').trim(),
            role: 'super_admin',
            accountStatus: 'active',
            accountAccessSource: 'admin_override',
            emailVerified: Boolean(userRecord.emailVerified),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(profileSnap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp(), favorites: [] }),
          },
          { merge: true }
        );

        const existingClaims = userRecord.customClaims || {};
        if (existingClaims.role !== 'super_admin') {
          await admin.auth().setCustomUserClaims(uid, buildAccessClaims(existingClaims, {
            role: 'super_admin',
            accountStatus: 'active',
            accountAccessSource: 'admin_override',
            subscriptionPlanId: null,
            subscriptionStatus: null,
            listingCap: null,
            managedAccountCap: null,
          }));
        }

        return res.status(200).json({
          promoted: true,
          uid,
          email,
          role: 'super_admin',
          emailVerified: Boolean(userRecord.emailVerified),
        });
      }

      if (req.method === 'POST' && path === '/billing/create-account-checkout-session') {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const uid = decodedToken.uid;
        const plan = getListingCheckoutPlan(req.body?.planId);
        const returnPathRaw = String(req.body?.returnPath || '/sell').trim();
        const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/sell';
        const requestedQuantityRaw = Number(req.body?.quantity || 1);
        const requestedQuantity = Number.isFinite(requestedQuantityRaw)
          ? Math.floor(requestedQuantityRaw)
          : 1;

        if (!plan) {
          return res.status(400).json({ error: 'Invalid seller plan.' });
        }

        logger.info('create-account-checkout-session: received request', {
          uid,
          planId: plan.id,
          returnPath,
        });

        if (plan.id === 'individual_seller') {
          if (requestedQuantity < 1 || requestedQuantity > MAX_OWNER_OPERATOR_LISTINGS) {
            return res.status(400).json({ error: `Owner-Operator quantity must be between 1 and ${MAX_OWNER_OPERATOR_LISTINGS}.` });
          }
        } else if (requestedQuantity !== 1) {
          return res.status(400).json({ error: 'Only Owner-Operator supports adjustable quantity.' });
        }

        const enrollmentResult = validateSellerProgramEnrollment(req.body?.enrollment, plan.id);
        if (enrollmentResult.error) {
          return res.status(400).json({ error: enrollmentResult.error });
        }
        const enrollment = enrollmentResult.value;

        const userRef = getDb().collection('users').doc(uid);
        let existingUser = {};
        let firestoreQuotaLimited = false;
        try {
          const userSnap = await userRef.get();
          existingUser = userSnap.data() || {};
        } catch (error) {
          if (!isFirestoreQuotaExceeded(error)) {
            throw error;
          }
          firestoreQuotaLimited = true;
        }

        const customerId = await getOrCreateStripeCustomer(stripe, uid, decodedToken.email, decodedToken.name);
        await stripe.customers.update(customerId, {
          name: enrollment.companyName || enrollment.legalFullName,
          email: enrollment.billingEmail || decodedToken.email || undefined,
          phone: enrollment.phoneNumber || undefined,
          metadata: {
            userUid: uid,
            latestPlanId: plan.id,
            billingCountry: enrollment.country,
            statementLabel: enrollment.statementLabel,
          },
        });
        logger.info('create-account-checkout-session: resolved Stripe customer', {
          uid,
          planId: plan.id,
          hasCustomerId: Boolean(customerId),
          firestoreQuotaLimited,
        });
        const summary = await resolveAccountSubscriptionAccessSummary(uid, {
          stripe,
          customerId,
          skipFirestore: firestoreQuotaLimited,
        });
        logger.info('create-account-checkout-session: resolved subscription summary', {
          uid,
          planId: plan.id,
          summaryPlanId: summary.planId,
          summaryStatus: summary.subscriptionStatus,
        });
        const activePlanId = String(
          (firestoreQuotaLimited ? summary.planId : existingUser.activeSubscriptionPlanId) || ''
        ).trim();
        const accountIsActive = firestoreQuotaLimited
          ? !!summary.planId
          : String(existingUser.accountStatus || '') === 'active' && !!activePlanId;

        if (accountIsActive && activePlanId) {
          if (plan.id !== 'individual_seller' || activePlanId !== 'individual_seller') {
            return res.status(409).json({ error: 'This account already has an active seller subscription.' });
          }

          const currentOwnerQuantity = summary.ownerOperatorQuantity || 0;
          if (currentOwnerQuantity >= MAX_OWNER_OPERATOR_LISTINGS) {
            return res.status(409).json({
              error: `Owner-Operator subscriptions are capped at ${MAX_OWNER_OPERATOR_LISTINGS} active listings per account.`,
            });
          }

          if (currentOwnerQuantity + requestedQuantity > MAX_OWNER_OPERATOR_LISTINGS) {
            return res.status(409).json({
              error: `You currently have ${currentOwnerQuantity} active Owner-Operator listing ${currentOwnerQuantity === 1 ? 'slot' : 'slots'}. You can add up to ${MAX_OWNER_OPERATOR_LISTINGS - currentOwnerQuantity} more.`,
            });
          }
        }

        const baseUrl = getRequestBaseUrl(req);
        const successSeparator = returnPath.includes('?') ? '&' : '?';

        if (!firestoreQuotaLimited) {
          try {
            await userRef.set(
              {
                onboardingIntent: plan.id,
                accountStatus: 'pending',
                accountAccessSource: 'pending_checkout',
                subscriptionStatus: 'pending',
                requestedSubscriptionQuantity: plan.id === 'individual_seller' ? requestedQuantity : 1,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } catch (error) {
            if (!isFirestoreQuotaExceeded(error)) {
              throw error;
            }
            logger.warn('Skipping pending checkout profile write because Firestore quota is exhausted.', {
              uid,
              planId: plan.id,
            });
          }
        } else {
          logger.warn('Skipping pending checkout profile write because Firestore is already quota limited for this request.', {
            uid,
            planId: plan.id,
          });
        }

        const priceId = await resolveStripePriceIdForPlan(stripe, plan);

        logger.info('create-account-checkout-session: creating Stripe checkout session', {
          uid,
          planId: plan.id,
          priceId,
          quantity: plan.id === 'individual_seller' ? requestedQuantity : 1,
        });
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: customerId,
          success_url: `${baseUrl}${returnPath}${successSeparator}accountCheckout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}${returnPath}${successSeparator}accountCheckout=canceled`,
          line_items: [{
            price: priceId,
            quantity: plan.id === 'individual_seller' ? requestedQuantity : 1,
          }],
          allow_promotion_codes: true,
          consent_collection: {
            terms_of_service: 'required',
          },
          custom_text: {
            submit: {
              message: `By continuing, you agree to the Forestry Equipment Sales Terms and Privacy Policy. Dealer and Pro Dealer subscriptions bill under ${getSellerProgramStatementLabel(plan.id)}.`,
            },
          },
          metadata: {
            userUid: uid,
            planId: plan.id,
            checkoutScope: 'account',
            subscriptionQuantity: String(plan.id === 'individual_seller' ? requestedQuantity : 1),
            listingCap: String(plan.id === 'individual_seller' ? requestedQuantity : plan.listingCap),
            statementLabel: enrollment.statementLabel,
            legalTermsVersion: enrollment.legalTermsVersion,
            legalTermsAccepted: 'true',
            legalTermsAcceptedAt: enrollment.acceptedAtIso,
            legalScope: enrollment.scope,
            billingCountry: enrollment.country,
          },
          subscription_data: {
            description: getPlanInvoiceDisplayName(plan.id),
            metadata: {
              userUid: uid,
              planId: plan.id,
              checkoutScope: 'account',
              subscriptionQuantity: String(plan.id === 'individual_seller' ? requestedQuantity : 1),
              listingCap: String(plan.id === 'individual_seller' ? requestedQuantity : plan.listingCap),
              statementLabel: enrollment.statementLabel,
              legalTermsVersion: enrollment.legalTermsVersion,
              legalTermsAccepted: 'true',
              legalTermsAcceptedAt: enrollment.acceptedAtIso,
              legalScope: enrollment.scope,
              billingCountry: enrollment.country,
              statementDescriptorSuffix: getCheckoutStatementDescriptorSuffix(plan.id),
            },
          },
        });

        if (!session.url) {
          return res.status(500).json({ error: 'Stripe checkout URL was not returned.' });
        }

        if (firestoreQuotaLimited) {
          logger.warn('Skipping seller program checkout intent write because Firestore is already quota limited for this request.', {
            uid,
            planId: plan.id,
            sessionId: session.id,
          });
        } else {
          const checkoutIntentPersistPromise = recordSellerProgramCheckoutIntent({
            userUid: uid,
            planId: plan.id,
            customerId,
            subscriptionQuantity: plan.id === 'individual_seller' ? requestedQuantity : 1,
            session,
            enrollment,
          })
            .then(() => ({ status: 'persisted' }))
            .catch((error) => ({ status: 'error', error }));

          const checkoutIntentResult = await Promise.race([
            checkoutIntentPersistPromise,
            new Promise((resolve) => setTimeout(() => resolve({ status: 'timeout' }), 4000)),
          ]);

          if (checkoutIntentResult.status === 'error') {
            if (!isFirestoreQuotaExceeded(checkoutIntentResult.error)) {
              throw checkoutIntentResult.error;
            }

            logger.warn('Skipping seller program checkout intent write because Firestore quota is exhausted.', {
              uid,
              planId: plan.id,
              sessionId: session.id,
            });
          } else if (checkoutIntentResult.status === 'timeout') {
            logger.warn('Continuing checkout response before seller program checkout intent write completed.', {
              uid,
              planId: plan.id,
              sessionId: session.id,
            });
          }
        }

        logger.info('create-account-checkout-session: Stripe checkout session created', {
          uid,
          planId: plan.id,
          sessionId: session.id,
        });

        return res.status(200).json({
          sessionId: session.id,
          url: session.url,
        });
      }

      if (req.method === 'GET' && path.startsWith('/billing/checkout-session/')) {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        const sessionId = path.replace('/billing/checkout-session/', '').trim();
        if (!sessionId) {
          return res.status(400).json({ error: 'Session id is required.' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
        });

        if (decodedToken && String(session.metadata?.userUid || '') !== decodedToken.uid) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const finalized = await finalizeCheckoutSession(stripe, session, 'confirm');

        return res.status(200).json({
          sessionId: session.id,
          status: session.status,
          paid: finalized.paid,
          listingId: finalized.listingId,
          planId: finalized.planId,
          scope: finalized.scope,
        });
      }

      if (req.method === 'POST' && path === '/billing/create-portal-session') {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const uid = String(decodedToken.uid || '').trim();
        const email = String(decodedToken.email || '').trim().toLowerCase();
        const returnPathRaw = String(req.body?.returnPath || '/profile?tab=Account%20Settings').trim();
        const returnPath = returnPathRaw.startsWith('/') ? returnPathRaw : '/profile?tab=Account%20Settings';
        const baseUrl = getRequestBaseUrl(req);
        const separator = returnPath.includes('?') ? '&' : '?';

        const customerId = await resolveExistingStripeCustomerId(stripe, uid, email);
        if (!customerId) {
          return res.status(409).json({
            error: 'No active billing profile was found for this account yet. Choose an ad program before opening billing management.',
          });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${baseUrl}${returnPath}${separator}billingPortal=return`,
        });

        if (!portalSession?.url) {
          return res.status(500).json({ error: 'Stripe billing portal URL was not returned.' });
        }

        void writeAccountAuditLog({
          eventType: 'BILLING_PORTAL_SESSION_CREATED',
          actorUid: uid,
          targetUid: uid,
          source: 'billing_portal',
          reason: 'Customer opened secure Stripe billing portal.',
          metadata: {
            stripeCustomerId: customerId,
            returnPath,
          },
        }).catch((error) => {
          logger.warn('Continuing billing portal response before account audit log completed.', {
            uid,
            stripeCustomerId: customerId,
            error: String(error?.message || error || ''),
          });
        });

        return res.status(200).json({
          url: portalSession.url,
          stripeCustomerId: customerId,
        });
      }

      if (req.method === 'POST' && path.startsWith('/billing/refresh-account-access')) {
        if (!stripe) {
          return res.status(503).json({ error: 'Stripe is not configured on this environment.' });
        }

        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const uid = decodedToken.uid;
        const email = String(decodedToken.email || '').trim().toLowerCase();
        const customerId = await findExistingStripeCustomerId(stripe, uid, email);
        const entries = customerId
          ? await listStripeAccountSubscriptionEntries(stripe, customerId)
          : [];
        const summary = buildAccountSubscriptionAccessSummary(entries);
        const relevantEntry = getMostRelevantStripeAccountSubscriptionEntry(entries);

        if (customerId && relevantEntry?.planId) {
          await applyAccountSubscriptionToUserProfile({
            stripe,
            stripeCustomerId: customerId,
            userUid: uid,
            planId: String(relevantEntry.planId || '').trim(),
            subscriptionStatus: String(relevantEntry.status || summary.subscriptionStatus || 'pending').trim(),
            subscriptionId: String(relevantEntry.subscriptionId || summary.currentSubscriptionId || '').trim() || null,
            currentPeriodEnd: Number.isFinite(Number(relevantEntry.currentPeriodEndMillis || 0)) && Number(relevantEntry.currentPeriodEndMillis || 0) > 0
              ? admin.firestore.Timestamp.fromMillis(Number(relevantEntry.currentPeriodEndMillis || 0))
              : null,
            cancelAtPeriodEnd: Boolean(relevantEntry.cancelAtPeriodEnd),
            source: 'manual_refresh',
            skipFirestore: true,
          });
        }

        const authUserRecord = await getAuthUserRecordSafe(uid);
        const claims = authUserRecord?.customClaims || {};
        const claimedRole = normalizeUserRole(String(claims.role || ''));
        const claimedAccessSource = normalizeAccountAccessSource(claims.accountAccessSource);
        const claimedAccountStatus = normalizeAccountStatus(claims.accountStatus);
        const claimedPlanId = getListingCheckoutPlan(String(claims.subscriptionPlanId || '').trim())
          ? String(claims.subscriptionPlanId || '').trim()
          : '';
        const rawClaimedSubscriptionStatus = String(claims.subscriptionStatus || summary.subscriptionStatus || '').trim().toLowerCase();
        const claimedSubscriptionStatus =
          rawClaimedSubscriptionStatus === 'pending'
            ? 'pending'
            : rawClaimedSubscriptionStatus
              ? normalizeStripeSubscriptionStatus(rawClaimedSubscriptionStatus)
              : null;
        const responseState = buildAccountStateFromSources({}, authUserRecord, {
          role: claimedRole || null,
          accountAccessSource: claimedAccessSource || (summary.planId ? 'subscription' : null),
          accountStatus: claimedAccountStatus || 'active',
          activeSubscriptionPlanId: claimedPlanId || summary.planId || null,
          subscriptionStatus: claimedSubscriptionStatus || summary.subscriptionStatus || null,
          listingCap: summary.planId
            ? summary.listingCap
            : (
              Number.isFinite(Number(claims.listingCap))
                ? Number(claims.listingCap)
                : summary.listingCap
            ),
          managedAccountCap: summary.planId
            ? summary.managedAccountCap
            : (
              Number.isFinite(Number(claims.managedAccountCap))
                ? Number(claims.managedAccountCap)
                : summary.managedAccountCap
            ),
          currentSubscriptionId: summary.currentSubscriptionId || null,
          currentPeriodEnd: summary.currentPeriodEndIso || null,
        });

        const subscriptionStartDate = relevantEntry?.createdMillis && Number(relevantEntry.createdMillis) > 0
          ? new Date(Number(relevantEntry.createdMillis)).toISOString()
          : null;

        return res.status(200).json({
          stripeCustomerId: customerId || null,
          planId: responseState.activeSubscriptionPlanId,
          subscriptionStatus: responseState.subscriptionStatus,
          listingCap: responseState.listingCap,
          managedAccountCap: responseState.managedAccountCap,
          currentSubscriptionId: responseState.currentSubscriptionId,
          currentPeriodEnd: responseState.currentPeriodEnd,
          subscriptionStartDate,
          role: responseState.role || null,
          accountAccessSource: responseState.accountAccessSource,
          accountStatus: responseState.accountStatus,
          entitlement: buildAccountEntitlementSnapshot(responseState),
        });
      }

      const listingLifecycleMatch = path.match(/^\/listings\/([^/]+)\/lifecycle$/i);
      if (req.method === 'POST' && listingLifecycleMatch) {
        const listingId = decodeURIComponent(listingLifecycleMatch[1] || '').trim();
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const listingRef = getDb().collection('listings').doc(listingId);
        const listingSnap = await listingRef.get();
        if (!listingSnap.exists) {
          return res.status(404).json({ error: 'Listing not found.' });
        }

        const listing = listingSnap.data() || {};
        const actorContext = await getListingLifecycleActorContext(req, listing);
        if (actorContext.error) {
          return res.status(actorContext.status).json({ error: actorContext.error });
        }

        const action = normalizeNonEmptyString(req.body?.action).toLowerCase();
        const reason = normalizeNonEmptyString(req.body?.reason);
        const metadata = req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};
        const sellerAllowedActions = new Set(['submit', 'relist', 'mark_sold', 'archive']);

        if (!actorContext.isAdminActor && !sellerAllowedActions.has(action)) {
          return res.status(403).json({ error: 'This account cannot perform that listing action.' });
        }

        try {
          const result = await applyListingLifecycleAction({
            listingRef,
            listingId,
            listing,
            action,
            actorUid: actorContext.actorUid,
            actorRole: actorContext.actorRole,
            reason,
            metadata,
          });

          return res.status(200).json({
            message: `Listing ${action.replace(/_/g, ' ')} completed.`,
            lifecycleAction: action,
            previousLifecycleState: result.currentLifecycleState,
            listing: {
              id: listingId,
              status: result.patch.status ?? listing.status ?? null,
              approvalStatus: result.patch.approvalStatus ?? listing.approvalStatus ?? null,
              paymentStatus: result.patch.paymentStatus ?? listing.paymentStatus ?? null,
              publishedAt: timestampValueToIso(result.patch.publishedAt) || timestampValueToIso(listing.publishedAt) || null,
              expiresAt: timestampValueToIso(result.patch.expiresAt) || timestampValueToIso(listing.expiresAt) || null,
              soldAt: timestampValueToIso(result.patch.soldAt) || timestampValueToIso(listing.soldAt) || null,
              archivedAt: timestampValueToIso(result.patch.archivedAt) || timestampValueToIso(listing.archivedAt) || null,
              rejectionReason: result.patch.rejectionReason ?? listing.rejectionReason ?? null,
              updatedAt: new Date().toISOString(),
            },
          });
        } catch (error) {
          if (error?.code === 'invalid-lifecycle-transition') {
            return res.status(409).json({
              error: error.message,
              details: error.details || {},
            });
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/market-rates') {
        const payload = await getMarketRatesPayload();
        res.set('Cache-Control', 'public, max-age=900');
        return res.status(200).json(payload);
      }

      const adminListingAuditMatch = path.match(/^\/admin\/listings\/([^/]+)\/lifecycle-audit$/i);
      if (req.method === 'GET' && adminListingAuditMatch) {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const listingId = decodeURIComponent(adminListingAuditMatch[1] || '').trim();
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        try {
          const db = getDb();
          const listingRef = db.collection('listings').doc(listingId);
          const reportRef = db.collection('listingAuditReports').doc(listingId);
          const mediaAuditRef = db.collection('listingMediaAudit').doc(listingId);

          const [listingSnap, reportSnap, mediaAuditSnap, transitionsSnap] = await Promise.all([
            listingRef.get(),
            reportRef.get(),
            mediaAuditRef.get(),
            db.collection('listingStateTransitions').where('listingId', '==', listingId).limit(50).get(),
          ]);

          if (!listingSnap.exists) {
            return res.status(404).json({ error: 'Listing not found.' });
          }

          const listing = listingSnap.data() || {};
          const transitions = transitionsSnap.docs
            .map((docSnapshot) => serializeListingLifecycleTransitionRecord(docSnapshot))
            .sort((left, right) => {
              const leftTime = new Date(left.createdAt || 0).getTime() || 0;
              const rightTime = new Date(right.createdAt || 0).getTime() || 0;
              return rightTime - leftTime;
            })
            .slice(0, 25);

          return res.status(200).json({
            listingId,
            listing: {
              id: listingId,
              title: normalizeNonEmptyString(listing.title, '(Untitled Listing)'),
              manufacturer: normalizeNonEmptyString(listing.manufacturer || listing.make),
              make: normalizeNonEmptyString(listing.make),
              model: normalizeNonEmptyString(listing.model),
              status: normalizeNonEmptyString(listing.status, 'pending'),
              approvalStatus: normalizeNonEmptyString(listing.approvalStatus, 'pending'),
              paymentStatus: normalizeNonEmptyString(listing.paymentStatus, 'pending'),
              rejectionReason: normalizeNonEmptyString(listing.rejectionReason),
              lastLifecycleAction: normalizeNonEmptyString(listing.lastLifecycleAction),
              lastLifecycleAt: timestampValueToIso(listing.lastLifecycleAt) || null,
              updatedAt: timestampValueToIso(listing.updatedAt) || null,
            },
            report: serializeListingLifecycleAuditReport(reportSnap),
            mediaAudit: serializeListingMediaAuditRecord(mediaAuditSnap),
            transitions,
          });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            return res.status(503).json({
              error: 'Listing lifecycle audit is temporarily unavailable because the Firestore daily read quota is exhausted.',
            });
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/admin/listings/review-summaries') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const ids = normalizeNonEmptyString(req.query?.ids)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 50);

        if (ids.length === 0) {
          return res.status(200).json({ summaries: [] });
        }

        try {
          const reports = await Promise.all(
            ids.map((listingId) => getDb().collection('listingAuditReports').doc(listingId).get())
          );

          return res.status(200).json({
            summaries: reports
              .map((docSnapshot) => serializeListingLifecycleReviewSummaryRecord(docSnapshot))
              .filter(Boolean),
          });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            return res.status(503).json({
              error: 'Listing review summaries are temporarily unavailable because the Firestore daily read quota is exhausted.',
            });
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/marketplace-stats') {
        const payload = await getMarketplaceStatsPayload();
        res.set('Cache-Control', 'public, max-age=600');
        return res.status(200).json(payload);
      }

      if (req.method === 'GET' && path === '/public/listings') {
        const filters = parseMarketplaceListingFilters(req.query || {});
        const [activeListings, soldListings] = await Promise.all([
          loadActivePublicListings(),
          filters.inStockOnly === false ? loadSoldMarketplaceListings() : Promise.resolve([]),
        ]);
        const listings = filterMarketplaceListings(
          [...activeListings, ...soldListings],
          filters,
          { includeUnapproved: false }
        );
        res.set('Cache-Control', 'public, max-age=60');
        return res.status(200).json({ listings });
      }

      if (req.method === 'GET' && path === '/public/listings/by-id') {
        const rawIds = normalizeNonEmptyString(req.query?.ids);
        const ids = rawIds
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 25);

        if (ids.length === 0) {
          return res.status(200).json({ listings: [] });
        }

        const [activeListings, soldListings] = await Promise.all([
          loadActivePublicListings(),
          loadSoldMarketplaceListings(),
        ]);
        const listingLookup = new Map([...activeListings, ...soldListings].map((listing) => [String(listing.id), listing]));
        const listings = ids.map((id) => listingLookup.get(id)).filter(Boolean);
        res.set('Cache-Control', 'public, max-age=60');
        return res.status(200).json({ listings });
      }

      const publicListingViewMatch = path.match(/^\/public\/listings\/([^/]+)\/view$/i);
      if (req.method === 'POST' && publicListingViewMatch) {
        const listingId = decodeURIComponent(publicListingViewMatch[1] || '').trim();
        if (!listingId) {
          return res.status(400).json({ error: 'A listing ID is required.' });
        }

        const listingRef = getDb().collection('listings').doc(listingId);
        const sessionKey = normalizeNonEmptyString(req.body?.sessionKey);
        const todayKey = new Date().toISOString().slice(0, 10);
        const dedupeSeed = [listingId, sessionKey || getRequestIp(req), todayKey].join('|');
        const dedupeHash = createHash('sha256').update(dedupeSeed).digest('hex').slice(0, 32);
        const eventRef = getDb().collection('listingViewEvents').doc(`${listingId}-${todayKey}-${dedupeHash}`);

        try {
          const result = await getDb().runTransaction(async (transaction) => {
            const [listingSnapshot, existingEventSnapshot] = await Promise.all([
              transaction.get(listingRef),
              transaction.get(eventRef),
            ]);

            if (!listingSnapshot.exists) {
              return { missing: true, recorded: false };
            }

            if (existingEventSnapshot.exists) {
              return { missing: false, recorded: false };
            }

            const listingData = listingSnapshot.data() || {};
            transaction.set(eventRef, {
              listingId,
              sellerUid: normalizeNonEmptyString(listingData.sellerUid || listingData.sellerId),
              sellerId: normalizeNonEmptyString(listingData.sellerId || listingData.sellerUid),
              listingTitle: normalizeNonEmptyString(listingData.title, listingId),
              viewedAt: admin.firestore.FieldValue.serverTimestamp(),
              viewedDateKey: todayKey,
              sessionKeyHash: dedupeHash,
              referrer: normalizeNonEmptyString(req.headers.referer || req.headers.referrer).slice(0, 300),
              userAgent: normalizeNonEmptyString(req.headers['user-agent']).slice(0, 300),
            });
            transaction.update(listingRef, {
              views: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { missing: false, recorded: true };
          });

          if (result.missing) {
            return res.status(404).json({ error: 'Listing not found.' });
          }

          return res.status(200).json({
            recorded: result.recorded,
            listingId,
          });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            return res.status(200).json({
              recorded: false,
              listingId,
              warning: 'Listing views are temporarily unavailable because the Firestore daily read quota is exhausted.',
            });
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/public/category-metrics') {
        const metrics = await getPublicCategoryMetricsPayload();
        res.set('Cache-Control', 'public, max-age=60');
        return res.status(200).json({ metrics });
      }

      if (req.method === 'GET' && path === '/public/home-data') {
        const payload = await getPublicHomeDataPayload();
        res.set('Cache-Control', 'public, max-age=60');
        return res.status(200).json(payload);
      }

      if (req.method === 'GET' && path === '/public/places-autocomplete') {
        const input = normalizeNonEmptyString(req.query.input || '');
        if (!input) return res.status(400).json({ predictions: [] });
        const apiKey = String(GOOGLE_MAPS_API_KEY.value() || '').trim();
        if (!apiKey) return res.status(200).json({ predictions: [] });
        try {
          const placesRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${encodeURIComponent(apiKey)}`
          );
          const placesData = await placesRes.json();
          const predictions = (placesData.predictions || []).slice(0, 5).map((p) => ({
            description: p.description,
            placeId: p.place_id,
          }));
          res.set('Cache-Control', 'public, max-age=300');
          return res.status(200).json({ predictions });
        } catch {
          return res.status(200).json({ predictions: [] });
        }
      }

      if (req.method === 'POST' && path === '/account/listings') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorEmail = normalizeNonEmptyString(decodedToken.email).toLowerCase();
        const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);
        const isAdminActor = canAdministrateAccount(tokenRole);
        const rawListing = req.body?.listing && typeof req.body.listing === 'object'
          ? req.body.listing
          : (req.body && typeof req.body === 'object' ? req.body : {});
        const requestedSellerUid = normalizeNonEmptyString(rawListing.sellerUid || rawListing.sellerId, actorUid);

        if (requestedSellerUid !== actorUid && !isAdminActor) {
          return res.status(403).json({ error: 'You can only create listings for your own account.' });
        }

        let sellerAccountState = buildAccountStateFromSources({}, { customClaims: decodedToken }, {
          ...(isPrivilegedAdminEmail(actorEmail)
            ? {
                role: 'super_admin',
                accountStatus: 'active',
                accountAccessSource: 'admin_override',
              }
            : {}),
        });

        if (requestedSellerUid !== actorUid) {
          const sellerRef = getDb().collection('users').doc(requestedSellerUid);
          const [sellerSnap, sellerAuthRecord] = await Promise.all([
            sellerRef.get(),
            getAuthUserRecordSafe(requestedSellerUid),
          ]);

          if (!sellerSnap.exists && !sellerAuthRecord) {
            return res.status(404).json({ error: 'Seller account was not found.' });
          }

          sellerAccountState = buildAccountStateFromSources(sellerSnap.data() || {}, sellerAuthRecord);
        }

        const sellerEntitlement = buildAccountEntitlementSnapshot(sellerAccountState);
        const sellerRole = normalizeUserRole(sellerAccountState.role || tokenRole || 'buyer');

        if (!isAdminActor && !sellerEntitlement.canPostListings) {
          return res.status(403).json({ error: 'An active seller subscription is required before creating listings.' });
        }

        const listingInput = sanitizeListingCreatePayload(rawListing);
        const qualityErrors = validateListingCreatePayload(listingInput);
        if (qualityErrors.length > 0) {
          return res.status(400).json({ error: `Listing quality validation failed: ${qualityErrors.join(' ')}` });
        }

        const requestedId = normalizeNonEmptyString(listingInput.id);
        const resolvedListingId = requestedId || await reserveNextSequentialListingId();
        const listingRef = getDb().collection('listings').doc(resolvedListingId);

        let finalListingRef = listingRef;
        if (requestedId) {
          const existingListingSnap = await listingRef.get();
          if (existingListingSnap.exists) {
            const fallbackId = await reserveNextSequentialListingId();
            finalListingRef = getDb().collection('listings').doc(fallbackId);
          }
        }

        if (!isAdminActor && sellerEntitlement.listingCap > 0) {
          const activeListingCount = await countSellerListingsForCapacity(requestedSellerUid);
          if (activeListingCount >= sellerEntitlement.listingCap) {
            return res.status(409).json({
              error: `This account includes up to ${sellerEntitlement.listingCap} active ${sellerEntitlement.listingCap === 1 ? 'listing' : 'listings'}. Upgrade or mark one as sold before posting another.`,
            });
          }
        }

        if (listingInput.featured) {
          const featuredCap = getFeaturedListingCapForRole(sellerRole);
          if (!Number.isFinite(featuredCap) && featuredCap !== Number.POSITIVE_INFINITY) {
            return res.status(403).json({ error: 'This account role cannot mark listings as featured.' });
          }
          if (featuredCap <= 0) {
            return res.status(403).json({ error: 'This account role cannot mark listings as featured.' });
          }

          const featuredCount = await countSellerListingsForCapacity(requestedSellerUid, { featuredOnly: true });
          if (featuredCount >= featuredCap) {
            return res.status(409).json({
              error: `This account can feature up to ${featuredCap} active ${featuredCap === 1 ? 'listing' : 'listings'}. Unfeature one before selecting another.`,
            });
          }
        }

        const draftListing = {
          ...listingInput,
          id: finalListingRef.id,
          sellerUid: requestedSellerUid,
          sellerId: requestedSellerUid,
          sellerVerified: isVerifiedSellerRole(sellerRole, sellerAccountState.manuallyVerified),
          qualityValidated: true,
          status: 'draft',
          approvalStatus: 'pending',
          approvedBy: null,
          approvedAt: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
          submittedAt: null,
          paymentStatus: sellerEntitlement.canPostListings ? 'paid' : 'pending',
          subscriptionPlanId: sellerEntitlement.activeSubscriptionPlanId || null,
          publishedAt: null,
          archivedAt: null,
          soldAt: null,
          expiredAt: null,
          relistedAt: null,
          paidAt: null,
          paymentConfirmedAt: null,
          marketValueEstimate: null,
          views: 0,
          leads: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await finalListingRef.set(draftListing, { merge: false });
        await applyListingLifecycleAction({
          listingRef: finalListingRef,
          listingId: finalListingRef.id,
          listing: {
            ...draftListing,
            id: finalListingRef.id,
          },
          action: 'submit',
          actorUid,
          actorRole: tokenRole,
          reason: requestedSellerUid === actorUid
            ? 'Submitted by seller during listing creation.'
            : 'Submitted by administrator during listing creation.',
        });

        const createdListingSnap = await finalListingRef.get();
        return res.status(201).json({
          message: 'Listing created and submitted for review.',
          lifecycleAction: 'submit',
          listing: buildMarketplaceListingPayload(createdListingSnap.id, createdListingSnap.data() || {}),
        });
      }

      const accountListingMatch = path.match(/^\/account\/listings\/([^/]+)$/i);
      if (accountListingMatch && req.method === 'PATCH') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorEmail = normalizeNonEmptyString(decodedToken.email).toLowerCase();
        const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);
        const isAdminActor = canAdministrateAccount(tokenRole);
        const listingId = normalizeNonEmptyString(decodeURIComponent(accountListingMatch[1]));
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const listingRef = getDb().collection('listings').doc(listingId);
        const listingSnapshot = await listingRef.get();
        if (!listingSnapshot.exists) {
          return res.status(404).json({ error: 'Listing not found.' });
        }

        const existingData = listingSnapshot.data() || {};
        const listingSellerUid = normalizeNonEmptyString(existingData.sellerUid || existingData.sellerId);
        if (listingSellerUid !== actorUid && !isAdminActor) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const requestUpdates = req.body && typeof req.body === 'object' ? req.body : {};

        const { sanitizedUpdates, mergedSanitized, shouldValidateQuality } = sanitizeListingUpdatePayload(
          {
            ...existingData,
            sellerUid: listingSellerUid,
            sellerId: listingSellerUid,
          },
          requestUpdates
        );

        if (Object.keys(sanitizedUpdates).length === 0) {
          return res.status(400).json({ error: 'No supported listing updates were provided.' });
        }

        if (shouldValidateQuality) {
          const qualityErrors = validateListingCreatePayload(mergedSanitized);
          if (qualityErrors.length > 0) {
            return res.status(400).json({ error: `Listing quality validation failed: ${qualityErrors.join(' ')}` });
          }
        }

        let sellerAccountState = buildAccountStateFromSources(existingData, { customClaims: decodedToken }, {
          ...(isPrivilegedAdminEmail(actorEmail)
            ? {
                role: 'super_admin',
                accountStatus: 'active',
                accountAccessSource: 'admin_override',
              }
            : {}),
        });

        if (listingSellerUid && listingSellerUid !== actorUid) {
          const sellerRef = getDb().collection('users').doc(listingSellerUid);
          const [sellerSnap, sellerAuthRecord] = await Promise.all([
            sellerRef.get(),
            getAuthUserRecordSafe(listingSellerUid),
          ]);

          if (sellerSnap.exists || sellerAuthRecord) {
            sellerAccountState = buildAccountStateFromSources(sellerSnap.data() || {}, sellerAuthRecord);
          }
        }

        const sellerRole = normalizeUserRole(sellerAccountState.role || tokenRole || 'buyer');

        if (Object.prototype.hasOwnProperty.call(sanitizedUpdates, 'featured') && sanitizedUpdates.featured) {
          const featuredCap = getFeaturedListingCapForRole(sellerRole);
          if (!Number.isFinite(featuredCap) && featuredCap !== Number.POSITIVE_INFINITY) {
            return res.status(403).json({ error: 'This account role cannot mark listings as featured.' });
          }
          if (featuredCap <= 0) {
            return res.status(403).json({ error: 'This account role cannot mark listings as featured.' });
          }

          const featuredCount = await countSellerListingsForCapacity(listingSellerUid, {
            featuredOnly: true,
            excludeListingId: listingId,
          });
          if (featuredCount >= featuredCap) {
            return res.status(409).json({
              error: `This account can feature up to ${featuredCap} active ${featuredCap === 1 ? 'listing' : 'listings'}. Unfeature one before selecting another.`,
            });
          }
        }

        const nextApprovalStatus = normalizeMarketplaceText(existingData.approvalStatus || 'pending');
        const nextStatus = normalizeMarketplaceText(existingData.status || 'draft');

        sanitizedUpdates.qualityValidated = true;
        sanitizedUpdates.sellerVerified = isVerifiedSellerRole(sellerRole, sellerAccountState.manuallyVerified);
        sanitizedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        if (shouldValidateQuality && nextApprovalStatus === 'approved' && nextStatus !== 'sold' && nextStatus !== 'archived') {
          sanitizedUpdates.approvalStatus = 'pending';
          sanitizedUpdates.status = 'pending';
          sanitizedUpdates.approvedAt = null;
          sanitizedUpdates.approvedBy = null;
          sanitizedUpdates.rejectionReason = null;
          sanitizedUpdates.rejectedAt = null;
          sanitizedUpdates.rejectedBy = null;
          sanitizedUpdates.submittedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await listingRef.update(sanitizedUpdates);
        const updatedSnapshot = await listingRef.get();
        return res.status(200).json({
          listing: buildMarketplaceListingPayload(updatedSnapshot.id, updatedSnapshot.data() || {}),
        });
      }

      if (accountListingMatch && req.method === 'DELETE') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorEmail = normalizeNonEmptyString(decodedToken.email).toLowerCase();
        const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);
        const isAdminActor = canAdministrateAccount(tokenRole);
        const listingId = normalizeNonEmptyString(decodeURIComponent(accountListingMatch[1]));
        if (!listingId) {
          return res.status(400).json({ error: 'Listing id is required.' });
        }

        const listingRef = getDb().collection('listings').doc(listingId);
        const listingSnapshot = await listingRef.get();
        if (!listingSnapshot.exists) {
          return res.status(404).json({ error: 'Listing not found.' });
        }

        const existingData = listingSnapshot.data() || {};
        const listingSellerUid = normalizeNonEmptyString(existingData.sellerUid || existingData.sellerId);
        if (listingSellerUid !== actorUid && !isAdminActor) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        await listingRef.delete();
        return res.status(200).json({
          success: true,
          listingId,
        });
      }

      if (req.method === 'GET' && path === '/account/listings') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const requestedSellerUid = normalizeNonEmptyString(req.query?.sellerUid, actorUid);
        if (requestedSellerUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const filters = parseMarketplaceListingFilters({
          ...req.query,
          sellerUid: requestedSellerUid,
        });
        const quotaWarning = 'Account listings are temporarily unavailable because the Firestore daily read quota is exhausted.';

        try {
          const primarySnapshot = await getDb()
            .collection('listings')
            .where('sellerUid', '==', requestedSellerUid)
            .get();

          let listings = primarySnapshot.docs.map((docSnapshot) => buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {}));

          if (listings.length === 0) {
            const legacySnapshot = await getDb()
              .collection('listings')
              .where('sellerId', '==', requestedSellerUid)
              .get();
            listings = legacySnapshot.docs.map((docSnapshot) => buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {}));
          }

          const filteredListings = filterMarketplaceListings(listings, filters, { includeUnapproved: true });
          return res.status(200).json({ listings: filteredListings });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Account listings API is returning quota fallback payload.', {
              actorUid,
              requestedSellerUid,
            });
            return res.status(200).json(buildQuotaLimitedPayload('listings', [], quotaWarning));
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/account/bootstrap') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(200).json(await buildAccountBootstrapPayload(decodedToken, { stripe }));
      }

      if (req.method === 'GET' && path === '/account/profile') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

          const bootstrap = await buildAccountBootstrapPayload(decodedToken, { stripe });
        return res.status(200).json({
          profile: bootstrap.profile,
          source: bootstrap.source,
          profileDocExists: bootstrap.profileDocExists,
          firestoreQuotaLimited: bootstrap.firestoreQuotaLimited,
        });
      }

      if (req.method === 'PATCH' && path === '/account/profile') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorEmail = normalizeNonEmptyString(decodedToken.email).toLowerCase();
        const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);
        const sanitizedUpdates = sanitizeAccountProfilePatchPayload(req.body || {});
        const updatedFields = Object.keys(sanitizedUpdates);

        if (updatedFields.length === 0) {
          return res.status(400).json({ error: 'No supported profile updates were provided.' });
        }

        let authRecord = null;
        try {
          authRecord = await getAuthUserRecordSafe(actorUid);
        } catch (error) {
          logger.warn('Unable to load auth record for account profile patch.', {
            actorUid,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        let currentData = {};
        let profileDocExists = false;
        let firestoreQuotaLimited = false;

        try {
          const userSnapshot = await getDb().collection('users').doc(actorUid).get();
          if (userSnapshot.exists) {
            currentData = userSnapshot.data() || {};
            profileDocExists = true;
          }
        } catch (error) {
          if (!isFirestoreQuotaExceeded(error)) {
            throw error;
          }

          firestoreQuotaLimited = true;
          logger.warn('Account profile patch is applying without pre-read because the Firestore daily read quota is exhausted.', {
            actorUid,
            updatedFields,
          });
        }

        const nextUserData = {
          ...currentData,
          ...sanitizedUpdates,
          uid: actorUid,
        };

        const nextRole = normalizeUserRole(currentData.role || authRecord?.customClaims?.role || tokenRole || 'buyer');
        const quotaSafeProfileFields = new Set([
          'emailNotificationsEnabled',
          'preferredLanguage',
          'preferredCurrency',
          'mfaEnabled',
          'mfaMethod',
          'mfaPhoneNumber',
          'mfaDisplayName',
          'mfaEnrolledAt',
        ]);
        const canUseQuotaSafeFallback =
          firestoreQuotaLimited &&
          updatedFields.length > 0 &&
          updatedFields.every((field) => quotaSafeProfileFields.has(field));

        if (canUseQuotaSafeFallback) {
          return res.status(200).json({
            profile: serializeAccountProfileData(actorUid, nextUserData, authRecord, {
              role: nextRole,
            }),
            source: 'quota_fallback_local',
            profileDocExists,
            firestoreQuotaLimited: true,
            warning: 'Profile changes were accepted locally and will fully sync after the Firestore quota window resets.',
            fetchedAt: new Date().toISOString(),
          });
        }

        await getDb().collection('users').doc(actorUid).set(
          {
            uid: actorUid,
            ...sanitizedUpdates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        if (authRecord && ('displayName' in sanitizedUpdates || 'photoURL' in sanitizedUpdates)) {
          const authPatch = {};
          if ('displayName' in sanitizedUpdates) {
            authPatch.displayName = normalizeNonEmptyString(
              sanitizedUpdates.displayName,
              normalizeNonEmptyString(authRecord.displayName)
            ) || null;
          }
          if ('photoURL' in sanitizedUpdates) {
            authPatch.photoURL = normalizeNonEmptyString(
              sanitizedUpdates.photoURL,
              normalizeNonEmptyString(authRecord.photoURL)
            ) || null;
          }

          if (Object.keys(authPatch).length > 0) {
            try {
              await admin.auth().updateUser(actorUid, authPatch);
            } catch (error) {
              if (!isAuthUserNotFound(error)) {
                logger.error(`Failed to update auth profile for ${actorUid}`, error);
              }
            }
          }
        }

        if (supportsEnterpriseStorefrontRole(nextRole)) {
          const storefrontName = normalizeNonEmptyString(
            nextUserData.storefrontName || nextUserData.displayName || nextUserData.company,
            'Forestry Equipment Sales Storefront'
          );
          const storefrontSlug = buildStorefrontSlugValue(
            nextUserData.storefrontSlug || storefrontName,
            actorUid
          );

          await getDb().collection('storefronts').doc(actorUid).set(
            {
              uid: actorUid,
              role: nextRole,
              storefrontEnabled: true,
              storefrontSlug,
              canonicalPath: `/seller/${storefrontSlug}`,
              displayName: normalizeNonEmptyString(nextUserData.displayName || nextUserData.company, storefrontName),
              storefrontName,
              storefrontTagline: normalizeNonEmptyString(nextUserData.storefrontTagline),
              storefrontDescription: normalizeNonEmptyString(nextUserData.storefrontDescription || nextUserData.about),
              location: normalizeNonEmptyString(nextUserData.location),
              phone: normalizeNonEmptyString(nextUserData.phoneNumber),
              email: normalizeNonEmptyString(nextUserData.email || authRecord?.email),
              website: normalizeNonEmptyString(nextUserData.website),
              logo: normalizeNonEmptyString(nextUserData.photoURL),
              coverPhotoUrl: normalizeNonEmptyString(nextUserData.coverPhotoUrl),
              seoTitle: normalizeNonEmptyString(nextUserData.seoTitle) ||
                `${storefrontName} | ${nextRole === 'pro_dealer' ? 'Pro Dealer' : nextRole === 'dealer' ? 'Dealer' : 'Equipment Seller'} on Forestry Equipment Sales`,
              seoDescription: normalizeNonEmptyString(nextUserData.seoDescription) ||
                `Browse forestry and logging equipment from ${storefrontName}${nextUserData.location ? ' in ' + nextUserData.location : ''}. Verified ${nextRole === 'pro_dealer' ? 'Pro Dealer' : nextRole === 'dealer' ? 'Dealer' : 'seller'} on Forestry Equipment Sales — the trusted marketplace for industrial forestry machinery.`,
              seoKeywords: Array.isArray(nextUserData.seoKeywords) && nextUserData.seoKeywords.length > 0
                ? nextUserData.seoKeywords.filter((keyword) => typeof keyword === 'string').slice(0, 30)
                : [storefrontName, 'forestry equipment', 'logging equipment', 'used forestry equipment', 'skidders', 'harvesters', 'feller bunchers', 'forwarders'].filter(Boolean),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        await writeAccountAuditLog({
          eventType: 'ACCOUNT_PROFILE_UPDATED',
          actorUid,
          targetUid: actorUid,
          source: 'account_profile_patch',
          reason: `Account profile updated: ${updatedFields.join(', ')}`,
          metadata: {
            updatedFields,
            firestoreQuotaLimited,
          },
        });

        const responseProfile = serializeAccountProfileData(actorUid, nextUserData, authRecord, {
          role: nextRole,
        });

        return res.status(200).json({
          profile: responseProfile,
          source: profileDocExists ? 'firestore' : 'auth_fallback',
          profileDocExists,
          firestoreQuotaLimited,
          fetchedAt: new Date().toISOString(),
        });
      }

      if (req.method === 'GET' && path === '/account/financing-requests') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const requestedUserUid = normalizeNonEmptyString(req.query?.userUid, actorUid);
        if (requestedUserUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const quotaWarning = 'Financing requests are temporarily unavailable because the Firestore daily read quota is exhausted.';

        try {
          const snapshot = canAdministrateAccount(actorRole) && !requestedUserUid
            ? await getDb().collection('financingRequests').orderBy('createdAt', 'desc').get()
            : await getDb().collection('financingRequests').where('buyerUid', '==', requestedUserUid).get();

          const financingRequests = snapshot.docs
            .map((docSnapshot) => {
              const data = docSnapshot.data() || {};
              return {
                id: docSnapshot.id,
                listingId: normalizeNonEmptyString(data.listingId) || undefined,
                sellerUid: normalizeNonEmptyString(data.sellerUid) || undefined,
                buyerUid: data.buyerUid == null ? null : normalizeNonEmptyString(data.buyerUid) || null,
                applicantName: normalizeNonEmptyString(data.applicantName),
                applicantEmail: normalizeNonEmptyString(data.applicantEmail),
                applicantPhone: normalizeNonEmptyString(data.applicantPhone),
                company: normalizeNonEmptyString(data.company) || undefined,
                requestedAmount: toFiniteNumberOrUndefined(data.requestedAmount),
                message: normalizeNonEmptyString(data.message) || undefined,
                status: normalizeNonEmptyString(data.status, 'New'),
                createdAt: timestampValueToIso(data.createdAt) || new Date().toISOString(),
                updatedAt: timestampValueToIso(data.updatedAt) || null,
              };
            })
            .sort((left, right) => timestampValueToSortableMs(right.updatedAt || right.createdAt) - timestampValueToSortableMs(left.updatedAt || left.createdAt));

          return res.status(200).json({ financingRequests });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Account financing requests API is returning quota fallback payload.', {
              actorUid,
              requestedUserUid,
            });
            return res.status(200).json(buildQuotaLimitedPayload('financingRequests', [], quotaWarning));
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/account/seat-context') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const requestedOwnerUid = normalizeNonEmptyString(req.query?.ownerUid, actorUid);
        if (requestedOwnerUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const [subscriptionsSnapshot, managedAccountsSnapshot] = await Promise.all([
          getDb().collection('subscriptions').where('userUid', '==', requestedOwnerUid).where('status', '==', 'active').get(),
          getDb().collection('users').where('parentAccountUid', '==', requestedOwnerUid).get(),
        ]);

        const activePlanIds = Array.from(
          new Set(
            subscriptionsSnapshot.docs
              .map((snapshot) => String(snapshot.data()?.planId || '').trim())
              .filter((planId) => planId === 'dealer' || planId === 'fleet_dealer')
          )
        );

        const seatCount = managedAccountsSnapshot.docs.filter((snapshot) => {
          const status = String(snapshot.data()?.accountStatus || 'active').trim().toLowerCase();
          return status !== 'suspended';
        }).length;

        return res.status(200).json({
          seatLimit: activePlanIds.length > 0 ? 3 : 0,
          seatCount,
          activePlanIds,
        });
      }

      if (req.method === 'GET' && path === '/account/inquiries') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const requestedSellerUid = normalizeNonEmptyString(req.query?.sellerUid, actorUid);
        if (requestedSellerUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const quotaWarning = 'Account inquiries are temporarily unavailable because the Firestore daily read quota is exhausted.';

        try {
          const sellerUidSnapshot = await getDb().collection('inquiries').where('sellerUid', '==', requestedSellerUid).get();
          let inquiryDocs = sellerUidSnapshot.docs;

          if (inquiryDocs.length === 0) {
            const legacySnapshot = await getDb().collection('inquiries').where('sellerId', '==', requestedSellerUid).get();
            inquiryDocs = legacySnapshot.docs;
          }

          const inquiries = inquiryDocs
            .map((docSnapshot) => serializeInquiryDoc(docSnapshot))
            .sort((left, right) => timestampValueToSortableMs(right.updatedAt || right.createdAt) - timestampValueToSortableMs(left.updatedAt || left.createdAt));

          return res.status(200).json({ inquiries });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Account inquiries API is returning quota fallback payload.', {
              actorUid,
              requestedSellerUid,
            });
            return res.status(200).json(buildQuotaLimitedPayload('inquiries', [], quotaWarning));
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/account/calls') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const requestedSellerUid = normalizeNonEmptyString(req.query?.sellerUid, actorUid);
        if (requestedSellerUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const quotaWarning = 'Account calls are temporarily unavailable because the Firestore daily read quota is exhausted.';

        try {
          const sellerUidSnapshot = await getDb().collection('calls').where('sellerUid', '==', requestedSellerUid).get();
          let callDocs = sellerUidSnapshot.docs;

          if (callDocs.length === 0) {
            const legacySnapshot = await getDb().collection('calls').where('sellerId', '==', requestedSellerUid).get();
            callDocs = legacySnapshot.docs;
          }

          const calls = callDocs
            .map((docSnapshot) => serializeCallDoc(docSnapshot))
            .sort((left, right) => timestampValueToSortableMs(right.createdAt) - timestampValueToSortableMs(left.createdAt));

          return res.status(200).json({ calls });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Account calls API is returning quota fallback payload.', {
              actorUid,
              requestedSellerUid,
            });
            return res.status(200).json(buildQuotaLimitedPayload('calls', [], quotaWarning));
          }
          throw error;
        }
      }

      const accountCallRecordingMatch = path.match(/^\/account\/calls\/([^/]+)\/recording$/i);
      if (req.method === 'GET' && accountCallRecordingMatch) {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const callId = decodeURIComponent(accountCallRecordingMatch[1] || '').trim();
        if (!callId) {
          return res.status(400).json({ error: 'A call ID is required.' });
        }

        const callSnapshot = await getDb().collection('calls').doc(callId).get();
        if (!callSnapshot.exists) {
          return res.status(404).json({ error: 'Call recording not found.' });
        }

        const callData = callSnapshot.data() || {};
        const sellerUid = normalizeNonEmptyString(callData.sellerUid || callData.sellerId);
        if (sellerUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        return streamTwilioRecordingToResponse(callData.recordingUrl, res);
      }

      if (req.method === 'GET' && path.startsWith('/public/sellers/')) {
        const requestedIdentity = decodeURIComponent(path.slice('/public/sellers/'.length)).trim();
        if (!requestedIdentity) {
          return res.status(400).json({ error: 'Seller identifier is required.' });
        }

        try {
          let storefrontSnapshot = await getDb().collection('storefronts').doc(requestedIdentity).get();
          if (!storefrontSnapshot.exists) {
            const storefrontSlugSnapshot = await getDb()
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
            return res.status(200).json({ seller: serializeSellerPayloadFromStorefront(storefrontSnapshot.id, storefrontSnapshot.data() || {}) });
          }

          let userSnapshot = await getDb().collection('users').doc(requestedIdentity).get();
          if (!userSnapshot.exists) {
            const userSlugSnapshot = await getDb()
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
            return res.status(200).json({ seller: serializeSellerPayloadFromUser(userSnapshot.id, userSnapshot.data() || {}) });
          }

          return res.status(200).json({ seller: null });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Public seller API is returning a quota-limited fallback.', {
              requestedIdentity,
            });
            return res.status(200).json(buildQuotaLimitedPayload('seller', null, 'Seller information is temporarily unavailable because the Firestore daily read quota is exhausted.', {
              source: 'quota_fallback',
            }));
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/public/news') {
        try {
          const posts = await getPublicNewsFeedPayload();
          res.set('Cache-Control', 'public, max-age=300');
          return res.status(200).json({ posts });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Public news API is returning a quota-limited fallback feed.');
            const cachedPosts = Array.isArray(publicNewsCache?.posts) ? publicNewsCache.posts : [];
            return res.status(200).json(buildQuotaLimitedPayload('posts', cachedPosts, 'Equipment News is temporarily unavailable because the Firestore daily read quota is exhausted.', {
              source: cachedPosts.length > 0 ? 'cached_news_fallback' : 'quota_fallback',
            }));
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path.startsWith('/public/news/')) {
        const requestedNewsId = decodeURIComponent(path.slice('/public/news/'.length)).trim();
        if (!requestedNewsId) {
          return res.status(400).json({ error: 'News identifier is required.' });
        }

        try {
          const post = await getPublicNewsPostPayload(requestedNewsId);
          res.set('Cache-Control', 'public, max-age=300');
          return res.status(200).json({ post });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Public news detail API is returning a quota-limited fallback.', {
              requestedNewsId,
            });
            const cachedPost = Array.isArray(publicNewsCache?.posts)
              ? publicNewsCache.posts.find((post) => normalizeNonEmptyString(post.id) === requestedNewsId) || null
              : null;
            return res.status(200).json(buildQuotaLimitedPayload('post', cachedPost, 'This Equipment News article is temporarily unavailable because the Firestore daily read quota is exhausted.', {
              source: cachedPost ? 'cached_news_fallback' : 'quota_fallback',
            }));
          }
          throw error;
        }
      }

      if (req.method === 'GET' && path === '/account/storefront') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = normalizeNonEmptyString(decodedToken.uid);
        const actorRole = getActorRoleFromDecodedToken(decodedToken);
        const requestedUserUid = normalizeNonEmptyString(req.query?.userUid, actorUid);
        if (requestedUserUid !== actorUid && !canAdministrateAccount(actorRole)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const quotaWarning = 'Storefront data is temporarily unavailable because the Firestore daily read quota is exhausted.';

        try {
          const storefrontSnapshot = await getDb().collection('storefronts').doc(requestedUserUid).get();
          if (storefrontSnapshot.exists) {
            return res.status(200).json({ seller: serializeSellerPayloadFromStorefront(storefrontSnapshot.id, storefrontSnapshot.data() || {}) });
          }

          const userSnapshot = await getDb().collection('users').doc(requestedUserUid).get();
          if (userSnapshot.exists) {
            return res.status(200).json({ seller: serializeSellerPayloadFromUser(userSnapshot.id, userSnapshot.data() || {}) });
          }

          return res.status(200).json({ seller: null });
        } catch (error) {
          if (isFirestoreQuotaExceeded(error)) {
            logger.warn('Account storefront API is returning quota fallback payload.', {
              actorUid,
              requestedUserUid,
            });
            const bootstrap = await buildAccountBootstrapPayload(decodedToken, { stripe });
            const fallbackSeller = bootstrap.profile
              ? serializeSellerPayloadFromUser(requestedUserUid, bootstrap.profile)
              : null;
            return res.status(200).json(buildQuotaLimitedPayload('seller', fallbackSeller, quotaWarning, {
              source: fallbackSeller ? 'bootstrap_profile_fallback' : 'quota_fallback',
            }));
          }
          throw error;
        }
      }

      if (req.method === 'POST' && path === '/admin/users/create-managed-account') {
        const decodedToken = await getDecodedUserFromBearer(req);
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const actorUid = decodedToken.uid;
        const actorEmail = String(decodedToken.email || '').trim().toLowerCase();
        const tokenRole = isPrivilegedAdminEmail(actorEmail) ? 'super_admin' : getActorRoleFromDecodedToken(decodedToken);
        let actorRole = tokenRole;
        let actorDoc = buildSyntheticUserDoc(actorUid, {
          uid: actorUid,
          email: actorEmail,
          role: actorRole || 'buyer',
          displayName: String(decodedToken.name || '').trim() || 'Forestry Equipment Sales Admin',
          parentAccountUid: actorUid,
          company: '',
        });
        let actorCanAdminister = canAdministrateAccount(actorRole);
        let actorIsDealer = isDealerManagedRole(actorRole);

        if (!actorCanAdminister && !actorIsDealer) {
          try {
            actorDoc = await getDb().collection('users').doc(actorUid).get();
          } catch (error) {
            if (isFirestoreQuotaExceeded(error)) {
              return res.status(503).json({
                error: 'Managed account access is temporarily unavailable because the Firestore daily read quota is exhausted.',
              });
            }
            throw error;
          }
          actorRole = normalizeUserRole(String(actorDoc.data()?.role || ''));
          actorCanAdminister = isPrivilegedAdminEmail(actorEmail) || canAdministrateAccount(actorRole);
          actorIsDealer = isDealerManagedRole(actorRole);
        }

        if (!actorCanAdminister && !actorIsDealer) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const displayName = String(req.body?.displayName || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const role = normalizeUserRole(String(req.body?.role || ''));
        const company = String(req.body?.company || '').trim();
        const phoneNumber = String(req.body?.phoneNumber || '').trim();
        const ownerUid = String(actorDoc.data()?.parentAccountUid || actorUid).trim();
        const parentRole = actorCanAdminister && actorRole === 'buyer' ? 'super_admin' : actorRole;

        if (!displayName || !email) {
          return res.status(400).json({ error: 'Display name and email are required.' });
        }

        const normalizedRole = role || 'buyer';

        if (!canCreateManagedRole(parentRole, normalizedRole)) {
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

        try {
          const existingUserByEmail = await getDb()
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

          if (!existingUserByEmail.empty) {
            return res.status(409).json({ error: 'An account with that email already exists.' });
          }
        } catch (error) {
          if (!isFirestoreQuotaExceeded(error)) {
            throw error;
          }
          logger.warn('Skipping managed account Firestore email uniqueness check because the daily read quota is exhausted.', {
            actorUid,
            email,
          });
        }

        try {
          await admin.auth().getUserByEmail(email);
          return res.status(409).json({ error: 'An authentication account with that email already exists.' });
        } catch (error) {
          if (error?.code !== 'auth/user-not-found') {
            logger.error('Failed to check Auth user by email', error);
            return res.status(500).json({ error: 'Unable to validate the requested email address.' });
          }
        }

        const temporaryPassword = generateTemporaryPassword();
        const loginUrl = `${APP_URL}/login?email=${encodeURIComponent(email)}&invited=1`;
        const manualAccessSource = deriveManualAccountAccessSource(parentRole, normalizedRole);

        let authUserRecord;

        try {
          authUserRecord = await admin.auth().createUser({
            email,
            password: temporaryPassword,
            displayName,
            emailVerified: false,
            disabled: false,
          });

          await admin.auth().setCustomUserClaims(authUserRecord.uid, buildAccessClaims(authUserRecord.customClaims || {}, {
            role: normalizedRole,
            accountStatus: 'pending',
            accountAccessSource: manualAccessSource,
            parentAccountUid: ownerUid,
            subscriptionPlanId: null,
            subscriptionStatus: null,
            listingCap: null,
            managedAccountCap: null,
          }));

          let resetLink = `${APP_URL}/login`;
          try {
            resetLink = await admin.auth().generatePasswordResetLink(email, {
              url: `${APP_URL}/login`,
            });
          } catch (error) {
            logger.warn(`Could not generate password reset link for ${email}: ${error.message}`);
          }

          const newUserRef = getDb().collection('users').doc(authUserRecord.uid);
          await newUserRef.set({
            uid: authUserRecord.uid,
            email,
            displayName,
            role: normalizedRole,
            accountAccessSource: manualAccessSource || null,
            phoneNumber,
            company: company || String(actorDoc.data()?.company || '').trim(),
            parentAccountUid: ownerUid,
            accountStatus: 'pending',
            favorites: [],
            emailVerified: false,
            onboardingSource: 'managed_invite',
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdByUid: actorUid,
            managedByRole: parentRole,
          });

          const emailPayload = templates.managedAccountInvite({
            displayName,
            inviterName: String(actorDoc.data()?.displayName || actorDoc.data()?.company || 'Forestry Equipment Sales Admin').trim(),
            email,
            role: normalizedRole,
            company: company || String(actorDoc.data()?.company || '').trim(),
            temporaryPassword,
            loginUrl,
            resetLink,
          });

          await sendEmail({ to: email, ...emailPayload });

          return res.status(201).json({
            id: authUserRecord.uid,
            seatLimit: actorIsDealer ? DEALER_MANAGED_ACCOUNT_LIMIT : null,
            message: 'Managed account created and invitation email sent.',
          });
        } catch (error) {
          logger.error('Failed to create managed account invitation', error);

          if (authUserRecord?.uid) {
            try {
              await getDb().collection('users').doc(authUserRecord.uid).delete();
            } catch (cleanupError) {
              logger.error('Failed to clean up managed user profile after invite error', cleanupError);
            }

            try {
              await admin.auth().deleteUser(authUserRecord.uid);
            } catch (cleanupError) {
              logger.error('Failed to clean up managed auth user after invite error', cleanupError);
            }
          }

          return res.status(500).json({ error: 'Unable to create managed account invitation.' });
        }
      }

      if (req.method === 'GET' && path === '/admin/users') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }
        const payload = await listAdminDirectoryUsersPayload();
        return res.status(200).json(payload.users);
      }

      if (req.method === 'GET' && path === '/admin/bootstrap') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const includeOverview = ['1', 'true', 'yes'].includes(String(req.query?.includeOverview || '').trim().toLowerCase());
        return res.status(200).json(await buildAdminOperationsBootstrapPayload({ includeOverview }));
      }

      if (req.method === 'GET' && path === '/admin/content/bootstrap') {
        const actor = await getContentActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const sectionErrorMessages = {
          posts: 'Blog posts are temporarily unavailable because the Firestore daily read quota is exhausted.',
          media: 'Media assets are temporarily unavailable because the Firestore daily read quota is exhausted.',
          contentBlocks: 'Content blocks are temporarily unavailable because the Firestore daily read quota is exhausted.',
        };

        let firestoreQuotaLimited = false;
        const degradedSections = [];
        const errors = {};

        const loadQuotaSafeContentSection = async (section, loader, fallbackValue = []) => {
          try {
            return await loader();
          } catch (error) {
            if (isFirestoreQuotaExceeded(error)) {
              firestoreQuotaLimited = true;
              degradedSections.push(section);
              errors[section] = sectionErrorMessages[section] || 'This content section is temporarily unavailable because the Firestore daily read quota is exhausted.';
              return fallbackValue;
            }
            throw error;
          }
        };

        const [posts, media, contentBlocks] = await Promise.all([
          loadQuotaSafeContentSection('posts', async () => {
            const snapshot = await getDb().collection('blogPosts').orderBy('updatedAt', 'desc').limit(200).get();
            return snapshot.docs.map((docSnapshot) => serializeBlogPostRecord(docSnapshot));
          }),
          loadQuotaSafeContentSection('media', async () => {
            const snapshot = await getDb().collection('mediaLibrary').orderBy('createdAt', 'desc').limit(200).get();
            return snapshot.docs.map((docSnapshot) => serializeMediaLibraryRecord(docSnapshot));
          }),
          loadQuotaSafeContentSection('contentBlocks', async () => {
            const snapshot = await getDb().collection('contentBlocks').orderBy('order', 'asc').limit(200).get();
            return snapshot.docs.map((docSnapshot) => serializeContentBlockRecord(docSnapshot));
          }),
        ]);

        return res.status(200).json({
          posts,
          media,
          contentBlocks,
          partial: degradedSections.length > 0,
          degradedSections: Array.from(new Set(degradedSections)),
          errors,
          firestoreQuotaLimited,
          fetchedAt: new Date().toISOString(),
        });
      }

      if (req.method === 'GET' && path === '/admin/content/blog-posts') {
        const actor = await getContentActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('blogPosts').orderBy('updatedAt', 'desc').limit(200).get();
        return res.status(200).json(snapshot.docs.map((docSnapshot) => serializeBlogPostRecord(docSnapshot)));
      }

      if (req.method === 'GET' && path === '/admin/content/media') {
        const actor = await getContentActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('mediaLibrary').orderBy('createdAt', 'desc').limit(200).get();
        return res.status(200).json(snapshot.docs.map((docSnapshot) => serializeMediaLibraryRecord(docSnapshot)));
      }

      if (req.method === 'GET' && path === '/admin/content/blocks') {
        const actor = await getContentActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('contentBlocks').orderBy('order', 'asc').limit(200).get();
        return res.status(200).json(snapshot.docs.map((docSnapshot) => serializeContentBlockRecord(docSnapshot)));
      }

      if (req.method === 'GET' && path === '/admin/listings') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const pageSize = Math.max(1, Math.min(Number(req.query?.pageSize || 50) || 50, 100));
        const includeDemoListings = ['1', 'true', 'yes'].includes(String(req.query?.includeDemoListings || '').trim().toLowerCase());
        const chunkSize = includeDemoListings ? pageSize : Math.max(pageSize, 100);
        const cursorId = normalizeNonEmptyString(req.query?.cursor);
        const filters = parseMarketplaceListingFilters(req.query || {});

        let cursorSnapshot = null;
        if (cursorId) {
          const listingCursorSnap = await getDb().collection('listings').doc(cursorId).get();
          if (listingCursorSnap.exists) {
            cursorSnapshot = listingCursorSnap;
          }
        }

        let nextCursor = cursorId || null;
        let hasMore = false;
        const listings = [];

        while (listings.length < pageSize) {
          let listingsQuery = getDb()
            .collection('listings')
            .orderBy('createdAt', 'desc')
            .limit(chunkSize);

          if (cursorSnapshot) {
            listingsQuery = listingsQuery.startAfter(cursorSnapshot);
          }

          const querySnapshot = await listingsQuery.get();
          if (querySnapshot.empty) {
            nextCursor = null;
            hasMore = false;
            break;
          }

          cursorSnapshot = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
          nextCursor = cursorSnapshot?.id || null;
          hasMore = querySnapshot.docs.length === chunkSize;

          for (const docSnapshot of querySnapshot.docs) {
            const listing = buildMarketplaceListingPayload(docSnapshot.id, docSnapshot.data() || {});
            if (!includeDemoListings && isDemoListing(listing)) {
              continue;
            }
            listings.push(listing);
            if (listings.length >= pageSize) {
              break;
            }
          }

          if (!hasMore) {
            break;
          }
        }

        const filteredListings = filterMarketplaceListings(listings, filters, { includeUnapproved: true });

        return res.status(200).json({
          listings: filteredListings,
          nextCursor: hasMore ? nextCursor : null,
          hasMore,
        });
      }

      if (req.method === 'GET' && path === '/admin/inquiries') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('inquiries').orderBy('createdAt', 'desc').get();
        const inquiries = snapshot.docs.map((docSnapshot) => serializeInquiryDoc(docSnapshot));
        return res.status(200).json({ inquiries });
      }

      if (req.method === 'GET' && path === '/admin/calls') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('calls').orderBy('createdAt', 'desc').get();
        const calls = snapshot.docs.map((docSnapshot) => serializeCallDoc(docSnapshot));
        return res.status(200).json({ calls });
      }

      const adminCallRecordingMatch = path.match(/^\/admin\/calls\/([^/]+)\/recording$/i);
      if (req.method === 'GET' && adminCallRecordingMatch) {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const callId = decodeURIComponent(adminCallRecordingMatch[1] || '').trim();
        if (!callId) {
          return res.status(400).json({ error: 'A call ID is required.' });
        }

        const callSnapshot = await getDb().collection('calls').doc(callId).get();
        if (!callSnapshot.exists) {
          return res.status(404).json({ error: 'Call recording not found.' });
        }

        return streamTwilioRecordingToResponse(callSnapshot.data()?.recordingUrl, res);
      }

      if (req.method === 'GET' && path === '/admin/billing/invoices') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('invoices').orderBy('createdAt', 'desc').get();
        const invoices = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(invoices);
      }

      if (req.method === 'GET' && path === '/admin/billing/bootstrap') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const sectionErrorMessages = {
          invoices: 'Invoices are temporarily unavailable because the Firestore daily read quota is exhausted.',
          subscriptions: 'Subscriptions are temporarily unavailable because the Firestore daily read quota is exhausted.',
          auditLogs: 'Billing audit logs are temporarily unavailable because the Firestore daily read quota is exhausted.',
          accountAuditLogs: 'Account audit logs are temporarily unavailable because the Firestore daily read quota is exhausted.',
          sellerAgreementAcceptances: 'Seller legal acceptance records are temporarily unavailable because the Firestore daily read quota is exhausted.',
        };

        let firestoreQuotaLimited = false;
        const degradedSections = [];
        const errors = {};

        const loadQuotaSafeSection = async (section, loader, fallbackValue = []) => {
          try {
            return await loader();
          } catch (error) {
            if (isFirestoreQuotaExceeded(error)) {
              firestoreQuotaLimited = true;
              degradedSections.push(section);
              errors[section] = sectionErrorMessages[section] || 'This billing section is temporarily unavailable because the Firestore daily read quota is exhausted.';
              return fallbackValue;
            }
            throw error;
          }
        };

        const [invoices, subscriptions, auditLogs, accountAuditLogs, sellerAgreementAcceptances] = await Promise.all([
          loadQuotaSafeSection('invoices', async () => {
            const snapshot = await getDb().collection('invoices').orderBy('createdAt', 'desc').limit(50).get();
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          }),
          loadQuotaSafeSection('subscriptions', async () => {
            const snapshot = await getDb().collection('subscriptions').limit(100).get();
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          }),
          loadQuotaSafeSection('auditLogs', async () => {
            const snapshot = await getDb().collection('billingAuditLogs').orderBy('timestamp', 'desc').limit(50).get();
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          }),
          loadQuotaSafeSection('accountAuditLogs', async () => {
            const snapshot = await getDb().collection('accountAuditLogs').orderBy('createdAt', 'desc').limit(50).get();
            return snapshot.docs
              .map((docSnapshot) => serializeAccountAuditLogRecord(docSnapshot))
              .filter(Boolean);
          }),
          loadQuotaSafeSection('sellerAgreementAcceptances', async () => {
            const snapshot = await getDb().collection('sellerProgramAgreementAcceptances').orderBy('updatedAt', 'desc').limit(50).get();
            return snapshot.docs
              .map((docSnapshot) => serializeSellerProgramAgreementAcceptanceRecord(docSnapshot))
              .filter(Boolean);
          }),
        ]);

        return res.status(200).json({
          invoices,
          subscriptions,
          auditLogs,
          accountAuditLogs,
          sellerAgreementAcceptances,
          partial: degradedSections.length > 0,
          degradedSections: Array.from(new Set(degradedSections)),
          errors,
          firestoreQuotaLimited,
          fetchedAt: new Date().toISOString(),
        });
      }

      if (req.method === 'GET' && path === '/admin/billing/subscriptions') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('subscriptions').get();
        const subscriptions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(subscriptions);
      }

      if (req.method === 'GET' && path === '/admin/billing/audit-logs') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const snapshot = await getDb().collection('billingAuditLogs').orderBy('timestamp', 'desc').limit(50).get();
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(logs);
      }

      if (req.method === 'GET' && path === '/admin/reports/dealer-performance') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const requestedDays = Math.max(1, Math.min(Number(req.query?.days || 30) || 30, 365));
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (requestedDays * 24 * 60 * 60 * 1000));
        const report = await buildDealerPerformanceReport({
          startDate,
          endDate,
          periodLabel: `Last ${requestedDays} Days ending ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        });

        return res.status(200).json(report);
      }

      if (req.method === 'POST' && path === '/admin/email/test-send') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const body = typeof req.body === 'object' && req.body ? req.body : {};
        const requestedTemplates = Array.isArray(body.templates) ? body.templates : [];
        const requestedRecipients = Array.isArray(body.recipients) ? body.recipients : [];
        const recipients = requestedRecipients
          .map((recipient) => String(recipient || '').trim())
          .filter(Boolean);

        if (recipients.length === 0) {
          return res.status(400).json({ error: 'At least one recipient email is required.' });
        }

        if (requestedTemplates.length === 0) {
          return res.status(400).json({ error: 'At least one template key is required.' });
        }

        const results = [];
        for (const templateKey of requestedTemplates) {
          const payload = buildTemplateTestPayload(templateKey);
          if (!payload) {
            results.push({ template: String(templateKey || ''), status: 'unsupported' });
            continue;
          }

          try {
            await sendEmail({
              to: recipients,
              ...payload,
              replyTo: 'caleb@forestryequipmentsales.com',
            });
            results.push({ template: String(templateKey || ''), status: 'sent', subject: payload.subject });
          } catch (error) {
            logger.error('Failed test email send', { templateKey, error: String(error?.message || error) });
            results.push({ template: String(templateKey || ''), status: 'failed', error: String(error?.message || error) });
          }
        }

        return res.status(200).json({
          recipients,
          replyTo: 'caleb@forestryequipmentsales.com',
          sentBy: actor.actorEmail,
          results,
        });
      }

      const adminUserActionMatch = path.match(/^\/admin\/users\/([^/]+)\/(reset-password|lock|unlock|verify|unverify)$/);
      if (adminUserActionMatch && req.method === 'POST') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const targetUid = decodeURIComponent(adminUserActionMatch[1] || '').trim();
        const action = adminUserActionMatch[2];
        if (!targetUid) {
          return res.status(400).json({ error: 'User id is required.' });
        }

        const targetRef = getDb().collection('users').doc(targetUid);
        const authUserRecord = await getAuthUserRecordSafe(targetUid);
        let targetSnap = null;
        let targetData = {};
        let targetExistsInFirestore = false;
        let firestoreQuotaLimited = false;

        try {
          targetSnap = await targetRef.get();
          targetExistsInFirestore = targetSnap.exists;
          targetData = targetSnap.data() || {};
        } catch (error) {
          if (!isFirestoreQuotaExceeded(error)) {
            throw error;
          }
          firestoreQuotaLimited = true;
          logger.warn('Admin user action is using auth-only fallback because the Firestore daily read quota is exhausted.', {
            action,
            targetUid,
          });
        }

        if (!targetExistsInFirestore && !authUserRecord) {
          return res.status(404).json({ error: 'User not found.' });
        }

        if ((action === 'lock' || action === 'unlock') && targetUid === actor.actorUid) {
          return res.status(400).json({ error: `You cannot ${action} your own account.` });
        }

        if (action === 'verify' || action === 'unverify') {
          const newVal = action === 'verify';
          try {
            await targetRef.set(
              {
                manuallyVerified: newVal,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
            return res.status(200).json({
              message: newVal ? 'Seller verified.' : 'Seller verification removed.',
              manuallyVerified: newVal,
            });
          } catch (error) {
            logger.error(`Failed to ${action} seller ${targetUid}`, error);
            return res.status(500).json({ error: `Unable to ${action} this seller.` });
          }
        }

        if (action === 'reset-password') {
          const email = String(targetData.email || authUserRecord?.email || '').trim().toLowerCase();
          const displayName = String(targetData.displayName || targetData.name || authUserRecord?.displayName || email || 'there').trim();
          if (!email) {
            return res.status(400).json({ error: 'The selected user does not have an email address.' });
          }

          try {
            const actorName = String(actor.actorDoc.data()?.displayName || actor.actorEmail || 'Forestry Equipment Sales Admin').trim();
            await sendPasswordResetEmailMessage({
              email,
              displayName,
              requestedBy: actorName,
              continueUrl: `${resolveAppUrlFromRequest(req)}/login`,
            });

            return res.status(200).json({ message: 'Password reset email sent.' });
          } catch (error) {
            logger.error('Failed to send admin-triggered password reset email', error);
            return res.status(isAuthUserNotFound(error) ? 404 : 500).json({
              error: isAuthUserNotFound(error)
                ? 'Authentication record not found for that user.'
                : 'Unable to send password reset email.',
            });
          }
        }

        const nextDisabledState = action === 'lock';
        try {
          await admin.auth().updateUser(targetUid, { disabled: nextDisabledState });
        } catch (error) {
          if (!isAuthUserNotFound(error)) {
            logger.error(`Failed to ${action} auth user ${targetUid}`, error);
            return res.status(500).json({ error: `Unable to ${action} this user.` });
          }
        }

        const refreshedAuthUserRecord = await getAuthUserRecordSafe(targetUid);
        if (refreshedAuthUserRecord) {
          await admin.auth().setCustomUserClaims(
            targetUid,
            buildAccessClaims(refreshedAuthUserRecord.customClaims || {}, {
              accountStatus: nextDisabledState ? 'suspended' : 'active',
            })
          );
        }

        let warning = '';
        if (!firestoreQuotaLimited) {
          await targetRef.set(
            {
              accountStatus: nextDisabledState ? 'suspended' : 'active',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          warning = 'Authentication status updated. Firestore profile status will sync after the Firestore quota window resets.';
        }

        return res.status(200).json({
          message: nextDisabledState ? 'User locked.' : 'User unlocked.',
          warning,
          user: serializeAdminUserData(
            targetUid,
            {
              ...targetData,
              uid: targetUid,
              accountStatus: nextDisabledState ? 'suspended' : 'active',
              updatedAt: new Date().toISOString(),
            },
            refreshedAuthUserRecord
          ),
        });
      }

      const adminUserTargetMatch = path.match(/^\/admin\/users\/([^/]+)$/);
      if (adminUserTargetMatch && (req.method === 'PATCH' || req.method === 'DELETE')) {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const targetUid = decodeURIComponent(adminUserTargetMatch[1] || '').trim();
        if (!targetUid) {
          return res.status(400).json({ error: 'User id is required.' });
        }

        const targetRef = getDb().collection('users').doc(targetUid);
        let targetSnap = null;
        let currentData = {};
        let targetExistsInFirestore = false;
        let firestoreQuotaLimited = false;

        try {
          targetSnap = await targetRef.get();
          targetExistsInFirestore = targetSnap.exists;
          currentData = targetSnap.data() || {};
        } catch (error) {
          if (!isFirestoreQuotaExceeded(error)) {
            throw error;
          }
          firestoreQuotaLimited = true;
          logger.warn('Admin user update is using a reduced Firestore read path because the daily read quota is exhausted.', {
            targetUid,
            method: req.method,
          });
        }

        if (req.method === 'DELETE') {
          const authUserRecord = await getAuthUserRecordSafe(targetUid);
          if (!targetExistsInFirestore && !authUserRecord) {
            return res.status(404).json({ error: 'User not found.' });
          }

          if (targetUid === actor.actorUid) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
          }

          if (authUserRecord) {
            try {
              await admin.auth().deleteUser(targetUid);
            } catch (error) {
              if (!isAuthUserNotFound(error)) {
                logger.error(`Failed to delete auth user ${targetUid}`, error);
                return res.status(500).json({ error: 'Unable to delete auth user.' });
              }
            }
          }

          if (targetExistsInFirestore) {
            await targetRef.delete();
          }

          return res.status(200).json({ message: 'User deleted.' });
        }

        const authUserRecord = await getAuthUserRecordSafe(targetUid);
        if (!targetExistsInFirestore && !authUserRecord) {
          return res.status(404).json({ error: 'User not found.' });
        }

        const displayName = String(req.body?.displayName ?? currentData.displayName ?? currentData.name ?? authUserRecord?.displayName ?? '').trim();
        const email = String(req.body?.email ?? currentData.email ?? authUserRecord?.email ?? '').trim().toLowerCase();
        const phoneNumber = String(req.body?.phoneNumber ?? currentData.phoneNumber ?? '').trim();
        const company = String(req.body?.company ?? currentData.company ?? '').trim();
        const requestedRole = normalizeUserRole(String(req.body?.role ?? currentData.role ?? 'buyer'));

        if (!displayName || !email) {
          return res.status(400).json({ error: 'Display name and email are required.' });
        }

        if (!isSupportedUserRole(requestedRole)) {
          return res.status(400).json({ error: 'A valid role is required.' });
        }

        if (!canCreateManagedRole(actor.actorRole === 'buyer' && isPrivilegedAdminEmail(actor.actorEmail) ? 'super_admin' : actor.actorRole, requestedRole)) {
          return res.status(403).json({ error: 'You do not have permission to assign that role.' });
        }

        if (requestedRole === 'super_admin' && !isPrivilegedAdminEmail(actor.actorEmail) && actor.actorRole !== 'super_admin') {
          return res.status(403).json({ error: 'Only a super admin can assign the super admin role.' });
        }

        try {
          const existingUserByEmail = await getDb()
            .collection('users')
            .where('email', '==', email)
            .limit(2)
            .get();
          const emailConflict = existingUserByEmail.docs.find((doc) => doc.id !== targetUid);
          if (emailConflict) {
            return res.status(409).json({ error: 'Another user already has that email address.' });
          }
        } catch (error) {
          if (!isFirestoreQuotaExceeded(error)) {
            throw error;
          }
          firestoreQuotaLimited = true;
          logger.warn('Skipping Firestore email uniqueness validation because the daily read quota is exhausted.', {
            targetUid,
            email,
          });
        }

        const currentAuthEmail = String(authUserRecord?.email || '').trim().toLowerCase();
        const currentAuthDisplayName = String(authUserRecord?.displayName || '').trim();
        const authEmailChanged = !authUserRecord || currentAuthEmail !== email;
        const authDisplayNameChanged = !authUserRecord || currentAuthDisplayName !== displayName;
        const currentRole = normalizeUserRole(String(currentData.role || authUserRecord?.customClaims?.role || 'buyer'));
        const currentAccessSource = normalizeAccountAccessSource(
          currentData.accountAccessSource || authUserRecord?.customClaims?.accountAccessSource
        );
        const currentAccountStatus = normalizeAccountStatus(
          currentData.accountStatus || authUserRecord?.customClaims?.accountStatus || 'active'
        ) || 'active';
        const currentParentAccountUid = String(
          currentData.parentAccountUid || authUserRecord?.customClaims?.parentAccountUid || ''
        ).trim();
        const nextAccessSource = requestedRole === currentRole && currentAccessSource
          ? currentAccessSource
          : deriveManualAccountAccessSource(actor.actorRole, requestedRole, currentAccessSource);
        const previousCompactState = buildCompactAccountState(
          buildAccountStateFromSources(currentData, authUserRecord, {
            role: currentRole,
            accountStatus: currentAccountStatus,
            accountAccessSource: currentAccessSource || null,
          })
        );

        if (authEmailChanged) {
          try {
            const authUserByEmail = await admin.auth().getUserByEmail(email);
            if (authUserByEmail.uid !== targetUid) {
              return res.status(409).json({ error: 'Another authentication account already has that email address.' });
            }
          } catch (error) {
            if (!isAuthUserNotFound(error)) {
              logger.error('Failed to verify auth email uniqueness', error);
              return res.status(500).json({ error: 'Unable to validate email uniqueness.' });
            }
          }
        }

        if (authUserRecord && (authEmailChanged || authDisplayNameChanged)) {
          try {
            await admin.auth().updateUser(targetUid, {
              displayName,
              email,
            });
          } catch (error) {
            if (!isAuthUserNotFound(error)) {
              logger.error(`Failed to update auth user ${targetUid}`, error);
              return res.status(500).json({ error: 'Unable to update auth profile.' });
            }
          }
        }

        try {
          const existingClaims = authUserRecord?.customClaims || {};
          const nextClaims = buildAccessClaims(existingClaims, {
            role: requestedRole,
            accountStatus: currentAccountStatus,
            accountAccessSource: nextAccessSource,
            parentAccountUid: currentParentAccountUid,
            subscriptionPlanId: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? existingClaims.subscriptionPlanId
              : null,
            subscriptionStatus: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? existingClaims.subscriptionStatus
              : null,
            listingCap: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? existingClaims.listingCap
              : null,
            managedAccountCap: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? existingClaims.managedAccountCap
              : null,
          });
          if (JSON.stringify(existingClaims) !== JSON.stringify(nextClaims)) {
            await admin.auth().setCustomUserClaims(targetUid, nextClaims);
          }
          const nextCompactState = buildCompactAccountState(
            buildAccountStateFromSources(currentData, authUserRecord, {
              role: nextClaims.role || requestedRole,
              accountStatus: nextClaims.accountStatus || currentAccountStatus,
              accountAccessSource: nextClaims.accountAccessSource || nextAccessSource,
              activeSubscriptionPlanId: nextClaims.subscriptionPlanId || null,
              subscriptionStatus: nextClaims.subscriptionStatus || null,
              listingCap: nextClaims.listingCap || 0,
              managedAccountCap: nextClaims.managedAccountCap || 0,
            })
          );
          if (JSON.stringify(previousCompactState) !== JSON.stringify(nextCompactState)) {
            await writeAccountAuditLog({
              eventType: requestedRole !== currentRole ? 'ADMIN_ROLE_CHANGED' : 'ADMIN_USER_UPDATED',
              actorUid: actor.actorUid || null,
              targetUid,
              source: 'admin_users_patch',
              reason: requestedRole !== currentRole
                ? `Admin changed role from ${currentRole} to ${requestedRole}`
                : 'Admin updated account profile details',
              previousState: previousCompactState,
              nextState: nextCompactState,
              metadata: {
                actorRole: actor.actorRole,
                firestoreQuotaLimited,
                emailChanged: authEmailChanged,
                displayNameChanged: authDisplayNameChanged,
              },
            });
          }
        } catch (error) {
          logger.error(`Failed to update auth role claims for ${targetUid}`, error);
          return res.status(500).json({ error: 'Unable to update authentication role claims.' });
        }

        let warning = '';
        if (!firestoreQuotaLimited) {
          await targetRef.set(
            {
              uid: targetUid,
              displayName,
              email,
              phoneNumber,
              company,
              role: requestedRole,
              accountAccessSource: nextAccessSource || null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          warning = 'Authentication role and sign-in fields were updated. Firestore profile details will sync after the Firestore quota window resets.';
        }

        const responseAuthRecord = buildSerializableAuthRecord(authUserRecord, {
          uid: targetUid,
          email,
          displayName,
          customClaims: buildAccessClaims(authUserRecord?.customClaims || {}, {
            role: requestedRole,
            accountStatus: currentAccountStatus,
            accountAccessSource: nextAccessSource,
            parentAccountUid: currentParentAccountUid,
            subscriptionPlanId: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? authUserRecord?.customClaims?.subscriptionPlanId
              : null,
            subscriptionStatus: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? authUserRecord?.customClaims?.subscriptionStatus
              : null,
            listingCap: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? authUserRecord?.customClaims?.listingCap
              : null,
            managedAccountCap: requestedRole === currentRole && currentAccessSource === 'subscription'
              ? authUserRecord?.customClaims?.managedAccountCap
              : null,
          }),
        });
        return res.status(200).json({
          message: 'User updated.',
          warning,
          user: serializeAdminUserData(
            targetUid,
            {
              ...currentData,
              uid: targetUid,
              displayName,
              email,
              phoneNumber,
              company,
              role: requestedRole,
              accountAccessSource: nextAccessSource || null,
              updatedAt: new Date().toISOString(),
            },
            responseAuthRecord
          ),
        });
      }

      /* ── Widget Config CRUD (admin) ────────────────────────── */
      const widgetConfigAdminMatch = path.match(/^\/admin\/dealer-feeds\/([^/]+)\/widget-config$/i);
      if (widgetConfigAdminMatch) {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }
        const targetDealerId = decodeURIComponent(widgetConfigAdminMatch[1] || '');
        if (!canAccessDealerFeedSellerUid(actor, targetDealerId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        if (req.method === 'GET') {
          const doc = await getDb().collection('dealerWidgetConfigs').doc(targetDealerId).get();
          return res.status(200).json({ config: doc.exists ? doc.data() : {} });
        }

        if (req.method === 'PATCH' || req.method === 'PUT') {
          const body = req.body || {};
          const update = {};
          if (body.cardStyle !== undefined) update.cardStyle = String(body.cardStyle || 'fes-native');
          if (body.accentColor !== undefined) update.accentColor = String(body.accentColor || '#16A34A');
          if (body.fontFamily !== undefined) update.fontFamily = String(body.fontFamily || '');
          if (body.darkMode !== undefined) update.darkMode = Boolean(body.darkMode);
          if (body.showInquiry !== undefined) update.showInquiry = Boolean(body.showInquiry);
          if (body.showCall !== undefined) update.showCall = Boolean(body.showCall);
          if (body.showDetails !== undefined) update.showDetails = Boolean(body.showDetails);
          if (body.pageSize !== undefined) update.pageSize = Math.max(3, Math.min(60, Number(body.pageSize) || 12));
          if (body.customCss !== undefined) update.customCss = String(body.customCss || '').slice(0, 5000);
          update.updatedAt = admin.firestore.FieldValue.serverTimestamp();

          await getDb().collection('dealerWidgetConfigs').doc(targetDealerId).set(update, { merge: true });
          const fresh = await getDb().collection('dealerWidgetConfigs').doc(targetDealerId).get();
          return res.status(200).json({ config: fresh.data() || update });
        }
      }

      /* ── Webhook Subscription CRUD (admin) ───────────────────── */
      if (req.method === 'GET' && path === '/admin/dealer-feeds/webhooks') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) return res.status(actor.status).json({ error: actor.error });
        const targetUid = normalizeNonEmptyString(req.query?.sellerUid, actor.ownerUid);
        if (!canAccessDealerFeedSellerUid(actor, targetUid)) return res.status(403).json({ error: 'Forbidden' });
        const snap = await getDb().collection('dealerWebhookSubscriptions').where('dealerUid', '==', targetUid).get();
        const subs = [];
        snap.forEach((doc) => {
          const d = doc.data() || {};
          subs.push({ id: doc.id, ...d, secret: undefined, secretMasked: d.secret ? d.secret.slice(0, 6) + '...' : '' });
        });
        return res.status(200).json({ webhooks: subs });
      }

      if (req.method === 'POST' && path === '/admin/dealer-feeds/webhooks') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) return res.status(actor.status).json({ error: actor.error });
        const body = req.body || {};
        const targetUid = normalizeNonEmptyString(body.sellerUid, actor.ownerUid);
        if (!canAccessDealerFeedSellerUid(actor, targetUid)) return res.status(403).json({ error: 'Forbidden' });
        const callbackUrl = String(body.callbackUrl || '').trim();
        if (!callbackUrl || !/^https?:\/\//i.test(callbackUrl)) return res.status(400).json({ error: 'A valid HTTPS callback URL is required.' });
        const events = Array.isArray(body.events) ? body.events.filter((e) => ['listing.created', 'listing.updated', 'listing.sold', 'listing.deleted'].includes(e)) : ['listing.created', 'listing.updated', 'listing.sold', 'listing.deleted'];
        const secret = randomBytes(32).toString('hex');
        const docRef = await getDb().collection('dealerWebhookSubscriptions').add({
          dealerUid: targetUid,
          callbackUrl,
          secret,
          events,
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastDeliveryAt: null,
          failureCount: 0,
        });
        return res.status(201).json({ id: docRef.id, secret, callbackUrl, events, active: true });
      }

      const webhookIdMatch = path.match(/^\/admin\/dealer-feeds\/webhooks\/([^/]+)$/i);
      if (req.method === 'DELETE' && webhookIdMatch) {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) return res.status(actor.status).json({ error: actor.error });
        const docId = decodeURIComponent(webhookIdMatch[1] || '');
        const doc = await getDb().collection('dealerWebhookSubscriptions').doc(docId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Webhook subscription not found.' });
        const data = doc.data() || {};
        if (!canAccessDealerFeedSellerUid(actor, data.dealerUid)) return res.status(403).json({ error: 'Forbidden' });
        await getDb().collection('dealerWebhookSubscriptions').doc(docId).delete();
        return res.status(200).json({ ok: true });
      }

      const webhookTestMatch = path.match(/^\/admin\/dealer-feeds\/webhooks\/([^/]+)\/test$/i);
      if (req.method === 'POST' && webhookTestMatch) {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) return res.status(actor.status).json({ error: actor.error });
        const docId = decodeURIComponent(webhookTestMatch[1] || '');
        const doc = await getDb().collection('dealerWebhookSubscriptions').doc(docId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Webhook subscription not found.' });
        const data = doc.data() || {};
        if (!canAccessDealerFeedSellerUid(actor, data.dealerUid)) return res.status(403).json({ error: 'Forbidden' });
        const testPayload = JSON.stringify({ event: 'test', listingId: 'test-123', listing: { title: 'Test Listing', price: 50000 }, timestamp: new Date().toISOString() });
        const signature = createHmac('sha256', data.secret || '').update(testPayload).digest('hex');
        try {
          const webhookResp = await fetch(data.callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-FES-Signature': `sha256=${signature}`, 'X-FES-Event': 'test' },
            body: testPayload,
            signal: AbortSignal.timeout(10000),
          });
          return res.status(200).json({ ok: true, statusCode: webhookResp.status });
        } catch (testError) {
          return res.status(200).json({ ok: false, error: testError.message || 'Delivery failed' });
        }
      }

      /* ── Webhook Secret Reveal ───────────────────────────────── */
      const webhookSecretMatch = path.match(/^\/admin\/dealer-feeds\/webhooks\/([^/]+)\/secret$/i);
      if (req.method === 'GET' && webhookSecretMatch) {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) return res.status(actor.status).json({ error: actor.error });
        const docId = decodeURIComponent(webhookSecretMatch[1] || '');
        const doc = await getDb().collection('dealerWebhookSubscriptions').doc(docId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Webhook subscription not found.' });
        const data = doc.data() || {};
        if (!canAccessDealerFeedSellerUid(actor, data.dealerUid)) return res.status(403).json({ error: 'Forbidden' });
        return res.status(200).json({ secret: data.secret || '' });
      }

      if (req.method === 'GET' && path === '/admin/dealer-feeds/bootstrap') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const requestedSellerUid = normalizeNonEmptyString(req.query?.sellerUid, actor.ownerUid);
        if (!canAccessDealerFeedSellerUid(actor, requestedSellerUid)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const payload = await buildDealerFeedBootstrapPayload({
          sellerUid: requestedSellerUid,
          limitCount: Number(req.query?.limit || 20),
        });
        return res.status(200).json(payload);
      }

      if (req.method === 'GET' && path === '/admin/dealer-feeds/logs') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const requestedSellerUid = normalizeNonEmptyString(req.query?.sellerUid, actor.ownerUid);
        if (!canAccessDealerFeedSellerUid(actor, requestedSellerUid)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const logs = await listDealerFeedIngestLogs({
          sellerUid: requestedSellerUid,
          limitCount: Number(req.query?.limit || 20),
        });
        return res.status(200).json({ logs });
      }

      if (req.method === 'GET' && path === '/admin/dealer-feeds') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const requestedSellerUid = normalizeNonEmptyString(req.query?.sellerUid, actor.ownerUid);
        if (!canAccessDealerFeedSellerUid(actor, requestedSellerUid)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const feeds = await listDealerFeedsForSeller(requestedSellerUid);
        return res.status(200).json({ feeds });
      }

      if (req.method === 'POST' && path === '/admin/dealer-feeds/register') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const sellerUid = normalizeNonEmptyString(req.body?.sellerUid || req.body?.dealerId, actor.ownerUid);
        if (!sellerUid) {
          return res.status(400).json({ error: 'dealerId could not be resolved.' });
        }
        if (!canAccessDealerFeedSellerUid(actor, sellerUid)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const writePayload = buildDealerFeedWritePayload({
          ...req.body,
          sellerUid,
          dealerEmail: req.body?.dealerEmail || actor.actorEmail,
        });
        const apiKey = generateDealerFeedApiKey();
        const webhookSecret = generateDealerWebhookSecret();
        const feedRef = getDb().collection('dealerFeeds').doc();

        await feedRef.set({
          ...writePayload,
          apiKey,
          apiKeyPreview: maskSecret(apiKey),
          webhookSecret,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSyncAt: null,
          lastSyncStatus: '',
          lastSyncMessage: '',
          lastResolvedType: writePayload.sourceType,
          nextSyncAt: writePayload.status === 'active' && writePayload.nightlySyncEnabled
            ? computeNextDealerFeedSyncAt(writePayload.syncFrequency)
            : null,
          totalListingsActive: 0,
          totalListingsDeleted: 0,
          totalListingsSynced: 0,
          totalListingsCreated: 0,
          totalListingsUpdated: 0,
        });

        const createdSnap = await feedRef.get();
        return res.status(201).json({
          message: 'Dealer feed registered.',
          feed: serializeDealerFeed(createdSnap.id, createdSnap.data() || {}, { includeSecrets: true }),
        });
      }

      if (req.method === 'POST' && path === '/dealer/register') {
        const actor = await getAdminActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const sellerUid = normalizeNonEmptyString(req.body?.sellerUid || req.body?.dealerId);
        if (!sellerUid) {
          return res.status(400).json({ error: 'dealerId is required.' });
        }

        const writePayload = buildDealerFeedWritePayload({
          ...req.body,
          sellerUid,
          dealerEmail: req.body?.dealerEmail || actor.actorEmail,
        });
        const apiKey = generateDealerFeedApiKey();
        const webhookSecret = generateDealerWebhookSecret();
        const feedRef = getDb().collection('dealerFeeds').doc();

        await feedRef.set({
          ...writePayload,
          apiKey,
          apiKeyPreview: maskSecret(apiKey),
          webhookSecret,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSyncAt: null,
          lastSyncStatus: '',
          lastSyncMessage: '',
          lastResolvedType: writePayload.sourceType,
          nextSyncAt: writePayload.status === 'active' && writePayload.nightlySyncEnabled
            ? computeNextDealerFeedSyncAt(writePayload.syncFrequency)
            : null,
          totalListingsActive: 0,
          totalListingsDeleted: 0,
          totalListingsSynced: 0,
          totalListingsCreated: 0,
          totalListingsUpdated: 0,
        });

        const createdSnap = await feedRef.get();
        return res.status(201).json({
          message: 'Dealer feed registered.',
          feed: serializeDealerFeed(createdSnap.id, createdSnap.data() || {}, { includeSecrets: true }),
        });
      }

      const adminDealerFeedAuditMatch = path.match(/^\/admin\/dealer-feeds\/([^/]+)\/audit$/i);
      if (req.method === 'GET' && adminDealerFeedAuditMatch) {
        const feedContext = await getAuthorizedDealerFeedContext(req, decodeURIComponent(adminDealerFeedAuditMatch[1] || ''));
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        const audit = await listDealerFeedAuditEntries(feedContext.feed.id, Number(req.query?.limit || 20));
        return res.status(200).json({
          feed: serializeDealerFeed(feedContext.feed.id, feedContext.feed),
          audit,
        });
      }

      const adminDealerFeedSyncMatch = path.match(/^\/admin\/dealer-feeds\/([^/]+)\/sync$/i);
      if (req.method === 'POST' && adminDealerFeedSyncMatch) {
        const feedContext = await getAuthorizedDealerFeedContext(req, decodeURIComponent(adminDealerFeedSyncMatch[1] || ''));
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        try {
          const resolved = await resolveDealerFeedSource({
            sourceName: req.body?.sourceName || feedContext.feed.sourceName,
            sourceType: req.body?.sourceType || feedContext.feed.sourceType,
            rawInput: Object.prototype.hasOwnProperty.call(req.body || {}, 'rawInput') ? req.body.rawInput : feedContext.feed.rawInput,
            feedUrl: Object.prototype.hasOwnProperty.call(req.body || {}, 'feedUrl') ? req.body.feedUrl : (feedContext.feed.feedUrl || feedContext.feed.apiEndpoint),
            fieldMapping: req.body?.fieldMapping || feedContext.feed.fieldMapping,
          });

          const result = await ingestDealerFeedItems({
            actorUid: feedContext.actorUid,
            actorRole: feedContext.actorRole,
            sellerUid: normalizeNonEmptyString(feedContext.feed.sellerUid),
            sourceName: normalizeNonEmptyString(feedContext.feed.sourceName, 'dealer_feed'),
            feedId: feedContext.feed.id,
            feed: feedContext.feed,
            dryRun: Boolean(req.body?.dryRun),
            items: resolved.items,
            fullSync: req.body?.fullSync !== false,
            persistLog: true,
            syncContext: {
              trigger: 'manual-sync',
              requestedBy: feedContext.actorUid,
            },
          });

          const refreshedFeedSnap = await feedContext.feedRef.get();
          return res.status(200).json({
            feed: serializeDealerFeed(refreshedFeedSnap.id, refreshedFeedSnap.data() || {}),
            detectedType: resolved.detectedType,
            result,
          });
        } catch (error) {
          return res.status(400).json({
            error: error instanceof Error ? error.message : 'Unable to sync this dealer feed.',
          });
        }
      }

      const adminDealerFeedDetailMatch = path.match(/^\/admin\/dealer-feeds\/([^/]+)$/i);
      const adminDealerFeedDetailId = adminDealerFeedDetailMatch ? decodeURIComponent(adminDealerFeedDetailMatch[1] || '') : '';
      if (adminDealerFeedDetailMatch && !['ingest', 'resolve', 'register', 'logs'].includes(adminDealerFeedDetailId.toLowerCase())) {
        const feedContext = await getAuthorizedDealerFeedContext(req, adminDealerFeedDetailId);
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        if (req.method === 'GET') {
          const stats = await getDealerFeedStats(feedContext.feed.id);
          const includeSecrets = ['1', 'true', 'yes'].includes(String(req.query?.includeSecrets || '').trim().toLowerCase())
            && (feedContext.actorCanAdminister || feedContext.actorIsDealer);
          return res.status(200).json({
            feed: {
              ...serializeDealerFeed(feedContext.feed.id, feedContext.feed, {
                includeSecrets,
              }),
              ...stats,
            },
          });
        }

        if (req.method === 'PATCH') {
          const nextSellerUid = normalizeNonEmptyString(req.body?.sellerUid || req.body?.dealerId, feedContext.feed.sellerUid);
          if (!canAccessDealerFeedSellerUid(feedContext, nextSellerUid)) {
            return res.status(403).json({ error: 'Forbidden' });
          }

          const writePayload = buildDealerFeedWritePayload(
            {
              ...req.body,
              sellerUid: nextSellerUid,
            },
            feedContext.feed
          );
          const rotateCredentials = Boolean(req.body?.rotateCredentials);
          const nextApiKey = rotateCredentials ? generateDealerFeedApiKey() : normalizeNonEmptyString(feedContext.feed.apiKey);
          const nextWebhookSecret = rotateCredentials ? generateDealerWebhookSecret() : normalizeNonEmptyString(feedContext.feed.webhookSecret);

          await feedContext.feedRef.set(
            {
              ...writePayload,
              apiKey: nextApiKey,
              apiKeyPreview: maskSecret(nextApiKey),
              webhookSecret: nextWebhookSecret,
              nextSyncAt: writePayload.status === 'active' && writePayload.nightlySyncEnabled
                ? computeNextDealerFeedSyncAt(writePayload.syncFrequency)
                : null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          const refreshedFeedSnap = await feedContext.feedRef.get();
          return res.status(200).json({
            message: 'Dealer feed updated.',
            feed: serializeDealerFeed(refreshedFeedSnap.id, refreshedFeedSnap.data() || {}, { includeSecrets: rotateCredentials }),
          });
        }

        if (req.method === 'DELETE') {
          await feedContext.feedRef.delete();
          await getDb().collection('dealerFeedProfiles').doc(feedContext.feed.id).delete().catch(() => null);
          return res.status(200).json({ ok: true });
        }
      }

      if (req.method === 'POST' && path === '/admin/dealer-feeds/ingest') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        const feedId = normalizeNonEmptyString(req.body?.feedId);
        let feed = null;
        let sellerUid = normalizeNonEmptyString(req.body?.dealerId || req.body?.sellerUid, actor.ownerUid);

        if (feedId) {
          const feedContext = await getAuthorizedDealerFeedContext(req, feedId);
          if (feedContext.error) {
            return res.status(feedContext.status).json({ error: feedContext.error });
          }
          feed = feedContext.feed;
          sellerUid = normalizeNonEmptyString(feed.sellerUid, sellerUid);
        } else if (!canAccessDealerFeedSellerUid(actor, sellerUid)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const items = Array.isArray(req.body?.items) ? req.body.items : [];
        if (items.length === 0) {
          return res.status(400).json({ error: 'items[] is required.' });
        }
        if (items.length > 1000) {
          return res.status(400).json({ error: 'Maximum 1000 items per ingest request.' });
        }

        const result = await ingestDealerFeedItems({
          actorUid: actor.actorUid,
          actorRole: actor.actorRole,
          sellerUid,
          sourceName: normalizeNonEmptyString(req.body?.sourceName || feed?.sourceName, 'dealer_feed'),
          feedId,
          feed,
          dryRun: Boolean(req.body?.dryRun),
          items,
          fullSync: req.body?.fullSync !== false && Boolean(feedId),
          persistLog: true,
          syncContext: {
            trigger: 'manual-ingest',
            requestedBy: actor.actorUid,
          },
        });

        return res.status(200).json(result);
      }

      if (req.method === 'POST' && path === '/admin/dealer-feeds/resolve') {
        const actor = await getDealerFeedActorContext(req);
        if (actor.error) {
          return res.status(actor.status).json({ error: actor.error });
        }

        let feed = null;
        const feedId = normalizeNonEmptyString(req.body?.feedId);
        if (feedId) {
          const feedContext = await getAuthorizedDealerFeedContext(req, feedId);
          if (feedContext.error) {
            return res.status(feedContext.status).json({ error: feedContext.error });
          }
          feed = feedContext.feed;
        }

        try {
          const payload = await resolveDealerFeedSource({
            sourceName: req.body?.sourceName || feed?.sourceName,
            sourceType: req.body?.sourceType || feed?.sourceType,
            rawInput: Object.prototype.hasOwnProperty.call(req.body || {}, 'rawInput') ? req.body.rawInput : feed?.rawInput,
            feedUrl: Object.prototype.hasOwnProperty.call(req.body || {}, 'feedUrl') ? req.body.feedUrl : (feed?.feedUrl || feed?.apiEndpoint),
            fieldMapping: req.body?.fieldMapping || feed?.fieldMapping,
          });

          return res.status(200).json(payload);
        } catch (error) {
          return res.status(400).json({
            error: error instanceof Error ? error.message : 'Unable to resolve the dealer feed payload.',
          });
        }
      }

      if (req.method === 'POST' && path === '/dealer/ingest') {
        const feedContext = await getDealerFeedContextFromApiKey(req);
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        const rawBodyText = getRawRequestBodyText(req);
        const providedItems = Array.isArray(req.body?.items) ? req.body.items : [];
        const resolvedItems = providedItems.length > 0
          ? providedItems
          : parseDealerFeedPayload(
            normalizeNonEmptyString(req.body?.rawInput, rawBodyText),
            normalizeNonEmptyString(req.body?.sourceType, feedContext.feed.sourceType || 'auto'),
            feedContext.feed.fieldMapping
          ).items;

        const result = await ingestDealerFeedItems({
          actorUid: 'dealer-api',
          actorRole: 'dealer_api',
          sellerUid: normalizeNonEmptyString(feedContext.feed.sellerUid),
          sourceName: normalizeNonEmptyString(feedContext.feed.sourceName, 'dealer_feed'),
          feedId: feedContext.feed.id,
          feed: feedContext.feed,
          dryRun: Boolean(req.body?.dryRun),
          items: resolvedItems,
          fullSync: req.body?.fullSync !== false,
          persistLog: true,
          syncContext: {
            trigger: 'dealer-api',
          },
        });

        return res.status(200).json(result);
      }

      const dealerWebhookMatch = path.match(/^\/dealer\/webhook\/([^/]+)$/i);
      if (req.method === 'POST' && dealerWebhookMatch) {
        const feedId = decodeURIComponent(dealerWebhookMatch[1] || '');
        const feedSnap = await getDb().collection('dealerFeeds').doc(feedId).get();
        if (!feedSnap.exists) {
          return res.status(404).json({ error: 'Dealer feed not found.' });
        }

        const feed = { id: feedSnap.id, ...feedSnap.data() };
        const webhookCheck = verifyDealerWebhookRequest(feed, req);
        if (!webhookCheck.ok) {
          return res.status(webhookCheck.status).json({ error: webhookCheck.error });
        }

        try {
          const resolved = parseDealerFeedPayload(
            normalizeNonEmptyString(req.body?.rawInput, getRawRequestBodyText(req)),
            normalizeNonEmptyString(feed.sourceType, 'auto'),
            feed.fieldMapping
          );
          const result = await ingestDealerFeedItems({
            actorUid: 'dealer-webhook',
            actorRole: 'dealer_api',
            sellerUid: normalizeNonEmptyString(feed.sellerUid),
            sourceName: normalizeNonEmptyString(feed.sourceName, 'dealer_feed'),
            feedId: feed.id,
            feed,
            dryRun: false,
            items: resolved.items,
            fullSync: req.body?.fullSync !== false,
            persistLog: true,
            syncContext: {
              trigger: 'webhook',
              detectedType: resolved.detectedType,
            },
          });

          return res.status(200).json(result);
        } catch (error) {
          return res.status(400).json({
            error: error instanceof Error ? error.message : 'Unable to process dealer webhook payload.',
          });
        }
      }

      const dealerFeedStatusMatch = path.match(/^\/dealer\/feed\/([^/]+)$/i);
      if (req.method === 'GET' && dealerFeedStatusMatch) {
        const feedContext = await getAuthorizedDealerFeedContext(req, decodeURIComponent(dealerFeedStatusMatch[1] || ''));
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        const stats = await getDealerFeedStats(feedContext.feed.id);
        const includeSecrets = ['1', 'true', 'yes'].includes(String(req.query?.includeSecrets || '').trim().toLowerCase())
          && (feedContext.actorCanAdminister || feedContext.actorIsDealer);
        return res.status(200).json({
          feed: {
            ...serializeDealerFeed(feedContext.feed.id, feedContext.feed, {
              includeSecrets,
            }),
            ...stats,
          },
        });
      }

      const dealerSyncMatch = path.match(/^\/dealer\/sync\/([^/]+)$/i);
      if (req.method === 'POST' && dealerSyncMatch) {
        const feedContext = await getAuthorizedDealerFeedContext(req, decodeURIComponent(dealerSyncMatch[1] || ''));
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        try {
          const resolved = await resolveDealerFeedSource({
            sourceName: feedContext.feed.sourceName,
            sourceType: feedContext.feed.sourceType,
            rawInput: feedContext.feed.rawInput,
            feedUrl: feedContext.feed.feedUrl || feedContext.feed.apiEndpoint,
            fieldMapping: feedContext.feed.fieldMapping,
          });
          const result = await ingestDealerFeedItems({
            actorUid: feedContext.actorUid,
            actorRole: feedContext.actorRole,
            sellerUid: normalizeNonEmptyString(feedContext.feed.sellerUid),
            sourceName: normalizeNonEmptyString(feedContext.feed.sourceName, 'dealer_feed'),
            feedId: feedContext.feed.id,
            feed: feedContext.feed,
            dryRun: Boolean(req.body?.dryRun),
            items: resolved.items,
            fullSync: req.body?.fullSync !== false,
            persistLog: true,
            syncContext: {
              trigger: 'dealer-sync-endpoint',
              requestedBy: feedContext.actorUid,
            },
          });

          return res.status(200).json({
            detectedType: resolved.detectedType,
            result,
          });
        } catch (error) {
          return res.status(400).json({
            error: error instanceof Error ? error.message : 'Unable to sync this dealer feed.',
          });
        }
      }

      const dealerAuditMatch = path.match(/^\/dealer\/audit\/([^/]+)$/i);
      if (req.method === 'GET' && dealerAuditMatch) {
        const feedContext = await getAuthorizedDealerFeedContext(req, decodeURIComponent(dealerAuditMatch[1] || ''));
        if (feedContext.error) {
          return res.status(feedContext.status).json({ error: feedContext.error });
        }

        const audit = await listDealerFeedAuditEntries(feedContext.feed.id, Number(req.query?.limit || 20));
        return res.status(200).json({
          audit,
        });
      }

      if (req.method === 'POST' && path === '/translate') {
        const apiKey = GOOGLE_TRANSLATE_API_KEY.value();
        if (!apiKey) {
          return res.status(503).json({ error: 'Translation API key not configured' });
        }

        const q = req.body?.q;
        const target = req.body?.target || 'en';
        const source = req.body?.source || 'en';

        const texts = Array.isArray(q) ? q : [q];
        const cleaned = texts.map((text) => String(text || '').trim()).filter(Boolean).slice(0, 40);

        if (cleaned.length === 0) {
          return res.status(400).json({ error: 'No text to translate' });
        }

        const outboundReferrer = APP_URL;

        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: outboundReferrer,
            Referer: outboundReferrer,
          },
          body: JSON.stringify({
            q: cleaned,
            target,
            source,
            format: 'text',
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          logger.error('Google translate API error', detail);
          return res.status(502).json({ error: 'Translation provider failed' });
        }

        const json = await response.json();
        const translated = (json?.data?.translations || []).map((item) => item?.translatedText || '');
        return res.status(200).json({ translations: translated });
      }

      if (req.method === 'GET' && path === '/currency-rates') {
        const base = String(req.query?.base || 'USD').toUpperCase();
        if (!/^[A-Z]{3}$/.test(base)) {
          return res.status(400).json({ error: 'Invalid base currency code' });
        }

        const payload = await getCurrencyRatesPayload(base);
        res.set('Cache-Control', 'public, max-age=1800');
        return res.status(200).json(payload);
      }

      if (req.method === 'POST' && path === '/recaptcha-assess') {
        const { token, action } = req.body || {};
        if (!token || !action) {
          return res.status(400).json({ error: 'token and action required' });
        }
        try {
          const result = await assessRecaptchaToken(token, action);
          const pass = result.valid && result.score >= 0.5;
          return res.status(200).json({ pass, score: result.score });
        } catch (err) {
          logger.error('reCAPTCHA assessment error', err);
          return res.status(200).json({ pass: true, score: null });
        }
      }

      if (path.startsWith('/billing/')) {
        logger.warn('Unhandled billing route reached apiProxy fallback.', {
          method: req.method,
          path,
        });
      }
      return res.status(404).json({ error: 'Not found' });
    } catch (error) {
      logger.error('apiProxy failed', error);
      captureFunctionsException(error, {
        path,
        method: req.method,
        handler: 'apiProxy',
      });
      if (isFirestoreQuotaExceeded(error)) {
        return res.status(503).json({
          error: getQuotaExceededApiMessage(path),
        });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── Nightly Data Refresh (2AM CST) ─────────────────────────────────────────
exports.nightlyDataRefresh = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'America/Chicago',
    region: 'us-central1',
    memory: '256MiB',
  },
  async () => {
    const db = getDb();
    const listingsSnap = await db.collection('listings')
      .where('status', '==', 'active')
      .where('approvalStatus', '==', 'approved')
      .get();

    const listings = listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    let totalMarketValue = 0;
    const subcategoryAggregates = {};

    for (const listing of listings) {
      const price = parseFloat(listing.price) || 0;
      const subcategory = normalizeMarketplaceText(listing.subcategory || listing.category || 'other');
      const make = normalizeMarketplaceText(listing.make || listing.manufacturer || '');
      const model = normalizeMarketplaceText(listing.model || '');
      const year = parseInt(listing.year, 10) || 0;
      const hours = parseFloat(listing.hours || (listing.specs && listing.specs.hours) || 0) || 0;

      totalMarketValue += price;

      if (!subcategoryAggregates[subcategory]) {
        subcategoryAggregates[subcategory] = { totalPrice: 0, count: 0 };
      }
      subcategoryAggregates[subcategory].totalPrice += price;
      subcategoryAggregates[subcategory].count += 1;

      // Compute AMV: same make+model, +/-10% price, +/-10% hours, +/-2 years
      const comparables = listings.filter((comp) => {
        if (comp.id === listing.id) return false;
        if (normalizeMarketplaceText(comp.make || comp.manufacturer || '') !== make) return false;
        if (normalizeMarketplaceText(comp.model || '') !== model) return false;
        const compPrice = parseFloat(comp.price) || 0;
        const compYear = parseInt(comp.year, 10) || 0;
        const compHours = parseFloat(comp.hours || (comp.specs && comp.specs.hours) || 0) || 0;
        if (price > 0 && Math.abs(compPrice - price) > price * 0.10) return false;
        if (Math.abs(compYear - year) > 2) return false;
        if (hours > 0 && compHours > 0 && Math.abs(compHours - hours) > hours * 0.10) return false;
        return true;
      });

      if (comparables.length >= 1) {
        const amvValue = comparables.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0) / comparables.length;
        const roundedAmv = Math.round(amvValue);
        await db.collection('listings').doc(listing.id).update({
          computedAmv: roundedAmv,
          marketValueEstimate: roundedAmv,
          amvComparableCount: comparables.length,
          amvComputedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    const statsRef = db.collection('system').doc('stats');
    const prevSnap = await statsRef.get();
    const prevData = prevSnap.exists ? prevSnap.data() : {};

    const subcategoryStats = {};
    for (const [key, agg] of Object.entries(subcategoryAggregates)) {
      subcategoryStats[key] = {
        avgPrice: agg.count > 0 ? Math.round(agg.totalPrice / agg.count) : 0,
        supplyCount: agg.count,
      };
    }

    await statsRef.set({
      totalActiveListings: listings.length,
      totalMarketValue: Math.round(totalMarketValue),
      previousDayTotalMarketValue: prevData.totalMarketValue || 0,
      previousDayTotalActiveListings: prevData.totalActiveListings || 0,
      subcategoryStats,
      dataRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`Nightly refresh: ${listings.length} listings, $${Math.round(totalMarketValue)} total value.`);
  }
);

// ── Weekly Market Pulse (Monday 3AM CST) ────────────────────────────────────
exports.weeklyMarketPulse = onSchedule(
  {
    schedule: '0 3 * * 1',
    timeZone: 'America/Chicago',
    region: 'us-central1',
    memory: '256MiB',
  },
  async () => {
    const db = getDb();
    const listingsSnap = await db.collection('listings')
      .where('status', '==', 'active')
      .where('approvalStatus', '==', 'approved')
      .get();

    const listings = listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const pulseRef = db.collection('system').doc('marketPulse');
    const prevPulse = await pulseRef.get();
    const prevSubcategoryPulse = prevPulse.exists ? (prevPulse.data().subcategoryPulse || {}) : {};

    const subcategoryPulse = {};
    for (const listing of listings) {
      const price = parseFloat(listing.price) || 0;
      const key = normalizeMarketplaceText(listing.subcategory || listing.category || 'other');
      if (!subcategoryPulse[key]) subcategoryPulse[key] = { totalPrice: 0, count: 0 };
      subcategoryPulse[key].totalPrice += price;
      subcategoryPulse[key].count += 1;
    }

    const pulseData = {};
    for (const [key, agg] of Object.entries(subcategoryPulse)) {
      const avgPrice = agg.count > 0 ? Math.round(agg.totalPrice / agg.count) : 0;
      const prevAvg = prevSubcategoryPulse[key]?.avgPrice || 0;
      const prevCount = prevSubcategoryPulse[key]?.supplyCount || 0;
      const priceChangePct = prevAvg > 0 ? parseFloat(((avgPrice - prevAvg) / prevAvg * 100).toFixed(1)) : 0;
      const supplyChangePct = prevCount > 0 ? parseFloat(((agg.count - prevCount) / prevCount * 100).toFixed(1)) : 0;

      pulseData[key] = { avgPrice, supplyCount: agg.count, priceChangePct, supplyChangePct };
    }

    await pulseRef.set({
      subcategoryPulse: pulseData,
      totalListings: listings.length,
      pulseGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`Weekly market pulse: ${Object.keys(pulseData).length} subcategories analyzed.`);
  }
);
