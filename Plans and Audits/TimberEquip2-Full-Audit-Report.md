# TimberEquip2 — Complete Platform Audit Report

**Audit Date:** March 29, 2026  
**Repository:** `johnsmith696969/TimberEquip2`  
**Auditor:** Claude (Opus 4.6)  
**Current Tier Assessment:** 2.5 / 5.0 (70–75% toward Tier 2 Enterprise)

---

## 1. Executive Summary

TimberEquip2 is a React 19 + Firebase + Stripe marketplace for forestry and logging equipment. The codebase is ~61,400 lines across 89 TypeScript/TSX files, an 11,164-line Cloud Functions index, and a 1,453-line Express server. For what appears to be a solo or very-small-team build, the scope is genuinely ambitious and the architecture is sound in its fundamentals.

**Strengths:**  
The platform already has subscription billing with Stripe webhooks, idempotent event processing, account-level entitlement resolution, SSR-capable Cloud Functions for SEO crawlability, dynamic XML sitemaps, a multi-role admin dashboard, DealerOS with feed ingestion, SMS MFA via Firebase Identity Platform, SendGrid email automation, multi-language/multi-currency support, monitoring/alerting scaffolding, and staging/production deployment pipelines with smoke tests.

**Critical Gaps:**  
Zero automated tests, CSRF protection disabled, no DMCA page, no Stripe Customer Portal, subscription dates not displayed to users, no 404 page, consent logging not implemented, legal page contact emails pointing to `.run.app` instead of the production domain, and several monolith files that will block team scaling.

---

## 2. Profile & Profile Tabs Audit

### What Works

- Dynamic tab system that adapts to user role (buyer sees Saved Equipment/Search Alerts, sellers see My Listings/Inquiries/Calls, admins get admin links)
- 12 profile tab items with role-gated visibility
- Account Summary grid displaying: Role, Account Status, Subscription Plan, Subscription Status, Billing Label, Listing Visibility, SMS MFA, Listing Capacity, Managed Seats, Email Verified, Storefront Access, Member Since
- Tab persistence via `?tab=` URL search params
- MFA enrollment/unenrollment flow fully functional
- Profile photo upload with Firebase Storage
- Privacy & Data tab with GDPR data export and account deletion
- Account Settings tab with language/currency preferences

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| P-1 | **High** | Subscription start date and renewal/expiration date (`currentPeriodEnd`) are stored in Firestore and returned by `refresh-account-access`, but **never displayed** in the Profile Account Summary. Users have no way to see when their billing cycle ends or renews. |
| P-2 | **Medium** | The `Profile.tsx` component is 2,701 lines in a single file. Tab content, settings forms, MFA flow, listing management, and storefront editing are all inlined. This is a maintainability and onboarding blocker. |
| P-3 | **Medium** | The Storefront tab label dynamically switches between "Public Profile" and "Storefront" based on role, but there's no visual indicator explaining the difference to the user. |
| P-4 | **Low** | The admin profile links section generates navigation to AdminDashboard tabs, but doesn't highlight which admin tab the user is currently viewing if they navigate back. |
| P-5 | **Low** | `withAsyncTimeout` utility is defined locally in Profile.tsx — should be extracted to a shared utility. |

### Recommendation

Add `currentPeriodEnd` and `subscriptionStartDate` to the Account Summary grid. Format as human-readable dates using `date-fns`. Add a "Renews on" or "Expires on" label depending on `cancelAtPeriodEnd` state.

---

## 3. Listing Flow Audit

### What Works

