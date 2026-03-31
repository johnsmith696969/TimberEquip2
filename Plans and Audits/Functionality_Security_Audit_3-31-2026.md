# Forestry Equipment Sales — Full Functionality & Security Audit

**Date:** March 31, 2026
**Scope:** Complete website audit, functionality testing, refactoring plan, and production deployment preparation
**Objective:** Finalize website for production staging, domain migration, and 301 redirects from forestryequipmentsales.com

---

## Executive Summary

Forestry Equipment Sales is a Tier 2.5 enterprise vertical marketplace with substantial feature breadth across buyer, seller, dealer, and admin roles. The previous audit (March 29) identified core issues that have been partially resolved. This audit builds on that work and adds comprehensive functionality testing, database architecture evaluation, branding finalization, and a clear path to production launch.

**Key decisions made in this audit:**
- **Database architecture:** Hybrid (PostgreSQL for listings/search/governance + Firebase for auth/storage/profiles) — RECOMMENDED
- **Branding:** User-facing content is already migrated to "Forestry Equipment Sales" — internal cleanup needed for Sentry tags and legacy field names
- **Firebase project ownership:** Will need to transfer to caleb@forestryequipmentsales.com (discussed in Phase 6)

---

## Database Architecture Decision: Hybrid Approach

### Recommendation: Option C — Hybrid Firebase + PostgreSQL

| Layer | Database | Rationale |
|-------|----------|-----------|
| **Authentication** | Firebase Auth | Keep as-is. MFA, custom claims, OAuth deeply coupled. Zero migration risk. |
| **File Storage** | Firebase Storage | Keep as-is. All images/video already uploaded. Cloud Function trigger converts to AVIF. |
| **Listings + Search** | PostgreSQL | Full-text search (`tsvector`), geo-queries (PostGIS), ACID transactions, 16+ filter dimensions |
| **Governance** | PostgreSQL | Schema already exists (`listing_governance_phase1.sql`). CHECK constraints enforce lifecycle invariants. |
| **Inquiries, Calls** | PostgreSQL | High-volume, relational data with aggregation needs for monthly reports |
| **Subscriptions, Billing** | PostgreSQL | ACID transactions critical for payment state changes |
| **User Profiles** | Firestore (short-term) | Low migration priority. Real-time listener active. Move to PG later. |
| **CMS/Blog** | Firestore (short-term) | Low volume. Move to PG later as optional Phase 5+. |
| **Taxonomy/Config** | Firestore | Low volume, fast reads, real-time capable |

**Cost projection at scale:**

| Scale | Firestore-only cost | Hybrid cost | Savings |
|-------|-------------------|-------------|---------|
| 10K listings, 5K users/day | ~$50-100/mo | ~$30-40/mo | 40-60% |
| 50K listings, 25K users/day | ~$600-1,200/mo | ~$50-75/mo | 90%+ |

---

## Phase 1: Critical Security & Functionality Fixes (Days 1-3)

### 1.1 CRITICAL: Add Auth to File Upload Endpoint
- **File:** `server.ts:2170`
- **Issue:** `/api/upload` has NO authentication check. Anyone can upload files.
- **Fix:** Add Firebase ID token verification before accepting uploads.
- **Effort:** 30 minutes

### 1.2 CRITICAL: Fix Unreachable Password Reset Code
- **File:** `AuthContext.tsx:774-812`
- **Issue:** `throw resetError` at line 797 makes Firebase fallback code (lines 799-811) unreachable.
- **Fix:** Remove dead code or restructure error flow so Firebase fallback actually executes.
- **Effort:** 30 minutes

### 1.3 HIGH: Fix DealerOS Access Without Active Subscription
- **File:** `ProtectedRoute.tsx:37`
- **Issue:** Users with `role = 'dealer'` but no active subscription can bypass `requireDealerOs` check if `entitlement?.dealerOsAccess` isn't properly set.
- **Fix:** Ensure DealerOS access requires both dealer role AND active subscription status.
- **Effort:** 1 hour

### 1.4 HIGH: Profile Updates Lack Server Sync Verification
- **File:** `Profile.tsx:690-920`
- **Issue:** `userService.updateProfile()` fires but local state updates immediately without waiting for server confirmation. If server fails, UI shows success but data isn't persisted.
- **Fix:** Await server response before updating local state; rollback on failure.
- **Effort:** 2 hours

