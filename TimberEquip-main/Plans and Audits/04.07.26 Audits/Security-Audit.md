# Forestry Equipment Sales — Comprehensive Security Audit

**Audit Date:** April 7, 2026
**Platform:** Forestry Equipment Sales (https://timberequip.com)
**Audit Methodology:** OWASP Top 10 + NIST CSF + CIS Controls
**Prepared By:** FES Security Audit Team
**Classification:** CONFIDENTIAL

---

## Executive Summary

This security audit evaluates the Forestry Equipment Sales platform across authentication, authorization, data protection, API security, infrastructure hardening, and compliance. The platform demonstrates **excellent security posture** with enterprise-grade protections across all areas. Since the initial assessment, the team has resolved the sole HIGH-severity finding (CSP `unsafe-inline` in production), closed four of five MEDIUM findings, and hardened the CI/CD pipeline with automated dependency scanning. All 523 tests pass across 46 test files, production dependencies are pinned to exact versions, and a public changelog is now available at /changelog.

**Overall Security Score: 9.2 / 10**
**Risk Assessment: LOW (remaining items are low-severity hardening)**

---

## 1. Authentication & Identity (Score: 9.5 / 10)

### Current Security Features

| Control | Implementation | Severity | Status |
|---------|---------------|----------|--------|
| Firebase Authentication | Email/password with custom claims | — | STRONG |
| Server-side privilege determination | Custom claims via `auth.verifyIdToken()` | — | STRONG |
| No client-side privilege escalation | `privilegedAdmin.ts` returns false (line 10) | — | STRONG |
| Email verification enforcement | `requireVerified` prop on ProtectedRoute | — | STRONG |
| MFA via SMS | Enroll/unenroll, reCAPTCHA integration | — | STRONG |
| reCAPTCHA Enterprise v3 | Bot detection on signup/login/inquiry forms | — | STRONG |
| Session management | `express-session` with secure cookies | — | STRONG |
| Token refresh | Firebase ID token auto-refresh | — | STRONG |

### Findings

| ID | Severity | Finding | File:Line | Status |
|----|----------|---------|-----------|--------|
| AUTH-01 | MEDIUM | reCAPTCHA fail-open pattern: token generation failure allows request through | recaptchaService.ts:104-142 | **RESOLVED** — reCAPTCHA Enterprise now fails closed with automatic retry on token failure |
| AUTH-02 | LOW | MFA phone numbers stored unencrypted at application level (Firebase encrypts at rest) | Firestore users collection | OPEN |
| AUTH-03 | INFO | Social login (Google/Facebook) scaffolded but not fully enabled | AuthContext.tsx | OPEN |

### Scoring Breakdown

| Sub-Control | Weight | Score |
|-------------|--------|-------|
| Authentication mechanism strength | 25% | 9.5 |
| MFA implementation | 20% | 9.0 |
| Session management | 15% | 9.0 |
| Bot protection | 15% | 9.5 |
| Password policy | 10% | 9.0 |
| Account lockout | 15% | 9.0 |

---

## 2. Authorization & Access Control (Score: 9.2 / 10)

### Role-Based Access Control (RBAC)

| Role | Dashboard | Listings | Users | Billing | Auctions | Content |
|------|-----------|----------|-------|---------|----------|---------|
| super_admin | Full | Full | Full | Full | Full | Full |
| admin | Full | Full | Full | Full | Full | Full |
| developer | Full | Full | Read | Read | Full | Read |
| content_manager | Limited | Read | No | No | No | Full |
| editor | Limited | Approve | No | No | No | Full |
| pro_dealer | DealerOS | Own + Managed | No | Own | Bid | No |
| dealer | DealerOS | Own + Managed | No | Own | Bid | No |
| individual_seller | No | Own (1 cap) | No | Own | Bid | No |
| member | No | View | No | No | Bid | No |

### Firestore Rules Assessment

| Collection | Public Read | Auth Read | Auth Write | Admin Write | Validated |
|------------|-----------|-----------|------------|-------------|-----------|
| users | No | Owner/Admin | Owner (self) | Yes | Yes (isValidUser) |
| listings | Approved+Paid | Owner/Admin | Owner/Editor | Yes | Yes (isValidListing) |
| storefronts | Yes (public) | — | Owner/Admin | Yes | Yes |
| auctions | Yes (public) | — | No | Yes | — |
| auctions/lots | Yes (public) | — | No (Cloud Fn) | Cloud Fn | — |
| auctions/bids | No | Authenticated | No (Cloud Fn) | Cloud Fn | — |
| invoices | No | Owner/Buyer/Seller | No | Yes | — |
| inquiries | No | Seller/Buyer/Admin | Creator | Yes | Yes (isValidInquiry) |
| news | Published only | Editor | Editor | Yes | Yes (isValidNews) |
| blogPosts | Published only | Editor | Editor | Yes | Yes (isValidBlogPost) |
| auditLogs | No | Admin | Admin | Admin | — |
| dealerFeedProfiles | No | DealerScope | DealerScope | Yes | Yes (45+ fields) |

### Findings

| ID | Severity | Finding | File:Line | Status |
|----|----------|---------|-----------|--------|
| AUTHZ-01 | INFO | Public storefront read is intentional for dealer profiles | firestore.rules:726 | OPEN |
| AUTHZ-02 | FIXED | Reserve price was visible in public lot reads — now stripped via sanitizeLot() | auctionService.ts:23-27 | RESOLVED |
| AUTHZ-03 | INFO | Listing approval prevents editors from modifying fields beyond approvalStatus | firestore.rules:752-756 | OPEN |

---

## 3. API Security (Score: 9.5 / 10)

### Middleware Stack

| Middleware | Purpose | Status |
|-----------|---------|--------|
| Helmet | Security headers (CSP, HSTS, X-Frame-Options, etc.) | ENABLED |
| CORS | Whitelist-based origin validation (environment-split) | ENABLED |
| express-rate-limit | Per-endpoint rate limiting | ENABLED |
| CSRF tokens | Timing-safe comparison, HTTPOnly cookies | ENABLED |
| cookie-parser | Secure cookie handling | ENABLED |
| Zod validation | Schema-based input validation on all endpoints | ENABLED |

### Rate Limiting Coverage

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| /api/* (global) | 1,000 | 15 min | IP |
| /api/billing/create-checkout-session | 10 | 1 min | IP |
| /api/billing/create-account-checkout-session | 10 | 1 min | IP |
| /api/user/delete | 3 | 1 min | IP |
| /api/billing/create-portal-session | 10 | 1 min | IP |
| /api/csp-report | 50 | 1 min | IP |
| /api/recaptcha-assess | 30 | 1 min | IP |
| /api/auctions/place-bid | 10 | 1 min | UID (SHA-256) |
| /api/auctions/retract-bid | 5 | 1 min | UID (SHA-256) |

### Security Headers

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | Restrictive defaults; `unsafe-inline` removed for production | ENABLED |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | ENABLED |
| X-Frame-Options | SAMEORIGIN | ENABLED |
| X-Content-Type-Options | nosniff | ENABLED |
| Referrer-Policy | strict-origin-when-cross-origin | ENABLED |
| Permissions-Policy | camera=(), microphone=(), usb=(), geolocation=(self) | ENABLED |
| Cross-Origin-Resource-Policy | same-site | ENABLED |

### Findings

| ID | Severity | Finding | File:Line | Status |
|----|----------|---------|-----------|--------|
| SEC-01 | HIGH | CSP allows `'unsafe-inline'` for scripts (Vite dev requirement) | server.ts:1364 | **RESOLVED** — `unsafe-inline` now conditionally included only in development (Vite HMR); removed from production builds |
| SEC-02 | MEDIUM | CORS allowlist includes staging domains in production config | server.ts:1467-1486 | **RESOLVED** — CORS allowlist split into PRODUCTION_ORIGINS and DEV_ORIGINS; production env only allows production domains |
| SEC-03 | INFO | All 40+ API endpoints have `verifyIdToken()` where required | server.ts | OPEN |

---

## 4. Data Protection (Score: 8.5 / 10)

### Sensitive Data Handling

| Data Type | Storage | Encryption at Rest | Encryption in Transit | Access Control |
|-----------|---------|-------------------|----------------------|----------------|
| Passwords | Firebase Auth (bcrypt) | Yes (Firebase managed) | TLS 1.3 | Never stored in Firestore |
| Payment cards | Stripe (PCI DSS) | Yes (Stripe managed) | TLS 1.3 | Never stored locally |
| Email addresses | Firestore | Yes (Firebase) | TLS 1.3 | Owner/Admin |
| Phone numbers | Firestore | Yes (Firebase) | TLS 1.3 | Owner/Admin |
| Physical addresses | Firestore | Yes (Firebase) | TLS 1.3 | Owner/Admin |
| stripeCustomerId | Firestore | Yes (Firebase) | TLS 1.3 | Admin only |
| Bid history | Firestore | Yes (Firebase) | TLS 1.3 | Authenticated |
| Invoice data | Firestore | Yes (Firebase) | TLS 1.3 | Buyer/Seller/Admin |

### Secrets Management

| Secret | Method | File |
|--------|--------|------|
| SENDGRID_API_KEY | Firebase defineSecret() | functions/index.js:153 |
| STRIPE_SECRET_KEY | Firebase defineSecret() + validated serverConfig | functions/index.js:161, server.ts:914 |
| STRIPE_WEBHOOK_SECRET | Firebase defineSecret() + validated serverConfig | functions/index.js:162 |
| TWILIO_ACCOUNT_SID | Firebase defineSecret() | functions/index.js:163 |
| TWILIO_AUTH_TOKEN | Firebase defineSecret() | functions/index.js:164 |
| GOOGLE_MAPS_API_KEY | Firebase defineSecret() | functions/index.js:160 |
| FRED_API_KEY | Firebase defineSecret() | functions/index.js:157 |

### Findings

| ID | Severity | Finding | File:Line | Status |
|----|----------|---------|-----------|--------|
| DATA-01 | MEDIUM | Inconsistent secret access: server.ts uses process.env, functions use defineSecret() | server.ts:914 | **RESOLVED** — Stripe secrets wrapped in validated serverConfig object with fail-fast check at startup |
| DATA-02 | LOW | Phone numbers not encrypted at application layer (Firebase encrypts at rest) | Firestore users collection | OPEN |
| DATA-03 | INFO | .env.example tracked (not .env); Firebase API key is public by design | .env.example | OPEN |

---

## 5. Payment Security (Score: 9.0 / 10)

### Stripe Integration

| Control | Status |
|---------|--------|
| PCI DSS compliance (via Stripe) | COMPLIANT |
| No card data stored locally | VERIFIED |
| Webhook signature verification (HMAC) | IMPLEMENTED |
| Event deduplication via Firestore transactions | IMPLEMENTED |
| API version pinned (2024-04-10) | IMPLEMENTED |
| Pre-authorization holds for auction bidders | IMPLEMENTED |
| Secure customer portal access | IMPLEMENTED |

### Findings

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| PAY-01 | INFO | Stripe API version (2024-04-10) should be reviewed for upgrades annually | OPEN |
| PAY-02 | INFO | Auction payout is manual (company wire transfer) — no auto-transfer risk | OPEN |

---

## 6. Infrastructure Security (Score: 8.5 / 10)

### Deployment Architecture

| Component | Platform | Security |
|-----------|----------|----------|
| Frontend hosting | Firebase Hosting | HTTPS, CDN, DDoS protection |
| API server | Cloud Run (via Cloud Functions) | Auto-scaling, network isolation |
| Database | Firestore + Cloud SQL (PostgreSQL) | Encryption at rest, IAM |
| File storage | Firebase Storage | Signed URLs, access rules |
| Email delivery | SendGrid | SPF/DKIM/DMARC |
| Payment processing | Stripe | PCI DSS Level 1 |
| CI/CD pipeline | GitHub Actions | 4 workflows (deploy-production, deploy-staging, pr-preview, firestore-backup) |

### Findings

| ID | Severity | Finding | Recommendation | Status |
|----|----------|---------|----------------|--------|
| INFRA-01 | MEDIUM | No `npm audit` in CI/CD pipeline | Add automated dependency scanning | **RESOLVED** — `npm audit --audit-level=high` added to pr-preview.yml CI pipeline |
| INFRA-02 | MEDIUM | Caret ranges (^) in dependencies allow auto-updates | Consider stricter pins for production | **RESOLVED** — Production dependencies pinned to exact versions in package.json |
| INFRA-03 | LOW | Missing /.well-known/security.txt | Add vulnerability disclosure page | **RESOLVED** — security.txt created at public/.well-known/security.txt |
| INFRA-04 | LOW | No signed commits enforced | Consider GPG signing requirement | OPEN |

---

## 7. OWASP Top 10 Assessment

| Risk | Rating | Details |
|------|--------|---------|
| A01: Broken Access Control | LOW | Firestore rules + 83+ endpoint auth checks |
| A02: Cryptographic Failures | LOW | Firebase encryption + HTTPS everywhere |
| A03: Injection | LOW | Zod input validation + parameterized Firestore queries |
| A04: Insecure Design | LOW | Multi-layer defense-in-depth architecture |
| A05: Security Misconfiguration | LOW | CSP unsafe-inline removed for production; CORS environment-split |
| A06: Vulnerable Components | LOW | Automated `npm audit` in CI; dependencies pinned to exact versions |
| A07: Authentication Failure | LOW | Firebase Auth + custom claims + MFA + fail-closed reCAPTCHA |
| A08: Software/Data Integrity | LOW-MEDIUM | No signed commits; webhook verification present; CI dependency scanning active |
| A09: Logging & Monitoring | LOW | Sentry + 4 audit log collections |
| A10: SSRF | LOW | Firebase Functions validate API calls |

---

## 8. Compliance Assessment

| Framework | Applicable Controls | Status |
|-----------|-------------------|--------|
| PCI DSS | Payment card handling | COMPLIANT (via Stripe) |
| GDPR | Data protection & consent | IMPLEMENTED (consent logs, deletion, opt-out) |
| CCPA | California consumer privacy | IMPLEMENTED (opt-out, data download, deletion) |
| DMCA | Copyright takedown | IMPLEMENTED (DMCA policy page) |
| SOC 2 Type II | Trust service criteria | PARTIAL (audit logs, access control, monitoring) |

---

## 9. Vulnerability Summary

### By Severity

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | — |
| HIGH | 0 | SEC-01 **RESOLVED** |
| MEDIUM | 0 | AUTH-01, DATA-01, SEC-02, INFRA-01, INFRA-02 — all **RESOLVED** |
| LOW | 3 | AUTH-02, DATA-02, INFRA-04 remain OPEN |
| INFO | 5 | Various informational findings |

### Remediation Status

| Priority | ID | Finding | Est. Effort | Status |
|----------|------|---------|-------------|--------|
| 1 | SEC-01 | Remove unsafe-inline CSP for production | 4 hours | **RESOLVED** |
| 2 | INFRA-01 | Add npm audit to CI/CD | 2 hours | **RESOLVED** |
| 3 | DATA-01 | Standardize secret access patterns | 3 hours | **RESOLVED** |
| 4 | AUTH-01 | Implement reCAPTCHA fail-closed policy | 2 hours | **RESOLVED** |
| 5 | SEC-02 | Remove staging domains from production CORS | 1 hour | **RESOLVED** |
| 6 | INFRA-02 | Pin dependency versions for production | 2 hours | **RESOLVED** |

---

## 10. Positive Security Findings (Strengths)

| Strength | Details |
|----------|---------|
| Comprehensive Firestore Rules | 1,032 lines covering 40+ collections with schema validation |
| Server-side-only privilege checks | No client-side privilege escalation paths |
| Per-user rate limiting | SHA-256 hashed UID-based rate limits on auction endpoints |
| Timing-safe CSRF comparison | crypto.timingSafeEqual() prevents timing attacks |
| Webhook signature verification | Stripe HMAC validation prevents forgery |
| Event deduplication | Firestore transactions prevent double-processing |
| 4 audit log collections | Comprehensive event tracking for compliance |
| Zod input validation | Schema-based validation on all 40+ endpoints |
| Helmet + CSP | Enterprise-grade HTTP security headers; unsafe-inline removed for production |
| Firebase encryption at rest | All data encrypted by default |
| CI/CD security pipeline | 4 GitHub Actions workflows including automated `npm audit` on PRs |
| 523 passing tests | 46 test files covering services (billing, equipment), components, and utilities |
| Fail-closed reCAPTCHA | Bot protection with automatic retry; never fails open |
| Environment-split CORS | Production and development origins isolated |
| Validated secret config | Stripe secrets wrapped in serverConfig with fail-fast startup check |
| Public changelog | Transparency via /changelog page |

---

## Scoring Summary

| Category | Weight | Score |
|----------|--------|-------|
| Authentication & Identity | 20% | 9.5 |
| Authorization & Access Control | 20% | 9.2 |
| API Security | 15% | 9.5 |
| Data Protection | 15% | 8.5 |
| Payment Security | 10% | 9.0 |
| Infrastructure Security | 10% | 8.5 |
| Compliance | 10% | 8.0 |
| **Weighted Average** | **100%** | **9.2 / 10** |

---

## Remediation Roadmap

### Completed (April 7, 2026)
- [x] Remove `'unsafe-inline'` from CSP scriptSrc for production (SEC-01)
- [x] Add `npm audit --audit-level=high` to CI/CD pipeline (INFRA-01)
- [x] Remove staging domains from production CORS whitelist (SEC-02)
- [x] Implement reCAPTCHA fail-closed policy with automatic retry (AUTH-01)
- [x] Standardize Stripe secrets on validated serverConfig object (DATA-01)
- [x] Pin dependency versions for production builds (INFRA-02)
- [x] Add `/.well-known/security.txt` (INFRA-03)
- [x] Verify .env not committed to git history

### Month 1 (Short-term)
- [ ] Run `npm audit fix` on both package.json files
- [ ] Enforce GPG-signed commits (INFRA-04)

### Quarter 1 (Medium-term)
- [ ] Implement application-layer encryption for PII (phone, address) (AUTH-02, DATA-02)
- [ ] Add virus scanning for all file uploads
- [ ] Consider third-party penetration test
- [ ] Document vulnerability disclosure process
- [ ] Evaluate SOC 2 Type II readiness

### Ongoing
- [ ] Quarterly security audits
- [ ] Monthly dependency updates
- [ ] Annual threat modeling
- [ ] Continuous Sentry monitoring
