# Forestry Equipment Sales SEO Implementation Backlog

## Purpose

This file converts the launch SEO blueprint into an implementation backlog.

It is intentionally designed for pre-launch execution while Forestry Equipment Sales remains in `noindex` mode.

## Operating Rules

- Keep `noindex` on during all work in this backlog
- Do not submit a sitemap to search engines yet
- Do not switch default deploys to indexable yet
- Build public SEO architecture offline before public indexing

## Delivery Structure

The backlog is organized into epics.

Each item includes:

- objective
- implementation scope
- dependencies
- acceptance criteria
- launch priority

## Epic 1: Platform and Rendering Foundation

### 1.1 Decide rendering strategy

Objective:

- choose the rendering approach for public SEO pages

Scope:

- evaluate Next.js ISR versus Remix SSR versus a prerender layer on top of current Vite app
- decide what remains client-only and what must become server-rendered or pre-rendered

Dependencies:

- none

Acceptance criteria:

- written technical decision record exists
- page rendering matrix exists for home, category, manufacturer, state, dealer, listing, blog, and guides
- migration path from current Vite routes is documented

Priority:

- P0

### 1.2 Build SEO route inventory

Objective:

- define every future public indexable route family

Scope:

- category pages
- manufacturer pages
- state pages
- dealer pages
- listing pages
- guide pages
- search UI pages that remain non-primary SEO surfaces

Dependencies:

- 1.1

Acceptance criteria:

- complete route inventory exists
- route slugs are normalized and deterministic
- route ownership is assigned by page type

Priority:

- P0

### 1.3 Create slug normalization utility

Objective:

- ensure categories, manufacturers, states, and dealers use stable slug rules

Scope:

- define slug casing, punctuation, duplicate handling, and reserved words
- add test fixtures for current catalog values

Dependencies:

- 1.2

Acceptance criteria:

- a single slugging utility exists
- slug output is deterministic for catalog inputs
- duplicate slug collision policy is documented

Priority:

- P0

## Epic 2: Metadata and Canonical Layer

### 2.1 Replace manual page metadata with a shared SEO model

Objective:

- standardize title, description, robots, canonical, OG, and JSON-LD generation

Scope:

- extend `Seo.tsx` or replace it with page-type generators
- define metadata generators for home, category, manufacturer, state, dealer, listing, blog, and guide pages

Dependencies:

- 1.1

Acceptance criteria:

- every public page type can generate metadata from a typed input object
- support exists for `og:image`, `og:url`, `og:site_name`, and `twitter:image`

Priority:

- P0

### 2.2 Implement canonical strategy

Objective:

- eliminate duplicate URL ambiguity

Scope:

- map filtered search URLs to clean canonical routes where appropriate
- strip sort and tracking parameters from canonicals
- define when query-driven pages should be noindex versus canonicalized

Dependencies:

- 1.2
- 2.1

Acceptance criteria:

- canonical rules are documented and implemented
- no primary landing page canonicals point back to generic `/search`

Priority:

- P0

### 2.3 Fill missing metadata coverage on existing public pages

Objective:

- ensure all public routes have explicit page-level SEO metadata

Scope:

- add metadata to About, Contact, Blog index, Financing, Ad Programs, Auctions, Privacy, Terms, and Cookies pages

Dependencies:

- 2.1

Acceptance criteria:

- all public page components mount metadata intentionally

Priority:

- P1

## Epic 3: Structured Data

### 3.1 Add Product schema to listing detail pages

Objective:

- make listing pages eligible for rich results and merchant-like understanding

Scope:

- Product schema
- Offer schema
- seller/dealer reference
- condition, price, currency, availability, brand, model, image, URL

Dependencies:

- 2.1

Acceptance criteria:

- listing detail pages emit valid JSON-LD Product data
- schema validates in Rich Results Test

Priority:

- P0

### 3.2 Add page-type schema coverage

Objective:

- complete the schema layer across strategic pages

Scope:

- Organization
- WebSite + SearchAction
- CollectionPage
- ItemList
- Article
- LocalBusiness or Organization for dealers where appropriate

Dependencies:

- 2.1

Acceptance criteria:

- each page template has required schema defined in code and documentation

Priority:

- P1

## Epic 4: Landing Page System

### 4.1 Build category landing page template

Objective:

- create a reusable SEO hub page for each equipment category

Scope:

- title and description generator
- intro copy region
- FAQ region
- live inventory block
- links to related manufacturers, states, and guides

Dependencies:

- 1.1
- 1.2
- 2.1

Acceptance criteria:

- one reusable category template exists
- at least 6 priority category pages can be generated from it

Priority:

- P0

### 4.2 Build manufacturer landing page template

Objective:

- create a reusable brand SEO page

Scope:

- manufacturer summary
- inventory listing block
- category links
- FAQ block

