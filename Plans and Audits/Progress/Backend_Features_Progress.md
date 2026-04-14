# TimberEquip Backend Features & Progress Report

**Date:** April 8, 2026 (updated April 14 for Tier 3.5 completion)
**Branch:** master
**Runtime:** Node.js + Express on Cloud Run | Cloud Functions (us-central1)

---

## Executive Summary

The TimberEquip backend is **production-grade** with 40+ REST API endpoints, 40+ Cloud Functions (triggers + scheduled jobs), full Stripe billing integration, Twilio voice, SendGrid email (37 templates), reCAPTCHA Enterprise, Sentry monitoring, Pino structured logging, API versioning (`/api/v1`), OpenAPI 3.1 documentation, SSO (SAML/OIDC), content moderation (Google Cloud Vision SafeSearch), and a 5-phase PostgreSQL dual-write migration in progress. All core marketplace, auction, dealer, and billing systems are fully operational.

---

## 1. REST API Endpoints (100% Complete)

### 1.1 Account & Seller Management (12 endpoints)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/account/listings` | GET | Bearer | COMPLETE |
| `/api/account/listings` | POST | Bearer | COMPLETE |
| `/api/account/listings/:id` | PUT | Bearer | COMPLETE |
| `/api/account/listings/:id` | DELETE | Bearer | COMPLETE |
| `/api/account/listings/:id/lifecycle` | POST | Bearer | COMPLETE |
| `/api/account/listings/bootstrap` | GET | Bearer | COMPLETE |
| `/api/account/storefront` | GET/PUT | Bearer | COMPLETE |
| `/api/account/calls` | GET | Bearer | COMPLETE |
| `/api/account/calls/:callId/recording` | GET | Bearer | COMPLETE |
| `/api/account/inquiries` | GET | Bearer | COMPLETE |
| `/api/account/inquiries/:id/respond` | POST | Bearer | COMPLETE |
| `/api/account/search-alerts` | GET/POST/DELETE | Bearer | COMPLETE |

### 1.2 Billing & Subscriptions (7 endpoints)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/billing/create-checkout-session` | POST | Bearer | COMPLETE |
| `/api/billing/create-account-checkout-session` | POST | Bearer | COMPLETE |
| `/api/billing/checkout-session/:sessionId` | GET | Bearer | COMPLETE |
| `/api/billing/create-portal-session` | POST | Bearer | COMPLETE |
| `/api/billing/cancel-subscription` | POST | Bearer | COMPLETE |
| `/api/billing/webhook` | POST | Stripe Sig | COMPLETE |
| `/api/billing/tax-exemption` | POST | Bearer | COMPLETE |

**Stripe Plans:**
- `individual_seller`: $39/month, 1 listing cap
- `dealer`: $250/month, 50 listings, 6-month trial
- `fleet_dealer` (pro_dealer): $500/month, unlimited, 3-month trial

### 1.3 Auction System (8 endpoints)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/auctions` | GET | None | COMPLETE |
| `/api/auctions/:slug` | GET | None | COMPLETE |
| `/api/auctions/:id/lots` | GET | None | COMPLETE |
| `/api/auctions/:id/lots/:lotId/bids` | POST | Bearer | COMPLETE |
| `/api/auctions/create-identity-session` | POST | Bearer | COMPLETE |
| `/api/auctions/create-preauth-hold` | POST | Bearer | COMPLETE |
| `/api/auctions/confirm-preauth` | POST | Bearer | COMPLETE |
| `/api/auctions/process-seller-payout` | POST | Admin | COMPLETE |

**Auction Lifecycle:** upcoming -> active -> extended (soft-close) -> ended -> invoiced -> paid

**Soft-Close:** Bid in final 3 min extends close by 2 min (configurable per lot)

### 1.4 Authentication & Email (6 endpoints)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/auth/login` | POST | None | COMPLETE |
| `/api/auth/register` | POST | None | COMPLETE |
| `/api/auth/verify-email` | POST | Bearer | COMPLETE |
| `/api/auth/set-custom-claims` | POST | Admin | COMPLETE |
| `/api/auth/unsubscribe` | POST | Signed Token | COMPLETE |
| `/api/auth/email-preferences` | GET/PUT | Signed Token | COMPLETE |

