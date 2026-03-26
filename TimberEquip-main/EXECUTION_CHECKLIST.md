# Forestry Equipment Sales Execution Checklist

Last updated: 2026-03-25

Reference audit: [../TimberEquip_Full_Audit_And_Firestore_Plan.md](../TimberEquip_Full_Audit_And_Firestore_Plan.md)

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

- [ ] Define canonical listing schema document
- [ ] Define allowed state transitions for `status`, `approvalStatus`, `paymentStatus`
- [ ] Document publish prerequisites and expiration rules

### Platform

- [ ] Add anomaly reporting collection for invalid listing states
- [ ] Add state-transition logging for publish, payment, relist, expire, sold
- [ ] Verify scheduled expiration behavior against public search visibility

### Frontend

- [ ] Validate seller create/edit/relist flows
- [ ] Validate admin approve/reject flows
- [ ] Validate public search/detail visibility for paid, unpaid, pending, expired, sold listings

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
3. Land the first Firestore scaffolding patch for missing collections and indexes.