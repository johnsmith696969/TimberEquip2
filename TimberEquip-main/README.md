# Forestry Equipment Sales
Forestry Equipment Sales is an e-commerce webapp for the Timber Industry. Our main focus is helping loggers & firewood producers market their heavy equipment, and provide institutional grade analysis on markets.

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Install the Firebase Functions dependencies too so the local server can proxy shared Functions routes:
   `npm --prefix functions install`
3. Set environment values in `.env.local`:
   `VITE_FIREBASE_API_KEY=your_firebase_web_api_key`
   `GEMINI_API_KEY=your_gemini_api_key` (only if Gemini features are enabled)
   Optional alternative: add `.firebase-web-config.local.json` with environment-specific web API keys (this file is gitignored).
   Optional for staging-local testing:
   `FIREBASE_ENVIRONMENT=staging`
   Optional for local billing when Stripe secrets are not configured:
   `LOCAL_BILLING_STUB=true`
4. Run the app:
   `npm run dev`
   Optional custom port:
   `PORT=3001 npm run dev`

### Local Billing Notes

- The local server now proxies the shared account billing routes through `functions/index.js` when the Functions bundle is available.
- If local Stripe secrets are not configured, set `LOCAL_BILLING_STUB=true` to simulate:
  - seller account checkout
  - listing checkout
  - checkout confirmation
  - billing portal return
  - subscription cancellation
  - account access refresh
- The billing stub is local-only and never runs in production.

## Build

`npm run build`

## Deploy

Safer deploys now use explicit environments:

- preview channel:
  `FIREBASE_PREVIEW_CHANNEL=pr-123 npm run deploy:preview`
- staging:
  `npm run deploy:staging`
- production:
  `ALLOW_PRODUCTION_DEPLOY=true npm run deploy:production`

Notes:

- `npm run deploy:firebase` now requires an explicit `--env` argument and is meant for scripted use.
- `preview` and `staging` builds now inject the staging Firebase web app config automatically so the browser app does not talk to production services.
- Firebase web API keys should never be committed. Keep them in environment variables or `.firebase-web-config.local.json`.
- See `DEPLOYMENT_ENVIRONMENTS.md` for GitHub Environments, preview channels, and staging/production setup.
- See `LISTING_GOVERNANCE_BACKFILL_RUNBOOK.md` for the one-time governance artifact backfill process.
- Firestore deploys must target the named database configured in `firebase.json`.
- Stripe and SendGrid production credentials are supplied through Firebase Functions secrets, not `.env.local`.
- The inspection dealer matcher uses the Firebase Functions secret `GOOGLE_MAPS_API_KEY` for geocoding. Keep that key server-side only and make sure the Geocoding API is enabled for it.