### 1.5 Admin Dashboard (19 endpoints)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/admin/bootstrap` | GET | COMPLETE |
| `/api/admin/users` | GET | COMPLETE |
| `/api/admin/users/create-managed-account` | POST | COMPLETE |
| `/api/admin/users/:userId/verify` | POST | COMPLETE |
| `/api/admin/users/:userId/unverify` | POST | COMPLETE |
| `/api/admin/listings` | GET | COMPLETE |
| `/api/admin/listings/review-summaries` | GET | COMPLETE |
| `/api/admin/listings/:listingId/audit` | GET | COMPLETE |
| `/api/admin/inquiries` | GET | COMPLETE |
| `/api/admin/calls` | GET | COMPLETE |
| `/api/admin/calls/:callId/recording` | GET | COMPLETE |
| `/api/admin/billing/invoices` | GET | COMPLETE |
| `/api/admin/billing/subscriptions` | GET | COMPLETE |
| `/api/admin/billing/audit-logs` | GET | COMPLETE |
| `/api/admin/content/blog-posts` | GET | COMPLETE |
| `/api/admin/content/bootstrap` | GET | COMPLETE |
| `/api/admin/content/media` | GET | COMPLETE |
| `/api/admin/content/blocks` | GET | COMPLETE |
| `/api/admin/pg-analytics` | GET | COMPLETE |

### 1.6 Dealer Feed Management (14 endpoints)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/admin/dealer-feeds` | GET/POST | COMPLETE |
| `/api/admin/dealer-feeds/:feedId` | GET | COMPLETE |
| `/api/admin/dealer-feeds/:feedId/sync` | POST | COMPLETE |
| `/api/admin/dealer-feeds/:feedId/audit` | GET | COMPLETE |
| `/api/admin/dealer-feeds/:feedId/widget-config` | GET | COMPLETE |
| `/api/admin/dealer-feeds/ingest` | POST | COMPLETE |
| `/api/admin/dealer-feeds/bootstrap` | GET | COMPLETE |
| `/api/admin/dealer-feeds/logs` | GET | COMPLETE |
| `/api/admin/dealer-feeds/webhooks` | GET/POST | COMPLETE |
| `/api/admin/dealer-feeds/webhooks/:id` | GET | COMPLETE |
| `/api/admin/dealer-feeds/webhooks/:id/secret` | POST | COMPLETE |
| `/api/admin/dealer-feeds/webhooks/:id/test` | POST | COMPLETE |

### 1.7 Public Marketplace (12 endpoints)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/public/listings` | GET | COMPLETE |
| `/api/public/listings/by-id` | GET | COMPLETE |
| `/api/public/listings/:id/view` | POST | COMPLETE |
| `/api/public/category-metrics` | GET | COMPLETE |
| `/api/public/home-data` | GET | COMPLETE |
| `/api/public/sellers/:identity` | GET | COMPLETE |
| `/api/public/dealers` | GET | COMPLETE |
| `/api/public/news` | GET | COMPLETE |
| `/api/public/news/:id` | GET | COMPLETE |
| `/api/public/places-autocomplete` | GET | COMPLETE |
| `/api/public/place-details` | GET | COMPLETE |
| `/api/marketplace-stats` | GET | COMPLETE |

### 1.8 SSO Management (5 endpoints — NEW Apr 14)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/v1/sso/providers` | GET | Admin | COMPLETE |
| `/api/v1/sso/providers` | POST | Admin | COMPLETE |
| `/api/v1/sso/providers/:id` | PUT | Admin | COMPLETE |
| `/api/v1/sso/providers/:id` | DELETE | Admin | COMPLETE |
| `/api/v1/sso/domain-lookup` | GET | None | COMPLETE |

**Route file:** `src/server/routes/sso.ts`

### 1.9 Managed Roles (NEW Apr 8)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/v1/managed-roles/*` | Various | Bearer | COMPLETE |

### 1.10 Utilities (7 endpoints)

| Endpoint | Status |
|----------|--------|
| `/api/v1/csrf-token` | COMPLETE |
| `/api/v1/health` | COMPLETE (enhanced — checks Firestore + Stripe, component-level latency) |
| `/_status` | COMPLETE (public health endpoint) |
| `/api/v1/recaptcha-assess` | COMPLETE |
| `/api/v1/upload` | COMPLETE (content moderation via Google Cloud Vision SafeSearch) |
| `/api/v1/user/delete` | COMPLETE |
| `/api/v1/content-moderation` | COMPLETE (Google Cloud Vision SafeSearch) |

---

## 2. Cloud Functions — Firestore Triggers (20+ functions)

### Email/Notification Triggers
- `onInquiryCreated` — Sends inquiry email to seller + confirmation to buyer
- `onUserProfileCreated` — Welcome email, account initialization
- `onListingCreated` — SEO sync, governance, image processing queue
- `onListingStatusChanged` — Lifecycle rules, SEO updates
- `onMediaKitRequestCreated` — Admin notification
- `onFinancingRequestCreated` — Admin notification
- `onContactRequestCreated` — Admin notification
- `onSubscriptionCreated` — Subscription confirmation email

