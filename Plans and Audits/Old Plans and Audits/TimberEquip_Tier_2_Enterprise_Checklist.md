# TimberEquip Tier 2 Enterprise Checklist

Date: March 28, 2026
Updated: March 29, 2026

## Purpose

This is the current master checklist for moving TimberEquip to a full Tier 2 enterprise standard.

It now combines:

- `TimberEquip_Functionality_Audit_2026-03-28.md`
- `TimberEquip_Codex_5_4_Implementation_Handoff.md`
- `ENTERPRISE_DATA_PLATFORM_PLAN.md`
- current repo evidence in `TimberEquip-main`

This is no longer just a blank checklist. It is a status tracker with:

- current status
- repo evidence
- gaps still open
- the next concrete move for each area

## Status Legend

- `Complete`: implemented and evidenced in the current repo/docs
- `In Progress`: meaningful implementation exists, but the control is not yet complete or fully evidenced
- `Open`: not complete and still required for Tier 2
- `Blocked`: cannot complete until an upstream dependency or product decision is resolved

## Current Tier Assessment

Current classification:

- `Enterprise-aspirational Tier 2`

What that means:

- the platform is beyond prototype stage
- core marketplace, billing, admin, seller, dealer, and SEO systems exist
- staging and production discipline has started
- listing lifecycle governance and data-platform scaffolding exist
- the site is still not at full Tier 2 because several launch-critical and audit-critical controls remain incomplete

## Current Top Blockers

These are the highest-priority items still keeping the platform below full Tier 2:

1. The dedicated client-side `NotFound` experience is live, but a full server-returned 404 contract still is not.
2. Signed-in admin/account first-load reads are now materially hardened through canonical authenticated bootstraps in staging and production, including overview analytics and operational summary surfaces. Remaining Tier 2 gaps are now mostly deeper editor/detail/mutation flows and evidence gaps rather than broken first-load admin shells.
3. Search and home data are more resilient, but not yet fully reworked for scale-safe data access.
4. Checkout confirmation payloads and a few remaining account/admin downstream contracts still need normalization.
5. No full automated regression suite exists yet.
6. The first Tier 3 foundation is scaffolded, but Cloud SQL/Data Connect/Cloud Run/BigQuery are not yet actually operating as the live governance backbone.
7. A full collection-by-collection Firestore and Storage rules matrix still does not exist.

## Delivery Rule

For every checklist item completed, capture four things:

1. files changed
2. verification performed
3. remaining risk
4. evidence location

## Tier 2 Exit Criteria

| Exit Criterion | Status | Current State | Evidence |
| --- | --- | --- | --- |
| No open Sev 1 defects | Open | Production is more stable, but major quota-sensitive paths and fake UI gaps still remain. | Functionality audit; current repo state |
| No open Sev 2 defects | Open | Multiple operational and integrity items are still unresolved. | Functionality audit; checklist below |
| No fake or misleading public UI remains | In Progress | `Auctions` sample behavior, the Profile upload-test surface, and the dead blog search/newsletter widgets have been removed. Remaining public-honesty risk is now mostly demo inventory/public preview review rather than obviously fake controls. | `src/pages/Auctions.tsx`, `src/pages/Profile.tsx`, `src/pages/Blog.tsx` |
| All revenue-critical and lead-critical flows work end-to-end | In Progress | Billing, listings, inquiries, financing, and inspections exist, but full evidence pack and automation are missing. | Functions/API, billing flows, profile/admin work |
| Staging and production behavior are intentionally separated and documented | Complete | Staging and preview envs are defined and documented. | `.firebaserc`, `README.md`, `DEPLOYMENT_ENVIRONMENTS.md`, deploy scripts |
| All critical flows have automated coverage and manual smoke coverage | In Progress | Manual smoke and route checks exist; real E2E automation does not. | workflow scaffolds, smoke scripts, no real test suite |
| Firestore and Storage rules have been audited collection by collection | Open | Point fixes exist, but no complete rules matrix exists. | `firestore.rules`; no collection-by-collection matrix found |
| Security, privacy, logging, backup, and rollback controls are documented | In Progress | Rollback and incident runbooks exist; backup/retention/compliance still incomplete. | `ops/runbooks`, monitoring artifacts |
| Audit evidence exists for implemented controls | In Progress | There is meaningful evidence in docs/scripts, but no finished evidence pack. | monitoring JSON, runbooks, deploy docs |

