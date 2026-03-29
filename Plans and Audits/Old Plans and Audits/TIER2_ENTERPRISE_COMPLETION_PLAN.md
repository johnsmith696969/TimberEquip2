# TimberEquip Tier 2 Enterprise Completion Plan

Last updated: 2026-03-29 (post billing portal verification and staging promotion)

Reference docs:

- [ENTERPRISE_DELIVERY_ROADMAP.md](./ENTERPRISE_DELIVERY_ROADMAP.md)
- [ENTERPRISE_DATA_PLATFORM_PLAN.md](./ENTERPRISE_DATA_PLATFORM_PLAN.md)
- [DEPLOYMENT_ENVIRONMENTS.md](./DEPLOYMENT_ENVIRONMENTS.md)
- [TIER2_ENTERPRISE_QA_TODO.md](./TIER2_ENTERPRISE_QA_TODO.md)

## Goal

Finish TimberEquip as a trustworthy Tier 2 enterprise platform before attempting a broader Tier 3 migration.

Tier 2 is considered complete when:

- signed-in customer and admin flows do not fall over under Firestore quota pressure
- listing visibility is server-owned, auditable, and approval-gated
- staging is the first real validation lane for risky changes
- production deploys are controlled, observable, and reversible
- seller billing and account access are deterministic
- the first Tier 3 foundation exists in staging without forcing an early core-data cutover

## Current State

### Working now

- public marketplace routes have quota-safe server fallbacks
- staging now has Hosting, Firestore, `apiProxy`, `publicPages`, Monitoring alerts, and isolated browser Firebase config
- admin-facing lifecycle controls and lifecycle audit views exist
- seller entitlements and subscription-driven visibility are enforced more consistently
- production and staging both have route smoke checks and baseline alert policies
- the blog/news surface no longer ships dead public search or newsletter widgets and now routes users into live marketplace hubs and seller/buyer flows

### Still blocking full Tier 2

- the canonical signed-in account bootstrap now exists and is live, and the remaining long-tail account/detail/operator tabs now use the same last-good snapshot standard
- the highest-value admin/account, dealer-feed, overview, and operational summary surfaces are now on consolidated authenticated bootstrap paths, with auth-scoped cache fallback on the deeper listing/storefront/inquiry/call/financing and dealer-feed detail views; saved searches/alerts and account access refresh now follow the same resilience pattern, and secure subscription-side billing management is now live through the authenticated Stripe customer portal flow from `Profile -> Account Settings`, so remaining work is now concentrated in governance backfill, staged evidence capture, and the last mutation/evidence gaps
- seller listing creation, edit, submit, and seller-side delete actions now run through authenticated server-owned account/listing lanes, but approval-note polish, governance backfill, and operator review evidence are still unfinished
- lifecycle governance has append-only artifacts, but the backfill and operator review loop are not fully finished
- GitHub Environment promotion discipline is scaffolded in repo, but the human release rail still needs to become the default operating model
- the first Tier 3 foundation is documented and scaffolded, but not yet standing in staging as a live contract plus worker path

## Remaining Workstreams

## 1. Canonical Account Bootstrap

Priority: highest

Status:

- materially complete and promoted through staging and production

We now have one authenticated account bootstrap response for signed-in sessions.

Required output from `/api/account/bootstrap`:

- normalized profile
- compact entitlement snapshot
- current subscription summary
- seat context
- role capabilities
- storefront summary
- admin capability flags
- last-good cache metadata

Frontend surfaces moved onto this first:

- `AuthContext`
- `Profile`
- `AdminDashboard` overview and account sections
- seller account settings and security/preference panels

Definition of done:

- no core signed-in page needs to compose account state from scattered Firestore reads during first load
- profile and admin shells can render from one quota-safe response

## 2. Admin And Account Read Hardening

Priority: highest

After the bootstrap API exists, the remaining admin and account tabs need to stop depending on direct quota-sensitive reads.

Status:

- materially in progress and promoted through staging and production for the highest-value tabs
- admin billing, content, users, accounts, inquiries, calls, and dealer-feed operations now use consolidated authenticated bootstrap responses with partial-failure handling and cache reuse

Finish moving these to authenticated server reads with last-good fallback:

- account settings editor/detail mutations
- saved searches and alerts where they affect first-load UX
- any remaining long-tail overview or operational summary surfaces not already on the consolidated bootstrap lane

Definition of done:

- signed-in admin and account tabs either load current data or a clearly-labeled last-good snapshot
- quota exhaustion no longer looks like broken empty states

Completed in this workstream:

- account listings, storefront, inquiries, calls, and financing requests now use auth-scoped last-good browser snapshots
- listing lifecycle audit/detail and admin review summaries now fall back to last-good snapshots
- dealer-feed profiles, profile detail, audit logs, and recent logs now use auth-scoped last-good snapshots
- listing and dealer-feed mutations now invalidate the relevant cached scopes to reduce stale post-edit state
- saved searches and alerts now use auth-scoped last-good browser snapshots with cache updates after create/edit/delete
- account access refresh now falls back to the last known billing/access summary instead of hard-failing under quota pressure
- profile settings now persist through the authenticated `/api/account/profile` lane, and profile tab switching now derives from the canonical `?tab=` URL state instead of a duplicated local-state mirror; this has been visually re-verified on production for both `super_admin` and `pro_dealer`
- `Profile -> Account Settings -> Manage Billing` now opens a real authenticated Stripe billing portal session through `POST /api/billing/create-portal-session`, and the branded portal redirect has been browser-verified on production before the same slice was promoted through staging

## 3. Server-Owned Listing Lifecycle Completion

Priority: high

Lifecycle controls exist, and the seller create plus submit path now uses them.

