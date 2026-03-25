# TimberEquip Full Site Audit And Firestore Plan

Audit date: 2026-03-25

## Scope

This audit covers the current TimberEquip web app, its Firebase / Firestore-backed features, and the major failure points observed during live troubleshooting.

Audit basis:

- source review across page components, services, Firebase Functions, and Firestore rules
- production log review for `apiProxy`
- local build validation
- direct tracing of known broken flows reported during testing

Status definitions used in this report:

- Implemented and working
- Implemented but needs fixes
- Partially implemented
- Missing

## Executive Summary

### Confirmed Working

- Frontend build currently succeeds
- Firebase Functions source currently parses cleanly
- Admin user management backend and frontend wiring exists
- Contact form writes to Firestore
- Seller listing creation flow exists end-to-end
- Billing checkout session creation endpoints exist
- Listing detail page crash caused by hook ordering was fixed in code

### Confirmed Broken Or Unreliable

- CMS blog publishing is implemented but not reliably visible on the Equipment News page
- CMS save/publish persistence is affected by Firestore rule and query mismatches
- Ad Programs checkout is failing with `Internal server error` because Stripe secret formatting is broken in production logs
- Ad Programs support/media kit flow depends on Firestore writes and email triggers, but SMTP auth is failing in production logs
- Public Equipment News feed is split between legacy `news` data and CMS `blogPosts`, which causes inconsistency
- Several collections used by code are not defined in Firestore rules or are only partially planned
- Dealer / fleet dealer / Meta connection architecture is mostly planned but not implemented

### Highest Priority Fixes

1. Fix Stripe secret and redeploy `apiProxy`
2. Fix CMS publish/save persistence and Firestore blog rules
3. Make the public news page read one canonical CMS source of truth
4. Complete listing audit and state-machine enforcement
5. Add missing Firestore collections and rules for dealer feeds, dealer account hierarchy, and Meta connections

## Build And Runtime Evidence

### Verified

- `npm run build` passes
- `node --check functions/index.js` passes
- Production `apiProxy` logs show live request handling

### Production Errors Observed In Logs

- Stripe checkout failure:
  - `StripeConnectionError`
  - `Invalid character in header content ["Authorization"]`
  - strong evidence that `STRIPE_SECRET_KEY` contains whitespace or invalid characters in production secret value
- SMTP failure:
  - `535 Authentication failed: Bad username / password`
  - email-triggered features are unreliable until SMTP credentials are corrected

## Feature Inventory

