# Forestry Equipment Sales — Full SEO Audit
Generated: 2026-04-04

Source of truth: `src/components/Seo.tsx`, `src/App.tsx` (routes), and every page file in `src/pages/*.tsx`.

---

## 1. Global SEO Defaults

### `<Seo>` component behavior (`src/components/Seo.tsx`)

The `<Seo>` component is a side-effect-only React component (returns `null`). On mount/update it imperatively sets `document.title`, writes/updates `<meta>` tags (description, robots, googlebot, og:*, twitter:*), writes the canonical `<link>`, optionally preloads a hero image, and injects a single `<script id="seo-json-ld" type="application/ld+json">`.

**Prop contract:**
```ts
interface SeoProps {
  title: string;              // REQUIRED - used for <title>, og:title, twitter:title
  description: string;        // REQUIRED - used for <meta name="description">, og:description, twitter:description
  canonicalPath?: string;     // relative path that is joined to BASE_URL for <link rel="canonical">
  robots?: string;            // defaults to DEFAULT_ROBOTS (env-gated)
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  ogType?: 'website' | 'article' | 'product';  // defaults to 'website'
  imagePath?: string;         // defaults to '/Forestry Equipment Sales-Logo.png?v=20260405c'
  preloadImage?: string;      // optional LCP hero preload
}
```

- **Default title:** N/A — `title` is a required prop, there is no fallback. Any page that fails to render its Seo component will leave the title from `index.html` in place.
- **Base URL:** `const BASE_URL = 'https://forestryequipmentsales.com';`
- **Default OG image:** `'/Forestry Equipment Sales-Logo.png?v=20260405c'` (resolved against BASE_URL if not absolute).
- **Default OG type:** `'website'`.
- **OG site name:** hardcoded as `'Forestry Equipment Sales'`.

#### Default robots directive (env-gated)

```ts
const DEFAULT_ROBOTS =
  import.meta.env.VITE_ALLOW_INDEXING === 'true'
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow, noarchive, nosnippet, noimageindex';
```

- When `VITE_ALLOW_INDEXING === 'true'` at build time → **every page that does not pass an explicit `robots` prop will be indexable** (`index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`).
- Otherwise (the default, including any value that is not literally the string `'true'`) → **every page that does not pass an explicit `robots` prop will be noindexed** (`noindex, nofollow, noarchive, nosnippet, noimageindex`).
- This env var is resolved at build time by Vite. There is no runtime toggle.

#### `NOINDEX_ROBOTS` constant (`src/utils/listingPath.ts`)

```ts
export const NOINDEX_ROBOTS = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
```

Used by all explicitly private pages (DealerOS, Login, Register, ResetPassword, Unsubscribe, etc.) and by `ListingDetail` when a listing is not live/approved.

#### Route-quality noindex (`src/utils/seoRouteQuality.ts`)

SEO landing pages inside `src/pages/SeoLandingPages.tsx` (CategoryLandingPage, ManufacturerLandingPage, ManufacturerModelLandingPage, ManufacturerModelCategoryLandingPage, ManufacturerCategoryLandingPage, StateMarketLandingPage, StateCategoryLandingPage) and the dealer storefront category route use `evaluateRouteQuality(routeType, count, options)`.

Route thresholds (listing count required to be indexable):

| Route type                     | Threshold |
|--------------------------------|-----------|
| category                       | 2         |
| manufacturer                   | 2         |
| manufacturerModel              | 2         |
| manufacturerCategory           | 2         |
| manufacturerModelCategory      | 2         |
| stateMarket                    | 2         |
| stateCategory                  | 2         |
| dealer                         | 3         |
| dealerCategory                 | 2         |

Behavior:
- `count <= 0` → `{ robots: 'noindex, follow', redirectPath: fallbackPath || null }` (i.e. bounce to the fallback route).
- `0 < count < threshold` → `{ robots: 'noindex, follow', redirectPath: null }` (page renders but is marked noindex).
- `count >= threshold` → `{ robots: undefined }` → the page falls through to the `<Seo>` component's `DEFAULT_ROBOTS` (i.e. env-gated).

---

### `index.html` (pre-hydration meta)

```html
<title>Forestry Equipment Sales | New &amp; Used Logging Equipment For Sale</title>
<meta name="description" content="Forestry Equipment Sales marketplace for in-stock new and used logging equipment. Filter by category, manufacturer, model, price, hours, condition, and location." />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta property="og:site_name" content="Forestry Equipment Sales" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Forestry Equipment Sales | New &amp; Used Logging Equipment For Sale" />
<meta property="og:description" content="Forestry Equipment Sales marketplace for in-stock new and used logging equipment. Filter by category, manufacturer, model, price, hours, condition, and location." />
<meta property="og:url" content="https://forestryequipmentsales.com/" />
<meta property="og:image" content="https://forestryequipmentsales.com/Forestry Equipment Sales-Brand-Logo-Header-Email.png?v=20260405c" />
<link rel="canonical" href="https://forestryequipmentsales.com/" />
```

**Note:** the pre-hydration `<meta name="robots">` in `index.html` is hardcoded to `index, follow, …` regardless of `VITE_ALLOW_INDEXING`. This is only the first-paint value; React's `<Seo>` component overwrites it on hydration with the env-gated `DEFAULT_ROBOTS` (or the explicit prop). Crawlers that execute JS will see the final React-written value; crawlers that do not (or snapshot before hydration) see the `index, follow` default.

---

