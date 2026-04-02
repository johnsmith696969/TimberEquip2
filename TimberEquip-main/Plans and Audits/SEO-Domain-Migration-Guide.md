# SEO Domain Migration Guide

## Moving from timberequip.com to www.forestryequipmentsales.com

**Date:** April 2, 2026
**Prepared for:** Forestry Equipment Sales stakeholders
**Status:** Pre-migration planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current SEO Architecture](#2-current-seo-architecture)
3. [Route Inventory — Every Public URL](#3-route-inventory)
4. [Domain Migration Plan](#4-domain-migration-plan)
5. [301 Redirect Map](#5-301-redirect-map)
6. [Code Changes Required](#6-code-changes-required)
7. [Firebase & DNS Configuration](#7-firebase--dns-configuration)
8. [Listing Migration Strategy](#8-listing-migration-strategy)
9. [Pre-Migration Checklist](#9-pre-migration-checklist)
10. [Post-Migration Verification](#10-post-migration-verification)
11. [Timeline & Risk Mitigation](#11-timeline--risk-mitigation)

---

## 1. Executive Summary

The Forestry Equipment Sales marketplace currently lives at `https://timberequip.com` on Firebase Hosting. The business brand, email, social media, and legacy domain are all `forestryequipmentsales.com`. This creates a brand/domain mismatch that weakens link equity, confuses Google, and fragments authority.

**The move:**
- **From:** `https://timberequip.com` (current live app)
- **To:** `https://www.forestryequipmentsales.com` (canonical production domain)

**Why `www` prefix:**
- Allows CNAME DNS records (required for Firebase custom domains on most registrars)
- Industry standard for commercial/marketplace sites
- Separates web traffic from bare-domain services (email, APIs)

**What stays the same:**
- All URL paths remain identical (`/equipment/...`, `/dealers/...`, `/categories/...`)
- All functionality, listings, and accounts remain unchanged
- Firebase project (`mobile-app-equipment-sales`) stays the same

**What changes:**
- Every canonical URL, Open Graph tag, sitemap reference, and robots.txt entry
- DNS records point `www.forestryequipmentsales.com` to Firebase Hosting
- `timberequip.com` becomes a 301 redirect shell to the new domain
- All old `forestryequipmentsales.com` legacy Apache site pages 301 to new routes

---

## 2. Current SEO Architecture

### 2.1 How Routes Are Rendered

The site uses a **hybrid rendering model**:

| Rendering Method | Routes | SEO Impact |
|---|---|---|
| **Server-Side (Cloud Functions)** | `/`, `/sitemap.xml`, `/forestry-equipment-for-sale`, `/logging-equipment-for-sale`, `/categories/**`, `/manufacturers/**`, `/states/**`, `/dealers/**` | Full HTML with meta tags, JSON-LD delivered on first response. Crawlable. |
| **Client-Side (React SPA)** | `/equipment/**`, `/search`, `/blog/**`, `/financing`, `/about`, `/contact`, etc. | SPA shell served first; React hydrates meta tags after JS loads. Depends on Googlebot JS rendering. |
| **Not Indexed (Protected)** | `/admin`, `/profile`, `/dealer-os`, `/sell`, `/bookmarks`, `/account` | Behind authentication. Not exposed to search engines. |

### 2.2 Key SEO Files and Their Roles

| File | Purpose |
|---|---|
| `src/components/Seo.tsx` | Sets `<title>`, `<meta description>`, canonical URLs, Open Graph, Twitter Cards, JSON-LD for every page. Base URL currently `https://timberequip.com`. |
| `src/utils/siteUrl.ts` | Exports `PUBLIC_SITE_URL` and `buildSiteUrl()` — the single source of truth for the canonical domain. Currently `https://timberequip.com`. |
| `src/utils/listingPath.ts` | Builds SEO-friendly listing slugs: `/equipment/{year}-{make}-{model}-{city}-{state}-{id}` |
| `src/utils/seoRoutes.ts` | Builds paths for categories, manufacturers, states, and dealers. |
| `src/utils/seoRouteQuality.ts` | Controls which routes get `index` vs `noindex` based on listing count thresholds. |
| `functions/public-pages.js` | Cloud Function that server-renders SEO pages with full HTML, meta tags, JSON-LD, and sitemap.xml. Has its own `DEFAULT_BASE_URL`. |
| `functions/email-templates/index.js` | Email templates with marketplace URL links. |
| `public/robots.txt` | Points crawlers to the sitemap. Currently references `timberequip.com`. |
| `index.html` | Static shell with fallback OG tags and canonical. Currently references `timberequip.com`. |
| `firebase.json` | Hosting config: rewrites SEO routes to Cloud Functions, sets cache headers. |
| `server.ts` | Express server: CORS origins, trusted hosts, canonical host redirect middleware. |

### 2.3 How Canonical URLs Are Built

```
buildSiteUrl('/equipment/2020-caterpillar-525d-duluth-mn-abc123')
→ 'https://timberequip.com/equipment/2020-caterpillar-525d-duluth-mn-abc123'
```

After migration:
```
→ 'https://www.forestryequipmentsales.com/equipment/2020-caterpillar-525d-duluth-mn-abc123'
```

### 2.4 How Listing URLs Are Structured

**Pattern:** `/equipment/{seo-slug}-{listingId}`

**Slug composition:**
1. Year (e.g., `2020`)
2. Manufacturer/Make (e.g., `caterpillar`)
3. Model (e.g., `525d`)
4. City (e.g., `duluth`)
5. State abbreviation (e.g., `mn`)
6. *Listing ID appended with `-` delimiter

**Examples:**
```
/equipment/2020-caterpillar-525d-duluth-mn-abc123def456
/equipment/2019-tigercat-1075b-eugene-or-xyz789
/equipment/john-deere-648l-grapple-skidder-portland-or-12345
```

### 2.5 How Dealer/Storefront URLs Are Structured

**Pattern:** `/dealers/{storefrontSlug}` or `/dealers/{uid}`

**Sub-routes:**
```
/dealers/acme-logging                    → Storefront page
/dealers/acme-logging/inventory          → Full inventory
/dealers/acme-logging/skidders           → Category-filtered inventory
```

### 2.6 SEO Landing Page Families

| Route Pattern | Example | Purpose |
|---|---|---|
| `/forestry-equipment-for-sale` | — | Primary market hub (canonical) |
| `/logging-equipment-for-sale` | — | Alternative market hub |
| `/categories/{slug}` | `/categories/skidders` | Category directory pages |
| `/manufacturers/{brand}` | `/manufacturers/caterpillar` | Manufacturer landing |
| `/manufacturers/{brand}/{cat}-for-sale` | `/manufacturers/caterpillar/skidders-for-sale` | Manufacturer + category |
| `/manufacturers/{brand}/models/{model}` | `/manufacturers/caterpillar/models/525d` | Model-specific page |
| `/states/{state}/forestry-equipment-for-sale` | `/states/minnesota/forestry-equipment-for-sale` | State market page |
| `/states/{state}/{cat}-for-sale` | `/states/minnesota/skidders-for-sale` | State + category |
| `/dealers` | — | Dealer directory |
| `/dealers/{slug}` | `/dealers/acme-logging` | Individual storefront |

### 2.7 Structured Data (JSON-LD)

The site emits schema.org structured data on key pages:

| Page Type | Schema Types |
|---|---|
| Homepage | `WebSite`, `Organization`, `SearchAction` |
| Listing Detail | `Product`, `Offer`, `BreadcrumbList` |
| Category/Market Pages | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| Dealer Storefront | `LocalBusiness` or `Organization`, `PostalAddress`, `GeoCoordinates`, `ItemList` |
| Blog Posts | `Article`, `BreadcrumbList` |

All structured data currently uses `https://timberequip.com` as the `@id` and URL base. This must change.

### 2.8 Route Quality Thresholds

Not all SEO pages get indexed. The system applies minimum listing count thresholds:

| Route Type | Minimum Listings | Below Threshold |
|---|---|---|
| Category | 2 | `noindex, follow` |
| Manufacturer | 2 | `noindex, follow` |
| Manufacturer Model | 2 | `noindex, follow` |
| State Market | 2 | `noindex, follow` |
| Dealer Storefront | 3 | `noindex, follow` |

This prevents thin pages from diluting site quality. Pages below threshold are still accessible but not indexed.

---

## 3. Route Inventory

### 3.1 Public Indexable Routes

```
/                                                    Homepage
/forestry-equipment-for-sale                         Primary market hub
/logging-equipment-for-sale                          Secondary market hub
/search                                              Marketplace search (noindex)
/equipment/{slug}                                    Listing detail page
/equipment/{slug}/{publicKey}                        Listing detail (alt format)
/listing/{id}                                        Legacy listing URL
/listing/{id}/{slug}                                 Legacy listing URL
/categories                                          Category directory
/categories/{categorySlug}                           Category listing page
/manufacturers/{manufacturerSlug}                    Manufacturer page
/manufacturers/{brand}/{category}-for-sale           Manufacturer + category
/manufacturers/{brand}/models/{model}                Model page
/manufacturers/{brand}/models/{model}/{cat}-for-sale Model + category
/states/{state}/forestry-equipment-for-sale           State forestry market
/states/{state}/logging-equipment-for-sale            State logging market
/states/{state}/{category}-for-sale                   State + category
/dealers                                              Dealer directory
/dealers/{id}                                         Dealer storefront
/dealers/{id}/inventory                               Dealer full inventory
/dealers/{id}/{categorySlug}                          Dealer category view
/blog                                                 Blog index
/blog/{id}                                            Blog post
/blog/{id}/{slug}                                     Blog post (with slug)
/financing                                            Financing page
/logistics                                            Logistics page
/about                                                About us
/about-us                                             About us (alias)
/faq                                                  FAQ
/our-team                                             Our team
/about/our-team                                       Our team (alias)
/contact                                              Contact
/ad-programs                                          Advertising programs
/auctions                                             Auctions page
/privacy                                              Privacy policy
/terms                                                Terms of service
/cookies                                              Cookie policy
/dmca                                                 DMCA policy
```

### 3.2 Protected Routes (Not Indexed)

```
/admin                                                Admin dashboard
/profile                                              User profile
/dealer-os                                            Dealer operating system
/sell                                                 List equipment form
/bookmarks                                            Saved listings
/account                                              Account workspace redirect
/login                                                Login page
/register                                             Registration page
/reset-password                                       Password reset
/unsubscribe                                          Email unsubscribe
/subscription-success                                 Payment success
```

### 3.3 Existing Redirects

| From | To | Type |
|---|---|---|
| `/seller/{id}` | `/dealers/{id}` | Client-side Navigate (should be 301) |

---

## 4. Domain Migration Plan

### 4.1 Target Domain Architecture

```
CANONICAL:     https://www.forestryequipmentsales.com
                ↑ All URLs, canonicals, sitemaps, structured data

301 REDIRECT:  https://forestryequipmentsales.com/*
                → https://www.forestryequipmentsales.com/*

301 REDIRECT:  https://timberequip.com/*
                → https://www.forestryequipmentsales.com/*

301 REDIRECT:  https://www.timberequip.com/*
                → https://www.forestryequipmentsales.com/*

301 REDIRECT:  http://* (all HTTP)
                → https://www.forestryequipmentsales.com/*
```

### 4.2 Migration Phases

#### Phase 1: Code Preparation (Before DNS Switch)

Update all hardcoded domain references in the codebase to `https://www.forestryequipmentsales.com`. Build and deploy to Firebase Hosting while still serving from `timberequip.com`. This is safe because:
- Firebase will still serve the app on the Firebase hosting URLs
- The canonical tags will point to the new domain before DNS is ready
- This is standard practice — Google recommends updating canonicals before the switch

#### Phase 2: DNS & Firebase Custom Domain

1. Add `www.forestryequipmentsales.com` as a custom domain in Firebase Hosting console
2. Firebase will provide DNS records (A records or CNAME)
3. Update DNS at registrar for `forestryequipmentsales.com`:
   - `www` CNAME → Firebase-provided target
   - Root domain A records → Firebase IPs (or redirect service)
4. Wait for SSL certificate provisioning (usually minutes, can take up to 24 hours)
5. Verify the site loads at `https://www.forestryequipmentsales.com`

#### Phase 3: Redirect Setup for Old Domains

1. Keep `timberequip.com` DNS active
2. Configure `timberequip.com` as a connected domain in Firebase that 301 redirects all paths to `www.forestryequipmentsales.com`
3. Alternatively, use Cloudflare page rules or the registrar's URL forwarding for `timberequip.com/*` → `https://www.forestryequipmentsales.com/*`
4. Configure bare `forestryequipmentsales.com` to 301 redirect to `www.forestryequipmentsales.com`

#### Phase 4: Search Console & Indexing

1. Add `https://www.forestryequipmentsales.com` as a new property in Google Search Console
2. Verify ownership via DNS TXT record or HTML file
3. Use the **Change of Address** tool in Google Search Console (on the old `timberequip.com` + `forestryequipmentsales.com` property) to notify Google
4. Submit the new sitemap: `https://www.forestryequipmentsales.com/sitemap.xml`
5. Request indexing of the homepage and key landing pages
6. Monitor for crawl errors in both old and new properties for 6+ months

#### Phase 5: Legacy Site Shutdown

1. Take down the old Apache site currently at `forestryequipmentsales.com`
2. Replace with the Firebase Hosting app or a redirect service
3. Map old Apache site pages to new site pages (see Section 5.2)

---

## 5. 301 Redirect Map

### 5.1 Domain-Level Redirects (All Paths)

Every URL path on the old domains should 301 to the same path on the new domain:

```
https://timberequip.com/equipment/2020-cat-525d-mn-abc123
  → 301 → https://www.forestryequipmentsales.com/equipment/2020-cat-525d-mn-abc123

https://timberequip.com/dealers/acme-logging
  → 301 → https://www.forestryequipmentsales.com/dealers/acme-logging

https://timberequip.com/categories/skidders
  → 301 → https://www.forestryequipmentsales.com/categories/skidders

https://timberequip.com/manufacturers/caterpillar
  → 301 → https://www.forestryequipmentsales.com/manufacturers/caterpillar
```

**Rule: Preserve the full path.** `https://timberequip.com{PATH}` → `https://www.forestryequipmentsales.com{PATH}`

### 5.2 Legacy forestryequipmentsales.com Site Pages

If the old Apache site at `forestryequipmentsales.com` has existing pages, they need to be mapped to the new site. Common legacy pages and their new destinations:

| Old URL (Legacy Apache Site) | New URL | Notes |
|---|---|---|
| `/` | `/` | Homepage |
| `/about` or `/about-us` | `/about` | About page |
| `/about/our-team` | `/our-team` | Team page |
| `/contact` or `/contact-us` | `/contact` | Contact |
| `/faq` | `/faq` | FAQ |
| `/privacy` or `/privacy-policy` | `/privacy` | Privacy policy |
| `/terms` or `/terms-of-service` | `/terms` | Terms |
| `/financing` | `/financing` | Financing |
| `/logistics` or `/shipping` | `/logistics` | Logistics |
| `/login` or `/sign-in` | `/login` | Login |
| `/register` or `/sign-up` | `/register` | Register |
| `/sell` or `/list-equipment` | `/sell` | List equipment |
| `/search` or `/inventory` | `/search` | Search/marketplace |
| `/blog` or `/news` | `/blog` | Blog |
| `/auctions` | `/auctions` | Auctions |
| `/dealers` or `/dealer-directory` | `/dealers` | Dealer directory |
| `/categories` or `/equipment-categories` | `/categories` | Categories |
| Any `/listing/{id}` | `/listing/{id}` | Legacy listing format (app handles it) |
| Any `/seller/{id}` | `/dealers/{id}` | App handles redirect |
| Any `/equipment/{slug}` | `/equipment/{slug}` | Listing detail |

### 5.3 Implementing Redirects in Server Code

The `CANONICAL_HOST` middleware in `server.ts` (lines 1264-1271) already supports domain-level 301s. Set the environment variable:

```bash
CANONICAL_HOST=www.forestryequipmentsales.com
```

This will automatically 301 any request from a non-canonical host to `https://www.forestryequipmentsales.com{path}`.

### 5.4 Firebase Hosting Redirects

Add redirect rules to `firebase.json` for legacy URL patterns:

```json
{
  "redirects": [
    { "source": "/about-us", "destination": "/about", "type": 301 },
    { "source": "/contact-us", "destination": "/contact", "type": 301 },
    { "source": "/privacy-policy", "destination": "/privacy", "type": 301 },
    { "source": "/terms-of-service", "destination": "/terms", "type": 301 },
    { "source": "/sign-in", "destination": "/login", "type": 301 },
    { "source": "/sign-up", "destination": "/register", "type": 301 },
    { "source": "/list-equipment", "destination": "/sell", "type": 301 },
    { "source": "/inventory", "destination": "/search", "type": 301 },
    { "source": "/dealer-directory", "destination": "/dealers", "type": 301 },
    { "source": "/equipment-categories", "destination": "/categories", "type": 301 },
    { "source": "/shipping", "destination": "/logistics", "type": 301 },
    { "source": "/news", "destination": "/blog", "type": 301 },
    { "source": "/news/:id", "destination": "/blog/:id", "type": 301 },
    { "source": "/seller/:id", "destination": "/dealers/:id", "type": 301 }
  ]
}
```

---

## 6. Code Changes Required

### 6.1 Domain Reference Updates

Every file with a hardcoded `timberequip.com` must be updated:

| File | Current Value | New Value |
|---|---|---|
| `src/utils/siteUrl.ts:1` | `'https://timberequip.com'` | `'https://www.forestryequipmentsales.com'` |
| `src/components/Seo.tsx:13` | `'https://timberequip.com'` | `'https://www.forestryequipmentsales.com'` |
| `functions/public-pages.js:11` | `'https://timberequip.com'` | `'https://www.forestryequipmentsales.com'` |
| `functions/email-templates/index.js:11` | `'https://timberequip.com'` | `'https://www.forestryequipmentsales.com'` |
| `public/robots.txt:4` | `Sitemap: https://timberequip.com/sitemap.xml` | `Sitemap: https://www.forestryequipmentsales.com/sitemap.xml` |
| `index.html:14` | `content="https://timberequip.com/"` | `content="https://www.forestryequipmentsales.com/"` |
| `index.html:15` | `content="https://timberequip.com/...Logo.png"` | `content="https://www.forestryequipmentsales.com/...Logo.png"` |
| `index.html:19` | `content="https://timberequip.com/...Logo.png"` | `content="https://www.forestryequipmentsales.com/...Logo.png"` |
| `index.html:20` | `href="https://timberequip.com/"` | `href="https://www.forestryequipmentsales.com/"` |
| `server.ts:1010` | `'https://timberequip.com'` (fallback) | `'https://www.forestryequipmentsales.com'` |

### 6.2 TRUSTED_HOSTS Update (server.ts)

Add `www.forestryequipmentsales.com` as the primary trusted host. Keep old hosts for redirect handling:

```typescript
const TRUSTED_HOSTS = new Set([
  'www.forestryequipmentsales.com',       // ← NEW PRIMARY
  'forestryequipmentsales.com',
  'timberequip.com',
  'www.timberequip.com',
  'mobile-app-equipment-sales.web.app',
  'mobile-app-equipment-sales.firebaseapp.com',
  'timberequip-staging.web.app',
  'localhost:3000',
  'localhost:5173',
]);
```

### 6.3 CORS Origins Update (server.ts)

```typescript
const ALLOWED_ORIGINS: string[] = [
  'https://www.forestryequipmentsales.com',   // ← NEW PRIMARY
  'https://forestryequipmentsales.com',
  'https://timberequip.com',                  // Keep for transition
  'https://www.timberequip.com',              // Keep for transition
  'https://mobile-app-equipment-sales.web.app',
  'https://mobile-app-equipment-sales.firebaseapp.com',
  'https://timberequip-staging.web.app',
];
```

### 6.4 Environment Variable

Set in production deployment:

```bash
CANONICAL_HOST=www.forestryequipmentsales.com
PUBLIC_APP_URL=https://www.forestryequipmentsales.com
EMAIL_MARKETPLACE_URL=https://www.forestryequipmentsales.com
VITE_ALLOW_INDEXING=true
```

---

## 7. Firebase & DNS Configuration

### 7.1 Firebase Hosting Custom Domain Setup

1. Go to Firebase Console → Hosting → Custom domains
2. Click "Add custom domain"
3. Enter `www.forestryequipmentsales.com`
4. Firebase will ask you to verify ownership via DNS TXT record
5. After verification, Firebase provides:
   - For `www`: A CNAME record pointing to Firebase
   - For bare domain: Two A records pointing to Firebase IPs
6. Add both `www.forestryequipmentsales.com` and `forestryequipmentsales.com`
7. Set `www.forestryequipmentsales.com` as the primary and configure the bare domain to redirect to `www`

### 7.2 DNS Records at Registrar

```
; Forestry Equipment Sales DNS Configuration
; -------------------------------------------

; WWW subdomain → Firebase Hosting
www    CNAME    mobile-app-equipment-sales.web.app.

; Bare domain → Firebase IPs (for redirect to www)
@      A        199.36.158.100
@      A        199.36.158.101

; Keep timberequip.com pointing to Firebase (for 301 redirects)
; timberequip.com DNS:
@      A        199.36.158.100
@      A        199.36.158.101
www    CNAME    mobile-app-equipment-sales.web.app.

; Email MX records (unchanged)
@      MX       ... (keep existing mail records)

; Google Search Console verification
@      TXT      "google-site-verification=..."
```

*Note: Firebase IP addresses are examples. Use the actual IPs provided by Firebase Console.*

### 7.3 SSL Certificates

Firebase Hosting automatically provisions and renews SSL certificates for custom domains. No manual certificate management needed. Allow up to 24 hours after DNS propagation for the certificate to be issued.

---

## 8. Listing Migration Strategy

### 8.1 Current Listing URL Formats

The app supports multiple listing URL formats for backward compatibility:

```
/equipment/{seo-slug}-{id}              ← Primary (new listings)
/equipment/{seo-slug}--{id}             ← Alternative delimiter
/equipment/{seo-slug}/{publicKey}       ← Two-segment format
/listing/{id}                            ← Legacy (ID only)
/listing/{id}/{slug}                     ← Legacy (ID with slug)
```

### 8.2 Listing Redirect Strategy

**All existing listing URLs keep working.** The domain changes, but paths stay the same:

```
https://timberequip.com/equipment/2020-caterpillar-525d-duluth-mn-abc123
  → 301 →
https://www.forestryequipmentsales.com/equipment/2020-caterpillar-525d-duluth-mn-abc123
```

**Legacy format redirects** (`/listing/{id}`) are handled client-side by the React app. The `ListingDetail` component resolves the listing by ID regardless of URL format.

### 8.3 Sitemap and Listing Discovery

The sitemap generator in `functions/public-pages.js` already:
- Includes all approved, paid, non-expired listings (up to 5,000)
- Includes `<lastmod>` timestamps
- Filters out QA/test records

After migration, the sitemap at `https://www.forestryequipmentsales.com/sitemap.xml` will automatically reflect all listings with the new domain.

### 8.4 Bulk Listing Upload

When uploading all listings:
1. Each listing goes through the standard creation flow (Firestore write)
2. The `public-seo-read-model.js` Cloud Function automatically syncs approved listings to the public SEO cache
3. Listings appear in the sitemap within the next sitemap generation cycle
4. Each listing gets a canonical URL at `https://www.forestryequipmentsales.com/equipment/{slug}`

**Recommended approach:**
- Upload listings in batches (100-200 at a time)
- Ensure each listing has: title, year, make, model, location (for optimal slug generation)
- Verify listings appear in `/sitemap.xml` after upload
- Use the bulk import tool in DealerOS for CSV/feed-based uploads

---

## 9. Pre-Migration Checklist

### Week Before Migration

- [ ] All code changes from Section 6 committed and tested
- [ ] Firebase custom domain for `www.forestryequipmentsales.com` verified and pending
- [ ] DNS TTL lowered to 300 seconds (5 minutes) at registrar for both domains
- [ ] Google Search Console property created for `https://www.forestryequipmentsales.com`
- [ ] Backup current Google Search Console data (crawl stats, links, queries)
- [ ] Notify Google via Search Console about planned migration (optional heads-up)
- [ ] Screenshot current keyword rankings as baseline
- [ ] Export current sitemap URLs
- [ ] All listings uploaded and approved
- [ ] Test the app locally with `PUBLIC_SITE_URL='https://www.forestryequipmentsales.com'`

### Day of Migration

- [ ] Deploy updated code to Firebase Hosting
- [ ] Deploy updated Cloud Functions (public-pages.js, email-templates)
- [ ] Update DNS records at registrar
- [ ] Wait for DNS propagation (check with `dig www.forestryequipmentsales.com`)
- [ ] Verify SSL certificate is active
- [ ] Set `CANONICAL_HOST=www.forestryequipmentsales.com` environment variable
- [ ] Verify the site loads at `https://www.forestryequipmentsales.com`
- [ ] Verify 301 redirects from `timberequip.com` to new domain
- [ ] Verify 301 redirects from bare `forestryequipmentsales.com` to `www`
- [ ] Submit new sitemap in Google Search Console
- [ ] Use Change of Address tool in Search Console (old property → new)
- [ ] Request indexing of homepage and top 10 pages

---

## 10. Post-Migration Verification

### Day 1 (Immediate)

- [ ] All pages load at new domain with correct content
- [ ] `https://www.forestryequipmentsales.com/robots.txt` returns correct content
- [ ] `https://www.forestryequipmentsales.com/sitemap.xml` returns valid XML with new domain URLs
- [ ] View source on any page: canonical tags point to `www.forestryequipmentsales.com`
- [ ] View source on any page: OG URLs point to `www.forestryequipmentsales.com`
- [ ] JSON-LD structured data uses `www.forestryequipmentsales.com` as `@id`
- [ ] Login/register/forms still work
- [ ] API calls succeed (CORS not blocking)
- [ ] Emails send with correct marketplace URLs

### Day 1-3 (Redirect Verification)

Test every redirect path with `curl -I`:

```bash
# Domain redirects
curl -I https://timberequip.com/
# Expected: 301 → https://www.forestryequipmentsales.com/

curl -I https://timberequip.com/equipment/2020-cat-525d-mn-abc
# Expected: 301 → https://www.forestryequipmentsales.com/equipment/2020-cat-525d-mn-abc

curl -I https://forestryequipmentsales.com/
# Expected: 301 → https://www.forestryequipmentsales.com/

curl -I https://forestryequipmentsales.com/about
# Expected: 301 → https://www.forestryequipmentsales.com/about

# Legacy path redirects
curl -I https://www.forestryequipmentsales.com/seller/abc123
# Expected: 301 → /dealers/abc123

curl -I https://www.forestryequipmentsales.com/contact-us
# Expected: 301 → /contact
```

### Week 1

- [ ] Google Search Console shows new domain being crawled
- [ ] No significant spike in 404 errors in Search Console
- [ ] Check "URL Inspection" for key pages — should show new canonical
- [ ] Monitor organic traffic in analytics (expect temporary dip, should recover within 2-4 weeks)

### Month 1-3

- [ ] Old domain properties in Search Console show declining impressions (expected)
- [ ] New domain property shows growing impressions and clicks
- [ ] All previously-indexed URLs from timberequip.com now redirect properly
- [ ] Keyword rankings stabilized or improved
- [ ] Remove old domain from Search Console after 6 months (keep redirects permanently)

---

## 11. Timeline & Risk Mitigation

### Recommended Timeline

| Day | Action |
|---|---|
| Day -7 | Lower DNS TTL to 300s. Upload all listings. |
| Day -3 | Deploy code changes (new domain references). Test locally. |
| Day -1 | Final pre-migration checklist review. |
| Day 0 | DNS switch. Firebase custom domain activation. Set CANONICAL_HOST. Submit sitemap. Change of Address in Search Console. |
| Day +1 | Verify redirects, canonical tags, structured data, API calls. |
| Day +7 | Monitor Search Console for crawl errors. Fix any 404s. |
| Day +30 | Review ranking recovery. Ensure no redirect chains. |
| Day +90 | Confirm full ranking recovery. Document lessons learned. |

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| **Temporary ranking drop** | Normal for domain migrations. Usually recovers in 2-6 weeks. Keep old domain redirecting permanently. |
| **Broken redirects** | Test exhaustively with `curl -I` before and after. Monitor Search Console crawl errors daily. |
| **SSL certificate delay** | Lower DNS TTL in advance. Firebase usually provisions in minutes, but allow 24 hours buffer. |
| **Lost link equity** | Use 301 (permanent) redirects, never 302. Keep `timberequip.com` redirects active for at least 1 year (ideally permanently). |
| **Third-party backlinks breaking** | Domain-level 301 catches everything. No action needed if redirects are path-preserving. |
| **Email deliverability** | Email domain (`info@forestryequipmentsales.com`) doesn't change. SPF/DKIM/DMARC records stay the same. |
| **API calls failing** | CORS origins updated in advance. Both old and new domains allowed during transition period. |
| **Cache serving stale content** | Firebase Hosting uses `no-cache` on index.html. Assets use content-hashed filenames. Risk is minimal. |
| **Google Analytics gap** | Update GA property to accept new domain. Add new domain to measurement stream before migration. |

### What NOT to Do

- **Do NOT** use 302 (temporary) redirects — use 301 (permanent) only
- **Do NOT** remove the old `timberequip.com` domain from DNS — keep it redirecting permanently
- **Do NOT** change URL paths at the same time as the domain — change one thing at a time
- **Do NOT** delete the old Search Console property — keep it for monitoring
- **Do NOT** submit a disavow file for the old domain — the Change of Address tool handles authority transfer

---

## Appendix A: Complete File Change List

```
Files requiring domain update (timberequip.com → www.forestryequipmentsales.com):

src/utils/siteUrl.ts                    Line 1: PUBLIC_SITE_URL
src/components/Seo.tsx                  Line 13: BASE_URL
functions/public-pages.js               Line 11: DEFAULT_BASE_URL
functions/email-templates/index.js      Line 11: DEFAULT_MARKETPLACE_URL
public/robots.txt                       Line 4: Sitemap URL
index.html                              Lines 14, 15, 19, 20: OG tags + canonical
server.ts                               Line 1010: fallback URL in getRequestBaseUrl
server.ts                               Lines 985-994: TRUSTED_HOSTS (add new primary)
server.ts                               Lines 1313-1323: ALLOWED_ORIGINS (add new primary)
```

## Appendix B: Google Search Console Change of Address Steps

1. Go to https://search.google.com/search-console
2. Select the `https://timberequip.com` property
3. Go to Settings → Change of address
4. Select `https://www.forestryequipmentsales.com` as the new site
5. Google verifies:
   - 301 redirects are in place from old → new
   - You own both properties
   - The new site is serving content
6. Confirm the change
7. Google begins transferring signals (rankings, links) to the new domain

## Appendix C: robots.txt (New)

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile
Disallow: /dealer-os
Disallow: /account
Disallow: /subscription-success

Sitemap: https://www.forestryequipmentsales.com/sitemap.xml
```

## Appendix D: Environment Variables (Production)

```bash
# Domain & SEO
CANONICAL_HOST=www.forestryequipmentsales.com
PUBLIC_APP_URL=https://www.forestryequipmentsales.com
EMAIL_MARKETPLACE_URL=https://www.forestryequipmentsales.com
VITE_ALLOW_INDEXING=true
VITE_SITE_URL=https://www.forestryequipmentsales.com

# Firebase (unchanged)
VITE_FIREBASE_PROJECT_ID=mobile-app-equipment-sales
```
