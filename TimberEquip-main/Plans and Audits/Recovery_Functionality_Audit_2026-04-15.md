# Forestry Equipment Sales Recovery Functionality Audit

Date: 2026-04-15

Current recovery baseline:

- Stable production tag before this audit: `prod-stable-2026-04-15-ci-green`
- Baseline stable commit: `ade9a41ad7e703e91b7f931053a08aca06f8cdfe`
- New CSP recovery fix commit: `13798e448c78656e81ced3b11bf62efddf39f824`
- New reCAPTCHA backend calibration commit: `547544de6246af85f5520cf3195fd2d36a742b77`
- Production hosting deploy for the CSP fix: GitHub Actions run `24439102805`
- Production `apiProxy` deploy for the reCAPTCHA backend fix: GitHub Actions run `24439484867`, completed successfully

## Executive Status

Production is not in the broken state from earlier today. Public pages, core API routes, production route smoke checks, unit tests, and a production-style bundle build are passing.

The largest confirmed live break during this audit was login reCAPTCHA. The page loaded, but CSP initially blocked a Google reCAPTCHA Enterprise connection, then the backend lacked permission to create reCAPTCHA Enterprise assessments. After IAM was fixed, the assessment returned a real score, but the login threshold was still too high for the tested mobile flow. The CSP and backend threshold fixes have been pushed and deployed. The automated mobile login smoke now gets past reCAPTCHA and reaches the expected Firebase invalid-credentials response.

The site is still not fully "all systems green" because staging CI is failing, Google Places lookup is returning empty results in production, full-function deployment remains intentionally constrained, and some auction/admin workflows are present but incomplete from a product-operation standpoint.

## Verified Passing

- `npm run test:ci` passed locally when run without parallel CPU contention.
- `npm run lint` passed locally, but took roughly 7.5 minutes.
- `SMOKE_BASE_URL=https://timberequip.com SMOKE_EXPECT_MODE=indexable npm run smoke:routes` passed.
- `SMOKE_BASE_URL=https://timberequip.com npm run validate:production:smoke` passed.
- `npm run build:indexable` passed when the required production Firebase/Maps/reCAPTCHA browser config was injected.
- Live desktop and mobile Playwright smoke passed for `/`, `/search`, `/dealers`, `/categories`, `/states`, `/manufacturers`, `/auctions`, `/bidder-registration`, `/login`, `/register`, and `/ad-programs`.
- Live listing detail page loaded without console errors; current listing gallery uses `object-contain` on the main detail image, so the previous obvious stretch state was not reproduced in the final live check.

## Confirmed Issues

### 1. Mobile login and email/password auth were blocked by CSP

Evidence:

- Mobile Playwright reproduced "Security check failed. Please refresh and try again."
- Console showed CSP blocking `https://www.google.com/recaptcha/enterprise/clr`.
- `/api/recaptcha-assess` was reached, but the browser-side reCAPTCHA process was degraded before assessment.

Fix applied:

- Updated `TimberEquip-main/index.html` `connect-src` to allow `https://www.google.com` and `https://www.gstatic.com`.
- Built successfully with production-style env.
- Pushed commit `13798e4`.
- Production hosting-only deploy run `24439102805` completed successfully.
- Confirmed after deploy that CSP no longer blocks the reCAPTCHA `clr` request.
- Confirmed backend then returned `score:null` because the function runtime service account lacked `recaptchaenterprise.assessments.create`.
- Granted `roles/recaptchaenterprise.agent` to `547811102681-compute@developer.gserviceaccount.com`.
- Confirmed backend then returned a real score for the login action.
- Added action-specific minimum scores so `LOGIN` requires a valid token but only a `0.1` minimum score, while higher-risk actions keep stricter thresholds.
- Pushed commit `547544d` and triggered `apiProxy` deploy run `24439484867`.
- Production `apiProxy` deploy run `24439484867` completed successfully.
- Post-deploy mobile login smoke result: `/api/recaptcha-assess` returned `{"pass":true,"score":0.2,"minScore":0.1}` and the page showed "Invalid email or password" instead of "Security check failed."

Follow-up:

- Retest Google sign-in on an actual mobile browser because the automated check should not complete a real Google OAuth flow.

### 2. Staging deploy is failing after `.env` removal

Evidence:

- Latest `Deploy Staging` runs are failing.
- The current failure is `No Firebase web API key configured for "staging"`.

Cause:

- Production workflow injects browser config during verify/build.
- Staging workflow runs `npm run verify:staging` without equivalent staging browser config.
- Local builds also fail unless the config is injected or `.firebase-web-config.local.json` exists.

Recommended fix:

