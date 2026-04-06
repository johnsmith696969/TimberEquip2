/**
 * Phase 3 dual-write triggers: Firestore → PostgreSQL (Auctions)
 *
 * These Cloud Function triggers listen for writes to auction-related
 * Firestore collections/subcollections and mirror each change to
 * PostgreSQL via Firebase Data Connect.
 *
 * Flattened subcollections:
 *   auctions/{id}                          → auctions table
 *   auctions/{auctionId}/lots/{lotId}      → auction_lots table
 *   auctions/{auctionId}/lots/{lotId}/bids → auction_bids table
 *
 * The Data Connect admin SDK is auto-generated after running:
 *   firebase dataconnect:sdk:generate
 *
 * Until the SDK is generated, the actual mutation calls are wrapped in a
 * guard that logs a warning and returns early.
 */

const { logger } = require('firebase-functions/v2');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

const FIRESTORE_DB_ID = 'ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c';

// ─── Placeholder SDK imports ───────────────────────────────────────────
// Uncomment these after running `firebase dataconnect:sdk:generate`:
//
// const {
//   upsertAuction,
//   upsertAuctionLot,
//   insertAuctionBid,
//   updateAuctionLotBidState,
//   updateAuctionLotStatus,
//   upsertAuctionInvoice,
//   updateAuctionStatus,
// } = require('./generated/dataconnect/auctions');

let sdkReady = false;

function guardedMutation(name, variables) {
  if (!sdkReady) {
    logger.warn(`[dual-write-auctions] SDK not generated yet — skipping ${name}`, { variables: Object.keys(variables) });
    return Promise.resolve();
  }
  return Promise.resolve();
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

// ─── Auction sync ──────────────────────────────────────────────────────

exports.syncAuctionToPostgres = onDocumentWritten(
  { document: 'auctions/{auctionId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { auctionId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-auctions] Auction ${auctionId} deleted`);
      return;
    }

    const payload = {
      id: auctionId,
      title: after.title || after.name || 'Untitled Auction',
      slug: after.slug || auctionId,
      description: safeStr(after.description),
      coverImageUrl: safeStr(after.coverImageUrl) || safeStr(after.image),
      startTime: tsToIso(after.startTime),
      endTime: tsToIso(after.endTime),
      previewStartTime: tsToIso(after.previewStartTime),
      status: after.status || 'draft',
      lotCount: safeNum(after.lotCount) ?? 0,
      totalBids: safeNum(after.totalBids) ?? 0,
      totalGmv: safeNum(after.totalGMV) ?? safeNum(after.totalGmv) ?? 0,
      defaultBuyerPremiumPercent: safeNum(after.defaultBuyerPremiumPercent) ?? 10,
      softCloseThresholdMin: safeNum(after.softCloseThresholdMin) ?? 5,
      softCloseExtensionMin: safeNum(after.softCloseExtensionMin) ?? 3,
      staggerIntervalMin: safeNum(after.staggerIntervalMin) ?? 1,
      defaultPaymentDeadlineDays: safeNum(after.defaultPaymentDeadlineDays) ?? 7,
      defaultRemovalDeadlineDays: safeNum(after.defaultRemovalDeadlineDays) ?? 14,
      termsAndConditionsUrl: safeStr(after.termsAndConditionsUrl),
      featured: Boolean(after.featured),
      bannerEnabled: Boolean(after.bannerEnabled),
      bannerImageUrl: safeStr(after.bannerImageUrl),
      createdBy: after.createdBy || 'unknown',
    };

    logger.info(`[dual-write-auctions] Syncing auction ${auctionId} to PostgreSQL`);
    return guardedMutation('upsertAuction', payload);
  }
);

// ─── Lot sync ──────────────────────────────────────────────────────────

exports.syncAuctionLotToPostgres = onDocumentWritten(
  { document: 'auctions/{auctionId}/lots/{lotId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { auctionId, lotId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-auctions] Lot ${lotId} in auction ${auctionId} deleted`);
      return;
    }

    const payload = {
      id: lotId,
      auctionId,
      listingId: safeStr(after.listingId),
      lotNumber: String(after.lotNumber || '0'),
      closeOrder: safeNum(after.closeOrder) ?? 0,
      startingBid: safeNum(after.startingBid),
      reservePrice: safeNum(after.reservePrice),
      reserveMet: Boolean(after.reserveMet),
      buyerPremiumPercent: safeNum(after.buyerPremiumPercent) ?? 10,
      startTime: tsToIso(after.startTime),
      endTime: tsToIso(after.endTime),
      originalEndTime: tsToIso(after.originalEndTime),
      extensionCount: safeNum(after.extensionCount) ?? 0,
      currentBid: safeNum(after.currentBid) ?? 0,
      currentBidderId: safeStr(after.currentBidderId),
      currentBidderAnonymousId: safeStr(after.currentBidderAnonymousId),
      bidCount: safeNum(after.bidCount) ?? 0,
      uniqueBidders: safeNum(after.uniqueBidders) ?? 0,
      lastBidTime: tsToIso(after.lastBidTime),
      status: after.status || 'upcoming',
      promoted: Boolean(after.promoted),
      promotedOrder: safeNum(after.promotedOrder),
      winningBidderId: safeStr(after.winningBidderId),
      winningBid: safeNum(after.winningBid),
      watcherCount: safeNum(after.watcherCount) ?? 0,
      title: safeStr(after.title),
      manufacturer: safeStr(after.manufacturer),
      model: safeStr(after.model),
      year: safeNum(after.year),
      thumbnailUrl: safeStr(after.thumbnailUrl),
      pickupLocation: safeStr(after.pickupLocation),
      paymentDeadlineDays: safeNum(after.paymentDeadlineDays) ?? 7,
      removalDeadlineDays: safeNum(after.removalDeadlineDays) ?? 14,
      storageFeePerDay: safeNum(after.storageFeePerDay) ?? 0,
      isTitledItem: Boolean(after.isTitledItem),
      titleDocumentFee: safeNum(after.titleDocumentFee) ?? 0,
    };

    logger.info(`[dual-write-auctions] Syncing lot ${lotId} (auction ${auctionId}) to PostgreSQL`);
    return guardedMutation('upsertAuctionLot', payload);
  }
);

