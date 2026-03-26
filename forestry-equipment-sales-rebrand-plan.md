# Forestry Equipment Sales Rebrand and DealerOS Implementation Plan

## Executive Summary

This plan covers the transition from Forestry Equipment Sales to a two-layer product architecture:

- Forestry Equipment Sales becomes the public marketplace brand.
- DealerOS becomes the dealer-facing operating system.
- DealerOS+ becomes the visible super admin control layer.

The immediate goal is a safe visible rebrand and product restructuring without changing the live primary domain yet. Domain migration, redirect strategy, and SEO cutover remain a separate future phase.

This version is written as an execution document, not just a concept brief. It defines scope, naming rules, repo touchpoints, workstreams, rollout phases, acceptance criteria, and implementation risks.

---

# 1. Scope

## In Scope Now

- Replace visible Forestry Equipment Sales branding across the app, emails, legal pages, and admin surfaces.
- Introduce DealerOS as the dealer-facing product name.
- Introduce DealerOS+ as the visible super admin product label.
- Retire user-facing dealer profile and pro profile positioning.
- Restructure navigation and copy around marketplace plus operating system language.
- Define the ingestion, mapping, and dealer operations model around DealerOS.
- Preserve current routes and primary domain behavior.

## Explicitly Out of Scope for This Phase

- Primary domain migration
- Global env var renames unless required for functionality
- Storage bucket renames
- Firestore collection renames unless there is a strong functional reason
- Full billing redesign
- Complete ingestion engine build if backend support is not ready yet

## Constraint

The public domain stays in place for this phase. Visible brand, product naming, templates, dashboards, and policy language change now. Canonical domain cutover happens later.

---

# 2. Brand Architecture

## Public Marketplace Brand

Name: Forestry Equipment Sales

Purpose:
- Buyer acquisition
- Search and browse experience
- Public listings
- Lead capture
- Public trust and SEO visibility

## Dealer Product

Name: DealerOS

Purpose:
- Inventory management
- Feed and import operations
- Ad program controls
- Lead handling
- Listing performance visibility
- Dealer settings and integrations

## Admin Product

Name: DealerOS+

Purpose:
- Global oversight
- Dealer management
- Listing moderation
- Feed and mapping control
- Analytics and diagnostics
- System configuration

---

# 3. Naming Rules

## Visible Naming

- Forestry Equipment Sales becomes Forestry Equipment Sales when referring to the marketplace, company, public site, and customer-facing brand.
- Dealer dashboard and dealer tooling become DealerOS.
- Super admin surfaces should visually read as DealerOS+ where product branding is shown.
- Admin is still a functional permission level. DealerOS+ is the amin's visible system label, not necessarily a replacement for every technical permission string.

## Role and Product Model Clarification

Remove these concepts from visible UX and sales language:
- Dealer Profile
- Pro Dealer Profile
- Profile-tier messaging based on visibility alone

Replace with:
- DealerOS access
- Dealer and Pro Dealer account tiers
- Ad Programs
- Imports and integrations
- Lead operations
- Analytics and distribution controls

Important distinction:
- The product should stop talking about profiles.
- The system can still retain canonical access roles like dealer and pro_dealer internally where needed.

## Internal Naming Guardrails

Do not mass-rename internal identifiers unless needed for correctness or maintainability. This includes:
- Firebase project identifiers
- env vars
- bucket names
- queue names
- internal analytics keys
- webhook event names
- legacy collection names that are still working

Visible rebrand first, internal migration second.

---

# 4. Current Product Direction

## Public Experience

Forestry Equipment Sales should feel like a marketplace, not like an admin tool.

Public responsibilities:
- Category pages
- Listing pages
- Search and browse
- Dealer discovery pages
- Lead capture forms
- SEO content and blog
- Dealer marketing and sign-in entry points

## Dealer Experience

DealerOS should feel like operating software.

Dealer responsibilities:
- Inventory creation and updates
- Imports and external feed configuration
- Publication state management
- Ad program controls
- Lead intake and tracking
- Analytics and sync visibility

