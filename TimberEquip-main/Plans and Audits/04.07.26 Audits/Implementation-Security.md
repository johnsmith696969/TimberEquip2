# Forestry Equipment Sales — Security Implementation Recommendations

**Reference Audit:** Security-Audit.md (Score: 8.8/10, adjusted after re-audit)
**Target Score:** 9.5+/10
**Date:** April 8, 2026 (Updated — includes re-audit findings)
**Previous Date:** April 7, 2026

---

## Completed Items Summary

Thirteen of the original fifteen planned security improvements are in production following the Enterprise 3.5 Hardening sprint. However, a deep re-audit on April 8 identified **6 new HIGH/MEDIUM findings** (SEC-06 through SEC-11) that require near-term remediation.

| ID | Item | Status | Date |
|----|------|--------|------|
| SEC-01 | CSP `unsafe-inline` removed from Helmet/server.ts (still in firebase.json — see SEC-11) | [PARTIALLY COMPLETE] | Apr 7 |
| SEC-02 | CORS split by environment | [COMPLETED] | Apr 7 |
| INFRA-01 | Dependency scanning in CI | [COMPLETED] | Apr 7 |
| AUTH-01 | reCAPTCHA fail-closed with retry | [COMPLETED] | Apr 7 |
| DATA-01 | Stripe secrets validated via serverConfig | [COMPLETED] | Apr 7 |
| INFRA-02 | Production dependencies pinned to exact versions | [COMPLETED] | Apr 7 |
| — | security.txt created | [COMPLETED] | Apr 7 |
| SEC-03 | HTTP security headers (HSTS, Referrer-Policy, Permissions-Policy) via Firebase Hosting | [COMPLETED] | Apr 8 |
| SEC-04 | Firestore rules expanded to 1,066+ lines with catch-all deny | [COMPLETED] | Apr 8 |
| SEC-05 | Firestore rate limiting on dealer inquiry endpoint (reCAPTCHA is optional — see SEC-06) | [PARTIALLY COMPLETE] | Apr 8 |
| DATA-02 | PRIVILEGED_ADMIN_EMAILS migrated to Secret Manager (defineSecret) | [COMPLETED] | Apr 8 |
| INFRA-03 | Google Maps API key restricted (HTTP referrers + API restrictions) | [COMPLETED] | Apr 8 |
| — | Vulnerability disclosure page published at /vulnerability-disclosure | [COMPLETED] | Apr 8 |

**Score progression:** 8.2 (initial audit) → 9.2 (Apr 7) → 9.5 (Apr 8 hardening) → **8.8 (Apr 8 re-audit — 6 new findings discovered)**

---

## Critical Priority (Week 1) — COMPLETED

### SEC-01: Remove `unsafe-inline` from CSP Script Source [COMPLETED]

**Resolution:** server.ts now uses a conditional array for CSP script sources. Production builds exclude `'unsafe-inline'` entirely; the development configuration retains it for Vite HMR compatibility.

**Previous risk:** HIGH — enabled XSS via inline script injection
**File:** server.ts (CSP configuration block)

| Task | Status |
|------|--------|
| Conditional CSP array: production excludes `unsafe-inline`, dev includes it for Vite HMR | Done |
| Tested all pages for CSP violations in production mode | Done |

### SEC-02: Remove Staging Domains from Production CORS [COMPLETED]

**Resolution:** CORS configuration split into `PRODUCTION_ORIGINS` and `DEV_ORIGINS` arrays, conditionally joined based on `NODE_ENV`. Production deployments only allow production domains.

**Previous risk:** MEDIUM — staging origins could make authenticated requests to production
**File:** server.ts (CORS configuration block)

| Task | Status |
|------|--------|
| Split CORS config into PRODUCTION_ORIGINS and DEV_ORIGINS | Done |
| Conditional join based on NODE_ENV | Done |
| Verified no CORS errors in production | Done |

### INFRA-01: Add Dependency Scanning to CI [COMPLETED]

**Resolution:** `npm audit --audit-level=high` added to the `pr-preview.yml` CI workflow. Pull requests with high-severity vulnerabilities are now blocked.

**Previous risk:** MEDIUM — vulnerable dependencies may ship to production

| Task | Status |
|------|--------|
| Added `npm audit --audit-level=high` to pr-preview.yml | Done |
| CI now fails PRs that introduce high-severity vulnerabilities | Done |

---

## High Priority (Month 1) — COMPLETED

### AUTH-01: Implement reCAPTCHA Fail-Closed Policy [COMPLETED]

**Resolution:** reCAPTCHA changed from fail-open to fail-closed with automatic retry. On token generation failure, one retry is attempted before the request is blocked. This prevents bot traffic from bypassing protection during reCAPTCHA outages.

**Previous risk:** MEDIUM — bot traffic bypasses protection during reCAPTCHA outages
**File:** recaptchaService.ts

