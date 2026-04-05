# TimberEquip Auction Platform — Complete Implementation Plan

> **Created**: April 4, 2026
> **Status**: Comprehensive plan — covers every aspect of the auction platform
> **Current completion**: ~40-50% (UI scaffolding done, all server-side logic missing)

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database & Data Model](#3-database--data-model)
4. [Phase 1: Bid Placement Engine (Cloud Functions)](#phase-1-bid-placement-engine)
5. [Phase 2: Stripe Identity & Pre-Authorization](#phase-2-stripe-identity--pre-authorization)
6. [Phase 3: Soft-Close & Lot Closing Engine](#phase-3-soft-close--lot-closing-engine)
7. [Phase 4: Auction Lifecycle Management](#phase-4-auction-lifecycle-management)
8. [Phase 5: Settlement & Invoicing](#phase-5-settlement--invoicing)
9. [Phase 6: Admin Lot Management & Dashboard](#phase-6-admin-lot-management--dashboard)
10. [Phase 7: Lot Detail Page & Bidding UI](#phase-7-lot-detail-page--bidding-ui)
11. [Phase 8: Notifications & Watchlists](#phase-8-notifications--watchlists)
12. [Phase 9: Seller/Dealer Auction Tools](#phase-9-sellerdealer-auction-tools)
13. [Phase 10: Sales Tax, Compliance & Legal](#phase-10-sales-tax-compliance--legal)
14. [Phase 11: Firestore Security Rules](#phase-11-firestore-security-rules)
15. [Phase 12: Testing & QA](#phase-12-testing--qa)
16. [Role Matrix](#role-matrix)
17. [Risk Register](#risk-register)

---

## 1. Current State Audit

### What's Built (Working)

| Component | File | Status |
|-----------|------|--------|
| Auction types & interfaces | `src/types.ts` (lines 503-650) | Complete — Auction, AuctionLot, AuctionBid, BidderProfile, AuctionInvoice |
| Auction fields on Listing | `src/types.ts` (lines 244-251) | Complete — auctionId, auctionSlug, currentBid, bidCount, lotNumber |
| Auction Firestore service | `src/services/auctionService.ts` | Complete — CRUD, lots, real-time listeners, bid helpers |
| Auction directory page | `src/pages/Auctions.tsx` | Complete — active/upcoming/past groups, featured hero, How It Works |
| Auction catalog page | `src/pages/AuctionDetail.tsx` | Complete — lot grid, filters, info accordions, real-time updates |
| Bidder registration form | `src/pages/BidderRegistration.tsx` | UI complete — 3-step flow (info, payment placeholder, terms) |
| Admin auction tab | `src/pages/AdminDashboard.tsx` | Partial — create/edit/publish auctions, no lot management |
| ListingDetail auction mode | `src/pages/ListingDetail.tsx` | UI complete — bid card, timer, history panel (bidding disabled) |
| ListingCard auction badges | `src/components/ListingCard.tsx` | Complete — Gavel pill, bid price, Place Bid CTA |
| Search auction filter | `src/pages/Search.tsx` | Complete — "Auction Items" toggle |
| App routes | `src/App.tsx` | Complete — /auctions/:slug, /auctions/:slug/register |
| Bid increment tiers | `auctionService.getBidIncrement()` | Complete — 10 tiers from $10 to $10,000 |
| Buyer premium tiers | `auctionService.getBuyerPremium()` | Complete — 10%/7%/5%/3% tiered |
| Time remaining display | `auctionService.formatTimeRemaining()` | Complete |

### What's Stubbed (Code Exists but Non-Functional)

| Component | Issue |
|-----------|-------|
| **Bid placement** | ListingDetail "Place Bid" button shows alert instead of placing bids |
| **Payment pre-auth** | BidderRegistration Step 2 is placeholder text — no Stripe integration |
| **Identity verification** | `idVerificationStatus` field exists, always 'not_started' |
| **Phone verification** | `phoneVerified` field exists, always false |
| **Verification tier** | Hardcoded to 'verified' on registration — no actual verification |
| **Invoice generation** | Functions exist in auctionService, never called |
| **Soft-close logic** | Parameters stored (thresholdMin, extensionMin), never executed |
| **Reserve enforcement** | `reservePrice` and `reserveMet` fields exist, no enforcement |

### What's Missing Entirely

| Component | Priority |
|-----------|----------|
| `placeBid` Cloud Function (server-side transaction) | **Critical** |
| Lot detail page (`/auctions/:slug/lots/:lotNumber`) | **Critical** |
| Stripe Identity verification flow | **Critical** |
| Stripe pre-auth hold ($250) | **Critical** |
| Lot closing engine (Cloud Tasks + cron fallback) | **Critical** |
| Soft-close extension logic | **Critical** |
| Invoice generation on lot close | **High** |
| Payment collection (wire/ACH/card) | **High** |
| Admin lot management UI (add/edit/remove lots) | **High** |
| Admin bidder verification panel | **High** |
| Admin invoice/settlement dashboard | **High** |
| Proxy/max bidding engine | **High** |
| Bid retraction | **Medium** |
| Lot watchlist & notifications | **Medium** |
| Seller auction tools in DealerOS | **Medium** |
| Non-payment handling & relisting | **Medium** |
| Sales tax calculation (Avalara/Stripe Tax) | **Medium** |
| Seller commission & payout via Stripe Connect | **Medium** |
| Staggered lot closing | **Medium** |
| Soft-close group handling | **Low** |
| International bidder handling | **Low** |
| Equipment removal tracking | **Low** |
| Storage fee tracking | **Low** |

---

## 2. Architecture Decisions

### Firestore vs PostgreSQL

**Decision: Keep Firestore for Phase 1 auction launch. Plan PostgreSQL migration for Phase 2 reporting.**

| Factor | Firestore (Phase 1) | PostgreSQL (Phase 2) |
|--------|---------------------|---------------------|
| Real-time bid display | Built-in `onSnapshot` — zero new infra | Requires WebSocket server |
| Write throughput per lot | ~1/sec sustained — sufficient for equipment auctions | Thousands/sec with row locking |
| Transaction safety | Serializable, fails under extreme contention | Full ACID with `SELECT FOR UPDATE` |
| Data integrity | No FK/CHECK constraints — enforce in code | Full relational constraints |
| Settlement queries | Very limited — no JOINs | Full SQL for reporting |
| Operational cost | Already running | Need Cloud SQL + connection pooling |

**Rationale**: Heavy equipment auctions typically see 5-20 active bidders per lot with peak activity of 1-3 bids/second in final minutes. Firestore's ~1 write/sec per-document limit is adequate. The soft-close mechanism spreads bid activity over a longer tail instead of concentrating at a hard close. For a forestry equipment auction with 50-200 lots per event, Firestore handles the volume.

**When to migrate**: If auctions grow beyond 500 lots/event, or if settlement reporting/financial reconciliation becomes complex enough to need SQL JOINs. The existing type definitions (`AuctionInvoice`, `AuctionLot`, `AuctionBid`) map cleanly to relational tables.

### Bid Placement: Cloud Functions (Server-Side Only)

**Decision: ALL bid placement through Cloud Functions, never client-side.**

Reasons:
- Firestore security rules cannot enforce bid increment logic, soft-close timing, or cross-document consistency
- Server-side transactions use pessimistic locking (better for contention than client optimistic retry)
- Prevents bid manipulation (someone changing amounts in browser devtools)
- Server-authoritative timestamps (no clock-skew issues)
- Can integrate notifications, proxy bidding, and soft-close logic atomically

### Stripe Integration Strategy

**Decision: Use Stripe Identity + PaymentIntents (manual capture) + Connect (future).**

| Stripe Product | Purpose |
|---------------|---------|
| **Stripe Identity** | Government ID + selfie verification for Tier 3 bidders |
| **PaymentIntents (manual capture)** | $250 pre-authorization hold on bidder registration |
| **Stripe Checkout** | Existing seller subscription billing (already integrated) |
| **Stripe Connect** (Phase 2) | Seller commission payouts, destination charges |
| **Stripe Tax** (Phase 2) | Automated sales tax calculation by jurisdiction |

### Real-Time Architecture

```
Browser (onSnapshot)        Cloud Function (placeBid)        Cloud Tasks
        │                          │                            │
        ├── lots/{lotId}  ◄────── tx.update(lot) ──────►  scheduleLotClose
        │                          │                            │
        ├── bids/{bidId}  ◄────── tx.create(bid)               │
        │                          │                            │
        └── auction       ◄────── tx.update(totalBids)    closeLotTask
                                                               │
                                                         generateInvoice
```

---

## 3. Database & Data Model

### Firestore Collection Structure

```
auctions/
├── {auctionId}/
│   ├── [Auction document]
│   └── lots/
│       └── {lotId}/
│           ├── [AuctionLot document]
│           └── bids/
│               └── {bidId}/
│                   └── [AuctionBid document]

users/
└── {userId}/
    └── bidderProfile/
        └── profile/
            └── [BidderProfile document]

auctionInvoices/                    ← renamed from 'invoices' to avoid collision
└── {invoiceId}/                       with existing Stripe billing invoices
    └── [AuctionInvoice document]
```

**Important**: The existing `invoices` collection is used by Stripe billing for seller subscriptions. Auction invoices MUST use a separate collection (`auctionInvoices`) to avoid conflicts.

### Required Firestore Indexes

```
# Composite indexes needed for auction queries

# Lots by auction, ordered by close time
auctions/{auctionId}/lots: status ASC, endTime ASC

# Lots by auction, ordered by lot number
auctions/{auctionId}/lots: closeOrder ASC

# Bids by lot, ordered by amount descending
auctions/{auctionId}/lots/{lotId}/bids: amount DESC

# Bids by lot, ordered by timestamp
auctions/{auctionId}/lots/{lotId}/bids: timestamp DESC

# Auction invoices by buyer
auctionInvoices: buyerId ASC, createdAt DESC

# Auction invoices by status
auctionInvoices: status ASC, dueDate ASC

# Auction invoices by auction
auctionInvoices: auctionId ASC, createdAt DESC
```

### Type Changes Needed

```typescript
// In src/types.ts — additions/modifications

// Add to BidderProfile:
stripeVerificationSessionId?: string;  // Stripe Identity session
verifiedFirstName?: string;            // From Stripe Identity
verifiedLastName?: string;             // From Stripe Identity

// Add to AuctionLot:
sellerId?: string;        // Equipment owner's UID
secondHighestBid?: number;  // For non-payment fallback
secondHighestBidderId?: string;

// Add to AuctionInvoice:
stripePaymentIntentId?: string;  // Payment tracking
sellerPayoutTransferId?: string; // Stripe Connect transfer ID
removalConfirmedAt?: string;     // Equipment pickup confirmed
storageFeesAccrued?: number;     // Post-deadline storage charges

// New type:
type NotificationType =
  | 'outbid'
  | 'lot_closing_soon'
  | 'lot_extended'
  | 'lot_won'
  | 'lot_lost'
  | 'invoice_generated'
  | 'payment_reminder'
  | 'payment_overdue'
  | 'removal_reminder'
  | 'auction_starting';

interface AuctionNotification {
  id: string;
  userId: string;
  auctionId: string;
  lotId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
```

---

## Phase 1: Bid Placement Engine

> **Priority**: Critical — nothing works without this
> **Files**: `functions/index.js` (new endpoints), `src/services/auctionService.ts` (client calls)

### 1A. `placeBid` Cloud Function

**Endpoint**: Firebase callable function `placeBid`

**Transaction flow** (atomic, server-side):
1. Read lot, auction, and bidder profile documents
2. Validate auction status is `active`
3. Validate lot status is `active` or `extended`
4. Validate lot `endTime` has not passed (server clock)
5. Validate bidder tier (must be `verified` or `approved`)
6. Validate pre-auth hold is active (`preAuthStatus === 'held'`)
7. Validate bid amount >= minimum (startingBid or currentBid + increment)
8. Prevent self-outbidding (currentBidderId !== bidderId)
9. Check non-payment history (nonPaymentCount < 2)
10. Generate deterministic anonymous bidder ID (SHA-256 of uid:auctionId)
11. Create bid document in `lots/{lotId}/bids/`
12. Update lot: currentBid, currentBidderId, bidCount, lastBidTime, reserveMet
13. Check soft-close trigger (time until close < threshold) → extend endTime
14. Increment auction totalBids
15. Return: bidId, amount, triggeredExtension, newEndTime

**Security**:
- Requires Firebase Auth (request.auth.uid)
- All validation server-side — client cannot bypass
- Server-authoritative timestamp
- Idempotency via currentBidderId check

### 1B. Proxy/Max Bidding

**How it works**: Bidder sets a `maxBid`. System automatically places minimum increment bids on their behalf when outbid, up to maxBid.

**Implementation**:
1. Store `maxBid` on the bid document (null for manual bids)
2. In the `placeBid` transaction, after updating the lot, check if the previous high bidder had a proxy bid:
   - If `previousBid.maxBid > newBid.amount`, auto-create a counter-bid at `newBid.amount + increment`
   - If `previousBid.maxBid <= newBid.amount`, proxy is exhausted — previous bidder outbid
3. If the new bidder also has a proxy, resolve: higher maxBid wins at loser's maxBid + increment

**Edge cases**:
- Two proxy bids with same maxBid: first-in-time wins
- Proxy bid exactly at startingBid: accepted at startingBid
- Proxy bid below minimum increment above current: rejected

### 1C. Bid Retraction (UCC 2-328 Compliance)

**Rule**: A bidder may retract before the auctioneer announces completion. Retraction does NOT revive previous bids.

**Implementation**:
- `retractBid` Cloud Function
- Sets bid status to `retracted`
- Lot falls back to the next-highest non-retracted bid
- Only allowed while lot is `active` or `extended`
- Retraction logged for audit (timestamp, reason)
- Max 1 retraction per lot per bidder (prevent abuse)

### 1D. Client-Side Integration

Update `src/services/auctionService.ts`:
```typescript
// New functions
placeBid(auctionId, lotId, amount, maxBid?): Promise<BidResult>
retractBid(auctionId, lotId, bidId): Promise<void>
```

Update `src/pages/ListingDetail.tsx`:
- Replace alert() with actual `auctionService.placeBid()` call
- Show loading state during bid submission
- Handle errors (outbid, auction closed, insufficient tier)
- Optimistic UI update + confirmation from real-time listener

---

## Phase 2: Stripe Identity & Pre-Authorization

> **Priority**: Critical — required before any real bidding
> **Files**: `functions/index.js` (3 new endpoints), `src/pages/BidderRegistration.tsx` (replace Step 2)

### 2A. Stripe Identity Verification

**Cloud Functions**:
- `createIdentityVerificationSession` — creates Stripe Identity session, returns clientSecret
- Webhook handler for `identity.verification_session.verified` and `identity.verification_session.requires_input`

**Client flow**:
1. Bidder clicks "Verify Identity" button
2. Call `createIdentityVerificationSession` Cloud Function
3. Open Stripe Identity modal via `stripe.verifyIdentity(clientSecret)`
4. Stripe handles ID capture + selfie + fraud check
5. Webhook fires → update `idVerificationStatus` to `verified` or `failed`
6. Upgrade `verificationTier` to `approved` on success

**Verification requirements by tier**:

| Tier | Name | Requirements | Can Bid Up To |
|------|------|-------------|---------------|
| `basic` | Browse Only | Email verified + phone | Cannot bid |
| `verified` | Standard Bidder | Credit card + $250 hold | $25,000 |
| `approved` | Full Bidder | Stripe Identity (ID + selfie) | Unlimited |

### 2B. $250 Pre-Authorization Hold

**Cloud Function**: `createPreAuthHold`
1. Get or create Stripe customer for bidder
2. Create PaymentIntent with `capture_method: 'manual'` for $25,000 cents ($250)
3. Return clientSecret for Stripe Elements card form
4. On successful confirmation → update `preAuthStatus` to `held`

**Hold lifecycle**:
- Default duration: 7 days (Visa/MC: extendable to 30 days on IC+ pricing)
- If auction spans >7 days: scheduled function refreshes holds before expiry
- Bidder wins → capture hold as partial payment toward invoice
- Bidder loses → cancel hold (funds released in 1-5 business days)
- Non-payment → capture hold as penalty

**Card restrictions**:
- Reject prepaid cards (`pm.card.funding === 'prepaid'`)
- Reject virtual/gift cards
- Store card fingerprint to prevent duplicate registrations

### 2C. Replace BidderRegistration Step 2

Replace the placeholder text in `BidderRegistration.tsx` Step 2 with:
1. Stripe Elements card input (CardElement or PaymentElement)
2. "Authorize $250 Hold" button → calls `createPreAuthHold`
3. On success: show checkmark, enable Continue
4. On failure: show error, retry button
5. Add optional "Verify Identity" button for Tier 3 upgrade (Stripe Identity modal)

### 2D. Phone Verification (Optional Enhancement)

Use Twilio Verify (already have Twilio credentials in secrets):
1. Send SMS code to provided phone number
2. User enters 6-digit code
3. On match: set `phoneVerified: true`

---

## Phase 3: Soft-Close & Lot Closing Engine

> **Priority**: Critical — auctions can't close without this
> **Files**: `functions/index.js` (2 new functions), Cloud Tasks queue setup

### 3A. Per-Lot Close Task (Cloud Tasks)

**Function**: `closeLotTask` (task-dispatched)

When a lot's `endTime` arrives:
1. Read lot document in transaction
2. Guard: already closed → skip
3. Guard: endTime changed (soft-close extension) → skip (new task handles it)
4. Guard: server time < endTime → skip (early firing)
5. Determine final status:
   - If `reservePrice` exists and `currentBid < reservePrice` → `unsold`
   - If `currentBid > 0` and reserve met → `sold`
   - If `currentBid === 0` → `unsold`
6. Set `winningBidderId`, `winningBid` on sold lots
7. Store `secondHighestBid` and `secondHighestBidderId` (for non-payment fallback)
8. Trigger invoice generation for sold lots

### 3B. Fallback Cron (Cloud Scheduler)

**Schedule**: Every 1 minute

Catches lots where Cloud Tasks missed (network issue, task failure):
1. Query all active auctions
2. For each: query lots where `status IN ['active', 'extended']` AND `endTime <= now`
3. Close each lot using same logic as 3A

### 3C. Soft-Close Extension (Inside placeBid)

Already integrated into Phase 1 bid placement transaction:
1. Calculate `timeUntilClose = endTime - serverNow`
2. If `timeUntilClose <= softCloseThresholdMin * 60000`:
   - Extend `endTime` by `softCloseExtensionMin` minutes
   - Set lot status to `extended`
   - Increment `extensionCount`
   - Set `triggeredExtension: true` on the bid
3. Old Cloud Task becomes no-op (expectedEndTime guard)
4. Schedule new Cloud Task for extended endTime

### 3D. Staggered Lot Closing

When an auction goes `active`:
1. Order lots by `closeOrder`
2. Set each lot's `endTime` = `auction.endTime + (index * staggerIntervalMin * 60000)`
3. Store `originalEndTime` for reference
4. Schedule a Cloud Task for each lot's endTime

**Example** with 50 lots, 1-min stagger, base close at 7:00 PM:
- Lot 1 closes at 7:00 PM
- Lot 2 closes at 7:01 PM
- ...
- Lot 50 closes at 7:49 PM

### 3E. Soft-Close Groups

When a bid extends one lot in a `softCloseGroupId`:
1. Query all lots in the same group that are still active/extended
2. If their endTime is earlier than the new extended time, push them forward too
3. Increment their extensionCount

**Constraint**: Keep group sizes ≤ 50 lots (Firestore transaction read limit is 500 docs).

### 3F. Auction-Level Close

When all lots in an auction are closed (sold/unsold/cancelled):
1. Update auction status to `closed`
2. Calculate and store `totalGMV` (sum of all winning bids)
3. Trigger batch invoice generation
4. Release pre-auth holds for non-winning bidders
5. Send "Auction Complete" notifications

---

## Phase 4: Auction Lifecycle Management

> **Priority**: High — admin needs to manage auction states
> **Files**: `functions/index.js`, `src/pages/AdminDashboard.tsx`

### State Machine

```
draft ──► preview ──► active ──► closed ──► settling ──► settled
  │                     │          │
  └── cancelled ◄───────┴──────────┘
```

### 4A. `draft → preview` (Publish Preview)

**Validation before transition**:
- Title is set
- Start time and end time are set
- At least 1 lot exists
- All lots have: title, startingBid, images
- Buyer premium configured
- Terms URL set

### 4B. `preview → active` (Go Live)

**Actions on transition**:
1. Set staggered lot endTimes (Phase 3D)
2. Set all lot statuses to `active`
3. Schedule Cloud Task for each lot's endTime
4. Send "Auction Now Live" notifications to registered bidders
5. Update listing documents: set `auctionStatus: 'active'` on each lot's listing

### 4C. `active → closed` (All Lots Finished)

**Automatic** — triggered when the last lot closes (Phase 3F)

### 4D. `closed → settling` (Begin Settlement)

**Admin action** — marks that invoices are being processed:
1. Verify all invoices generated
2. Send payment reminders to winners
3. Admin can view settlement dashboard

### 4E. `settling → settled` (Complete)

**Admin action** — marks auction as fully settled:
1. All invoices paid or resolved (paid/cancelled/refunded)
2. All seller payouts processed
3. All pre-auth holds released
4. Archival: mark auction and lots as settled

### 4F. Cancellation

**Any status → cancelled**:
- Cancel all pending lots (status → cancelled)
- Release all pre-auth holds
- Cancel all pending invoices
- Send cancellation notifications
- Requires super_admin or admin role

---

## Phase 5: Settlement & Invoicing

> **Priority**: High — required for actual sales
> **Files**: `functions/index.js`, new `src/pages/AuctionInvoice.tsx`, admin settlement tab

### 5A. Invoice Generation

**Trigger**: Lot closes with `status: 'sold'`

**Invoice contents**:
- Winning bid amount
- Buyer premium (tiered calculation)
- Documentation fee ($75 flat)
- Sales tax (jurisdiction-dependent — see Phase 10)
- Total due
- Due date (auction.defaultPaymentDeadlineDays from close)
- Seller commission (configurable per auction, default 10%)
- Seller payout (winning bid - commission)

### 5B. Payment Collection

**Wire Transfer / ACH** (primary for heavy equipment):
- Generate wire instructions in invoice
- Admin manually confirms receipt
- Mark invoice as `paid`, record payment method

**Credit Card** (Stripe PaymentIntent):
- Cloud Function: `payAuctionInvoice(invoiceId, paymentMethodType)`
- For card payments: add processing surcharge (2.9% + $0.30) or absorb
- Create PaymentIntent → return clientSecret → Stripe Elements on client
- Webhook confirms payment → update invoice status

**Apply Pre-Auth Hold**:
- For winning bidders: capture $250 hold as partial payment toward invoice
- Reduce invoice balance by captured amount

### 5C. Non-Payment Escalation

| Day | Action |
|-----|--------|
| 0 | Invoice generated, payment due in 3 business days |
| 3 | Payment deadline — send urgent reminder email |
| 5 | Mark overdue, capture $250 pre-auth as penalty |
| 7 | Suspend bidder account, send final notice |
| 10 | Offer lot to second-highest bidder at their bid price |
| 14 | If no sale, relist in next auction (no additional fee to seller) |

**Cloud Scheduler**: `checkOverdueInvoices` — runs daily at 9 AM CT

### 5D. Seller Payouts

**Phase 1** (manual): Admin marks invoice as paid → admin initiates bank transfer to seller manually

**Phase 2** (Stripe Connect):
- Sellers onboard to Stripe Connect (Express accounts)
- On invoice payment: automatic transfer of seller payout to Connected account
- Timeline: payout after equipment removal confirmed (14-day window)

### 5E. Buyer Invoice Page

**New page**: `/auctions/:auctionSlug/invoice/:invoiceId`
- Shows invoice breakdown (bid, premium, tax, total)
- Wire transfer instructions
- "Pay Now" button (card/ACH via Stripe)
- Payment status indicator
- Equipment pickup information
- Print/download invoice as PDF

---

## Phase 6: Admin Lot Management & Dashboard

> **Priority**: High — admins can't run auctions without managing lots
> **Files**: `src/pages/AdminDashboard.tsx` (auction tab expansion)

### 6A. Lot Management UI

**Add to admin auction tab**:
- "Manage Lots" button on each auction → lot management view
- **Add Lot**:
  - Search existing listings → select → creates lot from listing data
  - Set: lot number, starting bid, reserve price (optional), buyer premium override
  - Denormalize listing data (title, manufacturer, model, year, thumbnail, location)
- **Edit Lot**: Modify starting bid, reserve, premium, close order, soft-close group
- **Remove Lot**: Delete lot (only in draft/preview status)
- **Reorder Lots**: Drag-and-drop to set closeOrder
- **Bulk Actions**: Set reserve on multiple lots, assign to soft-close group

### 6B. Bidder Verification Panel

**Add to admin auction tab**:
- List of registered bidders per auction
- Verification status badges (basic/verified/approved)
- Pre-auth hold status
- ID verification status
- Non-payment history
- Admin can: approve/reject bidders, upgrade/downgrade tier, release holds

### 6C. Live Auction Monitor

**Add to admin auction tab** (for active auctions):
- Real-time lot status grid (active/extended/closed)
- Current bid, bid count, time remaining per lot
- Extension count indicator
- Highlight lots in soft-close
- Emergency controls: pause lot, extend all lots, cancel lot

### 6D. Settlement Dashboard

**Add to admin auction tab** (for closed/settling auctions):
- Invoice list with status (pending/paid/overdue/cancelled)
- Payment totals: collected, outstanding, overdue
- Seller payout status
- Non-payment flags
- Export to CSV for accounting
- Mark wire payments as received
- Process refunds

---

## Phase 7: Lot Detail Page & Bidding UI

> **Priority**: Critical — this is where bidding actually happens
> **Files**: New `src/pages/LotDetail.tsx`, `src/App.tsx` (route)

### 7A. Lot Detail Page

**Route**: `/auctions/:auctionSlug/lots/:lotNumber`

**Layout**:
- **Left column** (60%): Equipment details (pulled from listing — images, description, specs, condition)
- **Right column** (40%): Bid panel (sticky sidebar)

**Bid Panel contents**:
- Lot number and status badge
- Current bid (real-time via onSnapshot)
- Bid count and unique bidder count
- Time remaining (countdown timer, updates every second)
- Reserve status ("Reserve met" / "Reserve not yet met")
- Minimum next bid (currentBid + increment)
- **Bid input**: amount field with increment buttons (+/-)
- **"Place Bid" button**: calls `placeBid` Cloud Function
- **"Set Max Bid" toggle**: reveals maxBid input for proxy bidding
- **Bid history**: scrollable list of anonymous bids (Bidder-XXXXXX, amount, time)
- **Lot info**: payment deadline, removal deadline, pickup location, condition

**States**:
- `preview`: "Bidding opens [date]" + "Register to Bid" button
- `active`: Full bid panel with input and Place Bid button
- `extended`: Same as active + "EXTENDED — [time] added" banner
- `closed/sold`: "SOLD for $XX,XXX" + winning bidder anonymous ID
- `closed/unsold`: "Reserve not met" or "No bids"

### 7B. Authentication Gates

- Not logged in → "Sign in to bid" → redirects to `/login?redirect=...`
- Logged in, no bidder profile → "Register to Bid" → redirects to registration
- Logged in, tier=basic → "Complete verification to bid"
- Logged in, tier=verified, bid > $25K → "Verify identity for bids over $25,000"
- Logged in, pre-auth not held → "Complete payment verification"
- All clear → show bid input

### 7C. Real-Time Updates

- `onLotChange(auctionId, lotId)` — lot status, currentBid, endTime changes
- `onBidsChange(auctionId, lotId)` — bid history feed
- When lot gets extended: flash "TIME EXTENDED" banner, update countdown
- When outbid: flash "You've been outbid!" notification
- When lot closes: show final result, disable bid input

### 7D. Mobile Experience

- Bid panel moves to bottom sheet (fixed position) on mobile
- Swipe up to expand full bid history
- Large touch targets for bid buttons
- Haptic feedback on bid submission (if available)

---

## Phase 8: Notifications & Watchlists

> **Priority**: Medium — improves engagement and UX
> **Files**: `functions/index.js`, new notification service, email templates

### 8A. Notification Types

| Event | Channel | Trigger |
|-------|---------|---------|
| Outbid | Email + in-app | Another bidder places higher bid |
| Lot closing soon (15 min) | Email + in-app | Scheduled per lot |
| Lot extended | In-app (real-time) | Soft-close triggered |
| Lot won | Email + in-app | Lot closes, bidder is winner |
| Lot lost | Email | Lot closes, bidder is not winner |
| Invoice generated | Email | Lot closes with sale |
| Payment reminder | Email | 24h before due date |
| Payment overdue | Email | Due date passed |
| Removal reminder | Email | 3 days before removal deadline |
| Auction starting | Email | 1 hour before auction start |

### 8B. Watchlist

- Bidders can "watch" lots (heart/star icon on lot card)
- Stored in `AuctionLot.watcherIds[]` array
- Watchers receive "closing soon" notifications
- Watchlist view in bidder's profile/dashboard

### 8C. Email Templates (SendGrid)

Use existing SendGrid integration. Create templates for:
- Outbid alert (include current bid, lot title, link to bid)
- Winner notification (include invoice link, payment deadline)
- Payment reminder (include amount due, wire instructions)
- Auction catalog (marketing email with featured lots)

---

## Phase 9: Seller/Dealer Auction Tools

> **Priority**: Medium — enables sellers to consign equipment
> **Files**: `src/pages/DealerOS.tsx`, new auction consignment UI

### 9A. Consignment Request

Sellers/dealers can submit equipment for auction:
1. Select listing from their inventory
2. Set minimum acceptable price (becomes reserve price)
3. Agree to auction terms (commission rate, timeline, as-is condition)
4. Submit for admin review

### 9B. Seller Auction Dashboard (in DealerOS)

- View consigned lots and their status
- Real-time bid activity on their lots
- Invoice/payout status after sale
- Performance metrics (sold %, average hammer price vs reserve)

### 9C. Admin Consignment Review

- Review incoming consignment requests
- Accept → creates lot and assigns to auction
- Reject → notify seller with reason
- Negotiate reserve price

---

## Phase 10: Sales Tax, Compliance & Legal

> **Priority**: Medium — required before processing real payments
> **Dependencies**: Stripe Tax or Avalara integration

### 10A. Minnesota Sales Tax

**TimberEquip is a marketplace facilitator** if it processes payments (which it will via Stripe).

**Obligations**:
- Register for Minnesota Tax ID Number
- Collect state tax: 6.875% + applicable local taxes
- Heavy equipment >$1,000 is always taxable
- Farm equipment at "farm auctions" may be exempt (specific criteria)
- Economic nexus: $100K in sales OR 200+ transactions in MN (will hit this quickly)

**Implementation**:
- Integrate Stripe Tax or Avalara for automated rate calculation by jurisdiction
- Store tax exemption certificates for exempt buyers (ag operations, tribal entities)
- Use `AuctionInvoice.taxExempt` and `AuctionInvoice.salesTaxRate` fields
- Generate tax reports for quarterly filing

### 10B. Required Disclosures (Per Lot)

Per UCC 2-328 and MN consumer protection law:
- "With reserve" / "Without reserve" status (default: with reserve)
- Buyer premium percentage
- All fees (documentation fee, storage fees, removal deadline)
- "As-is, where-is" condition
- Seller identity available on request (not necessarily public)
- Terms of Sale accepted before bidding

### 10C. Auctioneer of Record

**Recommendation**: Engage a licensed Minnesota auctioneer as "auctioneer of record" for each auction event.

- MN Chapter 330 has county-level licensing, zero mention of online auctions
- Regulatory gray area — statute contemplates physical "cry sales"
- Licensed auctioneer provides regulatory cover (~$200-500 per event)
- Auctioneer's name and license number displayed on auction materials

### 10D. Shill Bidding Prevention

Per UCC 2-328: If the auctioneer knowingly receives a bid on the seller's behalf, the buyer can void the sale.

**Implementation**:
- Block seller from bidding on their own lots (check `bidderId !== lot.sellerId`)
- Block same-household accounts (same IP, same address)
- Log all bid activity with full audit trail
- Admin can review suspicious patterns

### 10E. Bid Retraction Compliance

Per UCC 2-328: A bidder may retract before sale completion. Retraction does NOT revive previous bids.

Already covered in Phase 1C.

---

## Phase 11: Firestore Security Rules

> **Priority**: Critical — must be in place before going live
> **Files**: `firestore.rules`

### 11A. Auction Collection Rules

```
// Auctions: public read, admin write
match /auctions/{auctionId} {
  allow read: if true;  // Public auction catalog
  allow create, update, delete: if isAdmin();

  // Lots: public read, admin write (bids created via Cloud Function only)
  match /lots/{lotId} {
    allow read: if true;  // Public lot data
    allow create, update, delete: if isAdmin();

    // Bids: public read (anonymous IDs), NO client write
    match /bids/{bidId} {
      allow read: if true;  // Shows anonymous bidder IDs
      allow write: if false; // ALL writes via Cloud Function
    }
  }
}
```

### 11B. Bidder Profile Rules

```
// Bidder profiles: owner read, write via Cloud Function
match /users/{userId}/bidderProfile/{docId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId || isAdmin();
  // Sensitive fields (stripeCustomerId, verificationTier)
  // should only be set by Cloud Functions
}
```

### 11C. Auction Invoice Rules

```
// Auction invoices: buyer/seller/admin read, admin write
match /auctionInvoices/{invoiceId} {
  allow read: if request.auth.uid == resource.data.buyerId
              || request.auth.uid == resource.data.sellerId
              || isAdmin();
  allow write: if false; // ALL writes via Cloud Function
}
```

### 11D. Key Principle

**ALL mutation of auction state happens through Cloud Functions, not client-side writes.**

Client-side code uses `onSnapshot` for reads only. This means:
- Bid placement → Cloud Function
- Invoice generation → Cloud Function
- Status transitions → Cloud Function (or admin with server validation)
- Payment processing → Cloud Function (Stripe webhook)

---

## Phase 12: Testing & QA

> **Priority**: High — auction bugs cost real money

### 12A. Unit Tests

| Test | What it validates |
|------|------------------|
| `getBidIncrement()` | All 10 tier boundaries |
| `getBuyerPremium()` | Tiered calculation at each breakpoint |
| `generateAnonymousBidderId()` | Deterministic, consistent per auction |
| `formatTimeRemaining()` | Edge cases: 0, negative, large values |

### 12B. Integration Tests (Cloud Functions)

| Test | Scenario |
|------|----------|
| `placeBid` | Valid bid on active lot → success |
| `placeBid` | Bid below minimum → error |
| `placeBid` | Bid on closed lot → error |
| `placeBid` | Unverified bidder → error |
| `placeBid` | Self-outbid → error |
| `placeBid` | Soft-close trigger → lot extended |
| `placeBid` | Proxy bid auto-increment → counter-bid created |
| `closeLotTask` | Lot at endTime → status set correctly |
| `closeLotTask` | Reserve not met → unsold |
| `closeLotTask` | Extended lot (endTime changed) → no-op |
| `createPreAuthHold` | Valid card → hold created |
| `createPreAuthHold` | Prepaid card → rejected |

### 12C. End-to-End Test Scenarios

1. **Happy path**: Register → verify → bid → win → pay → pickup
2. **Outbid flow**: Bid → get outbid → bid again → win
3. **Proxy bidding**: Set max bid → auto-increment → win at minimum
4. **Soft-close**: Bid in final minute → lot extends → bid again
5. **Non-payment**: Win → miss deadline → $250 captured → lot offered to 2nd bidder
6. **Reserve not met**: Bid below reserve → lot closes unsold
7. **Cancellation**: Admin cancels auction → all holds released
8. **Concurrent bids**: Two bidders submit simultaneously → one wins, one retries

### 12D. Load Testing

Use Firebase Emulator Suite for local testing:
- Simulate 20 concurrent bidders on one lot
- Verify no duplicate bids, correct winner, proper extensions
- Measure transaction latency under contention
- Test fallback cron catches missed lot closings

---

## Role Matrix

### Who Can Do What

| Action | super_admin | admin | developer | content_manager | dealer | pro_dealer | individual_seller | member |
|--------|:-----------:|:-----:|:---------:|:---------------:|:------:|:----------:|:-----------------:|:------:|
| Create auction | x | x | x | | | | | |
| Edit auction | x | x | x | x | | | | |
| Publish auction | x | x | | | | | | |
| Cancel auction | x | x | | | | | | |
| Add/remove lots | x | x | x | | | | | |
| Manage bidders | x | x | | | | | | |
| View settlement | x | x | x | | | | | |
| Process payouts | x | x | | | | | | |
| Override bid | x | | | | | | | |
| Register to bid | | | | | x | x | x | x |
| Place bid | | | | | x | x | x | x |
| View own invoices | | | | | x | x | x | x |
| Consign equipment | | | | | x | x | x | |
| View own lot performance | | | | | x | x | x | |

### Bidder Tier Permissions

| Action | basic | verified | approved |
|--------|:-----:|:--------:|:--------:|
| Browse auctions | x | x | x |
| Watch lots | x | x | x |
| Bid (up to $25K) | | x | x |
| Bid (unlimited) | | | x |
| Proxy bidding | | x | x |

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Firestore write contention** on hot lots | Medium | Soft-close spreads activity; equipment auctions have low concurrent bid volume; Cloud Function pessimistic locking handles retries |
| **Stripe pre-auth hold expires** during long auction | Medium | Scheduled function checks `capture_before` and refreshes holds; 7-day default sufficient for most auctions |
| **Shill bidding accusation** | High | Block seller bids on own lots; full audit trail; anonymous bidder IDs in public view |
| **MN auctioneer licensing ambiguity** | Medium | Engage licensed auctioneer of record per event; statute silent on online platforms |
| **Non-payment by winner** | High | $250 pre-auth hold; escalation timeline; second-highest bidder fallback; suspension for repeat offenders |
| **Sales tax miscalculation** | High | Integrate Stripe Tax or Avalara; store exemption certs; quarterly filing |
| **Firestore invoice collection collision** | Low | Use `auctionInvoices` collection (not existing `invoices` used by Stripe billing) |
| **Cloud Task failure** (lot doesn't close) | Medium | Fallback cron every 1 minute catches missed closings |
| **Bidder disputes final price** | Medium | Immutable bid trail; server-authoritative timestamps; terms accepted pre-registration |
| **International bidder complications** | Low | Require Tier 3 (ID verification) for non-US; USD only; manual admin review for >$250K |

---

## Implementation Order & Dependencies

```
Phase 1: Bid Placement Engine ◄── CRITICAL PATH
    │
    ├── Phase 2: Stripe Identity & Pre-Auth ◄── CRITICAL (enables real bidding)
    │       │
    │       └── Phase 7: Lot Detail Page ◄── CRITICAL (bidding UI)
    │
    ├── Phase 3: Soft-Close & Closing Engine ◄── CRITICAL (auctions can close)
    │       │
    │       └── Phase 4: Lifecycle Management (admin state transitions)
    │
    └── Phase 5: Settlement & Invoicing ◄── HIGH (actual sales)
            │
            ├── Phase 6: Admin Lot Management ◄── HIGH (admin can run auctions)
            │
            ├── Phase 10: Sales Tax & Legal ◄── MEDIUM (before real payments)
            │
            └── Phase 9: Seller Tools ◄── MEDIUM (consignment flow)

Phase 8: Notifications ◄── MEDIUM (can be added incrementally)
Phase 11: Security Rules ◄── CRITICAL (must be done before go-live)
Phase 12: Testing ◄── HIGH (continuous throughout)
```

### Estimated Effort

| Phase | Effort | Depends On |
|-------|--------|-----------|
| Phase 1: Bid Engine | Large | — |
| Phase 2: Stripe Identity | Large | — |
| Phase 3: Closing Engine | Large | Phase 1 |
| Phase 4: Lifecycle | Medium | Phase 3 |
| Phase 5: Settlement | Large | Phase 3 |
| Phase 6: Admin Lots | Medium | — |
| Phase 7: Lot Detail | Medium | Phase 1, 2 |
| Phase 8: Notifications | Medium | Phase 1, 3 |
| Phase 9: Seller Tools | Small | Phase 6 |
| Phase 10: Tax/Legal | Medium | Phase 5 |
| Phase 11: Security Rules | Small | Phase 1 |
| Phase 12: Testing | Ongoing | All |

---

## Appendix A: Existing Stripe Secrets (Already Configured)

```
STRIPE_SECRET_KEY          ← existing, used for seller billing
STRIPE_WEBHOOK_SECRET      ← existing, used for subscription events
```

**New secrets needed**:
```
STRIPE_IDENTITY_WEBHOOK_SECRET  ← for identity.verification_session events
```

**Note**: Stripe Identity and PaymentIntents use the same `STRIPE_SECRET_KEY`. No new API keys needed — just a new webhook endpoint with its own signing secret.

## Appendix B: Key File References

| File | Lines | What's There |
|------|-------|-------------|
| `src/types.ts` | 503-650 | Auction, AuctionLot, AuctionBid, BidderProfile, AuctionInvoice types |
| `src/types.ts` | 244-251 | Listing auction fields (auctionId, currentBid, etc.) |
| `src/services/auctionService.ts` | 1-260 | Full CRUD, real-time listeners, helpers |
| `src/pages/Auctions.tsx` | Full | Auction directory page |
| `src/pages/AuctionDetail.tsx` | Full | Auction catalog with lot grid |
| `src/pages/BidderRegistration.tsx` | Full | 3-step registration (Step 2 = placeholder) |
| `src/pages/AdminDashboard.tsx` | ~4900-5100 | AuctionEditor + auction list |
| `src/pages/ListingDetail.tsx` | ~1770-1900 | Auction bid panel (disabled) |
| `src/components/ListingCard.tsx` | ~280-330 | Auction badge + bid display |
| `src/pages/Search.tsx` | ~880-915 | Auction filter toggle |
| `functions/index.js` | Full | Existing Cloud Functions + Stripe webhook |
| `firestore.rules` | ~871 | Basic auction rules (admin write, public read) |
| `server.ts` | ~840 | Stripe initialization |
| `src/services/billingService.ts` | Full | Existing Stripe billing (DO NOT confuse with auction billing) |

## Appendix C: Minnesota Law Quick Reference

| Statute | Key Point |
|---------|-----------|
| MN Chapter 330 | County-level auctioneer licensing; silent on online platforms |
| MN 330.01 | Owner exemption: owner of property for 6+ months selling at auction doesn't need license |
| MN 336.2-328 (UCC) | Default: with reserve; bidder may retract before completion; shill bidding voidable |
| MN Revenue (marketplace facilitator) | Must collect 6.875% + local tax if processing payments AND listing goods |
| Economic nexus | $100K sales OR 200+ transactions in MN in prior 12 months |
