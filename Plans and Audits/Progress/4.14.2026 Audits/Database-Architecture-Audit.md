# Database Architecture Audit — April 14, 2026

**Platform:** Forestry Equipment Sales (forestryequipmentsales.com)
**Databases:** Firestore (primary) + PostgreSQL 17 via Cloud SQL (shadow/analytics)

---

## 1. Architecture Overview

### Dual-Database Strategy

| Database | Role | Instance |
|----------|------|----------|
| Firestore | Primary read/write for all user-facing operations | `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c` |
| PostgreSQL 17 | Shadow tables via Firebase Data Connect, analytics, governance | `timberequip-dc` (Cloud SQL, `us-central1`) |

### Sync Mechanism: Firestore-to-PostgreSQL Dual-Write

Firestore `onDocumentWritten` triggers fire Cloud Functions that upsert data into PostgreSQL via Data Connect admin SDK mutations. Sync is non-blocking: failures log to Sentry but do not roll back Firestore writes.

**Dual-Write Functions:**
- `dual-write-users-billing.js` — Users, storefronts, subscriptions, invoices
- `dual-write-auctions.js` — Auctions, lots, bids, invoices, bidder profiles
- `dual-write-leads.js` — Inquiries, financing requests, call logs, contacts
- `dual-write-dealers.js` — Dealer feed profiles, listings, ingest logs, webhooks
- `listing-governance-dataconnect-sync.js` — Listing governance state machine

---

## 2. Firestore Collections (37 identified)

### Core Business
| Collection | Write Access | Read Access | Purpose |
|-----------|-------------|------------|---------|
| `users` | Self + Admin | Self + Admin + Peers | User profiles, roles, preferences |
| `listings` | Seller + Admin | Public | Equipment listings |
| `storefronts` | Owner + Admin | Public | Dealer storefront profiles |
| `inquiries` | Buyer + Admin | Seller + Admin | Lead/inquiry management |
| `calls` | System | Seller + Admin | Call tracking (Twilio) |
| `auctions` | Admin | Public | Auction events |
| `auctions/{id}/lots` | Admin | Public | Auction lots |
| `auctions/{id}/lots/{id}/bids` | Bidder | Admin + Bidder | Bid history |

### Billing & Legal
| Collection | Write Access | Read Access | Purpose |
|-----------|-------------|------------|---------|
| `invoices` | System (Stripe webhook) | Self + Admin | Payment invoices |
| `subscriptions` | System | Self + Admin | Subscription status |
| `sellerProgramApplications` | Self | Self + Admin | Seller onboarding |
| `sellerProgramAgreementAcceptances` | Self | Self + Admin | Legal acceptances |
| `consentLogs` | Self + System | Self | GDPR consent records |

### Audit & Operations
| Collection | Write Access | Read Access | Purpose |
|-----------|-------------|------------|---------|
| `auditLogs` | Admin only | Admin only | Administrative actions |
| `billingAuditLogs` | System only | Admin only | Stripe webhook events |
| `accountAuditLogs` | System only | Admin only | Account lifecycle events |
| `dealerAuditLogs` | Admin only | Admin only | Dealer feed operations |
| All audit collections | **Create-only** | — | Immutable by Firestore rules |

### Dealer System
| Collection | Write Access | Read Access | Purpose |
|-----------|-------------|------------|---------|
| `dealerFeedProfiles` | Admin | Admin + Dealer | Feed configuration |
| `dealerFeeds` | System | Admin | Feed data |
| `dealerListings` | System | Admin | Ingested dealer listings |
| `dealerFeedIngestLogs` | System | Admin | Ingest operation logs |

### Content & Config
| Collection | Write Access | Read Access | Purpose |
|-----------|-------------|------------|---------|
| `blogPosts` / `news` | Content Manager | Public | CMS content |
| `contentBlocks` | Content Manager | Public | Dynamic content blocks |
| `mediaLibrary` | Content Manager | Admin | Media assets |
| `publicConfigs` | Admin | Public | Feature flags, config |
| `savedSearches` | Self | Self | User saved searches |
| `notifications` | System | Self | User notifications |

---

## 3. PostgreSQL Schema (Data Connect)

### Tables by Phase

**Phase 1 — Listing Governance (7 tables)**
- `listings` — Five-state governance model (lifecycle, review, payment, inventory, visibility)
- `listing_versions` — Immutable snapshots at each transition
- `listing_state_transitions` — Full audit trail with actor/reason
- `listing_anomalies` — Anomaly detection and resolution tracking
- `listing_visibility_snapshots` — Debug snapshots for visibility changes
- `listing_media_audits` — Image validation records

**Phase 2 — Users & Billing (4 tables)**
- `users` — Core user records with JSONB metadata
- `storefronts` — Dealer storefront configuration
- `subscriptions` — Stripe subscription sync
- `invoices` — Payment invoice sync

**Phase 3 — Auctions (5 tables)**
- `auctions` — Auction events with soft-close mechanics
- `auction_lots` — Lot management with reserve pricing
- `auction_bids` — Manual and proxy bid tracking
- `auction_invoices` — Post-auction fee calculation
- `bidder_profiles` — Identity verification and payment methods

