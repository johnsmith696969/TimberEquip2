# TimberEquip — Full SEO Audit
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
  imagePath?: string;         // defaults to '/TimberEquip-Logo.png?v=20260405c'
  preloadImage?: string;      // optional LCP hero preload
}
```

- **Default title:** N/A — `title` is a required prop, there is no fallback. Any page that fails to render its Seo component will leave the title from `index.html` in place.
- **Base URL:** `const BASE_URL = 'https://timberequip.com';`
- **Default OG image:** `'/TimberEquip-Logo.png?v=20260405c'` (resolved against BASE_URL if not absolute).
- **Default OG type:** `'website'`.
- **OG site name:** hardcoded as `'TimberEquip'`.

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
<title>TimberEquip | New &amp; Used Logging Equipment For Sale</title>
<meta name="description" content="TimberEquip marketplace for in-stock new and used logging equipment. Filter by category, manufacturer, model, price, hours, condition, and location." />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta property="og:site_name" content="TimberEquip" />
<meta property="og:type" content="website" />
<meta property="og:title" content="TimberEquip | New &amp; Used Logging Equipment For Sale" />
<meta property="og:description" content="TimberEquip marketplace for in-stock new and used logging equipment. Filter by category, manufacturer, model, price, hours, condition, and location." />
<meta property="og:url" content="https://timberequip.com/" />
<meta property="og:image" content="https://timberequip.com/TimberEquip-Brand-Logo-Header-Email.png?v=20260405c" />
<link rel="canonical" href="https://timberequip.com/" />
```

**Note:** the pre-hydration `<meta name="robots">` in `index.html` is hardcoded to `index, follow, …` regardless of `VITE_ALLOW_INDEXING`. This is only the first-paint value; React's `<Seo>` component overwrites it on hydration with the env-gated `DEFAULT_ROBOTS` (or the explicit prop). Crawlers that execute JS will see the final React-written value; crawlers that do not (or snapshot before hydration) see the `index, follow` default.

---

