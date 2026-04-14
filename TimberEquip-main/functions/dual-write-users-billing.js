/**
 * Phase 2 dual-write triggers: Firestore → PostgreSQL
 *
 * These Cloud Function triggers listen for writes to the users, storefronts,
 * subscriptions, invoices, and sellerProgramApplications Firestore collections
 * and mirror each change to PostgreSQL via Firebase Data Connect.
 *
 * The Data Connect admin SDK is auto-generated after running:
 *   firebase dataconnect:sdk:generate
 *
 * Until the SDK is generated, the actual mutation calls are wrapped in a
 * guard that logs a warning and returns early. Once the SDK exists,
 * uncomment the import and remove the guard.
 */

const { logger } = require('firebase-functions/v2');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { captureFunctionsException } = require('./sentry.js');
const { mergeEmailPreferenceMetadata } = require('./email-preferences.js');

// The custom Firestore database used by the marketplace.
const FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

// ─── Data Connect Admin SDK imports ─────────────────────────────────────
const {
  upsertUser,
  upsertStorefront,
  deleteUser,
} = require('./generated/dataconnect/marketplace');

const {
  upsertSubscription,
  upsertInvoice,
  upsertSellerApplication,
} = require('./generated/dataconnect/billing');

const mutations = {
  upsertUser,
  upsertStorefront,
  deleteUser,
  upsertSubscription,
  upsertInvoice,
  upsertSellerApplication,
};

async function guardedMutation(name, variables) {
  const fn = mutations[name];
  if (!fn) {
    logger.error(`[dual-write] Unknown mutation: ${name}`);
    return;
  }
  try {
    await fn(variables);
  } catch (err) {
    logger.error(`[dual-write] ${name} failed`, { error: err.message, variables: Object.keys(variables) });
    captureFunctionsException(err, { mutation: name, module: 'dual-write-users-billing', variableKeys: Object.keys(variables) });
  }
}

// ─── Utility ───────────────────────────────────────────────────────────

function tsToIso(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return null;
}

function safeStr(val) {
  return typeof val === 'string' ? val.trim() || null : null;
}

// ─── User sync ─────────────────────────────────────────────────────────

exports.syncUserToPostgres = onDocumentWritten(
  { document: `users/{userId}`, database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { userId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write] User ${userId} deleted — archiving in PostgreSQL`);
      return guardedMutation('deleteUser', { id: userId });
    }

    const payload = {
      id: userId,
      email: after.email || `${userId}@unknown.local`,
      displayName: safeStr(after.displayName),
      phoneNumber: safeStr(after.phoneNumber),
      bio: safeStr(after.bio) || safeStr(after.about),
      role: after.role || 'member',
      emailVerified: Boolean(after.emailVerified),
      photoUrl: safeStr(after.photoURL) || safeStr(after.photoUrl),
      location: safeStr(after.location),
      latitude: after.latitude ?? null,
      longitude: after.longitude ?? null,
      company: safeStr(after.company),
      businessName: safeStr(after.businessName),
      street1: safeStr(after.street1),
      street2: safeStr(after.street2),
      city: safeStr(after.city),
      state: safeStr(after.state),
      county: safeStr(after.county),
      postalCode: safeStr(after.postalCode),
      country: safeStr(after.country),
      website: safeStr(after.website),
      accountStatus: after.accountStatus || 'active',
      parentAccountUid: safeStr(after.parentAccountUid),
      accountAccessSource: safeStr(after.accountAccessSource),
      mfaEnabled: Boolean(after.mfaEnabled),
      mfaMethod: safeStr(after.mfaMethod),
      mfaPhoneNumber: safeStr(after.mfaPhoneNumber),
      mfaEnrolledAt: tsToIso(after.mfaEnrolledAt),
      favorites: Array.isArray(after.favorites) ? after.favorites : [],
      storefrontEnabled: Boolean(after.storefrontEnabled),
      storefrontSlug: safeStr(after.storefrontSlug),
      storefrontName: safeStr(after.storefrontName),
      storefrontTagline: safeStr(after.storefrontTagline),
      storefrontDescription: safeStr(after.storefrontDescription),
      storefrontLogoUrl: safeStr(after.storefrontLogoUrl),
      coverPhotoUrl: safeStr(after.coverPhotoUrl),
      seoTitle: safeStr(after.seoTitle),
      seoDescription: safeStr(after.seoDescription),
      seoKeywords: Array.isArray(after.seoKeywords) ? after.seoKeywords : [],
      metadataJson: mergeEmailPreferenceMetadata(after.metadataJson, after),
    };

    logger.info(`[dual-write] Syncing user ${userId} to PostgreSQL`);
    return guardedMutation('upsertUser', payload);
  }
);

// ─── Storefront sync ───────────────────────────────────────────────────

exports.syncStorefrontToPostgres = onDocumentWritten(
  { document: `storefronts/{storefrontId}`, database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { storefrontId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write] Storefront ${storefrontId} deleted`);
      return; // Storefront deletes are rare; skip for now
    }

    const payload = {
      id: storefrontId,
      userId: after.uid || storefrontId,
      storefrontEnabled: Boolean(after.storefrontEnabled),
      storefrontSlug: safeStr(after.storefrontSlug),
      canonicalPath: safeStr(after.canonicalPath),
      storefrontName: safeStr(after.storefrontName) || safeStr(after.displayName),
      storefrontTagline: safeStr(after.storefrontTagline),
      storefrontDescription: safeStr(after.storefrontDescription),
      logoUrl: safeStr(after.logo) || safeStr(after.logoUrl),
      coverPhotoUrl: safeStr(after.coverPhotoUrl),
      businessName: safeStr(after.businessName),
      street1: safeStr(after.street1),
      street2: safeStr(after.street2),
      city: safeStr(after.city),
      state: safeStr(after.state),
      county: safeStr(after.county),
      postalCode: safeStr(after.postalCode),
      country: safeStr(after.country),
      location: safeStr(after.location),
      latitude: after.latitude ?? null,
      longitude: after.longitude ?? null,
      phone: safeStr(after.phone),
      email: safeStr(after.email),
      website: safeStr(after.website),
      serviceAreaScopes: Array.isArray(after.serviceAreaScopes) ? after.serviceAreaScopes : [],
      serviceAreaStates: Array.isArray(after.serviceAreaStates) ? after.serviceAreaStates : [],
      serviceAreaCounties: Array.isArray(after.serviceAreaCounties) ? after.serviceAreaCounties : [],
      servicesOfferedCategories: Array.isArray(after.servicesOfferedCategories) ? after.servicesOfferedCategories : [],
      servicesOfferedSubcategories: Array.isArray(after.servicesOfferedSubcategories) ? after.servicesOfferedSubcategories : [],
      seoTitle: safeStr(after.seoTitle),
      seoDescription: safeStr(after.seoDescription),
      seoKeywords: Array.isArray(after.seoKeywords) ? after.seoKeywords : [],
    };

    logger.info(`[dual-write] Syncing storefront ${storefrontId} to PostgreSQL`);
    return guardedMutation('upsertStorefront', payload);
  }
);