## Phase 1: Public Product Stabilization

### A. Firestore Rules And Data Integrity

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P0-01` Add `dealerFeedProfiles` validation and rules | Complete | `firestore.rules` now includes a `dealerFeedProfiles` validator plus scoped read/create/update/delete rules for admins and dealer-scoped accounts. Rules compiled and were released to staging on March 28, 2026. | `TimberEquip-main/firestore.rules`; staged with `npx firebase-tools deploy --only firestore:rules --project timberequip-staging --config firebase.json` |
| `ENT-P0-02` Audit all client-written collections against rules | Open | No full rules matrix exists. | Produce one matrix for `users`, `storefronts`, `listings`, `inquiries`, `financingRequests`, `inspectionRequests`, `savedSearches`, `contactRequests`, `mediaKitRequests`, `mediaLibrary`, `contentBlocks`, `dealerFeedProfiles`, `dealerFeedIngestLogs`. |
| `ENT-P0-03` Enforce listing lifecycle integrity | In Progress | Real lifecycle control-plane code exists, and seller listing creation plus submit now run through the authenticated server-owned `POST /api/account/listings` lane instead of direct browser writes. New listings are created as server-owned drafts, validated centrally, then immediately transitioned through canonical lifecycle submit logic. This has been promoted through staging and production, and the staged create -> reject -> resubmit -> approve -> payment_confirmed -> mark_sold -> relist -> archive lifecycle smoke now passes with audit evidence. | `TimberEquip-main/functions/listing-lifecycle.js`, `TimberEquip-main/functions/index.js`, `TimberEquip-main/src/services/equipmentService.ts`, `TimberEquip-main/server.ts`, `TimberEquip-main/scripts/validate-staging-lifecycle.mjs`, `TimberEquip-main/output/qa/staging-lifecycle-smoke-20260329.json`; production route smoke re-passed on March 28, 2026 after serial production redeploy. Remaining work: governance backfill and approval/rejection note polish. |

### B. API Parity And Runtime Consistency

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P0-04` Local parity for `POST /api/inspections/closest-dealer` | Complete | `server.ts` now proxies this route through the shared Firebase Functions `apiProxy`, so local dev hits the same handler family as production. Local verification returns a controlled `503` when Google Cloud ADC is not configured instead of a route miss. | `TimberEquip-main/server.ts`, `TimberEquip-main/functions/index.js`; local probe on March 28, 2026 returned `503` from `/api/inspections/closest-dealer` on port `3001` |
| `ENT-P0-05` Local parity for `POST /api/billing/create-account-checkout-session` | Complete | `server.ts` now proxies this billing route through the shared Functions layer. Local verification returns a controlled `503` without Stripe secrets, proving the route contract is present. | `TimberEquip-main/server.ts`, `TimberEquip-main/functions/index.js`; local probe on March 28, 2026 returned `503` from `/api/billing/create-account-checkout-session` on port `3001` |
| `ENT-P0-06` Consistent checkout confirmation payloads | Open | No repo evidence that local and production confirmation contracts are aligned. | Audit account and listing confirmation responses and normalize. |
| `ENT-P0-07` Local parity for `GET /api/market-rates` | Complete | `server.ts` now proxies this route to the shared Functions API, and local dev returns the same fallback market-rates payload shape as production when secrets are missing. | `TimberEquip-main/server.ts`, `TimberEquip-main/functions/index.js`; local probe on March 28, 2026 returned `200` from `/api/market-rates` with fallback payload |
| `ENT-P0-08` Local parity for `GET /api/currency-rates` | Complete | `server.ts` now proxies this route, and the Functions layer now returns a controlled fallback payload instead of throwing when currency API secrets are unavailable locally. | `TimberEquip-main/server.ts`, `TimberEquip-main/functions/index.js`; local probe on March 28, 2026 returned `200` from `/api/currency-rates` with fallback payload |
| `ENT-P0-09` Decide parity or fallback for `/api/translate` and `/api/admin/dealer-feeds/resolve` | Complete | The route decision is now implemented. `/api/translate` is proxied locally and falls back to source-language text when the translation key is unavailable. `/api/admin/dealer-feeds/resolve` is also proxied locally and correctly returns `401` without auth, proving the protected route is on the shared local/prod contract. | `TimberEquip-main/server.ts`, `TimberEquip-main/functions/index.js`, `TimberEquip-main/src/services/translateService.ts`; local probe on March 28, 2026 |
| `ENT-P0-10` Remove/hide functionality that only works against `server.ts` | Complete | The Profile page no longer exposes the local-only `File Upload Test` or posts to `/api/upload`. The supported upload path is now the real profile/storefront asset flow only. | `TimberEquip-main/src/pages/Profile.tsx` |

