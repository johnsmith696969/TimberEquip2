/**
 * Phase 5 dual-write triggers: Firestore → PostgreSQL (Dealer System)
 *
 * These Cloud Function triggers listen for writes to dealer-related
 * Firestore collections and mirror each change to PostgreSQL via
 * Firebase Data Connect.
 *
 * Collections:
 *   dealerFeedProfiles/{id}         → dealer_feed_profiles table
 *   dealerListings/{id}             → dealer_listings table
 *   dealerFeedIngestLogs/{id}       → dealer_feed_ingest_logs table
 *   dealerAuditLogs/{id}            → dealer_audit_logs table
 *   dealerWebhookSubscriptions/{id} → dealer_webhook_subscriptions table
 *   dealerWidgetConfigs/{id}        → dealer_widget_configs table
 *
 * The Data Connect admin SDK is auto-generated after running:
 *   firebase dataconnect:sdk:generate
 *
 * Until the SDK is generated, the actual mutation calls are wrapped in a
 * guard that logs a warning and returns early.
 */

const { logger } = require('firebase-functions/v2');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { captureFunctionsException } = require('./sentry.js');

const FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

// ─── Data Connect Admin SDK imports ─────────────────────────────────────
const {
  upsertDealerFeedProfile,
  upsertDealerListing,
  insertDealerFeedIngestLog,
  insertDealerAuditLog,
  upsertDealerWebhookSubscription,
  upsertDealerWidgetConfig,
} = require('./generated/dataconnect/dealers');

const mutations = {
  upsertDealerFeedProfile,
  upsertDealerListing,
  insertDealerFeedIngestLog,
  insertDealerAuditLog,
  upsertDealerWebhookSubscription,
  upsertDealerWidgetConfig,
};

async function guardedMutation(name, variables) {
  const fn = mutations[name];
  if (!fn) {
    logger.error(`[dual-write-dealers] Unknown mutation: ${name}`);
    return;
  }
  try {
    await fn(variables);
  } catch (err) {
    logger.error(`[dual-write-dealers] ${name} failed`, { error: err.message, variables: Object.keys(variables) });
    captureFunctionsException(err, { mutation: name, module: 'dual-write-dealers', variableKeys: Object.keys(variables) });
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

function safeNum(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  return null;
}

// ─── Dealer Feed Profile sync ─────────────────────────────────────────

exports.syncDealerFeedProfileToPostgres = onDocumentWritten(
  { document: 'dealerFeedProfiles/{profileId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { profileId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-dealers] Dealer feed profile ${profileId} deleted`);
      return;
    }

    const payload = {
      id: profileId,
      sellerUid: after.sellerUid || '',
      dealerName: safeStr(after.dealerName),
      dealerEmail: safeStr(after.dealerEmail),
      sourceName: after.sourceName || 'Dealer Feed',
      sourceType: safeStr(after.sourceType),
      rawInput: safeStr(after.rawInput),
      feedUrl: safeStr(after.feedUrl),
      apiEndpoint: safeStr(after.apiEndpoint),
      status: after.status || 'active',
      syncMode: after.syncMode || 'pull',
      syncFrequency: after.syncFrequency || 'manual',
      nightlySyncEnabled: Boolean(after.nightlySyncEnabled),
      autoPublish: Boolean(after.autoPublish),
      fieldMapping: Array.isArray(after.fieldMapping) ? after.fieldMapping : [],
      apiKeyPreview: safeStr(after.apiKeyPreview),
      totalListingsSynced: safeNum(after.totalListingsSynced) ?? 0,
      totalListingsActive: safeNum(after.totalListingsActive) ?? 0,
      totalListingsCreated: safeNum(after.totalListingsCreated) ?? 0,
      totalListingsUpdated: safeNum(after.totalListingsUpdated) ?? 0,
      totalListingsDeleted: safeNum(after.totalListingsDeleted) ?? 0,
      lastSyncAt: tsToIso(after.lastSyncAt),
      nextSyncAt: tsToIso(after.nextSyncAt),
      lastSyncStatus: safeStr(after.lastSyncStatus),
      lastSyncMessage: safeStr(after.lastSyncMessage),
      lastResolvedType: safeStr(after.lastResolvedType),
    };

    logger.info(`[dual-write-dealers] Syncing dealer feed profile ${profileId} to PostgreSQL`);
    return guardedMutation('upsertDealerFeedProfile', payload);
  }
);

// ─── Dealer Listing sync ──────────────────────────────────────────────

exports.syncDealerListingToPostgres = onDocumentWritten(
  { document: 'dealerListings/{listingId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { listingId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-dealers] Dealer listing ${listingId} deleted`);
      return;
    }

    const payload = {
      id: listingId,
      dealerFeedId: after.dealerFeedId || after.feedId || '',
      sellerUid: after.sellerUid || '',
      externalListingId: after.externalListingId || after.externalId || '',
      timberequipListingId: safeStr(after.timberequipListingId),
      equipmentHash: safeStr(after.equipmentHash),
      status: after.status || 'active',
      dealerSourceUrl: safeStr(after.dealerSourceUrl),
      dataSource: after.dataSource || 'dealer',
      externalData: after.externalData || {},
      mappedData: after.mappedData || {},
      syncedAt: tsToIso(after.syncedAt),
    };

    logger.info(`[dual-write-dealers] Syncing dealer listing ${listingId} to PostgreSQL`);
    return guardedMutation('upsertDealerListing', payload);
  }
);

