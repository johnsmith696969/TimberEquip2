# Sentry Error Tracking Setup

## Current State

Forestry Equipment Sales now includes optional Sentry scaffolding in:

- `src/services/sentry.ts`
- `sentry.server.ts`
- `functions/sentry.js`

Nothing is sent to Sentry until DSN values are configured.

## Environment Variables

### Frontend

- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_SENTRY_RELEASE`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_SOURCE_MAPS=true` to generate hidden sourcemaps during build

### Local Server / Backend

- `SENTRY_DSN`
- `SENTRY_SERVER_DSN` (optional alias)
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`

### Firebase Functions

Set these with Firebase Secret Manager if you want Functions reporting enabled:

```powershell
firebase functions:secrets:set SENTRY_DSN --project timberequip-staging
firebase functions:secrets:set SENTRY_DSN --project mobile-app-equipment-sales
```

Optional plain env values:

- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`

## Recommended Rollout

1. Create one Sentry project for the web app and one for backend/functions.
2. Set staging DSNs first.
3. Build staging with `SENTRY_SOURCE_MAPS=true`.
4. Trigger a controlled staging exception from:
   - React error boundary
   - local server route
   - `functions:apiProxy`
5. Verify:
   - stack traces
   - release tags
   - environment tags
   - user context
6. Add alert routing in Sentry for:
   - new production issue
   - regression
   - spike in events
7. Promote DSNs to production only after staging verification is complete.

## Validation Checklist

- Browser error creates a Sentry issue
- Logged-in user shows `id`, `email`, and `account_role`
- Server uncaught exception is captured
- `apiProxy` failures create backend issues
- Sourcemaps resolve minified stack traces
- Production alert rules send to the correct channel