### C. Honest Public Experience

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P0-11` Make `Auctions` honest | Complete | `Auctions.tsx` no longer falls back to sample events or fake bid/register actions. It now shows live auction data only, or an honest launch-status/coming-soon experience when there are no live auctions. | `TimberEquip-main/src/pages/Auctions.tsx` |
| `ENT-P0-12` Label retained sample data as preview content | Complete | Sample auction content was removed entirely, eliminating the need to label demo auction data in production UI. | `TimberEquip-main/src/pages/Auctions.tsx` |
| `ENT-P0-13` Remove or wire dead public CTAs | Complete | The public blog/news surface no longer contains dead filter/search or newsletter subscribe widgets. Those slots now route into real marketplace hubs and live commercial flows including inventory, categories, manufacturers, dealers, states, financing, ad programs, and seller enrollment. | `TimberEquip-main/src/pages/Blog.tsx`; verified with `npm run build` on March 29, 2026 |

### D. Launch Mode And SEO Controls

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P0-14` Treat indexing as a release gate | Complete | Release-mode SEO gating exists and is documented. | `public/robots.txt`, `firebase.json`, `scripts/prepare-seo-mode.mjs`, `package.json`, `src/components/Seo.tsx` |
| `ENT-P0-15` Document staging vs production deploy commands | Complete | Docs and scripts explicitly separate preview/staging/production. | `README.md`, `DEPLOYMENT_ENVIRONMENTS.md`, `package.json`, deploy scripts |
| `ENT-P0-16` Replace homepage fallback with real 404 strategy | In Progress | The app now has a dedicated `NotFound` route with noindex SEO and explicit recovery links, and the client wildcard route no longer drops unknown URLs onto the homepage. Remaining gap: Hosting still serves the SPA shell with a `200` for unknown client routes, so this is now a real not-found experience but not yet a full HTTP-status 404 strategy. | `TimberEquip-main/src/App.tsx`, `TimberEquip-main/src/pages/NotFound.tsx`; next step: decide whether to keep SPA-shell 404 UX or move unmatched public routes onto a server-returned 404 contract. |
| `ENT-P0-23` Canonical authenticated account bootstrap path | Complete | A dedicated authenticated `GET /api/account/bootstrap` contract now exists, `AuthContext` boots signed-in state from it, `userService.getCurrentProfile()` is normalized onto the same contract, and cached seat context is reused client-side before extra seat reads. This slice has now been promoted through staging and production and passed route smoke validation. | `TimberEquip-main/functions/index.js`, `TimberEquip-main/src/services/userService.ts`, `TimberEquip-main/src/components/AuthContext.tsx`; staging smoke passed on March 28, 2026 at `https://timberequip-staging.web.app`; production smoke passed on March 28, 2026 at `https://www.timberequip.com` |
| `ENT-P0-24` Remove quota-sensitive signed-in/admin read dependence | In Progress | Signed-in bootstrap and seat-context reads are materially better and are live in staging/production. Admin billing, content, users, accounts, inquiries, calls, dealer-feed operations, overview analytics, and the main operational summary surfaces now load through consolidated authenticated bootstrap APIs with partial-failure handling and client cache reuse. The remaining long-tail account/detail/operator tabs now also use auth-scoped last-good snapshots for account listings, storefront, inquiries, calls, financing requests, listing lifecycle audit/detail, admin listing review summaries, dealer-feed profile/log views, and saved searches, with mutation-driven cache invalidation after listing/feed/saved-search changes. Account access refresh now also falls back to the last known billing/access summary instead of hard-failing. Profile tabs now derive from the canonical `?tab=` URL instead of duplicating local tab state, which removed the remaining super-admin profile flicker; lightweight settings saves continue to succeed through the authenticated `PATCH /api/account/profile` route. Secure subscription-side billing management is now present through an authenticated `POST /api/billing/create-portal-session` lane and a verified `Manage Billing` action in `Profile -> Account Settings` that redirects into the branded Stripe customer portal. Remaining gaps are now mostly final evidence capture, governance backfill, and the last deeper mutation/evidence items rather than missing billing-management features. | `TimberEquip-main/functions/index.js`, `TimberEquip-main/src/services/userService.ts`, `TimberEquip-main/src/services/adminUserService.ts`, `TimberEquip-main/src/services/billingService.ts`, `TimberEquip-main/src/services/cmsService.ts`, `TimberEquip-main/src/services/dealerFeedService.ts`, `TimberEquip-main/src/services/equipmentService.ts`, `TimberEquip-main/src/pages/AdminDashboard.tsx`, `TimberEquip-main/src/pages/DealerOS.tsx`, `TimberEquip-main/src/components/AuthContext.tsx`, `TimberEquip-main/src/pages/Profile.tsx`, `TimberEquip-main/src/pages/Financing.tsx`, `TimberEquip-main/server.ts`; overview bootstrap promoted through staging and production on March 28, 2026 with passing route smoke checks; profile stabilization, financing theme parity, `/api/account/profile`, and `Manage Billing` production verification completed with Playwright on March 29, 2026 |