## Admin Experience

DealerOS+ should feel like a system console.

Admin responsibilities:
- User and dealer oversight
- Inventory moderation
- Feed monitoring
- Mapping and normalization management
- Global analytics
- Operational diagnostics

---

# 5. Workstreams

## Workstream A: Brand Replacement

### Objective

Remove visible Forestry Equipment Sales references without breaking live behavior.

### Surfaces to Audit

- app chrome
- headers and footers
- auth pages
- profile pages
- dashboards
- admin pages
- meta titles and descriptions
- OG tags
- manifest and favicon assets
- CMS content
- email templates
- legal pages
- support text
- system notifications
- loading states and empty states

### Replacement Rules

- Forestry Equipment Sales to Forestry Equipment Sales for public-facing brand references
- Forestry Equipment Sales Dashboard to DealerOS or DealerOS Dashboard
- Super admin system labels to DealerOS+
- Keep current live URLs working even if the visible text changes

## Workstream B: Product Copy and Navigation

### Objective

Align the app language to the new architecture.

### Public Navigation

- Browse Equipment
- Sell Equipment
- Advertise With Us
- Dealers
- Contact
- Sign In

### DealerOS Navigation

- Dashboard
- Inventory
- Ad Programs
- Leads
- Imports
- Integrations
- Analytics
- Settings
- Billing later

### DealerOS+ Navigation

- Overview
- Dealers
- Listings
- Imports
- Feed Logs
- Mappings
- Leads
- Analytics
- Admin Settings

## Workstream C: Product Model Cleanup

### Objective

Replace legacy profile-tier positioning with an operating-system model.

### User-Facing Changes

- Remove dealer profile and pro profile language from pages, pricing, and calls to action.
- Reframe dealer value around operations, ads, imports, and lead management.
- Keep storefront capability where it makes product sense, but stop presenting it as the core dealer identity.

### System Rule

The public brand is Forestry Equipment Sales. The dealer product is DealerOS. The super admin layer is DealerOS+.

## Workstream D: Email Rebrand

### Objective

Make system emails consistent with the new brand and the new product segmentation.

### Templates to Update

- welcome and verification
- password reset
- contact confirmations
- inquiry confirmations
- financing notifications
- subscription and billing emails
- listing submission and approval emails
- managed account invites
- import and feed alerts
- internal admin notifications

### Footer Standard

```text
Forestry Equipment Sales

You are receiving this email because you are registered with Forestry Equipment Sales or DealerOS.

Privacy Policy | Terms of Service | Cookie Policy
```

### Tone Rules

- buyer-facing emails use marketplace language
- dealer-facing emails mention DealerOS where relevant
- admin-facing emails mention DealerOS+ where relevant
- hidden text, alt text, and surfaced file labels should not leak old brand references

## Workstream E: Legal and Trust Layer

### Objective

Update legal pages to match the new brand and the dealer data model.

### Required Pages

- Privacy Policy
- Terms of Service
- Cookie Policy

### Recommended Additional Pages

- Dealer Data Terms
- Advertising Terms
- Acceptable Use Policy

### Required Legal Coverage

- buyer data collection
- dealer data collection
- lead ownership and handling
- imports and feed processing
- communications and notification rules
- retention and deletion rights
- processor disclosure
- role-based access boundaries

### Required Dealer Trust Language

- dealer inventory remains dealer-owned
- dealer leads remain dealer-owned
- platform processes dealer data only for authorized product functions
- platform does not resell dealer data outside approved operations

## Workstream F: DealerOS Product Build

### Objective

Define DealerOS as the operating system for dealer inventory and lead operations.

### Core Modules

#### Dashboard
- active listings
- new leads
- import health
- last sync
- publication status
- ad program summary

#### Inventory
- create and edit listings
- media management
- bulk actions
- draft, active, sold, archived states
- validation warnings

#### Ad Programs
- advertising package visibility
- publish controls
- future channel controls
- featured and boosted placement later

