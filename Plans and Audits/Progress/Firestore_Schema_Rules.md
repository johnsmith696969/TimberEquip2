# TimberEquip Firestore Schema & Rules Report

**Date:** April 6, 2026
**Database ID:** `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c`
**Project:** `mobile-app-equipment-sales`
**Rules File:** `firestore.rules` (1,030 lines)

---

## Executive Summary

Firestore serves as the **primary source of truth** for all TimberEquip data. The database contains **48 collections** organized across 6 domains: Marketplace Core, Leads & Inquiries, Billing & Account, Dealer System, Admin & Audit, and SEO Read Models. Comprehensive security rules enforce role-based access control with field-level validation. All collections have corresponding dual-write triggers to PostgreSQL (see PostgreSQL Migration doc).

---

## 1. Collection Inventory (48 Collections)

### 1.1 Marketplace Core (6 collections)

| Collection | Documents | Purpose | Access |
|-----------|-----------|---------|--------|
| `users` | User profiles | Identity, roles, storefront config | Self read/write, admin full |
| `listings` | Equipment listings | Title, specs, price, images, status | Public if approved+paid, seller edit own |
| `storefronts` | Dealer storefronts | Display name, logo, service area | Public if enabled, seller/admin edit |
| `blogPosts` | Blog/news articles | Title, content, SEO, published status | Public read, editor/admin write |
| `news` | Press releases | Title, content, metadata | Public read, admin write |
| `auctions` | Auction events | Title, dates, status, terms | Public read, admin write |
| `auctions/{id}/lots` | Auction lots (subcollection) | Lot details, bids, status | Public read, admin write |

### 1.2 Leads & Inquiries (8 collections)

| Collection | Purpose | Access |
|-----------|---------|--------|
| `inquiries` | Buyer inquiries on listings | Seller/buyer/admin read, authenticated create |
| `financingRequests` | Equipment financing applications | Admin read, authenticated create |
| `calls` | Phone call logs (Twilio) | Seller/caller/admin read, system create |
| `savedSearches` | User saved search criteria | Self read/write |
| `mediaKitRequests` | Seller media kit inquiries | Admin read, authenticated create |
| `contactRequests` | Contact form submissions | Admin read, anyone create |
| `notifications` | User notification queue | Self read, system write |
| `equipmentDuplicates` | Duplicate listing detection | Admin read/write |

### 1.3 Billing & Account (10 collections)

| Collection | Purpose | Access |
|-----------|---------|--------|
| `subscriptions` | Stripe subscription records | Self read, system/admin write |
| `invoices` | Payment invoices | Self read, system/admin write |
| `sellerProgramApplications` | Seller onboarding applications | Self read, system write |
| `sellerProgramAgreementAcceptances` | Legal agreement records | Self read, system write |
| `auditLogs` | General audit trail | Admin only |
| `billingAuditLogs` | Billing state changes | Admin only |
| `accountAuditLogs` | Account state changes | Admin only |
| `consentLogs` | GDPR consent records | Admin only |
| `users/{uid}/bidderProfile` | Auction bidder verification | Self read/write, admin full |
| `auctionInvoices` | Auction payment invoices | Buyer/seller/admin read |

### 1.4 Dealer System (10 collections)

| Collection | Purpose | Access |
|-----------|---------|--------|
| `dealerFeedProfiles` | Feed configuration | Dealer scope, admin full |
| `dealerFeeds` | Feed source records | Dealer scope, admin full |
| `dealerListings` | Imported dealer inventory | Dealer scope, admin full |
| `dealerFeedIngestLogs` | Sync history + errors | Dealer scope, admin read |
| `dealerAuditLogs` | Feed action audit trail | Dealer scope, admin read |
| `dealers` | Dealer organization records | Admin write, public read |
| `dealerUsers` | Dealer team members | Admin write |
| `dealerBranches` | Dealer branch locations | Admin write |
| `dealerMetaConnections` | Meta/Facebook ad connections | Admin write |
| `dealerMetaValidationLogs` | Meta validation records | Admin read |

### 1.5 Admin & Audit (12 collections)

| Collection | Purpose | Access |
|-----------|---------|--------|
| `mediaLibrary` | CMS media assets | Editor create, admin manage |
| `contentBlocks` | CMS content blocks | Editor create, admin manage |
| `media-metadata` | Image/video metadata | Public read, auth create |
| `user-storage-usage` | Per-user storage tracking | Admin read |
| `inventorySnapshots` | Marketplace state snapshots | Admin only |
| `webhook_events` | Stripe webhook log | System only |
| `publicConfigs` | Public configuration flags | Public read, admin write |
| `twilioNumbers` | Phone number assignments | System only |
| `listingAuditReports` | Listing governance reports | Admin only |
| `listingStateTransitions` | Listing state change log | Admin only |
| `listingMediaAudit` | Image validation results | Admin only |
| `listingGovernanceArtifacts` | Denormalized governance data | Admin only |