### E. Critical Flow Smoke Tests

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P0-17` Login/register/logout/reset/email verification smoke | In Progress | Live/manual smoke has been done in parts, but not fully captured as one evidence set. | Add repeatable smoke checklist + automation. |
| `ENT-P0-18` Seller account checkout and listing checkout smoke | In Progress | Checkout flows exist and now have staged start-flow evidence for `individual_seller`, `dealer`, and `fleet_dealer` via real Stripe checkout-session creation. The staging `Owner-Operator` post-checkout return path is now fixed and the paid account state was confirmed end-to-end on March 29, 2026. Remaining work is to finish the staged post-checkout confirmation evidence for the rest of the seller-plan matrix and capture the remaining webhook/account-state proof cleanly. | `TimberEquip-main/scripts/validate-staging-billing-start.mjs`, `TimberEquip-main/output/qa/staging-billing-start-20260329.json`; next step: finish staged post-checkout confirmation evidence for `dealer` and `fleet_dealer`, plus the remaining lifecycle-linked billing proof. |
| `ENT-P0-19` Listing create/edit/publish/approve/sold smoke | In Progress | Lifecycle actions are implemented and tested in parts. | Complete staged/full evidence run. |
| `ENT-P0-20` Inquiry/financing/inspection smoke | In Progress | Core flows exist and have been manually exercised. | Add full matrix coverage and evidence. |
| `ENT-P0-21` DealerOS profile save and ingest smoke | In Progress | Feature work exists and has been tested operationally, but current repo rules evidence is incomplete. | Close `dealerFeedProfiles` rules gap and capture end-to-end evidence. |
| `ENT-P0-22` CMS create/publish/public blog visibility smoke | In Progress | CMS/blog system exists, but no full evidence pack is present. | Run and record end-to-end editorial smoke. |

## Phase 2: Full Functionality Completion

### A. Accounts, Roles, And Storefronts

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-01` Document full role matrix and verify enforcement | In Progress | A repeatable staging role-matrix seed/validation script now exists and passed on March 29, 2026 for `super_admin`, `admin`, `pro_dealer`, `dealer`, `owner_operator`, `free_member`, and `buyer` using the authenticated `/api/account/bootstrap` contract. Remaining work is to capture the corresponding browser/UI contract evidence cleanly across those same roles. | `TimberEquip-main/scripts/seed-staging-role-matrix.mjs`, `TimberEquip-main/output/qa/staging-role-matrix-20260329.json`; next step: finish staged browser validation of role-safe tabs and high-risk flows. |
| `ENT-P1-02` Verify managed account creation, limits, inheritance, and seat enforcement | In Progress | Managed-seat logic exists, but full evidence and edge-case validation are incomplete. | Validate across admin, dealer, and pro-dealer roles. |
| `ENT-P1-03` Verify profile/storefront save flows, slug generation, canonical paths, and dealer pages | In Progress | Storefront/profile systems exist and canonical dealer paths are present. | Finish save-flow and public-page evidence. |

