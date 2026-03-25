# TimberEquip SEO Phase 1 URL Map And Templates

## Purpose

This document defines Phase 1 of the TimberEquip SEO build.

Phase 1 covers:

- URL map
- routing model
- slug conventions
- landing-page template requirements
- metadata model
- minimal data contracts

This phase does not turn indexing on.

## Phase 1 Goal

Build the core public SEO page system while the site remains `noindex`.

The outcome of Phase 1 should be a working architecture for:

- category pages
- manufacturer pages
- state pages
- dealer pages
- improved listing pages

## Current Route State

Current public routes are centered on:

- `/`
- `/search`
- `/listing/:id/:slug`
- `/seller/:id`
- `/categories`
- static marketing/legal pages

Current problem:

- these routes do not map cleanly to the highest-value commercial query families

## Phase 1 Route Families

### Core hubs

- `/logging-equipment-for-sale`
- `/forestry-equipment-for-sale`

### Category hubs

- `/categories/{category-slug}`

Examples:

- `/categories/skidders`
- `/categories/feller-bunchers`
- `/categories/harvesters`
- `/categories/forwarders`

### Manufacturer hubs

- `/manufacturers/{manufacturer-slug}`

Examples:

- `/manufacturers/tigercat`
- `/manufacturers/john-deere`
- `/manufacturers/komatsu`

### State hubs

- `/states/{state-slug}/logging-equipment-for-sale`
- `/states/{state-slug}/forestry-equipment-for-sale`

Examples:

- `/states/oregon/logging-equipment-for-sale`
- `/states/georgia/forestry-equipment-for-sale`

### Category plus state hubs

- `/states/{state-slug}/{category-phrase}-for-sale`

Examples:

- `/states/oregon/skidders-for-sale`
- `/states/washington/harvesters-for-sale`

### Manufacturer plus category hubs

- `/manufacturers/{manufacturer-slug}/{category-phrase}-for-sale`

Examples:

- `/manufacturers/tigercat/skidders-for-sale`
- `/manufacturers/john-deere/harvesters-for-sale`

### Dealer hubs

- `/dealers`
- `/dealers/{dealer-slug}`
- `/dealers/{dealer-slug}/inventory`
- `/dealers/{dealer-slug}/{category-slug}`

### Listing pages

- `/listing/{id}/{slug}`

This remains valid and should be retained.

## Route Ownership Rules

### SEO routes

These should become the primary indexable surfaces at public launch:

- core hubs
- category hubs
- manufacturer hubs
- state hubs
- category + state hubs
- manufacturer + category hubs
- dealer hubs
- listing pages

### UX routes

These should remain UX-focused and not be treated as the main ranking pages:

- `/search`
- ad hoc filter combinations
- sort variations
- account, profile, sell, compare, and admin routes

## Canonical Mapping Rules

### Search to SEO route mapping

If the user is viewing one of the supported SEO intents in the search UI, canonical should map to the clean route.

Examples:

- `/search?category=Skidders` -> `/categories/skidders`
- `/search?manufacturer=Tigercat` -> `/manufacturers/tigercat`
- `/search?state=Oregon` -> `/states/oregon/logging-equipment-for-sale`
- `/search?state=Oregon&category=Skidders` -> `/states/oregon/skidders-for-sale`
- `/search?manufacturer=Tigercat&category=Skidders` -> `/manufacturers/tigercat/skidders-for-sale`

### Non-canonicalized search URLs

These should remain UX-only and generally not become canonical SEO surfaces:

- sort options
- arbitrary price combinations
- arbitrary hour and year combinations
- attachment and feature micro-filters
- multi-filter combinations without editorial or inventory justification

## Slug Conventions

### General rules

- lowercase only
- words separated by hyphens
- remove punctuation except hyphens needed for readability
- collapse duplicate whitespace and punctuation
- normalize ampersands to `and`

### Examples

- `John Deere` -> `john-deere`
- `Feller Bunchers` -> `feller-bunchers`
- `Owner/Operator` -> `owner-operator`
- `West Virginia` -> `west-virginia`

### Dealer slug rules

- prefer explicit stored slug if available
- otherwise derive from storefront/dealer name
- append a stable suffix if collision occurs

## Template Inventory

## 1. Core Hub Template

Used for:

- `/logging-equipment-for-sale`
- `/forestry-equipment-for-sale`

Sections:

- hero block
- marketplace summary copy
- top categories
- top manufacturers
- top states
- featured dealers
- recent guides
- featured inventory
- FAQ

Metadata requirements:

- distinct title
- distinct meta description
- canonical URL
- Organization + CollectionPage schema