### SEO Read Model Sync
- `syncPublicSeoReadModelOnListingWrite` — Updates public SEO collection
- `syncPublicSeoReadModelOnUserWrite` — Syncs seller profile to SEO model
- `syncPublicSeoReadModelOnStorefrontWrite` — Storefront changes to SEO model

### Image Processing
- `generateListingImageVariants` — Converts source images to AVIF detail + thumbnail

### Dual-Write Triggers (20 functions — see PostgreSQL doc)
- 5 Users/Billing triggers
- 4 Auction triggers
- 4 Leads triggers
- 6 Dealer triggers
- 1 Listing governance sync

---

## 3. Cloud Functions — Scheduled Jobs (9 jobs)

| Job | Schedule | Status |
|-----|----------|--------|
| `rebuildPublicSeoReadModelScheduled` | Every 6 hours | COMPLETE |
| `subscriptionExpiryReminder` | Daily | COMPLETE |
| `subscriptionExpiredNotice` | Daily | COMPLETE |
| `expireListingsByDate` | Daily | COMPLETE |
| `processAuctionClosures` | Every 5 min | COMPLETE |
| `dealerFeedNightlySync` | 2 AM CST daily | COMPLETE |
| `monthlyDealerReport` | 9 AM 1st of month | COMPLETE |
| `nightlyDataRefresh` | 2 AM CST daily | COMPLETE |
| `weeklyMarketPulse` | 3 AM Monday | COMPLETE |

---

## 4. Email System (34 SendGrid Templates)

| Template | Trigger | Recipients |
|----------|---------|-----------|
| `leadNotification` | New inquiry | Seller |
| `inquiryConfirmation` | New inquiry | Buyer |
| `accountVerified` | Account approval | User |
| `accountVerificationDeclined` | Account rejected | User |
| `subscriptionConfirmed` | New subscription | User |
| `subscriptionExpiring` | 7 days before expiry | User |
| `subscriptionExpired` | On expiry | User |
| `billingFailure` | Payment failed | User |
| `auctionLotClosed` | Lot closes | Bidder/Seller |
| `auctionInvoiceGenerated` | Invoice created | Buyer |
| `auctionPaymentSuccess` | Invoice paid | Seller |
| `dealerFeedSyncReport` | Nightly sync | Dealer |
| `passwordResetConfirm` | User initiates | User |
| `mediaKitInquiry` | Media kit request | Admin |
| `financingRequestNotification` | Financing form | Admin |

**3 new templates added Apr 8-14:**
- `roleChanged` — Notifies user when their role is changed
- `accountRemoved` — Notifies user when their account is removed
- `contentModeration` — Notifies user when content fails moderation

Features: Responsive HTML, signed HMAC unsubscribe tokens, email preference management, fallback sender

---

## 5. Third-Party Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Stripe** | Payments, subscriptions, billing portal, Identity API, Connect payouts | COMPLETE |
| **SendGrid** | Transactional email (34 templates) | COMPLETE |
| **Twilio** | Phone provisioning, inbound call routing, recording, SMS MFA | COMPLETE |
| **Google reCAPTCHA Enterprise** | Form/bot protection | COMPLETE |
| **Google Places API** | Autocomplete, geocoding | COMPLETE |
| **Google Translate API** | Multi-language support | COMPLETE |
| **Sentry** | Error tracking (server + functions) | COMPLETE |
| **Firebase Auth** | Authentication, custom claims | COMPLETE |
| **Firebase Storage** | Image/file storage | COMPLETE |
| **Firebase Data Connect** | PostgreSQL bridge (6 connectors) | COMPLETE |
| **Google Cloud Vision** | Content moderation (SafeSearch) | COMPLETE |
| **Sharp.js** | Image processing (AVIF conversion) | COMPLETE |

---

## 6. Security Implementation

| Layer | Implementation | Status |
|-------|---------------|--------|
| CSP | Helmet.js strict Content-Security-Policy | COMPLETE |
| CORS | Explicit origin whitelist (5 domains) | COMPLETE |
| Rate Limiting | General 1000/15min, Checkout 10/min, Delete 3/min | COMPLETE |
| CSRF | crypto.timingSafeEqual token verification | COMPLETE |
| Webhook Auth | Stripe signature verification | COMPLETE |
| reCAPTCHA | Enterprise API token validation | COMPLETE |
| Input Validation | Zod schemas on 14 critical POST endpoints (`apiValidation.ts`) | COMPLETE |
| File Upload | MIME whitelist, 5MB limit, ClamAV scanning | COMPLETE |
| HSTS | 1 year, preload, subdomains (production only) | COMPLETE |
| Auth | Firebase ID token + custom claims | COMPLETE |
| Secrets | Google Cloud Secret Manager (defineSecret) | COMPLETE |

