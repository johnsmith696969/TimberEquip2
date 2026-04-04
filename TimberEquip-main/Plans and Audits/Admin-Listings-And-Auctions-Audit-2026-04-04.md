# Admin Listings And Auctions Audit

Date: April 4, 2026

## Scope

- Admin machine approval and go-live flow
- Admin machine queue placement, scrollability, and searchability
- Admin performance data accuracy
- Auction creation, lot assignment, bidder registration, identity verification, and live bidding

## What Was Fixed In This Pass

### 1. Approved listings not going live

Root cause:
- The admin review flow treated `approve` as only the review-state change.
- Listings could end up in `approvalStatus=approved` while `paymentStatus=pending` and `status=pending`.
- That created the confusing `APPROVED / PENDING` state seen in the machine queue.

Fix:
- Admin approve now runs the full publish workflow when needed:
  - `approve`
  - `payment_confirmed`
  - `publish`
- Already approved pending listings now expose a direct `Go Live` path instead of making operators infer that they still need multiple manual lifecycle steps.

### 2. Machine review queue placement

Fix:
- The operator review queue was moved above the bulk import templates and media mapping section in the admin machines tab.
- The section now has a clearer queue label, retains bulk selection, and is easier to use as the primary review surface.

### 3. Performance tab data quality

Root cause:
- The admin performance dashboard was using the currently loaded paginated listing slice rather than the broader loaded marketplace dataset.
- That caused charts and summary metrics to be partial or misleading.

Fix:
- The tracking/performance surface now loads the full admin listings collection before rendering the analytics dashboard.
- Listing-state calculations were tightened so active, pending, and live counts align better with approval/payment/publication state instead of raw `status` alone.

## Live Playwright Findings

### Admin login

The browser session is not currently fully authenticated as admin because live login requires:
- SMS multi-factor authentication
- reCAPTCHA completion

The login page is prefilled with the admin email/password, but the session stops at the reCAPTCHA + MFA checkpoint, so I could not complete a full end-to-end live admin UI pass without that challenge being solved in the browser.

### Live listing visibility

Verified:
- A live public search for `John Deere 648L-II Skidder QA` returns a result.
- A public search for `Tigercat 620E Skidder` returns `0` results.

Interpretation:
- This matches the lifecycle gap above: approved items were not necessarily published/live.

## Auction System Audit

## Current state

The auction feature set is partially scaffolded, but it is not yet fully production-complete for end-to-end online bidding.

### Admin auction management

Available today:
- Create auction shell
- Edit auction shell
- Change auction status

Missing today:
- Full admin lot-management UI
- Add machines to auction through a completed operator workflow
- Reorder lots in the admin UI
- Manage reserve/pickup/payment rules per lot in a robust way

Notes:
- The service layer already has methods like `addLot`, `updateLot`, `removeLot`, and `reorderLots`.
- The admin UI is not fully wired to those capabilities yet.

### Bidder registration

Available today:
- Bidder registration page exists
- Basic bidder profile save exists

Incorrect or incomplete today:
- Identity verification is not actually implemented end-to-end
- Payment preauthorization is placeholder-only
- Registration currently promotes the bidder to a `verified` tier too early while `idVerificationStatus` still shows `not_started`

### Live bidding

Critical blocker:
- The listing detail “Place Bid” action is still not a true bid submission flow.
- It currently behaves like a placeholder rather than a production bid write path.

### Live auction inventory

The live auctions page currently shows:
- `No Auctions Scheduled`

So there is no live production auction event available right now to validate a full bidder flow in the browser.

## Recommended Next Auction Steps

1. Finish admin lot management in the admin auction tab.
2. Implement true bidder identity verification instead of the current placeholder progression.
3. Implement real card hold / preauth handling for bidders.
4. Replace the listing-detail bid placeholder with the actual bid submission flow.
5. Create one internal QA auction with 2-3 lots and test with:
   - admin
   - member bidder
   - dealer bidder
   - pro dealer bidder
6. Add operator audit logs for:
   - bidder verification
   - bid creation
   - reserve met transitions
   - soft-close extensions
   - invoice creation

## Files Updated In This Pass

- `src/pages/AdminDashboard.tsx`
- `src/components/admin/AnalyticsDashboard.tsx`
- `src/services/equipmentService.ts`

## Verification Completed

- `npm run build`
- `npm run test -- src/__tests__/sellerAccess.test.ts src/__tests__/login.component.test.tsx`
- Live Playwright checks for:
  - login checkpoint state
  - public search visibility of sample listings
  - live auctions page state

## Bottom Line

- The admin listing approval problem is fixable now and has been corrected locally in code.
- The machine queue structure has been improved for operator use.
- The admin performance dashboard is now based on more truthful listing data.
- The auction system still needs deeper implementation work before a trustworthy live bidding launch.
