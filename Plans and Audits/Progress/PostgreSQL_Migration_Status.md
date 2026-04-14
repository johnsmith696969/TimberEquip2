# TimberEquip PostgreSQL Migration Status

**Date:** April 6, 2026
**Cloud SQL Instance:** `timberequip-dc` (us-central1)
**Database:** `timberequip`
**Data Connect Service:** `timberequip-marketplace`
**Total Tables:** 23 across 5 migration phases
**Total Dual-Write Triggers:** 20
**Backfill Status:** 580 listings migrated (0 errors)

---

## Executive Summary

TimberEquip is executing a **phased Firestore-to-PostgreSQL migration** using Firebase Data Connect as the bridge layer. The migration follows a dual-write pattern: Firestore remains the source of truth while PostgreSQL is progressively populated for governance, analytics, and operational queries. All 5 phases of SQL migrations are complete, 6 Data Connect connectors are configured with generated SDKs, 20 dual-write Cloud Function triggers are deployed, and 580 listings have been backfilled. The PostgreSQL read layer is live in the Admin Dashboard.

---

## 1. Migration Architecture

```
Firestore (Source of Truth)
    |
    v
onDocumentWritten Trigger (Cloud Function)
    |
    v
Data Connect Admin SDK (GraphQL mutations)
    |
    v
Cloud SQL PostgreSQL (Shadow + Analytics)
    |
    v
Data Connect Queries (Admin Dashboard, Reporting)
```

**Key principle:** Firestore writes are never blocked by PostgreSQL failures. All dual-write triggers use try/catch with Sentry error reporting and graceful degradation.

---

## 2. SQL Migration Phases

### Phase 1: Listing Governance (6 tables)

| Table | Purpose | Key Fields | Status |
|-------|---------|-----------|--------|
| `listings` | Listing shadow with multi-state governance | lifecycle_state, review_state, payment_state, inventory_state, visibility_state | COMPLETE |
| `listing_versions` | Immutable version snapshots | version_number, change_summary, snapshot_json | COMPLETE |
| `listing_state_transitions` | Audit trail of state changes | from_state, to_state, trigger, actor_uid | COMPLETE |
| `listing_anomalies` | Governance violation detection | anomaly_type, severity, resolved_at | COMPLETE |
| `listing_visibility_snapshots` | Point-in-time visibility records | lifecycle/review/payment/inventory/visibility states | COMPLETE |
| `listing_media_audits` | Image validation results | media_status, image_count, validation_errors | COMPLETE |

**Visibility Rules:**
- `public_live` = lifecycle=live + review=approved + payment=paid/waived + inventory=active
- `public_sold` = lifecycle=sold + review=approved + payment=paid/waived + inventory=sold

### Phase 2: Users & Billing (5 tables)

| Table | Purpose | Key Fields | Status |
|-------|---------|-----------|--------|
| `users` | Identity and account mirror | email, role, account_status, mfa_enabled, storefront_slug | COMPLETE |
| `storefronts` | Dealer display page data | user_id, slug, name, service_area, location | COMPLETE |
| `subscriptions` | Stripe subscription state | plan_id, status, stripe_subscription_id, listing_cap | COMPLETE |
| `invoices` | Payment records | amount, currency, status, stripe_invoice_id | COMPLETE |
| `seller_program_applications` | Onboarding records | plan_id, status, legal fields, consent fields | COMPLETE |

### Phase 3: Auctions (5 tables)

| Table | Purpose | Key Fields | Status |
|-------|---------|-----------|--------|
| `auctions` | Auction events | title, slug, status, lot_count, total_gmv, soft_close config | COMPLETE |
| `auction_lots` | Individual lots (flattened) | lot_number, starting/reserve/current/winning bid, status | COMPLETE |
| `auction_bids` | Bid records | bidder_id, amount, max_bid, type, triggered_extension | COMPLETE |
| `auction_invoices` | Settlement records | hammer_price, buyer_premium, total_due, payment_method | COMPLETE |
| `bidder_profiles` | Bidder verification data | verification_tier, id_verification_status, total_spent | COMPLETE |

### Phase 4: Leads & Inquiries (4 tables)