### 1.5 HIGH: Add `pro_dealer` to Dealer Feed Ingest Role Check
- **File:** `server.ts:2296`
- **Issue:** Dealer feed ingest checks `['dealer', 'dealer_manager']` but not `'pro_dealer'`.
- **Fix:** Add `'pro_dealer'` to the role check array.
- **Effort:** 15 minutes

### 1.6 MEDIUM: Listing Cap Check Should Happen Before Form Render
- **File:** `Sell.tsx:228-232`
- **Issue:** User fills out entire listing form, then gets error that they've hit their listing cap.
- **Fix:** Check listing cap on page load and show upgrade prompt instead of form if at capacity.
- **Effort:** 1 hour

### 1.7 MEDIUM: DealerOS Should Disable "Add Listing" When No Slots
- **File:** `DealerOS.tsx:187-193`
- **Issue:** "Add Listing" button available even when `remainingListingSlots === 0`.
- **Fix:** Disable button and show "Upgrade plan" prompt when at capacity.
- **Effort:** 30 minutes

### 1.8 MEDIUM: Add TTL to Cached Account Bootstrap
- **File:** `AuthContext.tsx:450-453`
- **Issue:** Cached bootstrap data used without staleness check. Could show outdated subscription status.
- **Fix:** Add 5-minute TTL check before using cached data.
- **Effort:** 30 minutes

---

## Phase 2: Branding Finalization (Days 2-4)

### 2.1 Already Complete (Verified)
- [x] All user-facing emails reference `@forestryequipmentsales.com`
- [x] Phone number `218-720-0933` set correctly where present
- [x] Logo assets use `Forestry_Equipment_Sales_*` naming
- [x] SEO canonical URLs use `www.forestryequipmentsales.com`
- [x] Email templates branded "Forestry Equipment Sales"
- [x] `package.json` name is `forestry-equipment-sales`
- [x] Legal pages reference correct email domain

### 2.2 Sentry Application Tags (SHOULD UPDATE)
| File | Current | Target |
|------|---------|--------|
| `src/services/sentry.ts:41` | `app: 'timberequip-web'` | `app: 'forestry-equipment-sales-web'` |
| `sentry.server.ts:29` | `app: 'timberequip-server'` | `app: 'forestry-equipment-sales-server'` |
| `functions/sentry.js:20` | `app: 'timberequip-functions'` | `app: 'forestry-equipment-sales-functions'` |
| `scripts/render-alert-policies.mjs:81,110` | `service: 'timberequip'` | `service: 'forestry-equipment-sales'` |

### 2.3 Internal Data Model Fields (CONSIDER — Requires Data Migration)
| File | Field | Proposed |
|------|-------|----------|
| `dealerFeedService.ts:18` | `timberequipField` | `marketplaceField` |
| `functions/index.js` (multiple) | `timberequipListingId`, `timberequipCategory` | `marketplaceListingId`, `marketplaceCategory` |

### 2.4 Firebase Project IDs (KEEP AS-IS)
- `mobile-app-equipment-sales` (production) — Cannot change
- `timberequip-staging` (staging) — Cannot change easily
- DataConnect service ID `timberequip-marketplace` — Infrastructure bound

---

## Phase 3: SEO & Metadata Hardening (Days 3-7)

### 3.1 Per-Page SEO Audit

Every page needs proper: `<title>`, `<meta description>`, canonical URL, OG tags, JSON-LD structured data.

**Pages with good SEO (verified from codebase):**
- [x] Home — WebSite + SearchAction JSON-LD
- [x] Search — ItemList JSON-LD
- [x] ListingDetail — Product JSON-LD
- [x] SellerProfile — Organization JSON-LD
- [x] Categories, Manufacturers, States — Dynamic SEO landing pages
- [x] Dealers — Directory page with proper title/description

**Pages likely missing proper SEO:**
- [ ] About, Contact, FAQ — Static pages likely serving empty SPA shell to crawlers
- [ ] Financing, Logistics — Service pages need rich metadata
- [ ] Blog, BlogPost — Need Article JSON-LD structured data
- [ ] Calculator — Needs noindex or proper SEO
- [ ] Compare — Needs noindex
- [ ] Bookmarks, Profile, Admin, DealerOS — Should have noindex (protected pages)
- [ ] Privacy, Terms, Cookies, DMCA — Need proper titles but noindex

### 3.2 SSR Coverage for Crawlers
- **Issue:** Static pages (About, Contact, Financing, Terms, Privacy, etc.) serve empty SPA shells to search engine crawlers
- **Fix:** Expand `functions/public-pages.js` to SSR these pages, or use prerendering
- **Effort:** 40-60 hours