### `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://www.timberequip.com/sitemap.xml
```

This file is **fully permissive** — nothing is disallowed. All gating happens via per-page `<meta name="robots">`.

---

## 2. Static Pages

All routes below are mounted in `src/App.tsx`. "default" in the Robots column means the page does not pass an explicit `robots` prop and therefore inherits `DEFAULT_ROBOTS` from `Seo.tsx` (i.e. indexable only when `VITE_ALLOW_INDEXING=true`).

| Route | Component | Tab Title | Meta Description | Canonical | Robots | JSON-LD |
|-------|-----------|-----------|------------------|-----------|--------|---------|
| `/` | `Home` | `Logging Equipment For Sale \| TimberEquip` | `Buy and Sell New & Used Forestry/Logging Equipment on our marketplace. Find skidders, feller bunchers, forwarders, processors, and more for sale near you. Browse the best forestry equipment at timberequip.com` | `/` | default | `@graph`: `Organization`, `WebSite`, `CollectionPage`, `ItemList` |
| `/about` and `/about-us` | `About` | `About Us \| TimberEquip` | `Learn why TimberEquip was built, who we serve, and how our marketplace helps contractors, dealers, and buyers move equipment faster.` | `/about` | default | `AboutPage` + `Organization` + `BreadcrumbList` |
| `/ad-programs` | `AdPrograms` | `Seller Ad Programs \| List Equipment \| TimberEquip` | `Choose an Owner-Operator, Dealer, or Pro Dealer subscription to list forestry equipment on the TimberEquip marketplace.` | `/ad-programs` | default | `Service` + `BreadcrumbList` |
| `/admin` (+ `?tab=*`) | `AdminDashboard` | `${dashboardHeading} \| TimberEquip` (dashboardHeading = Account Overview / Machine Inventory / Lead Monitoring / Call Logs / Performance Tracking / Account Directory / Billing Account / Content Studio / Dealer Feed Manager / Auction Management / Taxonomy Manager / Operator Directory / Profile Settings) | When `activeTab==='overview'`: `Review live TimberEquip marketplace operations, inventory, leads, and account activity.`; else: `Manage ${dashboardHeading.toLowerCase()} in the TimberEquip admin workspace.` | `/admin` when `activeTab==='overview'`, else `` /admin?tab=${activeTab} `` | **`noindex, nofollow`** (hardcoded) | none |
| `/auctions` | `Auctions` | `Equipment Auctions \| TimberEquip` | `Browse active and upcoming forestry equipment auctions, review bidder requirements and auction terms, and bid on logging machines, land clearing equipment, trucks, and trailers.` | `/auctions` | default | `CollectionPage` |
| `/auctions/:auctionSlug/register` | `BidderRegistration` | `` `${auction ? `${auction.title} \| ` : ''}Register to Bid \| TimberEquip` `` | `Complete bidder registration, identity verification, and payment setup for the auction.` | *(not set — missing)* | default | none |
| `/blog` | `Blog` | `Equipment News \| Market Reports & Industry Updates \| TimberEquip` | `Stay up to date with forestry equipment market reports, industry news, price trends, and inventory analysis from TimberEquip.` | `/blog` | default | `@graph`: `Blog`, `BreadcrumbList` |
| `/bookmarks` | `Bookmarks` | `Saved Equipment \| TimberEquip` | `Your bookmarked forestry equipment listings on TimberEquip.` | `/bookmarks` | default | none |
| `/calculator` | `Calculator` | `Equipment Financing Calculator \| TimberEquip` | `Estimate monthly payments on forestry and logging equipment. Adjust price, down payment, term, and interest rate to plan your next purchase.` | `/calculator` | default | none |
| `/categories` | `Categories` | `Equipment Categories \| Browse Marketplace Equipment Families \| TimberEquip` | `Browse TimberEquip inventory by major equipment family including logging equipment, land clearing equipment, firewood equipment, trucks, trailers, and more.` | `/categories` | default | `CollectionPage` with `hasPart` array of `Collection` |
| `/compare` | `Compare` | `Compare Equipment \| TimberEquip` | `Compare forestry equipment listings side by side. Review specs, pricing, hours, and condition to find the right machine.` | `/compare` | default | none |
| `/contact` | `Contact` | `Contact TimberEquip \| Sales, Support, and Dealer Help` | `Contact TimberEquip for buying help, seller support, dealer storefront questions, financing requests, and logistics coordination.` | `/contact` | default | `@graph`: `ContactPage`, `Organization` (with `ContactPoint`), `BreadcrumbList` |
| `/cookies` | `Cookies` | `Cookie Policy \| TimberEquip` | `Learn how TimberEquip uses cookies, localStorage, and tracking technologies. Manage your preferences and understand your choices.` | `/cookies` | default | none (just `ogType: 'website'` explicit) |
| `/dealer-os` | `DealerOS` | `DealerOS \| TimberEquip` | `Manage your dealer inventory, leads, feed imports, and storefront settings.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/dealers` | `Dealers` | `Find Forestry Equipment Dealers & Manufacturers \| TimberEquip` | `Search forestry equipment dealers and manufacturers by name, state, country, and category. Sort by nearest location. Browse dealer and pro dealer storefronts.` | `/dealers` | default | `@graph`: `CollectionPage`, `BreadcrumbList`, `ItemList` of `Organization` |
| `/dmca` | `Dmca` | `DMCA Policy \| TimberEquip` | `Digital Millennium Copyright Act (DMCA) policy for TimberEquip. Takedown procedures, counter-notifications, designated agent, and repeat infringer policy.` | `/dmca` | default | none |
| `/faq` | `Faq` | `Logging Equipment Marketplace FAQ \| Buyers, Sellers, and Dealers` | `Find answers about buying, selling, financing, shipping, dealer storefronts, approvals, and equipment listings on TimberEquip.` | `/faq` | default | `@graph`: `FAQPage` (`Question`/`Answer`), `BreadcrumbList` |
| `/financing` | `Financing` | `Equipment Financing \| Apply for Credit \| TimberEquip` | `Apply for flexible forestry equipment financing with fast approvals, competitive rates, and terms up to 84 months through TimberEquip.` | `/financing` | default | `@graph`: `Service`, `BreadcrumbList` |
| `/logistics` | `Logistics` | `Global Logistics \| Trucking Request Form \| TimberEquip` | `Request trucking and heavy-haul coordination for forestry equipment with the TimberEquip logistics team.` | `/logistics` | default | `@graph`: `Service`, `Place`, `BreadcrumbList` |
| `/login` | `Login` | `Sign In \| TimberEquip` | `Sign in to your TimberEquip account to manage listings, view saved equipment, and access dealer tools.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/manufacturers` | `Manufacturers` | `Equipment Manufacturers \| TimberEquip` | `Browse equipment manufacturers with direct paths into live marketplace inventory, top machine categories, and regional availability.` | `/manufacturers` | default | `CollectionPage` with `ListItem` entries |
| `/404` and `*` (catch-all) | `NotFound` | `Page Not Found \| TimberEquip` | `The page you requested could not be found. Browse live equipment inventory, categories, dealers, or return to the TimberEquip homepage.` | `/404` | **`noindex, nofollow, noarchive, nosnippet, noimageindex`** (hardcoded) | none |
| `/our-team` and `/about/our-team` | `OurTeam` | `Our Team \| TimberEquip` | `Meet the TimberEquip team behind the marketplace, logistics coordination, customer support, and platform development.` | `/our-team` | default | `@graph`: `AboutPage`, `Organization` with `Person[]`, `BreadcrumbList` |
| `/privacy` | `Privacy` | `Privacy Policy \| TimberEquip` | `Learn how TimberEquip collects, uses, and protects your data. GDPR, CCPA, and COPPA compliant. Data encryption, third-party processors, and your rights explained.` | `/privacy` | default | `@graph`: `WebPage`, `BreadcrumbList` |
| `/profile` (+ `?tab=*`) | `Profile` | `` `${activeTab} \| TimberEquip` `` | Overview: `Manage your TimberEquip account, listings, saved equipment, and subscription settings.`; else: `` `Manage ${activeTab.toLowerCase()} from your TimberEquip account workspace.` `` | `/profile` for overview, else `` `/profile?tab=${encodeURIComponent(activeTab)}` `` | **`noindex, nofollow`** (hardcoded) | none |
| `/register` | `Register` | `Create Account \| TimberEquip` | `Register for a free account to browse, bookmark, and inquire on forestry equipment. Sellers can subscribe to list machines.` | `/register` | **`noindex, nofollow`** (hardcoded) | none |
| `/reset-password` | `ResetPassword` | `Reset Password \| TimberEquip` | `Securely reset your TimberEquip account password.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/sell` | `Sell` (via `SellWorkspaceRoute` wrapper) | `Sell Equipment \| List Your Machine Fast` | `List your equipment with category specs, photos, optional video, and a quick condition checklist.` | `/sell` | default | none |
| `/states` | `States` | `Equipment Markets By State \| TimberEquip` | `Browse state-level market pages for forestry and logging equipment, with direct paths into live public inventory.` | `/states` | default | `CollectionPage` with `ListItem` entries |
| `/subscription-success` | `SubscriptionSuccess` | `Subscription Success \| TimberEquip` | `Confirm your TimberEquip seller subscription and continue into your account.` | `/subscription-success` | default | none |
| `/terms` | `Terms` | `Terms of Service \| TimberEquip` | `Terms of service governing the use of the TimberEquip marketplace, including listing rules, auction bidding terms, billing, dispute resolution, and governing law.` | `/terms` | default | `@graph`: `WebPage`, `BreadcrumbList` |
| `/unsubscribe` | `Unsubscribe` | `Unsubscribe \| TimberEquip` | `Manage your email notification preferences for TimberEquip.` | *(not set — missing)* | **`NOINDEX_ROBOTS`** | none |
| `/forestry-equipment-for-sale` | `ForestryHubPage` (templated — see §4) | `Forestry Equipment for Sale \| New & Used Machines \| TimberEquip` | static string (see §4) | `/forestry-equipment-for-sale` | default | CollectionPage + BreadcrumbList + ItemList |
| `/logging-equipment-for-sale` | `LoggingHubPage` (templated — see §4) | `Logging Equipment For Sale \| TimberEquip` | static string (see §4) | `/logging-equipment-for-sale` | default | CollectionPage + BreadcrumbList + ItemList |

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
  ? `${detailSeoHeadline} for Sale in ${safeCityState} | TimberEquip`
  : `${detailSeoHeadline} for Sale | TimberEquip`;
```

