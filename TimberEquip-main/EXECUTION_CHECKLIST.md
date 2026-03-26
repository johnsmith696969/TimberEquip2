# Forestry Equipment Sales Execution Checklist

Last updated: 2026-03-25

Reference audit: [../TimberEquip_Full_Audit_And_Firestore_Plan.md](../TimberEquip_Full_Audit_And_Firestore_Plan.md)
Reference platform plan: [./ENTERPRISE_DATA_PLATFORM_PLAN.md](./ENTERPRISE_DATA_PLATFORM_PLAN.md)

## Owner Lanes

- Platform: Firebase Functions, secrets, Firestore rules, indexes, scheduled jobs
- Frontend: React pages, admin UX, public marketplace UX, mobile QA
- Data: Firestore schema alignment, migration, anomaly reporting
- Content: CMS workflow, blog operations, media governance
- Ops: secrets, SMTP, deployment validation, production smoke tests

## Phase 0: Immediate Stabilization

Goal: remove current production blockers before expanding the data model.

### Platform

- [x] Deploy Stripe backend secret-normalization fix to `apiProxy`
- [ ] Confirm `STRIPE_SECRET_KEY` secret value in Firebase Secret Manager has no leading or trailing whitespace
- [ ] Run live checkout smoke test from Ad Programs
- [ ] Confirm listing checkout still succeeds after backend deploy

### Ops

- [ ] Correct SMTP credentials used by notification mailer
- [ ] Re-test contact request email delivery
- [ ] Re-test media kit request email delivery
- [ ] Re-test billing and admin email side effects
- [ ] Create GitHub `preview`, `staging`, and `production` environments
- [ ] Add environment-specific Firebase deployment credentials
- [ ] Add required reviewers to the `production` environment
- [ ] Create the staging Firebase project and assign its project ID to GitHub vars

### Frontend

- [ ] Run mobile QA pass on Home, Categories, Profile, Content Studio, Listing Detail
- [ ] Confirm no horizontal overflow remains on account/profile tab layouts

Exit criteria:

- Ad Programs checkout succeeds
- critical emails send successfully
- no critical mobile regression remains on core pages

## Phase 1: CMS And Public News Canonicalization

Goal: make `blogPosts` the single source of truth for Equipment News.

### Content

- [ ] Validate create draft -> refresh -> edit -> publish -> refresh workflow in admin
- [ ] Confirm published posts appear on Equipment News without relying on legacy `news`
- [ ] Confirm unpublished drafts never appear publicly

### Platform

- [ ] Finalize Firestore rules for `blogPosts` author/status compatibility
- [ ] Add index coverage for `blogPosts status + updatedAt`
- [ ] Remove any code path that requires the legacy `news` collection for public reads

### Data

- [ ] Decide whether to migrate legacy `news` documents into `blogPosts`
- [ ] If migrating, write one-time migration script and rollback notes

Exit criteria:

- public Equipment News reads from one canonical collection
- admin CMS save and publish are stable across refreshes

## Phase 2: Listing Pipeline Hardening

Goal: enforce one canonical listing lifecycle end-to-end.

### Data

- [ ] Define canonical PostgreSQL listing governance tables: `listings`, `listing_versions`, `listing_state_transitions`, `listing_anomalies`, `listing_visibility_snapshots`, `listing_media_audits`
- [ ] Define canonical states: `draft`, `submitted`, `approved_unpaid`, `live`, `expired`, `sold`, `rejected`, `archived`
- [ ] Define supporting states: `review_state`, `payment_state`, `inventory_state`, `visibility_state`
- [ ] Map current Firestore fields `status`, `approvalStatus`, `paymentStatus`, `publishedAt`, `expiresAt`, and `soldAt` to the new source of truth
- [ ] Use `database/postgres/listing_governance_firestore_mapping.md` as the canonical field and cutover map for dual-write implementation
- [ ] Use `functions/listing-governance-rules.js` for shadow lifecycle derivation and anomaly comparison during dual-write
- [ ] Document publish prerequisites, sold visibility policy, and expiration rules

### Platform

- [ ] Add server-owned transition actions for submit, approve, reject, payment confirm, publish, expire, relist, sold, and archive
- [ ] Add append-only transition logging for publish, payment, relist, expire, sold, and archive
- [ ] Add anomaly reporting for invalid listing state combinations and visibility mismatches
- [ ] Add the first Data Connect contract for listing governance reads and mutations
- [ ] Add Cloud Run worker responsibilities for expiration enforcement, anomaly detection, and lifecycle shadow sync
- [ ] Verify scheduled expiration behavior against public search visibility and transition audit output

### Frontend

- [ ] Validate seller create, edit, submit, and relist flows against the new server-owned lifecycle actions
- [ ] Validate admin approve and reject flows against the new transition service
- [ ] Validate public search and detail visibility for `live`, `approved_unpaid`, `expired`, `sold`, `rejected`, and `archived` outcomes

Exit criteria:

- all listing entry points produce canonical documents
- illegal lifecycle transitions are detectable
- public listing visibility is predictable and documented

## Phase 3: Firestore Architecture Expansion

Goal: add the missing collections and rules needed for dealer operations and auditability.

### Platform

- [ ] Add Firestore rules for `dealerFeedIngestLogs`
- [ ] Add Firestore rules for `dealers`
- [ ] Add Firestore rules for `dealerUsers`
- [ ] Add Firestore rules for `dealerBranches`
- [ ] Add Firestore rules for `dealerMetaConnections`
- [ ] Add Firestore rules for `dealerMetaValidationLogs`
- [ ] Add Firestore rules for `listingAuditReports`
- [ ] Add Firestore rules for `listingStateTransitions`
- [ ] Add Firestore rules for `listingMediaAudit`

### Data

- [ ] Define required fields for each new collection
- [ ] Add index definitions for the first production queries
- [ ] Decide whether dealer access is modeled by embedded membership arrays or dedicated membership docs

Exit criteria:

- missing audited collections are represented in rules and config
- first-pass indexes exist for expected admin and dealer queries

## Phase 4: Dealer And Meta Capabilities

Goal: build the planned dealer/fleet and Meta connection model on top of the new Firestore structure.

### Frontend

- [ ] Add dealer admin views for branch management
- [ ] Add dealer user management around membership documents
- [ ] Add Meta connection status UI

### Platform

- [ ] Add backend endpoints for dealer membership and branch operations
- [ ] Add backend endpoints for Meta asset validation and sync
- [ ] Persist validation logs and last-known asset health

### Ops

- [ ] Define runbook for reconnecting expired or revoked Meta assets
- [ ] Define support workflow for dealer onboarding

Exit criteria:

- dealer and fleet account structures are real, not implied
- Meta asset ownership is scoped and auditable

## Recommended Owners

- Platform: backend / Firebase implementation owner
- Frontend: marketplace and admin UI owner
- Data: schema and migration owner
- Content: CMS editorial owner
- Ops: deployment and secrets owner

## Next Three Execution Steps

1. Validate the just-deployed Stripe fix in production checkout.
2. Finish canonical `blogPosts` news behavior and verify it with a full CMS publish smoke test.
3. Turn on the new staged deploy workflow and run one preview plus staging release through it.
