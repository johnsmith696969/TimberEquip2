# Finished SEO Architecture

Prepared: April 2, 2026  
Project: Forestry Equipment Sales  
Primary live host: `https://timberequip.com`

## Executive Direction

The right sequence is:

1. Fix the live SEO blockers now.
2. Build the qualified public route graph now.
3. Move the relational SEO source of truth into PostgreSQL next.

Do not wait for the full PostgreSQL migration before improving SEO. That would delay the most urgent wins:

- canonical host consistency
- server-rendered homepage and qualified landing pages
- dealer/storefront entity completeness
- sitemap correctness
- dealer namespace consistency
- structured data quality

At the same time, do not treat Firestore as the permanent SEO publishing engine. PostgreSQL should become the long-term canonical relational layer for manufacturers, models, categories, dealers, listings, states, cities, and precomputed route facts.

## What Was Needed Immediately

Forestry Equipment Sales was already close to a competitive structure, but it had several authority-breaking issues:

- mixed host canonicals between `timberequip.com` and `forestryequipmentsales.com`
- homepage still dependent on the generic app shell
- dealer/storefront public data too thin for strong `LocalBusiness`-style SEO
- old `/seller/*` namespace still leaking through canonical and save paths
- category SSR not fully wired in Hosting
- dealer location still too dependent on one freeform text field

Those issues prevent the platform from competing with ForestryTrader even if the page titles and descriptions look good.

## Competitive Target

The site should compete on the same commercial route families that ForestryTrader uses successfully:

- home
- market hub
- category pages
- manufacturer pages
- manufacturer plus category pages
- manufacturer plus model pages
- state landing pages
- dealer storefront pages
- listing detail pages
- editorial authority pages

The main principle is:

- search pages are UX
- qualified entity pages are ranking pages

That means:

- `/search` stays `noindex,follow`
- `/categories/*` can rank
- `/manufacturers/*` can rank
- `/states/*` can rank when thresholds are met
- `/dealers/*` can rank when the storefront is complete
- listing detail pages can rank when approved, public, paid, and complete

## Phase 1 Implementation Standard

These are the rules that should govern the live site right now.

### Canonical Host

Use one canonical host only:

- `https://timberequip.com`

Every canonical tag, Open Graph URL, Twitter image URL, sitemap URL, structured data URL, and server-rendered public page should use that host.

Legacy hosts should 301 into the canonical host once DNS and infrastructure are ready.

### Canonical Dealer Namespace

Dealer storefronts should use:

- `/dealers/{slug}`

Legacy aliases may still exist for continuity, but they should not be the canonical published route.

### Homepage

The homepage must be first-response HTML, not only browser-mutated metadata.

The homepage should act as a commercial directory front door and should link directly into:

- forestry equipment market hub
- categories
- manufacturers
- states
- dealers
- news and guides

### Category and Money Pages

Qualified route families must be first-response HTML:

- `/`
- `/forestry-equipment-for-sale`
- `/categories`
- `/categories/{slug}`
- `/manufacturers`
- `/manufacturers/{slug}`
- `/manufacturers/{slug}/models/{model}`
- `/states`
- `/states/{slug}/forestry-equipment-for-sale`
- `/dealers`
- `/dealers/{slug}`
- `/dealers/{slug}/inventory`
- `/dealers/{slug}/{category}`

### Search Experience

`/search` should remain the faceted browsing experience, not the primary ranking surface.

Rules:

- default robots: `noindex,follow`
- do not include query-string pages in sitemap
- do not let filtered search states compete with clean route families

## Dealer Storefront SEO Architecture

Dealer SEO is a major competitive opportunity because ForestryTrader is strong at seller and inventory discovery.

Every qualified dealer storefront should support structured business data, not only listing cards.

### Required Storefront Fields

- storefront name
- legal business name
- canonical slug
- tagline
- unique about section
- street address line 1
- street address line 2
- city
- county
- state or province
- postal code
- country
- derived location label
- latitude
- longitude
- public phone
- public email
- website
- logo
- cover image
- service area scopes
- service area states or provinces
- service area counties
- services offered categories
- services offered subcategories
- SEO title
- SEO description
- SEO keywords