### B. Listings, Search, And Discovery

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-04` Enforce required listing fields consistently | Complete | Seller listing create and update now enforce the same core quality standard before content can stay in the lifecycle lane, including category/subcategory, manufacturer/model, year, hours, condition, price, location, image minimums, video URL validation, and featured-cap constraints. Quality-sensitive edits to approved listings are re-queued for review automatically, and seller-facing delete actions now also run through the authenticated account-listing API instead of direct browser deletes. | `TimberEquip-main/functions/index.js`, `TimberEquip-main/src/services/equipmentService.ts`; verified with `node --check`, `npm run build`, targeted staging and production `hosting,functions:apiProxy` deploys, and passing smoke checks on March 29, 2026 |
| `ENT-P1-05` Validate expiration, renewal, and sold-state handling | In Progress | Lifecycle actions for expire, relist, sold, archive exist. | Capture complete manual/automated evidence. |
| `ENT-P1-06` Remove demo inventory from public production contexts | Open | Demo/sample patterns still appear in some feature areas. | Audit all seed/demo helpers in public UX. |
| `ENT-P1-07` Redesign public search to avoid broad full-collection reads | In Progress | Some fallback and resilience work exists, but not a final scale-safe model. | Move to narrower query/server-side pagination patterns. |
| `ENT-P1-08` Add production-ready faceting, zero-results handling, and deep-link validation | Open | Search works, but a full enterprise search contract is not yet evidenced. | Finish search UX hardening. |
| `ENT-P1-09` Verify bookmarks, compare, saved searches, and alert emails | In Progress | Features exist, and saved-search reads/writes are now more resilient through auth-scoped last-good cache fallback plus cache updates after create/edit/delete. Full alert-email and bookmarks/compare evidence is still missing. | `TimberEquip-main/src/services/userService.ts`, `TimberEquip-main/src/pages/Search.tsx`, `TimberEquip-main/src/pages/Profile.tsx`, `TimberEquip-main/src/pages/Bookmarks.tsx`; next step: run staged end-to-end coverage for save, pause, delete, and alert delivery. |

### C. Billing, Payments, And Seller Plans

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-10` Verify seller plan purchase, renewal, expiration, cancellation, and webhook sync | In Progress | Subscription enforcement and webhook work exist. Account access refresh is now more resilient because the billing service falls back to the last known account-access summary under quota pressure, and the user-facing account surface now includes a real authenticated Stripe billing portal entry from `Profile -> Account Settings` for payment-method, invoice, and cancellation management. Staging now also has repeatable checkout-start evidence for `individual_seller`, `dealer`, and `fleet_dealer`, and the `Owner-Operator` post-checkout account state has been confirmed after a real staging payment. The remaining gap is the fuller plan-state evidence pack across renewal/expiration/cancellation scenarios and the rest of the seller-plan matrix. | `TimberEquip-main/src/services/billingService.ts`, `TimberEquip-main/src/pages/Profile.tsx`, `TimberEquip-main/functions/index.js`, `TimberEquip-main/scripts/validate-staging-billing-start.mjs`, `TimberEquip-main/output/qa/staging-billing-start-20260329.json`; production browser verification of `Manage Billing` redirect completed on March 29, 2026; next step is finish the staged plan-state test matrix for `dealer` and `fleet_dealer`, then capture renewal/expiration/cancellation evidence. |
| `ENT-P1-11` Verify owner-operator quantity logic and caps | In Progress | Plan logic exists, but evidence is incomplete. | Validate listing caps and managed seat logic. |
| `ENT-P1-12` Verify billing audit logs, invoices, subscriptions, and admin views | In Progress | Billing now loads through a consolidated authenticated bootstrap and the admin Billing dashboard renders `Recent Invoices`, `Active Subscriptions`, `Billing Audit Trail`, `Account Governance Audit`, and `Seller Legal Acceptances` from that shared contract. Remaining work is evidence capture and a full authenticated QA pass in staging/production, plus the remaining staged billing validation. | `TimberEquip-main/functions/index.js`, `TimberEquip-main/src/services/billingService.ts`, `TimberEquip-main/src/pages/AdminDashboard.tsx`; build passed on March 28, 2026 |
| `ENT-P1-13` Remove hard-coded Stripe assumptions | Open | Stripe is functional, but assumptions are not fully audited out. | Review plan mapping, fallback logic, and statement labels. |