### `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://www.forestryequipmentsales.com/sitemap.xml
```

This file is **fully permissive** — nothing is disallowed. All gating happens via per-page `<meta name="robots">`.

---

## 2. Static Pages

All routes below are mounted in `src/App.tsx`. "default" in the Robots column means the page does not pass an explicit `robots` prop and therefore inherits `DEFAULT_ROBOTS` from `Seo.tsx` (i.e. indexable only when `VITE_ALLOW_INDEXING=true`).

| Route | Component | Tab Title | Meta Description | Canonical | Robots | JSON-LD |
|-------|-----------|-----------|------------------|-----------|--------|---------|
| `/` | `Home` | `Logging Equipment For Sale \| Forestry Equipment Sales` | `Buy and Sell New & Used Forestry/Logging Equipment on our marketplace. Find skidders, feller bunchers, forwarders, processors, and more for sale near you. Browse reliable forestry equipment at forestryequipmentsales.com` | `/` | default | `@graph`: `Organization`, `WebSite`, `CollectionPage`, `ItemList` |
| `/about` and `/about-us` | `About` | `About Us \| Forestry Equipment Sales` | `Learn why Forestry Equipment Sales was built, who we serve, and how our marketplace helps contractors, dealers, and buyers move equipment faster.` | `/about` | default | `AboutPage` + `Organization` + `BreadcrumbList` |
| `/ad-programs` | `AdPrograms` | `Seller Ad Programs \| List Equipment \| Forestry Equipment Sales` | `Choose an Owner-Operator, Dealer, or Pro Dealer subscription to list forestry equipment on the Forestry Equipment Sales marketplace.` | `/ad-programs` | default | `Service` + `BreadcrumbList` |
| `/admin` (+ `?tab=*`) | `AdminDashboard` | `${dashboardHeading} \| Forestry Equipment Sales` (dashboardHeading = Account Overview / Machine Inventory / Lead Monitoring / Call Logs / Performance Tracking / Account Directory / Billing Account / Content Studio / Dealer Feed Manager / Auction Management / Taxonomy Manager / Operator Directory / Profile Settings) | When `activeTab==='overview'`: `Review live Forestry Equipment Sales marketplace operations, inventory, leads, and account activity.`; else: `Manage ${dashboardHeading.toLowerCase()} in the Forestry Equipment Sales admin workspace.` | `/admin` when `activeTab==='overview'`, else `` /admin?tab=${activeTab} `` | **`noindex, nofollow`** (hardcoded) | none |
| `/auctions` | `Auctions` | `Equipment Auctions \| Forestry Equipment Sales` | `Browse active and upcoming forestry equipment auctions, review bidder requirements and auction terms, and bid on logging machines, land clearing equipment, trucks, and trailers.` | `/auctions` | default | `CollectionPage` |
| `/auctions/:auctionSlug/register` | `BidderRegistration` | `` `${auction ? `${auction.title} \| ` : ''}Register to Bid \| Forestry Equipment Sales` `` | `Complete bidder registration, identity verification, and payment setup for the auction.` | *(not set — missing)* | default | none |
| `/blog` | `Blog` | `Equipment News \| Market Reports & Industry Updates \| Forestry Equipment Sales` | `Stay up to date with forestry equipment market reports, industry news, price trends, and inventory analysis from Forestry Equipment Sales.` | `/blog` | default | `@graph`: `Blog`, `BreadcrumbList` |
| `/bookmarks` | `Bookmarks` | `Saved Equipment \| Forestry Equipment Sales` | `Your bookmarked forestry equipment listings on Forestry Equipment Sales.` | `/bookmarks` | default | none |
| `/calculator` | `Calculator` | `Equipment Financing Calculator \| Forestry Equipment Sales` | `Estimate monthly payments on forestry and logging equipment. Adjust price, down payment, term, and interest rate to plan your next purchase.` | `/calculator` | default | none |
| `/categories` | `Categories` | `Equipment Categories \| Browse Marketplace Equipment Families \| Forestry Equipment Sales` | `Browse Forestry Equipment Sales inventory by major equipment family including logging equipment, land clearing equipment, firewood equipment, trucks, trailers, and more.` | `/categories` | default | `CollectionPage` with `hasPart` array of `Collection` |
| `/compare` | `Compare` | `Compare Equipment \| Forestry Equipment Sales` | `Compare forestry equipment listings side by side. Review specs, pricing, hours, and condition to find the right machine.` | `/compare` | default | none |
| `/contact` | `Contact` | `Contact Forestry Equipment Sales \| Sales, Support, and Dealer Help` | `Contact Forestry Equipment Sales for buying help, seller support, dealer storefront questions, financing requests, and logistics coordination.` | `/contact` | default | `@graph`: `ContactPage`, `Organization` (with `ContactPoint`), `BreadcrumbList` |
| `/cookies` | `Cookies` | `Cookie Policy \| Forestry Equipment Sales` | `Learn how Forestry Equipment Sales uses cookies, localStorage, and tracking technologies. Manage your preferences and understand your choices.` | `/cookies` | default | none (just `ogType: 'website'` explicit) |
| `/dealer-os` | `DealerOS` | `DealerOS \| Forestry Equipment Sales` | `Manage your dealer inventory, leads, feed imports, and storefront settings.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/dealers` | `Dealers` | `Find Forestry Equipment Dealers & Manufacturers \| Forestry Equipment Sales` | `Search forestry equipment dealers and manufacturers by name, state, country, and category. Sort by nearest location. Browse dealer and pro dealer storefronts.` | `/dealers` | default | `@graph`: `CollectionPage`, `BreadcrumbList`, `ItemList` of `Organization` |
| `/dmca` | `Dmca` | `DMCA Policy \| Forestry Equipment Sales` | `Digital Millennium Copyright Act (DMCA) policy for Forestry Equipment Sales. Takedown procedures, counter-notifications, designated agent, and repeat infringer policy.` | `/dmca` | default | none |
| `/faq` | `Faq` | `Logging Equipment Marketplace FAQ \| Buyers, Sellers, and Dealers` | `Find answers about buying, selling, financing, shipping, dealer storefronts, approvals, and equipment listings on Forestry Equipment Sales.` | `/faq` | default | `@graph`: `FAQPage` (`Question`/`Answer`), `BreadcrumbList` |
| `/financing` | `Financing` | `Equipment Financing \| Apply for Credit \| Forestry Equipment Sales` | `Apply for flexible forestry equipment financing with fast approvals, competitive rates, and terms up to 84 months through Forestry Equipment Sales.` | `/financing` | default | `@graph`: `Service`, `BreadcrumbList` |
| `/logistics` | `Logistics` | `Global Logistics \| Trucking Request Form \| Forestry Equipment Sales` | `Request trucking and heavy-haul coordination for forestry equipment with the Forestry Equipment Sales logistics team.` | `/logistics` | default | `@graph`: `Service`, `Place`, `BreadcrumbList` |
| `/login` | `Login` | `Sign In \| Forestry Equipment Sales` | `Sign in to your Forestry Equipment Sales account to manage listings, view saved equipment, and access dealer tools.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/manufacturers` | `Manufacturers` | `Equipment Manufacturers \| Forestry Equipment Sales` | `Browse equipment manufacturers with direct paths into live marketplace inventory, top machine categories, and regional availability.` | `/manufacturers` | default | `CollectionPage` with `ListItem` entries |
| `/404` and `*` (catch-all) | `NotFound` | `Page Not Found \| Forestry Equipment Sales` | `The page you requested could not be found. Browse live equipment inventory, categories, dealers, or return to the Forestry Equipment Sales homepage.` | `/404` | **`noindex, nofollow, noarchive, nosnippet, noimageindex`** (hardcoded) | none |
| `/our-team` and `/about/our-team` | `OurTeam` | `Our Team \| Forestry Equipment Sales` | `Meet the Forestry Equipment Sales team behind the marketplace, logistics coordination, customer support, and platform development.` | `/our-team` | default | `@graph`: `AboutPage`, `Organization` with `Person[]`, `BreadcrumbList` |
| `/privacy` | `Privacy` | `Privacy Policy \| Forestry Equipment Sales` | `Learn how Forestry Equipment Sales collects, uses, and protects your data. GDPR, CCPA, and COPPA compliant. Data encryption, third-party processors, and your rights explained.` | `/privacy` | default | `@graph`: `WebPage`, `BreadcrumbList` |
| `/profile` (+ `?tab=*`) | `Profile` | `` `${activeTab} \| Forestry Equipment Sales` `` | Overview: `Manage your Forestry Equipment Sales account, listings, saved equipment, and subscription settings.`; else: `` `Manage ${activeTab.toLowerCase()} from your Forestry Equipment Sales account workspace.` `` | `/profile` for overview, else `` `/profile?tab=${encodeURIComponent(activeTab)}` `` | **`noindex, nofollow`** (hardcoded) | none |
| `/register` | `Register` | `Create Account \| Forestry Equipment Sales` | `Register for a free account to browse, bookmark, and inquire on forestry equipment. Sellers can subscribe to list machines.` | `/register` | **`noindex, nofollow`** (hardcoded) | none |
| `/reset-password` | `ResetPassword` | `Reset Password \| Forestry Equipment Sales` | `Securely reset your Forestry Equipment Sales account password.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/sell` | `Sell` (via `SellWorkspaceRoute` wrapper) | `Sell Equipment \| List Your Machine Fast` | `List your equipment with category specs, photos, optional video, and a quick condition checklist.` | `/sell` | default | none |
| `/states` | `States` | `Equipment Markets By State \| Forestry Equipment Sales` | `Browse state-level market pages for forestry and logging equipment, with direct paths into live public inventory.` | `/states` | default | `CollectionPage` with `ListItem` entries |
| `/subscription-success` | `SubscriptionSuccess` | `Subscription Success \| Forestry Equipment Sales` | `Confirm your Forestry Equipment Sales seller subscription and continue into your account.` | `/subscription-success` | default | none |
| `/terms` | `Terms` | `Terms of Service \| Forestry Equipment Sales` | `Terms of service governing the use of the Forestry Equipment Sales marketplace, including listing rules, auction bidding terms, billing, dispute resolution, and governing law.` | `/terms` | default | `@graph`: `WebPage`, `BreadcrumbList` |
| `/unsubscribe` | `Unsubscribe` | `Unsubscribe \| Forestry Equipment Sales` | `Manage your email notification preferences for Forestry Equipment Sales.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/forestry-equipment-for-sale` | `ForestryHubPage` (templated — see §4) | `Forestry Equipment for Sale \| New & Used Machines \| Forestry Equipment Sales` | static string (see §4) | `/forestry-equipment-for-sale` | default | CollectionPage + BreadcrumbList + ItemList |
| `/logging-equipment-for-sale` | `LoggingHubPage` (templated — see §4) | `Logging Equipment For Sale \| Forestry Equipment Sales` | static string (see §4) | `/logging-equipment-for-sale` | default | CollectionPage + BreadcrumbList + ItemList |

Notes:
- `/search` and `/categories/:categorySlug` are driven by `Search.tsx` / `CategorySearchPage.tsx` and have dynamic robots — see §3.
- `/account` redirects via `AccountWorkspaceRedirect`, no `<Seo>` on the redirect component itself.
- `/seller/:id` redirects to `/dealers/:id`, no `<Seo>`.

---

## 3. Dynamic Pages — Listings, Auctions, Lots, Dealer Storefronts, Search

### 3.1 `ListingDetail` — `/equipment/:slug`, `/equipment/:slug/:publicKey`, `/listing/:id`, `/listing/:id/:slug`

**Tab title template**
```ts
const detailSeoHeadline = `${safeYear || ''} ${safeMake || ''} ${safeModel || ''}`
  .replace(/\s+/g, ' ').trim() || listing.title || 'Equipment Detail';