#### Imports
- JSON upload
- JSON feed URL
- API ingestion
- CSV upload
- manual entry
- preview and validation
- sync history
- error reporting

#### Integrations
- source credentials
- feed setup
- API tokens
- webhook support later

#### Leads
- lead inbox
- listing association
- source attribution
- status tracking
- notes later

#### Analytics
- views
- leads per listing
- source performance
- import success and failure trends
- top-performing inventory

#### Settings
- account profile
- contact details
- notification preferences
- brand settings where needed
- managed users later

## Workstream G: DealerOS+ Admin Build

### Objective

Define DealerOS+ as the command layer for platform operations.

### Core Modules

#### Dealers
- account creation and edits
- role and plan assignment
- activation and suspension
- source configuration visibility

#### Listings
- global listing visibility
- moderation
- overrides
- issue resolution

#### Imports
- cross-dealer import visibility
- retry and rerun tools
- source pause and resume
- payload diagnostics where justified

#### Feed Logs
- success and failure history
- mapping failures
- retry history
- last sync visibility

#### Mappings
- mapping profile creation
- field normalization rules
- dealer-level assignment
- category and condition normalization

#### Leads
- cross-dealer debugging access where authorized
- routing diagnostics
- source and dealer filtering

#### Analytics
- total listings
- active dealers
- adoption by source type
- lead trends
- sync failure rates

#### Admin Settings
- system defaults
- import thresholds
- notification rules
- plan configuration later

## Workstream H: Ingestion Architecture

### Objective

Make DealerOS the intake and normalization layer for multiple inventory sources.

### Supported Source Types

- JSON array upload
- JSON feed URL
- API integration
- CSV upload
- manual listing entry

### Dealer Source Config Example

```json
{
  "dealerId": "123",
  "sourceType": "json|api|csv|manual",
  "sourceConfig": {},
  "mappingProfile": "standard_v1",
  "syncFrequencyMinutes": 30,
  "isActive": true
}
```

### Mapping Requirements

Handle normalization for cases like:
- manufacturer versus make
- machine_hours versus hours
- single image string versus image arrays
- external category names versus canonical taxonomy

## Workstream I: Canonical Data Architecture

### Objective

Keep DealerOS as the source of truth for inventory and lead operations, with Forestry Equipment Sales as the public presentation layer.

### Canonical Listing Model

```json
{
  "id": "uuid",
  "dealerId": "uuid",
  "externalId": "source-record-id",
  "title": "",
  "category": "",
  "make": "",
  "model": "",
  "year": 0,
  "hours": 0,
  "price": 0,
  "status": "active",
  "condition": "used",
  "locationCity": "",
  "locationState": "",
  "description": "",
  "images": [],
  "sourceType": "json",
  "mappingProfile": "standard_v1",
  "channels": {
    "forestryEquipmentSales": {
      "published": true,
      "externalId": ""
    }
  },
  "createdAt": "",
  "updatedAt": ""
}
```

### Canonical Lead Model

```json
{
  "id": "uuid",
  "listingId": "uuid",
  "dealerId": "uuid",
  "source": "forestryEquipmentSales",
  "name": "",
  "email": "",
  "phone": "",
  "message": "",
  "status": "new",
  "createdAt": ""
}
```

### Pipeline

```text
Dealer source -> DealerOS ingest -> mapping and normalization -> canonical records -> publication to Forestry Equipment Sales -> buyer lead -> DealerOS lead inbox
```

---

# 6. Repo Touchpoints

The implementation should be mapped to the current codebase instead of treated as a greenfield redesign.

## Frontend Branding and Shell

Likely touchpoints:
- TimberEquip-main/src/App.tsx
- TimberEquip-main/src/components/Layout.tsx
- TimberEquip-main/src/components/Seo.tsx
- TimberEquip-main/src/index.css
- TimberEquip-main/index.html
- TimberEquip-main/public/site.webmanifest
- TimberEquip-main/public/robots.txt
- TimberEquip-main/public/logos
- TimberEquip-main/logos

## Public Pages and Marketing Copy