// ─── Dealer Feed Ingest Log sync ──────────────────────────────────────

exports.syncDealerIngestLogToPostgres = onDocumentWritten(
  { document: 'dealerFeedIngestLogs/{logId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { logId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-dealers] Ingest log ${logId} deleted`);
      return;
    }

    const payload = {
      id: logId,
      feedId: safeStr(after.feedId),
      sellerUid: after.sellerUid || '',
      actorUid: safeStr(after.actorUid),
      actorRole: safeStr(after.actorRole),
      sourceName: safeStr(after.sourceName),
      totalReceived: safeNum(after.totalReceived) ?? 0,
      processed: safeNum(after.processed) ?? 0,
      created: safeNum(after.created) ?? 0,
      updated: safeNum(after.updated) ?? 0,
      upserted: safeNum(after.upserted) ?? 0,
      skipped: safeNum(after.skipped) ?? 0,
      archived: safeNum(after.archived) ?? 0,
      errorCount: safeNum(after.errorCount) ?? 0,
      errors: Array.isArray(after.errors) ? after.errors : [],
      dryRun: Boolean(after.dryRun),
      syncContext: after.syncContext || {},
      processedAt: tsToIso(after.processedAt),
    };

    logger.info(`[dual-write-dealers] Syncing ingest log ${logId} to PostgreSQL`);
    return guardedMutation('insertDealerFeedIngestLog', payload);
  }
);

// ─── Dealer Audit Log sync ────────────────────────────────────────────

exports.syncDealerAuditLogToPostgres = onDocumentWritten(
  { document: 'dealerAuditLogs/{logId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { logId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-dealers] Audit log ${logId} deleted`);
      return;
    }

    const payload = {
      id: logId,
      dealerFeedId: safeStr(after.dealerFeedId),
      sellerUid: after.sellerUid || '',
      action: after.action || 'unknown',
      details: safeStr(after.details),
      errorMessage: safeStr(after.errorMessage),
      itemsProcessed: safeNum(after.itemsProcessed),
      itemsSucceeded: safeNum(after.itemsSucceeded),
      itemsFailed: safeNum(after.itemsFailed),
      metadata: after.metadata || {},
    };

    logger.info(`[dual-write-dealers] Syncing audit log ${logId} to PostgreSQL`);
    return guardedMutation('insertDealerAuditLog', payload);
  }
);

// ─── Dealer Webhook Subscription sync ─────────────────────────────────

exports.syncDealerWebhookToPostgres = onDocumentWritten(
  { document: 'dealerWebhookSubscriptions/{subId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { subId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-dealers] Webhook subscription ${subId} deleted`);
      return;
    }

    const payload = {
      id: subId,
      dealerUid: after.dealerUid || '',
      callbackUrl: after.callbackUrl || '',
      events: Array.isArray(after.events) ? after.events : [],
      active: after.active !== false,
      secretMasked: safeStr(after.secretMasked),
      failureCount: safeNum(after.failureCount) ?? 0,
      lastDeliveryAt: tsToIso(after.lastDeliveryAt),
    };

    logger.info(`[dual-write-dealers] Syncing webhook subscription ${subId} to PostgreSQL`);
    return guardedMutation('upsertDealerWebhookSubscription', payload);
  }
);

// ─── Dealer Widget Config sync ────────────────────────────────────────

exports.syncDealerWidgetConfigToPostgres = onDocumentWritten(
  { document: 'dealerWidgetConfigs/{configId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { configId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-dealers] Widget config ${configId} deleted`);
      return;
    }

    const payload = {
      id: configId,
      cardStyle: after.cardStyle || 'fes-native',
      accentColor: after.accentColor || '#000000',
      fontFamily: safeStr(after.fontFamily),
      darkMode: Boolean(after.darkMode),
      showInquiry: after.showInquiry !== false,
      showCall: after.showCall !== false,
      showDetails: after.showDetails !== false,
      pageSize: safeNum(after.pageSize) ?? 12,
      customCss: safeStr(after.customCss),
    };

    logger.info(`[dual-write-dealers] Syncing widget config ${configId} to PostgreSQL`);
    return guardedMutation('upsertDealerWidgetConfig', payload);
  }
);