### About Copy Standard

Dealer copy should be unique and descriptive. It should explain:

- what equipment the dealer specializes in
- what brands or machine families they handle
- what counties, states, provinces, or countries they serve
- what buyer support they provide
- whether they assist with financing, logistics, inspections, sourcing, or attachments
- why a buyer should trust them

Target range:

- 300 to 800 words

### Dealer Schema

Qualified dealer pages should publish:

- `LocalBusiness`
- `PostalAddress`
- `GeoCoordinates`
- `BreadcrumbList`
- `ItemList`

Recommended fields:

- `name`
- `url`
- `image`
- `logo`
- `telephone`
- `email`
- `description`
- `address`
- `geo`
- `areaServed`

## Competitive Relational SEO Model

This is the long-term architecture that should be built on PostgreSQL.

### Canonical Relational Entities

#### Manufacturers

- id
- slug
- normalized_name
- display_name
- active_listing_count

#### Models

- id
- manufacturer_id
- slug
- normalized_name
- display_name
- active_listing_count

#### Categories

- id
- family_name
- display_name
- plural_name
- slug
- priority
- is_indexable

#### States and Provinces

- id
- country_code
- name
- code
- slug

#### Cities

- id
- state_id
- name
- slug
- latitude
- longitude

#### Dealers

- id
- account_uid
- storefront_slug
- storefront_name
- legal_business_name
- address fields
- county
- city_id
- state_id
- country_code
- latitude
- longitude
- website
- phone
- email
- service_area_json
- services_offered_json
- inventory_count_active
- is_indexable

#### Listings

- id
- public_slug
- dealer_id
- manufacturer_id
- model_id
- category_id
- city_id
- state_id
- year
- price
- currency
- hours
- condition
- approval_status
- payment_status
- status
- is_public
- is_test
- published_at
- updated_at
- expires_at

#### Articles

- id
- slug
- article_type
- title
- summary
- content
- published_at
- updated_at
- is_indexable

### SEO Read Models

The route layer should publish from denormalized route documents, not raw transactional tables.

Required route read models:

#### `seo_route_index`

- route_key
- route_type
- path
- canonical_url
- title
- meta_description
- h1
- robots
- should_index
- sitemap_eligible
- quality_score
- listing_count
- dealer_count
- manufacturer_count
- model_count
- state_count
- fresh_listing_count_30d
- breadcrumb_json
- schema_json
- body_modules_json
- related_routes_json
- updated_at
- lastmod

#### `seo_route_listings`

- route_key
- listing_id
- position

#### `seo_route_links`

- route_key
- target_route_key
- position
- link_type

#### `sitemap_entries`

- url
- route_key
- lastmod
- sitemap_partition

## Final URL Architecture

### Core Pages

- `/`
- `/forestry-equipment-for-sale`
- `/categories`
- `/manufacturers`
- `/states`
- `/dealers`
- `/blog`
- `/guides`

### Categories

- `/categories/skidders`
- `/categories/forwarders`
- `/categories/feller-bunchers`
- `/categories/log-loaders`
- `/categories/delimbers`
- `/categories/wood-chippers`
- `/categories/firewood-processors`

### Manufacturers

- `/manufacturers/tigercat`
- `/manufacturers/john-deere`
- `/manufacturers/caterpillar`

### Manufacturer and Category

- `/manufacturers/tigercat/skidders-for-sale`
- `/manufacturers/john-deere/forwarders-for-sale`

### Manufacturer and Model

- `/manufacturers/tigercat/models/1075b`
- `/manufacturers/john-deere/models/648l-ii`

### States

- `/states/georgia/forestry-equipment-for-sale`
- `/states/minnesota/skidders-for-sale`

### Dealers

- `/dealers/red-pine-equipment`
- `/dealers/red-pine-equipment/inventory`
- `/dealers/red-pine-equipment/skidders`

### Listings

- `/equipment/2019-john-deere-648l-ii-macon-ga`