Dependencies:

- 4.1

Acceptance criteria:

- one reusable manufacturer template exists
- at least 10 priority manufacturers can be generated from it

Priority:

- P0

### 4.3 Build state landing page template

Objective:

- create geo-commercial landing pages for state demand

Scope:

- state-specific inventory summary
- links to top categories, brands, and dealers in the state
- FAQ block
- paginated inventory archive

Dependencies:

- 4.1
- 4.2

Acceptance criteria:

- one reusable state template exists
- priority states can be generated from inventory data

Priority:

- P0

### 4.4 Build dealer/storefront landing page template

Objective:

- create merchant-style dealer pages that can rank and convert

Scope:

- profile header
- about/storefront content
- inventory block
- location/contact data
- related category links

Dependencies:

- 2.1
- 3.2

Acceptance criteria:

- one reusable dealer template exists
- storefront metadata fields are mapped to the template

Priority:

- P1

## Epic 5: Sitemap and Crawl Management

### 5.1 Build sitemap generation pipeline

Objective:

- generate machine-readable sitemap indexes and child sitemaps

Scope:

- sitemap index
- listings sitemap
- category sitemap
- manufacturer sitemap
- state sitemap
- dealer sitemap
- blog/guides sitemaps

Dependencies:

- 1.2

Acceptance criteria:

- sitemap generation runs deterministically
- only indexable pages are included
- each entry includes `lastmod`

Priority:

- P0

### 5.2 Define robots and noindex launch toggle

Objective:

- keep pre-launch private while making launch flip safe and explicit

Scope:

- define build-time and deploy-time toggle behavior
- define exact files/settings that change during launch flip

Dependencies:

- 5.1

Acceptance criteria:

- launch toggle checklist exists
- noindex and indexable behaviors are tested

Priority:

- P0

## Epic 6: Inventory Archives and Pagination

### 6.1 Implement crawlable pagination

Objective:

- make deeper inventory archives accessible and indexable

Scope:

- page params or segment-based pagination
- page 1 canonical rules
- metadata support for paginated pages

Dependencies:

- 4.1
- 4.2
- 4.3

Acceptance criteria:

- page 2+ archives have stable URLs
- pagination does not create duplicate canonical issues

Priority:

- P1

### 6.2 Define search UI versus SEO hub boundary

Objective:

- prevent the faceted search interface from becoming uncontrolled crawl waste

Scope:

- define which filter combinations are SEO pages
- define which remain UX-only
- define when pages are noindex

Dependencies:

- 2.2

Acceptance criteria:

- parameter handling policy is documented
- route families have clear SEO ownership

Priority:

- P0

## Epic 7: Content and Internal Linking

### 7.1 Build category support content plan

Objective:

- support commercial pages with topical depth

Scope:

- buyer guides
- maintenance guides
- financing guides
- comparison pages

Dependencies:

- 4.1

Acceptance criteria:

- editorial calendar exists for at least 25 launch articles

Priority:

- P1

### 7.2 Build internal linking rules

Objective:

- route authority across hubs, listings, and content

Scope:

- home-to-hub links
- hub-to-hub links
- listing-to-hub links
- guide-to-commercial links

Dependencies:

- 4.1
- 4.2
- 4.3
- 4.4

Acceptance criteria:

- internal linking rules are defined per page type
- templates expose those link modules intentionally

Priority:

- P1

## Epic 8: Measurement and Launch Governance

### 8.1 Define launch KPIs and dashboards

Objective:

- measure the launch like a search program, not just a site release

Scope:

- index coverage
- impressions
- clicks
- CTR
- ranking by page family
- organic leads

Dependencies:

- none

Acceptance criteria:

- KPI dashboard spec exists
- Search Console and analytics measurement plan exists

Priority:

- P1

### 8.2 Create launch go/no-go checklist

Objective:

- prevent opening indexing prematurely

Scope:

- rendering readiness
- metadata coverage
- schema validation
- sitemap generation
- canonical validation
- content readiness
- noindex toggle readiness

Dependencies:

- all prior launch-critical epics

Acceptance criteria:

- checklist exists with named owners and release criteria

Priority:

- P0

## Recommended Order of Execution

1. Epic 1
2. Epic 2
3. Epic 3
4. Epic 4
5. Epic 5
6. Epic 6
7. Epic 7
8. Epic 8

## First Build Slice

The most efficient first implementation slice is:

1. rendering decision
2. route inventory
3. slug utility
4. metadata generator
5. category template
6. Product schema on listing pages
7. sitemap generator

## Launch Reminder

Do not remove `noindex` until:

- the landing-page architecture exists
- Product schema is live
- sitemap generation is live
- canonical handling is correct
- the first wave of category/manufacturer/state pages exists

Until then, this backlog should be executed behind the current non-indexed posture.