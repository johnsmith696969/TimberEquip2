# Forestry Equipment Sales — SEO Implementation Recommendations

**Reference Audit:** SEO-Setup.md (Score: 9.2/10)
**Target Score:** 9.5+/10
**Date:** April 14, 2026 (Updated — Tier 3.5 Sprint)
**Previous Date:** April 8, 2026

---

## Priority 1: High-Impact SEO Improvements

### 1.1 FAQ Page JSON-LD Schema -- COMPLETED

**Status:** COMPLETED
**Discovery:** FAQPage JSON-LD already implemented in Faq.tsx with 133 Q&A items.
**File:** src/pages/Faq.tsx

| Task | Status |
|------|--------|
| Extract all FAQ Q&A pairs into structured data format | Done (133 items) |
| Add `FAQPage` JSON-LD schema to Faq.tsx via Seo component | Done |
| Validate with Google Rich Results Test | Done |

### 1.2 LocalBusiness Schema on Contact Page -- COMPLETED

**Status:** COMPLETED
**Discovery:** Organization + ContactPage schema already implemented in Contact.tsx.
**File:** src/pages/Contact.tsx

| Task | Status |
|------|--------|
| Add `LocalBusiness` / Organization JSON-LD with name, address, phone, email, hours | Done |
| Add `ContactPoint` with customer service info | Done |
| Validate with Rich Results Test | Done |

### 1.3 Unique Content per Landing Page -- COMPLETED

**Status:** COMPLETED
**Discovery:** manufacturerContent.ts has 30+ manufacturers with unique descriptions; subcategoryContent.ts has 14 subcategories with buying tips and unique content.

| Task | Status |
|------|--------|
| Write unique descriptions for top manufacturers | Done (30+ manufacturers in manufacturerContent.ts) |
| Write unique descriptions for top equipment categories | Done (14 subcategories in subcategoryContent.ts) |
| Integrate content into SeoLandingPages.tsx dynamically | Done |

### 1.4 Internal Linking Strategy -- COMPLETED

**Status:** COMPLETED
**Discovery:** Related Equipment sections already implemented in ListingDetail.tsx, including Market Match and Similar Equipment sections.
**File:** src/pages/ListingDetail.tsx

| Task | Status |
|------|--------|
| Add "Related Equipment" section to ListingDetail.tsx (Market Match + Similar Equipment) | Done |
| Internal cross-linking between listing pages | Done |

---

## Priority 2: Medium-Impact Improvements

### 2.1 Image Alt Text Enforcement -- COMPLETED

**Status:** COMPLETED
**Discovery:** All listing images already use descriptive alt text derived from listing data: `listing.title` or `"{Year} {Make} {Model}"`.

| Task | Status |
|------|--------|
| Auto-generate alt text from listing data: "{Year} {Make} {Model}" | Done |
| Listing images use descriptive alt text via listing.title | Done |

### 2.2 Schema Validation in CI

**Status:** PENDING
**Current:** No automated schema validation
**Impact:** MEDIUM — prevents structured data regressions

| Task | Effort |
|------|--------|
| Add JSON-LD extraction test for each page type | 4 hours |
| Validate extracted JSON-LD against Schema.org specs | 2 hours |
| Add to CI pipeline as automated check | 1 hour |
| **Total** | **7 hours** |

### 2.3 Lighthouse CI Integration

**Status:** PENDING
**Current:** No automated performance monitoring in CI
**Impact:** MEDIUM — prevents Core Web Vitals regressions

| Task | Effort |
|------|--------|
| Install and configure @lhci/cli | 1 hour |
| Create lighthouserc.js config with performance budgets | 2 hours |
| Add Lighthouse CI step to GitHub Actions workflow | 2 hours |
| Set thresholds: LCP < 2.5s, FID < 100ms, CLS < 0.1 | 1 hour |
| **Total** | **6 hours** |

### 2.4 Video Schema Support

**Status:** PENDING
**Current:** No video content or VideoObject schema
**Impact:** MEDIUM — enables video rich results when videos are added

| Task | Effort |
|------|--------|
| Create VideoObject JSON-LD generator utility | 2 hours |
| Integrate with listing detail when video is present | 2 hours |
| Add video thumbnail extraction for OG image fallback | 2 hours |
| **Total** | **6 hours** |

---

## Priority 3: Technical SEO Optimizations

### 3.1 Server-Side Rendering / Pre-Rendering

**Status:** PENDING
**Current:** SPA with client-side meta injection via react-helmet
**Impact:** HIGH for SEO, but HIGH effort

| Option | Effort | SEO Impact |
|--------|--------|-----------|
| **Option A: Prerender.io or similar service** | 8 hours | HIGH |
| **Option B: SSR with Next.js migration** | 200+ hours | HIGHEST |
| **Option C: Static site generation for landing pages** | 40 hours | HIGH |

**Recommended:** Option A (Prerender.io) for immediate impact

| Task | Effort |
|------|--------|
| Set up Prerender.io account | 1 hour |
| Add prerender middleware to Express server | 2 hours |
| Configure cache TTL and recrawl schedule | 1 hour |
| Verify pre-rendered pages with Google Search Console | 2 hours |
| Monitor crawl budget and indexing | 2 hours |
| **Total** | **8 hours** |

### 3.2 Sitemap Improvements

**Status:** PENDING
**Current:** Single sitemap.xml with up to 5,000 listings
**Target:** Sitemap index with category-specific sitemaps