| Feature Area | Files / Services | Current Status | Evidence | Known Issues | Action |
|---|---|---|---|---|---|
| Homepage marketplace hero and stats | `src/pages/Home.tsx`, `src/services/equipmentService.ts` | Implemented but needs fixes | Loads listings, category metrics, sold ticker, featured inventory | Homepage still depends on `featured` listings; reported lag on mobile; data quality depends on listing integrity | Fix |
| Search and browse inventory | `src/pages/Search.tsx`, `src/services/equipmentService.ts` | Implemented but needs fixes | Listing queries, filters, saved search hooks, browse routes exist | Visibility depends on listing schema consistency, expiration rules, and payment fields | Fix |
| Listing detail page | `src/pages/ListingDetail.tsx`, `src/services/equipmentService.ts`, `src/services/geminiService.ts` | Implemented but needs fixes | Full listing display, seller card, inquiry/financing/logistics, call logging, AI specs | React hook-order runtime issue was found; listing reads still depend on listing data being public-rule compliant | Fix |
| Seller profile page | `src/pages/SellerProfile.tsx`, `src/services/equipmentService.ts` | Partially implemented | Route and fetch pattern exist | Not fully audited in runtime; depends on storefront and user document consistency | Fix |
| Sell / publish listing flow | `src/pages/Sell.tsx`, `src/services/equipmentService.ts`, `src/services/billingService.ts`, `functions/index.js` | Implemented but needs fixes | Listing save, checkout confirm, subscription gating, listing modal all exist | Listing lifecycle is not fully audited; state machine is not formally enforced; publish/payment/expiration still need canonical validation | Fix |
| Profile page | `src/pages/Profile.tsx`, `src/services/userService.ts`, `src/services/equipmentService.ts`, `src/services/storageService.ts` | Implemented but needs fixes | Profile edits, saved assets, saved searches, listings, calls, financing, export/delete flows exist | Depends on user profile consistency, auth email update rules, and storage helpers not yet fully audited | Fix |
| Login / Register | `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/components/AuthContext.tsx` | Implemented but needs fixes | Auth flows, reCAPTCHA checks, Google login, password reset wiring exist | Requires broader runtime verification of all error states and profile creation consistency | Fix |
| Equipment News page | `src/pages/Blog.tsx`, `src/services/equipmentService.ts`, `src/services/cmsService.ts` | Implemented but needs fixes | Page renders list UI and cards, CMS service exists | Public feed was not reading CMS as canonical source; legacy `news` collection mismatch; publish visibility inconsistent | Fix |
| CMS Content Studio | `src/pages/AdminDashboard.tsx`, `src/components/admin/CmsEditor.tsx`, `src/services/cmsService.ts` | Implemented but needs fixes | Draft, publish, revisions, scheduling, delete UI exist | Save/publish persistence unreliable on refresh; author validation and public query/rules mismatches caused failures | Fix |
| Media library | `src/components/admin/MediaLibrary.tsx`, `src/services/cmsService.ts`, `src/services/storageService.ts` | Partially implemented | Upload and tag methods exist | Not fully audited against Firestore rules and storage cleanup/orphan handling | Fix |
| Content blocks | `src/services/cmsService.ts`, `src/pages/AdminDashboard.tsx` | Implemented but needs fixes | CRUD exists | Frontend/admin usage exists, but public rendering and governance were not audited | Fix |
| Admin users management | `functions/index.js`, `src/services/adminUserService.ts`, `src/pages/AdminDashboard.tsx` | Implemented but needs fixes | Auth-backed listing of users, edit, lock, unlock, delete, reset password exist | Recently rewired; needs browser validation after deploy; permissions and error state handling still need runtime pass | Fix |
| Billing admin panels | `src/services/billingService.ts`, `src/pages/AdminDashboard.tsx`, `functions/index.js` | Partially implemented | Invoice/subscription/audit endpoints and UI exist | Stripe environment instability currently blocks confidence in functionality | Fix |
| Ad Programs page | `src/pages/AdPrograms.tsx`, `src/services/billingService.ts`, `functions/index.js` | Implemented but needs fixes | Marketplace stats, plan checkout, support/media kit request UI exist | Checkout returns internal server error due Stripe secret formatting; email side-effects also unreliable due SMTP auth failure | Fix |
| Contact page | `src/pages/Contact.tsx`, Firestore `contactRequests` | Implemented but needs fixes | Writes directly to Firestore with reCAPTCHA | Depends on Firestore access and backend email trigger; SMTP currently failing | Fix |
| Financing requests | `src/pages/ListingDetail.tsx`, `src/services/equipmentService.ts`, Firestore `financingRequests` | Implemented but needs fixes | Submission flow exists and writes to Firestore | Admin handling and end-to-end notifications not fully audited | Fix |
| Calls logging | `src/pages/ListingDetail.tsx`, `src/services/equipmentService.ts`, Firestore `calls` | Implemented but needs fixes | Call logs are written from listing detail | Full seller/admin read paths not fully audited | Fix |
| Saved searches / alerts | `src/services/userService.ts`, `src/pages/Search.tsx`, Firestore `savedSearches` | Partially implemented | CRUD methods and UI hooks exist | Alert delivery workflow and notification system not fully implemented/audited | Fix |
| Bookmarks / favorites | `src/components/AuthContext.tsx`, `src/services/userService.ts`, `src/pages/Bookmarks.tsx` | Implemented but needs fixes | Favorite toggles and bookmarks page exist | Needs runtime validation across auth states and deleted listings | Fix |
| Auctions page | `src/pages/Auctions.tsx`, `src/services/equipmentService.ts` | Partially implemented | Page and collection support exist | Appears mostly static / not fully integrated with live workflows | Extend |
| Compare page | `src/pages/Compare.tsx` | Implemented but needs fixes | Compare route and card linking exist | Needs runtime validation and listing schema consistency | Fix |
| Calculator page | `src/pages/Calculator.tsx` | Implemented and working | Local calculator UI | No backend dependency seen | Keep |
| Categories page | `src/pages/Categories.tsx` | Implemented but needs fixes | Category cards and links exist | Mobile animation performance and data fidelity still need broader validation | Fix |
| About / Terms / Privacy / Cookies | Static pages | Implemented and working | Static routes render | Content accuracy separate from app functionality | Keep |
| Dealer feed ingestion | `src/services/dealerFeedService.ts`, `functions/index.js` | Partially implemented | Ingest endpoint and admin UI exist | Uses `dealerFeedIngestLogs` collection not present in rules; not fully audited | Extend |
| Dealer / fleet account hierarchy | Phase plan only, partial admin seat handling in code | Partially implemented | Managed sub-account logic exists | Canonical dealer collections and branch model are missing | Build |
| Meta Business connection | Planned in audit docs only | Missing | No stable dealer-scoped Meta asset connection flow present | Requires new data model and permission model | Build |

