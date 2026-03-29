# TimberEquip Launch SEO Blueprint

## Purpose

This document is the launch SEO blueprint for TimberEquip.

Companion execution documents:

- `SEO_IMPLEMENTATION_BACKLOG.md`
- `SEO_PHASE_1_URL_MAP_AND_TEMPLATES.md`
- `ENTERPRISE_SEO_ARCHITECTURE_PLAN.md`

It is designed for a future public launch when TimberEquip is ready to be indexable and compete for commercial search demand across:

- forestry equipment
- logging equipment
- forestry equipment for sale
- logging equipment for sale when it is a distinct vertical rather than a duplicate alias
- logging equipment for sale by state
- logging equipment for sale by manufacturer
- logging equipment for sale by dealer/storefront
- category + state + manufacturer combinations
- manufacturer + model combinations

This blueprint assumes the current repo remains in noindex mode until launch readiness is complete.

## Current Position

### Current strengths

- Strong marketplace concept in a defensible niche
- Clean listing URL support via `/listing/:id/:slug`
- Existing SEO component in `src/components/Seo.tsx`
- Existing breadcrumb schema in `src/components/Breadcrumbs.tsx`
- Existing CollectionPage, ItemList, and dealer/listing JSON-LD patterns in public surfaces
- Existing seller/storefront page foundation at `/seller/:id`
- Hybrid public SSR layer already exists for major route families
- Dynamic sitemap generation already exists

### Current launch blockers

- Noindex defaults are active by design
- The public site and authenticated app are still too intertwined
- The public read-model foundation now exists, but rollout still depends on keeping the denormalized collections healthy and monitored in production
- Sitemap generation is not yet split and governed like an enterprise program
- Public pages still rely too heavily on raw route-time reads instead of read-optimized public models
- Metadata coverage still needs to be standardized across all public page families

## Strategic Goal

TimberEquip should launch as a category-dominant industrial marketplace, not just a searchable inventory app.

The SEO target is to build a crawlable, indexable page system for:

1. Head terms
2. Category terms
3. Manufacturer terms
4. State/location terms
5. Dealer/storefront terms
6. Commercial long-tail combinations
7. Editorial support content that reinforces transactional pages

## Non-Negotiable Principle

If the site is private or invite-only, keep `noindex` on and do not pursue public SEO.

If the site is meant to rank, then launch SEO requires:

- indexable hosting
- crawlable public landing pages
- stable canonicals
- SSR/ISR or prerendering for strategic pages
- XML sitemaps
- schema coverage

You cannot be both hidden from Google and dominant in Google at the same time.

## SEO Architecture Target

### Recommended platform direction

Current stack:

- React + Vite application
- Firebase Hosting
- Firebase Functions SSR layer
- client and server metadata generation

Recommended launch stack direction:

- near term: harden the current hybrid Firebase SSR architecture
- medium term: separate public web, authenticated app, and API surfaces
- long term: evaluate framework-native public rendering such as Next.js on Firebase App Hosting if it clearly improves maintainability and rollout safety

### Minimum acceptable search architecture

At launch, these page types should render indexable HTML on first response for major pages:

- Home
- category landing pages
- manufacturer landing pages
- state landing pages
- dealer/storefront pages
- listing detail pages
- blog and buying guides

### Rendering model by page type

- Home: prerendered
- Category pages: ISR
- Manufacturer pages: ISR
- State pages: ISR
- Dealer pages: ISR
- Listing pages: ISR or SSR
- Search/filter UI: client-enhanced, but not the primary SEO target
- Blog/guides: static or ISR

## URL Strategy

### Launch URL rules

- Use clean, readable, durable URLs
- Avoid relying on query parameters for primary indexable pages
- Use lowercase slugs
- Use one canonical page per search intent family
- Reserve query parameters for UX filtering, not primary ranking pages

### Required page families

#### Home

- `/`

#### Core search hubs

- `/forestry-equipment-for-sale`

Policy:

- only one canonical top-level market-hub family should exist
- `/logging-equipment-for-sale` should be a redirect alias unless it becomes a truly narrower logging-only vertical

#### Category pages

- `/categories/skidders`
- `/categories/feller-bunchers`
- `/categories/harvesters`
- `/categories/forwarders`
- `/categories/log-loaders`
- `/categories/firewood-processors`

#### Manufacturer pages

- `/manufacturers/caterpillar`
- `/manufacturers/john-deere`
- `/manufacturers/tigercat`
- `/manufacturers/komatsu`
- `/manufacturers/ponsse`

#### Manufacturer + model pages

- `/manufacturers/tigercat/models/620e`
- `/manufacturers/caterpillar/models/525d`
- `/manufacturers/ponsse/models/ergo/harvesters-for-sale`

#### State pages

- `/states/georgia/forestry-equipment-for-sale`
- `/states/oregon/forestry-equipment-for-sale`
- `/states/washington/skidders-for-sale`

#### Category + state pages

- `/states/oregon/skidders-for-sale`
- `/states/georgia/feller-bunchers-for-sale`

#### Manufacturer + category pages

