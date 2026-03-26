# TimberEquip Enterprise Data Platform Plan

## Purpose

This plan defines how TimberEquip should evolve from a Firebase-first marketplace into a more predictable enterprise platform built around:

- Cloud SQL for PostgreSQL
- Firebase Data Connect
- Cloud Run workers
- BigQuery

The goal is not a rewrite for its own sake. The goal is to move the parts of the system that need stronger governance, lower operational surprise, richer data relationships, and better reporting onto infrastructure that fits those needs.

## Decision

TimberEquip should move toward this target stack:

- public website and authenticated app: React
- identity and edge delivery: Firebase Auth plus Hosting
- canonical marketplace data model: PostgreSQL on Cloud SQL
- app-safe data access: Firebase Data Connect
- asynchronous processing and integration logic: Cloud Run workers
- warehouse and BI: BigQuery
- Firestore: reduced to narrow supporting roles only where it is still a good fit

## Why This Change Is Needed

The current platform has outgrown a Firestore-heavy architecture for several important workloads:

- listing lifecycle governance needs formal transition enforcement and auditable state changes
- dealer hierarchy needs relational structure for parent dealer, branch, membership, and permission models
- dealer ingestion needs lineage, deduplication, reconciliation, and operator tooling
- public SEO and route generation currently depend too much on read-heavy derived models
- BI and operational reporting need a warehouse, not ad hoc document reads

The current Firestore model is still useful in places, but it is not the right long-term backbone for:

- enterprise dealer account structure
- canonical listing state transitions
- source lineage and reconciliation
- operator workflows
- warehouse analytics

## Non-Negotiable Principles

- One canonical source of truth for marketplace core entities
- Clients do not mutate lifecycle-critical fields directly
- All listing visibility changes must be auditable
- Dealer ingestion must preserve source lineage
- Public SEO should read from pre-shaped data, not broad request-time scans
- BI should come from BigQuery, not transactional queries against the app database
- Rollout should be incremental, with dual-write and shadow-read periods where needed

## Target Architecture

### 1. React Surfaces

Primary surfaces:

- `www.timberequip.com` for public marketplace and SEO
- `app.timberequip.com` for seller, dealer, and admin workflows

Responsibilities:

- public listing pages
- dealer storefronts
- authenticated inventory management
- billing and account flows
- admin and operator tooling

### 2. Cloud SQL for PostgreSQL

This becomes the canonical system of record for enterprise marketplace data.

Move into PostgreSQL:

- dealers
- dealer branches
- dealer memberships
- listings
- listing lifecycle states
- listing state transitions
- listing anomalies
- dealer feed sources
- feed runs
- feed source records
- duplicate clusters
- reconciliation cases
- Meta connection models
- operator audit records

Keep PostgreSQL responsible for:

- relational integrity
- transaction-safe state transitions
- uniqueness and dedupe constraints
- historical lineage
- operator-grade auditability

### 3. Firebase Data Connect

Use Data Connect as the main application-facing access layer for the new Postgres-backed model.

Use it for:

- typed reads and writes from the app
- secure role-scoped access patterns
- dealer and admin queries
- listing lifecycle mutation endpoints
- clean client SDK generation for React

Data Connect is a strong fit because it keeps the Firebase ecosystem in place while moving the core data model onto PostgreSQL.

### 4. Cloud Run Workers

Use Cloud Run workers for the parts of the system that should not live in client code or request-path React logic.

Primary worker responsibilities:

- DealerOS and partner feed ingestion
- normalization and mapping
- duplicate detection
- reconciliation jobs
- lifecycle orchestration jobs
- anomaly detection
- scheduled rebuilds for public route artifacts
- batch exports into BigQuery
- operational webhooks and partner callbacks

Cloud Run should own the heavier async logic, not Firebase Hosting pages and not Firestore-trigger sprawl.

### 5. BigQuery

BigQuery becomes the warehouse and reporting system.