const detailSeoTitle = safeCityState
  ? `${detailSeoHeadline} for Sale in ${safeCityState} | Forestry Equipment Sales`
  : `${detailSeoHeadline} for Sale | Forestry Equipment Sales`;
```

**Description template**
```ts
const detailSeoDescription = [
  `Used ${detailSeoHeadline} ${routeCategory ? `${routeCategory.toLowerCase()} ` : ''}for sale${safeCityState ? ` in ${safeCityState}` : ''}`
    .replace(/\s+/g, ' ').trim(),
  safeHours > 0 ? `with ${formatNumber(safeHours)} hours.` : 'View photos, specs, and pricing details.',
  'Request pricing, financing, and logistics support from Forestry Equipment Sales.',
].join(' ');
```

**Canonical**: `canonicalPath={listingPath}` where `listingPath = buildListingPath(listing)` from `src/utils/listingPath.ts`. Canonical always resolves to the `/equipment/{slug}-{publicKey}` form, regardless of which of the four routes the user landed on — the page also performs a client-side `<Navigate replace>` to the canonical URL if the current path does not match.

**Robots (computed)**
```ts
const isLiveApprovedListing =
  String(listing.approvalStatus || '').toLowerCase() === 'approved' &&
  String(listing.paymentStatus || '').toLowerCase() === 'paid' &&
  !['sold', 'expired', 'archived', 'pending'].includes(String(listing.status || 'active').toLowerCase());

const isQaOrTestListing = isPublicQaOrTestRecord(
  listing.id, listing.title, listing.stockNumber,
  routeManufacturer, routeModel,
  seller?.storefrontName, seller?.storefrontSlug, seller?.name,
);