**Phase 4 — Leads (4 tables)**
- `inquiries` — Lead management with spam scoring
- `financing_requests` — Financing applications
- `call_logs` — Twilio call records
- `contact_requests` — General contact submissions

**Phase 5 — Dealers (6 tables)**
- `dealer_feed_profiles` — Feed sync configuration
- `dealer_listings` — Ingested external listings
- `dealer_feed_ingest_logs` — Sync operation metrics
- `dealer_audit_logs` — Dealer operation audit trail
- `dealer_webhook_subscriptions` — Webhook config
- `dealer_widget_configs` — Embeddable widget settings

### Index Coverage

All critical query paths have composite indexes defined:
- `listings(lifecycleState, updatedAt)` — Queue processing
- `auction_lots(auctionId, closeOrder)` — Lot closing sequence
- `auction_lots(auctionId, status)` — Active lot queries
- `dealer_listings(dealerFeedId, sellerUid, equipmentHash)` — Dedup

---

## 4. Scalability Assessment

### Current Capacity

| Metric | Current State | 10K Listings | 100K Listings | 1M Listings |
|--------|--------------|-------------|--------------|-------------|
| Firestore reads | Well within quota | OK | OK | Monitor quota |
| PostgreSQL queries | Indexed, paginated | OK | OK | Add read replicas |
| Admin bootstrap | Unpaginated | OK | Slow | Must paginate |
| Search (Fuse.js) | Client-side | OK | Slow | Server-side needed |
| Image variants | Cloud Function | OK | OK | Batch processing |

### Scaling Recommendations

1. **Admin bootstrap endpoint** — Currently fetches all data without pagination. Add cursor-based pagination before reaching 50K+ records.
2. **Search** — Fuse.js runs client-side. At 10K+ listings, migrate to server-side search (Algolia, Typesense, or PostgreSQL full-text).
3. **PostgreSQL read replicas** — Add when analytics queries compete with dual-write operations.
4. **Connection pooling** — Implement PgBouncer if Cloud SQL connections spike during high-traffic auctions.

---

## 5. Backup & Recovery

### Firestore Backups
- **Schedule:** Daily at 08:17 UTC via GitHub Actions
- **Retention:** 30 days (lifecycle policy enforced)
- **Bucket:** `mobile-app-equipment-sales-firestore-backups`
- **Script:** `scripts/firestore-backup.mjs` with dry-run support
- **Status:** OPERATIONAL

### PostgreSQL Backups
- **Cloud SQL automated backups:** Enabled by default (7-day retention)
- **Point-in-time recovery:** Available via Cloud SQL
- **Custom backup automation:** Not implemented
- **Recommendation:** Extend retention to 30 days; add weekly full backup export

### Recovery Procedures
- Documented in `ops/runbooks/FIRESTORE_BACKUP_RESTORE.md`
- Restore to staging first, validate, then production
- No automated restore testing (manual process)

---

## 6. Data Integrity Controls

### Firestore Security Rules (1,050+ lines)
- Field-level validation: Email regex, URL format (HTTPS only), string length limits
- Role enforcement: Custom claims + Firestore profile lookup (dual check)
- Immutable fields: `uid`, `role`, `parentAccountUid`, `accountAccessSource`
- Create-only audit logs: No updates/deletes permitted

### PostgreSQL Constraints
- NOT NULL on required fields
- String length limits via `@col(dataType: "...")` declarations
- Timestamp defaults: `@default(expr: "request.time")`
- **Gap:** No explicit foreign key constraints in Data Connect schema
- **Risk:** Orphan records possible if dual-write sync fails
- **Mitigation:** Backfill scripts can reconcile (`backfill-listing-dataconnect.cjs`)

### Transaction Support
- Firestore: `db.runTransaction()` for atomic operations (webhook idempotency)
- PostgreSQL: `@transaction` directive on Data Connect mutations (listing governance)
- Cross-database: Not supported (eventual consistency model)

---

## 7. Monitoring & Alerting

### Current State
- Structured logging via Pino → Cloud Logging
- Sentry error tracking with user context
- Firebase Performance Monitoring
- **Gap:** No Firestore-to-PostgreSQL consistency monitoring

### Recommended Additions
1. Cloud Monitoring dashboard for Firestore/PostgreSQL latency and error rates
2. Hourly consistency check job (compare row counts, critical record CRCs)
3. Alert on dual-write failure rate exceeding 1%
4. Alert on Firestore daily read quota approaching 80%

---

## 8. Action Items

| Priority | Item | Status |
|----------|------|--------|
| Critical | Extend Cloud SQL backup retention to 30 days | Pending |
| Critical | Add foreign key constraints or referential integrity checks | Pending |
| High | Paginate admin bootstrap endpoint | Pending |
| High | Implement Firestore ↔ PostgreSQL consistency monitoring | Pending |
| Medium | Add automated backup restore testing (monthly) | Pending |
| Medium | Implement connection pooling for Cloud SQL | Pending |
| Low | Evaluate server-side search for 10K+ listings | Future |
| Low | Add Cloud SQL read replicas for analytics | Future |

---

*Assessment Date: April 14, 2026*
*Status: Production-Ready with noted action items*
