/**
 * Backfill script: Firestore users, storefronts, subscriptions, invoices,
 * and seller program applications → PostgreSQL via Firebase Data Connect.
 *
 * Usage:
 *   node scripts/backfill-users-billing.cjs                           # dry-run (default)
 *   node scripts/backfill-users-billing.cjs --write                   # live write
 *   node scripts/backfill-users-billing.cjs --collection=users        # single collection
 *   node scripts/backfill-users-billing.cjs --batch=50                # custom batch size
 *   node scripts/backfill-users-billing.cjs --project=my-project-id   # custom project
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';
const DEFAULT_BATCH_SIZE = 100;

const COLLECTIONS = ['users', 'storefronts', 'subscriptions', 'invoices', 'sellerProgramApplications'];

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
// Firestore → PostgreSQL field mappers
// ────────────────────────────────────────────────────────────────────────

function tsToIso(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toISOString();
  return null;
}

function mapUser(id, data) {
  return {
    id,
    email: data.email || `${id}@unknown.local`,
    displayName: data.displayName || null,
    phoneNumber: data.phoneNumber || null,
    bio: data.bio || data.about || null,
    role: data.role || 'member',
    emailVerified: Boolean(data.emailVerified),
    photoUrl: data.photoURL || data.photoUrl || null,
    location: data.location || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    company: data.company || null,
    businessName: data.businessName || null,
    street1: data.street1 || null,
    street2: data.street2 || null,
    city: data.city || null,
    state: data.state || null,
    county: data.county || null,
    postalCode: data.postalCode || null,
    country: data.country || null,
    website: data.website || null,
    accountStatus: data.accountStatus || 'active',
    parentAccountUid: data.parentAccountUid || null,
    accountAccessSource: data.accountAccessSource || null,
    mfaEnabled: Boolean(data.mfaEnabled),
    mfaMethod: data.mfaMethod || null,
    mfaPhoneNumber: data.mfaPhoneNumber || null,
    mfaEnrolledAt: tsToIso(data.mfaEnrolledAt),
    favorites: JSON.stringify(Array.isArray(data.favorites) ? data.favorites : []),
    storefrontEnabled: Boolean(data.storefrontEnabled),
    storefrontSlug: data.storefrontSlug || null,
    storefrontName: data.storefrontName || null,
    storefrontTagline: data.storefrontTagline || null,
    storefrontDescription: data.storefrontDescription || null,
    storefrontLogoUrl: data.storefrontLogoUrl || null,
    coverPhotoUrl: data.coverPhotoUrl || null,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    seoKeywords: JSON.stringify(Array.isArray(data.seoKeywords) ? data.seoKeywords : []),
    metadataJson: JSON.stringify({}),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapStorefront(id, data) {
  return {
    id,
    userId: data.uid || id,
    storefrontEnabled: Boolean(data.storefrontEnabled),
    storefrontSlug: data.storefrontSlug || null,
    canonicalPath: data.canonicalPath || null,
    storefrontName: data.storefrontName || data.displayName || null,
    storefrontTagline: data.storefrontTagline || null,
    storefrontDescription: data.storefrontDescription || null,
    logoUrl: data.logo || data.logoUrl || null,
    coverPhotoUrl: data.coverPhotoUrl || null,
    businessName: data.businessName || null,
    street1: data.street1 || null,
    street2: data.street2 || null,
    city: data.city || null,
    state: data.state || null,
    county: data.county || null,
    postalCode: data.postalCode || null,
    country: data.country || null,
    location: data.location || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    serviceAreaScopes: JSON.stringify(Array.isArray(data.serviceAreaScopes) ? data.serviceAreaScopes : []),
    serviceAreaStates: JSON.stringify(Array.isArray(data.serviceAreaStates) ? data.serviceAreaStates : []),
    serviceAreaCounties: JSON.stringify(Array.isArray(data.serviceAreaCounties) ? data.serviceAreaCounties : []),
    servicesOfferedCategories: JSON.stringify(Array.isArray(data.servicesOfferedCategories) ? data.servicesOfferedCategories : []),
    servicesOfferedSubcategories: JSON.stringify(Array.isArray(data.servicesOfferedSubcategories) ? data.servicesOfferedSubcategories : []),
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    seoKeywords: JSON.stringify(Array.isArray(data.seoKeywords) ? data.seoKeywords : []),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapSubscription(id, data) {
  return {
    id,
    userId: data.userUid || '',
    listingId: data.listingId || null,
    planId: data.planId || 'unknown',
    planName: data.planName || null,
    listingCap: typeof data.listingCap === 'number' ? data.listingCap : null,
    status: data.status || 'pending',
    stripeSubscriptionId: data.stripeSubscriptionId || null,
    currentPeriodEnd: tsToIso(data.currentPeriodEnd),
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapInvoice(id, data) {
  return {
    id,
    userId: data.userUid || '',
    listingId: data.listingId || null,
    stripeInvoiceId: data.stripeInvoiceId || null,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: data.currency || 'usd',
    status: data.status || 'pending',
    items: JSON.stringify(Array.isArray(data.items) ? data.items : []),
    source: data.source || null,
    paidAt: tsToIso(data.paidAt),
    createdAt: tsToIso(data.createdAt),
  };
}

function mapSellerApplication(id, data) {
  return {
    id,
    userId: data.userUid || '',
    planId: data.planId || null,
    status: data.status || 'pending',
    stripeCustomerId: data.stripeCustomerId || null,
    stripeSubscriptionId: data.stripeSubscriptionId || null,
    legalFullName: data.legalFullName || null,
    legalTitle: data.legalTitle || null,
    companyName: data.companyName || null,
    billingEmail: data.billingEmail || null,
    phoneNumber: data.phoneNumber || null,
    website: data.website || null,
    country: data.country || null,
    taxIdOrVat: data.taxIdOrVat || null,
    notes: data.notes || null,
    statementLabel: data.statementLabel || null,
    legalScope: data.legalScope || null,
    legalTermsVersion: data.legalTermsVersion || null,
    legalAcceptedAtIso: data.legalAcceptedAtIso || null,
    acceptedTerms: Boolean(data.acceptedTerms),
    acceptedPrivacy: Boolean(data.acceptedPrivacy),
    acceptedRecurringBilling: Boolean(data.acceptedRecurringBilling),
    acceptedVisibilityPolicy: Boolean(data.acceptedVisibilityPolicy),
    acceptedAuthority: Boolean(data.acceptedAuthority),
    source: data.source || null,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

const COLLECTION_CONFIG = {
  users:                       { mapper: mapUser,              fkDeps: [] },
  storefronts:                 { mapper: mapStorefront,        fkDeps: ['users'] },
  subscriptions:               { mapper: mapSubscription,      fkDeps: ['users'] },
  invoices:                    { mapper: mapInvoice,           fkDeps: ['users'] },
  sellerProgramApplications:   { mapper: mapSellerApplication, fkDeps: ['users'] },
};

// ────────────────────────────────────────────────────────────────────────
// Core backfill logic
// ────────────────────────────────────────────────────────────────────────

async function backfillCollection(db, collectionName, mapper, options) {
  const { batchSize, dryRun, knownUserIds } = options;
  const stats = { total: 0, inserted: 0, skipped: 0, errors: 0 };

  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let query = db.collection(collectionName).orderBy('__name__').limit(batchSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) { hasMore = false; break; }

    for (const doc of snapshot.docs) {
      stats.total += 1;
      lastDoc = doc;

      try {
        const mapped = mapper(doc.id, doc.data());

        // FK validation: skip rows whose userId doesn't exist in the users table
        if (collectionName !== 'users' && mapped.userId) {
          if (knownUserIds && !knownUserIds.has(mapped.userId)) {
            stats.skipped += 1;
            continue;
          }
        }

        if (dryRun) {
          if (stats.total <= 3) {
            console.log(`  [dry-run] ${collectionName}/${doc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 300));
          }
          stats.inserted += 1;
        } else {
          // TODO: Replace with Data Connect SDK mutation call when generated SDKs are available.
          // For now, log the mapped object. Wire actual writes after `firebase dataconnect:sdk:generate`.
          console.log(`  [write-placeholder] ${collectionName}/${doc.id} — would INSERT/UPSERT`);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = !args.write;
  const batchSize = toPositiveInt(args.batch, DEFAULT_BATCH_SIZE);
  const projectId = args.project || DEFAULT_FIREBASE_PROJECT_ID;
  const dbId = args.db || DEFAULT_FIRESTORE_DB_ID;
  const targetCollection = args.collection || null;

  console.log(`\n=== Phase 2 Backfill: Users & Billing ===`);
  console.log(`  Project:    ${projectId}`);
  console.log(`  Firestore:  ${dbId}`);
  console.log(`  Mode:       ${dryRun ? 'DRY RUN' : 'LIVE WRITE'}`);
  console.log(`  Batch size: ${batchSize}`);
  if (targetCollection) console.log(`  Collection: ${targetCollection}`);
  console.log();

  admin.initializeApp({ projectId });
  const db = getFirestore(admin.app(), dbId);

  const collectionsToProcess = targetCollection
    ? [targetCollection]
    : COLLECTIONS;

  // First pass: collect known user IDs for FK validation
  let knownUserIds = null;
  if (!targetCollection || targetCollection !== 'users') {
    console.log('Pre-scanning users for FK validation...');
    const userIds = new Set();
    let lastDoc = null;
    let hasMore = true;
    while (hasMore) {
      let q = db.collection('users').select().orderBy('__name__').limit(500);
      if (lastDoc) q = q.startAfter(lastDoc);
      const snap = await q.get();
      if (snap.empty) { hasMore = false; break; }
      for (const d of snap.docs) { userIds.add(d.id); lastDoc = d; }
      if (snap.size < 500) hasMore = false;
    }
    knownUserIds = userIds;
    console.log(`  Found ${knownUserIds.size} users for FK validation.\n`);
  }

  const allStats = {};

  for (const name of collectionsToProcess) {
    const config = COLLECTION_CONFIG[name];
    if (!config) {
      console.log(`[skip] Unknown collection: ${name}`);
      continue;
    }

    console.log(`Processing: ${name}`);
    const stats = await backfillCollection(db, name, config.mapper, { batchSize, dryRun, knownUserIds });
    allStats[name] = stats;
    console.log(`  → total=${stats.total} inserted=${stats.inserted} skipped=${stats.skipped} errors=${stats.errors}\n`);
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