### D. Lead Handling And Transaction Support

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-14` Verify inquiry routing, scoring, notes, and response metrics | In Progress | Core inquiry routing exists. | Finish operator-view validation and evidence. |
| `ENT-P1-15` Verify financing request capture and notifications | In Progress | Core financing flow exists. | Finish admin/buyer visibility checks. |
| `ENT-P1-16` Verify inspection request capture, dealer matching, updates, and state changes | In Progress | Inspection flows exist with dealer matching. | Complete end-to-end evidence. |
| `ENT-P1-17` Verify shipping/logistics inquiry flows | Open | Public route exists, but no evidence pack shows the full flow. | Audit if in launch scope. |
| `ENT-P1-18` Verify call log creation, visibility, filters, and admin access | In Progress | Call logging exists. | Finish role-based QA and evidence. |

### E. DealerOS And Syndication

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-19` Verify dry-run and live ingest for JSON, XML, and remote feed URLs | In Progress | JSON/CSV/API flows are implemented; checklist still needs XML and full evidence. | Complete matrix and evidence. |
| `ENT-P1-20` Verify nightly sync persistence and reporting | In Progress | Dealer feed operator visibility is materially better: the admin Dealer Feeds surface now shows summary cards for last run time, current feed status, failure reason, and profile/nightly-sync status alongside ingest logs. Remaining work is full end-to-end validation of persisted nightly sync behavior and reporting accuracy. | `TimberEquip-main/src/pages/AdminDashboard.tsx`, `TimberEquip-main/src/services/dealerFeedService.ts`; build passed on March 28, 2026 |
| `ENT-P1-21` Verify public dealer feed JSON, embed URL, and hosted inventory outputs | In Progress | Dealer feed/public output work exists. | Finish verification for all eligible roles. |
| `ENT-P1-22` Verify duplicate handling by external source and seller scope | In Progress | Duplicate and ingest logic exists. | Audit current implementation against expected lineage rules. |

### F. Content, CMS, And Editorial Controls

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-23` Decide one canonical public news source | Open | Audit still shows mixed `news` and `blogPosts` model. | Decide and remove legacy dependency. |
| `ENT-P1-24` Verify CMS draft/review/publish/schedule/rollback | In Progress | CMS workflow exists. | Finish full editorial test matrix and rollback evidence. |
| `ENT-P1-25` Verify media library CRUD and role protections | In Progress | Media library exists. | Finish rules/role audit and evidence. |
| `ENT-P1-26` Verify content blocks are used or removed | Open | Content-block role/rules exist, but usage cleanup is not complete. | Decide keep vs retire. |

### G. Localization And Currency

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P1-27` Decide whether runtime translation is a launch requirement | Open | No final launch decision is documented. | Product decision required. |
| `ENT-P1-28` Verify graceful fallback when translation keys are unavailable | Open | No completed evidence in current repo/docs. | Add fallback behavior or document deferment. |
| `ENT-P1-29` Verify currency conversion cache/display consistency | Open | Currency UI exists, but local API parity and evidence are incomplete. | Complete parity and QA. |

## Phase 3: Security, Compliance, And Control Hardening

### A. Application Security

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P2-01` Audit all secrets and move production-only values server-side | In Progress | Exposed Firebase browser keys were removed from tracked source and rotated; broader secret audit remains open. | Continue full secret inventory and least-privilege review. |
| `ENT-P2-02` Confirm remote feed URL validation protects against SSRF | Open | No complete SSRF hardening evidence is documented. | Audit remote fetch validation. |
| `ENT-P2-03` Decide whether `server.ts` is dev-only or supported production runtime | Open | Repo still uses both a local server and Firebase Functions. | Make and document explicit decision. |
| `ENT-P2-04` Replace mock/diagnostic upload behavior | In Progress | The Profile upload-test UI has been removed, but the local diagnostic `/api/upload` endpoint still exists in `server.ts`. | `TimberEquip-main/src/pages/Profile.tsx`, `TimberEquip-main/server.ts`; retire or replace `/api/upload`. |
| `ENT-P2-05` Verify rate limiting strategy by endpoint class | Open | No unified rate-limiting evidence pack exists. | Define and document by endpoint class. |
| `ENT-P2-06` Run dependency audit and resolve critical vulnerabilities | Open | No completed dependency-audit evidence found. | Run `npm audit`, triage, document. |

### B. Data Protection And Privacy

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P2-07` Verify consent logging, privacy alignment, and account deletion behavior | In Progress | Seller legal acceptance persistence exists. | Extend to broader consent/deletion audit. |
| `ENT-P2-08` Verify personal data retention and deletion policy | Open | No full documented retention policy found. | Define retention/deletion procedures. |
| `ENT-P2-09` Document lawful basis and handling for marketing emails and submissions | Open | No full compliance note found in current evidence set. | Add compliance operations document. |