const detailRobots = !isLiveApprovedListing || isQaOrTestListing ? NOINDEX_ROBOTS : undefined;
```

→ If the listing is not approved+paid+active OR contains any QA/test token (`qa`, `test`, `testing`, `demo`, `probe`, `sandbox`, `sample`, `staging`) in any of the inspected fields → `NOINDEX_ROBOTS`. Otherwise `undefined` (falls back to `DEFAULT_ROBOTS`, i.e. env-gated).

**JSON-LD**
```ts
@graph: [
  { '@type': 'BreadcrumbList', itemListElement: [...up to 5 positions: Home, Category, Manufacturer, Model, Headline] },
  { '@type': 'Product', name, description, category, model, sku, mpn, image, url, brand: {@type: 'Brand'},
    itemCondition: NewCondition | RefurbishedCondition | UsedCondition,
    additionalProperty: PropertyValue[] (up to 15 spec entries),
    offers: { '@type': 'Offer', url, priceCurrency, availability: InStock|SoldOut, price, areaServed, seller: {@type:'Organization'} }
  }
]
```

**ogType**: `'product'` (explicit). **imagePath**: `galleryImages[0]`.

---

### 3.2 `AuctionDetail` — `/auctions/:auctionSlug`

**Tab title**: `` `${auction.title} | Auction Catalog | Forestry Equipment Sales` ``
**Description**: `` auction.description || `Browse lots and bid on ${auction.title}. Forestry equipment auction.` ``
**Canonical**: `` `/auctions/${auction.slug}` ``
**Robots**: not set → default (env-gated).
**JSON-LD**: `{ '@type': 'Event', name, description, startDate, endDate, url, image, organizer: {@type: 'Organization', name: 'Forestry Equipment Sales'} }`

**Notes**: the entire `<Seo>` is only rendered when `auction` has loaded (`{auction && <Seo ... />}`), so a failed load leaves the `index.html` defaults in place.

---

### 3.3 `LotDetail` — `/auctions/:auctionSlug/lots/:lotNumber` (primary binding)

**Tab title template**:
```ts
title={`Lot #${lot.lotNumber} – ${lot.year} ${lot.manufacturer} ${lot.model} | ${auction.title} | Forestry Equipment Sales`}
```

**Description template**:
```ts
description={`Bid on Lot #${lot.lotNumber}: ${lot.year} ${lot.manufacturer} ${lot.model}. ${lot.pickupLocation ? `Pickup: ${lot.pickupLocation}.` : ''} Auction by Forestry Equipment Sales.`}
```

**Canonical**: `` `/auctions/${auction.slug}/lots/${lot.lotNumber}` ``
**Robots**: not set → default.
**JSON-LD**: `{ '@type': 'Product', ..., offers: { '@type': 'Offer', ... } }`
**ogType**: defaults to `'website'` (no override).
**imagePath**: `lot.thumbnailUrl || undefined`.

---

### 3.4 `AuctionLotDetail` — also bound to `/auctions/:auctionSlug/lots/:lotNumber`

**IMPORTANT:** `App.tsx` has **two** routes with the identical pattern `/auctions/:auctionSlug/lots/:lotNumber` (see §6 for the full finding). `LotDetail` is declared first and wins, but both components ship Seo tags.

**Tab title template**:
```ts
title={`Lot ${lot.lotNumber} | ${lot.year} ${lot.manufacturer} ${lot.model} | ${auction.title}`}
```
(no `| Forestry Equipment Sales` suffix)

**Description template**:
```ts
description={`${lot.year} ${lot.manufacturer} ${lot.model} in ${auction.title}. Current bid ${formatCurrency(displayedBid)}.`}
```

**Canonical**: `` `/auctions/${auction.slug}/lots/${lot.lotNumber}` ``
**Robots**: not set → default.
**JSON-LD**: none.
**imagePath**: `lot.thumbnailUrl`.

---

### 3.5 `SellerProfile` — `/dealers/:id`, `/dealers/:id/inventory`, `/dealers/:id/:categorySlug`

**Tab title (memoized)**
```ts
if (!seller) return 'Dealer Storefront | Forestry Equipment Sales';
const headline = seller.storefrontName || seller.name;
if (isDealerRoute && categorySlug) return `${headline} ${titleCaseSlug(categorySlug)} Inventory | Forestry Equipment Sales`;
if (isDealerRoute && isInventoryRoute) return `${headline} Inventory | Forestry Equipment Sales`;
return seller.seoTitle || `${headline} | ${roleLabel(seller.role)} | Forestry Equipment Sales`;
```

**Description (memoized)**
```ts
if (!seller) return 'Browse seller storefront inventory on Forestry Equipment Sales.';
const headline = seller.storefrontName || seller.name;
if (isDealerRoute && categorySlug) return `Browse ${titleCaseSlug(categorySlug).toLowerCase()} inventory from ${headline} on Forestry Equipment Sales.`;
if (isDealerRoute && isInventoryRoute) return `Browse live inventory from ${headline} on Forestry Equipment Sales.`;
return seller.seoDescription || seller.storefrontDescription ||
  `${headline} storefront on Forestry Equipment Sales. Browse inventory, contact details, and active listings.`;
```

**Canonical (conditional)**
```ts
if (isDealerRoute) {
  if (categorySlug) return `${preferredDealerPath}/${categorySlug}`;
  if (isInventoryRoute) return `${preferredDealerPath}/inventory`;
  return preferredDealerPath;
}
if (isDealerRole(seller.role)) return preferredDealerPath;
return `/dealers/${seller.storefrontSlug || seller.id}`;
```

**Robots (computed)**
```ts
const dealerRouteQuality = isDealerRoute && categorySlug
  ? evaluateRouteQuality('dealerCategory', filteredListings.length, {
      fallbackPath: `${preferredDealerPath}/inventory`,
    })
  : null;

if (dealerRouteQuality?.redirectPath) return <Navigate replace to={dealerRouteQuality.redirectPath} />;

// ...
robots={dealerRouteQuality?.robots}
```

- On the base `/dealers/:id` and `/dealers/:id/inventory` routes, `dealerRouteQuality` is `null` → `robots={undefined}` → default (env-gated).
- On `/dealers/:id/:categorySlug` with 0 listings → `<Navigate>` to `${preferredDealerPath}/inventory`.
- On `/dealers/:id/:categorySlug` with 1 listing → `robots: 'noindex, follow'` (below threshold 2).
- On `/dealers/:id/:categorySlug` with ≥2 listings → `robots: undefined` → default.

> **NOTE**: the broader "dealer" threshold of 3 is not applied here — the base dealer route does not call `evaluateRouteQuality('dealer', ...)`. The `'dealer'` threshold is only consulted by `useFeaturedDealers` / `DealerDirectoryPage` when filtering dealer cards for inclusion in landing pages.

**JSON-LD**
```
@graph: [
  isDealer ? LocalBusiness : Organization (with address, geo, areaServed, logo, image),
  BreadcrumbList (Home / Dealers / headline / [category]),
  ItemList of Product (up to 24 filtered listings)
]
```

---

### 3.6 `BlogPostDetail` — `/blog/:id`, `/blog/:id/:slug`

**Tab title**: `` `${post.seoTitle || post.title} | Forestry Equipment Sales` ``
**Description**: `post.seoDescription || post.summary`
**Canonical**: `getNewsPostCanonicalPath(post)` where
```ts
function getNewsPostCanonicalPath(post: NewsPost) {
  const slug = post.seoSlug || slugifyNewsTitle(post.title);
  return slug ? `\blog\${post.id}\${slug}` : `/blog/${post.id}`;
}
```
**CRITICAL BUG**: this function uses backslash-escaped `\b` in the template literal, which at runtime produces the character `\x08` (backspace), not a `/`. The canonical for the slugged branch is `"\x08log\x08{post.id}\x08{slug}"` — a broken URL. The fallback `/blog/${post.id}` works correctly. This also affects the JSON-LD `BlogPosting.mainEntityOfPage['@id']` and breadcrumb URL which both use `getNewsPostCanonicalPath`. See §6 Findings.

**Robots**: not set → default.
**ogType**: `'article'`.
**imagePath**: `post.image || undefined`.
**JSON-LD**:
```
@graph: [
  BlogPosting { headline, description, datePublished, author: Organization, publisher: Organization (with ImageObject logo), mainEntityOfPage: WebPage },
  BreadcrumbList
]
```

---

### 3.7 `Search` — `/search` (and used inside `CategorySearchPage` mounted at `/categories/:categorySlug`)

The same `Search` component is rendered at both `/search` and `/categories/:categorySlug`. The presence of `categoryRoute` (passed in from `CategorySearchPage`) determines "category page" mode.

**Tab title**
```ts
const seoTitle = isCategoryPage
  ? `${categoryLabel} for Sale | New & Used ${categoryLabel} | Forestry Equipment Sales`
  : filters.q
    ? `Forestry Equipment Sales | ${filters.q} Listings (${filteredListings.length})`
    : 'Forestry Equipment Sales | New & Used Logging Equipment For Sale';
