# PostgreSQL Migration Plan — TimberEquip

**Date:** 2026-04-04
**Status:** Draft
**Author:** Claude Code
**Scope:** Full codebase audit, migration strategy, phased execution plan

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture](#2-current-architecture)
3. [Existing Scaffolding Inventory](#3-existing-scaffolding-inventory)
4. [Firestore Collections — Full Audit](#4-firestore-collections--full-audit)
5. [Migration Classification](#5-migration-classification)
6. [PostgreSQL Schema Design](#6-postgresql-schema-design)
7. [Firebase Data Connect Integration](#7-firebase-data-connect-integration)
8. [Phased Migration Plan](#8-phased-migration-plan)
9. [Dual-Write Strategy](#9-dual-write-strategy)
10. [Prerequisites & Infrastructure](#10-prerequisites--infrastructure)
11. [Risk Assessment](#11-risk-assessment)
12. [Rollback Strategy](#12-rollback-strategy)
13. [Verification & Testing](#13-verification--testing)
14. [Timeline Estimate](#14-timeline-estimate)

---

## 1. Executive Summary

TimberEquip currently runs entirely on Firestore across **50 collections** spanning two databases (a custom-named DB for marketplace data and the default DB for auctions). The platform handles equipment listings, user management, billing/subscriptions, auctions with real-time bidding, dealer feed ingestion, CMS, and email/notification systems.

**What already exists:** Significant governance scaffolding has been built — PostgreSQL migration SQL, Firebase Data Connect GraphQL schemas, state machine logic, and a backfill script. However, none of it is wired into production yet. The Cloud SQL instance has not been provisioned.

**Migration strategy:** Phased approach using Firebase Data Connect as the bridge layer. Move structured, relational data (listings, users, billing, auctions) to PostgreSQL while keeping real-time and config data in Firestore. Use dual-write during transition, then cut over reads, then decommission Firestore writes.

### Key Numbers
- **50** Firestore collections identified
- **30** collections recommended for PostgreSQL migration
- **12** collections recommended to stay in Firestore
- **8** collections recommended for deletion/consolidation
- **~25** server.ts API endpoints touching Firestore
- **~20** Cloud Functions with Firestore triggers
- **2** Firestore databases in use (custom + default)

---

## 2. Current Architecture

### 2.1 Firestore Databases

| Database | ID | Purpose |
|----------|-----|---------|
| Primary (Custom) | `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c` | Marketplace: listings, users, storefronts, billing, CMS |
| Default | `(default)` | Auctions: auctions, lots, bids, auction invoices |
| Staging Override | `(default)` | Both databases use default on staging |

### 2.2 Data Access Patterns

| Layer | Technology | Firestore Access |
|-------|-----------|-----------------|
| Client (React) | Firebase SDK v9 | Direct reads/writes via services (`equipmentService.ts`, `userService.ts`, etc.) |
| Server (Express) | Firebase Admin SDK | `server.ts` — billing webhooks, auction endpoints, admin APIs |
| Cloud Functions | Firebase Admin SDK | `functions/index.js` — triggers, scheduled jobs, email, feed ingestion |
| SSR (Public Pages) | Firebase Admin SDK | `functions/public-pages.js` — server-rendered SEO pages |

### 2.3 Real-Time Listeners

Active `onSnapshot` listeners exist in:
- `equipmentService.ts` — Market comparable listings monitoring
- `userService.ts` — User profile, saved searches
- `auctionService.ts` — Auction/lot/bid state
- `adminUserService.ts` — Admin dashboard data

### 2.4 Key Architectural Patterns

1. **Transaction-heavy operations:** Stripe webhook deduplication, sequential listing ID generation, auction bidding
2. **Denormalization:** User state replicated across users/subscriptions/invoices; seller info duplicated in users/storefronts; SEO read-model collections
3. **Batch operations:** Listing visibility suppression on subscription changes, auction activation
4. **Subcollection nesting:** `auctions/{id}/lots/{id}/bids/{id}`, `users/{id}/bidderProfile/profile`

---

## 3. Existing Scaffolding Inventory

### 3.1 Already Built (Not Yet Deployed)

| File | Purpose | Status |
|------|---------|--------|
| `database/postgres/migrations/001_listing_governance_phase1.sql` | Phase 1 schema: `listings`, `listing_versions`, `listing_state_transitions`, `listing_anomalies`, `listing_visibility_snapshots`, `listing_media_audits` tables with indexes, constraints, triggers | **Complete** — 244 lines |
| `dataconnect/dataconnect.yaml` | Firebase Data Connect service config (spec v1beta) | **Complete** — needs Cloud SQL instance ID |
| `dataconnect/schema/listing_governance.gql` | GraphQL type schema: Listing + 5 supporting types | **Complete** — 147 lines |
| `dataconnect/listingGovernance/connector.yaml` | Connector config with JS + Admin SDK generation | **Complete** |
| `dataconnect/listingGovernance/lifecycle.gql` | 4 queries + 8 mutations with auth/transaction decorators | **Complete** — 638 lines |
| `functions/listing-governance-rules.js` | State machine: 8 lifecycle states, 3 review states, 5 payment states, 4 inventory states, 4 visibility states, 12 anomaly codes | **Complete** — 200+ lines |
| `functions/listing-governance-artifacts.js` | Governance artifact evaluation + dual-write snapshot builder | **Complete** — 150+ lines |
| `functions/listing-lifecycle.js` | Lifecycle mutation patch builder: 9 actions with validation | **Complete** — 100+ lines |
| `scripts/backfill-listing-governance.cjs` | One-time governance backfill with dry-run mode | **Complete** — 197 lines |
| `database/postgres/listing_lifecycle_transition_matrix.json` | State machine definition: 8 states, 9 actions, 12 anomaly codes | **Complete** |
| `database/postgres/listing_governance_firestore_mapping.md` | Field-by-field Firestore → PostgreSQL mapping document | **Complete** |
| `ops/runbooks/LISTING_VISIBILITY_MISMATCH.md` | Visibility troubleshooting runbook | **Complete** |

### 3.2 Not Yet Done

| Item | Blocker |
|------|---------|
| Cloud SQL PostgreSQL instance | Not provisioned |
| `dataconnect.yaml` instance ID | Placeholder: `REPLACE_WITH_CLOUD_SQL_INSTANCE_ID` |
| `firebase.json` Data Connect section | Not wired |
| Generated SDKs (`src/lib/dataconnect/generated`) | Auto-generated after `firebase init dataconnect` |
| Generated Admin SDK (`functions/generated/dataconnect/`) | Auto-generated after init |
| Migration execution | SQL not deployed to any instance |
| Backfill execution | Script not run against production |
| Dual-write hooks | No Cloud Function triggers to sync Firestore → PostgreSQL |
| Read cutover | No code paths read from PostgreSQL yet |
| Authorization in Data Connect queries | No custom role checks beyond @auth(level: USER) |

---

## 4. Firestore Collections — Full Audit

### 4.1 Core User & Authentication (5 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `users` | Per-user | YES (onSnapshot) | HIGH | uid, displayName, email, role, subscription state, MFA, storefront, geo, SEO |
| `storefronts` | Per-dealer | NO | MEDIUM | uid, storefrontSlug, businessName, geo, serviceAreas, SEO |
| `dealers` | Per-dealer | NO | LOW | businessName, accountType, status, billingProfile |
| `dealerUsers` | Per-member | NO | LOW | dealerId, userUid, role, permissions |
| `dealerBranches` | Per-branch | NO | LOW | dealerId, name, location, metaOverrides |

### 4.2 Equipment & Listings (3 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `listings` | Per-listing | YES (market data) | VERY HIGH | title, category, make, model, year, price, condition, status, approval, payment, seller, images, location, specs |
| `news` | Per-article | NO | LOW | title, content, author, category, SEO |
| `blogPosts` | Per-post | NO | MEDIUM | title, content, authorUid, status, reviewStatus |

### 4.3 Billing & Subscriptions (5 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `subscriptions` | Per-subscription | NO | MEDIUM | userUid, planId, status, stripeSubscriptionId, currentPeriodEnd |
| `invoices` | Per-invoice | NO | MEDIUM | userUid, stripeInvoiceId, amount, status, items |
| `sellerProgramApplications` | Per-application | NO | LOW | userUid, legalFullName, company, terms acceptance |
| `sellerProgramAgreementAcceptances` | Per-acceptance | NO | LOW | Agreement records |
| `webhook_events` | Per-event | NO | LOW | Stripe event ID (idempotency key) |

### 4.4 Inquiry & Lead Management (4 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `inquiries` | Per-inquiry | NO | MEDIUM | listingId, sellerUid, buyerUid, message, type, status, spam detection, response tracking |
| `financingRequests` | Per-request | NO | LOW | listingId, applicantInfo, amount, status |
| `calls` | Per-call | NO | MEDIUM | listingId, sellerUid, callerUid, duration, status, recordingUrl (Twilio) |
| `contactRequests` | Per-request | NO | LOW | name, email, category, message |

### 4.5 Auction Platform (5 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `auctions` | Per-auction | YES | MEDIUM | name, slug, startTime, endTime, status, lotCount |
| `auctions/{id}/lots` | Per-lot (subcollection) | YES | MEDIUM | listingId, lotNumber, startingBid, reservePrice, currentBid, status |
| `auctions/{id}/lots/{id}/bids` | Per-bid (nested) | YES | HIGH | bidderId, amount, maxBid, type (direct/proxy), status |
| `auctionInvoices` | Per-invoice | NO | MEDIUM | auctionId, lotId, buyerId, sellerId, fees, tax, total, payment status |
| `users/{uid}/bidderProfile/profile` | Per-user | NO | LOW | verificationTier, preAuthStatus, stripeCustomerId, taxExempt |

### 4.6 Dealer Feed System (5 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `dealerFeedProfiles` | Per-dealer | NO | HIGH | sourceType, feedUrl, syncMode, fieldMapping, sync stats |
| `dealerFeeds` | Per-feed | NO | LOW | Processed feed state |
| `dealerListings` | Per-listing | NO | MEDIUM | externalId mapping, sync tracking |
| `dealerFeedIngestLogs` | Per-ingestion | NO | LOW | Ingestion execution history |
| `dealerAuditLogs` | Per-event | NO | LOW | Feed management audit trail |

### 4.7 Content Management (2 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `mediaLibrary` | Per-asset | NO | LOW | url, type, title, tags |
| `contentBlocks` | Per-block | NO | LOW | type, title, content, order |

### 4.8 Meta/Ad Integrations (2 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `dealerMetaConnections` | Per-connection | NO | MEDIUM | dealerId, businessId, pageId, adAccountId, pixelId, status |
| `dealerMetaValidationLogs` | Per-validation | NO | LOW | Validation audit results |

### 4.9 User Consent & Preferences (3 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `consentLogs` | Per-event | NO | LOW | userUid, type, decision, version |
| `emailPreferenceRecipients` | Per-recipient | NO | LOW | uid, email, scopes |
| `savedSearches` | Per-search | YES (onSnapshot) | MEDIUM | userUid, filters, alertPreferences |

### 4.10 Governance & Audit (4 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `listingStateTransitions` | Per-event | NO | LOW | listingId, transitionType, fromState, toState |
| `listingAuditReports` | Per-report | NO | LOW | reportType, status, summary |
| `listingMediaAudit` | Per-audit | NO | LOW | listingId, status, summary |
| `auditLogs` | Per-event | NO | LOW | adminUid, action, targetId |

### 4.11 System & Infrastructure (8 collections)

| Collection | Documents | Real-time | Complexity | Key Fields |
|-----------|-----------|-----------|------------|------------|
| `systemCounters` | Singleton | NO | LOW | listingSequence counter |
| `publicConfigs` | Singleton | NO | LOW | equipmentTaxonomy |
| `twilioNumbers` | Per-number | NO | LOW | Phone assignments |
| `equipmentDuplicates` | Per-hash | NO | LOW | Duplicate detection |
| `notifications` | Per-notification | NO | LOW | toUid, type, data, read |
| `inventorySnapshots` | Periodic | NO | LOW | Snapshot data |
| `billingAuditLogs` | Per-event | NO | LOW | Billing audit trail |
| `accountAuditLogs` | Per-event | NO | LOW | Account audit trail |
| `media-metadata` | Per-file | NO | LOW | Upload metadata |
| `user-storage-usage` | Per-user | NO | LOW | Storage tracking |
| `dealerWebhookSubscriptions` | Per-dealer | NO | LOW | Webhook event subscriptions |
| `mediaKitRequests` | Per-request | NO | LOW | Ad/media kit requests |

---

## 5. Migration Classification

### 5.1 MIGRATE to PostgreSQL (30 collections)

These collections have structured, relational data that benefits from SQL joins, aggregations, indexes, and referential integrity.

#### Tier 1 — Core Business Data (Phase 1-2)
| Collection | Rationale |
|-----------|-----------|
| `listings` | Core entity. Complex queries, joins to users/subscriptions, aggregations. Already has governance schema. |
| `users` | Core entity. Joins to listings, subscriptions, invoices. Role-based queries. |
| `storefronts` | 1:1 with dealer users. Slug-based lookups, geo queries. |
| `subscriptions` | Joins to users, temporal queries on period end, aggregate status checks. |
| `invoices` | Joins to users/subscriptions, billing analytics, date-range queries. |

#### Tier 2 — Auction Platform (Phase 3)
| Collection | Rationale |
|-----------|-----------|
| `auctions` | Core auction entity. Status queries, date-range filters. |
| `auctions/lots` (flatten from subcollection) | Complex bidding queries, window functions for highest bid per lot. |
| `auctions/lots/bids` (flatten from subcollection) | Bid history analytics, proxy resolution. Currently deeply nested. |
| `auctionInvoices` | Joins to auctions/lots/users, fee calculations, payment tracking. |

#### Tier 3 — Lead & Inquiry Management (Phase 4)
| Collection | Rationale |
|-----------|-----------|
| `inquiries` | Joins to listings/users, response time analytics, lead pipeline reporting. |
| `financingRequests` | Joins to listings/users, request tracking. |
| `calls` | Joins to listings/users, duration analytics, Twilio integration. |
| `contactRequests` | Simple structured data, query by status. |
| `mediaKitRequests` | Simple structured data. |

#### Tier 4 — Dealer System (Phase 5)
| Collection | Rationale |
|-----------|-----------|
| `dealers` | Joins to users/branches. |
| `dealerUsers` | Many-to-many: dealers ↔ users with roles/permissions. |
| `dealerBranches` | Geo data, joins to dealers. |
| `dealerFeedProfiles` | Complex feed config, joins to dealers. |
| `dealerListings` | External ID mapping, joins to listings. |
| `dealerFeedIngestLogs` | Temporal queries on ingestion history. |
| `dealerMetaConnections` | Joins to dealers/branches. |

#### Tier 5 — Content & CMS (Phase 6)
| Collection | Rationale |
|-----------|-----------|
| `news` | Simple structured content, full-text search potential. |
| `blogPosts` | Author joins, status filtering, full-text search. |
| `mediaLibrary` | Asset management with tags. |
| `contentBlocks` | Ordered content blocks. |

#### Tier 6 — Audit & Compliance (Phase 7)
| Collection | Rationale |
|-----------|-----------|
| `auditLogs` | Time-series analytics, joins to users. |
| `billingAuditLogs` | Billing event analytics. |
| `accountAuditLogs` | Account change tracking. |
| `listingStateTransitions` | Already designed for PostgreSQL in governance schema. |
| `listingAuditReports` | Already designed for PostgreSQL. |
| `listingMediaAudit` | Already designed for PostgreSQL. |

### 5.2 KEEP in Firestore (12 collections)

These collections benefit from Firestore's real-time listeners, simple key-value access, or are tightly coupled to Firebase features.

| Collection | Rationale |
|-----------|-----------|
| `users/{uid}/bidderProfile/profile` | Subcollection, real-time updates during auction, low volume per user |
| `consentLogs` | Append-only, compliance requirement, simple key-value |
| `emailPreferenceRecipients` | Real-time email preference checks in Cloud Functions |
| `savedSearches` | Real-time onSnapshot for alert preferences |
| `publicConfigs` | Singleton config document, rarely changes |
| `systemCounters` | Transactional counter (will migrate to PostgreSQL SEQUENCE eventually) |
| `notifications` | Real-time delivery to connected clients |
| `equipmentDuplicates` | Simple hash-based lookup, ephemeral |
| `twilioNumbers` | Simple config, low volume |
| `inventorySnapshots` | Periodic snapshots, low query needs |
| `dealerWebhookSubscriptions` | Simple event subscription config |
| `webhook_events` | Idempotency keys, short-lived (can add TTL) |

### 5.3 CONSOLIDATE or DELETE (8 collections)

| Collection | Action | Reason |
|-----------|--------|--------|
| `dealerFeeds` | Merge into `dealerFeedProfiles` | Redundant read-model |
| `dealerAuditLogs` | Merge into `auditLogs` | Separate audit table unnecessary |
| `dealerMetaValidationLogs` | Merge into `auditLogs` | Separate validation log unnecessary |
| `media-metadata` | Merge into `mediaLibrary` | Duplicate metadata tracking |
| `user-storage-usage` | Compute on-demand | Can be derived from media-metadata |
| `sellerProgramAgreementAcceptances` | Merge into `sellerProgramApplications` | Redundant acceptance tracking |
| `listingVisibilitySnapshots` | Already in PostgreSQL schema | Part of governance migration |
| `listingAnomalies` | Already in PostgreSQL schema | Part of governance migration |

---

## 6. PostgreSQL Schema Design

### 6.1 Existing Schema (Phase 1 — Listing Governance)

Already designed in `001_listing_governance_phase1.sql`:

```
listings                        — Core listing with governance fields
listing_versions                — Change history snapshots
listing_state_transitions       — Immutable audit log
listing_anomalies               — Anomaly detection tracking
listing_visibility_snapshots    — Visibility state history
listing_media_audits            — Image validation tracking
```

### 6.2 New Tables Required

#### Phase 2 — Users & Billing
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Firebase UID
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  phone_number TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  email_verified BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  location TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  company TEXT,
  business_name TEXT,
  street1 TEXT,
  street2 TEXT,
  city TEXT,
  state TEXT,
  county TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  account_status TEXT DEFAULT 'active',
  parent_account_uid TEXT REFERENCES users(id),
  account_access_source TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method TEXT,
  mfa_phone_number TEXT,
  mfa_enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storefronts table
CREATE TABLE storefronts (
  id TEXT PRIMARY KEY,                    -- Same as user ID
  user_id TEXT NOT NULL REFERENCES users(id),
  storefront_enabled BOOLEAN DEFAULT FALSE,
  storefront_slug TEXT UNIQUE,
  canonical_path TEXT,
  storefront_name TEXT,
  storefront_tagline TEXT,
  storefront_description TEXT,
  logo_url TEXT,
  cover_photo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  service_area_scopes JSONB DEFAULT '[]',
  service_area_states JSONB DEFAULT '[]',
  service_area_counties JSONB DEFAULT '[]',
  services_offered_categories JSONB DEFAULT '[]',
  services_offered_subcategories JSONB DEFAULT '[]',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- active, canceled, past_due, trialing
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  stripe_invoice_id TEXT UNIQUE,
  amount INTEGER NOT NULL,                -- cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, overdue, canceled
  items JSONB DEFAULT '[]',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seller program applications
CREATE TABLE seller_program_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  legal_full_name TEXT NOT NULL,
  legal_title TEXT,
  company_name TEXT,
  billing_email TEXT,
  phone_number TEXT,
  website TEXT,
  country TEXT,
  tax_id_or_vat TEXT,
  notes TEXT,
  accepted_terms BOOLEAN DEFAULT FALSE,
  accepted_privacy BOOLEAN DEFAULT FALSE,
  accepted_recurring_billing BOOLEAN DEFAULT FALSE,
  accepted_visibility_policy BOOLEAN DEFAULT FALSE,
  accepted_authority BOOLEAN DEFAULT FALSE,
  legal_terms_version TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Phase 3 — Auctions (flatten subcollections)
```sql
-- Auctions table
CREATE TABLE auctions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'preview',  -- preview, active, closed
  stagger_interval_min INTEGER DEFAULT 1,
  lot_count INTEGER DEFAULT 0,
  total_bids INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lots table (flattened from subcollection)
CREATE TABLE auction_lots (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auctions(id),
  listing_id TEXT REFERENCES listings(id),
  lot_number INTEGER NOT NULL,
  close_order INTEGER DEFAULT 0,
  starting_bid INTEGER,                   -- cents
  reserve_price INTEGER,                  -- cents
  buyer_premium_percent DECIMAL(5,2) DEFAULT 10.00,
  promoted BOOLEAN DEFAULT FALSE,
  promoted_order INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  storage_fee_per_day INTEGER DEFAULT 0,  -- cents
  payment_deadline_days INTEGER DEFAULT 5,
  removal_deadline_days INTEGER DEFAULT 14,
  is_titled_item BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  current_bid INTEGER DEFAULT 0,          -- cents
  current_bidder_id TEXT,
  current_bidder_anonymous_id TEXT,
  bid_count INTEGER DEFAULT 0,
  last_bid_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(auction_id, lot_number)
);

-- Bids table (flattened from deeply nested subcollection)
CREATE TABLE auction_bids (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auctions(id),
  lot_id TEXT NOT NULL REFERENCES auction_lots(id),
  bidder_id TEXT NOT NULL REFERENCES users(id),
  bidder_anonymous_id TEXT,
  amount INTEGER NOT NULL,                -- cents
  max_bid INTEGER,                        -- cents (proxy bid ceiling)
  type TEXT NOT NULL DEFAULT 'direct',    -- direct, proxy
  status TEXT NOT NULL DEFAULT 'active',  -- active, outbid, retracted
  triggered_extension BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auction invoices
CREATE TABLE auction_invoices (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auctions(id),
  lot_id TEXT NOT NULL REFERENCES auction_lots(id),
  buyer_id TEXT NOT NULL REFERENCES users(id),
  seller_id TEXT NOT NULL REFERENCES users(id),
  hammer_price INTEGER NOT NULL,          -- cents
  buyer_premium INTEGER NOT NULL,         -- cents
  document_fee INTEGER DEFAULT 0,         -- cents
  card_processing_fee INTEGER DEFAULT 0,  -- cents
  sales_tax_rate DECIMAL(6,5) DEFAULT 0,
  sales_tax_amount INTEGER DEFAULT 0,     -- cents
  sales_tax_state TEXT,
  total INTEGER NOT NULL,                 -- cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, overdue
  payment_method TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  buyer_tax_exempt BOOLEAN DEFAULT FALSE,
  buyer_tax_exempt_state TEXT,
  buyer_tax_exempt_certificate_url TEXT,
  payment_deadline TIMESTAMPTZ,
  removal_deadline TIMESTAMPTZ,
  seller_payout_amount INTEGER,           -- cents
  seller_payout_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Phase 4 — Leads & Inquiries
```sql
-- Inquiries / leads
CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  seller_uid TEXT NOT NULL REFERENCES users(id),
  buyer_uid TEXT REFERENCES users(id),
  buyer_name TEXT,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'Inquiry',   -- Inquiry, Financing, Shipping, Call
  status TEXT DEFAULT 'new',
  assigned_to_uid TEXT REFERENCES users(id),
  assigned_to_name TEXT,
  internal_notes TEXT,
  first_response_at TIMESTAMPTZ,
  response_time_minutes INTEGER,
  spam_score DECIMAL(5,2),
  spam_flags JSONB DEFAULT '[]',
  contact_consent_accepted BOOLEAN DEFAULT FALSE,
  contact_consent_version TEXT,
  contact_consent_scope TEXT,
  contact_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financing requests
CREATE TABLE financing_requests (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  seller_uid TEXT REFERENCES users(id),
  buyer_uid TEXT REFERENCES users(id),
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  company TEXT,
  requested_amount INTEGER,               -- cents
  message TEXT,
  status TEXT DEFAULT 'new',
  contact_consent_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call logs (Twilio)
CREATE TABLE call_logs (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  listing_title TEXT,
  seller_uid TEXT REFERENCES users(id),
  seller_name TEXT,
  seller_phone TEXT,
  caller_uid TEXT REFERENCES users(id),
  caller_name TEXT,
  caller_email TEXT,
  caller_phone TEXT,
  duration INTEGER DEFAULT 0,             -- seconds
  status TEXT NOT NULL,                   -- Initiated, Completed, Missed, Voicemail
  source TEXT,
  is_authenticated BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact requests
CREATE TABLE contact_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT,
  email TEXT NOT NULL,
  category TEXT,
  message TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Phase 5 — Dealer System
```sql
-- Dealers
CREATE TABLE dealers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  business_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'dealer',     -- dealer, fleet_dealer
  status TEXT DEFAULT 'active',
  billing_profile JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer team members
CREATE TABLE dealer_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  dealer_id TEXT NOT NULL REFERENCES dealers(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dealer_id, user_id)
);

-- Dealer branches
CREATE TABLE dealer_branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  dealer_id TEXT NOT NULL REFERENCES dealers(id),
  name TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  meta_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer feed profiles
CREATE TABLE dealer_feed_profiles (
  id TEXT PRIMARY KEY,
  seller_uid TEXT NOT NULL REFERENCES users(id),
  dealer_name TEXT,
  dealer_email TEXT,
  source_name TEXT,
  source_type TEXT,                       -- auto, json, xml, csv
  feed_url TEXT,
  api_endpoint TEXT,
  status TEXT DEFAULT 'active',
  sync_mode TEXT DEFAULT 'manual',        -- pull, push, manual
  sync_frequency TEXT DEFAULT 'manual',   -- hourly, daily, weekly, manual
  nightly_sync_enabled BOOLEAN DEFAULT FALSE,
  auto_publish BOOLEAN DEFAULT FALSE,
  field_mapping JSONB DEFAULT '[]',
  api_key_preview TEXT,                   -- First 8 chars only
  total_listings_synced INTEGER DEFAULT 0,
  total_listings_active INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer external listing mapping
CREATE TABLE dealer_listings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  seller_uid TEXT NOT NULL REFERENCES users(id),
  dealer_feed_id TEXT REFERENCES dealer_feed_profiles(id),
  listing_id TEXT REFERENCES listings(id),
  external_id TEXT NOT NULL,
  external_source TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dealer_feed_id, external_id)
);

-- Dealer feed ingestion logs
CREATE TABLE dealer_feed_ingest_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  actor_uid TEXT REFERENCES users(id),
  actor_role TEXT,
  seller_uid TEXT NOT NULL REFERENCES users(id),
  source_name TEXT,
  dry_run BOOLEAN DEFAULT FALSE,
  total_received INTEGER DEFAULT 0,
  created INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meta connections
CREATE TABLE dealer_meta_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  dealer_id TEXT NOT NULL REFERENCES dealers(id),
  branch_id TEXT REFERENCES dealer_branches(id),
  business_id TEXT,
  page_id TEXT,
  ad_account_id TEXT,
  catalog_id TEXT,
  pixel_id TEXT,
  instagram_business_id TEXT,
  permissions JSONB DEFAULT '{}',
  connected_by_user_id TEXT REFERENCES users(id),
  connected_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  last_validated_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Phase 6 — CMS
```sql
-- Blog posts
CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  content TEXT,
  author_uid TEXT REFERENCES users(id),
  status TEXT DEFAULT 'draft',            -- draft, published
  review_status TEXT DEFAULT 'pending',   -- pending, published, rejected
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords JSONB DEFAULT '[]',
  seo_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- News articles
CREATE TABLE news (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  author TEXT,
  date TIMESTAMPTZ,
  image TEXT,
  category TEXT,
  status TEXT DEFAULT 'published',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords JSONB DEFAULT '[]',
  seo_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media library
CREATE TABLE media_library (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  url TEXT NOT NULL,
  type TEXT,
  title TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  uploaded_by TEXT REFERENCES users(id),
  file_size INTEGER,
  dimensions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Phase 7 — Unified Audit Log
```sql
-- Consolidated audit log (replaces auditLogs, billingAuditLogs, accountAuditLogs, dealerAuditLogs)
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  domain TEXT NOT NULL,                   -- admin, billing, account, dealer, listing, meta
  actor_uid TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,                        -- user, listing, subscription, invoice, dealer, etc.
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_domain ON audit_logs(domain);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_uid);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 6.3 Critical Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent ON users(parent_account_uid);

-- Storefronts
CREATE INDEX idx_storefronts_slug ON storefronts(storefront_slug);
CREATE INDEX idx_storefronts_user ON storefronts(user_id);

-- Listings (extends existing governance indexes)
CREATE INDEX idx_listings_seller ON listings(seller_uid);
CREATE INDEX idx_listings_status_approval ON listings(status, approval_status, payment_status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_make ON listings(manufacturer);
CREATE INDEX idx_listings_expires ON listings(expires_at) WHERE status = 'active';
CREATE INDEX idx_listings_external ON listings(external_source_id) WHERE external_source_id IS NOT NULL;

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period ON subscriptions(current_period_end) WHERE status = 'active';

-- Invoices
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);

-- Auctions
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_slug ON auctions(slug);

-- Auction lots
CREATE INDEX idx_lots_auction ON auction_lots(auction_id);
CREATE INDEX idx_lots_listing ON auction_lots(listing_id);
CREATE INDEX idx_lots_status_end ON auction_lots(status, end_time);

-- Auction bids
CREATE INDEX idx_bids_lot ON auction_bids(lot_id);
CREATE INDEX idx_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX idx_bids_auction_lot ON auction_bids(auction_id, lot_id);
CREATE INDEX idx_bids_active ON auction_bids(lot_id, status) WHERE status = 'active';

-- Inquiries
CREATE INDEX idx_inquiries_seller ON inquiries(seller_uid);
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_uid);
CREATE INDEX idx_inquiries_listing ON inquiries(listing_id);
CREATE INDEX idx_inquiries_type ON inquiries(type);

-- Dealer feeds
CREATE INDEX idx_dealer_feeds_seller ON dealer_feed_profiles(seller_uid);
CREATE INDEX idx_dealer_listings_external ON dealer_listings(external_id, dealer_feed_id);
```

---

## 7. Firebase Data Connect Integration

### 7.1 Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  React App  │────→│  Data Connect   │────→│  Cloud SQL   │
│  (Client)   │     │  (GraphQL API)  │     │  PostgreSQL  │
└─────────────┘     └─────────────────┘     └──────────────┘
       │                    ↑
       │            ┌───────┘
       ↓            │
┌─────────────┐     │     ┌──────────────┐
│  Firestore  │     │     │ Cloud Funcs  │
│ (Real-time) │     └────→│ (Admin SDK)  │
└─────────────┘           └──────────────┘
```

### 7.2 Connector Strategy

Extend the existing `listingGovernance` connector and add new connectors:

```
dataconnect/
├── dataconnect.yaml
├── schema/
│   ├── listing_governance.gql   (exists)
│   ├── users.gql                (new)
│   ├── billing.gql              (new)
│   ├── auctions.gql             (new)
│   ├── leads.gql                (new)
│   ├── dealers.gql              (new)
│   └── cms.gql                  (new)
├── listingGovernance/           (exists)
│   ├── connector.yaml
│   └── lifecycle.gql
├── marketplace/                 (new)
│   ├── connector.yaml
│   └── queries.gql
├── billing/                     (new)
│   ├── connector.yaml
│   └── operations.gql
├── auctions/                    (new)
│   ├── connector.yaml
│   └── operations.gql
└── admin/                       (new)
    ├── connector.yaml
    └── operations.gql
```

### 7.3 SDK Generation

After `firebase init dataconnect`, SDKs auto-generate to:
- **Client:** `src/lib/dataconnect/generated/` — React hooks for queries/mutations
- **Admin:** `functions/generated/dataconnect/` — Node.js SDK for Cloud Functions/server.ts

### 7.4 Gradual Cutover Pattern

For each collection being migrated:

1. **Phase A (Dual-Write):** Firestore remains primary. Cloud Function trigger writes to PostgreSQL on every Firestore change.
2. **Phase B (Dual-Read):** Add PostgreSQL reads in parallel. Compare results. Log discrepancies.
3. **Phase C (PostgreSQL Primary):** Switch reads to PostgreSQL. Firestore becomes write-through cache for real-time features.
4. **Phase D (Firestore Decommission):** Remove Firestore writes. Delete Firestore collection.

---

## 8. Phased Migration Plan

### Phase 0: Infrastructure Setup (Prerequisites)

**Goal:** Provision Cloud SQL, wire Data Connect, generate SDKs.

- [ ] Provision Cloud SQL PostgreSQL instance in `us-central1`
  - Instance: `timberequip-production` (or staging first)
  - PostgreSQL version: 15+
  - Machine type: `db-g1-small` (can scale later)
  - Storage: 10GB SSD (auto-increase enabled)
  - Enable private IP if using VPC
- [ ] Update `dataconnect/dataconnect.yaml` with Cloud SQL instance ID
- [ ] Run `firebase init dataconnect` to validate config
- [ ] Add `dataconnect` section to `firebase.json`
- [ ] Deploy Data Connect service: `firebase deploy --only dataconnect`
- [ ] Verify generated SDKs in `src/lib/dataconnect/generated/` and `functions/generated/`
- [ ] Run existing migration `001_listing_governance_phase1.sql` against Cloud SQL
- [ ] Run backfill script `governance:backfill` in dry-run mode first, then with `--write`

### Phase 1: Listing Governance (Already Scaffolded)

**Goal:** Complete the existing governance migration. This is the foundation.

- [ ] Deploy listing governance schema (already exists)
- [ ] Wire `listing-governance-artifacts.js` dual-write trigger to actually write to PostgreSQL
- [ ] Add Cloud Function: `onListingWrite` → calls Data Connect `SubmitListing`/`ApproveListing`/etc.
- [ ] Test state transitions: draft → submitted → approved → live → expired/sold
- [ ] Validate governance read queries return correct data
- [ ] Add anomaly detection pipeline
- [ ] Deploy visibility mismatch monitoring (runbook already exists)

### Phase 2: Users, Storefronts, & Billing

**Goal:** Migrate core user and billing data to PostgreSQL.

**New migration file:** `002_users_billing.sql`

- [ ] Create `users`, `storefronts`, `subscriptions`, `invoices`, `seller_program_applications` tables
- [ ] Create Data Connect schema: `schema/users.gql`, `schema/billing.gql`
- [ ] Create connectors: `marketplace/queries.gql`, `billing/operations.gql`
- [ ] Write backfill script for users collection → PostgreSQL
- [ ] Write backfill script for storefronts → PostgreSQL
- [ ] Write backfill script for subscriptions/invoices → PostgreSQL
- [ ] Add dual-write Cloud Function triggers:
  - `onUserWrite` → Sync to PostgreSQL `users` table
  - `onStorefrontWrite` → Sync to PostgreSQL `storefronts` table
  - `onSubscriptionWrite` → Sync to PostgreSQL `subscriptions` table
- [ ] Update `server.ts` billing webhook to dual-write (Firestore + PostgreSQL)
- [ ] Add PostgreSQL read path for admin user bootstrap
- [ ] Validate user counts match between Firestore and PostgreSQL

### Phase 3: Auction Platform

**Goal:** Flatten nested auction subcollections into PostgreSQL tables.

**New migration file:** `003_auctions.sql`

- [ ] Create `auctions`, `auction_lots`, `auction_bids`, `auction_invoices` tables
- [ ] Create Data Connect schema: `schema/auctions.gql`
- [ ] Create connector: `auctions/operations.gql`
- [ ] Write backfill script to flatten `auctions/{id}/lots/{id}/bids/{id}` → flat tables
- [ ] Add dual-write in `server.ts` for:
  - `POST /api/auctions/place-bid` → Write to PostgreSQL `auction_bids`
  - `POST /api/auctions/close-lot` → Update `auction_lots`, create `auction_invoices`
  - `POST /api/auctions/activate` → Batch update `auction_lots`
- [ ] Keep Firestore for real-time bid display (read from Firestore, write to both)
- [ ] Add PostgreSQL queries for bid history, proxy resolution analytics
- [ ] Validate bid counts and amounts match

### Phase 4: Leads & Inquiries

**Goal:** Migrate lead management for analytics and joins.

**New migration file:** `004_leads.sql`

- [ ] Create `inquiries`, `financing_requests`, `call_logs`, `contact_requests` tables
- [ ] Create Data Connect schema: `schema/leads.gql`
- [ ] Write backfill scripts
- [ ] Add dual-write triggers
- [ ] Update admin lead pipeline to read from PostgreSQL (enables real SQL joins)
- [ ] Add response time analytics views

### Phase 5: Dealer System

**Goal:** Normalize the dealer data model with proper foreign keys.

**New migration file:** `005_dealers.sql`

- [ ] Create all dealer tables with foreign key relationships
- [ ] Write backfill scripts
- [ ] Add dual-write for dealer feed ingestion
- [ ] Update admin dealer management to use PostgreSQL
- [ ] Add proper unique constraints on external IDs

### Phase 6: CMS & Content

**Goal:** Move content to PostgreSQL for full-text search.

**New migration file:** `006_cms.sql`

- [ ] Create `blog_posts`, `news`, `media_library` tables
- [ ] Add PostgreSQL full-text search indexes (tsvector)
- [ ] Write backfill scripts
- [ ] Add dual-write triggers
- [ ] Update CMS admin to use PostgreSQL

### Phase 7: Audit Log Consolidation

**Goal:** Merge 6 separate audit collections into one PostgreSQL table.

**New migration file:** `007_audit_logs.sql`

- [ ] Create unified `audit_logs` table
- [ ] Backfill from: `auditLogs`, `billingAuditLogs`, `accountAuditLogs`, `dealerAuditLogs`, `dealerMetaValidationLogs`, `listingStateTransitions`
- [ ] Add domain-based routing in Cloud Functions
- [ ] Set up log retention policies (partition by month, drop after 2 years)

### Phase 8: Read Cutover & Firestore Decommission

**Goal:** Switch all reads to PostgreSQL, remove Firestore dependencies.

- [ ] Switch client-side service files to use Data Connect generated SDK
- [ ] Replace `equipmentService.ts` Firestore queries with PostgreSQL queries
- [ ] Replace `userService.ts` profile reads with PostgreSQL (keep onSnapshot for notifications only)
- [ ] Replace `adminUserService.ts` with PostgreSQL admin queries
- [ ] Update `public-pages.js` SSR to read from PostgreSQL
- [ ] Remove Firestore security rules for migrated collections
- [ ] Delete Firestore collections (after validation period)
- [ ] Remove unused Firestore indexes

---

## 9. Dual-Write Strategy

### 9.1 Architecture

```
Client Write → Firestore → Cloud Function Trigger → PostgreSQL (via Data Connect)
                               ↓
                        Validate consistency
```

### 9.2 Implementation Pattern

```javascript
// functions/index.js — Example dual-write trigger
exports.syncListingToPostgres = onDocumentWritten(
  { document: 'listings/{listingId}', database: FIRESTORE_DB_ID },
  async (event) => {
    const { listingId } = event.params;
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    if (!after) {
      // Document deleted — soft-delete in PostgreSQL
      await dataConnect.mutation('ArchiveListing', { id: listingId });
      return;
    }

    if (!before) {
      // Document created — INSERT into PostgreSQL
      await dataConnect.mutation('CreateListing', mapFirestoreToPostgres(after));
      return;
    }

    // Document updated — UPDATE in PostgreSQL
    await dataConnect.mutation('UpdateListing', {
      id: listingId,
      ...mapFirestoreToPostgres(after),
    });
  }
);
```

### 9.3 Conflict Resolution

- **Firestore is source of truth** during dual-write phase
- PostgreSQL is eventually consistent (seconds behind)
- If PostgreSQL write fails, log error and retry (dead letter queue)
- Nightly reconciliation job compares counts and checksums

### 9.4 Monitoring

- Cloud Function error rate for sync triggers
- Row count comparison: Firestore collection count vs PostgreSQL `SELECT COUNT(*)`
- Checksum validation on critical fields (price, status, amounts)
- Alerting on sync lag > 60 seconds

---

## 10. Prerequisites & Infrastructure

### 10.1 Cloud SQL Setup

```bash
# Create Cloud SQL instance
gcloud sql instances create timberequip-production \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10 \
  --storage-auto-increase \
  --availability-type=zonal \
  --backup-start-time=04:00

# Create database
gcloud sql databases create timberequip \
  --instance=timberequip-production

# Create service account for Data Connect
gcloud sql users create dataconnect-sa \
  --instance=timberequip-production \
  --type=CLOUD_IAM_SERVICE_ACCOUNT
```

### 10.2 Firebase Data Connect Setup

```bash
# Initialize Data Connect (may already be partially done)
firebase init dataconnect

# Deploy schema
firebase deploy --only dataconnect

# Generate client SDK
firebase dataconnect:sdk:generate
```

### 10.3 Package Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "@firebaseextensions/firebase-data-connect": "^0.x.x"
  }
}
```

Add to `functions/package.json`:
```json
{
  "dependencies": {
    "firebase-admin": "^12.x.x"
  }
}
```

### 10.4 Environment Variables

```bash
# New secrets for Cloud SQL (if direct access needed)
firebase functions:secrets:set CLOUD_SQL_CONNECTION_NAME
firebase functions:secrets:set CLOUD_SQL_DATABASE
```

---

## 11. Risk Assessment

### 11.1 High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | Critical | Backfill scripts have dry-run mode; validate counts before/after |
| Dual-write inconsistency | High | Nightly reconciliation job; Firestore remains source of truth |
| Real-time features break | High | Keep Firestore for real-time listeners until Phase 8 |
| Auction bidding race conditions | High | Transaction isolation in PostgreSQL; keep Firestore transactions during dual-write |
| Cloud SQL cost surprise | Medium | Start with smallest instance; monitor query patterns |

### 11.2 Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data Connect SDK breaking changes | Medium | Pin SDK versions; test in staging |
| Firestore trigger ordering | Medium | Idempotent sync functions; dedup by version |
| Query performance regression | Medium | Create indexes before cutover; benchmark critical queries |
| Increased latency (Firestore→PG hop) | Medium | Data Connect has built-in connection pooling |

### 11.3 Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema migration conflicts | Low | Sequential numbered migrations; version control |
| Storage costs | Low | PostgreSQL typically cheaper than Firestore at scale |
| Team learning curve | Low | Data Connect abstracts SQL behind GraphQL |

---

## 12. Rollback Strategy

### Per-Phase Rollback

Each phase can be rolled back independently:

1. **Stop dual-write triggers** — Disable the Cloud Function
2. **Reads already on Firestore** — No client-side changes needed during dual-write phases
3. **Drop PostgreSQL tables** — Clean slate if needed
4. **Re-enable Firestore-only path** — Remove Data Connect SDK calls

### Full Rollback

If the entire migration needs to be abandoned:

1. Remove all dual-write Cloud Functions
2. Revert client-side service files to Firestore-only
3. Drop all PostgreSQL tables
4. Remove Data Connect configuration from `firebase.json`
5. Delete Cloud SQL instance

**Data safety:** Firestore data is never deleted until Phase 8 (final decommission). All prior phases are additive only.

---

## 13. Verification & Testing

### 13.1 Per-Phase Verification

For each phase, before proceeding:

- [ ] **Row count match:** Firestore document count == PostgreSQL row count
- [ ] **Field-level checksum:** Sample 100 random documents, verify all fields match
- [ ] **Query result match:** Run equivalent queries on both systems, compare results
- [ ] **Write consistency:** Create/update/delete in Firestore, verify PostgreSQL mirrors it within 5 seconds
- [ ] **Performance benchmark:** PostgreSQL query latency < Firestore query latency for complex queries
- [ ] **Build passes:** `npx vite build` clean
- [ ] **No client-side errors:** Check Sentry for new error patterns

### 13.2 Staging Environment

- Deploy each phase to staging first
- Run all backfill scripts against staging Firestore
- Validate dual-write for 48 hours before production
- Load test critical endpoints (bidding, billing webhooks)

### 13.3 Reconciliation Script

```javascript
// scripts/reconcile-firestore-postgres.mjs
// For each migrated collection:
// 1. Count documents in Firestore
// 2. Count rows in PostgreSQL
// 3. Sample N random documents and compare field values
// 4. Report discrepancies
// 5. Run nightly via Cloud Scheduler
```

---

## 14. Timeline Estimate

| Phase | Description | Dependencies | Estimated Effort |
|-------|-------------|-------------|-----------------|
| **Phase 0** | Infrastructure Setup | None | Small |
| **Phase 1** | Listing Governance | Phase 0 | Small (scaffolding exists) |
| **Phase 2** | Users & Billing | Phase 0 | Medium |
| **Phase 3** | Auction Platform | Phase 2 (needs users FK) | Medium-Large |
| **Phase 4** | Leads & Inquiries | Phase 2 (needs users/listings FK) | Small-Medium |
| **Phase 5** | Dealer System | Phase 2 (needs users FK) | Medium |
| **Phase 6** | CMS & Content | Phase 2 (needs users FK) | Small |
| **Phase 7** | Audit Consolidation | All prior phases | Small |
| **Phase 8** | Read Cutover | All prior phases stable | Large |

### Recommended Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 + Phase 4 (parallel) → Phase 5 → Phase 6 + Phase 7 (parallel) → Phase 8
```

---

## Appendix A: Files That Will Change Per Phase

### Phase 0
- `dataconnect/dataconnect.yaml` (update instance ID)
- `firebase.json` (add dataconnect section)
- `package.json` (add Data Connect SDK)

### Phase 1
- `functions/index.js` (add listing sync trigger)
- `functions/listing-governance-artifacts.js` (wire actual PostgreSQL writes)

### Phase 2
- `database/postgres/migrations/002_users_billing.sql` (new)
- `dataconnect/schema/users.gql` (new)
- `dataconnect/schema/billing.gql` (new)
- `dataconnect/marketplace/connector.yaml` (new)
- `dataconnect/marketplace/queries.gql` (new)
- `dataconnect/billing/connector.yaml` (new)
- `dataconnect/billing/operations.gql` (new)
- `scripts/backfill-users.mjs` (new)
- `scripts/backfill-billing.mjs` (new)
- `functions/index.js` (add user/storefront/subscription sync triggers)
- `server.ts` (dual-write in billing webhook)

### Phase 3
- `database/postgres/migrations/003_auctions.sql` (new)
- `dataconnect/schema/auctions.gql` (new)
- `dataconnect/auctions/connector.yaml` (new)
- `dataconnect/auctions/operations.gql` (new)
- `scripts/backfill-auctions.mjs` (new)
- `server.ts` (dual-write in auction endpoints)

### Phase 4
- `database/postgres/migrations/004_leads.sql` (new)
- `dataconnect/schema/leads.gql` (new)
- `scripts/backfill-leads.mjs` (new)
- `functions/index.js` (add inquiry/call sync triggers)

### Phase 5
- `database/postgres/migrations/005_dealers.sql` (new)
- `dataconnect/schema/dealers.gql` (new)
- `scripts/backfill-dealers.mjs` (new)
- `functions/index.js` (add dealer sync triggers)

### Phase 6
- `database/postgres/migrations/006_cms.sql` (new)
- `dataconnect/schema/cms.gql` (new)
- `scripts/backfill-cms.mjs` (new)

### Phase 7
- `database/postgres/migrations/007_audit_logs.sql` (new)
- `scripts/backfill-audit-logs.mjs` (new)
- `functions/index.js` (route all audit writes to unified table)

### Phase 8
- `src/services/equipmentService.ts` (switch to Data Connect)
- `src/services/userService.ts` (switch to Data Connect)
- `src/services/adminUserService.ts` (switch to Data Connect)
- `src/services/billingService.ts` (switch to Data Connect)
- `src/services/cmsService.ts` (switch to Data Connect)
- `functions/public-pages.js` (switch to Data Connect)
- `firestore.rules` (remove migrated collection rules)

---

## Appendix B: SQL Benefits by Query Pattern

| Current Firestore Pattern | PostgreSQL Improvement |
|--------------------------|----------------------|
| Count active listings per seller (multiple reads + client filter) | `SELECT COUNT(*) FROM listings WHERE seller_uid = $1 AND status = 'active'` |
| Join user + subscription + invoice (3 separate reads) | Single `JOIN` query |
| Highest bid per lot (query all bids, sort client-side) | `SELECT DISTINCT ON (lot_id) * FROM auction_bids ORDER BY lot_id, amount DESC` |
| Proxy bid resolution (multiple reads + re-query) | Window function: `ROW_NUMBER() OVER (PARTITION BY lot_id ORDER BY amount DESC)` |
| Listing expiration check (scan all active listings) | `SELECT * FROM listings WHERE status = 'active' AND expires_at < NOW()` with index |
| Admin dashboard aggregations (count docs per collection) | `SELECT role, COUNT(*) FROM users GROUP BY role` |
| Lead response time analytics (read all, compute client-side) | `SELECT AVG(response_time_minutes) FROM inquiries WHERE seller_uid = $1` |
| Full-text search on blog/news | `WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery($1)` |
| Dealer feed external ID dedup | `UNIQUE(dealer_feed_id, external_id)` constraint |
| Sequential listing ID | `SERIAL` or `SEQUENCE` (no transaction loop needed) |

---

## Appendix C: Firestore Collections Staying — Justification

| Collection | Why It Stays |
|-----------|-------------|
| `savedSearches` | Real-time onSnapshot for alert preferences; low volume |
| `notifications` | Real-time delivery to connected clients |
| `bidderProfile` (subcollection) | Nested under users; real-time auction state |
| `consentLogs` | Append-only compliance data; simple key-value |
| `emailPreferenceRecipients` | Real-time checks in email sending pipeline |
| `publicConfigs` | Singleton config; rarely changes; powers taxonomy |
| `systemCounters` | Will migrate to PostgreSQL SEQUENCE in Phase 1 |
| `equipmentDuplicates` | Ephemeral hash lookups; no query needs |
| `twilioNumbers` | Simple config; <10 documents |
| `inventorySnapshots` | Periodic snapshots; low query needs |
| `webhook_events` | Short-lived idempotency keys; TTL cleanup |
| `dealerWebhookSubscriptions` | Simple event config; <50 documents |

---

*End of PostgreSQL Migration Plan*