- `Sell.tsx` → `ListingModal` → `equipmentService.addListing()` flow is complete
- Pre-save validation: checks seller entitlement, listing cap enforcement, active subscription verification
- Handles three checkout return states: `success`, `canceled`, and `accountCheckout` variants
- `ListingModal` (1,019 lines) supports full equipment spec entry with category-specific fields from a 73,000-line `categorySpecs.ts`
- Image/video upload via `ImageVideoUploader` with Firebase Storage
- Post-submission flow: listing enters `status: 'pending'` and `paymentStatus` set based on subscription state
- Admin publishing bypass for admin roles
- Login prompt modal for unauthenticated users attempting to list
- Redirect to `/ad-programs` for authenticated users without a seller plan

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| L-1 | **High** | The listing creation flow sets `paymentStatus: 'paid'` immediately for users with `canPostListings === true`, but there's no server-side re-validation of this claim at save time. The `equipmentService.addListing()` call writes directly to Firestore. A client-side manipulation could bypass the cap check. |
| L-2 | **High** | Listing cap enforcement happens client-side via `equipmentService.getSellerListingUsage()`. The server-side `/api/billing/create-checkout-session` does its own cap check, but the direct Firestore write path in `doSave()` relies entirely on the client's word. Firestore rules should enforce listing caps. |
| L-3 | **Medium** | `categorySpecs.ts` at 73,000 lines is loaded into the client bundle. Even with code splitting, this file will significantly impact initial bundle size. It should be lazy-loaded or fetched from an API. |
| L-4 | **Medium** | The `ListingModal` has no auto-save / draft persistence. If a user spends 15 minutes filling out a complex listing and their browser crashes, everything is lost. |
| L-5 | **Low** | After successful listing submission, the "Post Another" button resets the modal but doesn't clear the success state banner until the new modal opens, creating a brief UX flash. |

---

## 4. Subscribe & Stripe Flow Audit

### What Works

- **Three-tier plan structure:** Owner-Operator ($39/mo, 1 listing), Dealer ($499/mo, 50 listings), Pro Dealer ($999/mo, 150 listings)
- **Two checkout paths:** Listing-level checkout (server.ts `/api/billing/create-checkout-session`) and Account-level checkout (Cloud Functions `/billing/create-account-checkout-session`)
- **Webhook handling:** Idempotent processing with `webhook_events` collection dedup, handles `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created/updated/deleted`, `checkout.session.completed`
- **Account access refresh:** `/billing/refresh-account-access` in Cloud Functions syncs Stripe subscription state back to user profile and custom claims
- **Billing service client:** LocalStorage-based cache with quota-exceeded fallback for admin billing views
- **SubscriptionPaymentModal** with plan selection UI
- **SubscriptionSuccess page** confirms checkout session and refreshes auth token

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| S-1 | **Critical** | **No Stripe Customer Portal.** Users cannot self-manage their subscriptions — they can't update payment methods, view invoices, cancel, or switch plans without contacting support. This is a Tier 2 requirement and a churn risk. Implement via `stripe.billingPortal.sessions.create()`. |
| S-2 | **High** | The `billingService.createAccountCheckoutSession()` calls `/api/billing/create-account-checkout-session`, which exists in Cloud Functions but **not in server.ts**. This works because Cloud Functions proxies handle it, but in local dev (`tsx server.ts`), this endpoint returns 404. Local development of the subscription flow is broken. |
| S-3 | **High** | The `SellerProgramCheckoutEnrollment` interface collects extensive legal enrollment data (legal name, title, company, tax ID, acceptance flags) but there's no evidence this data is persisted to Firestore or sent to Stripe metadata. It's passed to `createAccountCheckoutSession()` but the Cloud Functions implementation should be verified to confirm it's being stored. |
| S-4 | **High** | Subscription expiry handling via `subscriptionExpiredNotice` sets status to `past_due`, but the user profile's `subscriptionStatus` field is not automatically synced. The `refresh-account-access` endpoint needs to be called to pick up the change — meaning a user with an expired subscription may still appear "active" on the profile until they trigger a refresh. |
| S-5 | **Medium** | No dunning management beyond the single `subscriptionExpiryReminder` (7-day warning) and `subscriptionExpiredNotice`. Enterprise platforms typically have a 3-touch dunning sequence (7 days, 3 days, day-of) plus a grace period before listing hiding. |
| S-6 | **Medium** | The `billingService` uses multi-base-URL fallback (`getBillingApiBaseUrls`) which tries `window.location.origin` and a hardcoded `https://timberequip.com` fallback — this could cause CORS issues in staging/preview deployments. |
| S-7 | **Low** | Billing cache keys include `te-billing-cache-v1` prefix but there's no cache invalidation on subscription status change. Stale admin billing views are possible. |

---

## 5. Subscription Expiration & Start Date/Time Audit

### What Works