### 3.3 301 Redirect Infrastructure
- **Where to implement:** `firebase.json` hosting redirects OR `server.ts` middleware
- **Firebase.json approach** (preferred for static redirects):
```json
{
  "hosting": {
    "redirects": [
      { "source": "/old-path", "destination": "/new-path", "type": 301 }
    ]
  }
}
```
- **server.ts approach** (for dynamic/pattern-based redirects):
```typescript
app.get('/old-path/:slug', (req, res) => {
  res.redirect(301, `/new-path/${req.params.slug}`);
});
```
- **Need from you:** A list of current forestryequipmentsales.com URLs that need to redirect to new paths

### 3.4 Sitemap Verification
- Sitemap generated at `/sitemap.xml` via `publicPages` Cloud Function
- Verify it includes: all category pages, manufacturer pages, state pages, dealer pages, active listings
- Verify it excludes: admin pages, profile pages, expired/draft listings

### 3.5 Tab Titles — Naming Convention
Every page title should follow: `{Page-Specific Title} | Forestry Equipment Sales`

Examples:
- Home: `New & Used Forestry Equipment For Sale | Forestry Equipment Sales`
- Search: `Search Forestry Equipment | Forestry Equipment Sales`
- Listing: `{Year} {Make} {Model} - ${Price} | Forestry Equipment Sales`
- Category: `{Category} For Sale | Forestry Equipment Sales`
- Dealer: `{Dealer Name} - Equipment Inventory | Forestry Equipment Sales`

---

## Phase 4: Full Functionality Testing by Role (Days 5-14)

### 4.1 Buyer Role (Unauthenticated + Authenticated Member)

| Feature | Test | Expected |
|---------|------|----------|
| Home page load | Load `/` | Featured listings, sold ticker, category cards, market metrics display |
| Search with filters | Apply category + price + year filters | Filtered results render correctly |
| Search URL persistence | Apply filters, copy URL, paste in new tab | Same filters applied |
| Listing detail | Click listing card | Full detail page with images, specs, seller info |
| Image gallery | Click images on listing | Full-screen gallery with zoom/pan/pinch |
| Inquiry form | Submit inquiry on listing | Confirmation shown, seller notified, admin notified |
| Financing request | Submit financing form | Confirmation email sent |
| Logistics request | Submit shipping request | Confirmation email sent |
| Compare tool | Select 2-3 listings, navigate to `/compare` | Side-by-side comparison renders |
| Bookmarks (auth) | Bookmark a listing | Heart icon toggles, saved in user favorites |
| Bookmarks page | Navigate to `/bookmarks` | All saved listings displayed |
| Saved searches | Save a search with alert | Saved search appears in profile |
| Registration | Register new account | Welcome verification email sent |
| Dealer directory | Browse `/dealers` | All active dealers listed with search |
| Seller profile | Click dealer name | Public storefront with inventory |
| Blog | Browse `/blog` | Published posts listed |
| Blog post | Click blog post | Full article renders |
| Calculator | Use financing calculator | Monthly payment calculated |
| Category pages | Browse `/categories/{slug}` | Category-specific listings |
| Manufacturer pages | Browse `/manufacturers/{slug}` | Manufacturer-specific listings |
| State pages | Browse `/states/{slug}/forestry-equipment-for-sale` | State-filtered listings |

### 4.2 Owner-Operator Role (Individual Seller — $39/mo)

| Feature | Test | Expected |
|---------|------|----------|
| Subscribe | Purchase Owner-Operator plan | Stripe checkout completes, subscription active |
| Create listing | Fill form on `/sell` | Listing created, submitted for review |
| Upload images | Upload 5+ images | Images stored in Firebase Storage, linked to listing |
| Edit listing | Modify existing listing | Changes saved |
| Profile settings | Update phone, address, website | Changes persist after page refresh |
| Storefront | View own public storefront | Storefront displays with listing |
| Billing portal | Click "Manage Billing" | Stripe portal opens |
| Listing cap (1) | Try to create 2nd listing | Error or upgrade prompt |
| Cancel subscription | Cancel via billing portal | Listings paused, status updated |
| Data export | Request data export | Export generated |
| Account deletion | Request deletion | Process initiated |

### 4.3 Dealer Role ($499/mo, 50 listings, 3 managed accounts)