**Description template**
```ts
const detailSeoDescription = [
  `Used ${detailSeoHeadline} ${routeCategory ? `${routeCategory.toLowerCase()} ` : ''}for sale${safeCityState ? ` in ${safeCityState}` : ''}`
    .replace(/\s+/g, ' ').trim(),
  safeHours > 0 ? `with ${formatNumber(safeHours)} hours.` : 'View photos, specs, and pricing details.',
  'Request pricing, financing, and logistics support from TimberEquip.',
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

**Tab title**: `` `${auction.title} | Auction Catalog | TimberEquip` ``
**Description**: `` auction.description || `Browse lots and bid on ${auction.title}. Forestry equipment auction.` ``
**Canonical**: `` `/auctions/${auction.slug}` ``
**Robots**: not set → default (env-gated).
**JSON-LD**: `{ '@type': 'Event', name, description, startDate, endDate, url, image, organizer: {@type: 'Organization', name: 'TimberEquip'} }`

**Notes**: the entire `<Seo>` is only rendered when `auction` has loaded (`{auction && <Seo ... />}`), so a failed load leaves the `index.html` defaults in place.

---

### 3.3 `LotDetail` — `/auctions/:auctionSlug/lots/:lotNumber` (primary binding)

**Tab title template**:
```ts
title={`Lot #${lot.lotNumber} – ${lot.year} ${lot.manufacturer} ${lot.model} | ${auction.title} | TimberEquip`}
```

**Description template**:
```ts
description={`Bid on Lot #${lot.lotNumber}: ${lot.year} ${lot.manufacturer} ${lot.model}. ${lot.pickupLocation ? `Pickup: ${lot.pickupLocation}.` : ''} Auction by TimberEquip.`}
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
(no `| TimberEquip` suffix)

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
if (!seller) return 'Dealer Storefront | TimberEquip';
const headline = seller.storefrontName || seller.name;
if (isDealerRoute && categorySlug) return `${headline} ${titleCaseSlug(categorySlug)} Inventory | TimberEquip`;
if (isDealerRoute && isInventoryRoute) return `${headline} Inventory | TimberEquip`;
return seller.seoTitle || `${headline} | ${roleLabel(seller.role)} | TimberEquip`;
```

**Description (memoized)**
```ts
if (!seller) return 'Browse seller storefront inventory on TimberEquip.';
const headline = seller.storefrontName || seller.name;
if (isDealerRoute && categorySlug) return `Browse ${titleCaseSlug(categorySlug).toLowerCase()} inventory from ${headline} on TimberEquip.`;
if (isDealerRoute && isInventoryRoute) return `Browse live inventory from ${headline} on TimberEquip.`;
return seller.seoDescription || seller.storefrontDescription ||
  `${headline} storefront on TimberEquip. Browse inventory, contact details, and active listings.`;
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

