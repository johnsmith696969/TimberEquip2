# Listing Visibility Mismatch Runbook

## Trigger

- seller says a listing should be public but it is hidden
- hidden listing appears publicly when it should not
- admin lifecycle panel disagrees with marketplace visibility

## Immediate checks

1. Open the admin lifecycle panel for the listing.
2. Confirm raw values:
   - `status`
   - `approvalStatus`
   - `paymentStatus`
3. Confirm governance snapshot values:
   - `lifecycleState`
   - `visibilityState`
   - `isPublic`
4. Check recent `listingStateTransitions` and `listingAuditReports`.

## Common causes

- payment lapsed and listing visibility was correctly suppressed
- listing approved but not payment-confirmed
- manual listing edit bypassed intended lifecycle path
- stale public SEO read model

## Recovery

1. Use the admin lifecycle controls rather than editing raw fields directly.
2. If the raw listing is wrong, apply the correct lifecycle action:
   - approve
   - reject
   - payment confirm
   - publish
   - expire
   - relist
   - mark sold
   - archive
3. If the listing is correct but public pages are stale, trigger the read-model refresh path.

## Exit criteria

- admin lifecycle panel matches the intended state
- public listing visibility matches governance state
- a fresh transition/audit record exists for the corrective action
