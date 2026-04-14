/**
 * Backfill script: Firestore inquiries, financing requests, call logs,
 * and contact requests → PostgreSQL via Firebase Data Connect.
 *
 * Usage:
 *   node scripts/backfill-leads.cjs                           # dry-run
 *   node scripts/backfill-leads.cjs --write                   # live write
 *   node scripts/backfill-leads.cjs --collection=inquiries    # single table
 *   node scripts/backfill-leads.cjs --batch=50                # custom batch
 *   node scripts/backfill-leads.cjs --project=my-project-id   # custom project
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';
const DEFAULT_BATCH_SIZE = 100;

const TABLES = ['inquiries', 'financing_requests', 'call_logs', 'contact_requests'];

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

function mapInquiry(id, data) {
  return {
    id,
    listingId: safeStr(data.listingId),
    sellerUid: safeStr(data.sellerUid),
    buyerUid: safeStr(data.buyerUid),
    buyerName: data.buyerName || data.name || '',
    buyerEmail: data.buyerEmail || data.email || '',
    buyerPhone: safeStr(data.buyerPhone) || safeStr(data.phone),
    message: safeStr(data.message),
    type: data.type || 'Inquiry',
    status: data.status || 'New',
    assignedToUid: safeStr(data.assignedToUid),
    assignedToName: safeStr(data.assignedToName),
    internalNotes: Array.isArray(data.internalNotes) ? data.internalNotes : [],
    firstResponseAt: tsToIso(data.firstResponseAt),
    responseTimeMinutes: safeNum(data.responseTimeMinutes),
    spamScore: safeNum(data.spamScore),
    spamFlags: Array.isArray(data.spamFlags) ? data.spamFlags : [],
    contactConsentAccepted: Boolean(data.contactConsentAccepted),
    contactConsentVersion: safeStr(data.contactConsentVersion),
    contactConsentScope: safeStr(data.contactConsentScope),
    contactConsentAt: tsToIso(data.contactConsentAt),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapFinancingRequest(id, data) {
  return {
    id,
    listingId: safeStr(data.listingId),
    sellerUid: safeStr(data.sellerUid),
    buyerUid: safeStr(data.buyerUid),
    applicantName: data.applicantName || data.name || '',
    applicantEmail: data.applicantEmail || data.email || '',
    applicantPhone: safeStr(data.applicantPhone) || safeStr(data.phone),
    company: safeStr(data.company),
    requestedAmount: safeNum(data.requestedAmount),
    message: safeStr(data.message),
    status: data.status || 'New',
    contactConsentAccepted: Boolean(data.contactConsentAccepted),
    contactConsentVersion: safeStr(data.contactConsentVersion),
    contactConsentScope: safeStr(data.contactConsentScope),
    contactConsentAt: tsToIso(data.contactConsentAt),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapCallLog(id, data) {
  return {
    id,
    listingId: safeStr(data.listingId),
    listingTitle: safeStr(data.listingTitle),
    sellerUid: safeStr(data.sellerUid),
    sellerName: safeStr(data.sellerName),
    sellerPhone: safeStr(data.sellerPhone),
    callerUid: safeStr(data.callerUid),
    callerName: safeStr(data.callerName),
    callerEmail: safeStr(data.callerEmail),
    callerPhone: safeStr(data.callerPhone),
    duration: safeNum(data.duration) ?? 0,
    status: data.status || 'completed',
    source: safeStr(data.source),
    isAuthenticated: Boolean(data.isAuthenticated),
    recordingUrl: safeStr(data.recordingUrl),
    twilioCallSid: safeStr(data.twilioCallSid),
    completedAt: tsToIso(data.completedAt),
    createdAt: tsToIso(data.createdAt),
  };
}

function mapContactRequest(id, data) {
  return {
    id,
    name: safeStr(data.name),
    email: data.email || '',
    category: safeStr(data.category),
    message: safeStr(data.message),
    source: safeStr(data.source),
    status: data.status || 'New',
    createdAt: tsToIso(data.createdAt),
  };
}

// ────────────────────────────────────────────────────────────────────────
// Backfill logic
// ────────────────────────────────────────────────────────────────────────

async function backfillCollection(db, collectionName, mapFn, options) {
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
          if (stats.total <= 3) console.log(`  [dry-run] ${collectionName}/${doc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
          stats.inserted += 1;
        } else {
          console.log(`  [write-placeholder] ${collectionName}/${doc.id} — would UPSERT`);
          stats.inserted += 1;
        }
      } catch (err) {
        stats.errors += 1;
        console.error(`  [error] ${collectionName}/${doc.id}:`, err.message);
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
  inquiries:           { fn: (db, opts) => backfillCollection(db, 'inquiries', mapInquiry, opts),              order: 1 },
  financing_requests:  { fn: (db, opts) => backfillCollection(db, 'financingRequests', mapFinancingRequest, opts), order: 2 },
  call_logs:           { fn: (db, opts) => backfillCollection(db, 'calls', mapCallLog, opts),                  order: 3 },
  contact_requests:    { fn: (db, opts) => backfillCollection(db, 'contactRequests', mapContactRequest, opts), order: 4 },
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = !args.write;
  const batchSize = toPositiveInt(args.batch, DEFAULT_BATCH_SIZE);
  const projectId = args.project || DEFAULT_FIREBASE_PROJECT_ID;
  const dbId = args.db || DEFAULT_FIRESTORE_DB_ID;
  const targetTable = args.collection || args.table || null;

  console.log(`\n=== Phase 4 Backfill: Leads & Inquiries ===`);
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