Send these domains into BigQuery:

- listing transitions
- listing visibility history
- feed runs
- feed parse errors
- duplicate clusters
- reconciliation actions
- dealer performance metrics
- lead and inquiry events
- billing and subscription events
- SEO artifact health and route coverage

BigQuery should support:

- operator dashboards
- SLA monitoring
- dealer success reporting
- inventory freshness reporting
- anomaly trend analysis
- future ML-assisted matching and ranking work

### 6. Firestore

Firestore should be reduced, not necessarily removed.

Good remaining roles for Firestore:

- lightweight user-facing preferences
- temporary drafts
- narrow realtime UX where relational rigor is not required
- selected cached public artifacts during transition

Firestore should no longer be the long-term canonical home for marketplace core governance.

## Domain Model Direction

### Canonical Dealer Model

Recommended core entities:

- `organizations`
- `dealers`
- `dealer_branches`
- `dealer_memberships`
- `dealer_roles`
- `dealer_meta_connections`
- `dealer_meta_validation_logs`

Key rules:

- one dealer can own many branches
- one user can belong to many dealers through membership records
- permissions are granted through memberships and roles, not embedded arrays
- every Meta asset relationship is tied to a dealer or branch and is auditable

### Canonical Listing Governance Model

Recommended core entities:

- `listings`
- `listing_versions`
- `listing_visibility_snapshots`
- `listing_state_transitions`
- `listing_anomalies`
- `listing_media_audits`

Recommended lifecycle principle:

- replace loosely coordinated `status`, `approvalStatus`, and `paymentStatus` mutations with a server-controlled state machine

Recommended transition actions:

- submit
- approve
- reject
- payment_confirmed
- publish
- expire
- relist
- mark_sold
- archive

Every transition should write:

- actor
- previous state
- next state
- reason
- request context
- timestamp
- source system

### Dealer Aggregation And Ingestion Model

Recommended core entities:

- `feed_sources`
- `feed_credentials`
- `feed_runs`
- `feed_run_events`
- `source_records`
- `canonical_listing_mappings`
- `duplicate_clusters`
- `reconciliation_cases`
- `operator_actions`

Each ingested record should retain:

- source feed ID
- source record ID
- normalized payload hash
- canonical listing ID if matched
- duplicate cluster ID if applicable
- run ID
- status
- last successful parse metadata

This is the foundation for enterprise ingestion behavior:

- lineage
- dedupe
- replay
- reconciliation
- SLA measurement
- operator tooling

## Public SEO And Marketplace Read Model

The public website should not assemble major route families from broad database scans on demand.

Target approach:

- Cloud Run worker builds route artifacts from Postgres
- route artifacts are written to a public-serving store
- React and SSR read from those shaped artifacts
- BigQuery records route generation health and freshness

Recommended artifact families:

- market hubs
- category pages
- manufacturer pages
- manufacturer plus model pages
- state pages
- dealer storefront pages
- sitemap entries

## BigQuery Warehouse Shape

Recommended dataset families:

- `core_marketplace`
- `dealer_ingestion`
- `listing_governance`
- `billing_reporting`
- `lead_reporting`
- `seo_reporting`

Recommended first marts:

- listing visibility by day
- listing transition audit mart
- dealer inventory freshness mart
- feed success and failure mart
- duplicate cluster and reconciliation mart
- lead funnel by dealer and listing
- SEO route coverage and freshness mart

## Current-To-Target Migration Map

This is the first-pass mapping from the current Firebase-oriented model to the target enterprise platform.

### Current Firestore Collections

- `listings`
- `dealerFeeds`
- `dealerListings`
- `dealerAuditLogs`
- `equipmentDuplicates`
- `dealers`
- `dealerUsers`
- `dealerBranches`
- `dealerMetaConnections`
- `dealerMetaValidationLogs`
- `listingAuditReports`
- `listingStateTransitions`
- `listingMediaAudit`
- `publicListings`
- `publicDealers`
- `seoRouteIndex`

