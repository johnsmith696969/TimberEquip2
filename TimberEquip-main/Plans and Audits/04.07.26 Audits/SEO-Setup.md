# Forestry Equipment Sales — Comprehensive SEO Setup Audit

**Audit Date:** April 8, 2026 (Updated)
**Previous Audit:** April 7, 2026
**Platform:** Forestry Equipment Sales (https://timberequip.com)
**Prepared By:** FES SEO Audit Team

---

## Executive Summary

The Forestry Equipment Sales platform implements an enterprise-grade SEO architecture with a centralized meta tag system, comprehensive structured data (including FAQPage, LocalBusiness, Product, BlogPosting, and Organization schemas), dynamic landing page generation, automated sitemap management, and deep internal linking. The implementation supports 40+ unique page types with fully dynamic content optimization. Rich content layers — including 30+ manufacturer buying guides, 14 subcategory buying tips, and "Related Equipment" cross-linking on every listing — provide substantial content depth beyond template-level pages. Since the April 7 audit, image alt text enforcement has been expanded to all remaining images (admin thumbnails, seller logos), the SeoLandingPages lazy import has been consolidated for better tree-shaking, and new pages have been added (Vulnerability Disclosure, Changelog). The CI pipeline includes npm audit security scanning, and 523+ tests pass across 49 test files with production dependencies pinned.

**Overall SEO Score: 9.2 / 10**

---

## 1. SEO Component Architecture

### Centralized Seo.tsx Component (src/components/Seo.tsx)

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| title | string | "Forestry Equipment Sales" | Document title |
| description | string | Platform description | Meta description |
| canonicalPath | string | Current path | Canonical URL |
| robots | string | "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" | Robots directive |
| ogType | "website" \| "article" \| "product" | "website" | Open Graph type |
| imagePath | string | Brand logo PNG | OG image |
| preloadImage | string | null | LCP hero preload |
| jsonLd | object | null | JSON-LD structured data |

### Meta Tags Generated Per Page

| Tag | Source | Example |
|-----|--------|---------|
| `<title>` | `document.title` | "Logging Equipment For Sale \| Forestry Equipment Sales" |
| `meta[name="description"]` | Seo component | "Buy and Sell New & Used Forestry/Logging Equipment..." |
| `meta[name="robots"]` | Seo component | "index, follow, max-image-preview:large" |
| `meta[name="googlebot"]` | Seo component | Same as robots |
| `og:title` | Seo component | Page title |
| `og:description` | Seo component | Page description |
| `og:type` | Seo component | "website" / "article" / "product" |
| `og:url` | Seo component | Canonical URL |
| `og:site_name` | Seo component | "Forestry Equipment Sales" |
| `og:image` | Seo component | Brand logo or listing image |
| `og:image:width` | Seo component | "1200" |
| `og:image:height` | Seo component | "630" |
| `twitter:card` | Seo component | "summary_large_image" |
| `twitter:title` | Seo component | Page title |
| `twitter:description` | Seo component | Page description |
| `twitter:image` | Seo component | Same as og:image |
| `link[rel="canonical"]` | Seo component | Absolute canonical URL |

---

## 2. Complete Page Inventory with SEO Data

### Public Static Pages

| Page | Route | Title | Meta Description | OG Type | Canonical |
|------|-------|-------|-----------------|---------|-----------|
| Home | `/` | Logging Equipment For Sale \| Forestry Equipment Sales | Buy and Sell New & Used Forestry/Logging Equipment. Browse in-stock skidders, feller bunchers, harvesters, forwarders, and more. | website | `/` |
| Search | `/search` | Dynamic (based on active filters) | Dynamic (filter-based description) | website | `/search` |
| Categories | `/categories` | Equipment Categories \| Browse Marketplace Equipment Families | Browse Forestry Equipment Sales inventory by major equipment family — skidders, harvesters, forwarders, land clearing, and more. | website | `/categories` |
| Manufacturers | `/manufacturers` | Equipment Manufacturers \| Forestry Equipment Sales | Browse equipment manufacturers with direct paths into live marketplace inventory. | website | `/manufacturers` |
| States | `/states` | Equipment Markets By State \| Forestry Equipment Sales | Dynamic region-based content | website | `/states` |
| Dealers | `/dealers` | Find Forestry Equipment Dealers & Manufacturers | Search forestry equipment dealers and manufacturers by name, state, or specialty. | website | `/dealers` |
| About | `/about` | About Us \| Forestry Equipment Sales | Learn why Forestry Equipment Sales was built, who we serve, and our marketplace mission. | website | `/about` |
| Our Team | `/our-team` | Our Team \| Forestry Equipment Sales | Meet the team behind Forestry Equipment Sales. | website | `/our-team` |
| Contact | `/contact` | Contact Forestry Equipment Sales \| Sales, Support, Dealer Help | Contact Forestry Equipment Sales for buying help, seller support, dealer inquiries. | website | `/contact` |
| FAQ | `/faq` | Logging Equipment Marketplace FAQ | Find answers about buying, selling, financing, shipping forestry equipment. | website | `/faq` |
| Financing | `/financing` | Equipment Financing \| Apply for Credit | Apply for flexible forestry equipment financing with fast approvals. | website | `/financing` |
| Calculator | `/calculator` | Equipment Financing Calculator | Estimate monthly payments on forestry and logging equipment. | website | `/calculator` |
| Logistics | `/logistics` | Global Logistics \| Trucking Request Form | Request trucking and heavy-haul coordination for equipment. | website | `/logistics` |
| Blog | `/blog` | Equipment News \| Market Reports & Industry Updates | Stay up to date with forestry equipment market reports and industry news. | website | `/blog` |
| Auctions | `/auctions` | Equipment Auctions \| Forestry Equipment Sales | Browse active and upcoming forestry equipment auctions. | website | `/auctions` |
| Changelog | `/changelog` | Changelog \| Forestry Equipment Sales | Product updates and platform improvements. | website | `/changelog` |
| Terms | `/terms` | Terms of Service \| Forestry Equipment Sales | Dynamic | website | `/terms` |
| Privacy | `/privacy` | Privacy Policy \| Forestry Equipment Sales | Learn how Forestry Equipment Sales collects, uses, and protects your information. | website | `/privacy` |
| Cookies | `/cookies` | Cookie Policy \| Forestry Equipment Sales | Learn how Forestry Equipment Sales uses cookies. | website | `/cookies` |
| DMCA | `/dmca` | DMCA Policy \| Forestry Equipment Sales | Digital Millennium Copyright Act (DMCA) policy. | website | `/dmca` |

### Dynamic Content Pages

| Page | Route Pattern | Title Template | OG Type | JSON-LD |
|------|--------------|----------------|---------|---------|
| Blog Post | `/blog/:id/:slug` | {seoTitle} \| Forestry Equipment Sales | article | BlogPosting + BreadcrumbList |
| Listing Detail | `/equipment/:slug` | {Year} {Make} {Model} for sale in {Location} \| FES | product | Product + BreadcrumbList |
| Auction Detail | `/auctions/:slug` | {title} \| Auction Catalog | website | CollectionPage |
| Auction Lot | `/auctions/:slug/lots/:number` | Lot {N} \| {Year} {Make} {Model} | product | Product |
| Dealer Profile | `/dealers/:id` | {Dealer Name} \| Forestry Equipment Dealer | website | LocalBusiness |

### SEO Landing Pages (Dynamic Generation)

| Route Pattern | Title Template | Description Template | Listings |
|--------------|----------------|---------------------|----------|
| `/categories/:categorySlug` | {Category} for Sale \| FES | Browse {count} {category} listings... | Filtered |
| `/manufacturers/:mfrSlug` | {Manufacturer} Equipment for Sale \| FES | Shop {manufacturer} forestry equipment... | Filtered |
| `/manufacturers/:mfrSlug/:catSlug` | {Manufacturer} {Category} for Sale | Browse {manufacturer} {category} inventory | Filtered |
| `/manufacturers/:mfrSlug/models/:modelSlug` | {Model} for Sale \| FES | Find {manufacturer} {model} listings | Filtered |
| `/manufacturers/:mfrSlug/models/:modelSlug/:catSlug` | {Model} {Category} for Sale | {Model} {category} equipment | Filtered |
| `/states/:stateSlug/forestry-equipment-for-sale` | Forestry Equipment in {State} | Browse equipment for sale in {state} | Filtered |
| `/states/:stateSlug/logging-equipment-for-sale` | Logging Equipment in {State} | Browse logging equipment in {state} | Filtered |
| `/states/:stateSlug/:catSlug` | {Category} in {State} for Sale | Find {category} in {state} | Filtered |

---

## 3. Structured Data (JSON-LD) Inventory

### Home Page Schema Graph

| Schema Type | Properties | Location |
|------------|------------|----------|
| Organization | name, url, logo, email, description | Home.tsx:340-355 |
| WebSite | name, url, inLanguage | Home.tsx:356-360 |
| CollectionPage | name, description, url | Home.tsx:361-370 |
| ItemList | name, itemListElement (marketplace routes) | Home.tsx:371-385 |

### Listing Detail Schema

| Schema Type | Properties |
|------------|------------|
| Product | name, description, image, brand, category, sku |
| Offer | price, priceCurrency, availability, itemCondition |
| BreadcrumbList | position-indexed items from root to listing |

### Blog Post Schema

| Schema Type | Properties |
|------------|------------|
| BlogPosting | headline, description, image, datePublished, dateModified, author |
| Organization | name (as author) |
| BreadcrumbList | Home → Blog → Post |

### Collection / Landing Page Schema

| Schema Type | Properties |
|------------|------------|
| CollectionPage | name, description, url |
| BreadcrumbList | Dynamic based on route depth |
| ItemList | Up to 24 Product items with Offer data |

### FAQ Page Schema

| Schema Type | Properties | Location |
|------------|------------|----------|
| FAQPage | mainEntity (133 Q&A items as Question + acceptedAnswer) | Faq.tsx:149-175 |

### Contact Page Schema

| Schema Type | Properties | Location |
|------------|------------|----------|
| ContactPage | Structured contact point data | Contact.tsx:85-111 |
| LocalBusiness / Organization | name, url, email, address, telephone, contactPoint | Contact.tsx:85-111 |

---

## 4. Technical SEO Infrastructure

### Sitemap Generation

| Component | Details |
|-----------|---------|
| URL | /sitemap.xml |
| Generator | Cloud Function (public-pages.js:1500-1564) |
| Max Entries | 5,000 listings |
| Frequency | Dynamic (generated per request) |
| Fallback | Minimal sitemap (7 core pages) on Firestore quota errors |
| lastmod | Based on listing updatedAtIso / createdAtIso |
| Routing | Firebase rewrite: `/sitemap.xml` → `publicPages` function |

### robots.txt

```
User-agent: *
Allow: /

Sitemap: https://timberequip.com/sitemap.xml
```

| Feature | Status |
|---------|--------|
| Allow all crawlers | Yes |
| Sitemap reference | Yes |
| Environment toggle | VITE_ALLOW_INDEXING controls index/noindex |
| Staging noindex | Automatic when ALLOW_INDEXING=false |

### Canonical URL Strategy

| Pattern | Example |
|---------|---------|
| Base URL | `https://timberequip.com` |
| Static pages | `https://timberequip.com/about` |
| Listing detail | `https://timberequip.com/equipment/{slug}` |
| Category landing | `https://timberequip.com/categories/{slug}` |
| Manufacturer landing | `https://timberequip.com/manufacturers/{slug}` |
| State landing | `https://timberequip.com/states/{state}/forestry-equipment-for-sale` |
| Blog post | `https://timberequip.com/blog/{id}/{slug}` |

### SEO Route Utilities (src/utils/seoRoutes.ts)

| Function | Purpose |
|----------|---------|
| `buildManufacturerPath(mfr)` | URL-safe manufacturer landing path |
| `buildStateMarketPath(state, key)` | State market page URL |
| `buildStateCategoryPath(state, cat)` | State + category URL |
| `buildDealerPath(seller)` | Dealer profile URL |
| `normalizeSeoSlug(value)` | URL-safe slug generation |
| `getListingManufacturer(listing)` | Extract manufacturer from listing |
| `getListingStateName(listing)` | Extract state from listing |

---

## 5. Performance SEO

### Core Web Vitals Optimizations

| Metric | Optimization | File |
|--------|-------------|------|
| LCP | Hero image preload via `<link rel="preload">` | index.html:33 |
| LCP | `fetchPriority="high"` on hero images | Home.tsx:543 |
| LCP | `loading="eager"` for above-fold images | Home.tsx:536 |
| CLS | Image dimensions specified | Various components |
| CLS | AnimatePresence for modal/carousel | Layout.tsx |
| FID | React 18 automatic batching | Framework |
| FID | Debounced search input | Search.tsx |
| INP | Code-splitting via React.lazy routes | App.tsx |

### Image Optimization

| Feature | Details |
|---------|---------|
| Format | WebP for hero images, AVIF/WebP/JPEG variants for listings |
| Processing | Cloud Function auto-generates variants on upload |
| Lazy loading | `loading="lazy"` for below-fold images |
| Eager loading | `loading="eager"` + `fetchPriority="high"` for hero |
| Alt text | Enforced on all listing images using descriptive patterns: `listing.title`, `"{Year} {Make} {Model}"`, etc. Decorative images use `aria-hidden="true"` |
| Preconnect | Firebase Storage, Google Fonts |
| DNS prefetch | Stripe JS |

### Asset Caching

| Asset Type | Cache Strategy |
|-----------|---------------|
| HTML (index.html, /) | no-cache, no-store, must-revalidate |
| JS/CSS (hashed) | Default CDN caching (immutable) |
| Images (public/) | Versioned via `?v=20260407a` parameter |
| Sitemap.xml | Generated per request |

---

## 6. Content Depth & Internal Linking

### Manufacturer Buying Guides (src/constants/manufacturerContent.ts)

| Feature | Details |
|---------|---------|
| Coverage | 30+ manufacturers with unique editorial content |
| Content per manufacturer | Description, founding date, headquarters, official website URL |
| SEO value | Unique long-form content on every manufacturer landing page |

### Subcategory Content (src/constants/subcategoryContent.ts)

| Feature | Details |
|---------|---------|
| Coverage | 14 subcategories with unique content |
| Content per subcategory | Overview paragraphs, buying tips, use-case guidance |
| SEO value | Unique content on category landing pages beyond template fill |

### Internal Linking Network

| Link Type | Implementation | Location |
|-----------|---------------|----------|
| Breadcrumbs | Schema markup + visual breadcrumb trail | All dynamic pages |
| Category links | Grid links from Categories hub to each category | Categories.tsx, Home.tsx |
| Manufacturer links | Manufacturer directory with links into filtered inventory | Manufacturers.tsx |
| State links | State market pages linking to state + category combinations | States.tsx |
| Related Equipment — Market Match | "Market Match" section showing price-comparable listings | ListingDetail.tsx:1617-1700 |
| Related Equipment — Similar Equipment | "Similar Equipment" section by same manufacturer/category | ListingDetail.tsx:1700-1758 |
| Cross-entity links | Listings link to manufacturer page, category page, state page | ListingDetail.tsx |

---

## 7. Quality Assurance & CI

| Feature | Details |
|---------|---------|
| Test suite | 523 tests passing across 46 test files |
| npm audit | Security scanning integrated in CI pipeline |
| Dependency management | Production dependencies pinned |
| Changelog | Public changelog page at `/changelog` with product updates |

---

## 8. SEO Strengths

| Strength | Score | Details |
|----------|-------|---------|
| Centralized meta tag management | 9/10 | Single Seo.tsx component manages all 40+ pages |
| Dynamic structured data | 9.5/10 | Product, Organization, BlogPosting, BreadcrumbList, FAQPage, LocalBusiness, ContactPage schemas |
| Auto-generated landing pages | 9/10 | Category + manufacturer + state + model combinations |
| Dynamic sitemap | 9/10 | Auto-includes up to 5,000 listings with lastmod |
| Canonical URL strategy | 9/10 | Per-page canonical with absolute URLs |
| Breadcrumb navigation | 9/10 | Schema markup + visual breadcrumbs |
| H1 tags on every page | 9/10 | Consistent heading hierarchy |
| Environment-based indexing | 8/10 | ALLOW_INDEXING toggle for staging/production |
| Image optimization pipeline | 9/10 | WebP + preload + lazy loading + enforced alt text |
| Mobile-first design | 9/10 | Tailwind responsive + viewport meta |
| Twitter card support | 9/10 | summary_large_image on all pages |
| OG image support | 8/10 | Brand fallback + per-listing images |
| Content depth | 9/10 | 30+ manufacturer guides, 14 subcategory buying tips, related equipment sections |
| Internal linking | 9/10 | Breadcrumbs, category links, manufacturer links, state links, Market Match, Similar Equipment |
| Test coverage & CI | 9/10 | 523 tests, npm audit, pinned dependencies |

---

## 9. SEO Areas for Improvement

| Area | Current | Recommended | Impact | Effort |
|------|---------|-------------|--------|--------|
| Video schema | Not implemented | Add VideoObject if videos added to listings | MEDIUM | 4 hours |
| AggregateRating | Not implemented | Add if reviews/ratings feature built | MEDIUM | 8 hours |
| Hreflang tags | Not implemented | Add for multi-language support (if applicable) | LOW | 4 hours |
| SSR / pre-rendering | SPA with meta injection | Consider SSR or pre-rendering for faster bot crawling | HIGH | 40+ hours |
| Schema validation in CI | Not automated | Add Google Rich Results Test to CI pipeline | LOW | 2 hours |
| Lighthouse CI | Firebase Performance only | Add Lighthouse CI to build pipeline for page speed monitoring | MEDIUM | 4 hours |

---

## 10. Scoring Summary

| Category | Weight | Score |
|----------|--------|-------|
| Meta Tag Management | 15% | 9.5 |
| Structured Data (JSON-LD) | 15% | 9.5 |
| Dynamic Landing Pages | 15% | 9.0 |
| Sitemap & Crawlability | 10% | 9.0 |
| Technical SEO (CWV, images) | 15% | 9.0 |
| Canonical Strategy | 10% | 9.0 |
| Mobile Optimization | 10% | 9.0 |
| Content Depth & Internal Linking | 10% | 9.5 |
| **Weighted Average** | **100%** | **9.2 / 10** |
