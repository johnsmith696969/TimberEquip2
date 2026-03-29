# TimberEquip Full Functionality Audit

Date: March 28, 2026

## Executive Summary

The codebase is materially stronger than a prototype. The core marketplace flows are present: authentication, role-based accounts, listing creation, listing search/detail, inquiries, financing capture, CMS/blog publishing, dealer syndication, Stripe-backed seller plans, and Firebase-hosted API endpoints all exist.

The site is not yet at a tier-2 enterprise readiness bar. The main blockers are not compilation errors. They are operational and architectural issues: the current repo is configured for noindex mode, the app has two different backend surfaces with mismatched API coverage, DealerOS saved feed profiles appear to be blocked by missing Firestore rules, the Auctions page is still a demo experience, search/home data access will not scale cleanly, and there is no automated test safety net.

Current assessment:

- Build health: good
- Core functionality: mostly implemented
- Production parity: inconsistent
- Enterprise readiness: not yet there
- Launch readiness for an indexable public marketplace: blocked until the P0 items below are resolved

## Audit Method

This audit is based on direct code and configuration review plus a production build validation.

Reviewed:

- Route surface in `TimberEquip-main/src/App.tsx`
- Frontend pages and services under `TimberEquip-main/src/`
- Firebase Functions API proxy in `TimberEquip-main/functions/index.js`
- Local Express/Vite server in `TimberEquip-main/server.ts`
- Firestore rules and indexes in `TimberEquip-main/firestore.rules` and `TimberEquip-main/firestore.indexes.json`
- Deploy and SEO configuration in `TimberEquip-main/firebase.json`, `TimberEquip-main/public/robots.txt`, and `TimberEquip-main/scripts/prepare-seo-mode.mjs`

Validation performed:

- `npm run build` completed successfully in `TimberEquip-main`
- workspace diagnostics reported no current TypeScript/editor errors
- no automated unit, integration, or E2E test suite was found in the repo

## What Is Working

### Strong Functional Areas

1. Authentication, roles, and profile/storefront management are broadly implemented.
   Evidence: `TimberEquip-main/src/components/AuthContext.tsx`, `TimberEquip-main/src/pages/Profile.tsx`, `TimberEquip-main/src/services/userService.ts`, `TimberEquip-main/firestore.rules`

2. Listing creation, seller plan gating, listing payment confirmation, and listing detail/search flows are real product code, not stubs.
   Evidence: `TimberEquip-main/src/pages/Sell.tsx`, `TimberEquip-main/src/services/equipmentService.ts`, `TimberEquip-main/src/pages/Search.tsx`, `TimberEquip-main/src/pages/ListingDetail.tsx`, `TimberEquip-main/src/services/billingService.ts`

3. Inquiry, financing, and inspection request capture are implemented with Firestore-backed persistence and Functions-triggered email flows.
   Evidence: `TimberEquip-main/src/pages/Contact.tsx`, `TimberEquip-main/src/pages/Inspections.tsx`, `TimberEquip-main/src/services/equipmentService.ts`, `TimberEquip-main/functions/index.js`

4. CMS/blog publishing, media library, content blocks, and editorial workflows are implemented.
   Evidence: `TimberEquip-main/src/services/cmsService.ts`, `TimberEquip-main/src/pages/AdminDashboard.tsx`, `TimberEquip-main/firestore.rules`

5. Saved search alerts are more complete than the UI alone suggests. The repo includes Functions logic for new match, price-drop, and sold-status emails.
   Evidence: `TimberEquip-main/src/services/userService.ts`, `TimberEquip-main/functions/index.js`

6. Dealer feed resolution, ingest, nightly sync support, and dealer syndication are implemented on the Firebase Functions side.
   Evidence: `TimberEquip-main/src/services/dealerFeedService.ts`, `TimberEquip-main/src/pages/DealerOS.tsx`, `TimberEquip-main/functions/index.js`

## P0 Findings

### 1. The current repo is configured to block indexing site-wide