### C. Backup, Recovery, And Incident Readiness

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P2-10` Define backup and restore for Firestore and Storage | Open | No finished backup/restore runbook found. | Add actual backup/restore procedures. |
| `ENT-P2-11` Create rollback instructions for hosting and Functions deploys | In Progress | Production rollback runbook exists; full hosting/functions rollback evidence is not yet complete. | Expand and test rollback instructions. |
| `ENT-P2-12` Create incident response runbooks | In Progress | Runbooks exist for billing webhook failure, dealer feed sync failure, Firestore quota degradation, listing visibility mismatch, and production rollback. | Add missing email-failure and indexing-mistake runbooks; test them. |

## Phase 4: Performance, Scale, And Observability

### A. Performance

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P3-01` Establish public page performance budgets | Open | No formal budgets found. | Define bundle, LCP, CLS, TTFB, image budgets. |
| `ENT-P3-02` Audit `firestore.indexes.json` against real query patterns | Open | No current index audit evidence found. | Perform query/index review. |
| `ENT-P3-03` Reduce duplicate/full-scan listing reads on Home and Search | In Progress | Resilience/fallback work exists, but full scale-safe redesign is not done. | Continue server/query-side narrowing. |
| `ENT-P3-04` Verify image optimization and CDN delivery behavior | Open | No dedicated evidence found. | Audit all major image paths. |
| `ENT-P3-05` Validate mobile performance on key pages | Open | No formal mobile performance evidence found. | Run measured mobile tests. |

### B. Observability

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P3-06` Add centralized error tracking | Open | Monitoring/alerts exist, but no Sentry or equivalent evidence found. | Choose and wire centralized error tracking. |
| `ENT-P3-07` Standardize structured logs for key domains | In Progress | Significant logging exists in Functions and governance code, but not yet a finished standard. | Formalize log schema across domains. |
| `ENT-P3-08` Add uptime and synthetic monitoring | In Progress | Smoke checks and deployment validation exist; full synthetic monitoring is not yet evidenced. | Add persistent uptime/synthetic coverage. |
| `ENT-P3-09` Add alerting for failed jobs and critical Functions errors | In Progress | Generated and applied alert policies exist for staging and production. | Extend coverage to full critical-job set and validate alerts. |

## Phase 5: QA Automation And Audit Evidence

### A. Automated Test Coverage

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P4-01` Add CI build validation | In Progress | Workflow scaffolds exist for preview/staging/production, but no robust CI test rail exists yet. | Add explicit build validation and gate it. |
| `ENT-P4-02` Add E2E tests for critical flows | Open | No real E2E test suite found in repo evidence. | Add Playwright coverage for the listed critical flows. |
| `ENT-P4-03` Add service-level tests for filters, saved-search matching, lifecycle, and seller caps | Open | No service-level test suite found. | Add unit/integration coverage for core domain logic. |

### B. Accessibility And SEO Audits

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P4-04` Run accessibility audit on key pages | Open | No documented accessibility audit results found. | Run and capture results for key pages. |
| `ENT-P4-05` Run SEO audit on public production mode | In Progress | SEO architecture and release gating exist, but no complete audit evidence pack is present. | Capture robots, canonical, sitemap, structured-data, and 404 audit results. |

### C. Audit Evidence Pack

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-P4-06` Create complete release evidence pack | Open | Evidence is scattered across docs, monitoring JSON, scripts, and runbooks. | Consolidate into one release/audit packet. |

