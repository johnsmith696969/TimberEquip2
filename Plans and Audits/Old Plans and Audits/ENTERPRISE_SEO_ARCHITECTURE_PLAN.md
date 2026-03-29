# TimberEquip Enterprise SEO and Architecture Plan

## Purpose

This plan defines how TimberEquip should move from the current hybrid React plus Firebase SEO layer into a cleaner enterprise marketplace architecture.

The immediate goal is to remove duplicate market-hub intent, strengthen canonical discipline, and turn the public website into a durable acquisition engine for:

- equipment dealers
- individual sellers
- manufacturer and model search intent
- category and location search intent
- dealer storefront visibility
- embeddable inventory and ad surfaces

## Current Reality

Today the project already has:

- a live Firebase Hosting deployment
- a working public SSR layer for major SEO routes
- category, manufacturer, model, dealer, listing, and sitemap route support
- a React application that still carries both public and authenticated concerns

Today the project still needs:

- one canonical top-level market hub instead of two near-duplicate ones
- stronger route-quality rules so thin pages do not enter the index
- a more deliberate split between public web, authenticated app, and API surfaces
- read-optimized public data models instead of relying too heavily on raw listing reads
- operational tooling that matches an enterprise marketplace

## Non-Negotiable Principles

- One canonical page per primary search intent family
- No duplicate or near-duplicate market hubs in the sitemap
- No thin pages in the canonical graph just because a route can technically exist
- Public SEO pages should render meaningful HTML on first response
- Authenticated workflows should not dictate public-site architecture
- Firestore should remain the system of record, but not the only read model
- Dealer and seller growth features should be treated as core product infrastructure, not bolt-ons

## Primary Decision

### Canonical market-hub rule

TimberEquip should have one indexable top-level market hub.

Recommended default:

- keep `/forestry-equipment-for-sale` as the umbrella canonical market hub
- either redirect `/logging-equipment-for-sale` to it, or repurpose `/logging-equipment-for-sale` into a truly narrower logging-only vertical

Why:

- `forestry` is the broader marketplace umbrella
- it better fits a dealer marketplace that may expand beyond strictly logging-only equipment
- it creates a cleaner information architecture for categories, manufacturers, models, and dealer storefronts

Exception:

- if keyword and revenue evidence show that `logging equipment for sale` is clearly the stronger commercial primary term, then flip the rule:
- make `/logging-equipment-for-sale` canonical
- redirect `/forestry-equipment-for-sale`

What should never remain true:

- both routes stay indexable while serving materially the same inventory and intent

## North-Star Architecture

### 1. Public web

Primary surface:

- `www.timberequip.com`

Responsibilities:

- home page
- market hub
- category pages
- manufacturer pages
- model pages
- state pages
- dealer storefront pages
- listing detail pages
- buying guides and editorial support pages

Delivery model:

- framework SSR or ISR for public pages
- static assets through CDN
- self-referencing canonical URLs
- structured data by page type

### 2. Authenticated app

Primary surface:

- `app.timberequip.com`

Responsibilities:

- seller dashboard
- dealer onboarding
- inventory management
- billing
- DealerOS management
- embeds, integrations, and feed controls
- admin operations

Delivery model:

- React application with app-style navigation and authenticated state

### 3. API and integration layer

Primary surface:

- `api.timberequip.com`

Responsibilities:

- dealer feed ingest
- webhook intake
- embed script delivery
- sync status and audit endpoints
- internal job triggers
- partner and syndication endpoints

Delivery model:

- Firebase Functions or Cloud Run services behind stable API contracts

### 4. Data model strategy

System of record:

- Firestore write model for listings, dealers, sellers, feeds, invoices, subscriptions, and content

Public read models:

- `publicListings`
- `dealerPages`
- `routeStats`
- `sitemapEntries`
- `seoRouteIndex`
- optional editorial support collections for guide-to-category and guide-to-manufacturer relationships

Goal:

- public SEO pages should read pre-shaped data designed for fast page assembly
- the public layer should not depend on repeated expensive route-time joins wherever avoidable

## Delivery Phases

### Phase 0: Decision and cleanup

Objective:

- choose the single canonical market hub and remove duplicate ambiguity

Implementation:

- confirm the canonical market term with business and keyword evidence
- redirect the non-canonical top-level hub to the canonical one
- redirect the non-canonical state-market family as well
- remove the non-canonical family from sitemap generation
- update internal nav, breadcrumbs, route docs, and structured data references

Acceptance criteria:

- one indexable top-level market hub exists
- one state-market family exists for that hub
- the duplicate family does not appear in sitemap output
- no internal links promote the retired family as primary

### Phase 1: Canonical graph and quality thresholds

Status:

- implemented in the clean clone via canonical market-hub redirects, threshold-aware sitemap generation, and thin-route `noindex` or redirect behavior across the major public route families

Objective:

- ensure only useful pages can become indexable

Implementation:

- define minimum inventory thresholds for category, manufacturer, model, state, dealer, manufacturer plus model, manufacturer plus category, and state plus category routes
- define below-threshold behavior using noindex, redirect-to-parent, or 404 depending on the route family
- create documented rules for empty pages, sparse pages, sold-out pages, and expired inventory