## Current Critical Failures List

### P0 Production Blockers

1. Ad Programs checkout internal server error
   - Root cause evidenced in production logs: invalid Stripe Authorization header caused by malformed `STRIPE_SECRET_KEY`
   - Affected files: `functions/index.js`, `src/pages/AdPrograms.tsx`, `src/services/billingService.ts`
   - Action: fix secret, redeploy `apiProxy`, validate checkout flow

2. CMS post publish/save not reliably persisting to public Equipment News
   - Root causes:
     - public page was not using `blogPosts` as canonical source
     - `blogPosts` public query/rules mismatch
     - CMS updates depended on author identity / rule compatibility
   - Affected files: `src/services/cmsService.ts`, `src/components/admin/CmsEditor.tsx`, `src/services/equipmentService.ts`, `firestore.rules`, `src/pages/Blog.tsx`
   - Action: finish canonical CMS feed, validate rules, deploy and browser-test save/publish/refresh

3. SMTP-backed notifications failing
   - Production evidence: `535 Authentication failed: Bad username / password`
   - Affected features: contact requests, media kit requests, inquiry-related emails, billing receipt emails, support flows
   - Action: correct SMTP secrets and run full notification test matrix

### P1 High-Priority Functional Defects

1. Listing pipeline is not fully state-machine controlled
2. Listing expiration behavior not fully audited against search/public visibility
3. Public listing visibility depends on field consistency (`approvalStatus`, `paymentStatus`, `status`, `expiresAt`)
4. Listing detail visibility can still fail if listing documents do not satisfy public Firestore read conditions
5. Content Studio mobile usability needed horizontal scrolling and still needs broader mobile QA
6. Homepage and mobile menu animation performance need a broader audit across all motion-heavy pages

### P2 Structural / Technical Debt

1. Legacy `news` collection and CMS `blogPosts` represent duplicated content systems
2. Dealer feed logging collection is used by code but not represented in rules
3. Dealer / fleet / branch / Meta architecture is not yet backed by canonical Firestore collections
4. No formal listing audit scripts or admin anomaly reports exist yet

## Listing Pipeline Audit Against Phase 1 Requirements

### Entry Points

Observed listing create/update paths:

- seller listing create via `Sell` page and `ListingModal`
- admin listing create/edit via admin dashboard modal
- listing update via `equipmentService.updateListing`
- listing checkout confirmation via billing endpoints in `apiProxy`