```

**Description**
```ts
const seoDescription = isCategoryPage
  ? `Browse ${filteredListings.length.toLocaleString()} new and used ${categoryLabel.toLowerCase()} listings for sale. Compare prices, specs, and photos from dealers and private sellers on Forestry Equipment Sales.`
  : 'Search in-stock new and used logging equipment with advanced filters for category, manufacturer, model, price, year, hours, condition, location, attachments, and features.';
```

**Canonical**
```ts
const categorySlugPath = categoryRoute ? `/categories/${categoryRoute.slug}` : '/search';
const seoCanonical = categorySlugPath;
```

**Robots (computed)**
```ts
const seoRobots = isCategoryPage ? undefined : 'noindex, follow';
```

- `/search` (no `categoryRoute`) → **`noindex, follow`** (hardcoded). Filtered result pages are never indexed.
- `/categories/:categorySlug` → `undefined` → default (env-gated).

**JSON-LD**: For category pages: `@graph` of `CollectionPage` + `BreadcrumbList` (Home/Categories/CategoryLabel) + `ItemList` of Products (up to 24). For `/search`: a flat `ItemList`.

---

## 4. SEO Landing Pages (`src/pages/SeoLandingPages.tsx`)

All of the components below share the `SeoInventoryTemplate` wrapper which renders the `<Seo>` like this:

```tsx
<Seo title={`${title} | Forestry Equipment Sales`} description={description} canonicalPath={canonicalPath} robots={robots} jsonLd={jsonLd} />
```

So the final browser title is always `${templateTitle} | Forestry Equipment Sales`. The `jsonLd` is built by `buildCollectionJsonLd(title, description, canonicalPath, listings, breadcrumbs)` which returns:

```
@graph: [
  { '@type': 'CollectionPage', name, description, url },
  { '@type': 'BreadcrumbList', itemListElement: [...] },
  { '@type': 'ItemList', name: `${title} inventory`, itemListElement: Product[] (up to 24) }
]
```

**Slug constants used below:**
- `MARKET_ROUTE_LABELS.forestry = 'forestry-equipment-for-sale'`
- `MARKET_ROUTE_LABELS.logging = 'logging-equipment-for-sale'`
- `CANONICAL_MARKET_ROUTE_KEY = 'forestry'`

---

### 4.1 `ForestryHubPage` — `/forestry-equipment-for-sale`

- **Tab title**: `Forestry Equipment for Sale | New & Used Machines | Forestry Equipment Sales`
- **Description**: `Browse new and used forestry equipment for sale including logging, land clearing, firewood, sawmill, truck, trailer, and attachment inventory from dealers and owners.`
- **Canonical**: `` `/${MARKET_ROUTE_LABELS.forestry}` `` → `/forestry-equipment-for-sale`
- **Eyebrow**: `Equipment Marketplace`
- **Intro**: `Browse the full Forestry Equipment Sales marketplace. Shop live inventory across logging, land clearing, firewood, sawmill, tree service, truck, trailer, and parts categories from dealers and private sellers.`
- **Breadcrumbs**: `Home` → `Forestry Equipment For Sale`
- **Robots**: **not passed** → default (env-gated). The hub page does **not** call `evaluateRouteQuality` — it is always default-indexable.
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.2 `LoggingHubPage` — `/logging-equipment-for-sale`

- **Tab title**: `Logging Equipment For Sale | Forestry Equipment Sales`
- **Description**: `Shop new and used logging equipment for sale including skidders, forwarders, feller bunchers, log loaders, delimbers, and more from dealers and owners.`
- **Canonical**: `` `/${MARKET_ROUTE_LABELS.logging}` `` → `/logging-equipment-for-sale`
- **Eyebrow**: `Logging Equipment`
- **Intro**: `Browse live logging equipment inventory from dealers and private sellers across North America. Filter by machine type, manufacturer, model, location, and price.`
- **Breadcrumbs**: `Home` → `Logging Equipment For Sale`
- **Robots**: **not passed** → default (env-gated).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.3 `CategoryLandingPage` — *not currently mounted in `App.tsx`*

The component is exported and lazy-imported in `App.tsx` line 43, but there is **no `<Route>` using it**. The `/categories/:categorySlug` route instead uses `CategorySearchPage` (which wraps `Search`). This component exists as dead/legacy code that may still be activated.

- **Tab title template**:
  ```ts
  const parentCategory = getParentCategory(resolvedCategory);
  const displayTitle = parentCategory
    ? `${parentCategory} - ${resolvedCategory} For Sale`
    : `${resolvedCategory} For Sale`;
  // final: `${displayTitle} | Forestry Equipment Sales`
  ```
- **Description template**:
  ```ts
  `Browse ${resolvedCategory.toLowerCase()} for sale on Forestry Equipment Sales. ${parentCategory ? `Shop ${parentCategory.toLowerCase()} inventory` : 'Shop live inventory'} from dealers and private sellers across North America.`
  ```
- **Canonical template**: `buildCategoryPath(resolvedCategory)` (forms `/categories/<slug>-for-sale` or similar per `seoRoutes.ts`).
- **Intro**: `` `Shop ${resolvedCategory.toLowerCase()} from trusted dealers and private sellers. Browse live inventory, compare prices, and connect directly with sellers to move fast on the equipment you need.` ``
- **Robots**: `quality.robots` from `evaluateRouteQuality('category', categoryListings.length, { fallbackPath: '/categories' })`. 0 → redirect; 1 → `noindex, follow`; ≥2 → default.
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.4 `ManufacturerLandingPage` — `/manufacturers/:manufacturerSlug`

- **Tab title template**: `` `${resolvedManufacturer} Equipment For Sale | Forestry Equipment Sales` ``
- **Description template**: `` `Browse ${resolvedManufacturer} equipment for sale by make on Forestry Equipment Sales. Shop live ${resolvedManufacturer} inventory from dealers and private sellers across North America.` ``
- **Canonical template**: `buildManufacturerPath(resolvedManufacturer)`
- **Intro**: `mfgContent.description` (from `constants/manufacturerContent`)
- **Breadcrumbs**: `Home` → `Manufacturers` → resolved manufacturer
- **Robots**: `quality.robots` from `evaluateRouteQuality('manufacturer', mfgListings.length, { fallbackPath: '/manufacturers' })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList. Also renders a `<aboutContent>` section with the manufacturer description, founded year, headquarters.