| Task | Effort |
|------|--------|
| Create sitemap index file (`/sitemap-index.xml`) | 2 hours |
| Split into sub-sitemaps: listings, categories, manufacturers, states, blog | 4 hours |
| Add `<image:image>` tags for listing images | 3 hours |
| Add `<changefreq>` and `<priority>` hints | 1 hour |
| **Total** | **10 hours** |

### 3.3 Breadcrumb Consistency Audit

**Status:** PENDING
**Current:** Breadcrumbs auto-generated but not cross-verified
**Target:** Verified breadcrumb trails matching URL structure

| Task | Effort |
|------|--------|
| Audit all dynamic route breadcrumbs against URL patterns | 2 hours |
| Fix any mismatches between visual breadcrumbs and BreadcrumbList schema | 1 hour |
| Add breadcrumb unit tests for each route pattern | 2 hours |
| **Total** | **5 hours** |

---

## SEO Content Calendar

### Monthly Content Targets

| Content Type | Frequency | SEO Impact | Effort/Piece |
|-------------|-----------|-----------|-------------|
| Blog posts (industry news, market reports) | 4/month | HIGH | 2 hours |
| Manufacturer buying guides | 2/month | HIGH | 3 hours |
| Equipment comparison articles | 1/month | MEDIUM | 2 hours |
| State market reports | 1/month | HIGH | 2 hours |
| Video walkthroughs | 2/month | MEDIUM | External |

---

## Page-Specific SEO Enhancements

| Page | Current Score | Enhancement | New Score |
|------|-------------|-------------|-----------|
| Home | 9/10 | Add HowTo schema for "How to Buy" section | 9.5/10 |
| FAQ | 9.5/10 | FAQPage schema with 133 Q&A items (COMPLETED) | 9.5/10 |
| Contact | 9/10 | Organization + ContactPage schema (COMPLETED) | 9/10 |
| Blog Post | 9/10 | Add Article schema (already BlogPosting) | 9/10 |
| Listing Detail | 9.5/10 | Market Match + Similar Equipment links (COMPLETED) | 9.5/10 |
| Category Landing | 9/10 | Unique subcategory content with buying tips (COMPLETED) | 9/10 |
| Manufacturer Landing | 9/10 | 30+ manufacturer descriptions (COMPLETED) | 9/10 |
| State Landing | 8/10 | Add state market data content | 9/10 |
| Dealer Profile | 8/10 | Add AggregateRating (when reviews implemented) | 9/10 |
| Help Center | N/A (new) | 24 articles across 7 categories — added Apr 14 | 8.5/10 |
| Help Article | N/A (new) | Individual articles at /help/:slug — added Apr 14 | 8.5/10 |
| Status Page | N/A (new) | /status with live component health — added Apr 14 | 7/10 |

---

## Completed vs Remaining Work Summary

### Enterprise 3.5 Hardening Sprint SEO Improvements (Apr 8)

| Item | Status |
|------|--------|
| SeoLandingPages lazy imports consolidated (single module import) | Done |
| Alt text fixes for listing images (accessibility + SEO) | Done |
| CSP header deployed via Firebase Hosting (protects OG/meta integrity) | Done |

### Tier 3.5 Sprint SEO-Relevant Improvements (Apr 14)

| Item | Status |
|------|--------|
| Help center at /help — 24 articles, 7 categories (new indexable content) | Done |
| Individual help article pages at /help/:slug (crawlable deep links) | Done |
| Status page at /status (publicly accessible) | Done |
| "Sell Equipment" nav label (clearer user intent matching) | Done |
| API versioning /api/v1 (cleaner URL structure for any public API links) | Done |

### Completed (5 items + 3 from hardening sprint)

| Item | Discovery |
|------|-----------|
| 1.1 FAQ Page JSON-LD Schema | Already existed: 133 Q&A items in FAQPage JSON-LD in Faq.tsx |
| 1.2 LocalBusiness Schema on Contact Page | Already existed: Organization + ContactPage schema in Contact.tsx |
| 1.3 Unique Content per Landing Page | Already existed: 30+ manufacturers, 14 subcategories with buying tips |
| 1.4 Internal Linking Strategy | Already existed: Market Match + Similar Equipment in ListingDetail.tsx |
| 2.1 Image Alt Text Enforcement | Already existed: All listing images use listing.title / "{Year} {Make} {Model}" |

### Remaining Future Work (6 items)

| Item | Effort | Priority |
|------|--------|----------|
| 2.2 Schema Validation in CI | 7 hours | Medium |
| 2.3 Lighthouse CI Integration | 6 hours | Medium |
| 2.4 Video Schema Support | 6 hours | Medium |
| 3.1 SSR / Pre-Rendering (Prerender.io) | 8 hours | High |
| 3.2 Sitemap Improvements | 10 hours | Medium |
| 3.3 Breadcrumb Consistency Audit | 5 hours | Medium |
| **Total remaining** | **42 hours** | |

---

## Implementation Timeline (Remaining Work)

| Phase | Items | Duration | Score Impact |
|-------|-------|----------|-------------|
| Week 1 | Prerender.io setup | 1 week | +0.1 |
| Week 2 | Schema validation in CI + Lighthouse CI | 1 week | +0.1 |
| Week 3 | Sitemap improvements + Breadcrumb audit | 1 week | +0.05 |
| Ongoing | Video schema (when video content added) | As needed | +0.05 |
| **Total** | | **~3 weeks** | **9.2 -> 9.5+** |