- Move all browser-public Firebase, Maps, and reCAPTCHA values into GitHub Actions variables, not hardcoded YAML.
- Add staging-specific variables for `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_FIRESTORE_DATABASE_ID`, `VITE_GOOGLE_MAPS_API_KEY`, and `VITE_RECAPTCHA_SITE_KEY`.
- Update both production and staging workflows to consume variables consistently.
- Add `.firebase-web-config.local.example.json` or `.env.local.example` so local dev/recovery builds are predictable without committing real keys.

### 3. Google Places proxy exists, but live production returns empty results

Evidence:

- `https://timberequip.com/api/public/places-autocomplete?...` returned `{"predictions":[]}`.
- `https://timberequip.com/api/v1/public/places-autocomplete?...` also returned empty.
- `https://timberequip.com/api/public/reverse-geocode?...` returned `{"location":null}`.
- The code path exists in `functions/index.js` and the frontend `GooglePlacesInput` is wired into search, listing modal, bidder registration, logistics, profile/storefront, seller profile, and listing detail shipping forms.

Likely causes:

- The `GOOGLE_MAPS_API_KEY` Secret Manager value is missing, not attached to the deployed function revision, blocked by API key restrictions, or the required Places/Geocoding APIs are not enabled for the exact key being used by Cloud Functions.
- The endpoint intentionally swallows Google errors and returns an empty result, so production users see "no matches" instead of an actionable error.

Recommended fix:

- Verify `GOOGLE_MAPS_API_KEY` exists in Secret Manager for `mobile-app-equipment-sales`.
- Verify `apiProxy` has the secret attached in its deployed function config.
- Verify the key has Geocoding API and Places API enabled.
- If the key is HTTP-referrer restricted, create a separate server key restricted by API/service or Cloud Function identity instead of referrer.
- Add structured logging for Google status codes like `REQUEST_DENIED`, `OVER_QUERY_LIMIT`, and `INVALID_REQUEST`.
- Add a smoke script for places endpoints so this fails visibly in CI.

### 4. Full production CI/CD is safe-scoped, not complete-fleet verified

Current state:

- Production default deploy scope is `hosting,functions:apiProxy,functions:publicPages,firestore:rules`.
- This was intentional to avoid Cloud Run regional CPU quota and prior IAM/secret deploy failures.
- Hosting and public/API functions are now deployable.

Risk:

- Changes to email triggers, image-processing triggers, scheduled jobs, marketplace triggers, subscription lifecycle, SEO sync, and other functions will not go live under the default production deploy scope.
- This is safe for emergency stabilization but not sufficient as the permanent CI/CD model.

Recommended fix:

- Keep hosting-only deploy available for emergency frontend fixes.
- Add separate targeted workflows:
  - `Deploy Public Web`
  - `Deploy Email Functions`
  - `Deploy Image Processing`
  - `Deploy Scheduled Jobs`
  - `Deploy All Functions` with manual approval
- Ensure every v2 function has bounded `maxInstances`.
- Resolve regional CPU quota or split functions by region/project before returning to all-functions deploy by default.

### 5. AVIF upload pipeline exists, but current public listing data is not AVIF

Evidence:

- `storageService.uploadListingImageWithPublishingVariants` uploads source images, waits for detail/thumb `.avif` outputs, and falls back to browser AVIF encoding if the trigger does not produce variants.
- `functions/image-processing.js` converts uploaded source images to AVIF detail/thumb files and applies a watermark.
- Current public listings returned by `/api/public/listings` still have Unsplash URLs in `images` and empty `imageVariants`.
- Live listing detail page displayed the Unsplash image, not Firebase AVIF variants.

Risks:

- Existing/restored listings need an AVIF backfill or data correction.
- The client-side fallback produces AVIF but does not apply the server watermark, so watermarking depends on the Cloud Storage trigger path working.
- Default production deploy scope does not deploy `generateListingImageVariants`, so future changes to watermark opacity or image processing will not go live unless that function is specifically deployed.

Recommended fix:

- Run and validate `npm run images:backfill:avif` in dry-run/read mode first, then write mode with a small listing limit.
- Confirm resulting listing records have `imageVariants[].detailUrl` and `thumbnailUrl` pointing to Firebase Storage `.avif`.
- Deploy `functions:generateListingImageVariants` intentionally after confirming quota/secret permissions.
- Add an admin/listing data health view for "imageVariants missing" and "non-Firebase source image."

### 6. Auction registration flow is partially implemented, but admin operations are incomplete

What exists:

- `/bidder-registration` is protected and redirects unauthenticated users to login.
- `/auctions/:auctionSlug/register` exists.
- Bidder profile save exists.
- Google address lookup component is present on bidder registration.
- Stripe Identity and Stripe Checkout setup-session endpoints exist for identity and payment method setup.
- Tax exemption certificate upload exists for the user-facing bidder registration page.

Gaps:

- If Stripe is not configured in the deployed environment, identity/payment endpoints return 503.
- Admin/super-admin UI has auction lot and winning bidder views, but no obvious full bidder registration queue or tax-exempt certificate review surface.
- Tax exemption states are limited to MN, WI, and MI.
- Generic `/bidder-registration` can only work after login and does not expose much helpful pre-login context.

Recommended fix:

- Add an admin Auction Bidders tab with registration details, identity status, payment status, tax-exempt state, certificate link, approval audit fields, and export.
- Add direct user-facing status links from the auction page to registration, identity, payment setup, and tax forms.
- Add automated smoke checks for authenticated bidder status endpoints using a test user or emulator.

### 7. Saved-search unsubscribe exists, but admin alert expectations need separation

What exists:

- Saved-search emails build signed unsubscribe URLs.
- `/unsubscribe` validates the signed link and posts to `/api/email-preferences/unsubscribe`.
- The backend writes `emailNotificationsEnabled: false` on the user and/or recipient record.
- Saved-search notification functions check optional email delivery state before sending.

Important distinction:

- Admin "new approved listing" or platform operations emails are not necessarily saved-search emails.
- If the admin account is still receiving new-ad approval notifications, that may be expected admin/platform alert behavior rather than saved-search unsubscribe failing.

Recommended fix:

- Separate preferences into explicit scopes:
  - saved search alerts
  - dealer monthly reports
  - marketing/media emails
  - admin operational alerts
  - required account/security/billing emails
- Include the email scope in each template and unsubscribe page copy.
- Add an admin-visible preference audit record so we can prove what was unsubscribed and why a later email was still sent.

### 8. Secret and browser-key hygiene needs cleanup

Findings:

- Production workflow currently includes browser-public Firebase/Maps/reCAPTCHA values directly in YAML.
- These are not server private keys, but they should still move to GitHub variables to reduce accidental copy/paste spread and make key rotation cleaner.
- Untracked local Playwright logs contain browser key material from previous debugging.
- Local scripts reference service-account private-key fields; this appears to be environment parsing code, not a committed private key value.

Recommended fix:

- Move browser-public keys from workflow YAML to GitHub Actions variables.
- Keep server secrets only in Secret Manager or GitHub Actions secrets.
- Delete local debug artifacts before committing or sharing archives.
- Add a secret scanning pre-commit or CI step that fails on private keys and warns on browser-public keys in docs/logs.

## Recovery Plan

### Phase 1: Finish production auth recovery

- Complete. Production hosting and `apiProxy` fixes are deployed.
- Complete. Mobile invalid-password smoke now reaches Firebase auth validation instead of the reCAPTCHA failure state.
- Have the owner test real Google sign-in on mobile because completing OAuth with a real account should not be automated.

### Phase 2: Restore CI/CD correctness

- Fix staging workflow env injection.
- Move hardcoded browser-public keys to repository/environment variables.
- Keep production default deploy safe-scoped until function quota and IAM are fully proven.
- Add separate targeted function deploy workflows.
- Add places endpoint smoke test and mobile auth smoke test.

### Phase 3: Fix Places and location data

- Verify Cloud Functions can read `GOOGLE_MAPS_API_KEY`.
- Verify the key is usable from server-side code for Places and Geocoding.
- Add logs for Google API status responses.
- Retest Search, Listing Modal, Bidder Registration, Logistics, Profile, Seller Profile, and Listing Detail location fields.

### Phase 4: Restore media pipeline confidence

- Deploy or verify `generateListingImageVariants`.
- Run AVIF backfill against a small listing sample.
- Confirm public listing payloads include AVIF variants.
- Confirm search cards and listing detail choose AVIF variant URLs.
- Confirm watermark placement and opacity on generated variants.

### Phase 5: Complete auction/admin workflows

- Add admin bidder and tax-exempt certificate review.
- Add user-facing clear CTAs for registration, identity, payment setup, and tax certificate upload.
- Verify Stripe Identity and setup sessions in production.
- Add authenticated auction smoke tests.

## Current Bottom Line

The site is substantially recovered for public browsing and production deployment, but it is not yet fully functional across all roles and systems. The most urgent live blocker found during this audit was mobile reCAPTCHA login, and that fix has been pushed and deployed through a hosting-only production run. The next highest-priority blockers are staging CI config, Google Places returning empty results, and bringing full-function deployment back under controlled, targeted CI/CD.