- `/manufacturers/tigercat/skidders-for-sale`
- `/manufacturers/john-deere/harvesters-for-sale`

#### Dealer/storefront pages

- `/dealers`
- `/dealers/{dealer-slug}`
- `/dealers/{dealer-slug}/inventory`
- `/dealers/{dealer-slug}/{category-slug}`

#### Listing detail pages

- `/listing/{id}/{slug}`

#### Editorial hubs

- `/guides`
- `/guides/buying-guides`
- `/guides/financing`
- `/guides/maintenance`
- `/blog`

## Page Template Requirements

### 1. Home page

Primary purpose:

- establish brand authority
- route users and crawlers into category, brand, location, and dealer hubs

Must include:

- strong H1 around forestry/logging equipment marketplace intent
- internal links to top categories
- internal links to top manufacturers
- internal links to top states
- internal links to featured dealers
- internal links to recent buying guides
- Marketplace/Organization schema

### 2. Category landing pages

Primary purpose:

- rank for category head terms
- serve as hub pages for long-tail combinations

Must include:

- unique title and meta description
- unique H1
- intro copy of 250 to 500 words
- live listing inventory block
- internal links to top manufacturers in that category
- internal links to top states for that category
- internal links to related guides
- FAQ section
- CollectionPage + ItemList schema

Example target terms:

- skidders for sale
- feller bunchers for sale
- harvesters for sale

### 3. Manufacturer landing pages

Primary purpose:

- rank for brand demand
- connect to inventory and subcategories

Must include:

- overview of the manufacturer
- active inventory
- links to brand + category combinations
- links to brand + state combinations if supported
- FAQ section
- CollectionPage schema

Example target terms:

- Tigercat logging equipment for sale
- John Deere forestry equipment for sale

### 4. State landing pages

Primary purpose:

- rank for geo-commercial demand

Must include:

- summary of active inventory in the state
- top categories in that state
- top brands in that state
- dealer/storefront links in that state
- FAQ section specific to that region
- canonicalized paginated inventory archive

Example target terms:

- logging equipment for sale in Oregon
- forestry equipment for sale in Georgia

### 5. Dealer/storefront pages

Primary purpose:

- rank for dealer and storefront searches
- create trust and merchant relevance

Must include:

- unique SEO title and description
- dealer branding
- inventory list
- location details
- contact information
- opening/about section
- links to dealer category pages
- Organization or LocalBusiness schema where appropriate

Example target terms:

- logging equipment for sale by {dealer name}
- {dealer name} forestry equipment

### 6. Listing detail pages

Primary purpose:

- rank for specific machine intent
- win long-tail commercial clicks

Must include:

- exact machine title in title tag
- unique meta description
- canonical URL
- Product schema
- Offer schema with price and availability
- seller/dealer reference
- breadcrumb path
- structured specs table in crawlable HTML
- image alt text
- related listings links
- nearby/state/category/manufacturer links

## Structured Data Blueprint

### Required schema by page type

#### Sitewide

- Organization
- WebSite
- SearchAction

#### Home

- Organization
- WebSite

#### Category, manufacturer, state, and dealer hubs

- CollectionPage
- ItemList
- BreadcrumbList

#### Listing detail pages

- Product
- Offer
- BreadcrumbList
- optionally Organization for seller or dealer

#### Blog and guides

- Article
- BreadcrumbList

### Product schema fields for listings

Every listing page should include:

- name
- description
- image array
- sku or internal listing ID
- brand
- model
- category
- itemCondition
- offers.price
- offers.priceCurrency
- offers.availability
- seller
- url

If possible also include:

- year
- hours
- location
- vehicle/equipment-specific technical attributes

## Canonical Strategy

### Rule set

- Each indexable landing page gets a self-referencing canonical
- Only one top-level market-hub family can be canonical at a time
- Retired aliases should redirect rather than coexist as equal SEO surfaces
- Query-param search pages should generally canonicalize to the matching clean landing page when one exists
- Sort parameters must not create canonical variants
- Tracking parameters must be stripped from canonical URLs

### Examples

- `/search?category=Skidders` -> canonical to `/categories/skidders`
- `/search?manufacturer=Tigercat` -> canonical to `/manufacturers/tigercat`
- `/search?state=Oregon&category=Skidders` -> canonical to `/states/oregon/skidders-for-sale`
- `/search?sortBy=price_desc` -> canonical to the same page without sort param

## Sitemap Blueprint

### Required sitemap families

- `/sitemap.xml`
- `/sitemaps/listings.xml`
- `/sitemaps/categories.xml`
- `/sitemaps/manufacturers.xml`
- `/sitemaps/models.xml`
- `/sitemaps/states.xml`
- `/sitemaps/dealers.xml`
- `/sitemaps/blog.xml`
- `/sitemaps/guides.xml`

### Rules

- update listing sitemap daily or on inventory changes
- exclude noindex pages from all sitemaps
- include `lastmod`
- split large files when necessary

## Internal Linking Blueprint

### Goal

Build topical authority clusters and route link equity into commercial pages.

### Required linking system

#### From home

- to top categories
- to top manufacturers
- to top states
- to top dealers
- to best guides