| Feature | Test | Expected |
|---------|------|----------|
| DealerOS access | Navigate to `/dealer-os` | Dealer dashboard loads |
| Inventory management | View/filter live, featured, imported, sold inventory | Correct filtering |
| Bulk import (JSON) | Upload JSON file | Listings created/updated correctly |
| Bulk import (CSV) | Upload CSV file | Listings created/updated correctly |
| Bulk import (XML) | Upload XML file | Listings created/updated correctly |
| Feed profile setup | Configure auto-sync feed | Feed saved with correct settings |
| Sync logs | View feed sync history | Logs displayed with status |
| Image upload via feed | Import with `imageUrls` field | Images downloaded and linked |
| Featured inventory | Mark/unmark listings as featured | Featured status toggles, limits enforced |
| Lead management | View inquiries | All inquiries for dealer's listings shown |
| Voicemail management | View voicemails | Voicemails listed with playback |
| Public feed URL | Copy embed/feed URL | Public feed endpoint returns dealer inventory |
| Managed accounts | Create sub-account for staff | Invite email sent, account created |
| Listing cap (50) | Verify 50-listing limit | 51st listing blocked |
| Monthly report | Verify 30-day report email | Report includes: views, inquiries, top 3 machines, calls, voicemails |
| Storefront customization | Edit storefront name, tagline, description | Changes reflected on public page |

### 4.4 Pro Dealer Role ($999/mo, 150 listings, 3 managed accounts)

| Feature | Test | Expected |
|---------|------|----------|
| All Dealer features | Same as 4.3 | Same expected results |
| Listing cap (150) | Verify 150-listing limit | 151st listing blocked |
| API upload | POST to dealer feed API endpoint | Listings ingested correctly |
| Export functionality | Export listings | Excel/CSV export with all fields |

### 4.5 Admin Role

| Feature | Test | Expected |
|---------|------|----------|
| Dashboard overview | Load `/admin` | Key metrics: active listings, pending approvals, subscribers, revenue |
| Listings tab | View all listings | Virtualized table with search/filter |
| Approve listing | Approve pending listing | Listing goes live, seller notified |
| Reject listing | Reject with reason | Seller notified with reason |
| Inquiries tab | View all inquiries | All inquiries across all dealers |
| Calls tab | View call logs | All call records |
| Accounts tab | View all user accounts | User list with roles, subscription status |
| Edit user role | Change user role | Role updated in Firebase custom claims |
| Upload for dealer | Select dealer UID, upload equipment | Listing created under dealer's account |
| Billing tab | View invoices, subscriptions | Billing data from Stripe |
| Audit logs | View billing audit trail | Chronological action log |
| Content/CMS | Create/edit blog post | Post saved with SEO fields |
| Media library | Upload/manage media | Assets stored and retrievable |
| Dealer feeds | View feed status, trigger manual ingest | Feed processed correctly |
| Taxonomy manager | Edit categories, manufacturers | Changes saved and reflected in search filters |
| Monthly report | Verify admin monthly report email | Site-wide: total views, popular machines, total inquiries, total calls, financing requests, trucking requests |

### 4.6 Super Admin Role

| Feature | Test | Expected |
|---------|------|----------|
| All Admin features | Same as 4.5 | Same expected results |
| Create admin accounts | Create new admin/content_manager/developer user | Account created with correct role |
| Block/unblock users | Block a dealer account | Account deactivated, listings hidden |
| Reset user passwords | Force password reset | Reset email sent |
| Override subscription | Waive payment for a dealer | Dealer gets access without payment |
| System-wide settings | Access all configuration | Full control over system settings |
| Bootstrap data | `/api/admin/bootstrap` | Returns overview, listings, inquiries, accounts, billing logs |

---

## Phase 5: Monthly Reports & Email Verification (Days 10-14)

### 5.1 Dealer/Pro Dealer Monthly Report Content
Must include:
- Active listing count
- Lead form submissions (30-day)
- Call button clicks
- Connected calls
- Qualified calls (60s+)
- Missed calls
- Total listing views
- Top 3 machines by inquiry volume (title, inquiry count, call count, view count)

**Email template:** `dealerMonthlyReport` in `functions/email-templates/index.js` — VERIFIED as implementing all above fields.

### 5.2 Admin/Super Admin Monthly Report Content
Must include (different from dealer report):
- Consolidated seller performance table (all sellers)
- Per-seller: listings, leads, calls, qualified calls, views
- Site-wide totals: total listings, total inquiries, total calls, total financing requests, total trucking requests