Current status: Implemented but needs fixes

Key gap: no completed audit proving all entry points produce the same canonical listing schema and state transitions.

### Data Model Integrity

Current listing model contains many expected fields, but enforcement is still distributed across UI, service logic, Firestore rules, and Stripe webhook logic.

Current status: Partially implemented

Known issues:

- canonical schema is not formally locked
- public visibility depends on a combination of `approvalStatus`, `paymentStatus`, `status`, and `expiresAt`
- listing state transitions are not yet explicitly blocked outside an allowed state machine

### Publish Workflow Integrity

Observed states in code:

- draft-like creation path through listing modal
- payment initiation through checkout session
- post-checkout confirmation
- publish/review logic based on role and payment

Current status: Implemented but needs fixes

Known issues:

- no full proof yet that failed or abandoned payment cannot leave inconsistent listing state
- no formal replay-proof audit document yet for webhook-driven transitions
- no formal regression suite proving publish rules hold across relist, edit, and renewal cases

### Payment Integrity

Current status: Implemented but needs fixes

Evidence:

- Stripe checkout endpoints exist for listing and account subscriptions
- billing confirmation endpoints exist
- webhook handling exists

Known issues:

- production Stripe secret formatting issue causes hard checkout failures
- webhook path had secret whitespace issue previously observed
- billing is not yet stable enough to mark working

### Expiration Integrity

Current status: Partially implemented

Evidence:

- Firestore rules refer to `expiresAt`
- code filters expired listings out when public
- scheduled expiration jobs exist in Functions

Known issues:

- not yet fully proven as single source of truth
- renewal / relist / expiration edit behaviors need formal verification

### Public Listing Correctness

Current status: Implemented but needs fixes

Evidence:

- listing cards, detail page, search, compare, and profile rendering exist

Known issues:

- dependent on canonical listing schema not yet locked
- listing detail access can fail when records do not satisfy public read rules

### Storage Integrity

Current status: Partially implemented

Evidence:

- storage service has image/video upload, variant generation, metadata, deletion helpers

Known issues:

- orphan cleanup not yet audited
- primary image determinism not yet fully documented
- storage / Firestore reference consistency not yet proven end-to-end

### Search / Browse Integrity

Current status: Implemented but needs fixes

Evidence:

- search filters and browse paths exist
- public listing filtering uses approval/payment/status rules

Known issues:

- must be validated against expired, sold, unpaid, draft, and admin-only listings

## Firestore: Existing, Missing, And Needed

### Existing Collections Represented In Rules

- `users`
- `storefronts`
- `listings`
- `blogPosts`
- `auditLogs`
- `inquiries`
- `financingRequests`
- `invoices`
- `billingAuditLogs`
- `consentLogs`
- `subscriptions`
- `calls`
- `savedSearches`
- `mediaKitRequests`
- `contactRequests`
- `mediaLibrary`
- `contentBlocks`
- `media-metadata`
- `user-storage-usage`
- `auctions`
- `notifications`
- `inventorySnapshots`
- `webhook_events`

### Collections Used By Code But Missing Or Incomplete In Rules / Architecture

1. `dealerFeedIngestLogs`
   - Used by `dealerFeedService.getRecentLogs`
   - Missing from Firestore rules
   - Needed now if dealer feed logging is expected to work

2. `news`
   - Legacy content source used by `equipmentService.getNews`
   - Not represented in rules
   - Recommendation: do not expand it; migrate fully to `blogPosts`

### Collections That Need To Be Created For The Planned Dealer / Meta Architecture

1. `dealers`
   - Canonical top-level dealer account records
   - Required fields:
     - `businessName`
     - `accountType` (`dealer` or `fleet_dealer`)
     - `status`
     - `billingProfile`
     - `createdAt`
     - `updatedAt`