Severity: P0 launch blocker

Why this matters:

- The current repository state is configured as `noindex` and `Disallow: /`.
- That is appropriate for staging, but it is incompatible with the stated goal of a public enterprise marketplace.

Evidence:

- `TimberEquip-main/public/robots.txt` currently contains `Disallow: /`
- `TimberEquip-main/firebase.json` currently sets a global `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`
- `TimberEquip-main/src/components/Seo.tsx` defaults to noindex unless `VITE_ALLOW_INDEXING === 'true'`
- `TimberEquip-main/scripts/prepare-seo-mode.mjs` shows that indexable mode is opt-in and the current checked-in config is noindex

Impact:

- Organic discovery is fully blocked in the current repo state
- A production deploy from the current config will not behave like a public SEO-ready marketplace

Recommendation:

- Treat the current noindex mode as staging-only
- Promote an explicit production/indexable deployment path and verify that the deployed `firebase.json`, `robots.txt`, and runtime SEO flags are aligned

### 2. The app has backend contract drift between local development and Firebase-hosted production

Severity: P0 architecture blocker

Why this matters:

- Firebase Hosting rewrites all `/api/**` requests to the Functions `apiProxy`
- Local development uses `npm run dev`, which starts `server.ts`
- Those two backends do not expose the same API surface

Evidence:

- `TimberEquip-main/firebase.json` rewrites `/api/**` to `apiProxy`
- `TimberEquip-main/package.json` uses `tsx server.ts` for `npm run dev`

Functions-only endpoints confirmed in `TimberEquip-main/functions/index.js`:

- `/inspections/closest-dealer`
- `/billing/create-account-checkout-session`
- `/admin/dealer-feeds/resolve`
- `/translate`
- `/currency-rates`
- `/market-rates`

These endpoints are consumed by the frontend in:

- `TimberEquip-main/src/pages/Inspections.tsx`
- `TimberEquip-main/src/services/billingService.ts`
- `TimberEquip-main/src/services/dealerFeedService.ts`
- `TimberEquip-main/src/services/translateService.ts`
- `TimberEquip-main/src/components/LocaleContext.tsx`
- `TimberEquip-main/src/services/marketRatesService.ts`

Server-only endpoint confirmed in `TimberEquip-main/server.ts`:

- `/api/upload`

That endpoint is consumed in:

- `TimberEquip-main/src/pages/Profile.tsx`

Impact:

- Local QA is not a reliable proxy for production
- Some features work only in Firebase-hosted environments
- The Profile page file-upload test appears to work only on the local Express server, not on the Firebase-hosted production path

Recommendation:

- Collapse to one backend contract, or formally proxy local dev through the same Functions API surface
- Remove or replace any feature that only exists on one side

### 3. DealerOS saved feed profiles likely fail in production due to missing Firestore rules

Severity: P0 functional blocker

Why this matters:

- DealerOS exposes a real UI for saving, loading, toggling, and deleting dealer feed profiles
- The client service directly reads and writes the `dealerFeedProfiles` collection
- The Functions layer also expects `dealerFeedProfiles` to exist for nightly sync processing
- The current Firestore rules file does not define a `match /dealerFeedProfiles/{...}` block

Evidence:

- Client usage: `TimberEquip-main/src/services/dealerFeedService.ts`
- UI usage: `TimberEquip-main/src/pages/DealerOS.tsx`
- Functions usage: `TimberEquip-main/functions/index.js` queries `dealerFeedProfiles` with `nightlySyncEnabled == true`
- Rules gap: `TimberEquip-main/firestore.rules` defines rules for `dealerFeedIngestLogs`, but not `dealerFeedProfiles`

Impact:

- Saved profile workflows are likely to fail with permission errors in production
- Nightly sync can exist in code while still being impossible for staff to configure through the UI

Recommendation:

- Add explicit `dealerFeedProfiles` rules aligned with dealer/admin ownership semantics
- Validate all four profile actions end-to-end: create, read, update, delete