## Route Quality Rules

Do not index every possible combination.

### Minimum Standards

- category page: at least 5 live listings or strong evergreen content support
- manufacturer page: at least 3 live listings and recent inventory
- manufacturer plus category page: at least 4 live listings and 2 dealers
- manufacturer plus model page: at least 3 live listings
- state market page: at least 8 live listings and 3 dealers
- state category page: at least 5 live listings and 2 dealers
- dealer storefront: verified and complete with full business data and live inventory
- dealer category page: at least 3 live listings
- listing detail page: approved, public, paid, complete, not test

### Quality Score Inputs

- active listing count
- dealer diversity
- freshness
- image coverage
- spec completeness
- price completeness
- business data completeness
- uniqueness of copy
- internal links

## Metadata Rules

### Global

- unique title
- unique description
- self-canonical for strong routes
- `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`
- Open Graph
- Twitter card
- JSON-LD

### Do Not Depend On

- meta keywords
- thin FAQ spam
- filter combinations
- querystring canonicals

## Sitemap Design

Use a sitemap index.

Recommended partitions:

- `/sitemap.xml`
- `/sitemaps/static.xml`
- `/sitemaps/categories.xml`
- `/sitemaps/manufacturers.xml`
- `/sitemaps/models.xml`
- `/sitemaps/states.xml`
- `/sitemaps/dealers.xml`
- `/sitemaps/listings-001.xml`
- `/sitemaps/listings-002.xml`
- `/sitemaps/articles.xml`

Rules:

- only `should_index = true`
- exclude search
- exclude test and QA URLs
- use `lastmod`

## Internal Linking System

The platform must behave like an entity graph, not isolated pages.

### Required Link Patterns

Home should link to:

- top categories
- top manufacturers
- top states
- featured dealers
- featured listings

Category pages should link to:

- relevant manufacturers
- relevant states
- relevant dealers
- related articles

Manufacturer pages should link to:

- models
- categories
- states
- dealer storefronts

Dealer pages should link to:

- inventory
- category routes
- related categories
- contact and service coverage

Listing detail pages should link to:

- category
- manufacturer
- model
- dealer
- state
- related listings

## Content Authority Layer

To compete with ForestryTrader, inventory alone is not enough.

Priority content clusters:

- used skidder buying guide
- forwarder buying guide
- log loader buying guide
- feller buncher buying guide
- Tigercat vs John Deere comparisons
- used forestry equipment pricing guide
- equipment financing guides
- equipment shipping guides
- dealer spotlights

Every guide should link into:

- one category page
- two to four manufacturer or model pages
- one or more dealer pages when appropriate

## Implementation Sequence

### Implement Immediately

- canonical host cleanup to `timberequip.com`
- homepage SSR through the public route layer
- `/categories` and `/categories/*` Hosting rewrites into public SSR
- dealer namespace cleanup to `/dealers/*`
- dealer structured data completeness
- structured storefront fields
- geocoded dealer coordinates from address

### Implement Next

- listing detail first-response SSR
- sitemap index and shards
- route threshold hardening
- test-data suppression from public SEO surfaces
- regional state page strengthening

### Implement On PostgreSQL

- canonical entity graph
- normalized make/model/category/location tables
- route scoring materialization
- incremental sitemap rebuilds
- freshness-aware route modules
- article-to-entity linking

## Recommendation On PostgreSQL Move

Do the PostgreSQL move next for the SEO engine, but do not block the live SEO corrections on it.

Best sequence:

1. ship the live authority fixes now
2. finalize dealer/storefront structured data
3. move canonical SEO entities and route computation into PostgreSQL
4. then launch the full relational competitive build at scale

That sequence gives the fastest business improvement without locking the architecture into a long-term Firestore SEO ceiling.

## Bottom Line

The platform can compete with ForestryTrader if it behaves like a structured publishing engine:

- one host
- one dealer namespace
- one qualified route graph
- one dealer entity standard
- one relational SEO source of truth

The immediate work belongs in the live app now.

The scalable moat belongs in PostgreSQL next.
