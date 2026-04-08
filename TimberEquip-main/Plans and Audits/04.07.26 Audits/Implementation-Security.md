# Forestry Equipment Sales — Security Implementation Recommendations

**Reference Audit:** Security-Audit.md (Score: 9.2/10)
**Target Score:** 9.5+/10
**Date:** April 7, 2026

---

## Completed Items Summary

All Critical and High priority items have been completed as of April 7, 2026.
Seven of ten planned security improvements are now in production.

| ID | Item | Status |
|----|------|--------|
| SEC-01 | CSP `unsafe-inline` removed from production | [COMPLETED] |
| SEC-02 | CORS split by environment | [COMPLETED] |
| INFRA-01 | Dependency scanning in CI | [COMPLETED] |
| AUTH-01 | reCAPTCHA fail-closed with retry | [COMPLETED] |
| DATA-01 | Stripe secrets validated via serverConfig | [COMPLETED] |
| INFRA-02 | Production dependencies pinned to exact versions | [COMPLETED] |
| — | security.txt created | [COMPLETED] |

**Score progression:** 8.2 (initial audit) --> 9.2 (current, post-implementation)

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

**Remaining (future work):**

| Task | Status |
|------|--------|
| Add vulnerability disclosure policy page to site | Pending |
| Set up security@forestryequipmentsales.com email | Pending |

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
| Future | PII encryption, vulnerability disclosure page | 2 weeks | Pending |
| Future | Virus scanning, pen test prep | 2 weeks | Pending |
| **Total completed** | **7 of 10 items** | | **8.2 --> 9.2** |
| **Remaining target** | **3 items** | **~4 weeks** | **9.2 --> 9.5+** |
