# Forestry Equipment Sales SEO Phase 1 URL Map And Templates

## Purpose

This document defines Phase 1 of the Forestry Equipment Sales SEO build.

Phase 1 covers:

- URL map
- routing model
- slug conventions
- landing-page template requirements
- metadata model
- minimal data contracts

This phase originally did not turn indexing on.

Update:

The original Phase 1 plan assumed a non-indexed staging posture.

The current implementation has moved beyond that assumption:

- hybrid server-rendered public SEO routes now exist
- a dynamic sitemap route now exists
- public indexing can now be turned on safely for supported route families
- the React app still remains the deeper UX layer for search, auth, admin, and dealer operations

## Phase 1 Goal

Build the core public SEO page system with a safe path from `noindex` staging to supported public indexing.

The outcome of Phase 1 should be a working architecture for:

- category pages
- manufacturer pages
- state pages
- dealer pages
- improved listing pages

## Current Architecture Status

The public SEO engine is now a hybrid system:

- server-rendered public routes for primary commercial intents
- SPA search and application flows for deep UX and account workflows
- shared slug logic for route families already implemented in code
- a dynamic `sitemap.xml` route for the current public families

Implemented route families:

- core market hubs
- machine-type category hubs
- manufacturer hubs
- state hubs
- state plus category hubs
- manufacturer plus category hubs
- dealer directory and dealer storefront hubs

Still missing or still needing policy work:

- explicit top-level category cluster pages if we want both category-group and machine-type layers
- an indexability policy for thin individual seller pages

## Entity Coverage

Current coverage by entity:

- category groups: partial, because the current `/categories/{slug}` family is primarily acting as the machine-type or subcategory layer
- subcategories or machine types: yes, this is the strongest current category family
- manufacturers: yes
- models: yes, through manufacturer-scoped model route families
- dealers: yes
- individual sellers: partially, via transitional storefront pages, but they should not all be treated as indexable by default

Current model route family:

- `/manufacturers/{manufacturer-slug}/models/{model-slug}`
- `/manufacturers/{manufacturer-slug}/models/{model-slug}/{category-phrase}-for-sale`

Recommended individual seller policy:

- keep listing pages indexable
- allow seller/storefront pages to be indexable only when the seller has enough inventory, profile depth, and contact trust signals
- otherwise keep the seller page as a usable UX route without making it a priority ranking surface

## Implementation Rules

Phase 1 should ship real route components, not placeholder URL reservations.

Each route family introduced in this phase should:

- resolve through the current public routing layer, whether that is the hybrid public handler or the SPA router
- render a unique H1 and metadata set tied to the route intent
- render live inventory or live entity data from the current application data layer
- reuse shared slug and canonical utilities instead of duplicating normalization logic per page

Phase 1 should not replace the current search experience.

Search remains the broad UX surface. SEO routes become the clean, stable landing pages for supported intents.

## Routing Behavior Requirements

- clean SEO routes should be directly navigable through Hosting rewrites and the public routing layer
- each clean SEO route should have a deterministic canonical path
- unsupported or thin query combinations should continue to resolve on `/search`
- `/seller/:id` must remain reachable during rollout
- dealer/storefront slug routes should become the preferred canonical destination for dealer inventory once available

## Current Route State

Current public routes are now centered on:

- `/`
- `/search`
- `/listing/:id/:slug`
- `/seller/:id`
- `/blog`
- `/categories`
- `/manufacturers`
- `/states`
- `/dealers`
- static marketing/legal pages

Current problem:

- the route map now covers the strongest marketplace entities, but individual seller indexing rules and future category-cluster/editorial layers still need to be formalized

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
- `/categories/log-loaders`
- `/categories/firewood-processors`

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

### Manufacturer plus model hubs

- `/manufacturers/{manufacturer-slug}/models/{model-slug}`

Examples:

- `/manufacturers/tigercat/models/h855`
- `/manufacturers/john-deere/models/1270g`

### Manufacturer plus model plus category hubs

- `/manufacturers/{manufacturer-slug}/models/{model-slug}/{category-phrase}-for-sale`

Examples:

- `/manufacturers/tigercat/models/h855/harvesters-for-sale`
- `/manufacturers/john-deere/models/1270g/harvesters-for-sale`