---

### 4.5 `ManufacturerModelLandingPage` — `/manufacturers/:manufacturerSlug/models/:modelSlug`

- **Tab title template**: `` `${resolvedManufacturer} ${resolvedModel} For Sale | Forestry Equipment Sales` ``
- **Description template**: `` `Browse ${resolvedManufacturer} ${resolvedModel} for sale on Forestry Equipment Sales. Shop live inventory from dealers and private sellers.` ``
- **Canonical template**: `buildManufacturerModelPath(resolvedManufacturer, resolvedModel)`
- **Intro**: `` `Find ${resolvedManufacturer} ${resolvedModel} machines for sale from dealers and private sellers. Compare pricing, hours, and condition across available inventory.` ``
- **Breadcrumbs**: `Home` → `Manufacturers` → manufacturer → model
- **Robots**: `evaluateRouteQuality('manufacturerModel', filteredListings.length, { fallbackPath: buildManufacturerPath(resolvedManufacturer) })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.6 `ManufacturerCategoryLandingPage` — `/manufacturers/:manufacturerSlug/:categorySaleSlug`

- **Tab title template**: `` `${resolvedManufacturer} ${resolvedCategory} For Sale | Forestry Equipment Sales` ``
- **Description template**: `` `Browse ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} for sale on Forestry Equipment Sales. Shop live inventory from dealers and private sellers.` ``
- **Canonical template**: `buildManufacturerCategoryPath(resolvedManufacturer, resolvedCategory)`
- **Intro**: `` `Shop ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} from dealers and private sellers. Compare available machines, pricing, and hours across live marketplace inventory.` ``
- **Breadcrumbs**: `Home` → manufacturer → `${resolvedCategory}`
- **Robots**: `evaluateRouteQuality('manufacturerCategory', filteredListings.length, { fallbackPath: buildManufacturerPath(resolvedManufacturer) })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList. Includes `subcategoryExplainer`.

Note: `categorySaleSlug` is expected to end in `-for-sale` and is parsed with `parseForSaleSlug` (strips the suffix).

---

### 4.7 `ManufacturerModelCategoryLandingPage` — `/manufacturers/:manufacturerSlug/models/:modelSlug/:categorySaleSlug`

- **Tab title template**: `` `${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} For Sale | Forestry Equipment Sales` ``
- **Description template**: `` `Browse ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} for sale on Forestry Equipment Sales. Shop live inventory from dealers and private sellers.` ``
- **Canonical template**: `buildManufacturerModelCategoryPath(resolvedManufacturer, resolvedModel, resolvedCategory)`
- **Intro**: `` `Find ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} for sale from dealers and private sellers. Browse pricing, hours, and condition on available inventory.` ``
- **Breadcrumbs**: `Home` → `Manufacturers` → manufacturer → model → category
- **Robots**: `evaluateRouteQuality('manufacturerModelCategory', filteredListings.length, { fallbackPath: buildManufacturerModelPath(resolvedManufacturer, resolvedModel) })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.8 `StateMarketLandingPage` — `/states/:stateSlug/logging-equipment-for-sale` and `/states/:stateSlug/forestry-equipment-for-sale`

(Both routes mount the same component; `marketKeyOverride` selects the market.)

- **Tab title template**:
  ```ts
  const marketTitle = marketKey === 'forestry' ? 'Forestry Equipment For Sale' : 'Logging Equipment For Sale';
  // title: `${marketTitle} In ${resolvedState} | Forestry Equipment Sales`
  ```
- **Description template**: `` `Browse ${marketTitle.toLowerCase()} in ${resolvedState} on Forestry Equipment Sales. Shop live inventory from local dealers and private sellers.` ``
- **Canonical template**: `buildStateMarketPath(resolvedState, marketKey)`
- **Intro**: `` `Shop ${marketTitle.toLowerCase()} located in ${resolvedState}. Browse inventory from local dealers and private sellers, compare prices, and connect directly with sellers near you.` ``
- **Breadcrumbs**: `Home` → `States` → resolvedState
- **Robots**: `evaluateRouteQuality('stateMarket', stateListings.length, { fallbackPath: '/states' })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.9 `StateCategoryLandingPage` — `/states/:stateSlug/:categorySaleSlug`