### Target Canonical Homes

- `listings` -> PostgreSQL `listings`, `listing_versions`, `listing_visibility_snapshots`
- `listingStateTransitions` -> PostgreSQL `listing_state_transitions`
- `listingAuditReports` -> PostgreSQL `listing_anomalies`
- `listingMediaAudit` -> PostgreSQL `listing_media_audits`
- `dealers` -> PostgreSQL `dealers`
- `dealerBranches` -> PostgreSQL `dealer_branches`
- `dealerUsers` -> PostgreSQL `dealer_memberships`
- `dealerMetaConnections` -> PostgreSQL `dealer_meta_connections`
- `dealerMetaValidationLogs` -> PostgreSQL `dealer_meta_validation_logs`
- `dealerFeeds` -> PostgreSQL `feed_sources`
- `dealerListings` -> PostgreSQL `source_records` and `canonical_listing_mappings`
- `dealerAuditLogs` -> PostgreSQL `operator_actions` and `feed_run_events`
- `equipmentDuplicates` -> PostgreSQL `duplicate_clusters`
- `publicListings`, `publicDealers`, `seoRouteIndex` -> derived route artifacts built from PostgreSQL by Cloud Run workers

### BigQuery Feeds

These domains should be exported or streamed into BigQuery after canonicalization:

- listing transitions
- listing anomalies
- feed runs and parse failures
- duplicate and reconciliation activity
- dealer performance and inventory freshness
- public route generation health
- billing and lead events

### Firestore Retained During Transition

Firestore can remain temporarily responsible for:

- selected current app reads while dual-write is active
- transitional cached public artifacts
- low-risk auxiliary UX data

But the goal is to stop adding new enterprise-critical responsibilities to Firestore.

## Rollout Strategy

### Phase 0: Architecture And Safety Rails

Objective:

- define the new source of truth without breaking the live site

Deliverables:

- approved schema direction
- environment layout for Cloud SQL, Data Connect, Cloud Run, and BigQuery
- migration rules for what stays in Firestore versus what moves
- cost guardrails and observability requirements

### Phase 1: Listing Lifecycle Governance First

Objective:

- fix trust and predictability before broader migration

Deliverables:

- canonical listing schema
- formal state machine
- transition service
- `listing_state_transitions`
- `listing_anomalies`
- operator visibility for invalid state combinations

Why first:

- this is the highest-trust part of the marketplace
- public visibility depends on it
- it creates the governance backbone for later ingestion and dealer work

#### Phase 1 Detailed Design

Current implementation assets:

- `database/postgres/migrations/001_listing_governance_phase1.sql`
- `database/postgres/listing_lifecycle_transition_matrix.json`
- `database/postgres/listing_governance_firestore_mapping.md`
- `dataconnect/schema/listing_governance.gql`
- `dataconnect/listingGovernance/lifecycle.gql`
- `functions/listing-governance-rules.js`

##### Canonical lifecycle model

Phase 1 should introduce one canonical state machine for listing governance.

Recommended canonical states:

- `draft`
- `submitted`
- `approved_unpaid`
- `live`
- `expired`
- `sold`
- `rejected`
- `archived`

Recommended supporting states:

- `review_state`: `pending`, `approved`, `rejected`
- `payment_state`: `pending`, `paid`, `failed`, `waived`, `refunded`
- `inventory_state`: `draft`, `active`, `expired`, `sold`, `archived`
- `visibility_state`: `private`, `public_live`, `public_sold`, `archived`

Implementation rule:

- `lifecycle_state` is the authoritative governance state
- supporting states are normalized facts used to derive visibility and operator reporting
- clients should never set these fields directly

##### Firestore to Phase 1 mapping

Current listing fields map into the canonical model like this:

- Firestore `status` -> PostgreSQL `inventory_state`
- Firestore `approvalStatus` -> PostgreSQL `review_state`
- Firestore `paymentStatus` -> PostgreSQL `payment_state`
- Firestore `publishedAt` -> PostgreSQL `published_at`
- Firestore `expiresAt` -> PostgreSQL `expires_at`
- Firestore `soldAt` -> PostgreSQL `sold_at`
- Firestore visibility rule -> derived PostgreSQL `visibility_state`

Initial mapping examples:

- `status = pending` and `approvalStatus = pending` -> `lifecycle_state = submitted`
- `approvalStatus = approved` and `paymentStatus = pending` -> `lifecycle_state = approved_unpaid`
- `approvalStatus = approved` and `paymentStatus = paid` and `status = active` -> `lifecycle_state = live`
- `status = sold` -> `lifecycle_state = sold`
- `approvalStatus = rejected` -> `lifecycle_state = rejected`

##### Allowed transition matrix

Recommended Phase 1 transitions:

- `draft` -> `submitted`
- `draft` -> `archived`
- `submitted` -> `approved_unpaid`
- `submitted` -> `rejected`
- `submitted` -> `archived`
- `approved_unpaid` -> `live`
- `approved_unpaid` -> `rejected`
- `approved_unpaid` -> `archived`
- `live` -> `expired`
- `live` -> `sold`
- `live` -> `archived`
- `expired` -> `live`
- `expired` -> `archived`
- `sold` -> `live`
- `sold` -> `archived`
- `rejected` -> `submitted`
- `rejected` -> `archived`

Transition action names:

- `submit_listing`
- `approve_listing`
- `reject_listing`
- `confirm_payment`
- `publish_listing`
- `expire_listing`
- `relist_listing`
- `mark_listing_sold`
- `archive_listing`

##### Initial anomaly taxonomy

Phase 1 should detect and persist anomalies instead of relying on silent drift.

Recommended first anomaly codes:

- `live_without_paid_payment`
- `live_without_approved_review`
- `expired_but_public`
- `sold_without_sold_at`
- `rejected_but_public`
- `approved_unpaid_with_published_at`
- `missing_primary_image`
- `missing_seller_reference`
- `missing_location`
- `invalid_expiration_window`
- `duplicate_external_source_key`
- `orphan_transition_record`

Recommended severity levels:

- `critical`
- `high`
- `medium`
- `low`

Recommended anomaly statuses:

- `open`
- `resolved`
- `suppressed`

##### Initial PostgreSQL table draft

Phase 1 should start with these canonical governance tables:

- `listings`
- `listing_versions`
- `listing_state_transitions`
- `listing_anomalies`
- `listing_visibility_snapshots`
- `listing_media_audits`

Recommended `listings` fields:

- `id`
- `legacy_firestore_id`
- `seller_party_id`
- `title`
- `category_key`
- `subcategory_key`
- `manufacturer_key`
- `model_key`
- `location_text`
- `price_amount`
- `currency_code`
- `lifecycle_state`
- `review_state`
- `payment_state`
- `inventory_state`
- `visibility_state`
- `published_at`
- `expires_at`
- `sold_at`
- `source_system`
- `external_source_id`
- `created_at`
- `updated_at`

Recommended `listing_state_transitions` fields:

- `id`
- `listing_id`
- `transition_action`
- `previous_state`
- `next_state`
- `reason_code`
- `reason_note`
- `actor_type`
- `actor_id`
- `request_id`
- `source_system`
- `metadata_json`
- `occurred_at`

Recommended `listing_anomalies` fields:

- `id`
- `listing_id`
- `anomaly_code`
- `severity`
- `status`
- `detected_by`
- `snapshot_json`
- `owner_id`
- `detected_at`
- `resolved_at`

##### Data Connect contract outline

Phase 1 should expose only the governance operations needed for safe listing flow control.

Recommended first queries:

- `getListingGovernance`
- `listListingTransitions`
- `listOpenListingAnomalies`
- `listLifecycleQueue`

