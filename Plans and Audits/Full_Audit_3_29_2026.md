# Full Website Audit — March 29, 2026

## Scope And Method

This audit is based on the current repository workspace, not on a live production crawl.

Verified during this review:

- Repo and architecture review across frontend, backend, rules, and deploy scripts
- `npm ci`
- `npm run lint`
- `npm run build`
- `npm audit --json`
- Local runtime checks against `http://localhost:3000`

What was not done in this pass:

- Browser-based Lighthouse profiling
- Real production traffic analysis
- Full authenticated end-to-end user journey testing against live services

## Executive Summary

Forestry Equipment Sales is already a large multi-role marketplace platform, not a simple brochure site. The codebase has real marketplace, seller, dealer, admin, billing, SEO, and content-management functionality implemented. In plain terms, this is a serious Tier 2.5 marketplace platform with enterprise ambitions.

The problem is not lack of feature surface. The problem is that the platform is ahead on breadth and behind on hardening.

Current audit conclusion:

- Functionality: strong feature breadth, but release confidence is reduced by typecheck failures, missing automated tests, local runtime dependency mismatches, and an HTTP 200 response for unknown routes
- Security: meaningful controls are present, but important production defenses are either disabled, too permissive, deprecated, hardcoded, or simulated
- Speed: the site builds successfully and uses route-level lazy loading and vendor chunking, but it still carries avoidable client-side workload and large assets that will hurt scale

Recommended current maturity label:

- **Current state:** Tier 2.5 enterprise vertical marketplace
- **Not yet Tier 3:** reliability, security hardening, QA automation, and scalable search/data architecture are not finished

## What Is Already Good

These are real strengths, not placeholders:

- React + Vite frontend with route-level lazy loading
- Express + Firebase backend with role-aware API routes
- Stripe billing and subscription flows
- Admin dashboard with listings, inquiries, calls, billing, users, CMS, and dealer feed operations
- DealerOS portal with inventory, feed setup, logs, public embeds, and storefront tooling
- SEO landing page architecture for categories, manufacturers, models, states, and dealers
- Firestore and Storage rules with real validation logic
- CSRF token endpoint is active again and returns `SameSite=Lax` cookies
- Rate limiting exists for `/api/*` and AI generation routes
- Build output is chunked by major dependency groups instead of shipping one giant vendor file

## Critical Findings

### 1. TypeScript Reliability Gate Is Broken

**What I verified**

- `npm run lint` fails with **19 TypeScript errors** across `server.ts`, `src/components/AuthContext.tsx`, `src/pages/AdminDashboard.tsx`, `src/pages/ListingDetail.tsx`, `src/pages/Profile.tsx`, and `src/services/equipmentService.ts`
- `npm run build` still succeeds, which means production bundles can be created while correctness issues remain unresolved

**Why this matters**

- This is a release-quality problem, not just a developer-experience problem
- The current pipeline allows compile-time regressions to accumulate silently
- Some of the errors are not cosmetic. At least one is tied to a real undefined identifier in a live service path

**Concrete examples**

- `src/services/equipmentService.ts` references `SUPERADMIN_EMAIL`, but that constant is not defined
- `server.ts` has Stripe and Firestore typing mismatches
- `Profile.tsx` and `AuthContext.tsx` have contract mismatches around account access data

**Potential fix**

- Fix all 19 current TypeScript errors first
- Make `npm run lint` a required CI gate before deploy
- Optionally add `vite build && npm run lint` or a dedicated `verify` script that blocks deployment if typecheck fails

**Estimated effort**

- 1 to 3 days

### 2. Unknown Routes Return HTTP 200 Instead Of HTTP 404

**What I verified**

- `App.tsx` correctly renders a `NotFound` page for `*`
- Local runtime check: `curl -I http://localhost:3000/does-not-exist` returned `HTTP/1.1 200 OK`
- In `server.ts`, production static serving uses:

```ts
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
```

**Why this matters**

- Search engines and uptime checks will see a valid 200 response for missing pages
- That weakens SEO quality, crawl hygiene, and error monitoring
- It also makes soft-404 issues more likely

**Potential fix**

- Return `404` for unknown routes at the server layer while still serving the app shell
- Add a route allowlist or a smarter fallback strategy for known SPA routes versus true misses
- Mirror this behavior in hosting and smoke tests