Likely touchpoints:
- TimberEquip-main/src/pages/Home.tsx
- TimberEquip-main/src/pages/About.tsx
- TimberEquip-main/src/pages/AdPrograms.tsx
- TimberEquip-main/src/pages/Blog.tsx
- TimberEquip-main/src/pages/BlogPostDetail.tsx
- TimberEquip-main/src/pages/Categories.tsx
- TimberEquip-main/src/pages/Contact.tsx if present

## Auth and Profile Surfaces

Likely touchpoints:
- TimberEquip-main/src/components/AuthContext.tsx
- TimberEquip-main/src/pages/Profile.tsx
- TimberEquip-main/src/pages/Login.tsx
- TimberEquip-main/src/pages/Register.tsx
- TimberEquip-main/src/components/ProtectedRoute.tsx

## DealerOS and DealerOS+ Surfaces

Likely touchpoints:
- TimberEquip-main/src/pages/AdminDashboard.tsx
- TimberEquip-main/src/components/admin
- TimberEquip-main/src/pages/Sell.tsx
- TimberEquip-main/src/pages/SellerProfile.tsx
- TimberEquip-main/src/components/BrandAssetManager.tsx

## Services and Business Logic

Likely touchpoints:
- TimberEquip-main/src/services/userService.ts
- TimberEquip-main/src/services/equipmentService.ts
- TimberEquip-main/src/services/adminUserService.ts
- TimberEquip-main/src/services/billingService.ts
- TimberEquip-main/src/services/dealerFeedService.ts
- TimberEquip-main/src/services/cmsService.ts

## Backend and Rules

Likely touchpoints:
- TimberEquip-main/functions/index.js
- TimberEquip-main/functions/email-templates/index.js
- TimberEquip-main/firestore.rules
- TimberEquip-main/storage.rules
- TimberEquip-main/firebase.json

## Existing Docs to Align

Likely touchpoints:
- TimberEquip-main/EXECUTION_CHECKLIST.md
- TimberEquip-main/SEO_IMPLEMENTATION_BACKLOG.md
- TimberEquip-main/WEBSITE_AUDIT_REPORT.md
- TimberEquip-main/DEALER_API_INTEGRATION_SPEC.md
- TimberEquip-main/FIREBASE_* docs

---

# 7. Rollout Phases

## Phase 1: Audit and Decision Freeze

Deliverables:
- brand string inventory
- asset inventory
- email template inventory
- legal page inventory
- route and metadata inventory
- final naming decision list

Exit Criteria:
- no unresolved naming conflicts between public brand, dealer product, and admin product
- no ambiguity about domain freeze for this phase

## Phase 2: Visible Brand Replacement

Deliverables:
- updated logos and icons
- updated public copy
- updated dashboard copy
- updated email headers and footers
- updated metadata and social previews

Exit Criteria:
- no visible Forestry Equipment Sales references remain except where intentionally preserved for technical compatibility

## Phase 3: Product Restructure

Deliverables:
- DealerOS naming across dealer flows
- DealerOS+ naming across super admin surfaces
- removed profile-tier language
- navigation updated to match product model

Exit Criteria:
- dealers no longer see the product framed as a profile package
- admins no longer see legacy TimberEquip-era naming in operational flows

## Phase 4: Legal and Policy Layer

Deliverables:
- updated Privacy Policy
- updated Terms of Service
- updated Cookie Policy
- optional dealer data terms if needed

Exit Criteria:
- legal language matches the actual dealer and lead handling model

## Phase 5: DealerOS Capability Build

Deliverables:
- clarified inventory module
- imports and integrations structure
- lead operations structure
- analytics framing
- source config model

Exit Criteria:
- dealer workflow is legible as operating software

## Phase 6: DealerOS+ Capability Build

Deliverables:
- dealer oversight tools
- import visibility and feed logs
- mapping tools
- diagnostics and analytics

Exit Criteria:
- super admin workflow is legible as a system console

## Phase 7: QA and Release Hardening

Deliverables:
- branded UI review
- email template review
- metadata and SEO review
- auth flow review
- admin and dealer workflow review

