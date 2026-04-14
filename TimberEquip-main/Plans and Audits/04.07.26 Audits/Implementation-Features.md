# Forestry Equipment Sales — Feature Implementation Recommendations

**Reference Audit:** FES-Overall-Offers.md (Score: 9.5/10)
**Target Score:** 9.7+/10
**Date:** April 14, 2026 (Updated — Tier 3.5 Sprint)
**Previous Date:** April 8, 2026

---

## Completed Features

### 1.4 Related Equipment / Internal Linking — COMPLETED

**Status:** COMPLETED (already existed)
ListingDetail.tsx includes both "Market Match" and "Similar Equipment" sections (lines 1617-1758), providing related-equipment recommendations and internal linking out of the box.

- Similarity query (same category + manufacturer + price range) — DONE
- "Similar Equipment" section on ListingDetail.tsx — DONE
- "Market Match" section on ListingDetail.tsx — DONE

### 3.1 Content Depth — COMPLETED

**Status:** COMPLETED (already existed)
`manufacturerContent.ts` contains 30+ manufacturer buying guides; `subcategoryContent.ts` covers 14 subcategories with overviews and buying tips. Equipment comparison tool is live at `/compare`.

- Manufacturer buying guides (per brand) — DONE (30+ guides in manufacturerContent.ts)
- Category-specific educational content — DONE (14 subcategories in subcategoryContent.ts)
- Equipment comparison tool — DONE (live at /compare)

### Equipment Comparison Tool — COMPLETED

**Status:** COMPLETED (already existed)
Full comparison functionality is available at `/compare`, allowing side-by-side equipment evaluation.

### Enterprise 3.5 Hardening Sprint — COMPLETED (Apr 8)

The following security and infrastructure features were added:

| Feature | Status |
|---------|--------|
| HTTP security headers (HSTS, Referrer-Policy, Permissions-Policy, CSP) via Firebase Hosting | Done |
| Firestore rules expanded to 1,066+ lines with catch-all deny | Done |
| reCAPTCHA + Firestore rate limiting on dealer inquiry endpoint | Done |
| PRIVILEGED_ADMIN_EMAILS migrated to Secret Manager | Done |
| Google Maps API key restricted | Done |
| Vulnerability disclosure page at /vulnerability-disclosure | Done |
| Firebase config tracked in git | Done |
| Unused `motion` package removed | Done |
| SeoLandingPages lazy imports consolidated | Done |
| Alt text fixes for accessibility | Done |
| 3 new test files added (49 total, 523+ passing) | Done |

### Tier 3.5 Sprint — COMPLETED (Apr 14)

The following enterprise features were added:

| Feature | Status |
|---------|--------|
| SSO (SAML/OIDC): server routes (sso.ts, 5 endpoints), SsoLoginButton, SsoTab admin panel | Done |
| API versioning: /api/v1 prefix on all 120+ frontend API calls (src/constants/api.ts) | Done |
| OpenAPI 3.1 specification: docs/openapi.yaml — 33 endpoints, 9 schemas, 7 tag groups | Done |
| Formal SLA documentation: docs/SLA.md — 99.9% uptime, P1-P4 severity, service credits | Done |
| Status page: /status with live component health, auto-refresh, uptime | Done |
| Help center: /help with 24 searchable articles, 7 categories; /help/:slug | Done |
| Enhanced health endpoint: /api/health with Firestore + Stripe checks + latency | Done |
| Public status endpoint: /_status | Done |
| Pino structured logging: 91+ console calls replaced; src/server/logger.ts | Done |
| All 24 empty catch blocks fixed (19 server + 5 frontend) | Done |
| 36 new tests (adminRoutes.test.ts: 16, managedRolesRoutes.test.ts: 20) — 619 total, 51 files | Done |
| DataConnect added to firebase.json | Done |
| UX: "List Equipment" to "Sell Equipment" in nav | Done |
| UX: Image gallery stretching fixed | Done |
| UX: "WoW" to "Weekly" on analytics | Done |
| UX: Last Updated shows date + time | Done |

---

## Priority 1: High-Impact Feature Gaps (Remaining)

### 1.1 Push Notifications (Web Push via FCM)

**Current:** No push notifications
**Target:** Real-time browser push for outbid alerts, new listings, price drops