// ─── Subscription sync ─────────────────────────────────────────────────

exports.syncSubscriptionToPostgres = onDocumentWritten(
  { document: `subscriptions/{subscriptionId}`, database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { subscriptionId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write] Subscription ${subscriptionId} deleted`);
      return;
    }

    const payload = {
      id: subscriptionId,
      userId: after.userUid || '',
      listingId: safeStr(after.listingId),
      planId: after.planId || 'unknown',
      planName: safeStr(after.planName),
      listingCap: typeof after.listingCap === 'number' ? after.listingCap : null,
      status: after.status || 'pending',
      stripeSubscriptionId: safeStr(after.stripeSubscriptionId),
      currentPeriodEnd: tsToIso(after.currentPeriodEnd),
      cancelAtPeriodEnd: Boolean(after.cancelAtPeriodEnd),
    };

    logger.info(`[dual-write] Syncing subscription ${subscriptionId} to PostgreSQL`);
    return guardedMutation('upsertSubscription', payload);
  }
);

// ─── Invoice sync ──────────────────────────────────────────────────────

exports.syncInvoiceToPostgres = onDocumentWritten(
  { document: `invoices/{invoiceId}`, database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { invoiceId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write] Invoice ${invoiceId} deleted`);
      return;
    }

    const payload = {
      id: invoiceId,
      userId: after.userUid || '',
      listingId: safeStr(after.listingId),
      stripeInvoiceId: safeStr(after.stripeInvoiceId),
      stripeCheckoutSessionId: safeStr(after.stripeCheckoutSessionId),
      amount: typeof after.amount === 'number' ? after.amount : 0,
      currency: after.currency || 'usd',
      status: after.status || 'pending',
      items: Array.isArray(after.items) ? after.items : [],
      source: safeStr(after.source),
      paidAt: tsToIso(after.paidAt),
    };

    logger.info(`[dual-write] Syncing invoice ${invoiceId} to PostgreSQL`);
    return guardedMutation('upsertInvoice', payload);
  }
);

// ─── Seller Program Application sync ───────────────────────────────────

exports.syncSellerApplicationToPostgres = onDocumentWritten(
  { document: `sellerProgramApplications/{applicationId}`, database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { applicationId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write] Seller application ${applicationId} deleted`);
      return;
    }

    const payload = {
      id: applicationId,
      userId: after.userUid || '',
      planId: safeStr(after.planId),
      status: after.status || 'pending',
      stripeCustomerId: safeStr(after.stripeCustomerId),
      stripeSubscriptionId: safeStr(after.stripeSubscriptionId),
      legalFullName: safeStr(after.legalFullName),
      legalTitle: safeStr(after.legalTitle),
      companyName: safeStr(after.companyName),
      billingEmail: safeStr(after.billingEmail),
      phoneNumber: safeStr(after.phoneNumber),
      website: safeStr(after.website),
      country: safeStr(after.country),
      taxIdOrVat: safeStr(after.taxIdOrVat),
      notes: safeStr(after.notes),
      statementLabel: safeStr(after.statementLabel),
      legalScope: safeStr(after.legalScope),
      legalTermsVersion: safeStr(after.legalTermsVersion),
      legalAcceptedAtIso: safeStr(after.legalAcceptedAtIso),
      acceptedTerms: Boolean(after.acceptedTerms),
      acceptedPrivacy: Boolean(after.acceptedPrivacy),
      acceptedRecurringBilling: Boolean(after.acceptedRecurringBilling),
      acceptedVisibilityPolicy: Boolean(after.acceptedVisibilityPolicy),
      acceptedAuthority: Boolean(after.acceptedAuthority),
      source: safeStr(after.source),
    };

    logger.info(`[dual-write] Syncing seller application ${applicationId} to PostgreSQL`);
    return guardedMutation('upsertSellerApplication', payload);
  }
);