2. `dealerUsers`
   - Dealer membership and permission mapping
   - Required fields:
     - `dealerId`
     - `userUid`
     - `role` (`dealer_admin`, `dealer_staff`)
     - `permissions`
     - `createdAt`
     - `updatedAt`

3. `dealerBranches`
   - Required for fleet / multi-location support
   - Required fields:
     - `dealerId`
     - `name`
     - `location`
     - `metaOverrides`
     - `createdAt`
     - `updatedAt`

4. `dealerMetaConnections`
   - Dealer-scoped Meta Business asset mapping
   - Required fields:
     - `dealerId`
     - `branchId` (optional)
     - `businessId`
     - `pageId`
     - `adAccountId`
     - `catalogId`
     - `pixelId`
     - `instagramBusinessId`
     - `permissions`
     - `connectedByUserId`
     - `connectedAt`
     - `status`
     - `lastValidatedAt`
     - `lastError`

5. `dealerMetaValidationLogs`
   - Needed to troubleshoot asset connectivity and permission failures

6. `listingAuditReports`
   - Needed for Phase 1 anomaly reporting and admin audit runs

7. `listingStateTransitions`
   - Optional but strongly recommended to track state mutations and detect illegal transitions

8. `listingMediaAudit`
   - Optional but recommended if orphan/media mismatch cleanup is to be automated

### Firestore Indexes Likely Needed

1. `listings`
   - `approvalStatus + paymentStatus`
   - `sellerUid + paymentStatus`
   - `sellerUid + status`
   - `status + expiresAt`
   - category/manufacturer/model combinations used by search

2. `blogPosts`
   - `status + updatedAt`
   - `reviewStatus + updatedAt`

3. `subscriptions`
   - `userUid + status`

4. `dealerFeedIngestLogs`
   - `processedAt desc`

## Recommended Canonical Data Direction

### Content System

- Use `blogPosts` as the single source of truth for Equipment News
- Retire or migrate `news`
- Public page should query only published posts
- Admin editor should always save complete author and status fields compatible with Firestore rules

### Listing System

- Define one canonical listing schema
- Enforce a strict state machine
- Treat `paymentStatus`, `status`, `publishedAt`, and `expiresAt` as canonical fields
- Add anomaly reports for invalid published listings

### Dealer Architecture

- Keep `users` as auth/profile layer
- Add dealer-scoped collections instead of overloading user documents for every future dealer concept

## Prioritized Fix Queue

### Sprint 1

1. Fix and deploy Stripe secret normalization
2. Fix and deploy CMS persistence and public Equipment News source of truth
3. Correct SMTP secrets so email-driven workflows stop failing silently
4. Remove dependency on legacy `news` collection for public news if possible

### Sprint 2

1. Perform full listing schema audit
2. Document listing state machine
3. Add Firestore/admin anomaly checks for invalid paid/published/expired listings
4. Validate listing visibility rules across search, detail, and profile pages

### Sprint 3

1. Add missing Firestore collections and rules for dealer feeds and dealer hierarchy
2. Implement canonical dealer account model
3. Add branch-level and role-based access model

### Sprint 4

1. Build Meta Business connection flow
2. Store dealer-scoped Meta assets
3. Add validation logs and health checks

## Immediate Recommended Next Actions

1. Deploy the pending `apiProxy` Stripe secret normalization fix
2. Deploy Firestore rules update for blog post persistence compatibility
3. Browser-test the exact CMS workflow:
   - create draft
   - refresh admin
   - publish
   - refresh admin
   - confirm appearance on Equipment News
4. Correct SMTP credentials and rerun:
   - contact request
   - media kit request
   - password reset / verification email
   - invoice receipt email

## Final Status

The site is not ready to be considered fully functional end-to-end.

Core marketplace, auth, listing, admin, and billing foundations exist, but multiple critical flows remain in the `implemented but needs fixes` category. The most urgent blockers are billing secret configuration, CMS content persistence/public visibility, notification credentials, and the still-incomplete formal audit of the listing pipeline.