### 1.6 SEO Read Models (4 collections)

| Collection | Purpose | Rebuild |
|-----------|---------|---------|
| `publicListings` | Denormalized listing data for search | Every 6hrs + on write |
| `publicSellers` | Seller profile snapshots | On write |
| `publicNews` | News article snapshots | On write |
| `publicCategory` | Category page data | Every 6hrs |

---

## 2. Security Rules Architecture

### 2.1 Helper Functions

| Function | Purpose | Location |
|----------|---------|----------|
| `normalizeUserRole()` | Maps role aliases (dealer_staff->dealer) | Rules line 80 |
| `getEffectiveRole()` | Resolves role from claims or user doc | Rules line 86 |
| `isAdmin()` | Checks admin/super_admin/developer role | Rules line 124 |
| `isEditorOrAbove()` | Checks editor + admin roles | Rules line 130 |
| `hasSellerPostingAccess()` | Validates subscription + status + cap | Rules line 96 |
| `isOwner()` | Checks resource ownership | Rules line 143 |
| `isDealerAccount()` | Checks dealer/pro_dealer role | Rules line 150 |
| `isDealerScopeMatch()` | Validates dealer account isolation | Rules line 154 |

### 2.2 Listing Access Control

**Public read requires ALL of:**
- `approvalStatus == 'approved'`
- `paymentStatus == 'paid'`
- `status IN ('sold', 'active')` AND not expired
- OR authenticated as seller/editor/admin

**Create requires:**
- `hasSellerPostingAccess()` — checks subscription status, listing cap, account status

**Update requires:**
- Owner can edit own fields (but not approvalStatus if not admin)
- Editor/admin can edit any field

**Delete requires:**
- Owner or admin

### 2.3 Data Validation Rules

| Field Type | Validation |
|-----------|------------|
| Strings | Length limits (title < 200, description < 10000) |
| Email | Regex format validation |
| Enums | Whitelist validation (status, role, condition) |
| Arrays | Size limits (images < 50, tags < 30) |
| Numbers | Range checks (price >= 0, year >= 1900) |
| URLs | HTTPS prefix check for feed URLs |
| Timestamps | Server timestamp enforcement |

---

## 3. Data Flow Architecture

```
User Action
    |
    v
React Frontend (Firebase SDK)
    |
    v
Firestore Security Rules (1,030 lines validation)
    |
    v
Firestore Document Write
    |
    v
onDocumentWritten Cloud Function Trigger
    |
    v
Dual-Write to PostgreSQL (via Data Connect)
    +
    v
Email Notification (via SendGrid)
    +
    v
SEO Read Model Update
```

---

## 4. Key Design Decisions

1. **Named database:** Uses `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c` instead of `(default)` — allows multi-database isolation
2. **Subcollections:** Only `auctions/{id}/lots/{lotId}/bids` uses deep nesting — keeps most data flat
3. **Denormalized SEO:** `publicListings` collection denormalizes listing + seller data for fast public reads
4. **Seller data in users:** Storefront fields stored directly on user document (not separate collection for individual sellers)
5. **Firestore as source of truth:** All writes go to Firestore first, then dual-write to PostgreSQL

---

## 5. What's Working Well

- Comprehensive security rules with field-level validation
- Role-based access enforced at database layer (not just application)
- Seller posting access tied to subscription status
- Dealer account isolation prevents cross-account data access
- Audit trail collections capture all state changes
- SEO read model pattern provides fast public reads without exposing raw data

---

## 6. What Needs Attention

| Item | Priority | Notes |
|------|----------|-------|
| ~~Hardcoded admin email (line 177)~~ | ~~MEDIUM~~ | COMPLETE — Removed `caleb@timberequip.com`; admin check now uses `request.auth.token.role == 'super_admin'` only |
| Large collections without TTL | LOW | `auditLogs`, `billingAuditLogs` may grow unbounded |
| Subcollection depth | OK | Only 3 levels deep (auctions/lots/bids) |
| Query cost optimization | LOW | Some admin queries scan entire collections |
| Data archival strategy | LOW | No policy for expired listings, old audit logs |