- **Tab title template**: `` `${resolvedCategory} For Sale In ${resolvedState} | Forestry Equipment Sales` ``
- **Description template**: `` `Browse ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} on Forestry Equipment Sales. Shop live inventory from local dealers and private sellers.` ``
- **Canonical template**: `buildStateCategoryPath(resolvedState, resolvedCategory)`
- **Intro**: `` `Find ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} from dealers and private sellers. Browse available inventory, compare pricing, and reach out to sellers directly.` ``
- **Breadcrumbs**: `Home` → state (→ forestry market path) → category
- **Robots**: `evaluateRouteQuality('stateCategory', filteredListings.length, { fallbackPath: buildStateMarketPath(resolvedState, 'forestry') })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList. Includes `subcategoryExplainer`.

Note: the two market slugs (`logging-equipment-for-sale`, `forestry-equipment-for-sale`) on `/states/:stateSlug/:slug` are caught first by the two `StateMarketLandingPage` routes declared above this one in `App.tsx`, so this component only fires for a true category slug.

---

### 4.10 `DealerDirectoryPage` — *exported but not mounted*

This component exists and is exported, but **no route in `App.tsx` renders it**. The `/dealers` route is bound to the `Dealers` page (from `src/pages/Dealers.tsx`) instead. It appears to be legacy/scaffold code.

- **Tab title**: `Logging Equipment Dealers | Forestry Equipment Sales`
- **Description**: `Browse active dealer storefronts on Forestry Equipment Sales. Find trusted dealers selling new and used logging and forestry equipment.`
- **Canonical**: `/dealers`
- **Intro**: `Browse active dealer storefronts and find trusted sellers of new and used logging and forestry equipment. Open any storefront to view their full inventory.`
- **Robots**: not set → default.
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

## 5. Pages Currently Marked `noindex`

### 5a. Hardcoded `noindex` (explicit `robots=` prop, regardless of `VITE_ALLOW_INDEXING`)

| Page | File | Exact robots value | Why |
|------|------|--------------------|-----|
| `AdminDashboard` | `src/pages/AdminDashboard.tsx:5847` | `"noindex, nofollow"` | Admin workspace, internal only. |
| `Profile` | `src/pages/Profile.tsx:3211` | `"noindex, nofollow"` | Authenticated user workspace. |
| `Register` | `src/pages/Register.tsx:161` | `"noindex, nofollow"` | Auth flow. |
| `NotFound` | `src/pages/NotFound.tsx:12` | `"noindex, nofollow, noarchive, nosnippet, noimageindex"` | 404 page should never rank. |
| `DealerOS` | `src/pages/DealerOS.tsx:729` | `NOINDEX_ROBOTS` → `"noindex, nofollow, noarchive, nosnippet, noimageindex"` | Authenticated dealer workspace. |
| `Login` | `src/pages/Login.tsx:382` | `NOINDEX_ROBOTS` | Auth flow. |
| `ResetPassword` | `src/pages/ResetPassword.tsx:161` | `NOINDEX_ROBOTS` | Auth flow. |
| `Unsubscribe` | `src/pages/Unsubscribe.tsx:110` | `NOINDEX_ROBOTS` | Token-gated, per-user. |
| `Search` (non-category mode) | `src/pages/Search.tsx:1051` | `"noindex, follow"` | Filter combinations are infinite; do not index parameterized search. Note this is `follow` not `nofollow` — links are still crawled. |

### 5b. Conditionally `noindex`

| Page | Condition | Value |
|------|-----------|-------|
| `ListingDetail` | `!isLiveApprovedListing \|\| isQaOrTestListing` (not approved+paid+active, or contains `qa`/`test`/`demo`/`sandbox`/`sample`/`staging`/`testing`/`probe` tokens) | `NOINDEX_ROBOTS` |
| `SellerProfile` (`/dealers/:id/:categorySlug`) | `filteredListings.length > 0 && < 2` | `"noindex, follow"` (from `evaluateRouteQuality('dealerCategory', ...)`). 0 listings → `<Navigate>` redirect to `${dealerPath}/inventory`. |
| All SEO landing pages in §4.3–§4.9 | `listings.length > 0 && < threshold (usually 2)` | `"noindex, follow"` (via `evaluateRouteQuality`). 0 listings → `<Navigate>` redirect to fallback. |

### 5c. Effectively `noindex` via default (when `VITE_ALLOW_INDEXING !== 'true'`)

When the env var is not the literal string `'true'`, every page that does NOT pass an explicit `robots` prop is effectively noindexed. At audit time that currently means **the entire rest of the site** (Home, About, Ad Programs, Auctions, Auction Details, AuctionLotDetail, BidderRegistration, Blog, BlogPostDetail, Bookmarks, Calculator, Categories, CategorySearchPage, Compare, Contact, Cookies, Dealers, Dmca, Faq, Financing, ForestryHubPage, Home, ListingDetail (live), Logistics, LotDetail, Manufacturers, ManufacturerLandingPage, ManufacturerModelLandingPage, ManufacturerCategoryLandingPage, ManufacturerModelCategoryLandingPage, OurTeam, Privacy, Sell, SellerProfile (base), States, StateMarketLandingPage, StateCategoryLandingPage, SubscriptionSuccess, Terms).

> This is the single biggest lever in the audit — see §7.

---

## 6. Findings & Observations

### CRITICAL

1. **`BlogPostDetail.getNewsPostCanonicalPath` uses backslash escapes instead of forward slashes.**
   `src/pages/BlogPostDetail.tsx:19`
   ```ts
   return slug ? `\blog\${post.id}\${slug}` : `/blog/${post.id}`;
   ```
   The `\b` is interpreted as a JS string backspace (`\x08`). When a post has an `seoSlug` or a derivable slug, the canonical URL and the JSON-LD `mainEntityOfPage` / breadcrumb URL are all emitted as control-character-laced garbage (e.g. `"\x08log\x081234\x08my-post"`). The `<Link to="\blog">` in the render body (~line 225) has the same bug. **Fix:** replace `\b` with `/b` and use a normal template literal:
   ```ts
   return slug ? `/blog/${post.id}/${slug}` : `/blog/${post.id}`;
   ```

2. **Two routes declared with identical pattern `/auctions/:auctionSlug/lots/:lotNumber`.**
   `src/App.tsx:161` (`LotDetail`) and `src/App.tsx:163` (`AuctionLotDetail`). React Router uses the first match, so `AuctionLotDetail`'s `<Seo>` is dead code on that path. Either remove the duplicate route or consolidate the two components.

3. **Unmounted exported landing components.** `CategoryLandingPage` and `DealerDirectoryPage` are lazy-imported in `App.tsx` but are not bound to any `<Route>`. They are reachable only as dead code. Either mount them or delete them.

### HIGH

4. **Missing `canonicalPath` on several noindex'd pages.** `Login`, `ResetPassword`, `Unsubscribe`, `DealerOS`, `BidderRegistration`. The `<Seo>` component tolerates this (falls back to `BASE_URL`), but every page should set its own canonical to avoid a self-referential root `og:url`. This is especially important for `Unsubscribe` and `ResetPassword` where the URL carries token query params — without a canonical, the `og:url` posts back as `https://forestryequipmentsales.com` which is fine, but still a minor hygiene fix.

5. **Brand inconsistency in the codebase.** File names and asset names are a mix of `Forestry_Equipment_Sales_*` (older brand) and `Forestry Equipment Sales-*` (current brand). The `<Seo>` component emits `og:site_name: 'Forestry Equipment Sales'` and `index.html` emits the same, but git shows many `Forestry_Equipment_Sales_*.png`/`.svg` files currently modified. Titles/descriptions are consistent on "Forestry Equipment Sales" — the exposure is only asset references (not SEO copy).

6. **`Categories.tsx` wraps `Seo` on a single line (~161 chars)** — functional but inconsistent with every other page which uses multiline JSX. Cosmetic only.

7. **`Home` page title does not include "Forestry Equipment Sales" at the start.** `Logging Equipment For Sale | Forestry Equipment Sales` vs the OG default from `index.html` which is `Forestry Equipment Sales | New & Used Logging Equipment For Sale`. Keep one canonical form on the homepage. The mismatch produces a minor discrepancy between pre-hydration and post-hydration titles.

### MEDIUM

8. **Duplicate tab title for `/dealers`.** `Dealers.tsx` renders title `Find Forestry Equipment Dealers & Manufacturers | Forestry Equipment Sales` — but `SeoLandingPages.DealerDirectoryPage` (unmounted but still compiled) uses `Logging Equipment Dealers | Forestry Equipment Sales`. Not a runtime collision today because the second component is unmounted.

9. **Canonicals for `/about` and `/our-team` collapse duplicate routes.** Both `/about` and `/about-us` render the `About` component which emits `canonicalPath="/about"`. Both `/our-team` and `/about/our-team` render `OurTeam` which emits `canonicalPath="/our-team"`. This is correct deduplication — noting for completeness.

10. **`AdminDashboard` and `Profile` canonical include query strings.** `canonicalPath={/admin?tab=${activeTab}}` and `/profile?tab=${encodeURIComponent(activeTab)}`. These pages are hardcoded `noindex, nofollow` so it does not affect crawlers, but canonical URLs conventionally do not include query-string variants. Not critical.