**Tab title**: `` `${post.seoTitle || post.title} | TimberEquip` ``
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
  ? `${categoryLabel} for Sale | New & Used ${categoryLabel} | TimberEquip`
  : filters.q
    ? `TimberEquip | ${filters.q} Listings (${filteredListings.length})`
    : 'TimberEquip | New & Used Logging Equipment For Sale';
```

**Description**
```ts
const seoDescription = isCategoryPage
  ? `Browse ${filteredListings.length.toLocaleString()} new and used ${categoryLabel.toLowerCase()} listings for sale. Compare prices, specs, and photos from dealers and private sellers on TimberEquip.`
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
<Seo title={`${title} | TimberEquip`} description={description} canonicalPath={canonicalPath} robots={robots} jsonLd={jsonLd} />
```

So the final browser title is always `${templateTitle} | TimberEquip`. The `jsonLd` is built by `buildCollectionJsonLd(title, description, canonicalPath, listings, breadcrumbs)` which returns:

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

- **Tab title**: `Forestry Equipment for Sale | New & Used Machines | TimberEquip`
- **Description**: `Browse new and used forestry equipment for sale including logging, land clearing, firewood, sawmill, truck, trailer, and attachment inventory from dealers and owners.`
- **Canonical**: `` `/${MARKET_ROUTE_LABELS.forestry}` `` → `/forestry-equipment-for-sale`
- **Eyebrow**: `Equipment Marketplace`
- **Intro**: `Browse the full TimberEquip marketplace. Shop live inventory across logging, land clearing, firewood, sawmill, tree service, truck, trailer, and parts categories from dealers and private sellers.`
- **Breadcrumbs**: `Home` → `Forestry Equipment For Sale`
- **Robots**: **not passed** → default (env-gated). The hub page does **not** call `evaluateRouteQuality` — it is always default-indexable.
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.2 `LoggingHubPage` — `/logging-equipment-for-sale`

- **Tab title**: `Logging Equipment For Sale | TimberEquip`
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
  // final: `${displayTitle} | TimberEquip`
  ```
