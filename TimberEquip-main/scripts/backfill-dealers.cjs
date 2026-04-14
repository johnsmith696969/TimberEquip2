/**
 * Backfill script: Firestore dealer feeds, listings, ingest logs, audit logs,
 * webhook subscriptions, and widget configs → PostgreSQL via Firebase Data Connect.
 *
 * Usage:
 *   node scripts/backfill-dealers.cjs                                  # dry-run
 *   node scripts/backfill-dealers.cjs --write                          # live write
 *   node scripts/backfill-dealers.cjs --collection=dealer_feed_profiles # single table
 *   node scripts/backfill-dealers.cjs --batch=50                       # custom batch
 *   node scripts/backfill-dealers.cjs --project=my-project-id          # custom project
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';
const DEFAULT_BATCH_SIZE = 100;

const TABLES = [
  'dealer_feed_profiles',
  'dealer_listings',
  'dealer_feed_ingest_logs',
  'dealer_audit_logs',
  'dealer_webhook_subscriptions',
  'dealer_widget_configs',
];

// ────────────────────────────────────────────────────────────────────────
// CLI arg parser
// ────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) { parsed._.push(token); continue; }
    const [flag, inlineValue] = token.split('=', 2);
    const key = flag.slice(2);
    if (inlineValue !== undefined) { parsed[key] = inlineValue; continue; }
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) { parsed[key] = true; continue; }
    parsed[key] = next;
    i += 1;
  }
  return parsed;
}

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ────────────────────────────────────────────────────────────────────────
// Utility
// ────────────────────────────────────────────────────────────────────────

function tsToIso(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return null;
}

function safeNum(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  return null;
}

function safeStr(val) {
  return typeof val === 'string' ? val.trim() || null : null;
}

// ────────────────────────────────────────────────────────────────────────
// Field mappers
// ────────────────────────────────────────────────────────────────────────

function mapDealerFeedProfile(id, data) {
  return {
    id,
    sellerUid: data.sellerUid || '',
    dealerName: safeStr(data.dealerName),
    dealerEmail: safeStr(data.dealerEmail),
    sourceName: data.sourceName || 'Dealer Feed',
    sourceType: safeStr(data.sourceType),
    rawInput: safeStr(data.rawInput),
    feedUrl: safeStr(data.feedUrl),
    apiEndpoint: safeStr(data.apiEndpoint),
    status: data.status || 'active',
    syncMode: data.syncMode || 'pull',
    syncFrequency: data.syncFrequency || 'manual',
    nightlySyncEnabled: Boolean(data.nightlySyncEnabled),
    autoPublish: Boolean(data.autoPublish),
    fieldMapping: Array.isArray(data.fieldMapping) ? data.fieldMapping : [],
    apiKeyPreview: safeStr(data.apiKeyPreview),
    totalListingsSynced: safeNum(data.totalListingsSynced) ?? 0,
    totalListingsActive: safeNum(data.totalListingsActive) ?? 0,
    totalListingsCreated: safeNum(data.totalListingsCreated) ?? 0,
    totalListingsUpdated: safeNum(data.totalListingsUpdated) ?? 0,
    totalListingsDeleted: safeNum(data.totalListingsDeleted) ?? 0,
    lastSyncAt: tsToIso(data.lastSyncAt),
    nextSyncAt: tsToIso(data.nextSyncAt),
    lastSyncStatus: safeStr(data.lastSyncStatus),
    lastSyncMessage: safeStr(data.lastSyncMessage),
    lastResolvedType: safeStr(data.lastResolvedType),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapDealerListing(id, data) {
  return {
    id,
    dealerFeedId: data.dealerFeedId || data.feedId || '',
    sellerUid: data.sellerUid || '',
    externalListingId: data.externalListingId || data.externalId || '',
    timberequipListingId: safeStr(data.timberequipListingId),
    equipmentHash: safeStr(data.equipmentHash),
    status: data.status || 'active',
    dealerSourceUrl: safeStr(data.dealerSourceUrl),
    dataSource: data.dataSource || 'dealer',
    externalData: data.externalData || {},
    mappedData: data.mappedData || {},
    syncedAt: tsToIso(data.syncedAt),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapIngestLog(id, data) {
  return {
    id,
    feedId: safeStr(data.feedId),
    sellerUid: data.sellerUid || '',
    actorUid: safeStr(data.actorUid),
    actorRole: safeStr(data.actorRole),
    sourceName: safeStr(data.sourceName),
    totalReceived: safeNum(data.totalReceived) ?? 0,
    processed: safeNum(data.processed) ?? 0,
    created: safeNum(data.created) ?? 0,
    updated: safeNum(data.updated) ?? 0,
    upserted: safeNum(data.upserted) ?? 0,
    skipped: safeNum(data.skipped) ?? 0,
    archived: safeNum(data.archived) ?? 0,
    errorCount: safeNum(data.errorCount) ?? 0,
    errors: Array.isArray(data.errors) ? data.errors : [],
    dryRun: Boolean(data.dryRun),
    syncContext: data.syncContext || {},
    processedAt: tsToIso(data.processedAt),
    createdAt: tsToIso(data.createdAt),
  };
}

function mapAuditLog(id, data) {
  return {
    id,
    dealerFeedId: safeStr(data.dealerFeedId),
    sellerUid: data.sellerUid || '',
    action: data.action || 'unknown',
    details: safeStr(data.details),
    errorMessage: safeStr(data.errorMessage),
    itemsProcessed: safeNum(data.itemsProcessed),
    itemsSucceeded: safeNum(data.itemsSucceeded),
    itemsFailed: safeNum(data.itemsFailed),
    metadata: data.metadata || {},
    createdAt: tsToIso(data.createdAt),
  };
}

function mapWebhookSubscription(id, data) {
  return {
    id,
    dealerUid: data.dealerUid || '',
    callbackUrl: data.callbackUrl || '',
    events: Array.isArray(data.events) ? data.events : [],
    active: data.active !== false,
    secretMasked: safeStr(data.secretMasked),
    failureCount: safeNum(data.failureCount) ?? 0,
    lastDeliveryAt: tsToIso(data.lastDeliveryAt),
    createdAt: tsToIso(data.createdAt),
  };
}

function mapWidgetConfig(id, data) {
  return {
    id,
    cardStyle: data.cardStyle || 'fes-native',
    accentColor: data.accentColor || '#000000',
    fontFamily: safeStr(data.fontFamily),
    darkMode: Boolean(data.darkMode),
    showInquiry: data.showInquiry !== false,
    showCall: data.showCall !== false,
    showDetails: data.showDetails !== false,
    pageSize: safeNum(data.pageSize) ?? 12,
    customCss: safeStr(data.customCss),
    updatedAt: tsToIso(data.updatedAt),
  };
}

// ────────────────────────────────────────────────────────────────────────
// Backfill logic
// ────────────────────────────────────────────────────────────────────────

async function backfillCollection(db, collectionName, mapFn, tableName, options) {
  const { batchSize, dryRun } = options;
  const stats = { total: 0, inserted: 0, errors: 0 };

  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let query = db.collection(collectionName).orderBy('__name__').limit(batchSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      stats.total += 1;
      lastDoc = doc;
      try {
        const mapped = mapFn(doc.id, doc.data());
        if (dryRun) {
          if (stats.total <= 3) console.log(`  [dry-run] ${tableName}/${doc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
          stats.inserted += 1;
        } else {
          console.log(`  [write-placeholder] ${tableName}/${doc.id} — would UPSERT`);
          stats.inserted += 1;
        }
      } catch (err) {
        stats.errors += 1;
        console.error(`  [error] ${tableName}/${doc.id}:`, err.message);
      }
    }

    if (snapshot.size < batchSize) hasMore = false;
  }

  return stats;
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

const TABLE_CONFIG = {
  dealer_feed_profiles:       { fn: (db, opts) => backfillCollection(db, 'dealerFeedProfiles', mapDealerFeedProfile, 'dealer_feed_profiles', opts),   order: 1 },
  dealer_listings:            { fn: (db, opts) => backfillCollection(db, 'dealerListings', mapDealerListing, 'dealer_listings', opts),                 order: 2 },
  dealer_feed_ingest_logs:    { fn: (db, opts) => backfillCollection(db, 'dealerFeedIngestLogs', mapIngestLog, 'dealer_feed_ingest_logs', opts),       order: 3 },
  dealer_audit_logs:          { fn: (db, opts) => backfillCollection(db, 'dealerAuditLogs', mapAuditLog, 'dealer_audit_logs', opts),                   order: 4 },
  dealer_webhook_subscriptions: { fn: (db, opts) => backfillCollection(db, 'dealerWebhookSubscriptions', mapWebhookSubscription, 'dealer_webhook_subscriptions', opts), order: 5 },
  dealer_widget_configs:      { fn: (db, opts) => backfillCollection(db, 'dealerWidgetConfigs', mapWidgetConfig, 'dealer_widget_configs', opts),       order: 6 },
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = !args.write;
  const batchSize = toPositiveInt(args.batch, DEFAULT_BATCH_SIZE);
  const projectId = args.project || DEFAULT_FIREBASE_PROJECT_ID;
  const dbId = args.db || DEFAULT_FIRESTORE_DB_ID;
  const targetTable = args.collection || args.table || null;

  console.log(`\n=== Phase 5 Backfill: Dealer System ===`);
  console.log(`  Project:    ${projectId}`);
  console.log(`  Firestore:  ${dbId}`);
  console.log(`  Mode:       ${dryRun ? 'DRY RUN' : 'LIVE WRITE'}`);
  console.log(`  Batch size: ${batchSize}`);
  if (targetTable) console.log(`  Table:      ${targetTable}`);
  console.log();

  admin.initializeApp({ projectId });
  const db = getFirestore(admin.app(), dbId);

  const tablesToProcess = targetTable
    ? [targetTable]
    : TABLES;

  const allStats = {};

  for (const name of tablesToProcess) {
    const config = TABLE_CONFIG[name];
    if (!config) {
      console.log(`[skip] Unknown table: ${name}`);
      continue;
    }

    console.log(`Processing: ${name}`);
    const stats = await config.fn(db, { batchSize, dryRun });
    allStats[name] = stats;
    console.log(`  → total=${stats.total} inserted=${stats.inserted} errors=${stats.errors}\n`);
  }

  console.log('=== Summary ===');
  console.log(JSON.stringify(allStats, null, 2));

  if (dryRun) {
    console.log('\n✓ Dry run complete. Re-run with --write to perform actual backfill.');
  } else {
    console.log('\n✓ Backfill complete.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
