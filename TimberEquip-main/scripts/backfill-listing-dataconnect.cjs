#!/usr/bin/env node
/**
 * Phase 1 dual-write backfill: mirror every existing Firestore listing into
 * the Data Connect / PostgreSQL shadow tables.
 *
 * Usage:
 *   node scripts/backfill-listing-dataconnect.cjs [--write] [--limit <n>] [--page-size <n>] [--output <path>]
 *
 * Default is dry-run. Pass `--write` to actually call Data Connect mutations.
 *
 * Required env:
 *   GOOGLE_APPLICATION_CREDENTIALS — path to a service account JSON with
 *     Firestore + Firebase Data Connect admin roles.
 *   GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT — project id (defaults to
 *     mobile-app-equipment-sales).
 *   FIRESTORE_DB_ID — custom Firestore database id (defaults to the
 *     TimberEquip named DB).
 */
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');
const { syncListingToDataConnect } = require('../functions/listing-governance-dataconnect-sync.js');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }
    const [flag, inlineValue] = token.split('=', 2);
    const key = flag.slice(2);
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function toPositiveInteger(value, fallback) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === true) {
    console.log(
      'Usage: node scripts/backfill-listing-dataconnect.cjs [--write] [--limit <n>] [--page-size <n>] [--output <path>]',
    );
    process.exit(0);
  }

  const writeMode = args.write === true;
  const pageSize = toPositiveInteger(args['page-size'], 200);
  const limit = args.limit ? toPositiveInteger(args.limit, 0) : 0;
  const outputPath = args.output ? path.resolve(process.cwd(), String(args.output)) : '';
  const firestoreDbId = String(process.env.FIRESTORE_DB_ID || DEFAULT_FIRESTORE_DB_ID).trim();
  const projectId = String(
    process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID_PRODUCTION ||
      process.env.FIREBASE_PROJECT_ID ||
      DEFAULT_FIREBASE_PROJECT_ID,
  ).trim();

  process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || projectId;
  process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || projectId;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }

  const db = getFirestore(firestoreDbId);
  const summary = {
    mode: writeMode ? 'write' : 'dry-run',
    projectId,
    firestoreDbId,
    pageSize,
    processed: 0,
    inserted: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    errors: 0,
    errorSamples: [],
  };

  let cursor = null;

  while (true) {
    let query = db.collection('listings').orderBy(FieldPath.documentId()).limit(pageSize);
    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const listingId = doc.id;
      const listing = doc.data();
      summary.processed += 1;

      if (!writeMode) {
        summary.skipped += 1;
      } else {
        try {
          const result = await syncListingToDataConnect({
            listingId,
            before: null,
            after: listing,
            requestId: `backfill-${Date.now()}`,
          });
          switch (result.status) {
            case 'inserted':
              summary.inserted += 1;
              break;
            case 'updated':
              summary.updated += 1;
              break;
            case 'deleted':
              summary.deleted += 1;
              break;
            default:
              summary.skipped += 1;
          }
        } catch (error) {
          summary.errors += 1;
          if (summary.errorSamples.length < 5) {
            summary.errorSamples.push({
              listingId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      if (limit && summary.processed >= limit) break;
    }

    if (limit && summary.processed >= limit) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log(JSON.stringify(summary, null, 2));

  if (outputPath) {
    fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    console.log(`Wrote Data Connect backfill report to ${outputPath}`);
  }
}

main().catch((error) => {
  const message = error?.stack || error?.message || String(error);
  console.error(message);

  if (message.includes('Unable to detect a Project Id') || message.includes('Could not load the default credentials')) {
    console.error('\nSet Google ADC before running this script locally. Example:');
    console.error('  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\service-account.json"');
    console.error('  $env:GOOGLE_CLOUD_PROJECT="mobile-app-equipment-sales"');
  }

  process.exit(1);
});
