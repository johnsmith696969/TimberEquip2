# Final Tier 2 Scope — Staging to Production Checklist

**Project:** TimberEquip2 (Forestry Equipment Sales)  
**Purpose:** Close every remaining gap between the current Tier 2.5 state and a production-publishable Tier 2 Enterprise marketplace.  
**Created:** March 29, 2026  
**Estimated Total Effort:** 560–815 hours  

---

## How to Use This Document

Tasks are organized into 5 phases. **Phases 1–3 are production blockers** — do not publish until they are complete. Phases 4–5 are post-launch hardening that should ship within 30 days of go-live.

Each task includes:
- **File(s)** affected
- **Effort** estimate in hours
- **Acceptance criteria** defining "done"

---

## Phase 1: Critical Security & Legal Fixes (Pre-Launch Blockers)

*Estimated effort: 55–85 hours. Target: Week 1–2.*

### 1.1 — Re-enable CSRF Protection
**Files:** `server.ts`  
**Effort:** 4–6 hours  
**Context:** CSRF middleware is commented out at lines 826–838 and a dummy token is returned. Every authenticated POST endpoint (checkout, upload, contact, user delete, managed account creation) is vulnerable.  
**Work:**
- Uncomment the `csurf` middleware block
- Configure cookie settings for same-site deployment (change `sameSite: 'none'` to `'lax'` unless cross-origin iframe embedding is required)
- Restore the `/api/csrf-token` endpoint to return real tokens
- Update the frontend to fetch and include the CSRF token in all POST/PUT/DELETE requests (add a shared `fetchWithCsrf` utility)
- Exempt `/api/billing/webhook` and `/api/webhooks/stripe` from CSRF (raw body needed for Stripe signature)  
**Acceptance:** All authenticated mutation endpoints reject requests without a valid CSRF token. Stripe webhooks continue to work.

### 1.2 — Remove Gemini API Key from Client Bundle
**Files:** `vite.config.ts`, create `src/services/geminiProxyService.ts`, add `/api/ai/generate` to `server.ts`  
**Effort:** 4–6 hours  
**Context:** `process.env.GEMINI_API_KEY` is exposed in the client bundle via Vite's `define` config.  
**Work:**
- Remove `'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)` from `vite.config.ts`
- Create a server-side proxy endpoint `/api/ai/generate` in `server.ts` that accepts the prompt, calls Gemini, and returns the result
- Update `geminiService.ts` to call the proxy instead of the Gemini API directly
- Add rate limiting to the proxy endpoint  
**Acceptance:** `GEMINI_API_KEY` does not appear anywhere in the built client bundle (`grep -r "AIza" dist/` returns nothing).

### 1.3 — Build 404 Page
**Files:** Create `src/pages/NotFound.tsx`, update `src/App.tsx`  
**Effort:** 3–4 hours  
**Work:**
- Create a `NotFound` component with the site's industrial design system, a clear "Page Not Found" message, and links back to Home, Search, and Categories
- Include `<Seo title="Page Not Found" description="..." robots="noindex, nofollow" />`
- Replace `<Route path="*" element={<Home />} />` with `<Route path="*" element={<NotFound />} />`
- In `server.ts`, ensure the catch-all `app.get('*')` returns HTTP 404 status for unknown routes (currently returns 200)  
**Acceptance:** Visiting `/this-does-not-exist` renders the 404 page with a `noindex` meta tag and the server returns HTTP 404.