| Task | Status |
|------|--------|
| Changed fail-open to fail-closed | Done |
| Automatic retry (one retry before blocking) | Done |

### DATA-01: Standardize Secret Access Patterns [COMPLETED]

**Resolution:** Stripe secrets wrapped in a validated `serverConfig` object with a fail-fast pattern. Missing or invalid secrets cause immediate startup failure rather than silent runtime errors.

**Previous risk:** MEDIUM — inconsistent secret rotation and access control
**File:** server.ts (serverConfig block)

| Task | Status |
|------|--------|
| Stripe secrets wrapped in validated serverConfig object | Done |
| Fail-fast pattern: missing secrets cause startup failure | Done |

### INFRA-02: Pin Dependency Versions [COMPLETED]

**Resolution:** All production dependencies in package.json pinned to exact versions (removed `^` prefix). Future installs will not auto-upgrade to potentially breaking minor/patch versions.

**Previous risk:** MEDIUM — non-deterministic builds, potential breaking changes

| Task | Status |
|------|--------|
| Removed `^` prefix from all production dependencies in package.json | Done |
| package-lock.json committed and used in CI | Done |

---

## Medium Priority — Partially Completed

### Add Security.txt and Vulnerability Disclosure [COMPLETED]

**Resolution:** `public/.well-known/security.txt` created with contact information, policy reference, preferred languages, and canonical URL.

| Task | Status |
|------|--------|
| Created `/.well-known/security.txt` with contact, policy, preferred-languages, canonical URL | Done |

### Vulnerability Disclosure Page [COMPLETED — Apr 8]

**Resolution:** Full vulnerability disclosure policy page published at `/vulnerability-disclosure`, complementing security.txt.

### Enterprise 3.5 Hardening Sprint [COMPLETED — Apr 8]

| Task | Status |
|------|--------|
| HTTP security headers via Firebase Hosting (HSTS 2yr, Referrer-Policy, Permissions-Policy, CSP) | Done |
| Firestore rules expanded to 1,066+ lines with 7 new collection rules + catch-all deny | Done |
| reCAPTCHA + Firestore-based rate limiting on dealer inquiry (5 req/15min per IP+dealer) | Done |
| PRIVILEGED_ADMIN_EMAILS migrated to Secret Manager via defineSecret() | Done |
| Google Maps API key restricted to HTTP referrers + approved APIs | Done |
| Firebase client config tracked in git (firebase-applet-config.json) | Done |
| Unused `motion` package removed | Done |
| Hardcoded test emails replaced with env var fallbacks | Done |
| SeoLandingPages lazy imports consolidated | Done |
| Empty catch blocks updated with structured logging (8 blocks) | Done |

**Remaining (future work):**

| Task | Status |
|------|--------|
| Set up security@forestryequipmentsales.com email | Pending |

---

## New Findings from April 8 Re-Audit (HIGH Priority)

A deep security re-audit identified the following previously undiscovered issues:

### SEC-06: Make reCAPTCHA Mandatory on Dealer Inquiry [OPEN — HIGH]

**Issue:** The dealer inquiry endpoint checks reCAPTCHA only `if (rcToken)` — omitting the token bypasses verification entirely.
**File:** functions/index.js:12041-12053

| Task | Effort |
|------|--------|
| Change `if (rcToken)` to `if (!rcToken) return 403` — reject requests without token | 30 min |
| Move reCAPTCHA check outside conditional; fail-closed on verification error | 30 min |
| **Total** | **1 hour** |

### SEC-07: Remove Hardcoded Admin Email Fallback [OPEN — HIGH]

**Issue:** `getAuctionAdminCcEmail()` at line 1751 falls back to `caleb@forestryequipmentsales.com` — PII in source code and financial notification misdirection risk.
**File:** functions/index.js:1749-1752

| Task | Effort |
|------|--------|
| Remove hardcoded email; return `null` if no admin recipients configured | 15 min |
| Update callers to handle `null` CC gracefully (skip CC or log error) | 15 min |
| **Total** | **30 min** |

### SEC-08: Replace CORS Wildcard on Cloud Functions [OPEN — HIGH]

**Issue:** Both `apiProxy` and `publicPages` use `cors: true` in their `onRequest()` options, allowing any origin at the Firebase Functions level — this bypasses the Express-level CORS split.
**File:** functions/index.js:11817,11825

| Task | Effort |
|------|--------|
| Define `ALLOWED_ORIGINS` array with production + staging domains | 30 min |
| Replace `cors: true` with `cors: ALLOWED_ORIGINS` on both functions | 30 min |
| Keep `Access-Control-Allow-Origin: *` only on public embed/feed routes that need third-party access | 1 hour |
| **Total** | **2 hours** |

### SEC-09: Replace Vulnerable `xlsx` Package [OPEN — HIGH]

