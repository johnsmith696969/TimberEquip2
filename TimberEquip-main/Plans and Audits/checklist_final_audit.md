# TimberEquip - Consolidated Production Checklist

**Created:** March 29, 2026
**Source:** Merged from `final-tier-2-scope.md` + `Full_Audit_3_29_2026.md`
**Last updated:** March 30, 2026 (session 6)

---

## Phase 1: Critical Security & Legal (Pre-Launch Blockers)

### Code & Security

- [x] **1.1 - Fix all TypeScript errors** - 19 errors to 0. `tsc --noEmit` passes clean.
- [x] **1.2 - Re-enable Helmet security headers** - Uncommented in `server.ts`, CSP configured, `blob:` added to imgSrc. `X-Powered-By` removed.
- [x] **1.3 - Lock CORS to explicit origins** - Replaced `origin: true` with allowlist (timberequip.com, localhost, Firebase preview domains).
- [x] **1.4 - Fix SUPERADMIN_EMAIL bug** - Exported from `privilegedAdmin.ts`, imported in `equipmentService.ts`. Queries and comparisons now work.
- [x] **1.5 - Remove Gemini API key from client bundle** - Already removed before audit. `GEMINI_API_KEY` not in Vite `define`.
- [x] **1.6 - Build 404 page** - `NotFound.tsx` already exists with noindex meta, routed at `path="*"`.
- [x] **1.7 - Create DMCA policy page** - `Dmca.tsx` already exists at `/dmca` with footer link.
- [x] **1.8 - Fix package.json identity** - Already `"name": "timberequip"` with correct metadata.
- [x] **1.9 - Default noindex meta in index.html** - Added `<meta name="robots" content="noindex, nofollow" />` as safety net. `Seo.tsx` overrides per-page.
- [x] **1.10 - Fix legal page contact emails** - All emails now reference `@timberequip.com`. Verified in `Privacy.tsx`, `Cookies.tsx`, `Terms.tsx`, `Contact.tsx`.
- [x] **1.11 - Expand Privacy Policy** - Already comprehensive: covers Stripe, Firebase, SendGrid, Twilio Voice, reCAPTCHA, Maps, GDPR Art 13/14, CCPA, COPPA, data breach 72h, cookie consent, data transfer.
- [x] **1.12 - Fix Terms of Service gaps** - Already covers: IP license, indemnification, governing law (Minnesota), binding arbitration, class action waiver, force majeure.
- [x] **1.13 - Implement consent logging** - `ConsentBanner` already logs accept/decline to Firestore `consentLogs` via `logConsentToFirestore()`. "Manage Cookies" button wired on `/cookies`.
- [x] **1.14 - Replace deprecated `csurf` package** - Replaced archived `csurf@1.11.0` with an in-repo double-submit CSRF token strategy that preserves the existing `/api/csrf-token` + `CSRF-Token` frontend contract, keeps Stripe webhook exemptions, and removes the deprecated package from `package.json`.
- [x] **1.15 - HTTP 404 status for unknown routes** - SPA route allowlist implemented in `server.ts`. Unknown routes return 404 while still serving SPA shell.
- [x] **1.16 - Fix dependency vulnerabilities** - `npm audit fix` resolved all 3 high-severity vulnerabilities (node-forge, path-to-regexp, picomatch). Current `npm audit --omit=dev` shows only 8 low-severity advisories in the `firebase-admin` transitive tree.

---

## Phase 2: Stripe & Subscription Completeness (Pre-Launch Blockers)

- [x] **2.1 - Stripe Customer Portal** - `/api/billing/create-portal-session` exists in `server.ts`. "Manage Billing" in `Profile.tsx` calls `billingService.createBillingPortalSession()`.
- [x] **2.2 - Display subscription dates in Profile** - "Renewal Date" / "Expires On" and "Subscribed Since" both display. `subscriptionStartDate` added to refresh endpoint, `billingService`, types, and Profile UI.
- [x] **2.3 - Store subscription start date** - `createdAt` and `startDate` are already stored in webhook handlers for `subscription.created` and `subscription.updated`.
- [ ] **2.4 - Improve dunning sequence** - Add 3-day warning, day-of warning, 3-day grace period, and "listings hidden" email. Track `dunningStep` in subscription doc.
  - Files: `functions/index.js`, email templates
  - Effort: 8-12 hours
- [x] **2.5 - Sync subscription status to user profile** - Webhook handlers update user documents with `activeSubscriptionPlanId` and `subscriptionStatus`. Auth claims synced via `functions/index.js`. Listings hide on `past_due` / `unpaid`.
- [~] **2.6 - Server-side listing cap enforcement** - Express/API validates listing count vs `plan.listingCap` and returns 409. Missing: Firestore-rules defense in depth layer or a server-owned-only listing write policy.
  - Files: `firestore.rules`
  - Effort: 2-4 hours

---

## Phase 3: Testing Foundation (Pre-Launch Blocker)

