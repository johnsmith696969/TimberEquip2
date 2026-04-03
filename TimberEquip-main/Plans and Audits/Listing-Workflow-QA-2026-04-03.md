# Listing Workflow QA - 2026-04-03

## Scope
- Validate seller-side listing creation for:
  - owner-operator
  - dealer
  - pro dealer
- Validate admin visibility of those listings
- Validate admin approval and admin edit behavior

## Test Accounts
- Owner-operator: `testowner@forestryequipmentsales.com`
  - uid: `gI7X1SmQVkhDjVt78PDZrmy9aCi2`
- Dealer: `testdealer@forestryequipmentsales.com`
  - uid: `is3RFBgYUrNg3LLJbtykDbp9Ef83`
- Pro dealer: `testprodealer@forestryequipmentsales.com`
  - uid: `V4cuRvv4sFZ1M2xL2rqYiPFqTft1`

## Listings Created
- Owner-operator
  - listing id: `12000`
  - title: `QA Owner Operator 2021 Tigercat 1075B Forwarder`
  - images: `5`
  - initial result: created successfully, submitted for review
- Dealer
  - listing id: `12001`
  - title: `QA Dealer 2019 John Deere 648L-II Skidder`
  - images: `5`
  - initial result: created successfully, submitted for review
- Pro dealer
  - listing id: `12002`
  - title: `QA Pro Dealer 2020 Bandit 2590XL Chipper`
  - images: `5`
  - initial result: created successfully, submitted for review

## Seller-Side Result
- `/sell` worked for all three roles.
- All three accounts were able to create a listing with synthetic machine data and five image URLs.
- The live listing-create endpoint returned `201 Created` for each role.

## Admin-Side Findings

### Initial blocker
- The admin inventory page was failing with `500` errors on:
  - `/api/admin/listings?pageSize=50&includeDemoListings=false`
  - `/api/admin/listings?pageSize=100&includeDemoListings=false`
- Root cause from live function logs:
  - `ReferenceError: isDemoListing is not defined`
- Fix applied in `functions/index.js`:
  - added backend `isDemoListing(listing)` helper to match the existing frontend demo-listing filter behavior
- Result after deploy:
  - admin inventory loaded successfully
  - the QA listings became visible from `/admin?tab=listings`

### Admin inventory verification
- Admin listings page now shows loaded inventory correctly.
- Search for `QA` and role-specific QA listing names works.
- The following QA listings were visible in the admin table:
  - `12000` owner-operator listing
  - `12001` dealer listing
  - `12002` pro dealer listing

## Approval Workflow Verification
- Admin lifecycle panel opened successfully for listing `12002`.
- Approve action was executed from the admin UI, not just the API.
- UI result:
  - toast/message indicated approval completed successfully
  - listing transitioned to:
    - `status: active`
    - `approvalStatus: approved`
    - `paymentStatus: paid`
- Pending-review count dropped from `9` to `8`.
- Live listings count increased from `5` to `6`.

## Edit Workflow Verification
- Admin edit screen opened successfully for listing `12001`.
- The admin UI submitted a `PATCH /api/account/listings/12001` request successfully with `200 OK`.
- Prior API-level admin edit validation also succeeded on the same listing.
- Result:
  - admin edit pathway is functional
  - listing update endpoint accepts admin-driven edits correctly

## Current QA Listing State
- `12000`
  - owner-operator
  - `active`
  - `approved`
  - `paid`
- `12001`
  - dealer
  - `pending`
  - `pending`
  - `paid`
- `12002`
  - pro dealer
  - `active`
  - `approved`
  - `paid`

## Conclusion
- Seller posting flow is working for owner-operator, dealer, and pro dealer accounts.
- Admin visibility is working after the backend fix.
- Admin approval is working from the live UI.
- Admin edit screen and update submission are working.

## Follow-up Recommendation
- Keep the three QA listings for short-term workflow inspection from the admin view.
- If you want a cleaner final state after review:
  - approve `12001` as well, or
  - delete/archive the QA listings after validation is complete.