Recommended first mutations:

- `submitListing`
- `approveListing`
- `rejectListing`
- `confirmListingPayment`
- `publishListing`
- `expireListing`
- `relistListing`
- `markListingSold`
- `archiveListing`
- `resolveListingAnomaly`

##### Cloud Run responsibilities for Phase 1

Phase 1 Cloud Run workers should own:

- scheduled expiration enforcement
- anomaly detection scans
- payment and billing callbacks into lifecycle transitions
- dual-write sync from current Firestore writes
- shadow comparison between Firestore visibility and Postgres visibility
- public artifact invalidation when listing visibility changes

##### Phase 1 cutover rule

Phase 1 is ready for implementation cutover when:

- no client writes lifecycle fields directly
- all lifecycle changes go through server-owned actions
- transition audit logging is append-only
- anomalies are visible to operators
- public visibility can be derived from the canonical state model

### Phase 2: Dealer Hierarchy And Memberships

Objective:

- move dealer account structure onto relational rails

Deliverables:

- dealer, branch, and membership schema
- Data Connect queries and mutations
- admin UI migration path
- permission model aligned to dealer scope

### Phase 3: Enterprise Ingestion Layer

Objective:

- turn dealer aggregation into a governed ingestion platform

Deliverables:

- feed source model
- run tracking
- lineage tables
- duplicate clustering
- reconciliation queue
- operator audit tooling
- SLAs and alerts

### Phase 4: Public Read Models And SEO Artifacts

Objective:

- stop depending on expensive transactional reads for public route assembly

Deliverables:

- Postgres-backed route generation worker
- precomputed route artifacts
- sitemap generation pipeline
- freshness monitoring

### Phase 5: Warehouse And BI

Objective:

- make TimberEquip a real operational and reporting hub

Deliverables:

- BigQuery export jobs
- curated marts
- dealer and operator dashboards
- SLA and anomaly reporting

## Migration Method

Use staged migration, not big-bang cutover.

Recommended sequence:

1. define canonical Postgres schema
2. stand up Data Connect
3. introduce server-owned write paths for one domain
4. dual-write from current Firebase functions where needed
5. backfill historical records
6. run shadow reads and compare outputs
7. cut clients to Data Connect-backed reads
8. retire old Firestore write paths domain by domain

## Cost Guidance

The cheapest enterprise-capable path is not the absolute lowest monthly bill. It is the path that keeps costs predictable while avoiding platform stalls.

Cost posture guidance:

- Cloud SQL is preferred for predictable transactional workloads
- BigQuery is preferred for warehouse and reporting workloads
- Cloud Run is preferred for bursty ingestion and scheduled processing
- Firestore should be reserved for use cases where document reads are a feature, not a surprise bill driver

Do not:

- use BigQuery as the live application database
- use Firestore as the warehouse
- keep SEO generation dependent on large transactional scans

## Immediate Working Backlog

### Current Focus

The first working slice from this plan should be:

1. define the canonical listing governance schema in PostgreSQL
2. define the listing lifecycle state machine
3. define the anomaly and transition audit model
4. map current Firestore collections and fields to the new source of truth
5. stand up the first Data Connect contract for listing governance

### First Concrete Outputs

- schema draft for listing governance tables
- state transition matrix
- anomaly taxonomy
- migration map from current Firestore listing fields
- Data Connect query and mutation outline
- Cloud Run worker responsibilities for lifecycle events
- cutover criteria for retiring Firestore lifecycle writes
- initial SQL table skeletons for listing governance

## Definition Of Done

This platform migration is successful when:

- listing visibility is driven by one formal state machine
- dealer account structure is relational and auditable
- ingestion preserves source lineage and supports reconciliation
- public SEO no longer depends on heavy Firestore reads
- warehouse reporting exists in BigQuery
- Firestore is no longer the bottleneck for enterprise marketplace growth