- [x] **3.1 - Test infrastructure** - Vitest + React Testing Library installed and configured. `vitest.config.ts` and `src/__tests__/setup.ts` created. Scripts: `test`, `test:watch`, `test:coverage`.
- [x] **3.2 - Unit tests (core business logic)** - 8 test files, 138 unit tests covering: accountEntitlement, sellerAccess, userRoles, sellerPlans, seoRoutes, seoRouteQuality, privilegedAdmin, amvMatching.
- [x] **3.3 - Smoke tests** - 32 tests verifying all 26 page modules and 4 core components import/export correctly. Firebase fully mocked.
- [~] **3.4 - Additional unit test coverage** - `billingService`, `listingPath`, `equipmentService` market-value / market-match logic, public listing filter/sort behavior, cached public-list fallback, authenticated listing CRUD, featured-cap enforcement, saved-search cache behavior, and admin bootstrap cache fallbacks are now covered. Remaining gaps are the heavier seller/account mutation branches and some deeper admin/account service permutations.
  - Effort remaining: 10-16 hours
- [ ] **3.5 - Integration tests for Stripe flows** - Checkout session creation, webhook event processing (`invoice.paid`, subscription CRUD, `checkout.session.completed`), idempotency, subscription expiry, listing cap API enforcement.
  - Effort: 40-60 hours
- [~] **3.6 - E2E tests (Playwright)** - First real critical-journey evidence is now in place: a live Playwright pass verified the public category-browse flow (`Home -> Categories -> category inventory -> Listing Detail`) on March 30, 2026. Remaining work is to codify the rest of the journey matrix: register -> checkout -> list, search -> inquiry, seller billing, admin approve, and listing form + upload.
  - Effort remaining: 50-70 hours
- [~] **3.7 - Component tests** - `Seo`, `ListingCard`, `ConsentBanner`, `SubscriptionPaymentModal`, the admin `ListingModal`, the post-checkout `SubscriptionSuccess` page, and `ListingDetail` fullscreen gallery navigation now have render/behavior coverage in Vitest + RTL. `ListingModal` also covers minimum-photo validation and mocked image-upload behavior, while `SubscriptionSuccess` now covers missing-session, processing, signed-in success, and signed-out continuation states. Remaining gaps are the broader multi-file media-edit permutations and more end-to-end purchase states beyond the success-page surface.
  - Effort remaining: 10-16 hours

---

## Phase 4: SEO & Performance (Post-Launch, Week 1-2)

- [x] **4.1 - JSON-LD structured data** - Already on Home (WebSite + SearchAction), ListingDetail (Product), Search (ItemList), SellerProfile (Organization).
- [x] **4.2 - SSR proxy for SEO routes** - `functions/public-pages.js` exists for SEO landing pages.
- [x] **4.3 - Default noindex safety net** - Added to `index.html`. `Seo.tsx` overrides per-page.
- [ ] **4.4 - Expand SSR coverage** - Static pages (About, Contact, Financing, Terms, Privacy, Cookies, DMCA) still serve empty SPA shells to crawlers. Add SSR templates for all indexable pages.
  - Files: `functions/public-pages.js`, `server.ts`
  - Effort: 40-60 hours
- [ ] **4.5 - Image optimization pipeline** - Firebase Storage trigger -> sharp -> thumbnail/medium/large WebP variants. Update ListingCard/ListingDetail with `srcSet` and `loading="lazy"`.
  - Files: `functions/index.js`, `src/services/storageService.ts`
  - Effort: 20-30 hours
- [ ] **4.6 - Split categorySpecs.ts** - 73,000-line file -> per-category JSON files, lazy-loaded on demand. Target: -150 KB initial bundle.
  - Files: `src/constants/categorySpecs.ts`, `ListingModal`
  - Effort: 15-20 hours
- [x] **4.7 - Performance hints in index.html** - `<link rel="preconnect">` already present for Firebase, Google APIs, Stripe, Google Fonts, Cloudflare.
- [ ] **4.8 - Split monolith page components** - `AdminDashboard` (4,482 lines), `Profile` (2,967 lines), `DealerOS` (1,643 lines) should be broken into separate tab/modules. Target: no file >500 lines.
  - Effort: 40-60 hours

---

## Phase 5: Infrastructure & Operations (Post-Launch, Week 2-4)

- [x] **5.1 - CI/CD pipeline** - 3 workflows: PR (lint -> test -> build -> preview deploy), Staging (verify -> deploy -> smoke on push to main), Production (verify -> deploy -> smoke, manual trigger).
- [~] **5.2 - Error tracking (Sentry)** - Optional client, local server, and Functions Sentry scaffolding is now wired with browser init, error-boundary capture, authenticated user context, backend exception capture hooks, and a hidden-sourcemap build toggle. Remaining work: configure DSNs/secrets, enable sourcemap upload in CI, validate staging events, and set alert routing.
  - Files: `src/services/sentry.ts`, `src/main.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/AuthContext.tsx`, `sentry.server.ts`, `server.ts`, `functions/sentry.js`, `functions/index.js`, `ops/runbooks/SENTRY_ERROR_TRACKING.md`
  - Effort remaining: 4-8 hours