### 4. Auctions is still a demo page, not an operational product area

Severity: P0 if auctions are part of launch scope, otherwise P1

Why this matters:

- The page presents itself as a live auction experience
- The current implementation is largely sample-data and client-only interaction

Evidence:

- `TimberEquip-main/src/pages/Auctions.tsx` defines `SAMPLE_AUCTIONS`
- It explicitly falls back to sample content when no auction data exists
- `registeredAuctions` is local React state only
- `Register to Bid` only toggles local UI state
- `View Catalog` is a button with no wired navigation or backend action

Impact:

- Users can be misled into believing auctions are live when they are not
- No real bid registration, lot browsing, bid events, or auction-state workflow is present on this page

Recommendation:

- Either remove/hide the page until real auction workflows exist, or complete the feature set with real registration, lots, catalog pages, timing, and back-office controls

## P1 Findings

### 5. Search and homepage data access will not scale cleanly

Severity: P1 performance and cost risk

Why this matters:

- `getListings()` fetches a broad Firestore result set and then applies most filtering in memory
- The search page paginates client-side after retrieving full data
- The home page calls `getListings()` multiple times and also derives category metrics from full listing data

Evidence:

- `TimberEquip-main/src/services/equipmentService.ts` starts with a broad query and applies many filters client-side
- `TimberEquip-main/src/pages/Search.tsx` uses client pagination after listing retrieval
- `TimberEquip-main/src/pages/Home.tsx` requests featured listings, then all listings, then category metrics

Impact:

- Higher Firestore read cost
- Slower page loads as inventory grows
- More client CPU and memory usage on search and landing pages

Recommendation:

- Move more filtering and pagination server-side or query-side
- Split search result payloads from analytics payloads
- Add explicit pagination/cursor APIs for public inventory browsing

### 6. No automated test coverage exists

Severity: P1 enterprise-readiness blocker

Why this matters:

- The repo currently has build validation, but not real regression protection
- That is below the bar for an enterprise marketplace with auth, billing, moderation, and dealer ingestion flows

Evidence:

- `TimberEquip-main/package.json` has no `test` script
- no `*.spec.*` or `*.test.*` files were found
- no Playwright or Cypress config was found

Impact:

- Regressions in billing, rules, search, or admin workflows will be discovered late
- Confidence in refactors and production fixes remains low

Recommendation:

- Add E2E coverage first for auth, sell flow, checkout confirmation, inquiry submission, admin approval, DealerOS ingest, and blog publish
- Add service-level tests around listing filters and saved-search matching

### 7. The blog/news surface mixes real content with unfinished UI and legacy data paths

Severity: P1/P2 depending business priority

Evidence:

- `TimberEquip-main/src/services/equipmentService.ts` merges legacy `news` with `blogPosts`
- `TimberEquip-main/src/pages/Blog.tsx` contains a visible filter input with no functional handler
- `TimberEquip-main/src/pages/Blog.tsx` contains a `Subscribe Now` CTA with no submission wiring

Impact:

- Editorial data model remains split
- Users see controls that do not actually work
- Content governance stays harder than it needs to be

Recommendation:

- Decide on one canonical content collection
- Remove or wire the sidebar controls
- Add a real newsletter or remove the CTA until available

### 8. Unknown routes resolve to the homepage instead of a dedicated 404 path

Severity: P1/P2

Evidence:

- `TimberEquip-main/src/App.tsx` routes `*` to `<Home />`

Impact:

- Bad URLs appear valid
- Search engines and users get misleading behavior
- Analytics and support debugging become noisier

Recommendation:

- Replace the wildcard-home fallback with a real 404 page and explicit not-found SEO handling

## P2 Findings

### 9. Profile "File Upload Test" is not aligned with the deployed API model

Severity: P2, but symptomatic of a larger backend inconsistency

Evidence:

- `TimberEquip-main/src/pages/Profile.tsx` exposes a user-facing `File Upload Test`
- It posts to `/api/upload`
- `TimberEquip-main/server.ts` implements `/api/upload`
- `TimberEquip-main/functions/index.js` does not expose an equivalent `/upload` route through the Firebase `apiProxy`

Impact:

- The test/upload panel can work locally while failing on the deployed Firebase-hosted site

Recommendation:

- Remove the test panel from production-facing UI, or move it to a supported storage/function path

### 10. A secondary server implementation exists that is not production-hardened

Severity: P2 architecture risk

Evidence in `TimberEquip-main/server.ts`:

- CSRF protection is commented out and replaced with a dummy token endpoint
- file virus scanning is explicitly mock logic
- the server exposes a different API contract than the Firebase Functions proxy

Impact:

- If `server.ts` is ever used beyond local development, it is not enterprise-grade in its current state

Recommendation:

- Either retire `server.ts` as a production candidate or harden and align it with the Functions contract

## Feature Status Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Auth and account roles | Good | Real implementation with role checks and profile sync |
| Storefronts and seller pages | Good | Functional and SEO-aware |
| Listing create/edit/detail | Good | Real flow with payment and approval state |
| Search and browse | Functional but not scalable enough | Works now, but currently expensive and client-heavy |
| Inquiries | Good | Real capture plus notification triggers |
| Financing requests | Good | Real capture; production worthiness depends on ops handling |
| Inspections | Good in Firebase-hosted path | Broken parity in local Express path |
| CMS/blog publishing | Good core, partial public UX | Editorial system exists; blog page has unfinished widgets |
| Saved searches and alerts | Good | Triggered email logic exists in Functions |
| Dealer feed resolve/ingest | Good core | Saved profiles blocked by rules gap |
| Dealer nightly sync | Present | Depends on fixing `dealerFeedProfiles` configuration path |
| Auctions | Not ready | Demo/sample page, not live product |
| Localization and currency conversion | Functional in Firebase-hosted path | Depends on Functions endpoints and configured secrets |
| Profile file upload test | Misaligned | Local-server-only API path |

## Enterprise Readiness Gaps

The biggest difference between the current system and a tier-2 enterprise platform is not missing UI. It is operational rigor.

Primary gaps:

1. No automated regression suite
2. Environment parity is broken between local and Firebase-hosted execution
3. Some high-visibility pages still expose demo or dead UI
4. Firestore rules and client collection usage are not fully aligned
5. Public indexing is currently disabled in the checked-in deployment config
6. Search/data access patterns are still optimized for smaller datasets than an enterprise marketplace should expect

## Recommended Execution Order

### Phase 1: Remove launch blockers

1. Fix `dealerFeedProfiles` rules and validate DealerOS saved profile workflows end-to-end
2. Unify the backend contract so local and production environments expose the same `/api` surface
3. Decide whether the current environment should be indexable and update deployment config accordingly
4. Remove or hide Auctions if it is not in live scope

### Phase 2: Raise operational confidence

1. Add Playwright coverage for auth, checkout, sell flow, inquiry flow, blog publish, DealerOS ingest, and inspection request flows
2. Add a real 404 page and clean up unfinished blog widgets
3. Remove production-facing test-only UI like the Profile upload test panel

### Phase 3: Prepare for scale

1. Redesign listing search/data access around server-side pagination and narrower queries
2. Separate analytics/market metrics from public inventory fetches
3. Review Firestore indexes against real public and admin query patterns

## Bottom Line

This is not a broken site. It is a partially operational marketplace platform with several real enterprise-grade building blocks already in place.

What keeps it from tier-2 readiness today is not missing polish. It is the mismatch between environments, a few misleading unfinished surfaces, a real Firestore rules gap in DealerOS configuration, disabled indexing in the current deployment config, and the absence of automated validation.

If you want this to behave like a dependable enterprise application, the next step is not a broad redesign. It is a disciplined hardening pass focused on backend parity, rules correctness, launch configuration, test coverage, and scale-safe data access.