**Email template:** `dealerMonthlyReportAdminSummary` — VERIFIED as implementing seller summary table.

**Gap identified:** The admin report template does NOT currently include:
- [ ] Total financing requests count
- [ ] Total trucking/logistics requests count
- [ ] Total new user registrations
- [ ] Revenue summary
- **Fix needed:** Add these aggregations to the admin monthly report template

### 5.3 Email Delivery Verification
Test that all 30 email templates render and deliver:
1. leadNotification
2. inquiryConfirmation (general, shipping, financing variants)
3. welcomeVerification
4. subscriptionExpiring
5. listingApproved
6. listingSubmitted
7. listingRejected
8. invoicePaidReceipt
9. subscriptionExpired
10. mediaKitRequest / mediaKitRequestConfirmation
11. financingRequestConfirmation / financingRequestAdmin
12. contactRequestConfirmation / contactRequestAdmin
13. subscriptionCreated
14. newMatchingListing
15. matchingListingPriceDrop
16. matchingListingSold
17. similarListingRestocked
18. managedAccountInvite
19. adminInquiryAlert
20. dealerMonthlyReport
21. dealerMonthlyReportAdminSummary

---

## Phase 6: Infrastructure & Firebase Transfer (Days 14-21)

### 6.1 Firebase Project Transfer to caleb@forestryequipmentsales.com
**Options:**
1. **Add caleb@forestryequipmentsales.com as project Owner** in Firebase Console -> Settings -> Users and Permissions
2. **Remove old owner** after verifying new owner has full access
3. **Update billing contact** to new email
4. **Note:** Firebase project IDs (`mobile-app-equipment-sales`, `timberequip-staging`) cannot change

**Steps:**
1. Log into Firebase Console with current owner account
2. Go to Project Settings > Users and permissions
3. Add `caleb@forestryequipmentsales.com` as Owner
4. Verify new owner can access all project features
5. Update billing account if needed
6. Optionally remove old personal Gmail from project (keep as backup admin initially)

### 6.2 301 Redirect Setup for Domain Migration
**Implementation in `firebase.json`:**
```json
{
  "hosting": {
    "redirects": [
      // Add redirects from old forestryequipmentsales.com paths to new paths
      // Example:
      { "source": "/inventory", "destination": "/search", "type": 301 },
      { "source": "/equipment-for-sale", "destination": "/forestry-equipment-for-sale", "type": 301 }
    ]
  }
}
```

**DNS migration steps:**
1. Verify domain ownership in Firebase Hosting
2. Add `forestryequipmentsales.com` and `www.forestryequipmentsales.com` as custom domains
3. Update DNS records to point to Firebase Hosting
4. Firebase automatically provisions SSL certificates
5. Verify HTTPS works on both www and non-www
6. Set up www -> non-www redirect (or vice versa) as canonical

### 6.3 Pre-Launch Day Checklist (from previous audit, updated)
- [x] TypeScript errors resolved
- [x] Helmet security headers enabled
- [x] CORS locked to explicit origins
- [x] Test suite passing (300+ tests)
- [x] package.json identity correct
- [x] 404 page exists with noindex
- [x] DMCA page exists
- [x] Default noindex meta in index.html
- [x] All legal emails reference @forestryequipmentsales.com
- [x] Privacy policy comprehensive
- [x] Terms of service comprehensive
- [x] CSRF on maintained package
- [x] Consent banner logs to Firestore
- [x] Stripe Customer Portal configured
- [x] Subscription dates displayed
- [ ] **NEW: Auth added to /api/upload**
- [ ] **NEW: Password reset dead code removed**
- [ ] **NEW: DealerOS access requires active subscription**
- [ ] DNS verified: forestryequipmentsales.com + www resolve
- [ ] SSL certificate valid and auto-renewing
- [ ] Firebase Hosting production channel configured
- [ ] Stripe webhooks pointing to production URL
- [ ] SendGrid sender domain verified for forestryequipmentsales.com
- [ ] reCAPTCHA Enterprise site key matches production domain
- [ ] Google Search Console verified
- [ ] robots.txt allows crawling
- [ ] Sitemap.xml accessible and valid
- [ ] Error tracking (Sentry) receiving production events
- [ ] Rollback plan documented

---

## Phase 7: Refactoring (Weeks 3-6, Ongoing)

### 7.1 Priority Refactoring Targets

