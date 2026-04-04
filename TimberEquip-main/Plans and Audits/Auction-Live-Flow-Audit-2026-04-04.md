# Auction Live Flow Audit

Date: April 4, 2026
Environment: production (`https://timberequip.com`)

## What was tested

- Admin creates an auction
- Admin sets auction dates and activates the auction
- Public auction page renders
- A real lot is attached to the auction
- Non-admin user logs in and registers to bid
- Public lot navigation is tested
- Bidding entry points are checked
- Bidder identity verification behavior is checked

## Live results

### Working

- Admin can create an auction shell from `/admin?tab=auctions`
- Admin can save auction metadata:
  - title
  - description
  - buyer premium
  - start time
  - end time
- Admin can transition auction status:
  - `draft`
  - `preview`
  - `active`
- Public `/auctions` page shows the live auction
- Public auction catalog page renders at:
  - `/auctions/qa-forestry-equipment-auction-apr-4-2026`
- Bidder registration now completes successfully after Firestore rules were fixed

### Working only after live Firestore rules fix

The live rules were missing subcollection coverage for auctions and bidder profiles. I deployed a minimal rules fix so the QA flow could continue.

Added access for:

- `users/{userId}/bidderProfile/{profileId}`
- `auctions/{auctionId}/lots/{lotId}`
- `auctions/{auctionId}/lots/{lotId}/bids`

Without that fix:

- bidder registration failed with `Missing or insufficient permissions`
- lots could not be read even by the signed-in super admin
- public lot listeners failed

### Structurally incomplete / still broken

- Admin UI still does not provide a way to add listings as lots to an auction
- I had to attach a QA lot directly through Firestore to continue the live test
- `Bid Now` on the featured lot points to:
  - `/auctions/qa-forestry-equipment-auction-apr-4-2026/lots/1001`
- That route currently resolves to `Page Not Found`
- The router does not have a dedicated auction-lot route
- Auction catalog counts only non-promoted lots, so a promoted-only auction shows:
  - featured lot visible
  - catalog says `0 lots`
- Even after successful bidder registration, the catalog page still shows the generic `Register to Bid` CTA instead of a bidder-aware state
- Real bid placement is not implemented in the UI flow that was reached during this audit

## Important architecture finding

Auction data and listing data are split across different Firestore databases:

- auctions are being read from the default Firestore database
- the admin listings API is reading from:
  - `ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c`

This means the live auction shell and the main listing system are not naturally sharing the same write path right now.

## Identity verification status

Bidder identity verification is not truly implemented yet.

Current bidder registration behavior in code:

- registration writes a bidder profile
- `verificationTier` is set to `verified`
- `preAuthStatus` is set to `pending`
- `idVerificationStatus` is set to `not_started`

So the current flow marks the bidder as effectively verified without a real identity-verification or payment-hold completion step.

## QA auction created during this audit

- Auction title:
  - `QA Forestry Equipment Auction Apr 4 2026`
- Auction slug:
  - `qa-forestry-equipment-auction-apr-4-2026`
- Auction status:
  - `active`
- QA lot added:
  - Lot `#1001`
  - `2019 John Deere 648L-II Skidder QA`

## Final conclusion

The live auction stack is only partially production-ready.

Current production truth:

- auction shell creation works
- auction activation works
- bidder registration now works after the rules fix
- public auction page rendering works
- actual lot management is missing from admin UI
- dedicated lot pages are missing
- actual bid placement is not complete
- bidder identity verification is still placeholder logic

## Recommended next fixes

1. Build admin lot-assignment UI inside `/admin?tab=auctions`
2. Add a real route for `/auctions/:auctionSlug/lots/:lotNumber`
3. Implement a real bid-placement action instead of the placeholder path
4. Replace fake bidder verification with:
   - real ID verification state
   - real payment/pre-auth state
5. Normalize auctions and listings onto the same Firestore/PostgreSQL domain model before deeper auction rollout