Completed in this workstream:

- seller listing creation and submit now run through the authenticated backend lifecycle lane
- new listings are created as server-owned drafts, validated centrally, and immediately transitioned through canonical submit logic
- staging and production have both been updated and smoke-checked after promotion

Remaining work:

- finish approval and rejection notes for admins and super admins
- finalize public visibility rules for live, unpaid, rejected, expired, sold, and archived states with stronger evidence
- run the listing governance backfill once quota-safe
- keep capturing staged and production evidence for the hardened listing mutation lane so operator runbooks and audit proof stay current

Definition of done:

- every listing entry point produces a canonical lifecycle state
- public visibility is explainable from audit output alone

## 4. Operator Audit And Review Surfaces

Priority: high

Tier 2 needs operators to understand why the platform made a decision.

Remaining work:

- account audit views for:
  - role changes
  - entitlement changes
  - subscription changes
  - legal acceptance changes
- listing review queue filters for:
  - pending approval
  - rejected waiting on seller changes
  - paid but not live
  - anomalies
- dealer feed operator views for:
  - latest run
  - failure reason
  - ingest status
  - duplicate/reconciliation indicators

Definition of done:

- admin and super admin can explain any seller-access or listing-visibility decision from the UI

## 5. Release Rail And Ops Discipline

Priority: high

The repo now has the right scaffolding. We need the operating model to match it.

Remaining work:

- make preview, staging, and production GitHub Environments the standard path for releases
- require production approval for live releases
- keep deploy scope targeted by domain instead of deploying the full Functions monolith by default
- run smoke checks after every staging and production release
- validate runbooks by actually drilling:
  - quota degradation
  - billing webhook failure
  - listing visibility mismatch
  - production rollback

Definition of done:

- production changes do not happen by habit
- every live release is promoted, observed, and reversible

## 6. Staging QA Matrix

Priority: medium-high

Staging now supports real validation. We need a repeatable matrix.

Minimum recurring QA suite:

- `super_admin`
- `admin`
- `pro_dealer`
- `dealer`
- `owner_operator`
- `free_member`
- `buyer`

Required staging flows:

- login/logout
- profile bootstrap
- settings save
- MFA enroll start
- ad-program checkout start
- role-safe dashboard visibility
- listing create/edit/submit
- admin approve/reject/payment confirm
- dealer feed import setup

Completed in this workstream:

- a repeatable staging role-matrix seed/validation script now exists at `TimberEquip-main/scripts/seed-staging-role-matrix.mjs`
- deterministic staging QA accounts were seeded for `admin`, `pro_dealer`, `dealer`, `owner_operator`, `free_member`, and `buyer`, while the existing staging `super_admin` account was included in the same run
- the authenticated `/api/account/bootstrap` contract has now been validated in staging for all seven core roles with no mismatches, and the evidence artifact is stored at `TimberEquip-main/output/qa/staging-role-matrix-20260329.json`
- a repeatable staging lifecycle smoke script now exists at `TimberEquip-main/scripts/validate-staging-lifecycle.mjs`
- the staged create -> reject -> resubmit -> approve -> payment_confirmed -> mark_sold -> relist -> archive lifecycle now passes end to end, including the admin lifecycle audit endpoint, and the evidence artifact is stored at `TimberEquip-main/output/qa/staging-lifecycle-smoke-20260329.json`
- a repeatable staging billing-start validation script now exists at `TimberEquip-main/scripts/validate-staging-billing-start.mjs`
- staging can now create real Stripe checkout sessions for `individual_seller`, `dealer`, and `fleet_dealer`, and the evidence artifact is stored at `TimberEquip-main/output/qa/staging-billing-start-20260329.json`
- the staging checkout return path is now fixed for seller-plan purchases, and a real March 29, 2026 `Owner-Operator` payment was confirmed through to an active seller account state after normalizing the authenticated account bootstrap and billing-refresh contracts

Current blocker note:

- the production governance backfill is still blocked by the Firestore quota row `Free daily read units per project (free tier database) per day` on `mobile-app-equipment-sales`, and Google Cloud marks that row as `Adjustable: No`, so this specific limit cannot be raised through a simple console quota increase flow

Definition of done:

- high-risk account and listing changes are proven in staging before production promotion

## 7. First Tier 3 Foundation In Staging

Priority: medium

This should stay narrow during Tier 2 completion.

Required foundation:

- staging Cloud SQL Postgres instance
- first Data Connect contract for listing governance
- first Cloud Run worker for lifecycle or anomaly processing

This does not mean a full migration.

Definition of done:

- one narrow governance responsibility is standing on the future stack in staging
- the release and rollback path for that foundation is proven

## Recommended Execution Order

1. Run the governance backfill and expose operator-grade audit/review views for listing and entitlement decisions.
2. Finish editor/detail mutation hardening so remaining signed-in write paths follow the same quota-safe, server-owned model.
3. Use staging as the default QA lane for roles, billing, MFA, create-submit-approve lifecycle, and dealer-feed operations.
4. Lock in release discipline so staging and production promotion becomes standard through GitHub Environments and approval.
5. Stand up the first staging Data Connect plus Cloud Run governance path.

## Definition Of Full Tier 2 Completion

TimberEquip should be considered full Tier 2 when all of these are true:

- public marketplace reads no longer misrepresent empty inventory under quota pressure
- signed-in account and admin routes are quota-safe
- seller subscriptions deterministically control seller access and public visibility
- listing approval is mandatory and lifecycle-driven
- admins can review audit history and explain listing/account outcomes
- staging is the first shared validation environment for risky changes
- production deploys are approved, observed, and reversible
- one narrow Tier 3 governance foundation is live in staging