## Phase 6: Data Platform Foundation For Tier 2 Completion

This section folds the enterprise data-platform plan into the Tier 2 checklist. These items are not a full Tier 3 cutover. They are the minimum foundation work needed so TimberEquip can reach stable Tier 2 without remaining trapped by Firestore-heavy governance.

| ID | Status | Current State | Evidence / Next Step |
| --- | --- | --- | --- |
| `ENT-DP-01` Canonical Postgres listing-governance schema draft | Complete | First migration exists. | `database/postgres/migrations/001_listing_governance_phase1.sql` |
| `ENT-DP-02` Listing lifecycle transition matrix | Complete | Transition matrix exists. | `database/postgres/listing_lifecycle_transition_matrix.json` |
| `ENT-DP-03` Firestore-to-Postgres mapping for listing governance | Complete | Mapping document exists. | `database/postgres/listing_governance_firestore_mapping.md` |
| `ENT-DP-04` Data Connect scaffold for listing governance | Complete | Data Connect scaffold exists. | `dataconnect/README.md`, `dataconnect/schema/listing_governance.gql`, `dataconnect/listingGovernance/lifecycle.gql` |
| `ENT-DP-05` Governance shadow/audit artifacts wired into Firebase write paths | In Progress | Governance rules and artifacts exist and are wired into Firebase runtime. | `functions/listing-governance-rules.js`, `functions/listing-governance-artifacts.js`, `functions/index.js` |
| `ENT-DP-06` Actual staging Cloud SQL instance and Data Connect service | Open | Scaffold exists, but no evidence of initialized live service. | Stand up real staging instance and service. |
| `ENT-DP-07` First Cloud Run worker for lifecycle/anomaly processing | Open | Responsibilities are documented, not yet implemented as a live worker. | Stand up first worker in staging. |
| `ENT-DP-08` BigQuery datasets and first marts | Open | Planned only. | Create datasets/marts for governance, ingestion, and billing reporting. |
| `ENT-DP-09` Dual-write and shadow-read cutover execution | Open | Strategy is documented, but not yet underway as a controlled migration. | Begin with listing governance domain only. |

## Final Launch Gate

| Gate | Status | Current State |
| --- | --- | --- |
| Public production deploy path is documented and tested | Complete | Deploy docs and scripts exist; production has been deployed repeatedly through the new path. |
| Staging deploy path is documented and tested | Complete | Staging project, deploy path, and docs exist. |
| No unresolved Sev 1 or Sev 2 defects remain | Open | Not yet true. |
| All public routes are functional or intentionally disabled | Open | High-value routes mostly work, but fake/dead UI and 404 issues remain. |
| All critical flows pass automation and manual smoke tests | Open | Manual smoke exists; automation does not. |
| Monitoring and alerting are active | In Progress | Alert policies are generated and applied; broader validation is still needed. |
| Rollback instructions are tested | In Progress | Runbooks exist, but test evidence is incomplete. |
| Audit evidence pack is complete | Open | Not yet assembled. |

## Recommended Immediate Execution Order

The next work should happen in this order:

1. Add `dealerFeedProfiles` Firestore rules and finish the rules matrix.
2. Remove fake/dead UI:
   - `Auctions`
   - blog filter/newsletter CTA
   - Profile `File Upload Test`
3. Close local-vs-production API drift for the high-impact endpoints in `server.ts`.
4. Replace the wildcard-home route with a real 404.
5. Finish the remaining deeper editor/detail/mutation paths after the first-load signed-in/admin bootstrap work, then capture evidence that the hardened reads stay stable under quota pressure.
6. Add Playwright coverage for the critical flows already identified in this checklist.
7. Start the actual staging Data Connect and Cloud SQL governance lane.

## Verification Commands

Run after each major implementation slice:

```bash
cd /workspaces/TimberEquip2/TimberEquip-main && npm run build
```

Recommended additional checks:

```bash
cd /workspaces/TimberEquip2/TimberEquip-main && npm run lint
```

## Definition Of "No Issues"

For this project, interpret "no issues" as:

- no known Sev 1 defects
- no known Sev 2 defects
- all Sev 3 items triaged with owners and dates
- no deceptive public UX
- no production-breaking rule mismatches
- no unsupported critical runtime path

Anything weaker than that is not Tier 2 audit-ready.
