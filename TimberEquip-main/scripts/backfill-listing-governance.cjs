const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const { getFirestore, FieldPath } = require('firebase-admin/firestore');
const {
  evaluateListingGovernanceArtifacts,
  syncListingGovernanceArtifactsForWrite,
} = require('../functions/listing-governance-artifacts.js');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';

function parseArgs(argv) {
  const parsed = {
    _: [],
  };

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

function bumpCount(map, key, increment = 1) {
  map[key] = (map[key] || 0) + increment;
}

function toSerializableSummary(summary) {
  return {
    ...summary,
    anomalyHistogram: Object.fromEntries(Object.entries(summary.anomalyHistogram).sort(([left], [right]) => left.localeCompare(right))),
    lifecycleHistogram: Object.fromEntries(Object.entries(summary.lifecycleHistogram).sort(([left], [right]) => left.localeCompare(right))),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === true) {
    console.log('Usage: node scripts/backfill-listing-governance.cjs [--write] [--limit <n>] [--page-size <n>] [--emit-initialization-transitions] [--output <path>] [--source <name>]');
    process.exit(0);
  }

  const writeMode = args.write === true;
  const emitInitializationTransitions = args['emit-initialization-transitions'] === true;
  const pageSize = toPositiveInteger(args['page-size'], 200);
  const limit = args.limit ? toPositiveInteger(args.limit, 0) : 0;
  const source = String(args.source || 'governance_backfill_script').trim();
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
    source,
    projectId,
    firestoreDbId,
    pageSize,
    processed: 0,
    wroteArtifacts: 0,
    wroteTransitions: 0,
    anomalyListings: 0,
    anomalyHistogram: {},
    lifecycleHistogram: {},
    publicListings: 0,
    missingPrimaryImage: 0,
    reportStatus: 'completed',
  };

  let cursor = null;

  while (true) {
    let query = db.collection('listings').orderBy(FieldPath.documentId()).limit(pageSize);
    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      const listingId = doc.id;
      const listing = doc.data();
      const evaluation = evaluateListingGovernanceArtifacts({ listingId, listing });

      summary.processed += 1;
      bumpCount(summary.lifecycleHistogram, evaluation.shadow?.lifecycleState || 'unknown');

      if (evaluation.shadow?.isPublic) {
        summary.publicListings += 1;
      }

      if (!evaluation.primaryImagePresent) {
        summary.missingPrimaryImage += 1;
      }

      if (evaluation.anomalies.length > 0) {
        summary.anomalyListings += 1;
        for (const anomalyCode of evaluation.anomalies) {
          bumpCount(summary.anomalyHistogram, anomalyCode);
        }
      }

      if (writeMode) {
        const result = await syncListingGovernanceArtifactsForWrite({
          db,
          listingId,
          before: null,
          after: listing,
          source,
          emitInitializationTransition: emitInitializationTransitions,
        });

        summary.wroteArtifacts += 1;
        if (result.wroteTransition) {
          summary.wroteTransitions += 1;
        }
      }

      if (limit && summary.processed >= limit) {
        break;
      }
    }

    if (limit && summary.processed >= limit) {
      break;
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
  }

  const finalSummary = toSerializableSummary(summary);
  console.log(JSON.stringify(finalSummary, null, 2));

  if (outputPath) {
    fs.writeFileSync(outputPath, `${JSON.stringify(finalSummary, null, 2)}\n`, 'utf8');
    console.log(`Wrote governance backfill report to ${outputPath}`);
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