- **Description template**:
  ```ts
  `Browse ${resolvedCategory.toLowerCase()} for sale on TimberEquip. ${parentCategory ? `Shop ${parentCategory.toLowerCase()} inventory` : 'Shop live inventory'} from dealers and private sellers across North America.`
  ```
- **Canonical template**: `buildCategoryPath(resolvedCategory)` (forms `/categories/<slug>-for-sale` or similar per `seoRoutes.ts`).
- **Intro**: `` `Shop ${resolvedCategory.toLowerCase()} from trusted dealers and private sellers. Browse live inventory, compare prices, and connect directly with sellers to move fast on the equipment you need.` ``
- **Robots**: `quality.robots` from `evaluateRouteQuality('category', categoryListings.length, { fallbackPath: '/categories' })`. 0 → redirect; 1 → `noindex, follow`; ≥2 → default.
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.4 `ManufacturerLandingPage` — `/manufacturers/:manufacturerSlug`

- **Tab title template**: `` `${resolvedManufacturer} Equipment For Sale | TimberEquip` ``
- **Description template**: `` `Browse ${resolvedManufacturer} equipment for sale by make on TimberEquip. Shop live ${resolvedManufacturer} inventory from dealers and private sellers across North America.` ``
- **Canonical template**: `buildManufacturerPath(resolvedManufacturer)`
- **Intro**: `mfgContent.description` (from `constants/manufacturerContent`)
- **Breadcrumbs**: `Home` → `Manufacturers` → resolved manufacturer
- **Robots**: `quality.robots` from `evaluateRouteQuality('manufacturer', mfgListings.length, { fallbackPath: '/manufacturers' })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList. Also renders a `<aboutContent>` section with the manufacturer description, founded year, headquarters.

---

### 4.5 `ManufacturerModelLandingPage` — `/manufacturers/:manufacturerSlug/models/:modelSlug`

- **Tab title template**: `` `${resolvedManufacturer} ${resolvedModel} For Sale | TimberEquip` ``
- **Description template**: `` `Browse ${resolvedManufacturer} ${resolvedModel} for sale on TimberEquip. Shop live inventory from dealers and private sellers.` ``
- **Canonical template**: `buildManufacturerModelPath(resolvedManufacturer, resolvedModel)`
- **Intro**: `` `Find ${resolvedManufacturer} ${resolvedModel} machines for sale from dealers and private sellers. Compare pricing, hours, and condition across available inventory.` ``
- **Breadcrumbs**: `Home` → `Manufacturers` → manufacturer → model
- **Robots**: `evaluateRouteQuality('manufacturerModel', filteredListings.length, { fallbackPath: buildManufacturerPath(resolvedManufacturer) })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.6 `ManufacturerCategoryLandingPage` — `/manufacturers/:manufacturerSlug/:categorySaleSlug`

- **Tab title template**: `` `${resolvedManufacturer} ${resolvedCategory} For Sale | TimberEquip` ``
- **Description template**: `` `Browse ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} for sale on TimberEquip. Shop live inventory from dealers and private sellers.` ``
- **Canonical template**: `buildManufacturerCategoryPath(resolvedManufacturer, resolvedCategory)`
- **Intro**: `` `Shop ${resolvedManufacturer} ${resolvedCategory.toLowerCase()} from dealers and private sellers. Compare available machines, pricing, and hours across live marketplace inventory.` ``
- **Breadcrumbs**: `Home` → manufacturer → `${resolvedCategory}`
- **Robots**: `evaluateRouteQuality('manufacturerCategory', filteredListings.length, { fallbackPath: buildManufacturerPath(resolvedManufacturer) })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList. Includes `subcategoryExplainer`.

Note: `categorySaleSlug` is expected to end in `-for-sale` and is parsed with `parseForSaleSlug` (strips the suffix).

---

### 4.7 `ManufacturerModelCategoryLandingPage` — `/manufacturers/:manufacturerSlug/models/:modelSlug/:categorySaleSlug`

- **Tab title template**: `` `${resolvedManufacturer} ${resolvedModel} ${resolvedCategory} For Sale | TimberEquip` ``
- **Description template**: `` `Browse ${resolvedManufacturer} ${resolvedModel} ${resolvedCategory.toLowerCase()} for sale on TimberEquip. Shop live inventory from dealers and private sellers.` ``
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
  // title: `${marketTitle} In ${resolvedState} | TimberEquip`
  ```
