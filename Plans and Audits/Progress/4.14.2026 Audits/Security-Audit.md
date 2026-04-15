# Security Audit — April 14, 2026

**Platform:** Forestry Equipment Sales (forestryequipmentsales.com)
**Scope:** Full-stack security assessment including authentication, authorization, data protection, network security, and compliance

---

## 1. Authentication Security

### 1.1 Authentication Methods

| Method | Status | Implementation |
|--------|--------|---------------|
| Email/Password | Active | Firebase Auth with scrypt hashing |
| Google OAuth | Active | `signInWithPopup` (GoogleAuthProvider) |
| SMS MFA | Active (optional) | Firebase PhoneMultiFactorGenerator |
| reCAPTCHA Enterprise | Active | Login, registration, inquiry forms |
| Email Verification | Active | Required for MFA enrollment in production |

### 1.2 Token Security

- **ID Token Verification:** `verifyIdToken(token, true)` — checks revocation on every API call
- **Token Refresh:** Automatic via `onIdTokenChanged` hook
- **CSRF Protection:** Double-submit cookie pattern
  - Token: `crypto.randomBytes(32).toString('hex')` (256-bit)
  - Comparison: `crypto.timingSafeEqual()` (constant-time)
  - Cookie: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`
- **Session Management:** Firebase Auth managed sessions with automatic refresh

### 1.3 Security Rating: STRONG

**No critical authentication vulnerabilities identified.**

---

## 2. Authorization & Access Control

### 2.1 Role-Based Access Control (RBAC)

11-tier role hierarchy enforced at three levels:
1. **Firestore Security Rules** — Custom claims + profile lookup (dual check)
2. **Cloud Storage Rules** — Owner/admin validation with content-type restrictions
3. **Server Middleware** — `verifyIdToken()` + role extraction on every API route

### 2.2 Immutable Fields

These fields CANNOT be modified by users (enforced in Firestore rules):
`uid`, `role`, `parentAccountUid`, `accountAccessSource`, `accountStatus`, `activeSubscriptionPlanId`, `subscriptionStatus`

### 2.3 Sub-Account Isolation

- Dealers can only manage their own sub-accounts
- Sub-accounts cannot manage siblings
- Only parent owner or admin can modify sub-account roles
- Enforced in `managed-roles.ts` via `authorizeManagement()`

### 2.4 Security Rating: STRONG

---

## 3. Network Security

### 3.1 Transport Layer Security

| Control | Value |
|---------|-------|
| TLS Version | 1.2+ (Google Cloud enforced) |
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| Certificate | Google-managed SSL (auto-renewed) |

### 3.2 Content Security Policy

```
default-src 'self'
script-src 'self' 'unsafe-inline' [Firebase, reCAPTCHA, Cloudflare]
style-src 'self' 'unsafe-inline' fonts.googleapis.com
img-src 'self' data: blob: [Stripe, Firebase, Unsplash, OpenStreetMap]
connect-src 'self' [Firebase, Stripe, Google, Cloud Run]
frame-src 'self' [reCAPTCHA, Firebase, Stripe, YouTube, Vimeo]
object-src 'none'
```

CSP violations reported to `/api/csp-report` and captured in Sentry.

### 3.3 Security Headers

| Header | Value | Status |
|--------|-------|--------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Active |
| X-Content-Type-Options | nosniff | Active |
| X-Frame-Options | DENY | Active |
| Referrer-Policy | strict-origin-when-cross-origin | Active |
| Permissions-Policy | camera=(), microphone=(), geolocation=(self), payment=(self), usb=() | Active |

### 3.4 Rate Limiting

| Endpoint | Window | Limit |
|----------|--------|-------|
| All `/api/**` | 15 min | 1,000 requests |
| Billing checkout | 1 min | 10 requests |
| Account deletion | 1 min | 3 requests |
| Portal session | 1 min | 10 requests |
| CSP reports | 1 min | 50 requests |

### 3.5 CORS Configuration

Explicit origin whitelist:
- `forestryequipmentsales.com` / `www.forestryequipmentsales.com`
- `timberequip.com` / `www.timberequip.com`
- `mobile-app-equipment-sales.web.app`
- `mobile-app-equipment-sales.firebaseapp.com`
- `timberequip-staging.web.app`
- `localhost:*` (development only)

### 3.6 Security Rating: STRONG

---

## 4. Data Protection

### 4.1 Encryption

| Layer | Method | Key Management |
|-------|--------|---------------|
| In Transit | TLS 1.2+ | Google-managed certificates |
| At Rest (Firestore) | AES-256 | Google Cloud KMS |
| At Rest (Cloud SQL) | AES-256 | Google Cloud KMS |
| At Rest (Cloud Storage) | AES-256 | Google Cloud KMS |
| Passwords | scrypt | Firebase Auth managed |
| CSRF Tokens | crypto.randomBytes(32) | Server-generated per session |

### 4.2 Secret Management

All production secrets stored in Google Cloud Secret Manager:
- `SENDGRID_API_KEY` — Email delivery
- `STRIPE_SECRET_KEY` — Payment processing
- `STRIPE_WEBHOOK_SECRET` — Webhook verification
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — SMS/calling
- `GOOGLE_MAPS_API_KEY` — Places API
- `PRIVILEGED_ADMIN_EMAILS` — Admin email list
- `VIRUS_TOTAL_API_KEY` — File scanning
- `RECAPTCHA_API_KEY` — Bot protection

Secrets injected at Cloud Function invocation time via `defineSecret()`. Not stored in environment variables or source code.

### 4.3 File Upload Security

| Check | Implementation |
|-------|---------------|
| Content-type validation | Storage rules (image/video/PDF/text only) |
| Size limits | Images 10MB, Videos 500MB, Documents 25MB |
| Virus scanning | VirusTotal API |
| Content moderation | Google Cloud Vision SafeSearch |
| Watermarking | Server-side AVIF processing with overlay |
| Metadata validation | `uploadedBy` must match authenticated user |

### 4.4 Security Rating: STRONG

---

## 5. Input Validation & Injection Prevention

### 5.1 Server-Side Validation

- **Zod schemas** on all API endpoints via `validateBody()` middleware
- **Firestore rules** with field-level validation (email regex, URL HTTPS-only, string lengths)
- **Parameterized queries** via Firestore SDK and Data Connect (no raw SQL)

### 5.2 Client-Side Sanitization

- React's default XSS protection (JSX auto-escaping)
- No `dangerouslySetInnerHTML` in user-facing components
- URL validation (HTTPS-only) in Firestore rules

### 5.3 Injection Vectors Assessed

| Vector | Risk | Mitigation |
|--------|------|-----------|
| SQL Injection | None | NoSQL (Firestore) + parameterized Data Connect |
| XSS | Low | React auto-escaping + CSP |
| CSRF | None | Double-submit cookie with timing-safe compare |
| Path Traversal | None | Firebase Storage path validation |
| Command Injection | None | No shell execution in application code |
| SSRF | Low | Google API calls only use validated URLs |

### 5.4 Security Rating: STRONG

---

## 6. Audit Trail & Compliance

### 6.1 Audit Logging

5 immutable audit log collections in Firestore:
- `auditLogs` — Admin actions
- `billingAuditLogs` — Stripe webhook events
- `accountAuditLogs` — Account lifecycle
- `dealerAuditLogs` — Dealer operations
- `consentLogs` — GDPR consent records

All collections are **create-only** (no update/delete permissions in Firestore rules).

PostgreSQL listing governance adds:
- `listing_state_transitions` — Full state change history with actor/reason
- `listing_versions` — Immutable document snapshots
- `listing_anomalies` — Anomaly detection and resolution

### 6.2 Compliance Posture

| Regulation | Status | Controls |
|------------|--------|----------|
| GDPR | Partial | Consent logging, account deletion, Privacy Policy |
| CCPA | Partial | Privacy Policy, data access controls |
| PCI DSS | Delegated | Stripe handles all card data (no PAN touches our servers) |
| COPPA | Documented | Age restriction in Terms of Service |

---

## 7. Vulnerability Summary

### Critical: None
### High: None

### Medium (3)
1. **SMS-only MFA** — No TOTP or hardware key support
2. **No formal access review process** — Recommend quarterly admin account review
3. **No data retention schedule** — For deleted accounts

### Low (4)
1. No SAST integration in CI/CD
2. No SBOM generation
3. CSP allows `unsafe-inline` for scripts (Firebase Auth requirement)
4. No distributed rate limiting across Cloud Run instances

---

## 8. Overall Security Rating

| Category | Rating |
|----------|--------|
| Authentication | Strong |
| Authorization | Strong |
| Network Security | Strong |
| Data Protection | Strong |
| Input Validation | Strong |
| Audit & Compliance | Good |
| **Overall** | **Strong** |

No critical or high-severity vulnerabilities identified. The platform meets enterprise security standards for a marketplace application.

---

*Assessment Date: April 14, 2026*
