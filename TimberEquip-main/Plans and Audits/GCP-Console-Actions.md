# GCP Console & External Actions — Enterprise 3.5 Hardening

**Last Updated:** April 8, 2026

These actions cannot be performed in code and must be completed manually via the GCP Console, Firebase Console, or CLI.

---

## 1. Restrict Google Maps API Key — COMPLETED

**Priority:** HIGH
**Where:** GCP Console > APIs & Services > Credentials
**Status:** COMPLETED (April 8, 2026)

The Google Maps JavaScript API key has been restricted to approved HTTP referrers and specific APIs only.

### Completed Steps:
1. Go to [GCP Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Select the project `mobile-app-equipment-sales`
3. Click the Maps API key
4. Under **Application restrictions**, selected **HTTP referrers (websites)**
5. Added these referrers:
   - `timberequip.com/*`
   - `*.timberequip.com/*`
   - `forestryequipmentsales.com/*`
   - `*.forestryequipmentsales.com/*`
   - `mobile-app-equipment-sales.web.app/*`
   - `mobile-app-equipment-sales.firebaseapp.com/*`
   - `localhost:*` (for local development)
6. Under **API restrictions**, selected **Restrict key** and enabled only:
   - Maps JavaScript API
   - Places API
   - Geocoding API
7. Saved

---

## 2. Set PRIVILEGED_ADMIN_EMAILS in Secret Manager — COMPLETED

**Priority:** HIGH
**Where:** CLI or GCP Console > Security > Secret Manager
**Status:** COMPLETED (April 8, 2026)

The secret has been created in Secret Manager and the code reads from `defineSecret('PRIVILEGED_ADMIN_EMAILS')` at runtime. Functions have been deployed successfully with the secret binding.

### Completed Steps (CLI):
```bash
firebase functions:secrets:set PRIVILEGED_ADMIN_EMAILS
# Entered comma-separated list of admin emails
```

### Verification:
Functions redeployed successfully:
```bash
firebase deploy --only functions:apiProxy,functions:publicPages
```
The function reads the secret at runtime. The code also falls back to `process.env.PRIVILEGED_ADMIN_EMAILS` if the secret is unavailable.

---

## 3. Remove .env Files from Git History

**Priority:** MEDIUM
**Where:** CLI (local machine)

If `.env` files were ever committed to the repository, they remain in git history even after deletion.

### Steps (using BFG Repo-Cleaner):
```bash
# Install BFG (requires Java)
# Download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone a bare copy of the repo
git clone --mirror git@github.com:your-org/TimberEquip.git bare-repo.git
cd bare-repo.git

# Remove .env files from history
java -jar bfg.jar --delete-files '.env'
java -jar bfg.jar --delete-files '.env.local'
java -jar bfg.jar --delete-files '.env.production'

# Clean up
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Push cleaned history
git push
```

### Steps (using git filter-repo):
```bash
pip install git-filter-repo

git filter-repo --invert-paths --path .env --path .env.local --path .env.production
git push --force-with-lease
```

### Post-cleanup:
- Rotate ALL secrets that were in those .env files
- Force all team members to re-clone the repository

---

## 4. Deploy Firestore Security Rules — COMPLETED

**Priority:** HIGH
**Where:** CLI
**Status:** COMPLETED (April 8, 2026)

New rules were deployed for 7 collections (`adminStorefrontArchives`, `dealerWebhookDeliveryLogs`, `dealerWebhookSubscriptions`, `dealerWidgetConfigs`, `listingViewEvents`, `publicDealers`, `rateLimits`) plus a catch-all deny rule. Firestore rules now total 1,066+ lines.

### Completed Steps:
```bash
cd ~/TimberEquip2/TimberEquip-main
firebase deploy --only firestore:rules
```
Deployment succeeded after `git pull` to get the latest rules file.

---

## 5. Deploy Cloud Functions — COMPLETED

**Priority:** HIGH
**Where:** CLI
**Status:** COMPLETED (April 8, 2026)

Updated functions deployed successfully including: reCAPTCHA on dealer inquiry, Firestore rate limiting, PRIVILEGED_ADMIN_EMAILS secret migration.

### Completed Steps:
```bash
firebase deploy --only functions:apiProxy,functions:publicPages
```
Both functions deployed successfully on the first attempt.

---

## 6. Deploy Firebase Hosting (with new security headers) — COMPLETED

**Priority:** HIGH
**Where:** CLI
**Status:** COMPLETED (April 8, 2026)

New HTTP security headers deployed via `firebase.json`: HSTS (max-age=63072000), Referrer-Policy, Permissions-Policy, X-XSS-Protection, Content-Security-Policy. CSP was subsequently updated to include `*.firebasestorage.app`, `wss://*.firebaseio.com`, and own domains in `img-src`.

### Completed Steps:
```bash
npx vite build
firebase deploy --only hosting
```

### Verified Headers:
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: Comprehensive CSP covering Firebase, Stripe, Google, OpenStreetMap domains
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN

---

## 7. HSTS Preload Submission

**Priority:** LOW (after HSTS header is live for 1+ week)
**Where:** https://hstspreload.org

After the HSTS header is deployed and verified:

1. Go to [hstspreload.org](https://hstspreload.org)
2. Enter your domain
3. Verify requirements are met
4. Submit for preload inclusion

---

## Future Architectural Items (Enterprise 3.5+ Roadmap)

These are larger efforts that go beyond the current hardening scope:

| Item | Effort | Description |
|------|--------|-------------|
| Per-endpoint CORS | Medium | Replace global `cors: true` with per-route CORS middleware with explicit origin allowlists |
| Redis/Memorystore rate limiting | Medium | Replace Firestore-based rate limiting with Redis for lower latency at scale |
| SSR/Prerendering for SEO | High | Firebase App Hosting or prerender service for dynamic meta tags |
| Server-side pagination | Medium | Firestore cursor-based pagination to replace client-side filtering |
| CSP nonce-based approach | Medium | Replace `unsafe-inline` in scripts with nonce injection (requires SSR or build plugin) |
| Stripe webhook signature verification | Low | Verify Stripe webhook signatures in the payment endpoints |
| Audit logging | Medium | Structured audit trail for admin actions |