- **Description template**: `` `Browse ${marketTitle.toLowerCase()} in ${resolvedState} on TimberEquip. Shop live inventory from local dealers and private sellers.` ``
- **Canonical template**: `buildStateMarketPath(resolvedState, marketKey)`
- **Intro**: `` `Shop ${marketTitle.toLowerCase()} located in ${resolvedState}. Browse inventory from local dealers and private sellers, compare prices, and connect directly with sellers near you.` ``
- **Breadcrumbs**: `Home` → `States` → resolvedState
- **Robots**: `evaluateRouteQuality('stateMarket', stateListings.length, { fallbackPath: '/states' })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList.

---

### 4.9 `StateCategoryLandingPage` — `/states/:stateSlug/:categorySaleSlug`

- **Tab title template**: `` `${resolvedCategory} For Sale In ${resolvedState} | TimberEquip` ``
- **Description template**: `` `Browse ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} on TimberEquip. Shop live inventory from local dealers and private sellers.` ``
- **Canonical template**: `buildStateCategoryPath(resolvedState, resolvedCategory)`
- **Intro**: `` `Find ${resolvedCategory.toLowerCase()} for sale in ${resolvedState} from dealers and private sellers. Browse available inventory, compare pricing, and reach out to sellers directly.` ``
- **Breadcrumbs**: `Home` → state (→ forestry market path) → category
- **Robots**: `evaluateRouteQuality('stateCategory', filteredListings.length, { fallbackPath: buildStateMarketPath(resolvedState, 'forestry') })` (threshold 2).
- **JSON-LD**: CollectionPage + BreadcrumbList + ItemList. Includes `subcategoryExplainer`.

Note: the two market slugs (`logging-equipment-for-sale`, `forestry-equipment-for-sale`) on `/states/:stateSlug/:slug` are caught first by the two `StateMarketLandingPage` routes declared above this one in `App.tsx`, so this component only fires for a true category slug.

---

### 4.10 `DealerDirectoryPage` — *exported but not mounted*

This component exists and is exported, but **no route in `App.tsx` renders it**. The `/dealers` route is bound to the `Dealers` page (from `src/pages/Dealers.tsx`) instead. It appears to be legacy/scaffold code.

- **Tab title**: `Logging Equipment Dealers | TimberEquip`
- **Description**: `Browse active dealer storefronts on TimberEquip. Find trusted dealers selling new and used logging and forestry equipment.`
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

4. **Missing `canonicalPath` on several noindex'd pages.** `Login`, `ResetPassword`, `Unsubscribe`, `DealerOS`, `BidderRegistration`. The `<Seo>` component tolerates this (falls back to `BASE_URL`), but every page should set its own canonical to avoid a self-referential root `og:url`. This is especially important for `Unsubscribe` and `ResetPassword` where the URL carries token query params — without a canonical, the `og:url` posts back as `https://timberequip.com` which is fine, but still a minor hygiene fix.

5. **Brand inconsistency in the codebase.** File names and asset names are a mix of `Forestry_Equipment_Sales_*` (older brand) and `TimberEquip-*` (current brand). The `<Seo>` component emits `og:site_name: 'TimberEquip'` and `index.html` emits the same, but git shows many `Forestry_Equipment_Sales_*.png`/`.svg` files currently modified. Titles/descriptions are consistent on "TimberEquip" — the exposure is only asset references (not SEO copy).

6. **`Categories.tsx` wraps `Seo` on a single line (~161 chars)** — functional but inconsistent with every other page which uses multiline JSX. Cosmetic only.

7. **`Home` page title does not include "TimberEquip" at the start.** `Logging Equipment For Sale | TimberEquip` vs the OG default from `index.html` which is `TimberEquip | New & Used Logging Equipment For Sale`. Keep one canonical form on the homepage. The mismatch produces a minor discrepancy between pre-hydration and post-hydration titles.

### MEDIUM

8. **Duplicate tab title for `/dealers`.** `Dealers.tsx` renders title `Find Forestry Equipment Dealers & Manufacturers | TimberEquip` — but `SeoLandingPages.DealerDirectoryPage` (unmounted but still compiled) uses `Logging Equipment Dealers | TimberEquip`. Not a runtime collision today because the second component is unmounted.

