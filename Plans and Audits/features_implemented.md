# Features Implemented — Forestry Equipment Sales

## What This Website Is

This website is not a simple marketing site. It is a **vertical marketplace and operations platform** built for the forestry, firewood, land-clearing, truck, trailer, sawmill, & parts equipment markets.

In practical business terms, it is a combination of:

- a buyer-facing heavy-equipment marketplace
- a seller subscription platform
- a dealer inventory syndication system
- an admin operations dashboard
- a content and generative SEO publishing engine

## What The Site Does

The platform allows four major groups to work in one system:

### 1. Buyers

Buyers can:

- browse equipment by category, manufacturer, model, state, and dealer
- search inventory with filters for price, year, hours, condition, location, stock number, serial number, features, and attachments
- save favorites and compare machines
- submit inquiries on listings
- request financing
- request inspections
- request logistics/trucking
- save searches and turn on listing alerts

### 2. Sellers

Sellers can:

- register and authenticate
- subscribe to paid ad programs
- create, edit, and manage listings
- upload listing media via API, JSON, CSV, and XLSX
- manage profile and storefront settings
- refresh account access and manage billing via Stripe
- export personal data and request account deletion

### 3. Dealers

Dealers can:

- manage a larger inventory through DealerOS
- import inventory from JSON, API, or CSV dealer feeds
- review sync logs, feed profiles, ingest their website feeds
- manage featured inventory limits
- track inquiries and dealer-facing leads
- review voicemails with embedded VOIP functionality, phone numbers hidden and routed through VOIP
- generate TE/FES public feed and embed snippets for dealer websites
- operate storefront pages for local SEO and dealer storefront inventory pages
- export monthly reports of call logs, inquiries, inspection requests

### 4. Admin / Operations Team

Admins can:

- review, approve, reject, and audit listings
- manage inquiries and calls
- manage user accounts and roles
- create managed accounts for staff (super admin, admin, content editor, listing editor, developer, full access)
- monitor subscriptions, invoices, and billing audit logs
- operate blog and CMS content
- manage media and dealer feed ingestion

## How The Site Operates

## Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion

The frontend is a route-based SPA with lazy-loaded pages for most major route groups.

## Backend

- Express server in `server.ts`
- Firebase Cloud Functions in `functions/`
- Firestore for primary app data
- Firebase Auth for authentication and roles
- Firebase Storage for media
- Stripe for subscriptions and billing

## Data Model

The platform stores and manages:

- users and managed sub-accounts
- listings and listing lifecycle metadata
- inquiries and calls
- subscriptions and invoices
- blog posts and content blocks
- dealer feed profiles and logs
- marketplace stats and snapshots

## SEO And Public Route Model

The site includes a hybrid public-route layer that supports:

- category landing pages
- manufacturer landing pages
- manufacturer + model pages
- state market pages
- dealer directory and dealer inventory pages
- sitemap generation

This is important because it means the site is built not only as a marketplace, but also as a search acquisition machine.

## Billing And Access Model

The website/application billing model is not theoretical. The codebase includes:

- paid plan definitions
- Stripe checkout session creation
- billing portal support
- subscription refresh logic
- account access refresh
- listing visibility rules tied to subscription state
- billing audit logs and subscription records

## AI And Market Intelligence

The site also includes:

- home-page market metrics and category intelligence cards
- financing calculators and financing-request capture

## Features Already Implemented

## Public Marketplace Features

- Home page with featured inventory, sold inventory ticker, category cards, and market metrics
- Search page with multi-filter equipment discovery
- Listing detail pages
- Category, manufacturer, model, state, and dealer landing pages
- Compare page
- Bookmarks page
- Seller/dealer public profile pages
- Blog and blog post detail pages
- Contact, About, Privacy, Terms, Cookies, and DMCA pages

## Seller Features

- Login and registration
- Protected seller routes
- Sell page with listing creation and editing
- Listing media upload flows
- Profile page with account settings
- Billing portal launch
- Notification preferences
- SMS MFA/2FA support
- Data export and account deletion requests

## Dealer Features

- DealerOS dashboard
- Inventory filtering for live, featured, imported, and sold inventory
- Dealer feed setup for JSON, XML, XLSX, and CSV
- Saved feed profiles and sync logs
- Public dealer feed URLs
- Dealer embed script / iframe support
- Lead and inquiry management
- Voicemail management
- VOIP secure listing details

## Admin Features

- Dashboard overview and operational tabs
- Listing review summaries and lifecycle audit views
- Inquiry management
- Call log visibility
- User and account management
- Managed account creation (block, reset password, edit role, etc)
- Billing dashboard
- CMS / content editor
- Media library
- Dealer feed administration

## Platform / Governance Features

- Firestore rules and Storage rules
- Role-based access control
- CSRF token endpoint and fetch helper (security implementation)
- API rate limiting
- Stripe webhook processing and deduplication
- Environment-aware SEO deploy mode scripts
- Listing governance and lifecycle support files

## What Enterprise-Level Website This Is

The most accurate classification is:

**A Tier 2.5 enterprise vertical marketplace platform**

Why that label fits:

- It already has real marketplace workflows
- It already has real billing and access control
- It already has real admin tooling
- It already has dealer/inventory syndication capability
- It already has SEO route architecture beyond a normal marketplace MVP

## A Simple Tier Model

### Tier 1

- brochure site
- lead forms
- no real platform behavior

### Tier 2

- authenticated marketplace or transaction site
- basic CRUD and payments
- admin panel

### Tier 2.5

- multi-role platform
- dealer operations
- SEO architecture
- billing and subscription logic
- operational dashboards
- meaningful internal tooling

### Tier 3

- hardened enterprise operations
- clean quality gates
- automated testing and release confidence
- scalable search and data architecture
- observability, staging discipline, and operational resilience

Forestry Equipment Sales is clearly above Tier 2. It is best described as **Tier 2.5 moving toward Tier 3**.

## What It Needs To Accomplish Tier 3

### 1. Engineering Hardening

- zero TypeScript errors
- CI that blocks deploys on failed typecheck, tests, or smoke checks
- modularization of the largest files and services

### 2. Security Hardening

- restore production security headers
- move away from permissive CORS
- remove hardcoded privileged identities
- replace deprecated CSRF dependency
- implement real malware scanning for uploads

### 3. Quality Assurance Maturity

- unit tests for core services and access rules
- integration tests for billing and listing lifecycle
- end-to-end tests for buyer, seller, dealer, and admin flows

### 4. Search And Scale Readiness

- server-side filtering and pagination
- indexed or dedicated search architecture
- reduced taxonomy payload size
- lighter route payloads for search, profile, dealer, and admin screens

### 5. Platform And Data Maturity

- stronger canonical listing governance
- cleaner data contracts between app, functions, and future PostgreSQL/Data Connect layers
- more explicit observability and anomaly reporting

### 6. Operational Discipline

- reproducible local setup
- safer environment separation
- stronger deployment guardrails
- automated checks for noindex/indexable mode and 404 behavior

## Bottom-Line Business Description

If you need one short business summary for presentation purposes, use this:

**This website is a full-stack forestry equipment marketplace and dealer operations platform that combines buyer search, seller subscriptions, dealer inventory syndication, admin oversight, billing, media handling, and SEO publishing in one system.**

That is already an enterprise-caliber product direction. What remains is making the platform enterprise-caliber in **hardening, automation, and scale discipline**, not inventing the core product from scratch.