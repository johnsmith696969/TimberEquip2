# Billing Webhook Failure Runbook

## Trigger

- Stripe webhook delivery failures
- subscription state not updating after checkout
- invoice payment or failure events not syncing into Forestry Equipment Sales

## Immediate checks

1. Confirm the active Stripe destination is `timberequip-prod-billing`.
2. Check recent webhook events in Stripe for delivery status and HTTP response code.
3. Check Cloud Run / Functions logs for `apiProxy` around `/api/webhooks/stripe`.
4. Verify the deployed webhook secret matches the Stripe destination secret.

## Containment

1. Do not create duplicate Stripe webhook destinations.
2. Pause any manual role changes unless they are required to restore seller access.
3. If the issue is code-related, roll back `apiProxy` or redeploy the previous known-good revision.

## Recovery

1. Reprocess failed webhook events from Stripe once the endpoint is healthy.
2. Validate one QA account end-to-end:
   - checkout completed
   - webhook received
   - subscription doc updated
   - role/entitlement updated
   - listing visibility updated

## Exit criteria

- new Stripe events return 2xx
- affected QA account reflects the correct subscription state
- audit logs show the entitlement change