- `currentPeriodEnd` is correctly stored as a Firestore Timestamp from Stripe's `current_period_end` (converted from Unix seconds to milliseconds)
- `subscriptionExpiryReminder` fires daily and catches subscriptions expiring in 7–8 day window
- `subscriptionExpiredNotice` fires daily and transitions `active` subscriptions past their `currentPeriodEnd` to `past_due`
- `expireListingsByDate` handles listing-level expiration
- Webhook handler for `customer.subscription.updated` syncs `currentPeriodEnd` and `cancelAtPeriodEnd`

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| E-1 | **High** | **No subscription start date is stored anywhere.** The `subscriptions` collection stores `currentPeriodEnd` but not `currentPeriodStart` or `createdAt` (from Stripe). Without this, you cannot display "Subscribed since" or calculate billing history accurately. |
| E-2 | **High** | The Profile page displays `subscriptionStatusLabel` and `subscriptionPlanLabel` but **no dates whatsoever** — no start date, no renewal date, no expiration date. Users are blind to their billing cycle. |
| E-3 | **Medium** | The `subscriptionExpiredNotice` function queries for subscriptions with `currentPeriodEnd >= yesterday AND < now`, but if the function fails to run for a day (Cloud Functions cold start, quota limits), those subscriptions will be missed permanently. There's no catch-up mechanism. |
| E-4 | **Medium** | When `subscriptionExpiredNotice` sets status to `past_due`, it doesn't update the user's profile document — only the subscriptions collection. The entitlement system reads from the user profile, creating a potential desync where the subscription shows `past_due` but the user profile still shows `active`. |
| E-5 | **Low** | Email templates use `toLocaleDateString('en-US')` which won't respect the user's locale preference stored in their profile. |

---

## 6. Legal Pages Audit

### Privacy Policy (`/privacy`)

**Status:** Exists but needs expansion.