**Estimated effort**

- 4 to 8 hours

### 3. Local Development Starts In A Degraded State

**What I verified**

- After root `npm ci`, `npm run dev` logs module-load errors:
  - missing `firebase-functions`
  - missing `firebase-functions/v2/storage`
- The server still starts, but hybrid public pages and local dealer-function proxy loading are degraded
- Root `server.ts` requires code from `functions/`, but the root package does not install the nested `functions/package.json` dependencies

**Why this matters**

- Local development is not reproducible from a single clean install
- Engineers can think the stack is healthy because the server starts, while feature paths are partially broken underneath
- This slows debugging and makes onboarding harder

**Potential fix**

- Convert the repo to npm workspaces, or add a root postinstall/dev bootstrap that also installs `functions/` dependencies
- Alternatively isolate those imports so the root app can run without optional function modules
- Add a startup health check that fails loudly when expected local dependencies are absent

**Estimated effort**

- 6 to 12 hours

### 4. There Is No Automated Test Foundation

**What I verified**

- No `*.test.*` or `*.spec.*` files were found
- No `vitest.config.ts`, `playwright.config.ts`, or Jest config files were found

**Why this matters**

- The platform is already too large to rely on manual QA only
- Billing, listing lifecycle, role access, dealer feed ingestion, and SEO routes all need regression coverage
- The current size of the codebase makes untested changes increasingly expensive

**Potential fix**

- Add Vitest + React Testing Library for units and integrations
- Add Playwright for critical path end-to-end flows
- Start with billing, account entitlement, listing lifecycle, auth, seller flows, and search

**Estimated effort**

- 140 to 260 hours for a meaningful first-pass foundation

## High-Priority Functionality Findings

### 5. Undefined Super Admin Constant In A Live Service Path

**What I verified**

- `src/services/equipmentService.ts` references `SUPERADMIN_EMAIL` at multiple call sites
- That identifier is not defined in the file
- One usage affects listing save behavior, another affects demo inventory seeding

**Why this matters**

- This is a real runtime hazard if those code paths execute
- It also explains part of the current typecheck failure

**Potential fix**

- Replace the undefined constant with an imported shared helper from `src/utils/privilegedAdmin.ts`, or remove email-based super-admin logic entirely and rely on role claims only

**Estimated effort**

- 2 to 6 hours

### 6. The Checked-In Hosting Config Is Currently In Noindex Mode

**What I verified**

- Checked-in `firebase.json` currently includes a sitewide `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`
- Deploy scripts can switch this to indexable mode using `scripts/run-seo-command.mjs` and `scripts/prepare-seo-mode.mjs`

**Why this matters**

- This is safe if deployment always goes through the scripted pipeline
- It is dangerous if someone deploys the checked-in `firebase.json` directly, because production could remain blocked from indexing

**Potential fix**

- Keep environment-specific hosting config generation in CI only
- Add a required smoke test that fails production deploy if `x-robots-tag` contains `noindex`
- Avoid keeping staging/noindex config checked in as the default production-facing file

**Estimated effort**

- 4 to 8 hours

### 7. Several Core Flows Have Become Too Large To Maintain Comfortably

**What I verified**

- `functions/index.js`: 12,166 lines
- `src/pages/AdminDashboard.tsx`: 4,482 lines
- `src/pages/Profile.tsx`: 2,967 lines
- `src/services/equipmentService.ts`: 2,567 lines
- `server.ts`: 2,147 lines

**Why this matters**

- Large files slow safe iteration
- They increase regression risk, especially without test coverage
- Responsibilities are too mixed: UI, orchestration, policy, cache behavior, API interaction, and formatting logic are often in the same file

**Potential fix**

- Split by bounded context:
  - billing
  - listings
  - dealer feeds
  - admin analytics
  - profile/settings
  - content/CMS
- Keep shared domain logic in smaller service modules

**Estimated effort**

- 40 to 90 hours, best done incrementally

## Security Findings

### 8. Security Headers Are Disabled And CORS Is Too Permissive

**What I verified**

- The Helmet block in `server.ts` is commented out
- CORS is currently configured as:

```ts
app.use(cors({
  origin: true,
  credentials: true,
}));
```