| Table | Purpose | Key Fields | Status |
|-------|---------|-----------|--------|
| `inquiries` | Buyer inquiries | listing_id, seller/buyer, type, status, spam_score | COMPLETE |
| `financing_requests` | Financing applications | applicant info, requested_amount, status | COMPLETE |
| `call_logs` | Phone call records | seller/caller, duration, status, recording_url | COMPLETE |
| `contact_requests` | Contact form submissions | name, email, category, message, status | COMPLETE |

### Phase 5: Dealer System (6 tables)

| Table | Purpose | Key Fields | Status |
|-------|---------|-----------|--------|
| `dealer_feed_profiles` | Feed configuration | source_type, feed_url, sync_mode/frequency, field_mapping | COMPLETE |
| `dealer_listings` | External-to-internal mapping | external_listing_id, equipment_hash, external_data | COMPLETE |
| `dealer_feed_ingest_logs` | Sync history | total_received/processed/created/updated/skipped | COMPLETE |
| `dealer_audit_logs` | Feed action audit | action, items_processed/succeeded/failed | COMPLETE |
| `dealer_webhook_subscriptions` | Push notification config | callback_url, events, active, failure_count | COMPLETE |
| `dealer_widget_configs` | Embeddable widget settings | card_style, accent_color, dark_mode, page_size | COMPLETE |

---

## 3. Data Connect Connectors (6 total)

| Connector | Queries | Mutations | Admin SDK | Client SDK | Status |
|-----------|---------|-----------|-----------|------------|--------|
| listing-governance | 5 | 12 | Generated | Generated | ACTIVE |
| marketplace | 6 | 3 | Generated | Generated | ACTIVE |
| billing | 5 | 5 | Generated | Generated | ACTIVE |
| auctions | 13 | 11 | Generated | Generated | ACTIVE |
| leads | 12 | 6 | Generated | Generated | ACTIVE |
| dealers | 11 | 7 | Generated | Generated | ACTIVE |

**Total:** 52 queries + 44 mutations = 96 Data Connect operations

### SDK Locations
- **Admin (Node.js):** `functions/generated/dataconnect/{connector}/index.cjs.js`
- **Client (React):** `src/lib/dataconnect/generated/{connector}/`

---

## 4. Dual-Write Triggers (20 functions)

### Phase 2: Users & Billing (5 triggers)

| Function | Firestore Path | PG Table |
|----------|---------------|----------|
| `syncUserToPostgres` | `users/{userId}` | `users` |
| `syncStorefrontToPostgres` | `storefronts/{uid}` | `storefronts` |
| `syncSubscriptionToPostgres` | `subscriptions/{subId}` | `subscriptions` |
| `syncInvoiceToPostgres` | `invoices/{invId}` | `invoices` |
| `syncSellerApplicationToPostgres` | `sellerApplications/{appId}` | `seller_program_applications` |

### Phase 3: Auctions (4 triggers)

| Function | Firestore Path | PG Table |
|----------|---------------|----------|
| `syncAuctionToPostgres` | `auctions/{auctionId}` | `auctions` |
| `syncAuctionLotToPostgres` | `auctions/{id}/lots/{lotId}` | `auction_lots` |
| `syncAuctionBidToPostgres` | `auctions/{id}/lots/{id}/bids` | `auction_bids` |
| `syncAuctionInvoiceToPostgres` | `auctionInvoices/{invId}` | `auction_invoices` |

### Phase 4: Leads (4 triggers)

| Function | Firestore Path | PG Table |
|----------|---------------|----------|
| `syncInquiryToPostgres` | `inquiries/{inquiryId}` | `inquiries` |
| `syncFinancingRequestToPostgres` | `financingRequests/{reqId}` | `financing_requests` |
| `syncCallLogToPostgres` | `calls/{callId}` | `call_logs` |
| `syncContactRequestToPostgres` | `contactRequests/{reqId}` | `contact_requests` |

### Phase 5: Dealers (6 triggers)

| Function | Firestore Path | PG Table |
|----------|---------------|----------|
| `syncDealerFeedProfileToPostgres` | `dealerFeedProfiles/{id}` | `dealer_feed_profiles` |
| `syncDealerListingToPostgres` | `dealerListings/{id}` | `dealer_listings` |
| `syncDealerIngestLogToPostgres` | `dealerFeedIngestLogs/{id}` | `dealer_feed_ingest_logs` |
| `syncDealerAuditLogToPostgres` | `dealerAuditLogs/{id}` | `dealer_audit_logs` |
| `syncDealerWebhookToPostgres` | `dealerWebhookSubscriptions/{id}` | `dealer_webhook_subscriptions` |
| `syncDealerWidgetConfigToPostgres` | `dealerWidgetConfigs/{id}` | `dealer_widget_configs` |

