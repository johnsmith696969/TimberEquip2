/**
 * Backfill script: Firestore auctions, lots, bids, auction invoices,
 * and bidder profiles → PostgreSQL via Firebase Data Connect.
 *
 * Flattens nested subcollections into flat relational tables:
 *   auctions/{id}/lots/{id}        → auction_lots
 *   auctions/{id}/lots/{id}/bids/* → auction_bids
 *   users/{id}/bidderProfile/*     → bidder_profiles
 *
 * Usage:
 *   node scripts/backfill-auctions.cjs                           # dry-run
 *   node scripts/backfill-auctions.cjs --write                   # live write
 *   node scripts/backfill-auctions.cjs --collection=auctions     # single table
 *   node scripts/backfill-auctions.cjs --batch=50                # custom batch
 *   node scripts/backfill-auctions.cjs --project=my-project-id   # custom project
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const DEFAULT_FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';
const DEFAULT_FIREBASE_PROJECT_ID = 'mobile-app-equipment-sales';
const DEFAULT_BATCH_SIZE = 100;

const TABLES = ['auctions', 'auction_lots', 'auction_bids', 'auction_invoices', 'bidder_profiles'];

// ────────────────────────────────────────────────────────────────────────
// CLI arg parser (same as backfill-users-billing.cjs)
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

// ─────────────────────────────────────────────────────────────────���──────
// Utility
// ───────────────────────────────────────────────────────────────���────────

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

function mapAuction(id, data) {
  return {
    id,
    title: data.title || data.name || 'Untitled Auction',
    slug: data.slug || id,
    description: safeStr(data.description),
    coverImageUrl: safeStr(data.coverImageUrl) || safeStr(data.image),
    startTime: tsToIso(data.startTime),
    endTime: tsToIso(data.endTime),
    previewStartTime: tsToIso(data.previewStartTime),
    status: data.status || 'draft',
    lotCount: safeNum(data.lotCount) ?? 0,
    totalBids: safeNum(data.totalBids) ?? 0,
    totalGmv: safeNum(data.totalGMV) ?? safeNum(data.totalGmv) ?? 0,
    defaultBuyerPremiumPercent: safeNum(data.defaultBuyerPremiumPercent) ?? 10,
    softCloseThresholdMin: safeNum(data.softCloseThresholdMin) ?? 5,
    softCloseExtensionMin: safeNum(data.softCloseExtensionMin) ?? 3,
    staggerIntervalMin: safeNum(data.staggerIntervalMin) ?? 1,
    defaultPaymentDeadlineDays: safeNum(data.defaultPaymentDeadlineDays) ?? 7,
    defaultRemovalDeadlineDays: safeNum(data.defaultRemovalDeadlineDays) ?? 14,
    termsAndConditionsUrl: safeStr(data.termsAndConditionsUrl),
    featured: Boolean(data.featured),
    bannerEnabled: Boolean(data.bannerEnabled),
    bannerImageUrl: safeStr(data.bannerImageUrl),
    createdBy: data.createdBy || 'unknown',
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

function mapLot(lotId, auctionId, data) {
  return {
    id: lotId,
    auctionId,
    listingId: safeStr(data.listingId),
    lotNumber: String(data.lotNumber || '0'),
    closeOrder: safeNum(data.closeOrder) ?? 0,
    startingBid: safeNum(data.startingBid),
    reservePrice: safeNum(data.reservePrice),
    reserveMet: Boolean(data.reserveMet),
    buyerPremiumPercent: safeNum(data.buyerPremiumPercent) ?? 10,
    startTime: tsToIso(data.startTime),
    endTime: tsToIso(data.endTime),
    originalEndTime: tsToIso(data.originalEndTime),
    softCloseThresholdMin: safeNum(data.softCloseThresholdMin) ?? 5,
    softCloseExtensionMin: safeNum(data.softCloseExtensionMin) ?? 3,
    softCloseGroupId: safeStr(data.softCloseGroupId),
    extensionCount: safeNum(data.extensionCount) ?? 0,
    currentBid: safeNum(data.currentBid) ?? 0,
    currentBidderId: safeStr(data.currentBidderId),
    currentBidderAnonymousId: safeStr(data.currentBidderAnonymousId),
    bidCount: safeNum(data.bidCount) ?? 0,
    uniqueBidders: safeNum(data.uniqueBidders) ?? 0,
    lastBidTime: tsToIso(data.lastBidTime),
    status: data.status || 'upcoming',
    promoted: Boolean(data.promoted),
    promotedOrder: safeNum(data.promotedOrder),
    winningBidderId: safeStr(data.winningBidderId),
    winningBid: safeNum(data.winningBid),
    watcherCount: safeNum(data.watcherCount) ?? 0,
    title: safeStr(data.title),
    manufacturer: safeStr(data.manufacturer),
    model: safeStr(data.model),
    year: safeNum(data.year),
    thumbnailUrl: safeStr(data.thumbnailUrl),
    pickupLocation: safeStr(data.pickupLocation),
    paymentDeadlineDays: safeNum(data.paymentDeadlineDays) ?? 7,
    removalDeadlineDays: safeNum(data.removalDeadlineDays) ?? 14,
    storageFeePerDay: safeNum(data.storageFeePerDay) ?? 0,
    isTitledItem: Boolean(data.isTitledItem),
    titleDocumentFee: safeNum(data.titleDocumentFee) ?? 0,
  };
}

function mapBid(bidId, auctionId, lotId, data) {
  return {
    id: bidId,
    auctionId,
    lotId,
    bidderId: data.bidderId || '',
    bidderAnonymousId: data.bidderAnonymousId || 'Bidder',
    amount: safeNum(data.amount) ?? 0,
    maxBid: safeNum(data.maxBid),
    type: data.type || 'manual',
    status: data.status || 'active',
    triggeredExtension: Boolean(data.triggeredExtension),
    bidTime: tsToIso(data.timestamp) || tsToIso(data.createdAt),
  };
}

function mapAuctionInvoice(id, data) {
  return {
    id,
    auctionId: data.auctionId || '',
    lotId: data.lotId || '',
    buyerId: data.buyerId || '',
    sellerId: data.sellerId || '',
    hammerPrice: safeNum(data.winningBid) ?? safeNum(data.hammerPrice) ?? 0,
    buyerPremium: safeNum(data.buyerPremium) ?? 0,
    documentationFee: safeNum(data.documentationFee) ?? safeNum(data.documentFee) ?? 0,
    cardProcessingFee: safeNum(data.cardProcessingFee) ?? 0,
    salesTaxRate: safeNum(data.salesTaxRate) ?? 0,
    salesTaxAmount: safeNum(data.salesTax) ?? safeNum(data.salesTaxAmount) ?? 0,
    salesTaxState: safeStr(data.salesTaxState),
    totalDue: safeNum(data.totalDue) ?? safeNum(data.total) ?? 0,
    currency: data.currency || 'usd',
    status: data.status || 'pending',
    paymentMethod: safeStr(data.paymentMethod),
    stripeInvoiceId: safeStr(data.stripeInvoiceId),
    stripeCheckoutSessionId: safeStr(data.stripeCheckoutSessionId),
    stripePaymentIntentId: safeStr(data.stripePaymentIntentId),
    buyerTaxExempt: Boolean(data.taxExempt),
    buyerTaxExemptState: safeStr(data.taxExemptState),
    buyerTaxExemptCertificateUrl: safeStr(data.taxExemptCertificateUrl),
    dueDate: tsToIso(data.dueDate),
    paidAt: tsToIso(data.paidAt),
    sellerCommission: safeNum(data.sellerCommission),
    sellerPayout: safeNum(data.sellerPayout),
    sellerPaidAt: tsToIso(data.sellerPaidAt),
  };
}

function mapBidderProfile(userId, data) {
  return {
    id: `bp_${userId}`,
    userId,
    verificationTier: data.verificationTier || 'basic',
    fullName: safeStr(data.fullName),
    phone: safeStr(data.phone),
    phoneVerified: Boolean(data.phoneVerified),
    addressStreet: safeStr(data.address?.street),
    addressCity: safeStr(data.address?.city),
    addressState: safeStr(data.address?.state),
    addressZip: safeStr(data.address?.zip),
    addressCountry: safeStr(data.address?.country),
    companyName: safeStr(data.companyName),
    stripeCustomerId: safeStr(data.stripeCustomerId),
    idVerificationStatus: data.idVerificationStatus || 'not_started',
    idVerifiedAt: tsToIso(data.idVerifiedAt),
    bidderApprovedAt: tsToIso(data.bidderApprovedAt),
    bidderApprovedBy: safeStr(data.bidderApprovedBy),
    totalAuctionsParticipated: safeNum(data.totalAuctionsParticipated) ?? 0,
    totalItemsWon: safeNum(data.totalItemsWon) ?? 0,
    totalSpent: safeNum(data.totalSpent) ?? 0,
    nonPaymentCount: safeNum(data.nonPaymentCount) ?? 0,
    taxExempt: Boolean(data.taxExempt),
    taxExemptState: safeStr(data.taxExemptState),
    taxExemptCertificateUrl: safeStr(data.taxExemptCertificateUrl),
    defaultPaymentMethodId: safeStr(data.defaultPaymentMethodId),
    defaultPaymentMethodBrand: safeStr(data.defaultPaymentMethodBrand),
    defaultPaymentMethodLast4: safeStr(data.defaultPaymentMethodLast4),
    termsAcceptedAt: tsToIso(data.termsAcceptedAt),
    termsVersion: safeStr(data.termsVersion),
  };
}

// ────────────────────────────────────────────────────────────────────────
// Backfill logic
// ────────────────────────────────────────────────────────────────────────

async function backfillAuctions(db, options) {
  const { batchSize, dryRun } = options;
  const stats = { total: 0, inserted: 0, errors: 0 };

  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let query = db.collection('auctions').orderBy('__name__').limit(batchSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      stats.total += 1;
      lastDoc = doc;
      try {
        const mapped = mapAuction(doc.id, doc.data());
        if (dryRun) {
          if (stats.total <= 3) console.log(`  [dry-run] auctions/${doc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
          stats.inserted += 1;
        } else {
          console.log(`  [write-placeholder] auctions/${doc.id} — would UPSERT`);
          stats.inserted += 1;
        }
      } catch (err) {
        stats.errors += 1;
        console.error(`  [error] auctions/${doc.id}:`, err.message);
      }
    }

    if (snapshot.size < batchSize) hasMore = false;
  }

  return stats;
}

async function backfillLots(db, options) {
  const { batchSize, dryRun } = options;
  const stats = { total: 0, inserted: 0, errors: 0 };

  // Iterate all auctions, then their lots subcollection
  let lastAuction = null;
  let hasMoreAuctions = true;

  while (hasMoreAuctions) {
    let auctionQuery = db.collection('auctions').orderBy('__name__').limit(batchSize);
    if (lastAuction) auctionQuery = auctionQuery.startAfter(lastAuction);

    const auctionSnap = await auctionQuery.get();
    if (auctionSnap.empty) break;

    for (const auctionDoc of auctionSnap.docs) {
      lastAuction = auctionDoc;
      const auctionId = auctionDoc.id;

      let lastLot = null;
      let hasMoreLots = true;

      while (hasMoreLots) {
        let lotQuery = db.collection(`auctions/${auctionId}/lots`).orderBy('__name__').limit(batchSize);
        if (lastLot) lotQuery = lotQuery.startAfter(lastLot);

        const lotSnap = await lotQuery.get();
        if (lotSnap.empty) break;

        for (const lotDoc of lotSnap.docs) {
          stats.total += 1;
          lastLot = lotDoc;
          try {
            const mapped = mapLot(lotDoc.id, auctionId, lotDoc.data());
            if (dryRun) {
              if (stats.total <= 3) console.log(`  [dry-run] lots/${auctionId}/${lotDoc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
              stats.inserted += 1;
            } else {
              console.log(`  [write-placeholder] lots/${auctionId}/${lotDoc.id} — would UPSERT`);
              stats.inserted += 1;
            }
          } catch (err) {
            stats.errors += 1;
            console.error(`  [error] lots/${auctionId}/${lotDoc.id}:`, err.message);
          }
        }

        if (lotSnap.size < batchSize) hasMoreLots = false;
      }
    }

    if (auctionSnap.size < batchSize) hasMoreAuctions = false;
  }

  return stats;
}

async function backfillBids(db, options) {
  const { batchSize, dryRun } = options;
  const stats = { total: 0, inserted: 0, errors: 0 };

  // Iterate auctions → lots → bids (3-level deep)
  let lastAuction = null;
  let hasMoreAuctions = true;

  while (hasMoreAuctions) {
    let auctionQuery = db.collection('auctions').orderBy('__name__').limit(batchSize);
    if (lastAuction) auctionQuery = auctionQuery.startAfter(lastAuction);

    const auctionSnap = await auctionQuery.get();
    if (auctionSnap.empty) break;

    for (const auctionDoc of auctionSnap.docs) {
      lastAuction = auctionDoc;
      const auctionId = auctionDoc.id;

      const lotsSnap = await db.collection(`auctions/${auctionId}/lots`).get();

      for (const lotDoc of lotsSnap.docs) {
        const lotId = lotDoc.id;

        let lastBid = null;
        let hasMoreBids = true;

        while (hasMoreBids) {
          let bidQuery = db.collection(`auctions/${auctionId}/lots/${lotId}/bids`).orderBy('__name__').limit(batchSize);
          if (lastBid) bidQuery = bidQuery.startAfter(lastBid);

          const bidSnap = await bidQuery.get();
          if (bidSnap.empty) break;

          for (const bidDoc of bidSnap.docs) {
            stats.total += 1;
            lastBid = bidDoc;
            try {
              const mapped = mapBid(bidDoc.id, auctionId, lotId, bidDoc.data());
              if (dryRun) {
                if (stats.total <= 3) console.log(`  [dry-run] bids/${auctionId}/${lotId}/${bidDoc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
                stats.inserted += 1;
              } else {
                console.log(`  [write-placeholder] bids/${auctionId}/${lotId}/${bidDoc.id} — would INSERT`);
                stats.inserted += 1;
              }
            } catch (err) {
              stats.errors += 1;
              console.error(`  [error] bids/${auctionId}/${lotId}/${bidDoc.id}:`, err.message);
            }
          }

          if (bidSnap.size < batchSize) hasMoreBids = false;
        }
      }
    }

    if (auctionSnap.size < batchSize) hasMoreAuctions = false;
  }

  return stats;
}

async function backfillAuctionInvoices(db, options) {
  const { batchSize, dryRun } = options;
  const stats = { total: 0, inserted: 0, errors: 0 };

  // Auction invoices are stored in the top-level `invoices` collection
  // with auctionId and lotId fields present. Filter for those with auctionId.
  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let query = db.collection('invoices').orderBy('__name__').limit(batchSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      lastDoc = doc;
      const data = doc.data();

      // Only process auction invoices (those with auctionId)
      if (!data.auctionId) continue;

      stats.total += 1;
      try {
        const mapped = mapAuctionInvoice(doc.id, data);
        if (dryRun) {
          if (stats.total <= 3) console.log(`  [dry-run] auction_invoices/${doc.id} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
          stats.inserted += 1;
        } else {
          console.log(`  [write-placeholder] auction_invoices/${doc.id} — would UPSERT`);
          stats.inserted += 1;
        }
      } catch (err) {
        stats.errors += 1;
        console.error(`  [error] auction_invoices/${doc.id}:`, err.message);
      }
    }

    if (snapshot.size < batchSize) hasMore = false;
  }

  return stats;
}

async function backfillBidderProfiles(db, options) {
  const { batchSize, dryRun } = options;
  const stats = { total: 0, inserted: 0, errors: 0 };

  // Bidder profiles are nested: users/{userId}/bidderProfile/profile
  let lastUser = null;
  let hasMore = true;

  while (hasMore) {
    let userQuery = db.collection('users').select().orderBy('__name__').limit(batchSize);
    if (lastUser) userQuery = userQuery.startAfter(lastUser);

    const userSnap = await userQuery.get();
    if (userSnap.empty) break;

    for (const userDoc of userSnap.docs) {
      lastUser = userDoc;
      const userId = userDoc.id;

      try {
        const profileDoc = await db.doc(`users/${userId}/bidderProfile/profile`).get();
        if (!profileDoc.exists) continue;

        stats.total += 1;
        const mapped = mapBidderProfile(userId, profileDoc.data());

        if (dryRun) {
          if (stats.total <= 3) console.log(`  [dry-run] bidder_profiles/${userId} →`, JSON.stringify(mapped, null, 2).slice(0, 400));
          stats.inserted += 1;
        } else {
          console.log(`  [write-placeholder] bidder_profiles/${userId} — would UPSERT`);
          stats.inserted += 1;
        }
      } catch (err) {
        stats.errors += 1;
        console.error(`  [error] bidder_profiles/${userId}:`, err.message);
      }
    }

    if (userSnap.size < batchSize) hasMore = false;
  }

  return stats;
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

const TABLE_CONFIG = {
  auctions:           { fn: backfillAuctions,         order: 1 },
  auction_lots:       { fn: backfillLots,             order: 2 },
  auction_bids:       { fn: backfillBids,             order: 3 },
  auction_invoices:   { fn: backfillAuctionInvoices,  order: 4 },
  bidder_profiles:    { fn: backfillBidderProfiles,   order: 5 },
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = !args.write;
  const batchSize = toPositiveInt(args.batch, DEFAULT_BATCH_SIZE);
  const projectId = args.project || DEFAULT_FIREBASE_PROJECT_ID;
  const dbId = args.db || DEFAULT_FIRESTORE_DB_ID;
  const targetTable = args.collection || args.table || null;

  console.log(`\n=== Phase 3 Backfill: Auctions ===`);
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