---

## 7. Tier 3.5 Additions (Apr 6-14)

### 7.1 Structured Logging (Phase 1)
- **Pino structured logging** replaced 91+ `console.log`/`error`/`warn` calls across `server.ts` and 6 route modules
- All 19 empty catch blocks in server routes fixed with proper error logging
- JSON log format with request ID, latency, and error context

### 7.2 API Versioning & Documentation (Phase 2)
- **API versioning:** `/api/v1` prefix on all 120+ frontend API calls via `API_BASE` constant
- **OpenAPI 3.1 specification:** `docs/openapi.yaml` covering all 33 endpoints, 9 schemas, 7 tag groups
- **Formal SLA documentation:** `docs/SLA.md` with 99.9% uptime commitment, P1-P4 severity levels, service credits
- **Enhanced health endpoint:** `/api/health` checks Firestore + Stripe with component-level latency; `/_status` public endpoint added

### 7.3 SSO (Phase 4)
- **Server routes:** `src/server/routes/sso.ts` with 5 endpoints (CRUD providers + domain lookup)
- Firebase SAML/OIDC `signInWithPopup` integration
- Admin SSO provider management tab

### 7.4 Content Moderation (Apr 8)
- Google Cloud Vision SafeSearch integration for uploaded images
- Automatic rejection of explicit/violent content
- Email notification to user on moderation action

### 7.5 Managed Roles (Apr 8)
- Managed Roles tab for dealers
- Role-changed and account-removed email templates

### 7.6 Testing (Phase 3)
- 36 new test cases: `adminRoutes.test.ts` (16), `managedRolesRoutes.test.ts` (20)
- Total: 51 test files, 619 tests, all passing
- TypeScript: zero `tsc` errors

---

## 8. What's Remaining

| Item | Priority | Effort | Notes |
|------|----------|--------|-------|
| ~~SSRF protection for dealer feed URLs~~ | ~~HIGH~~ | ~~2 hrs~~ | COMPLETE — `validateDealerFeedUrl()` already in functions/index.js (blocks private IPs, IPv6, cloud metadata) |
| ~~Permissions-Policy header~~ | ~~MEDIUM~~ | ~~30 min~~ | COMPLETE — Added to Helmet config in server.ts (camera, microphone, geolocation, payment, usb restricted) |
| ~~OpenAPI/Swagger documentation~~ | ~~LOW~~ | ~~4 hrs~~ | COMPLETE — `docs/openapi.yaml` (OpenAPI 3.1): 33 endpoints, 9 schemas, 7 tag groups |
| ~~WebSocket for live auction bidding~~ | ~~LOW~~ | ~~8 hrs~~ | COMPLETE — Socket.IO server (`auctionSocketServer.ts`), per-lot timer manager (`auctionTimerManager.ts`), emit on bid/close/extend/activate, server time sync, presence tracking |
| Search indexing (Algolia/Elasticsearch) | LOW | 16 hrs | Currently Firestore query only |
| Multi-region failover | LOW | 8 hrs | Currently us-central1 only |
| Load testing & benchmarks | LOW | 4 hrs | No documented capacity limits |

---

## Quantitative Summary

| Metric | Value |
|--------|-------|
| REST API Endpoints | 90+ |
| Cloud Function Triggers | 23 |
| Scheduled Jobs | 9 |
| Email Templates | 37 |
| Third-Party Integrations | 12 |
| Lines of Code (functions/index.js) | 17,723 |
| Lines of Code (server.ts) | ~4,750 |
| WebSocket Events | 6 (bid_placed, lot_extended, lot_closed, presence_update, time_sync, server_time_tick) |
| Functions Dependencies | 15 |
| Dual-Write Triggers | 20 |
| Data Connect Connectors | 6 |
| PostgreSQL Tables | 23 |
| Test Files | 51 |
| Tests Passing | 619 |
| TypeScript Errors | 0 |
| Empty Catch Blocks | 0 (all fixed) |
| OpenAPI Endpoints Documented | 33 |

**Backend Completion: 99%** — All core features are production-ready. SSO, managed roles, content moderation, structured logging, API versioning, and OpenAPI docs all complete. The remaining items are enhancements, not blockers.