Exit Criteria:
- rebrand is consistent across buyer, dealer, and admin experiences

---

# 8. Acceptance Criteria

The rebrand is complete for this phase when all of the following are true:

- public pages consistently use Forestry Equipment Sales
- dealer tooling consistently uses DealerOS
- super admin product branding consistently uses DealerOS+
- no user-facing copy still depends on dealer profile or pro profile positioning
- current live domain and routes continue to work
- email templates are updated and visually consistent
- legal pages are updated to the new brand and data model
- metadata, OG tags, and manifest assets match the new brand
- admin, dealer, and buyer paths still function after the copy and navigation changes

---

# 9. Risks and Controls

## Risk: Visible rebrand leaks into breaking technical renames

Control:
- separate visible naming from internal identifier migration

## Risk: Old brand survives in hidden metadata or emails

Control:
- run explicit audits for meta tags, alt text, template footers, manifest entries, and notification text

## Risk: Product naming conflicts with role naming

Control:
- treat DealerOS and DealerOS+ as product labels, not replacements for all permission strings

## Risk: Domain assumptions break SEO or deep links

Control:
- freeze domain changes for this phase and document domain migration as a future project

## Risk: DealerOS promise exceeds current feature reality

Control:
- separate immediate UI rebrand from later capability expansion and clearly mark deferred modules

---

# 10. Immediate Execution Checklist

## First Implementation Wave

Prioritize the first delivery in this order:

1. Replace visible brand strings in shared layout, SEO, auth, footer, and admin shell.
2. Swap logos, favicon, manifest assets, and email header assets.
3. Update profile, seller, dealer, and admin copy to remove profile-tier positioning.
4. Update core email templates and support signatures.
5. Update legal pages and footer links.
6. Run a full UI, metadata, and email QA pass before moving into deeper DealerOS feature work.

## Brand Audit
- [ ] inventory all visible Forestry Equipment Sales strings
- [ ] inventory all brand assets and manifest references
- [ ] inventory email template brand references
- [ ] inventory metadata and OG references

## UI and Copy
- [ ] replace public Forestry Equipment Sales naming with Forestry Equipment Sales
- [ ] replace dealer dashboard naming with DealerOS
- [ ] replace super admin product labeling with DealerOS+
- [ ] remove dealer profile and pro profile copy
- [ ] update public and dashboard navigation labels

## Assets
- [ ] replace logos in public and dashboard contexts
- [ ] replace favicon and manifest icons
- [ ] replace email header assets
- [ ] replace OG and social preview assets

## Legal
- [ ] update Privacy Policy
- [ ] update Terms of Service
- [ ] update Cookie Policy
- [ ] add dealer data handling language

## Email
- [ ] update all templates and signatures
- [ ] verify support and sender addresses
- [ ] test buyer-facing, dealer-facing, and admin-facing emails

## Product Structure
- [ ] remove profile-tier messaging
- [ ] define DealerOS module labels
- [ ] define DealerOS+ module labels
- [ ] align role-aware UI with the new product language

## QA
- [ ] review auth screens
- [ ] review profile and storefront screens
- [ ] review admin dashboard and dealer flows
- [ ] review metadata and shared assets
- [ ] review all major email templates

---

# 11. Deferred Phase: Domain Migration

This phase is intentionally not part of the current implementation.

Complete it only after the visible rebrand is stable.

Future tasks:
- map canonical URL changes
- set 301 redirects
- update sitemap and Search Console
- update analytics properties
- update email sending domain if needed
- update hardcoded brand URLs
- update webhook documentation and callback URLs if domain-specific

---

# 12. Positioning Statements

## Internal

Forestry Equipment Sales is the public marketplace. DealerOS is the dealer operating system. DealerOS+ is the super admin control layer. The product is being rebranded now while the current domain remains in place. Domain migration is a later technical and SEO phase.

## External

Forestry Equipment Sales helps buyers find equipment and helps dealers manage inventory, imports, leads, and advertising through DealerOS.