- Runtime responses expose `X-Powered-By: Express`
- Runtime responses do not show the expected CSP/HSTS/frameguard protections from Helmet

**Why this matters**

- `origin: true` is acceptable for fast development, but it is too open for a hardened production posture when credentials are allowed
- Missing CSP, frame policies, and other headers make browser-side attack reduction weaker than it should be
- Exposing `X-Powered-By` is a low-grade fingerprinting leak

**Potential fix**

- Re-enable Helmet with production-safe defaults and environment-specific exceptions only where required
- Replace `origin: true` with an explicit allowlist by environment
- Call `app.disable('x-powered-by')`
- Add automated smoke checks for security headers in staging and production

**Estimated effort**

- 8 to 16 hours

### 9. Privileged Admin Access Is Hardcoded In Multiple Places

**What I verified**

- `src/utils/privilegedAdmin.ts` hardcodes:
  - `caleb@forestryequipmentsales.com`
  - `calebhappy@gmail.com`
- `firestore.rules` treats `caleb@forestryequipmentsales.com` as privileged
- `storage.rules` treats `calebhappy@gmail.com` as privileged

**Why this matters**

- Privilege should be managed by role claims and controlled server-side state, not scattered hardcoded emails
- A personal Gmail in production privilege logic is a governance and auditability concern
- It is harder to rotate, audit, or migrate environments when identity is hardcoded in multiple layers

**Potential fix**

- Move privileged access entirely to role claims and admin-managed documents
- Remove direct email-based privilege checks from frontend and rules where possible
- If a bootstrap admin allowlist is still needed, centralize it in one secure configuration source and rotate it out after setup

**Estimated effort**

- 8 to 20 hours

### 10. Storage Rules Are Environment-Coupled To A Hardcoded Firestore Database ID

**What I verified**

- `storage.rules` contains direct references to `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c`

**Why this matters**

- This creates environment fragility
- Staging, new projects, or database migrations become harder and more error-prone
- Access logic should not be pinned to a single literal database path

**Potential fix**

- Refactor storage rules to use the active database context instead of hardcoded project/database IDs
- Re-validate staging and production uploads after rules cleanup

**Estimated effort**

- 4 to 10 hours

### 11. CSRF Is Present Again, But The Chosen Package Is Deprecated

**What I verified**

- CSRF protection is active again and `/api/csrf-token` works
- `npm ci` reports `csurf@1.11.0` as archived and deprecated

**Why this matters**

- The immediate control is better than having no CSRF protection
- Long term, relying on an archived package is not a stable enterprise choice

**Potential fix**

- Replace `csurf` with a maintained CSRF strategy for Express
- Keep the same token-fetch pattern already introduced in the frontend
- Re-test all mutation routes and Stripe webhook exemptions after migration

**Estimated effort**

- 8 to 16 hours

### 12. Dependency Security Debt Exists Today

**What I verified**

- `npm audit` reports **13 vulnerabilities** total
- Severity breakdown:
  - 10 low
  - 3 high
  - 0 critical
- High-severity vulnerable packages include:
  - `node-forge`
  - `path-to-regexp`
  - `picomatch`

**Why this matters**

- Some of these are transitive and may not all be directly exploitable in your exact runtime paths
- Even so, enterprise buyers and security reviewers will treat this as open dependency debt until resolved or explicitly accepted

**Potential fix**

- Update direct dependencies that pull vulnerable transitive chains, especially `firebase-admin` and related packages
- Replace deprecated or archived packages where fixes are unavailable
- Re-run audit in CI and fail builds on high or critical findings

**Estimated effort**

- 8 to 20 hours

### 13. Malware Scanning Is Simulated, Not Real

**What I verified**

- `server.ts` uses a mock virus scanner that checks for the EICAR string and explicitly says real production scanning is not implemented

**Why this matters**

- That is not a production-grade malware control
- If this upload endpoint is ever relied on for user file intake, it should be treated as incomplete security posture

**Potential fix**

- Move upload scanning to a real asynchronous pipeline:
  - Storage upload
  - quarantine bucket/path
  - ClamAV or Cloud Run scanning worker
  - release only after clean result
- Log scan results and failed uploads for auditability

**Estimated effort**

- 12 to 24 hours

## Speed And Scalability Findings

### 14. Search Pulls Full Inventory Into The Client And Filters In Memory

