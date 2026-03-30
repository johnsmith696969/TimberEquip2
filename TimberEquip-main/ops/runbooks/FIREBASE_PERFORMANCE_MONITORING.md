# Firebase Performance Monitoring

## Current State

TimberEquip now includes optional Firebase Performance Monitoring scaffolding in:

- `src/services/performance.ts`
- `src/main.tsx`
- `src/pages/Search.tsx`
- `src/services/billingService.ts`

Nothing is sent to Firebase Performance Monitoring until the feature flag is enabled.

## Environment Variables

- `VITE_ENABLE_FIREBASE_PERFORMANCE=true`

Optional:

- `MODE`
- `VITE_FIREBASE_PROJECT_ID`

## Instrumented Traces

- `app_bootstrap`
- `search_inventory_load`
- `checkout_account_start`
- `checkout_listing_start`

## Rollout Plan

1. Enable `VITE_ENABLE_FIREBASE_PERFORMANCE=true` in staging first.
2. Build and deploy staging.
3. Validate traces appear in Firebase Performance Monitoring:
   - initial app bootstrap
   - search page inventory load
   - seller/dealer checkout start
4. Confirm trace attributes and metrics are populated:
   - route / mode
   - result counts
   - duration
   - HTTP status for checkout-start requests
5. Promote the flag to production only after staging validation.

## Validation Checklist

- App bootstrap trace appears in staging
- Search inventory trace appears after search page load
- Checkout-start traces appear for owner-operator and dealer flows
- No runtime errors when the flag is disabled
- No runtime errors on browsers where Firebase Performance Monitoring is unsupported
