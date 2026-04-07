# Auction System Gap Analysis

**Date**: 2026-04-07
**Status**: Infrastructure ready, core flows incomplete
**Estimated effort**: 50-80 hours across 2-3 sprints

---

## Current State Summary

| Component | Maturity | Notes |
|-----------|----------|-------|
| WebSocket real-time (Socket.IO) | 95% | Timer manager, rooms, clock sync all solid |
| Public catalog pages | 90% | Responsive, SEO-ready, real-time updates |
| Auction CRUD (Admin) | 80% | Shell creation/editing works |
| Database schema (PostgreSQL) | 100% | Well-designed tables with proper indexes |
| Tests (Socket/timer) | 70% | 29 tests for socket + timer; business logic untested |
| Invoice/Payment model | 60% | Types + fee calculations defined; Stripe integration incomplete |
| Admin lot management | 50% | Add/remove lots works; no reorder, no batch ops |
| Bid placement flow | 50% | Route exists; backend is placeholder |
| Bidder registration | 40% | Form exists; identity + payment integration incomplete |
| Data Connect sync | 5% | Schema defined; SDK generation blocked |
| Identity verification | 0% | Stripe Identity path exists but no real flow |

---

## What Works Today

1. **WebSocket infrastructure**: Socket.IO server with Firebase auth, room management, timer-based lot closures, soft-close rescheduling, and server time sync (every 10s)
2. **Public pages**: `/auctions` catalog, `/auctions/{slug}` detail with live countdown timers, lot cards with real-time bid/extension/closure events
3. **Admin auction shell**: Create/edit auction metadata (title, dates, buyer premium, terms URL), change auction status, search listings to add as lots
4. **Firestore data model**: Full type definitions for Auction, AuctionLot, AuctionBid, AuctionInvoice, BidderProfile with proper status enums
5. **PostgreSQL mirror**: Migration 003 creates auctions, auction_lots, auction_bids, auction_invoices, bidder_profiles tables with FK constraints and indexes
6. **Fee calculations**: `auction-fees.js` implements tiered buyer premium (10%/5%/$3500), card processing fee (3%), document fee ($110 titled items), $50k card payment cap
7. **Client service layer**: `auctionService.ts` with query, write, real-time listener, and bidding methods; `useAuctionSocket` hook for React components

---

## Critical Gaps (Must Fix Before Production)

### Gap 1: Bid Placement is Placeholder
**Current**: Frontend sends bid to `/api/auctions/{slug}/lots/{number}/bids` but backend doesn't execute a real Firestore transaction. No atomicity, no proxy bid engine, no reserve-met detection.

**Required**:
- Firestore transaction: read current bid -> validate increment -> write new bid + update lot
- Proxy bid (max bid) auto-increment logic
- Reserve price detection + `reserveMet` flag update
- Soft-close extension trigger when bid arrives within threshold
- WebSocket broadcast of `bid_placed` and `lot_extended` events
- Bid validation: bidder must be approved, payment method on file, not self-bidding

### Gap 2: Identity Verification is Mock
**Current**: `idVerificationStatus` is set to `not_started` but `verificationTier` immediately jumps to `verified`. No actual Stripe Identity session is created.

**Required**:
- Create real Stripe Identity VerificationSession
- Handle webhook for `identity.verification_session.verified` / `requires_input`
- Update bidder profile with verification result
- Gate bidding on `verificationTier >= 'verified'`

### Gap 3: Payment Pre-Authorization is Missing
**Current**: Stripe SetupIntent/payment method storage path exists in types but is placeholder.

**Required**:
- Create Stripe SetupIntent for payment method tokenization
- Store `stripeCustomerId` and `defaultPaymentMethodId` on bidder profile
- Optionally create PaymentIntent hold before high-value auctions
- Validate payment method on file before allowing bids

### Gap 4: Lot Closure Settlement Flow
**Current**: `AuctionInvoice` types defined, fee calculations exist, but no automated invoice creation on lot closure.

**Required**:
- On lot close (timer or manual): create AuctionInvoice document with calculated totals
- Send invoice email to winning bidder
- Track payment deadline (default 7 days)
- Handle wire transfer verification (manual admin action)
- Handle card payment via Stripe Checkout Session
- Seller payout processing (commission deduction, Stripe Transfer)

---

## Important Gaps (Should Fix Before Launch)

### Gap 5: Admin Lot Management
- No drag-to-reorder lots (closeOrder)
- No bulk lot operations (bulk status change, bulk reserve edit)
- No lot-to-listing assignment workflow (admin must search + add one by one)
- No soft-close group management UI

### Gap 6: Bidder-Aware UI State
- Catalog shows generic "Register to Bid" CTA even after successful registration
- Lot detail should show personalized state: "You're approved to bid" / "Complete identity verification" / "Add payment method"
- Winning bidder should see invoice + payment CTA on lot detail page

### Gap 7: Firestore Rules
- Auction subcollection rules may be incomplete
- Need explicit rules for: `auctions/{auctionId}/lots/{lotId}/bids` (read: authenticated, write: server-only)
- Bidder profile rules: read own only, write own only

### Gap 8: Dual Database Complexity
- Auctions live in default Firestore database
- Listings live in secondary database (`ai-studio-206e...`)
- Lot-to-listing relationship crosses databases, complicating queries
- Consider normalizing to same database before deeper rollout

---

## Nice-to-Have (Post-Launch)

- Storage fee accrual after removal deadline
- Tax exempt certificate handling
- Removal confirmation tracking with photo uploads
- Automated re-listing of unsold lots
- Bidder reputation/history scoring
- Auction analytics dashboard (GMV, sell-through rate, avg premium)
- Data Connect PostgreSQL sync (SDK generation blocked on Firebase tooling)

---

## Missing Tests

| Area | Priority | Notes |
|------|----------|-------|
| Bid placement validation | High | Increment rules, self-bid prevention, reserve detection |
| Buyer premium calculation | High | Tiered edge cases ($25k boundary, $75k boundary) |
| Invoice total calculation | High | With/without titled item, wire vs card |
| Bidder registration flow | Medium | Profile creation, verification gate |
| Admin auction CRUD | Medium | Status transitions, cascading lot updates |
| Firestore rules | Medium | Auth-based read/write, subcollections |
| Lot closure timer | Low | Already covered (29 tests) |

---

## Recommended Sprint Plan

### Sprint 1: Core Bidding (20-25 hours)
1. Implement real bid placement transaction (Firestore + WebSocket broadcast)
2. Proxy bid auto-increment engine
3. Soft-close extension trigger
4. Reserve-met detection
5. Unit tests for bid validation + fee calculations

### Sprint 2: Verification + Payment (15-20 hours)
1. Stripe Identity integration (create session, handle webhook)
2. Stripe SetupIntent for payment method storage
3. Gate bidding on verified + payment method
4. Bidder-aware UI state on catalog + lot pages

### Sprint 3: Settlement + Admin (15-20 hours)
1. Automated invoice creation on lot closure
2. Stripe Checkout for card payments
3. Wire transfer admin verification
4. Admin lot management improvements (reorder, bulk ops)
5. Email notifications (invoice, payment confirmation, overdue)

---

## Related Audit Files
- [Admin-Listings-And-Auctions-Audit-2026-04-04.md](Admin-Listings-And-Auctions-Audit-2026-04-04.md)
- [Auction-Live-Flow-Audit-2026-04-04.md](Auction-Live-Flow-Audit-2026-04-04.md)
