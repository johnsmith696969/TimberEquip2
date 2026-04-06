#!/usr/bin/env node
/**
 * Standalone listing backfill: mirror existing Firestore listings into
 * PostgreSQL via Data Connect admin SDK.
 *
 * This script runs from the functions/ directory so it can resolve the
 * generated Data Connect SDK and firebase-admin/data-connect submodule
 * without cross-package issues.
 *
 * Usage (from TimberEquip-main/functions/):
 *   node backfill-listings-to-postgres.cjs [--write] [--limit <n>] [--page-size <n>]
 *
 * Required env:
 *   GOOGLE_APPLICATION_CREDENTIALS — path to ADC or service account JSON
 *   GOOGLE_CLOUD_PROJECT — project id (defaults to mobile-app-equipment-sales)
 */
const admin = require('firebase-admin');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');
const { getDataConnect } = require('firebase-admin/data-connect');
const {
  connectorConfig,
  findListingByFirestoreId,
  insertListingShadow,
  updateListingShadow,
  recordListingStateTransition,
} = require('./generated/dataconnect/listing-governance/index.cjs.js');
const { buildListingGovernanceShadow } = require('./listing-governance-rules.js');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_PROJECT_ID = 'mobile-app-equipment-sales';

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) { parsed._.push(token); continue; }
    const [flag, inlineVal] = token.split('=', 2);
    const key = flag.slice(2);
    if (inlineVal !== undefined) { parsed[key] = inlineVal; continue; }
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) { parsed[key] = true; continue; }
    parsed[key] = next;
    i++;
  }
  return parsed;
}

function toInt(val, fallback) {
  const n = Number.parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function nullIfEmpty(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function toIso(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val?.toDate === 'function') {
    try { return val.toDate().toISOString(); } catch { return null; }
  }
  if (typeof val === 'number' || typeof val === 'string') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function buildVariables(listingId, listing) {
  const shadow = buildListingGovernanceShadow({ id: listingId, ...listing });
  return {
    shadow,
    variables: {
      legacyFirestoreId: listingId,
      sellerPartyId: shadow.sellerPartyId || 'unknown',
      title: shadow.title || '(untitled)',
      categoryKey: shadow.categoryKey || 'unknown',
      subcategoryKey: nullIfEmpty(shadow.subcategoryKey),
      manufacturerKey: nullIfEmpty(shadow.manufacturerKey),
      modelKey: nullIfEmpty(shadow.modelKey),
      locationText: nullIfEmpty(shadow.locationText),
      priceAmount: Number.isFinite(shadow.priceAmount) ? shadow.priceAmount : null,
      currencyCode: shadow.currencyCode || 'USD',
      lifecycleState: shadow.lifecycleState,
      reviewState: shadow.reviewState,
      paymentState: shadow.paymentState,
      inventoryState: shadow.inventoryState,
      visibilityState: shadow.visibilityState,
      primaryImageUrl: nullIfEmpty(shadow.primaryImageUrl),
      publishedAt: toIso(shadow.publishedAt),
      expiresAt: toIso(shadow.expiresAt),
      soldAt: toIso(shadow.soldAt),
      sourceSystem: shadow.sourceSystem || 'firestore',
      externalSourceName: nullIfEmpty(shadow.externalSourceName),
      externalSourceId: nullIfEmpty(shadow.externalSourceId),
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node backfill-listings-to-postgres.cjs [--write] [--limit <n>] [--page-size <n>]');
    process.exit(0);
  }

  const writeMode = args.write === true;
  const pageSize = toInt(args['page-size'], 200);
  const limit = args.limit ? toInt(args.limit, 0) : 0;
  const projectId = String(
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || DEFAULT_PROJECT_ID
  ).trim();
  const firestoreDbId = String(process.env.FIRESTORE_DB_ID || DEFAULT_FIRESTORE_DB_ID).trim();

  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  process.env.GCLOUD_PROJECT = projectId;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }

  const db = getFirestore(firestoreDbId);
  const dc = getDataConnect(connectorConfig);

  const summary = {
    mode: writeMode ? 'write' : 'dry-run',
    projectId,
    firestoreDbId,
    pageSize,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorSamples: [],
  };

  let cursor = null;

  while (true) {
    let query = db.collection('listings').orderBy(FieldPath.documentId()).limit(pageSize);
    if (cursor) query = query.startAfter(cursor);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const listingId = doc.id;
      const listing = doc.data();
      summary.processed++;

      if (!writeMode) {
        summary.skipped++;
        if (summary.processed % 50 === 0) {
          console.log(`[dry-run] processed ${summary.processed} listings...`);
        }
        if (limit && summary.processed >= limit) break;
        continue;
      }

      try {
        const { shadow, variables } = buildVariables(listingId, listing);

        // Check if listing already exists in PostgreSQL
        const findResult = await findListingByFirestoreId(dc, { legacyFirestoreId: listingId });
        const existing = findResult?.data?.listings?.[0] || null;

        if (existing) {
          // Update existing record
          const { legacyFirestoreId: _l, sourceSystem: _s, ...updateVars } = variables;
          await updateListingShadow(dc, { id: existing.id, ...updateVars });
          summary.updated++;
        } else {
          // Insert new record
          await insertListingShadow(dc, variables);

          // Record initial state transition
          const inserted = await findListingByFirestoreId(dc, { legacyFirestoreId: listingId });
          const newId = inserted?.data?.listings?.[0]?.id || null;
          if (newId) {
            try {
              await recordListingStateTransition(dc, {
                listingId: newId,
                transitionAction: 'shadow_initialized',
                previousState: null,
                nextState: shadow.lifecycleState,
                previousReviewState: null,
                nextReviewState: shadow.reviewState,
                previousPaymentState: null,
                nextPaymentState: shadow.paymentState,
                previousInventoryState: null,
                nextInventoryState: shadow.inventoryState,
                previousVisibilityState: null,
                nextVisibilityState: shadow.visibilityState,
                actorType: 'system',
                actorId: nullIfEmpty(listing.sellerUid || listing.sellerId),
                requestId: `backfill-${Date.now()}`,
                reasonCode: null,
                reasonNote: null,
              });
            } catch (err) {
              console.warn(`[warn] transition log failed for ${listingId}: ${err.message}`);
            }
          }
          summary.inserted++;
        }

        if (summary.processed % 25 === 0) {
          console.log(`[write] processed ${summary.processed} — inserted: ${summary.inserted}, updated: ${summary.updated}, errors: ${summary.errors}`);
        }
      } catch (error) {
        summary.errors++;
        if (summary.errorSamples.length < 10) {
          summary.errorSamples.push({
            listingId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (limit && summary.processed >= limit) break;
    }

    if (limit && summary.processed >= limit) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log('\n=== Backfill Summary ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  if (String(error).includes('credentials') || String(error).includes('Project Id')) {
    console.error('\nSet ADC before running:\n  set GOOGLE_APPLICATION_CREDENTIALS=C:/Users/<you>/.config/gcloud/application_default_credentials.json');
    console.error('  set GOOGLE_CLOUD_PROJECT=mobile-app-equipment-sales');
  }
  process.exit(1);
});