## 2. Category Template

Used for:

- `/categories/{category-slug}`

Sections:

- hero block with category H1
- intro copy
- live inventory archive
- top manufacturers in category
- top states in category
- dealer links
- related buying guides
- FAQ

Metadata requirements:

- title pattern: `{Category} For Sale | TimberEquip`
- description pattern with marketplace and buyer intent language
- CollectionPage + ItemList schema

Minimum data contract:

- category name
- category slug
- intro content
- FAQ array
- featured manufacturers
- featured states
- listing collection

## 3. Manufacturer Template

Used for:

- `/manufacturers/{manufacturer-slug}`

Sections:

- manufacturer hero
- brand overview
- live inventory
- top categories for brand
- top states for brand
- featured dealers carrying brand
- FAQ

Metadata requirements:

- title pattern: `{Manufacturer} Logging Equipment For Sale | TimberEquip`
- CollectionPage + ItemList schema

Minimum data contract:

- manufacturer name
- manufacturer slug
- description block
- top categories
- top states
- dealer list
- listing collection

## 4. State Template

Used for:

- `/states/{state-slug}/logging-equipment-for-sale`
- `/states/{state-slug}/forestry-equipment-for-sale`

Sections:

- state-focused hero
- inventory summary
- top categories in state
- top brands in state
- dealer links in state
- local buying/transport copy
- FAQ

Metadata requirements:

- title pattern: `Logging Equipment For Sale In {State} | TimberEquip`
- CollectionPage + ItemList schema

Minimum data contract:

- state name
- state slug
- inventory totals
- category distribution
- manufacturer distribution
- dealer list
- listing collection

## 5. Category + State Template

Used for:

- `/states/{state-slug}/{category-phrase}-for-sale`

Sections:

- geo-category hero
- filtered inventory archive
- top manufacturers for that category in the state
- dealer links
- FAQ

Metadata requirements:

- title pattern: `{Category} For Sale In {State} | TimberEquip`
- CollectionPage + ItemList schema

Minimum data contract:

- category
- state
- listing collection
- top manufacturers
- dealer list
- FAQ array

## 6. Manufacturer + Category Template

Used for:

- `/manufacturers/{manufacturer-slug}/{category-phrase}-for-sale`

Sections:

- manufacturer-category hero
- filtered inventory archive
- state availability links
- dealer links
- FAQ

Metadata requirements:

- title pattern: `{Manufacturer} {Category} For Sale | TimberEquip`
- CollectionPage + ItemList schema

Minimum data contract:

- manufacturer
- category
- listing collection
- state list
- dealer list

## 7. Dealer Template

Used for:

- `/dealers/{dealer-slug}`
- `/dealers/{dealer-slug}/inventory`
- `/dealers/{dealer-slug}/{category-slug}`

Sections:

- dealer hero and branding
- about/storefront section
- contact/location block
- inventory archive
- category tabs or links
- featured brands
- FAQ

Metadata requirements:

- title pattern: `{Dealer Name} Logging Equipment For Sale | TimberEquip`
- Organization or LocalBusiness schema
- ItemList schema on inventory pages

Minimum data contract:

- dealer name
- dealer slug
- logo/brand assets
- location
- contact details
- storefront description
- inventory collection
- category breakdown
- supported brands

## 8. Listing Template Enhancements

Existing route:

- `/listing/{id}/{slug}`

Required additions:

- Product schema
- Offer schema
- better metadata generator
- related links to category, manufacturer, state, and dealer pages
- crawlable spec table in HTML
- stronger image metadata

Title pattern:

- `{Year} {Manufacturer} {Model} For Sale | TimberEquip`

Description pattern:

- include year, make, model, category, condition, location, and seller/dealer reference when possible

## Shared Modules Needed Across Templates

- metadata generator
- breadcrumb generator
- JSON-LD generator
- listing archive block
- FAQ block
- related links block
- dealer spotlight block
- manufacturer links block
- state links block

## Data Preparation Requirements

Before Phase 1 implementation, the data layer should confirm the ability to supply:

- normalized category values
- normalized manufacturer values
- normalized state values
- dealer/storefront slugs and metadata
- listing counts by category/manufacturer/state/dealer
- representative intro copy and FAQ content blocks

## Phase 1 Acceptance Criteria

Phase 1 is complete when:

- route families are agreed
- slug rules are defined
- canonical mapping policy is defined
- templates are specified for all major SEO page types
- data contracts are documented
- noindex remains active during implementation

## Explicit Non-Goals For Phase 1

- turning indexing on
- submitting sitemaps
- public launch
- broad content production at scale

Phase 1 is architecture and page-system design only.