| Task | Effort | Impact |
|------|--------|--------|
| Configure Firebase Cloud Messaging in frontend | 4 hours | HIGH |
| Add service worker for background push | 4 hours | HIGH |
| Create notification permission UX flow | 4 hours | MEDIUM |
| Wire push triggers into auction outbid, new listing, price drop events | 8 hours | HIGH |
| Add notification preferences to user settings | 4 hours | MEDIUM |
| **Total** | **24 hours** | |

### 1.2 Equipment Video Support

**Current:** Image-only listings
**Target:** Video uploads with playback on listing detail pages

| Task | Effort | Impact |
|------|--------|--------|
| Add video upload field to listing form | 4 hours | MEDIUM |
| Configure Cloud Storage video policies | 2 hours | LOW |
| Add video player component to ListingDetail.tsx | 4 hours | HIGH |
| Generate video thumbnail on upload (Cloud Function) | 6 hours | MEDIUM |
| Add VideoObject JSON-LD structured data | 2 hours | MEDIUM |
| **Total** | **18 hours** | |

### 1.3 Equipment Reviews & Ratings

**Current:** No review system
**Target:** Verified buyer reviews on dealer storefronts

| Task | Effort | Impact |
|------|--------|--------|
| Create reviews Firestore collection with schema validation | 4 hours | HIGH |
| Add review submission form (post-purchase) | 6 hours | HIGH |
| Display reviews on SellerProfile page | 4 hours | HIGH |
| Add AggregateRating JSON-LD schema | 2 hours | HIGH (SEO) |
| Review moderation in admin dashboard | 6 hours | MEDIUM |
| **Total** | **22 hours** | |

---

## Priority 2: Medium-Impact Improvements (Remaining)

### 2.1 Advanced Search Features

| Feature | Effort | Impact |
|---------|--------|--------|
| Map-based search with pins for each listing | 12 hours | HIGH |
| Autocomplete suggestions in search bar | 6 hours | MEDIUM |
| Recent searches dropdown | 3 hours | LOW |
| Search result sharing (URL preserves all filters) | 4 hours | MEDIUM |

### 2.2 Messaging / Inbox System

| Feature | Effort | Impact |
|---------|--------|--------|
| In-app inbox for buyer-seller messaging | 20 hours | HIGH |
| Real-time message notifications via WebSocket | 8 hours | HIGH |
| Attachment support in messages | 6 hours | MEDIUM |
| Message templates for common seller responses | 4 hours | LOW |

### 2.3 Equipment Inspection Reports

| Feature | Effort | Impact |
|---------|--------|--------|
| Structured inspection form (engine, hydraulics, electrical) | 8 hours | HIGH |
| PDF report generation | 6 hours | MEDIUM |
| Attach inspection report to listing | 4 hours | MEDIUM |
| Third-party inspector verification badge | 4 hours | HIGH |

---

## Priority 3: Nice-to-Have Enhancements (Remaining)

### 3.2 Mobile App (PWA Enhancement)

| Feature | Effort | Impact |
|---------|--------|--------|
| Offline listing browsing (service worker cache) | 12 hours | MEDIUM |
| Add-to-homescreen prompt optimization | 4 hours | LOW |
| Mobile camera integration for listing photos | 8 hours | MEDIUM |
| Barcode/serial number scanner | 10 hours | LOW |

### 3.3 Remaining Content Depth

| Feature | Effort | Impact |
|---------|--------|--------|
| Equipment pricing guides / market data | 12 hours | HIGH |
| Seasonal buying tips (blog content) | 8 hours | MEDIUM |

---

## Implementation Timeline (Updated April 7, 2026)

| Phase | Features | Duration | Score Impact |
|-------|----------|----------|-------------|
| **Already Complete** | Related Equipment, Content Depth, Comparison Tool, Enterprise 3.5 Hardening | -- | Reflected in baseline |
| **Tier 3.5 Sprint (Apr 14)** | SSO, API versioning, OpenAPI docs, SLA, Status page, Help center, Structured logging, 36 tests, UX fixes | -- | 9.2 → 9.5 |
| Sprint 1 | Push notifications + Video support | 2 weeks | +0.1 |
| Sprint 2 | Reviews & Ratings + Inspection reports | 2 weeks | +0.1 |
| Sprint 3 | Advanced search + Messaging | 3 weeks | +0.1 |
| Sprint 4 | PWA enhancements + Remaining content | 2 weeks | +0.1 |
| **Total remaining** | | **9 weeks** | **9.5 → 9.7+** |