### Phase 1: Listing Governance (1 trigger + backfill)
- `syncListingToDataConnect` — On listing write, syncs to listing governance tables

---

## 5. Backfill Status

| Collection | Records | Errors | Script | Status |
|-----------|---------|--------|--------|--------|
| Listings | 580 | 0 | `backfill-listings-to-postgres.cjs` | COMPLETE |
| Users | Pending | - | Not yet run | PENDING |
| Storefronts | Pending | - | Not yet run | PENDING |
| Subscriptions | Pending | - | Not yet run | PENDING |
| Auctions | Pending | - | Not yet run | PENDING |
| Inquiries | Pending | - | Not yet run | PENDING |
| Dealer Feeds | Pending | - | Not yet run | PENDING |

**Backfill script usage:**
```bash
cd functions/
node backfill-listings-to-postgres.cjs [--write] [--limit <n>] [--page-size <n>]
# Dry-run by default. Add --write to actually persist.
```

---

## 6. Admin Dashboard — PostgreSQL Health Card

The Admin Dashboard overview tab now includes a **PostgreSQL Data Connect** card that queries all 6 connectors via `GET /admin/pg-analytics`:

- Overall health status (healthy/degraded)
- Per-connector health indicators
- Key metrics: PG listings count, open anomalies, active storefronts, new inquiries, dealer feeds
- Listings by lifecycle state breakdown
- Manual refresh with loading indicator
- Timestamp of last query

---

## 7. Index Strategy

All tables have targeted indexes for common query patterns:

| Pattern | Index Example |
|---------|--------------|
| Listing by state | `idx_listings_lifecycle_state` |
| User by email | `idx_users_email` |
| Subscription by status | `idx_subscriptions_status` |
| Inquiry by status + date | `idx_inquiries_status` (status, created_at DESC) |
| Auction by status + start | `idx_auctions_status_start` (status, start_time DESC) |
| Bids by lot + time | `idx_bids_auction_lot` (auction_id, lot_id, bid_time DESC) |
| Feed by seller | `idx_feed_seller` on seller_uid |

Partial indexes used where appropriate (e.g., `WHERE status = 'active'`).

---

## 8. What's Remaining

| Item | Priority | Effort | Notes |
|------|----------|--------|-------|
| Run remaining backfills (users, storefronts, etc.) | HIGH | 2 hrs | Scripts exist, need to execute |
| ~~Wire `dataconnect.yaml` into `firebase.json`~~ | ~~MEDIUM~~ | ~~30 min~~ | COMPLETE — Added `"dataconnect": { "source": "dataconnect" }` to firebase.json |
| Add PG read queries to Search page | LOW | 8 hrs | Currently uses Firestore |
| Add PG-backed analytics dashboard | LOW | 16 hrs | SQL aggregation queries |
| Data reconciliation job | LOW | 4 hrs | Verify Firestore/PG consistency |
| Automated backfill scheduling | LOW | 2 hrs | Currently manual only |

---

## 9. Migration Timeline

| Phase | Content | Tables | SQL Migration | Dual-Write | Backfill | Admin Read |
|-------|---------|--------|---------------|-----------|----------|-----------|
| 1 - Listing Governance | Listings, versions, transitions | 6 | DONE | DONE | 580 records | DONE |
| 2 - Users & Billing | Users, storefronts, subs, invoices | 5 | DONE | DONE | PENDING | DONE |
| 3 - Auctions | Auctions, lots, bids, invoices | 5 | DONE | DONE | PENDING | DONE |
| 4 - Leads | Inquiries, financing, calls, contact | 4 | DONE | DONE | PENDING | DONE |
| 5 - Dealers | Feeds, listings, logs, webhooks | 6 | DONE | DONE | PENDING | DONE |

**Overall PostgreSQL Migration: 85% Complete** — Schema + triggers + SDKs all done. Remaining backfills and finalization needed.