9. **Canonicals for `/about` and `/our-team` collapse duplicate routes.** Both `/about` and `/about-us` render the `About` component which emits `canonicalPath="/about"`. Both `/our-team` and `/about/our-team` render `OurTeam` which emits `canonicalPath="/our-team"`. This is correct deduplication — noting for completeness.

10. **`AdminDashboard` and `Profile` canonical include query strings.** `canonicalPath={/admin?tab=${activeTab}}` and `/profile?tab=${encodeURIComponent(activeTab)}`. These pages are hardcoded `noindex, nofollow` so it does not affect crawlers, but canonical URLs conventionally do not include query-string variants. Not critical.

11. **`AdminDashboard` canonical uses `/admin?tab=overview` → no, it uses `/admin`** when activeTab is overview. Confirmed correct.

12. **`index.html` robots is `index, follow, …` but `Seo.tsx` default is gated on `VITE_ALLOW_INDEXING`.** Result: crawlers running JS get the gated value; crawlers snapshotting the raw HTML see `index, follow`. If the project is deploying an un-indexable preview build to public hosting, the raw HTML will mislead crawlers. Either update `index.html` to `noindex, nofollow, noarchive, nosnippet, noimageindex` by default and let the Seo component opt-in to `index` when `VITE_ALLOW_INDEXING` is true, OR accept the behavior if production will always ship with `VITE_ALLOW_INDEXING=true`.

13. **`public/robots.txt` points to `https://www.timberequip.com/sitemap.xml` but the canonical `BASE_URL` in `Seo.tsx` is `https://timberequip.com` (no www).** Inconsistent host — pick one. If `www` is the intended canonical, update `Seo.tsx`; if not, update `robots.txt`.

### LOW

14. **`BidderRegistration` has no canonical.** Minor — the page is behind auction approval flow and not targeted for indexing; default robots currently noindex it anyway.

15. **Inconsistent use of `| TimberEquip` suffix inside the title.** Most pages use `| TimberEquip` suffix. `ListingDetail` includes it. `AuctionLotDetail` omits it (`Lot ${n} | ${auction.title}` with no trailing suffix). `AuctionDetail` includes it. `LotDetail` includes it. The `SeoInventoryTemplate` appends `| TimberEquip` itself, so landing pages are consistent.

16. **`Profile` tab title starts with the activeTab label (lowercase/formatted enum)** which may produce awkward titles like `Billing | TimberEquip` or the raw tab alias. Acceptable because it's noindex.

### Pages without a `<Seo>` component at all
Every user-facing page file in `src/pages/*.tsx` imports and renders `<Seo>`. Two exceptions worth noting:
- `App.tsx` helper wrappers (`RedirectSellerToDealer`, `AccountWorkspaceRedirect`, `RouteLoadingFallback`, `SellWorkspaceRoute`, `ProfileWorkspaceRoute`) — these are passthrough redirects or loading states, not real pages, so no Seo is expected.
- `Sell.tsx` — it *does* include a `<Seo>` (line 303). Complete.

### Pages with no JSON-LD
`Bookmarks`, `Calculator`, `Compare`, `Cookies`, `Dmca`, `Login`, `Register`, `ResetPassword`, `Unsubscribe`, `SubscriptionSuccess`, `DealerOS`, `Profile`, `AdminDashboard`, `NotFound`, `BidderRegistration`, `AuctionLotDetail`, `Sell`. Most of these are intentionally noindexed so JSON-LD isn't needed. `Compare` and `Cookies` are indexable and could benefit from minimal `BreadcrumbList` or `WebPage` schema.

### Duplicate / near-duplicate titles to watch
- `LotDetail` and `AuctionLotDetail` both bind to the same route with near-identical (but subtly different) title templates — see finding #2.
- `Categories` (`Equipment Categories | Browse Marketplace Equipment Families | TimberEquip`) and the various category landing titles that include `Equipment Categories` in breadcrumbs — not a runtime collision but worth watching as taxonomy grows.

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
3. Reconcile `robots.txt` host (`www.timberequip.com`) with `Seo.tsx` `BASE_URL` (`timberequip.com`). Pick the canonical host, update the other.
4. Consider updating `index.html`'s hardcoded `robots` so the pre-hydration value matches the JS-written post-hydration value for whichever mode production actually deploys in.
5. (Optional) Decide whether to mount or delete the unused `CategoryLandingPage` and `DealerDirectoryPage` exports.

Once those are in place, flipping `VITE_ALLOW_INDEXING=true` is safe and will put the full marketplace on the index track.