| # | Severity | Issue |
|---|----------|-------|
| LP-1 | **High** | Contact email is `privacy@timberequip.run.app` — should be `privacy@timberequip.com` for production. |
| LP-2 | **High** | No mention of cookie consent mechanism integration (the ConsentBanner exists but the policy doesn't reference how consent is collected or withdrawn). |
| LP-3 | **High** | GDPR/CCPA section lists "Right to Export" and "Right to Erasure" but doesn't explain how to exercise them (no form, no process, no timeline). The account deletion exists in code but isn't referenced. |
| LP-4 | **Medium** | No mention of third-party data processors (Stripe, Firebase, SendGrid, Google Analytics, reCAPTCHA Enterprise, Google Gemini AI). GDPR requires disclosure of processors. |
| LP-5 | **Medium** | No data breach notification policy. |
| LP-6 | **Medium** | No children's privacy section (COPPA compliance). |
| LP-7 | **Low** | Phone number `+1 (800) 846-2373` — verify this is an active, monitored line before publishing. |

### Terms of Service (`/terms`)

**Status:** Strongest legal page. Covers marketplace usage, listing accuracy, billing, dealer services, data/leads, global compliance, and dispute resolution.

| # | Severity | Issue |
|---|----------|-------|
| LT-1 | **Medium** | No intellectual property / content ownership clause. Who owns the listing content, photos, and descriptions? What license does FES have to display them? |
| LT-2 | **Medium** | No indemnification clause — sellers should indemnify FES against claims arising from fraudulent listings. |
| LT-3 | **Medium** | No governing law / jurisdiction specified. "Disputes must be resolved through the parties directly" is weak — specify arbitration, jurisdiction, and governing state law. |
| LT-4 | **Low** | No force majeure clause. |

### Cookie Policy (`/cookies`)

**Status:** Exists with correct structure.

| # | Severity | Issue |
|---|----------|-------|
| LC-1 | **High** | "Manage Cookies" button does nothing — it's an unstyled `<button>` with no onClick handler. |
| LC-2 | **High** | Contact email is `support@timberequip.run.app` — should be `support@timberequip.com`. |
| LC-3 | **Medium** | No specific cookie names/purposes listed. GDPR-compliant cookie policies should enumerate: Firebase auth cookies, localStorage keys, reCAPTCHA cookies, Stripe cookies, any analytics cookies. |

### DMCA Policy

**Status: DOES NOT EXIST.** No file, no route, no component. This is a legal requirement for any US marketplace that hosts user-generated content (listings with photos). You need a DMCA takedown procedure, a designated agent, and a publicly accessible policy page.

### Contact Page (`/contact`)

**Status:** Functional with reCAPTCHA Enterprise integration, multi-step form, and Firestore persistence.

| # | Severity | Issue |
|---|----------|-------|
| LCT-1 | **Low** | Contact form stores to `contactRequests` collection but there's no admin notification when a new request arrives. |
| LCT-2 | **Low** | No confirmation email sent to the person who submitted the contact form. |

---

## 7. SEO Audit

### What Works

- `Seo.tsx` component sets title, description, canonical URL, Open Graph tags, Twitter cards, and JSON-LD structured data per page
- `robots.txt` with sitemap reference
- Dynamic XML sitemap generated via Cloud Functions (`public-pages.js`) with route quality filtering
- SSR-capable public pages proxy for crawlers (categories, manufacturers, states, dealers)
- Extensive SEO landing page system: ForestryHub, Category, Manufacturer, Model, State, Dealer directory pages
- `VITE_ALLOW_INDEXING` environment variable controls `noindex` vs `index` at build time
- SEO route quality scoring system with thin-route filtering
- Canonical URL redirects (`/logging-equipment-for-sale` → `/forestry-equipment-for-sale`)

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| SEO-1 | **Critical** | The app is a client-side SPA. The SSR proxy in Cloud Functions only handles specific SEO routes. Any page not in the proxy list (like `/about`, `/contact`, `/financing`, `/terms`, `/privacy`, `/cookies`) serves the SPA shell to crawlers — meaning those pages have zero crawlable content. Google will see an empty `<div id="root"></div>`. |
| SEO-2 | **High** | No `<meta name="robots">` tag in `index.html`. The Seo component adds it client-side via JavaScript, which crawlers may not execute. The base HTML should include a default robots tag. |
| SEO-3 | **High** | Wildcard route `<Route path="*" element={<Home />} />` means there's no 404 page. Every invalid URL returns 200 with the home page — this is an SEO anti-pattern that causes index bloat. Should return a proper 404 with `<meta name="robots" content="noindex">`. |
| SEO-4 | **High** | `package.json` name is still `"react-example"`. While not directly SEO-affecting, this signals the project hasn't been properly initialized and can affect tooling/monitoring that reads package metadata. |
| SEO-5 | **Medium** | No `hreflang` tags despite supporting 18 languages. If you intend to serve localized content, search engines need hreflang to understand language targeting. |
| SEO-6 | **Medium** | JSON-LD structured data is supported via the Seo component but only a few pages actually pass it. Listing detail pages should emit `Product` schema, seller profiles should emit `Organization` schema, and the home page should emit `WebSite` with `SearchAction`. |
| SEO-7 | **Medium** | No `og:locale` meta tag set anywhere. |
| SEO-8 | **Low** | Image alt text on listing cards and detail pages should be audited for keyword relevance. |

---

## 8. Speed & Performance Audit

### What Works

- Vite build with manual chunk splitting (react-vendor, firebase-vendor, motion-vendor, icons-vendor, ai-vendor, stripe-vendor)
- Lazy loading on all route-level components via `React.lazy()` + `Suspense`
- Firebase v12 modular SDK (tree-shakeable)
- `react-window` for virtualized listing tables in admin
- `MotionConfig` with `reducedMotion="user"` respecting user preferences

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| SP-1 | **High** | `categorySpecs.ts` is **73,000 lines** and likely 200KB+ minified. This is imported into `ListingModal` which is lazy-loaded, but it's still a massive chunk. Should be split by category and loaded on demand. |
| SP-2 | **High** | `equipmentService.ts` is **2,444 lines** and imported across multiple pages. Every page that imports it gets the full service. Should be split into read/write services with tree-shaking-friendly exports. |
| SP-3 | **High** | `AdminDashboard.tsx` at **4,202 lines** and `Profile.tsx` at **2,701 lines** are the two largest page components. Even with lazy loading, these are enormous single-chunk downloads. |
| SP-4 | **Medium** | `framer-motion` (now `motion`) is a ~35KB gzipped dependency used on nearly every page for simple fade-in animations. Consider replacing simple animations with CSS transitions and reserving framer-motion for complex interactive animations. |
| SP-5 | **Medium** | `@google/genai` is bundled as `ai-vendor` chunk. If Gemini AI features are only used in admin/internal contexts, this chunk should not be loaded for public visitors. |
| SP-6 | **Medium** | No image optimization pipeline. Listing images are served directly from Firebase Storage without resizing, format conversion (WebP/AVIF), or CDN-level optimization. |
| SP-7 | **Low** | No `preconnect` or `dns-prefetch` hints in `index.html` for Firebase, Stripe, or Google APIs. |
| SP-8 | **Low** | Lighthouse Performance score unknown — recommend running a production Lighthouse audit once deployed. Target: 75+ for mobile, 90+ for desktop. |

---

## 9. Security Audit

| # | Severity | Issue |
|---|----------|-------|
| SEC-1 | **Critical** | CSRF protection is **completely disabled**. The `csurf` middleware is commented out and `/api/csrf-token` returns `{ csrfToken: 'dummy-token' }`. Any authenticated POST endpoint is vulnerable to CSRF attacks. |
| SEC-2 | **High** | Firestore rules are comprehensive (848 lines) but listing cap enforcement is not present in rules — it relies on client-side and server-side API checks. A direct Firestore SDK write from a modified client could bypass caps. |
| SEC-3 | **High** | The `/api/upload` endpoint includes a `scanFileForViruses()` call, but this function's implementation should be verified — if it's a stub, uploaded files are unscanned. |
| SEC-4 | **Medium** | Rate limiting via `express-rate-limit` is imported but its application scope should be verified on all public-facing endpoints (contact form, login, registration, checkout). |
| SEC-5 | **Medium** | `GEMINI_API_KEY` is exposed via Vite's `define` config as `process.env.GEMINI_API_KEY`, which means it's bundled into the client-side JavaScript. API keys should never be in the client bundle. |
| SEC-6 | **Medium** | reCAPTCHA Enterprise assessment in `/api/recaptcha-assess` has a `catch` block that returns `{ pass: true }` on any error — meaning if reCAPTCHA is down, all requests pass. This is noted as "graceful degradation" but could be exploited. |
| SEC-7 | **Low** | No Content Security Policy reporting endpoint configured. CSP is set via Helmet but violations are silently dropped. |

---

## 10. Code Quality & Architecture

### Monolith Files That Need Decomposition

| File | Lines | Recommendation |
|------|-------|----------------|
| `functions/index.js` | 11,164 | Split into modules: billing, auth, email, SEO, dealer-feeds, lifecycle, scheduled-jobs |
| `AdminDashboard.tsx` | 4,202 | Split into tab components: OverviewTab, ListingsTab, UsersTab, BillingTab, ContentTab, etc. |
| `Profile.tsx` | 2,701 | Split into: ProfileOverview, ProfileSettings, ProfileSecurity, MyListingsTab, InquiriesTab, etc. |
| `equipmentService.ts` | 2,444 | Split into: listingReadService, listingWriteService, listingSearchService |
| `ListingDetail.tsx` | 1,851 | Split into: ListingGallery, ListingSpecs, ListingContact, SellerCard, SimilarListings |
| `DealerOS.tsx` | 1,643 | Split into: DealerOverview, DealerInventory, DealerLeads, DealerSettings |
| `server.ts` | 1,453 | Split into route modules: billingRoutes, adminRoutes, uploadRoutes, authRoutes |
| `categorySpecs.ts` | 73,000 | Move to database/API, load on demand by category |

### Testing

**Current state: Zero tests.** No `.test.ts`, `.spec.ts`, `__tests__/`, or any testing framework in `package.json`. No Jest, Vitest, Playwright, Cypress, or any other testing tool.

This is the single biggest gap between TimberEquip2 and a Tier 2 Enterprise classification.

### Missing Infrastructure

- No CI/CD pipeline definition (no `.github/workflows/`, no `Jenkinsfile`, no `cloudbuild.yaml`)
- No error tracking service (no Sentry, Bugsnag, or LogRocket integration)
- No application performance monitoring (no Datadog, New Relic, or Firebase Performance)
- No feature flags system
- No database backup strategy documented
- No load testing evidence

---

## 11. Developer Cost Scoping

### What Exists (Current Value)

To rebuild what currently exists from scratch:

| Component | Estimated Effort |
|-----------|-----------------|
| Frontend (React SPA, 25 pages, 20 components) | 800–1,000 hours |
| Backend (Express server + Cloud Functions) | 400–500 hours |
| Stripe Integration (checkout, webhooks, entitlements) | 120–160 hours |
| Firebase Setup (Auth, Firestore rules, Storage rules, hosting) | 80–120 hours |
| Admin Dashboard | 200–300 hours |
| DealerOS & Feed Ingestion | 150–200 hours |
| SEO System (SSR proxy, sitemaps, landing pages) | 120–160 hours |
| Email System (SendGrid templates, scheduled sends) | 40–60 hours |
| Deployment & Ops Tooling | 60–80 hours |
| **Total existing build** | **1,970–2,580 hours** |

### Cost to Reach Full Tier 2 (Remaining Work)

See the `final-tier-2-scope.md` companion document for itemized tasks. Summary estimate for remaining work:

| Work Category | Hours |
|---------------|-------|
| Critical fixes (CSRF, 404, security) | 40–60 |
| Stripe Customer Portal + subscription date display | 30–40 |
| DMCA page + legal page fixes | 15–25 |
| Automated testing (unit + integration + e2e) | 200–300 |
| File decomposition / refactoring | 80–120 |
| SSR expansion for all public pages | 60–80 |
| Image optimization pipeline | 30–40 |
| CI/CD pipeline | 30–40 |
| Error tracking + monitoring | 20–30 |
| Performance optimization (bundle splitting) | 40–60 |
| Consent logging + cookie management | 15–20 |
| **Total remaining to Tier 2** | **560–815 hours** |

### India Development Team Cost

| Role | Hourly Rate (USD) | Typical Agency Rate |
|------|-------------------|---------------------|
| Senior Full-Stack Developer | $25–$45/hr | $35–$55/hr |
| Mid-Level React Developer | $15–$30/hr | $25–$40/hr |
| QA/Test Engineer | $12–$25/hr | $20–$35/hr |
| DevOps Engineer | $20–$40/hr | $30–$50/hr |
| Project Manager | $15–$30/hr | $25–$40/hr |

**Estimated total (India, blended ~$30/hr):** $16,800 – $24,450  
**Timeline with 2–3 person team:** 10–16 weeks  
**Recommended team:** 1 senior full-stack lead, 1 mid-level React dev, 1 QA engineer (part-time)

### USA Development Team Cost

| Role | Hourly Rate (USD) | Typical Agency Rate |
|------|-------------------|---------------------|
| Senior Full-Stack Developer | $120–$200/hr | $175–$275/hr |
| Mid-Level React Developer | $80–$140/hr | $125–$200/hr |
| QA/Test Engineer | $70–$120/hr | $100–$175/hr |
| DevOps Engineer | $100–$175/hr | $150–$250/hr |
| Project Manager | $80–$140/hr | $125–$200/hr |

**Estimated total (USA, blended ~$150/hr):** $84,000 – $122,250  
**Timeline with 2–3 person team:** 8–14 weeks  
**Recommended team:** 1 senior full-stack lead, 1 mid-level React dev, 1 QA engineer (part-time)

### Hybrid Recommendation

For best value, consider a hybrid approach: hire a US-based senior architect/lead ($150–200/hr) for 10–15 hours/week to set standards, review PRs, and manage the roadmap, with an India-based team of 2 developers + 1 QA executing the work. **Estimated hybrid cost: $30,000–$45,000** over 12 weeks.

---

## 12. Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 7/10 | Solid foundations, monolith files need splitting |
| Authentication & Authorization | 8/10 | Firebase Auth + MFA + role-based entitlements |
| Billing & Payments | 6/10 | Stripe integration works, missing Customer Portal and date display |
| Security | 4/10 | CSRF disabled, client-side cap enforcement, API key in bundle |
| SEO | 6/10 | SSR proxy exists but coverage is partial, no 404 page |
| Performance | 5/10 | Lazy loading present, massive specs file, no image optimization |
| Testing | 0/10 | Zero tests of any kind |
| Legal Compliance | 5/10 | Terms are solid, Privacy needs expansion, no DMCA, broken consent |
| DevOps | 6/10 | Deploy scripts exist, no CI/CD, no error tracking |
| Code Quality | 5/10 | Well-structured services, but file sizes block team scaling |
| **Overall** | **5.2/10** | **Tier 2.5 — strong MVP, needs hardening for production** |