**Issue:** `xlsx` 0.18.5 (SheetJS CE) has known prototype pollution vulnerability CVE-2023-30533. Package abandoned on npm.
**File:** package.json:93

| Task | Effort |
|------|--------|
| Audit usage of `xlsx` (currently in `src/utils/importTemplates.ts` for template generation) | 30 min |
| Replace with `exceljs` or remove entirely if CSV export suffices | 3 hours |
| Update import/export tests | 30 min |
| **Total** | **4 hours** |

### SEC-10: Fix Token Verification in getDecodedUserFromBearer() [OPEN — MEDIUM]

**Issue:** No try/catch around `verifyIdToken()` and no `checkRevoked: true` — revoked tokens accepted up to 1 hour.
**File:** functions/index.js:10287-10290

| Task | Effort |
|------|--------|
| Wrap `verifyIdToken` in try/catch; return `null` on failure | 30 min |
| Add `checkRevoked: true` as second argument | 15 min |
| Log revoked/disabled token attempts at warn level | 15 min |
| **Total** | **1 hour** |

### SEC-11: Remove `unsafe-inline` from firebase.json CSP [OPEN — MEDIUM]

**Issue:** `script-src 'unsafe-inline'` in the firebase.json HTTP header CSP neutralizes XSS protection. SEC-01 only removed it from Helmet/server.ts, not from the Firebase Hosting header (which takes precedence).
**File:** firebase.json:116

| Task | Effort |
|------|--------|
| Evaluate nonce-based or hash-based CSP strategy for React SPA | 2 hours |
| Implement CSP hash generation for inline scripts (if any) | 4 hours |
| Remove `'unsafe-inline'` from firebase.json `script-src`; test all pages | 2 hours |
| **Total** | **8 hours** |

---

## Future Work (Remaining Items)

### Application-Layer PII Encryption

**Current:** Firebase encrypts at rest, but no application-layer encryption
**Target:** Encrypt phone numbers, addresses at application layer

| Task | Effort |
|------|--------|
| Implement AES-256 encryption utility for PII fields | 4 hours |
| Encrypt phone numbers before Firestore write | 3 hours |
| Encrypt physical addresses before Firestore write | 3 hours |
| Add decryption in read paths (admin, owner views) | 3 hours |
| Key management via Firebase Secret Manager | 2 hours |
| **Total** | **15 hours** |

### File Upload Virus Scanning

**Current:** No malware scanning on uploaded files
**Target:** Scan all uploads before processing

| Task | Effort |
|------|--------|
| Integrate ClamAV or Google Cloud DLP API | 6 hours |
| Add pre-processing scan step in image upload Cloud Function | 4 hours |
| Quarantine flagged files, notify admin | 3 hours |
| Add scan results to audit log | 2 hours |
| **Total** | **15 hours** |

### Penetration Testing Preparation

| Task | Effort |
|------|--------|
| Document all API endpoints with auth requirements | 4 hours |
| Create pen test scope document | 2 hours |
| Set up isolated staging environment for testing | 4 hours |
| Engage third-party pen testing firm | External |
| Remediate findings | Variable |
| **Total (prep)** | **10 hours** |

---

## Ongoing Security Maintenance

| Activity | Frequency | Effort/Cycle |
|----------|-----------|-------------|
| Dependency updates (`npm audit fix`) | Monthly | 2 hours |
| Firestore rules review | Quarterly | 4 hours |
| Security header audit (Mozilla Observatory) | Quarterly | 1 hour |
| Secret rotation (API keys, webhook secrets) | Semi-annually | 2 hours |
| Full security audit | Annually | 20 hours |
| Penetration testing | Annually | External |

---

## Implementation Timeline

| Phase | Items | Duration | Status |
|-------|-------|----------|--------|
| Week 1 | SEC-01, SEC-02, INFRA-01 | 3 days | [COMPLETED] |
| Week 2-3 | AUTH-01, DATA-01, INFRA-02 | 1 week | [COMPLETED] |
| Week 2-3 | security.txt | 1 hour | [COMPLETED] |
| Week 3 (Apr 8) | SEC-03, SEC-04, SEC-05, DATA-02, INFRA-03, vuln disclosure | 1 day | [COMPLETED] |
| **Immediate** | **SEC-06, SEC-07, SEC-08, SEC-10** (re-audit HIGH/MEDIUM findings) | **1-2 days** | **OPEN** |
| Short-term | SEC-09 (xlsx replacement) | 1 day | OPEN |
| Medium-term | SEC-11 (CSP nonce/hash strategy) | 1 week | OPEN |
| Future | PII encryption | 2 weeks | Pending |
| Future | Virus scanning, pen test prep | 2 weeks | Pending |
| **Original items completed** | **11 of 15 fully, 2 partially** | | **8.2 → 8.8** |
| **After re-audit fix target** | **+6 new items** | **~2 weeks** | **8.8 → 9.5+** |