- [~] **5.3 - Application performance monitoring** - Optional Firebase Performance Monitoring scaffolding is now wired behind `VITE_ENABLE_FIREBASE_PERFORMANCE=true`, with custom traces for app bootstrap, search inventory load, and checkout start. Remaining work: enable the flag in staging, verify traces in Firebase, and promote the flag to production once dashboards and alert thresholds are confirmed.
  - Files: `src/services/performance.ts`, `src/main.tsx`, `src/pages/Search.tsx`, `src/services/billingService.ts`, `ops/runbooks/FIREBASE_PERFORMANCE_MONITORING.md`
  - Effort remaining: 4-8 hours
- [~] **5.4 - Database backup strategy** - Backup workflow, export script, retention policy, and restore runbook are now in the repo. Remaining work: configure the dedicated backup bucket and confirm IAM/variables in production so the scheduled export lane is truly active.
  - Files: `.github/workflows/firestore-backup.yml`, `scripts/firestore-backup.mjs`, `ops/runbooks/FIRESTORE_BACKUP_RESTORE.md`
  - Effort: 8-12 hours
- [x] **5.5 - Rate limiting audit** - Added specific rate limiters for checkout (10/min), account deletion (3/min), billing portal (10/min). General API limiter (1000/15min) already covers `/api/` routes. Cloud Functions auth endpoints now also have dedicated in-function rate limiting for password reset and verification email sends.
- [ ] **5.6 - Split functions/index.js** - 12,166 lines -> `billing.js`, `email.js`, `scheduled.js`, `auth-triggers.js`, `dealer-feeds.js`. Keep `index.js` as a thin re-export.
  - Effort: 20-30 hours
- [x] **5.7 - Local development parity** - Local `server.ts` now proxies the same shared Functions billing routes used in production, and an explicit `LOCAL_BILLING_STUB=true` mode now simulates checkout/portal/cancel/access flows when Stripe secrets are absent. The local setup docs now also call out `npm --prefix functions install`.
  - Files: `server.ts`, `README.md`
  - Effort: 8-12 hours

---

## Longer-Term Architecture Items

- [ ] **6.1 - Move search to server-side pagination** - Current behavior loads too much inventory client-side. Move to cursor-based server pagination with indexed/faceted querying.
  - Effort: 50-120 hours
- [ ] **6.2 - Reduce taxonomy payload** - 3.38 MB raw / 188 KB gzip. Split by category and lazy-load on demand.
  - Effort: 12-24 hours
- [ ] **6.3 - Real malware scanning** - Replace EICAR mock with ClamAV or Cloud Run scanning pipeline. Quarantine -> scan -> release.
  - Effort: 12-24 hours
- [ ] **6.4 - Migrate hardcoded admin emails to role claims** - Remove scattered email checks from frontend/rules and centralize privilege in server-side role claims.
  - Effort: 8-20 hours
- [ ] **6.5 - Fix storage rules hardcoded database ID** - Verified this is not a simple placeholder swap. Cloud Storage rules cross-service `get()` checks are effectively tied to the default Firestore database, while TimberEquip app data currently lives in the named `ai-studio-206e8e62-...` database. Completing this requires an architectural change: mirror minimal auth/listing ownership data into `(default)` or move upload authorization off Firestore-dependent storage rules.
  - Files: `storage.rules`, upload/auth flow
  - Effort: 8-16 hours

---

## Pre-Launch Day Checklist

- [x] TypeScript errors resolved
- [x] Helmet security headers enabled
- [x] CORS locked to explicit origins
- [x] Test suite passing (248 tests, 18 test files)
- [x] package.json identity correct
- [x] 404 page exists with noindex
- [x] DMCA page exists with footer link
- [x] Gemini API key not in client bundle
- [x] Default noindex meta in index.html
- [x] All legal page emails reference `@timberequip.com`
- [x] Privacy policy covers GDPR Art 13/14 + CCPA
- [x] Terms cover IP, indemnification, governing law
- [x] CSRF on maintained package
- [x] Consent banner logs to Firestore
- [x] Stripe Customer Portal configured
- [x] Subscription dates displayed in Profile
- [ ] DNS verified: `timberequip.com` + `www` resolve
- [ ] SSL certificate valid and auto-renewing
- [ ] Firebase Hosting production channel configured
- [ ] Stripe webhooks pointing to production URL
- [ ] SendGrid sender domain verified
- [ ] reCAPTCHA Enterprise site key matches production domain
- [ ] Google Search Console verified
- [ ] robots.txt allows crawling (via `prepare-seo-mode.mjs`)
- [ ] Sitemap.xml accessible
- [ ] Lighthouse audit: 75+ mobile, 90+ desktop
- [ ] Error tracking receiving production events
- [ ] Rollback plan documented

---

## Score

**Completed:** 33 items
**Partially complete:** 6 items (`2.6`, `3.4`, `3.7`, `5.2`, `5.3`, `5.4`)
**Remaining Phase 1-3 (fully open):** 4 items
**Remaining Phase 4-5 (fully open):** 6 items
**Longer-term:** 5 items