**What I verified**

- `Search.tsx` loads listings into `allListings`
- It calls `equipmentService.getListings({ inStockOnly: false, sortBy: 'newest' })`
- `filteredListings` and `displayedListings` are then derived client-side
- Pagination is effectively `slice(0, displayCount)` in memory, not server-side pagination

**Why this matters**

- This is acceptable at small inventory counts but will degrade as marketplace volume grows
- Network cost, parse cost, memory cost, and filter latency all rise together
- It also duplicates filtering logic across client and service layers

**Potential fix**

- Move public search to server-side filtering with cursor-based pagination
- Add real query indexes or a dedicated search service for keyword + faceted search
- Return only the fields needed for result cards, not full listing payloads

**Estimated effort**

- 50 to 120 hours depending on search architecture choice

### 15. Taxonomy Payload Is Large

**What I verified**

- Production build emits `final_taxonomy_with_manufacturer_buying_guides...json` at **3.38 MB raw** and **188 KB gzip**

**Why this matters**

- Even compressed, it is a heavy data asset for taxonomy-dependent flows
- It adds parse and memory cost in the browser

**Potential fix**

- Split taxonomy by top-level category or by feature area
- Fetch the full taxonomy only where it is truly needed
- Keep a small bundled fallback and lazy-load the large dataset on demand

**Estimated effort**

- 12 to 24 hours

### 16. Some Route Chunks Are Already Heavy

**What I verified**

- Large build artifacts include:
  - `AdminDashboard`: 188.94 KB raw
  - `react-vendor`: 231.81 KB raw
  - `vendor--firebase-firestore`: 255.68 KB raw
  - `Profile`: 85.87 KB raw
  - `ListingDetail`: 66.58 KB raw
- Full `dist` footprint is about **9.1 MB** across **62 assets**

**Why this matters**

- The site is not catastrophically large, but it is large enough that weak devices and slower networks will feel it
- Admin and dealer routes are good candidates for further isolation and payload trimming

**Potential fix**

- Continue route isolation and remove unused code from large views
- Split admin dashboards into sub-routes or smaller tab bundles
- Audit whether all Firebase and motion packages are required on first route entry

**Estimated effort**

- 16 to 40 hours

## Summary By Category

### Functionality

Current state: feature-rich, but not fully release-safe.

Top blockers:

- TypeScript errors are unresolved
- Local dev comes up partially degraded
- Unknown routes return HTTP 200
- No automated testing foundation exists

### Security

Current state: decent base controls, but not enterprise-hardened.

Top blockers:

- Helmet/security headers disabled
- CORS too open for production-grade posture
- Hardcoded privileged identities and environment-coupled rules
- Deprecated CSRF package and open dependency debt
- Simulated malware scanning

### Speed

Current state: acceptable for current scope, but not ready for larger-scale inventory growth.

Top blockers:

- Full inventory search in the browser
- Heavy taxonomy asset
- Large monolithic files and route bundles

## Priority Fix Order

### Next 72 Hours

1. Fix the 19 TypeScript errors and make typecheck non-optional
2. Return true HTTP 404 for missing routes
3. Re-enable Helmet and lock CORS to explicit origins
4. Remove hardcoded privilege checks from scattered files

### Next 2 To 3 Weeks

1. Add test foundation for billing, auth, listing lifecycle, and search
2. Clean up dependency vulnerabilities and replace deprecated CSRF package
3. Fix local dev dependency alignment between root app and `functions/`
4. Add smoke tests for security headers, robots mode, and 404 behavior

### Next 1 To 2 Months

1. Move search to server-side pagination and indexed/faceted querying
2. Break down monolithic files by domain
3. Reduce taxonomy payload size and trim large route bundles
4. Add real upload malware scanning and stronger observability

## Final Audit Verdict

This website is **substantial and valuable**, but it is not yet in a clean Tier 3 enterprise state.

If you present it honestly today, the strongest position is:

- the platform already has serious marketplace capability
- the core business model is implemented
- the remaining work is primarily hardening, QA, scale, and operational maturity

That is a strong story. It is much better than saying the platform is unfinished. The more accurate statement is that **the platform is feature-rich and commercially meaningful, but still needs enterprise finishing work before it should be treated as fully hardened Tier 3 software**.
