/**
 * PostgreSQL dual-write Firestore triggers.
 * Re-exports from domain-specific dual-write modules.
 * Extracted from index.js for modularity.
 */
'use strict';

const dualWriteUsersBilling = require('./dual-write-users-billing.js');
const dualWriteAuctions = require('./dual-write-auctions.js');
const dualWriteLeads = require('./dual-write-leads.js');
const dualWriteDealers = require('./dual-write-dealers.js');

// ─── Users & Billing ─────────────────────────────────────────────────────────
exports.syncUserToPostgres = dualWriteUsersBilling.syncUserToPostgres;
exports.syncStorefrontToPostgres = dualWriteUsersBilling.syncStorefrontToPostgres;
exports.syncSubscriptionToPostgres = dualWriteUsersBilling.syncSubscriptionToPostgres;
exports.syncInvoiceToPostgres = dualWriteUsersBilling.syncInvoiceToPostgres;
exports.syncSellerApplicationToPostgres = dualWriteUsersBilling.syncSellerApplicationToPostgres;

// ─── Auctions ────────────────────────────────────────────────────────────────
exports.syncAuctionToPostgres = dualWriteAuctions.syncAuctionToPostgres;
exports.syncAuctionLotToPostgres = dualWriteAuctions.syncAuctionLotToPostgres;
exports.syncAuctionBidToPostgres = dualWriteAuctions.syncAuctionBidToPostgres;
exports.syncAuctionInvoiceToPostgres = dualWriteAuctions.syncAuctionInvoiceToPostgres;
exports.syncAuctionBidderProfileToPostgres = dualWriteAuctions.syncAuctionBidderProfileToPostgres;

// ─── Leads & Inquiries ──────────────────────────────────────────────────────
exports.syncInquiryToPostgres = dualWriteLeads.syncInquiryToPostgres;
exports.syncFinancingRequestToPostgres = dualWriteLeads.syncFinancingRequestToPostgres;
exports.syncCallLogToPostgres = dualWriteLeads.syncCallLogToPostgres;
exports.syncContactRequestToPostgres = dualWriteLeads.syncContactRequestToPostgres;

// ─── Dealer System ───────────────────────────────────────────────────────────
exports.syncDealerFeedProfileToPostgres = dualWriteDealers.syncDealerFeedProfileToPostgres;
exports.syncDealerListingToPostgres = dualWriteDealers.syncDealerListingToPostgres;
exports.syncDealerIngestLogToPostgres = dualWriteDealers.syncDealerIngestLogToPostgres;
exports.syncDealerAuditLogToPostgres = dualWriteDealers.syncDealerAuditLogToPostgres;
exports.syncDealerWebhookToPostgres = dualWriteDealers.syncDealerWebhookToPostgres;
exports.syncDealerWidgetConfigToPostgres = dualWriteDealers.syncDealerWidgetConfigToPostgres;