// ─── Bid sync ──────────────────────────────────────────────────────────

exports.syncAuctionBidToPostgres = onDocumentWritten(
  { document: 'auctions/{auctionId}/lots/{lotId}/bids/{bidId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { auctionId, lotId, bidId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-auctions] Bid ${bidId} deleted`);
      return;
    }

    const payload = {
      id: bidId,
      auctionId,
      lotId,
      bidderId: after.bidderId || '',
      bidderAnonymousId: after.bidderAnonymousId || 'Bidder',
      amount: safeNum(after.amount) ?? 0,
      maxBid: safeNum(after.maxBid),
      type: after.type || 'manual',
      status: after.status || 'active',
      triggeredExtension: Boolean(after.triggeredExtension),
      bidTime: tsToIso(after.timestamp) || tsToIso(after.createdAt) || new Date().toISOString(),
    };

    logger.info(`[dual-write-auctions] Syncing bid ${bidId} (lot ${lotId}, auction ${auctionId}) to PostgreSQL`);
    return guardedMutation('insertAuctionBid', payload);
  }
);

// ─── Auction Invoice sync (top-level invoices with auctionId) ──────────
// Note: Auction invoices are stored in the top-level `invoices` collection
// but have auctionId + lotId fields. We filter for those in the trigger.

exports.syncAuctionInvoiceToPostgres = onDocumentWritten(
  { document: 'invoices/{invoiceId}', database: FIRESTORE_DB_ID, region: 'us-central1' },
  async (event) => {
    const { invoiceId } = event.params;
    const after = event.data?.after?.data();

    if (!after) {
      logger.info(`[dual-write-auctions] Invoice ${invoiceId} deleted`);
      return;
    }

    // Only process auction invoices (those with auctionId)
    if (!after.auctionId) return;

    const payload = {
      id: invoiceId,
      auctionId: after.auctionId,
      lotId: after.lotId || '',
      buyerId: after.buyerId || '',
      sellerId: after.sellerId || '',
      hammerPrice: safeNum(after.winningBid) ?? safeNum(after.hammerPrice) ?? 0,
      buyerPremium: safeNum(after.buyerPremium) ?? 0,
      documentationFee: safeNum(after.documentationFee) ?? safeNum(after.documentFee) ?? 0,
      cardProcessingFee: safeNum(after.cardProcessingFee) ?? 0,
      salesTaxRate: safeNum(after.salesTaxRate) ?? 0,
      salesTaxAmount: safeNum(after.salesTax) ?? safeNum(after.salesTaxAmount) ?? 0,
      salesTaxState: safeStr(after.salesTaxState),
      totalDue: safeNum(after.totalDue) ?? safeNum(after.total) ?? 0,
      currency: after.currency || 'usd',
      status: after.status || 'pending',
      paymentMethod: safeStr(after.paymentMethod),
      stripeInvoiceId: safeStr(after.stripeInvoiceId),
      stripeCheckoutSessionId: safeStr(after.stripeCheckoutSessionId),
      stripePaymentIntentId: safeStr(after.stripePaymentIntentId),
      buyerTaxExempt: Boolean(after.taxExempt),
      buyerTaxExemptState: safeStr(after.taxExemptState),
      buyerTaxExemptCertificateUrl: safeStr(after.taxExemptCertificateUrl),
      dueDate: tsToIso(after.dueDate),
      paidAt: tsToIso(after.paidAt),
      sellerCommission: safeNum(after.sellerCommission),
      sellerPayout: safeNum(after.sellerPayout),
      sellerPaidAt: tsToIso(after.sellerPaidAt),
    };

    logger.info(`[dual-write-auctions] Syncing auction invoice ${invoiceId} to PostgreSQL`);
    return guardedMutation('upsertAuctionInvoice', payload);
  }
);