#### From category pages

- to major manufacturers in category
- to top states in category
- to related dealer pages
- to buying guides

#### From manufacturer pages

- to relevant categories
- to state pages where inventory is strong
- to dealer pages carrying the brand

#### From listing pages

- to category page
- to manufacturer page
- to state page
- to dealer page
- to related listings

#### From articles and guides

- to category pages
- to manufacturer pages
- to listing pages
- to financing pages

## Content Blueprint

### Content pillars

#### 1. Transactional inventory pages

- category pages
- brand pages
- state pages
- dealer pages
- listing pages

#### 2. Commercial support content

- buyer's guides
- financing guides
- auction guides
- equipment comparison pages
- used vs new pages
- ownership cost guides

#### 3. Authority content

- market reports
- pricing trend pages
- maintenance content
- tax and depreciation guides

### Launch content targets

Before public SEO launch, publish at minimum:

- 8 to 12 category landing pages
- 10 to 20 manufacturer landing pages
- 15 to 25 state landing pages based on inventory and demand
- 25 to 40 buying guides and commercial support articles
- unique copy on top dealer pages

## Query Coverage Model

### Tier 1 head terms

- logging equipment for sale
- forestry equipment for sale
- used logging equipment
- used forestry equipment

### Tier 2 category terms

- skidders for sale
- feller bunchers for sale
- forwarders for sale
- harvesters for sale

### Tier 3 geo terms

- logging equipment for sale in Oregon
- forestry equipment for sale in Georgia
- skidders for sale in Maine

### Tier 4 brand terms

- Tigercat skidders for sale
- John Deere forestry equipment for sale
- Ponsse harvesters for sale

### Tier 5 dealer terms

- {dealer name} logging equipment for sale
- {dealer name} forestry equipment inventory

## Technical SEO Launch Checklist

### Phase 0: remain private

- keep `noindex`
- keep robots blocked
- keep noindex hosting header
- do not submit sitemaps

### Phase 1: launch-ready foundation

- choose and enforce one canonical market-hub family
- migrate key routes to SSR/ISR
- create clean landing-page routes
- implement dynamic metadata generator
- implement Product schema on listing pages
- implement sitemap generation
- implement canonical strategy
- implement pagination strategy
- add `og:image` and `og:url`
- define public-web versus app versus API ownership

### Phase 2: public launch

- switch to indexable build
- open robots.txt
- remove noindex hosting header
- submit sitemap in Search Console
- inspect top page templates in Search Console
- request indexing for core category, manufacturer, and state pages

### Phase 3: growth

- publish ongoing guides
- expand state and manufacturer hubs
- add comparison pages
- add market intelligence content
- build backlinks from industry sources

## Measurement Blueprint

### Primary KPIs

- indexed pages
- impressions
- clicks
- CTR
- average position
- non-brand organic sessions
- ranking share by category
- ranking share by state
- ranking share by manufacturer
- organic leads
- organic listing inquiries

### Launch dashboard segments

- category pages
- manufacturer pages
- state pages
- dealer pages
- listing pages
- blog/guides

## Implementation Roadmap

### Sprint 1: architecture and foundations

- decide and enforce the canonical market hub
- define the public-web versus app versus API boundary
- define slug system
- create route map for categories, manufacturers, models, states, and dealers
- define canonical rules
- define sitemap generation rules

### Sprint 2: landing pages

- implement category pages
- implement manufacturer pages
- implement manufacturer plus model pages
- implement state pages
- implement dealer pages
- add crawlable HTML intro content

### Sprint 3: listing SEO

- add Product schema
- improve metadata generation
- improve related links
- improve spec rendering for crawlability

### Sprint 4: content program

- publish buying guides
- publish financing guides
- publish maintenance articles
- build internal link clusters

### Sprint 5: public launch

- switch off noindex
- deploy sitemaps
- submit Search Console properties
- begin rank tracking

## What TimberEquip Must Do To Beat Large Marketplaces

TimberEquip should not try to win by looking like a smaller generic marketplace.

It should win by being:

- narrower in niche
- deeper in inventory context
- stronger in category specificity
- stronger in buying-guide depth
- stronger in technical specs and structured data
- stronger in dealer/storefront SEO

The moat is not just listings.

The moat is the combination of:

- inventory
- dealer pages
- market intelligence
- category authority
- long-tail landing-page coverage

## Recommended Build Order

If implementation starts now, the best order is:

1. preserve private noindex state
2. settle the canonical market hub
3. build indexable architecture offline
4. create category/manufacturer/model/state/dealer page system
5. add schema and sitemaps
6. launch with a critical mass of public content
7. only then remove noindex

## Final Recommendation

Do not open indexing until these are complete:

- dedicated landing-page architecture
- sitemap generation
- Product schema on listings
- SSR/ISR or equivalent prerender strategy for key pages
- canonical strategy for filters
- minimum viable content library

If TimberEquip goes public before that, Google will likely see it as a thinner faceted inventory app instead of a category authority marketplace.

If TimberEquip launches after that work, it can compete much more seriously for forestry and logging equipment search demand.