### 1.4 — Create DMCA Policy Page
**Files:** Create `src/pages/Dmca.tsx`, update `src/App.tsx`, update `src/components/Layout.tsx` (footer links)  
**Effort:** 6–10 hours  
**Work:**
- Create a DMCA policy page matching the design system of the existing legal pages
- Include: designated agent name (Caleb Happy) and contact info (info@forestryequipmentsales.com, 218-720-0933), takedown request procedure (what to include in a notice), counter-notification procedure, repeat infringer policy, good faith statement requirement
- Add route `/dmca` to App.tsx
- Add footer link alongside Privacy, Terms, Cookies
- Register a DMCA designated agent with the U.S. Copyright Office (https://www.copyright.gov/dmca-directory/) — this is a separate administrative step  
**Acceptance:** `/dmca` renders a complete DMCA policy. Footer includes a DMCA link on all pages.

### 1.5 — Fix Legal Page Contact Emails
**Files:** `src/pages/Privacy.tsx`, `src/pages/Cookies.tsx`  
**Effort:** 1 hour  
**Work:**
- Privacy.tsx: Change `privacy@timberequip.run.app` → `privacy@timberequip.com`
- Cookies.tsx: Change `support@timberequip.run.app` → `support@timberequip.com`
- Verify these email addresses actually receive mail (check DNS MX records and forwarding)  
**Acceptance:** All legal pages reference `@timberequip.com` domain emails.

### 1.6 — Expand Privacy Policy
**Files:** `src/pages/Privacy.tsx`  
**Effort:** 8–12 hours  
**Work:**
- Add third-party data processors section listing: Stripe (payments), Firebase/Google Cloud (hosting, auth, database), SendGrid (email), reCAPTCHA Enterprise (bot protection), Google Gemini (AI features), Google Maps (location services)
- Add cookie consent integration section explaining how consent is collected via the ConsentBanner and how to withdraw it
- Add data breach notification policy (72-hour notification per GDPR)
- Add children's privacy section (COPPA — site not intended for children under 13)
- Add GDPR exercise procedure: link to the account Privacy & Data tab where users can export data and delete their account, include response timeline (30 days)
- Add data transfer section (data may be processed in the US, EU adequacy/SCCs)
- Add California-specific rights section (CCPA: right to know, right to delete, right to opt-out of sale, non-discrimination)  
**Acceptance:** Privacy policy covers all GDPR Article 13/14 requirements and CCPA requirements.

### 1.7 — Fix Terms of Service Gaps
**Files:** `src/pages/Terms.tsx`  
**Effort:** 4–6 hours  
**Work:**
- Add intellectual property clause: FES receives a non-exclusive license to display listing content; sellers retain ownership and represent they have rights to uploaded media
- Add indemnification clause: sellers indemnify FES against claims from fraudulent or infringing listings
- Add governing law clause: specify state (e.g., Minnesota), binding arbitration via AAA, class action waiver
- Add force majeure clause
**Acceptance:** Terms cover IP, indemnification, governing law, and force majeure.

### 1.8 — Implement Consent Logging
**Files:** `src/components/ConsentBanner.tsx`, `src/components/AuthContext.tsx`  
**Effort:** 4–6 hours  
**Context:** The ConsentBanner has a comment `// Log consent to Firestore if user is logged in` but never does it.  
**Work:**
- On `handleAccept`: if user is authenticated, write to `consentLogs` collection with `{ userUid, type: 'cookie_consent', decision: 'accepted', timestamp, version: '1.2.0', userAgent, ipHash }`
- On `handleDecline`: same but with `decision: 'declined'`
- Add consent version tracking so re-consent can be triggered when the cookie policy changes
- Wire the "Manage Cookies" button on `/cookies` to reopen the ConsentBanner  
**Acceptance:** Every consent accept/decline is logged to Firestore. "Manage Cookies" button reopens the banner.

### 1.9 — Fix package.json Identity
**Files:** `package.json`  
**Effort:** 0.5 hours  
**Work:**
- Change `"name": "react-example"` → `"name": "timberequip"`
- Add `"description": "Forestry Equipment Sales — Enterprise logging equipment marketplace"`
- Add `"author": "Forestry Equipment Sales"`
- Add `"homepage": "https://www.timberequip.com"`  
**Acceptance:** `package.json` reflects the actual project identity.

---

## Phase 2: Stripe & Subscription Completeness (Pre-Launch Blockers)

*Estimated effort: 50–70 hours. Target: Week 2–3.*

### 2.1 — Implement Stripe Customer Portal
**Files:** Add endpoint in `functions/index.js`, update `src/services/billingService.ts`, update `src/pages/Profile.tsx`  
**Effort:** 12–16 hours  
**Work:**
- In Cloud Functions, add a `/billing/create-portal-session` endpoint that calls `stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: profileUrl })`
- Configure the Stripe Dashboard Customer Portal settings: allow payment method updates, invoice history, subscription cancellation, plan switching
- Add `createPortalSession()` method to `billingService.ts`
- Add a "Manage Billing" button to the Profile Account Summary section that opens the portal
- Handle the portal return URL to refresh account state  
**Acceptance:** Authenticated sellers can click "Manage Billing" from their profile, land in Stripe's hosted portal, update payment methods, view invoices, and cancel subscriptions.

### 2.2 — Display Subscription Dates in Profile
**Files:** `src/pages/Profile.tsx`, `src/services/userService.ts`, `src/types.ts`  
**Effort:** 6–8 hours  
**Work:**
- Add `currentPeriodEnd` and `subscriptionCreatedAt` to the `UserProfile` type (if not present)
- When `currentPeriodEnd` is available, add two items to the Account Summary grid:
  - "Renewal Date" showing the formatted `currentPeriodEnd` (or "Expires on" if `cancelAtPeriodEnd` is true)
  - "Subscribed Since" showing `subscriptionCreatedAt` or `createdAt` from the subscriptions collection
- Format dates using `date-fns` `format()` respecting the user's locale  
**Acceptance:** Profile Account Summary shows "Renewal Date: April 21, 2026" (or "Expires on: April 21, 2026" for canceled subscriptions).

### 2.3 — Store Subscription Start Date
**Files:** `functions/index.js` (webhook handler), `server.ts` (checkout finalization)  
**Effort:** 4–6 hours  
**Work:**
- In the `customer.subscription.created` webhook handler, add `createdAt: admin.firestore.Timestamp.fromMillis(subscription.created * 1000)` to the subscription document
- In the `checkout.session.completed` handler (`finalizeListingPaymentFromCheckoutSession`), add `subscriptionStartedAt` to the subscription doc
- Backfill: write a one-time script to query existing Stripe subscriptions and populate `createdAt` for any missing records  
**Acceptance:** All subscription documents in Firestore have a `createdAt` timestamp.

### 2.4 — Improve Dunning Sequence
**Files:** `functions/index.js`, create email templates  
**Effort:** 8–12 hours  
**Work:**
- Add a 3-day expiry warning scheduled function (in addition to existing 7-day)
- Add a day-of expiry warning
- Add a 3-day grace period after expiration before hiding listings (currently hides immediately)
- Add a "your listings are now hidden" notification email after grace period ends
- Track dunning state in the subscription document: `dunningStep: 1|2|3|4`  
**Acceptance:** Users receive 4 emails before/during/after subscription expiration, with a 3-day grace period.

### 2.5 — Sync Subscription Status to User Profile
**Files:** `functions/index.js`  
**Effort:** 6–8 hours  
**Context:** `subscriptionExpiredNotice` updates the subscriptions collection but not the user profile. Entitlement reads from the user profile.  
**Work:**
- When `subscriptionExpiredNotice` sets a subscription to `past_due`, also update the corresponding user document: `{ subscriptionStatus: 'past_due', publicListingVisibility: 'hidden_due_to_billing' }`
- When webhook `customer.subscription.updated` fires, sync the status to the user profile
- Add custom claims update to propagate the change to the auth token  
**Acceptance:** User profile and auth claims stay in sync with subscription state within 60 seconds of any Stripe event.

### 2.6 — Server-Side Listing Cap Enforcement
**Files:** `firestore.rules`  
**Effort:** 8–12 hours  
**Context:** Listing caps are enforced client-side and in the checkout API, but direct Firestore writes bypass both.  
**Work:**
- Add a Firestore rule that counts active listings for a seller before allowing a new listing create
- Note: Firestore rules can use `getAfter()` and collection-level queries are limited, so the recommended pattern is to maintain a counter document `users/{uid}/meta/listingCount` and validate against it in rules
- Update `equipmentService.addListing()` to increment the counter atomically  
**Acceptance:** Attempting to create a listing beyond the cap via direct Firestore SDK write is rejected by security rules.

---

## Phase 3: Testing Foundation (Pre-Launch Blocker)

*Estimated effort: 200–300 hours. Target: Week 3–6.*

### 3.1 — Set Up Testing Infrastructure
**Files:** `package.json`, create `vitest.config.ts`, create `playwright.config.ts`  
**Effort:** 8–12 hours  
**Work:**
- Install Vitest + React Testing Library for unit/integration tests
- Install Playwright for end-to-end tests
- Configure test scripts in package.json: `test`, `test:unit`, `test:e2e`, `test:coverage`
- Set up test utilities: mock Firebase, mock Stripe, mock fetch
- Create CI-compatible test runner config  
**Acceptance:** `npm test` runs successfully with at least a placeholder test passing.

### 3.2 — Critical Path Unit Tests
**Files:** Create `src/**/*.test.ts` files  
**Effort:** 60–80 hours  
**Priority test targets (by risk):**
1. `accountEntitlement.ts` — all role/subscription/access combinations (most critical business logic)
2. `billingService.ts` — checkout session creation, confirmation, refresh flows
3. `sellerAccess.ts` — `canUserPostListings`, `hasActiveSellerSubscription`, `hasAdminPublishingAccess`
4. `userRoles.ts` — role normalization, display labels
5. `sellerPlans.ts` — plan labels, entitlement mapping
6. `equipmentService.ts` — listing CRUD, search query building, cap enforcement
7. `listingPath.ts` — URL generation, slug creation
8. `seoRoutes.ts` — route quality scoring, canonical URL resolution  
**Acceptance:** 80%+ code coverage on all utility and service files.

### 3.3 — Integration Tests for Stripe Flows
**Files:** Create `tests/integration/billing/*.test.ts`  
**Effort:** 40–60 hours  
**Work:**
- Test checkout session creation with mock Stripe
- Test webhook event processing (invoice.paid, subscription.created/updated/deleted, checkout.session.completed)
- Test idempotency (same webhook event processed twice)
- Test subscription expiry flow end-to-end
- Test account access refresh with various subscription states
- Test listing cap enforcement at the API level  
**Acceptance:** All billing flows have integration tests that pass against a Stripe test mode account.

### 3.4 — E2E Tests for Critical User Journeys
**Files:** Create `tests/e2e/*.spec.ts`  
**Effort:** 60–80 hours  
**Priority journeys:**
1. Visitor → Register → Choose plan → Checkout → Create listing → Listing appears in search
2. Visitor → Search → View listing → Send inquiry → Seller receives inquiry
3. Seller → Login → Profile → View subscription status → Manage billing
4. Admin → Login → Dashboard → Approve listing → Listing goes live
5. Visitor → Browse categories → Filter by manufacturer → View listing detail
6. Seller → Login → Sell page → Fill listing form → Upload images → Submit  
**Acceptance:** All 6 journeys pass in Playwright against a staging environment.

### 3.5 — Component Tests for Key UI
**Files:** Create `src/components/**/*.test.tsx`  
**Effort:** 30–40 hours  
**Priority components:**
1. `ListingCard` — renders correctly with various listing states
2. `ListingModal` — form validation, category spec loading, image upload
3. `SubscriptionPaymentModal` — plan selection, checkout initiation
4. `ConsentBanner` — consent accept/decline, localStorage persistence
5. `Seo` — correct meta tags rendered for different page types  
**Acceptance:** All priority components have snapshot + behavior tests.

---

## Phase 4: SEO & Performance Hardening (Post-Launch, Week 1–2)

*Estimated effort: 130–180 hours.*

### 4.1 — Expand SSR Coverage
**Files:** `functions/public-pages.js`, `server.ts`  
**Effort:** 40–60 hours  
**Context:** Only SEO landing pages have SSR. Static pages like About, Contact, Financing, Terms, Privacy, Cookies, and DMCA serve empty SPA shells to crawlers.  
**Work:**
- Add SSR templates for all static pages that should be indexable
- For each page, generate a minimal HTML document with the page's title, description, headings, and key content
- Register these routes in the public pages proxy  
**Acceptance:** `curl` to any public page returns fully-rendered HTML with the page's actual content, not just `<div id="root"></div>`.

### 4.2 — Implement Image Optimization Pipeline
**Files:** `functions/index.js` (add Cloud Function), update `src/services/storageService.ts`  
**Effort:** 20–30 hours  
**Work:**
- Add a Firebase Storage trigger function that fires on listing image upload
- Use `sharp` (already installed in functions) to generate: thumbnail (200px), medium (800px), large (1600px) in WebP format
- Store optimized variants alongside originals with a naming convention (`image_thumb.webp`, `image_med.webp`, etc.)
- Update `ListingCard` and `ListingDetail` to use responsive image sources with `srcSet`
- Add `loading="lazy"` to below-fold images  
**Acceptance:** Listing images are served as optimized WebP at appropriate sizes. Lighthouse image audit passes.

### 4.3 — Split categorySpecs.ts
**Files:** `src/constants/categorySpecs.ts`, update `ListingModal`  
**Effort:** 15–20 hours  
**Work:**
- Split the 73,000-line file into per-category JSON files (e.g., `specs/feller-bunchers.json`, `specs/skidders.json`)
- Create a lazy-loading service that fetches the relevant spec file when a category is selected in the ListingModal
- Use dynamic `import()` or fetch from a public JSON endpoint  
**Acceptance:** Initial bundle size decreases by at least 150KB. Category specs load on demand in <200ms.

### 4.4 — Add Structured Data (JSON-LD)
**Files:** `src/pages/ListingDetail.tsx`, `src/pages/SellerProfile.tsx`, `src/pages/Home.tsx`, `src/pages/Search.tsx`  
**Effort:** 12–16 hours  
**Work:**
- ListingDetail: Emit `Product` schema with name, description, image, price, availability, seller, condition
- SellerProfile: Emit `Organization` schema with name, address, telephone, url
- Home: Emit `WebSite` schema with `SearchAction` pointing to `/search?q={query}`
- Search: Emit `ItemList` schema with search results  
**Acceptance:** Google Rich Results Test validates structured data on all four page types.

### 4.5 — Add Performance Hints to index.html
**Files:** `index.html`  
**Effort:** 2–3 hours  
**Work:**
```html
<link rel="preconnect" href="https://firestore.googleapis.com" />
<link rel="preconnect" href="https://firebasestorage.googleapis.com" />
<link rel="preconnect" href="https://www.googleapis.com" />
<link rel="dns-prefetch" href="https://js.stripe.com" />
<meta name="robots" content="noindex, nofollow" />  <!-- default, overridden by Seo component -->
```
**Acceptance:** `index.html` includes preconnect hints and a default noindex meta tag.

### 4.6 — Split Monolith Page Components
**Files:** `src/pages/AdminDashboard.tsx`, `src/pages/Profile.tsx`, `src/pages/DealerOS.tsx`  
**Effort:** 40–60 hours  
**Work:**
- AdminDashboard (4,202 lines): Extract each tab into its own component file under `src/components/admin/tabs/`
- Profile (2,701 lines): Extract tab content into `src/components/profile/` directory
- DealerOS (1,643 lines): Extract sections into `src/components/dealer/`
- Keep the parent components as thin tab routers that lazy-load tab content  
**Acceptance:** No single component file exceeds 500 lines. All functionality preserved.

---

## Phase 5: Infrastructure & Operations (Post-Launch, Week 2–4)

*Estimated effort: 80–120 hours.*

### 5.1 — CI/CD Pipeline
**Files:** Create `.github/workflows/ci.yml`, `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`  
**Effort:** 20–30 hours  
**Work:**
- CI workflow: lint → type-check → unit tests → build → smoke test (on every PR)
- Staging deploy: triggers on merge to `main`, runs CI + deploys to staging + runs e2e tests
- Production deploy: manual trigger or tag-based, runs CI + deploys to production + runs smoke tests
- Add branch protection rules requiring CI pass before merge  
**Acceptance:** PRs cannot merge without passing CI. Staging deploys automatically on merge. Production deploys require manual approval.

### 5.2 — Error Tracking
**Files:** `src/main.tsx`, `src/components/ErrorBoundary.tsx`, `server.ts`, `functions/index.js`  
**Effort:** 10–15 hours  
**Work:**
- Integrate Sentry (or comparable) for both client-side and server-side error tracking
- Configure source maps upload in the Vite build for readable stack traces
- Set up error alerting to email/Slack for P0 errors
- Add user context to error reports (uid, role, subscription status)  
**Acceptance:** Client-side and server-side errors appear in the Sentry dashboard with stack traces, user context, and breadcrumbs.

### 5.3 — Application Performance Monitoring
**Files:** `index.html`, `src/main.tsx`  
**Effort:** 8–12 hours  
**Work:**
- Enable Firebase Performance Monitoring in the client
- Add custom traces for: page load, search query, listing detail load, checkout flow
- Set up performance alerting for p95 latency regressions  
**Acceptance:** Firebase Performance dashboard shows real user metrics. Alerts fire when p95 exceeds thresholds.

### 5.4 — Database Backup Strategy
**Files:** Create `ops/runbooks/backup.md`, add Cloud Function or scheduled script  
**Effort:** 8–12 hours  
**Work:**
- Configure Firestore automated exports to a Cloud Storage bucket (daily)
- Document restore procedure in a runbook
- Test restore on the staging project
- Set retention policy (30 days of daily backups)  
**Acceptance:** Daily Firestore exports run automatically. Restore procedure is documented and tested.

### 5.5 — Rate Limiting Audit
**Files:** `server.ts`, `functions/index.js`  
**Effort:** 6–8 hours  
**Work:**
- Verify `express-rate-limit` is applied to all public-facing endpoints
- Add rate limiting to Cloud Functions endpoints (billing, lifecycle, contact)
- Configure limits: 100 req/min for general API, 10 req/min for checkout, 5 req/min for contact form, 3 req/min for account deletion
- Add rate limit headers to responses  
**Acceptance:** All public endpoints return 429 when rate limits are exceeded.

### 5.6 — Split functions/index.js
**Files:** `functions/index.js` → multiple module files  
**Effort:** 20–30 hours  
**Work:**
- Extract billing-related functions into `functions/billing.js`
- Extract email functions into `functions/email.js`
- Extract scheduled jobs into `functions/scheduled.js`
- Extract auth triggers into `functions/auth-triggers.js`
- Extract dealer feed functions into `functions/dealer-feeds.js` (if not already separate)
- Keep `functions/index.js` as a thin re-export file  
**Acceptance:** `functions/index.js` is under 200 lines. All functions still deploy and work correctly.

### 5.7 — Local Development Parity
**Files:** `server.ts`, create `dev-proxy.ts` or update existing dev setup  
**Effort:** 8–12 hours  
**Context:** Account-level billing endpoints exist only in Cloud Functions, not in server.ts. Local dev cannot test account checkout flows.  
**Work:**
- Add proxy routes in the dev server that forward `/api/billing/create-account-checkout-session` and `/api/billing/refresh-account-access` to the Cloud Functions emulator (or stub them for local dev)
- Document the local development setup: required environment variables, emulator configuration, Stripe CLI webhook forwarding  
**Acceptance:** A developer can run `npm run dev` and test the full checkout flow locally.

---

## Pre-Launch Checklist (Day of Go-Live)

Before flipping the `VITE_ALLOW_INDEXING=true` flag and deploying to production:

- [ ] Phase 1 complete — all critical security and legal fixes shipped
- [ ] Phase 2 complete — Stripe Customer Portal live, subscription dates displayed
- [ ] Phase 3 complete — test suite passing, minimum 60% overall coverage
- [ ] `package.json` name updated to `timberequip`
- [ ] All legal page emails reference `@timberequip.com`
- [ ] DMCA page exists at `/dmca` with footer link
- [ ] 404 page exists and returns HTTP 404
- [ ] CSRF protection enabled
- [ ] Gemini API key removed from client bundle
- [ ] Consent banner logs to Firestore
- [ ] Stripe Customer Portal configured in Stripe Dashboard
- [ ] DNS verified: `timberequip.com` and `www.timberequip.com` resolve correctly
- [ ] SSL certificate valid and auto-renewing
- [ ] Firebase Hosting production channel configured
- [ ] Stripe webhooks pointing to production URL
- [ ] SendGrid sender domain verified for `timberequip.com`
- [ ] reCAPTCHA Enterprise site key matches production domain
- [ ] Google Search Console verified for `timberequip.com`
- [ ] `robots.txt` allows crawling
- [ ] Sitemap.xml generates and is accessible
- [ ] Run Lighthouse audit — target: 75+ mobile, 90+ desktop
- [ ] Run one full e2e test suite against production
- [ ] Verify at least one test Stripe subscription end-to-end in production mode
- [ ] Error tracking (Sentry) is receiving events from production
- [ ] Team has access to production Firebase Console, Stripe Dashboard, and SendGrid
- [ ] Rollback plan documented: how to revert to staging if critical issues found

---

## Post-Launch Monitoring (First 7 Days)

- [ ] Monitor Sentry for new errors daily
- [ ] Monitor Stripe webhook failure rate in Stripe Dashboard
- [ ] Monitor Firebase Console for Firestore quota usage
- [ ] Monitor Cloud Functions error rate and cold start times
- [ ] Check Google Search Console for crawl errors after 48 hours
- [ ] Verify subscription expiry emails fire correctly on day 1
- [ ] Check that contact form submissions arrive in Firestore
- [ ] Monitor Core Web Vitals in Search Console after 5–7 days
- [ ] Gather user feedback on checkout flow friction