Acceptance criteria:

- thin routes no longer enter the sitemap by accident
- low-value combinations cannot quietly become canonical
- route-quality rules are written and testable

### Phase 2: Public read-model pipeline

Status:

- foundation implemented in the clean clone via `publicListings`, `publicDealers`, and `seoRouteIndex` collections, plus Firestore-triggered sync and scheduled rebuild support
- SSR now prefers the denormalized public collections and uses the route index for sitemap generation, with raw-listing fallback still in place for rollout safety

Objective:

- make SEO pages faster, more stable, and less coupled to raw transactional reads

Implementation:

- build Firebase-triggered denormalization into public read collections
- materialize listing summary documents, dealer summary documents, route counts, sitemap candidates, and top related links per category, manufacturer, model, and state
- include `lastmod` data for each canonical route
- add cache invalidation rules when listings change state

Acceptance criteria:

- public route generation uses read-optimized documents
- sitemap generation does not need to infer everything from scratch at request time
- dealer and model pages can be assembled deterministically

### Phase 3: Public-web platform hardening

Objective:

- move from a good hybrid implementation to a more enterprise-grade public platform

Implementation:

- evaluate the final public rendering platform, either by hardening the current Firebase SSR layer or by migrating public routes to a framework-native SSR or ISR stack such as Next.js on Firebase App Hosting
- keep the authenticated app as a separate concern
- preserve API compatibility during migration
- create preview environments for public-route changes
- create environment separation for development, staging, and production

Acceptance criteria:

- public web can ship independently of the app dashboard
- deployments have lower blast radius
- public route performance and metadata are consistent across environments

### Phase 4: Structured data and content depth

Objective:

- make the site easier for Google to understand and stronger for commercial search intent

Implementation:

- standardize structured data for home, category pages, manufacturer pages, model pages, dealer pages, listing pages, and guides
- add route-specific editorial sections for category buying guidance, manufacturer overviews, model summaries, and dealer trust or service-area content
- create guide-to-route internal linking so editorial content reinforces marketplace pages

Acceptance criteria:

- every indexable page type has a defined schema pattern
- route templates contain enough unique context to deserve indexation
- public pages gain stronger internal-link depth

### Phase 5: Enterprise search and discovery

Objective:

- make the marketplace easier to browse while keeping SEO structure clean

Implementation:

- keep canonical SEO routes clean and stable
- move richer faceted search behavior into the app or a dedicated search surface
- introduce a dedicated search index for autocomplete, faceting, and ranking support
- create dealer embed and ad widgets that point back to canonical dealer and listing URLs
- expose reliable feed and syndication surfaces for partners

Acceptance criteria:

- search UX improves without polluting the canonical graph
- dealers get stronger distribution tools
- ads and embeds reinforce canonical URLs instead of fragmenting them

### Phase 6: Operations, measurement, and governance

Objective:

- run the public marketplace like an enterprise product

Implementation:

- set up Search Console monitoring and sitemap submission workflow
- add smoke tests for critical public SSR routes
- add route-level monitoring, alerting, and error budgets
- add deploy checklists for metadata, canonicals, robots, and sitemap validation
- track Core Web Vitals and route performance
- document rollback procedures for public-web deployments

Acceptance criteria:

- deploys are observable
- canonical regressions are caught quickly
- route failures can be isolated and rolled back

## Immediate Execution Order

### Sprint 1

- decide the canonical market hub
- remove the duplicate hub family from sitemap and primary navigation
- implement redirects for the retired market-hub family
- update all route docs to reflect the new canonical policy

### Sprint 2

- add route-quality thresholds
- define below-threshold behavior
- prevent empty and low-value pages from being indexed
- add sitemap inclusion rules with `lastmod`

### Sprint 3

- build public read models
- precompute route statistics and related-link modules
- reduce route-time data assembly complexity

### Sprint 4

- separate public-web and authenticated-app concerns more clearly
- formalize the long-term rendering platform
- create a production-safe preview and rollout workflow

### Sprint 5

- expand structured data coverage
- deepen route content with buying guides, FAQs, and trust blocks
- launch stronger dealer and model page templates

## Required Document Updates

The following docs should be aligned after Phase 0:

- `SEO_PHASE_1_URL_MAP_AND_TEMPLATES.md`
- `SEO_IMPLEMENTATION_BACKLOG.md`
- `LAUNCH_SEO_BLUEPRINT.md`
- `README.md`

## Success Metrics

- one canonical market-hub family is live
- duplicate market routes are removed from the sitemap
- all indexable public pages emit self-referencing canonical URLs
- all indexable public pages emit page-type-appropriate JSON-LD
- empty or thin pages do not quietly enter the index
- dealer storefronts become a first-class SEO and conversion surface
- public-route deploys are testable, observable, and reversible

## Recommended Next Action

Start with Phase 0 before doing more route expansion.

The single most important cleanup is to stop treating duplicate market hubs as separate SEO assets when they carry the same inventory intent.