### Dealer hubs

- `/dealers`
- `/dealers/{dealer-slug}`
- `/dealers/{dealer-slug}/inventory`
- `/dealers/{dealer-slug}/{category-slug}`

### Legacy storefront route

- `/seller/:id`

Notes:

- `/seller/:id` is the current live public storefront route.
- Phase 1 should preserve it while dealer/storefront slug routes are introduced.
- Once dealer/storefront pages exist, `/seller/:id` should either canonicalize to or redirect to the equivalent clean dealer/storefront URL.

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

### Transitional routes

These can remain public during rollout, but they should not become the long-term primary SEO destination if a cleaner equivalent exists:

- `/seller/:id`
- legacy article IDs without a slug segment

## Canonical Mapping Rules

### Search to SEO route mapping

If the user is viewing one of the supported SEO intents in the search UI, canonical should map to the clean route.

Examples:

- `/search?category=Skidders` -> `/categories/skidders`
- `/search?manufacturer=Tigercat` -> `/manufacturers/tigercat`
- `/search?manufacturer=Tigercat&model=H855` -> `/manufacturers/tigercat/models/h855`
- `/search?state=Oregon` -> `/states/oregon/logging-equipment-for-sale`
- `/search?state=Oregon&category=Skidders` -> `/states/oregon/skidders-for-sale`
- `/search?manufacturer=Tigercat&category=Skidders` -> `/manufacturers/tigercat/skidders-for-sale`

Implementation note:

- this does not require immediate redirect behavior in Phase 1
- Phase 1 requires the clean destination routes to exist and be capable of rendering the correct filtered inventory and metadata
- redirect or automatic canonical promotion from search can be layered in after route templates are stable

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
- seller, dealer, and article slug creation should use shared normalization helpers rather than route-local regex variations

## Template Inventory

### 1. Core Hub Template

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

### 2. Category Template

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

- title pattern: `{Category} For Sale | Forestry Equipment Sales`
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

### 3. Manufacturer Template

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

- title pattern: `{Manufacturer} Logging Equipment For Sale | Forestry Equipment Sales`
- CollectionPage + ItemList schema

Minimum data contract:

- manufacturer name
- manufacturer slug
- description block
- top categories
- top states
- dealer list
- listing collection

### 4. State Template

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

- title pattern: `Logging Equipment For Sale In {State} | Forestry Equipment Sales` for logging hubs
- title pattern: `Forestry Equipment For Sale In {State} | Forestry Equipment Sales` for forestry hubs
- CollectionPage + ItemList schema

Minimum data contract:

- state name
- state slug
- inventory totals
- category distribution
- manufacturer distribution
- dealer list
- listing collection

### 5. Category + State Template

Used for:

- `/states/{state-slug}/{category-phrase}-for-sale`

Sections:

- geo-category hero
- filtered inventory archive
- top manufacturers for that category in the state
- dealer links
- FAQ

Metadata requirements:

- title pattern: `{Category} For Sale In {State} | Forestry Equipment Sales`
- CollectionPage + ItemList schema

Minimum data contract:

- category
- state
- listing collection
- top manufacturers
- dealer list
- FAQ array

### 6. Manufacturer + Category Template

Used for:

- `/manufacturers/{manufacturer-slug}/{category-phrase}-for-sale`

Sections:

- manufacturer-category hero
- filtered inventory archive
- state availability links
- dealer links
- FAQ

Metadata requirements:

- title pattern: `{Manufacturer} {Category} For Sale | Forestry Equipment Sales`
- CollectionPage + ItemList schema

Minimum data contract:

- manufacturer
- category
- listing collection
- state list
- dealer list

### 7. Dealer Template

Used for:

- `/dealers/{dealer-slug}`
- `/dealers/{dealer-slug}/inventory`
- `/dealers/{dealer-slug}/{category-slug}`
- transitional support for `/seller/:id` until the clean dealer/storefront route family is live

Sections:

- dealer hero and branding
- about/storefront section
- contact/location block
- inventory archive
- category tabs or links
- featured brands
- FAQ

Metadata requirements:

- title pattern: `{Dealer Name} Logging Equipment For Sale | Forestry Equipment Sales`
- Organization or LocalBusiness schema
- ItemList schema on inventory pages
- canonical target should prefer the dealer/storefront slug route over `/seller/:id` once both exist

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

### 8. Listing Template Enhancements

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

- `{Year} {Manufacturer} {Model} For Sale | Forestry Equipment Sales`

Description pattern:

- include year, make, model, category, condition, location, and seller/dealer reference when possible

### 9. Model Template

Recommended for the next phase after the current hybrid foundation.

Used for:

- `/manufacturers/{manufacturer-slug}/models/{model-slug}`
- `/manufacturers/{manufacturer-slug}/models/{model-slug}/{category-phrase}-for-sale`

Sections:

- model hero
- manufacturer and category context
- live inventory archive
- dealer links carrying the model
- related models
- FAQ

Metadata requirements:

- title pattern: `{Manufacturer} {Model} For Sale | Forestry Equipment Sales`
- CollectionPage + ItemList schema

Minimum data contract:

- manufacturer
- model
- optional category
- live inventory collection
- dealer list
- related models
- FAQ array

### 10. Individual Seller Indexing Policy

Recommended policy for `/seller/:id` or future individual storefront routes.

Indexable only when:

- inventory count is strong enough to support a real archive page
- seller profile has usable branding or trust information
- contact and location data are present
- thin or duplicate pages are not being created at scale

Otherwise:

- keep the route usable for buyers
- keep listing detail pages as the primary SEO surface
- avoid pushing thin seller pages into the sitemap or canonical graph

## Shared Modules Needed Across Templates

- metadata generator
- breadcrumb generator
- JSON-LD generator
- slug normalization utility
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

Phase 1 implementation may use derived summaries from the current live listings dataset where editorial copy is not finalized yet, as long as the page contract remains stable.

## Phase 1 Acceptance Criteria

Phase 1 is complete when:

- route families are agreed
- slug rules are defined
- canonical mapping policy is defined
- templates are specified for all major SEO page types
- data contracts are documented
- legacy route handling is defined for `/seller/:id` and any transitional public article URLs
- the project can still build successfully with `noindex` mode enabled when needed
- the public architecture can also run in indexable mode for the supported hybrid route families

The implementation pass should additionally prove the following:

- `/logging-equipment-for-sale` and `/forestry-equipment-for-sale` render live inventory and stable canonicals
- `/categories/{category-slug}` resolves from shared category slug logic and renders category-filtered inventory
- `/manufacturers/{manufacturer-slug}` resolves from shared manufacturer slug logic and renders manufacturer-filtered inventory
- `/states/{state-slug}/logging-equipment-for-sale` and `/states/{state-slug}/forestry-equipment-for-sale` render state-filtered inventory with state-specific metadata
- `/states/{state-slug}/{category-phrase}-for-sale` renders the combined state-plus-category slice
- `/manufacturers/{manufacturer-slug}/{category-phrase}-for-sale` renders the combined manufacturer-plus-category slice
- `/manufacturers/{manufacturer-slug}/models/{model-slug}` renders the combined manufacturer-plus-model slice
- `/manufacturers/{manufacturer-slug}/models/{model-slug}/{category-phrase}-for-sale` renders the exact manufacturer-plus-model-plus-category slice
- `/dealers` renders a crawlable dealer directory surface
- dealer detail routes have a canonical preference for the clean dealer/storefront path rather than legacy `/seller/:id` when a dealer slug exists
- route templates reuse shared slug, breadcrumb, and metadata helpers instead of copying route-specific implementations
- the project still builds successfully with `noindex` mode enabled
- the project also builds successfully in indexable mode with sitemap output for the supported hybrid route families

## Validation Checklist

Use this checklist during implementation review:

- route loads without falling through to the home-page wildcard
- page title and meta description change per route intent
- canonical matches the clean route path
- JSON-LD is present for collection-style pages
- H1 matches the route intent
- listing grid is populated from the same live inventory source used elsewhere in the marketplace
- related links point to clean SEO routes where a supported route family exists
- legacy `/seller/:id` remains usable during the transition

## Explicit Non-Goals For Phase 1

- turning indexing on
- submitting sitemaps
- public launch
- broad content production at scale

Phase 1 is architecture and page-system design only.