11. **`AdminDashboard` canonical uses `/admin?tab=overview` → no, it uses `/admin`** when activeTab is overview. Confirmed correct.

12. **`index.html` robots is `index, follow, …` but `Seo.tsx` default is gated on `VITE_ALLOW_INDEXING`.** Result: crawlers running JS get the gated value; crawlers snapshotting the raw HTML see `index, follow`. If the project is deploying an un-indexable preview build to public hosting, the raw HTML will mislead crawlers. Either update `index.html` to `noindex, nofollow, noarchive, nosnippet, noimageindex` by default and let the Seo component opt-in to `index` when `VITE_ALLOW_INDEXING` is true, OR accept the behavior if production will always ship with `VITE_ALLOW_INDEXING=true`.

13. **`public/robots.txt` points to `https://www.forestryequipmentsales.com/sitemap.xml` but the canonical `BASE_URL` in `Seo.tsx` is `https://forestryequipmentsales.com` (no www).** Inconsistent host — pick one. If `www` is the intended canonical, update `Seo.tsx`; if not, update `robots.txt`.

### LOW

14. **`BidderRegistration` has no canonical.** Minor — the page is behind auction approval flow and not targeted for indexing; default robots currently noindex it anyway.

15. **Inconsistent use of `| Forestry Equipment Sales` suffix inside the title.** Most pages use `| Forestry Equipment Sales` suffix. `ListingDetail` includes it. `AuctionLotDetail` omits it (`Lot ${n} | ${auction.title}` with no trailing suffix). `AuctionDetail` includes it. `LotDetail` includes it. The `SeoInventoryTemplate` appends `| Forestry Equipment Sales` itself, so landing pages are consistent.

16. **`Profile` tab title starts with the activeTab label (lowercase/formatted enum)** which may produce awkward titles like `Billing | Forestry Equipment Sales` or the raw tab alias. Acceptable because it's noindex.

### Pages without a `<Seo>` component at all
Every user-facing page file in `src/pages/*.tsx` imports and renders `<Seo>`. Two exceptions worth noting:
- `App.tsx` helper wrappers (`RedirectSellerToDealer`, `AccountWorkspaceRedirect`, `RouteLoadingFallback`, `SellWorkspaceRoute`, `ProfileWorkspaceRoute`) — these are passthrough redirects or loading states, not real pages, so no Seo is expected.
- `Sell.tsx` — it *does* include a `<Seo>` (line 303). Complete.

### Pages with no JSON-LD
`Bookmarks`, `Calculator`, `Compare`, `Cookies`, `Dmca`, `Login`, `Register`, `ResetPassword`, `Unsubscribe`, `SubscriptionSuccess`, `DealerOS`, `Profile`, `AdminDashboard`, `NotFound`, `BidderRegistration`, `AuctionLotDetail`, `Sell`. Most of these are intentionally noindexed so JSON-LD isn't needed. `Compare` and `Cookies` are indexable and could benefit from minimal `BreadcrumbList` or `WebPage` schema.

### Duplicate / near-duplicate titles to watch
- `LotDetail` and `AuctionLotDetail` both bind to the same route with near-identical (but subtly different) title templates — see finding #2.
- `Categories` (`Equipment Categories | Browse Marketplace Equipment Families | Forestry Equipment Sales`) and the various category landing titles that include `Equipment Categories` in breadcrumbs — not a runtime collision but worth watching as taxonomy grows.

---

## 7. How to Flip the Site to Fully Indexable

### Single lever
Set `VITE_ALLOW_INDEXING=true` in the build environment (e.g. Firebase Hosting `env`, or `.env.production`), then rebuild and redeploy.

```bash
# .env.production
VITE_ALLOW_INDEXING=true
```

Because `import.meta.env.VITE_ALLOW_INDEXING` is resolved at build time by Vite, this requires a rebuild — not a runtime flag flip. Verify with:
```bash
# After build, grep the bundle for the default robots string
grep -r "max-image-preview:large" dist/assets/
```

### What becomes indexable
- `Home` (`/`)
- All static marketing pages (`/about`, `/ad-programs`, `/auctions`, `/blog`, `/calculator`, `/categories`, `/contact`, `/cookies`, `/dealers`, `/dmca`, `/faq`, `/financing`, `/logistics`, `/manufacturers`, `/our-team`, `/privacy`, `/sell`, `/states`, `/subscription-success`, `/terms`, `/forestry-equipment-for-sale`, `/logging-equipment-for-sale`)
- `ListingDetail` when `isLiveApprovedListing && !isQaOrTestListing`
- `AuctionDetail`, `LotDetail` (and `AuctionLotDetail` where it actually renders)
- `BlogPostDetail` (subject to the canonical bug — see §6 finding #1 before launching)
- `SellerProfile` base route `/dealers/:id` and `/dealers/:id/inventory`
- `/dealers/:id/:categorySlug` when it has ≥2 listings
- `Search` only when accessed via `/categories/:categorySlug` (the `CategorySearchPage` wrapper)
- All SEO landing pages in §4.4–§4.9 once they clear their per-route threshold (usually ≥2 listings)

### What stays `noindex` (and why)
- `/admin` — hardcoded `noindex, nofollow`. **Correct.** Internal tooling.
- `/profile` — hardcoded `noindex, nofollow`. **Correct.** Per-user workspace.
- `/register`, `/login`, `/reset-password`, `/unsubscribe`, `/dealer-os` — hardcoded `NOINDEX_ROBOTS`. **Correct.** Auth/authenticated workspaces.
- `/404` and `*` catch-all — hardcoded `noindex, …`. **Correct.** 404 page.
- `/search` (bare, without category context) — hardcoded `noindex, follow`. **Correct.** Infinite filter permutations.
- Listings that are not approved+paid+active, or that contain QA/test tokens in their fields — `NOINDEX_ROBOTS`. **Correct.** Prevents test data from leaking into index.
- SEO landing pages below their route-quality threshold — `noindex, follow`. **Correct.** Prevents thin-content penalties.

### Before flipping
Fix the critical bugs first:
1. `BlogPostDetail.getNewsPostCanonicalPath` backslash bug (see finding #1) — otherwise every blog post with a `seoSlug` emits a broken canonical URL.
2. Resolve the duplicate `/auctions/:auctionSlug/lots/:lotNumber` route (see finding #2).
3. Reconcile `robots.txt` host (`www.forestryequipmentsales.com`) with `Seo.tsx` `BASE_URL` (`forestryequipmentsales.com`). Pick the canonical host, update the other.
4. Consider updating `index.html`'s hardcoded `robots` so the pre-hydration value matches the JS-written post-hydration value for whichever mode production actually deploys in.
5. (Optional) Decide whether to mount or delete the unused `CategoryLandingPage` and `DealerDirectoryPage` exports.

Once those are in place, flipping `VITE_ALLOW_INDEXING=true` is safe and will put the full marketplace on the index track.
