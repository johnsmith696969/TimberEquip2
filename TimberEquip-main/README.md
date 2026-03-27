# Forestry Equipment Sales
Forestry Equipment Sales is an e-commerce webapp for the Timber Industry. Our main focus is helping loggers & firewood producers market their heavy equipment, and provide institutional grade analysis on markets.

## Run Locally

Prerequisites: Node.js

1. Install dependencies:
   `npm install`
2. Set environment values in `.env.local`:
   `VITE_FIREBASE_API_KEY=your_firebase_web_api_key`
   `GEMINI_API_KEY=your_gemini_api_key` (only if Gemini features are enabled)
   Optional alternative: add `.firebase-web-config.local.json` with environment-specific web API keys (this file is gitignored).
   Optional for staging-local testing:
   `FIREBASE_ENVIRONMENT=staging`
3. Run the app:
   `npm run dev`

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