| File | Current Lines | Target | Strategy |
|------|-------------|--------|----------|
| `functions/index.js` | 12,166 | <500 per module | Split into `billing.js`, `email.js`, `scheduled.js`, `auth-triggers.js`, `dealer-feeds.js` |
| `AdminDashboard.tsx` | 4,482 | <500 per tab | Extract each tab to its own component file |
| `Profile.tsx` | 2,967 | <500 per section | Extract settings sections to separate components |
| `server.ts` | 2,748 | <500 per route group | Extract route handlers into `routes/billing.ts`, `routes/admin.ts`, etc. |
| `equipmentService.ts` | 2,567 | <500 per concern | Split: `listingService.ts`, `searchService.ts`, `sellerService.ts` |
| `categorySpecs.ts` | 73,000 | Lazy-loaded JSON | Convert to per-category JSON files, load on demand |

### 7.2 Remove AI-Generated Explainer Text
Audit all pages for text that reads more like AI documentation than human-facing copy. Replace with concise, action-oriented marketplace language.

**Known locations to check:**
- Home page hero/about sections
- Category landing page descriptions
- Manufacturer page descriptions
- "How it works" sections
- Feature explainer blocks
- FAQ answers

**Goal:** Every piece of text should read like it was written by a forestry equipment salesperson for a buyer/seller, not by an AI for another AI.

### 7.3 Search Architecture Migration (PostgreSQL)
1. Create server-side `/api/search` endpoint
2. Implement PostgreSQL full-text search with `tsvector`
3. Add PostGIS for geo-radius queries
4. Add cursor-based pagination
5. Return only card-view fields (not full listing payloads)
6. Deprecate client-side filtering in `equipmentService.ts`

---

## Phase 8: Production Build & Launch (Weeks 4-8)

### 8.1 Staging Validation
1. Deploy to staging (`timberequip-staging`)
2. Run full E2E test suite via Playwright
3. Verify all roles can perform all functions
4. Verify email delivery for all templates
5. Verify Stripe webhook processing
6. Run Lighthouse audit (target: 75+ mobile, 90+ desktop)
7. Verify sitemap and robots.txt

### 8.2 Production Deployment
1. Set `VITE_ALLOW_INDEXING=true` for production build
2. Deploy via `npm run deploy:production`
3. Run post-deploy smoke tests
4. Verify DNS resolution
5. Verify SSL certificates
6. Submit sitemap to Google Search Console
7. Monitor Sentry for errors

### 8.3 Domain Migration
1. Configure Firebase Hosting custom domain
2. Update DNS A/CNAME records
3. Add 301 redirects for any changed URL paths
4. Verify all old URLs redirect correctly
5. Monitor 404s in Google Search Console
6. Update Stripe webhook URLs to production domain
7. Update SendGrid sender domain verification
8. Update reCAPTCHA site key for production domain

---

## Questions for You (Caleb)

Before starting Phase 1, I need clarity on:

1. **301 Redirects:** Can you provide a list of current URLs on forestryequipmentsales.com that need redirects? Or is the current site structure identical to this new build?

2. **Firebase Login:** To verify live Firestore data, Stripe integration, and email delivery — should I prompt you to log in via terminal now? (`firebase login`)

3. **Admin Monthly Report Additions:** You want financing requests, trucking requests, and other site-wide stats in the admin monthly report. Should I add those now or in a later phase?

4. **AI Explainer Text:** Should I flag specific instances for your review, or do you want me to rewrite them to sound like natural marketplace copy?

5. **Dealer Feed Testing:** Do you have sample JSON/XML/CSV feed files to test with, or should I use the sample files in `public/samples/`?

6. **PostgreSQL Migration Timeline:** The hybrid approach is recommended. Do you want to start that in this sprint, or defer it to after the initial production launch?

---

## Effort Estimates

| Phase | Effort | Timeline |
|-------|--------|----------|
| Phase 1: Critical Fixes | 8-12 hours | Days 1-3 |
| Phase 2: Branding | 2-4 hours | Days 2-4 |
| Phase 3: SEO | 20-40 hours | Days 3-7 |
| Phase 4: Functionality Testing | 16-24 hours | Days 5-14 |
| Phase 5: Reports & Email | 8-16 hours | Days 10-14 |
| Phase 6: Infrastructure | 8-16 hours | Days 14-21 |
| Phase 7: Refactoring | 80-160 hours | Weeks 3-6 |
| Phase 8: Production Launch | 16-24 hours | Weeks 4-8 |
| **TOTAL** | **158-296 hours** | **4-8 weeks** |
