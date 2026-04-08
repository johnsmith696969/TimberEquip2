# GCP Console & External Actions — Enterprise 3.5 Hardening

These actions cannot be performed in code and must be completed manually via the GCP Console, Firebase Console, or CLI.

---

## 1. Restrict Google Maps API Key

**Priority:** HIGH
**Where:** GCP Console > APIs & Services > Credentials

The Google Maps JavaScript API key is currently unrestricted. Any domain can use it, leading to potential quota theft.

### Steps:
1. Go to [GCP Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Select the project `mobile-app-equipment-sales`
3. Click the Maps API key
4. Under **Application restrictions**, select **HTTP referrers (websites)**
5. Add these referrers:
   - `timberequip.com/*`
   - `*.timberequip.com/*`
   - `forestryequipmentsales.com/*`
   - `*.forestryequipmentsales.com/*`
   - `mobile-app-equipment-sales.web.app/*`
   - `mobile-app-equipment-sales.firebaseapp.com/*`
   - `localhost:*` (for local development)
6. Under **API restrictions**, select **Restrict key** and enable only:
   - Maps JavaScript API
   - Places API
   - Geocoding API
7. Click **Save**

---

## 2. Set PRIVILEGED_ADMIN_EMAILS in Secret Manager

**Priority:** HIGH
**Where:** CLI or GCP Console > Security > Secret Manager

The code has been updated to read from `defineSecret('PRIVILEGED_ADMIN_EMAILS')`. The secret must now be created in Secret Manager.

### Steps (CLI):
```bash
firebase functions:secrets:set PRIVILEGED_ADMIN_EMAILS
# When prompted, enter the comma-separated list of admin emails:
# caleb@forestryequipmentsales.com,other-admin@example.com
```

### Steps (Console):
1. Go to [Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Click **Create Secret**
3. Name: `PRIVILEGED_ADMIN_EMAILS`
4. Value: comma-separated admin emails
5. Click **Create Secret**

### Verification:
After setting the secret, redeploy functions:
```bash
firebase deploy --only functions:apiProxy
```
The function will read the secret at runtime. The code also falls back to `process.env.PRIVILEGED_ADMIN_EMAILS` if the secret is unavailable.

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

## 4. Deploy Firestore Security Rules

**Priority:** HIGH
**Where:** CLI

New rules have been added for 7 collections (`adminStorefrontArchives`, `dealerWebhookDeliveryLogs`, `dealerWebhookSubscriptions`, `dealerWidgetConfigs`, `listingViewEvents`, `publicDealers`, `rateLimits`) plus a catch-all deny rule.

### Steps:
```bash
firebase deploy --only firestore:rules
```

### Verification:
```bash
# Test that the catch-all deny works for an unknown collection
firebase emulators:start --only firestore
# In the emulator UI, try to read/write to a random collection — it should be denied
```

---

## 5. Deploy Cloud Functions

**Priority:** HIGH
**Where:** CLI

Updated functions include: reCAPTCHA on dealer inquiry, Firestore rate limiting, PRIVILEGED_ADMIN_EMAILS secret migration.

### Steps:
```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions if quota is limited:
firebase deploy --only functions:apiProxy,functions:publicPages
```

### If deployment fails with CPU quota error:
1. Go to [GCP Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Filter for "Cloud Run" or "Cloud Functions"
3. Request a quota increase for CPU allocation
4. Retry deployment after approval

---

## 6. Deploy Firebase Hosting (with new security headers)

**Priority:** HIGH
**Where:** CLI

New HTTP security headers have been added to `firebase.json`: HSTS, Referrer-Policy, Permissions-Policy, X-XSS-Protection, Content-Security-Policy.

### Steps:
```bash
# Build first
npx vite build

# Deploy hosting
firebase deploy --only hosting
```

### Verification:
```bash
# Check headers on the live site
curl -I https://mobile-app-equipment-sales.web.app

# Expected headers:
# Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: default-src 'self'; ...
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
```

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
