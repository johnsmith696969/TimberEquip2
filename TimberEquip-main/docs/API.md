# TimberEquip API Reference

> Internal API documentation for the Forestry Equipment Sales platform.
> All endpoints are served from the Express.js server on Cloud Run.

## Authentication

Most endpoints require a Firebase ID token passed as a Bearer token:

```
Authorization: Bearer <firebase-id-token>
```

Tokens are verified server-side with `checkRevoked: true` on all 31 `verifyIdToken` calls.

---

## Admin Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/users/create-managed-account` | Admin/Dealer | Create a managed sub-account with role assignment |
| POST | `/api/admin/users/:userId/verify` | Admin | Manually verify a user and their listings |
| POST | `/api/admin/users/:userId/unverify` | Admin | Revoke manual verification |
| POST | `/api/admin/dealer-feeds/ingest` | Admin | Bulk ingest listings from dealer XML/JSON feeds (max 1000/request) |
| GET | `/api/admin/bootstrap` | Admin | Dashboard data: users, inquiries, calls, overview stats |
| GET | `/api/admin/billing/invoices` | Admin | All billing invoices |
| GET | `/api/admin/billing/subscriptions` | Admin | Active subscriptions |
| GET | `/api/admin/billing/audit-logs` | Admin | Recent billing audit logs (limit 50) |
| GET | `/api/admin/content/blog-posts` | Content roles | Blog posts for CMS |
| GET | `/api/admin/content/bootstrap` | Content roles | Content studio data (posts, media, blocks) |

## Auction Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auctions/place-bid` | Yes | Place a bid; supports auto-bid via `maxBid` |
| POST | `/api/auctions/retract-bid` | Yes | Retract a previously placed bid |
| GET | `/api/auctions/:auctionId/lots/:lotId/bids` | No | Public bid history (bidder IDs anonymized) |
| POST | `/api/auctions/close-lot` | Admin | Manually close and finalize an auction lot |
| POST | `/api/auctions/close-expired-lots` | Admin | Batch-close all expired lots |
| POST | `/api/auctions/activate` | Admin | Transition auction preview to active |
| POST | `/api/auctions/create-preauth-hold` | Yes | Stripe $250 pre-auth hold for bidder verification |
| POST | `/api/auctions/confirm-preauth` | Yes | Confirm pre-auth hold is active |
| POST | `/api/auctions/create-identity-session` | Yes | Stripe Identity verification (document + selfie) |
| POST | `/api/auctions/process-seller-payout` | Admin | Process seller payout via Stripe transfer |

## Billing Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing/webhook` | Stripe signature | Stripe webhook handler (invoice.paid, subscriptions) |
| POST | `/api/billing/create-checkout-session` | Yes | Create Stripe checkout for listing subscription |
| GET | `/api/billing/checkout-session/:sessionId` | Yes | Retrieve checkout session status |
| POST | `/api/billing/create-portal-session` | Yes | Stripe billing portal for self-service management |
| POST | `/api/billing/cancel-subscription` | Yes | Cancel subscription at period end |
| POST | `/api/billing/create-account-checkout-session` | Yes | Dealer account upgrade checkout |
| POST | `/api/billing/refresh-account-access` | Yes | Refresh access tier from active billing plan |

## Public Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/marketplace-stats` | No | Marketplace statistics (cached 10 min) |
| GET | `/api/public/sellers/:identity` | No | Public seller profile by UID or storefront slug (cached 5 min) |
| GET | `/api/public/dealers` | No | Active dealer directory (cached 5 min) |
| GET | `/api/public/news` | No | Public news feed (cached 5 min) |
| GET | `/api/public/news/:id` | No | Single news article (cached 5 min) |
| POST | `/api/recaptcha-assess` | No | reCAPTCHA v3 Enterprise validation (30 req/min) |

## User Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/user/delete` | Yes | Permanently delete account and all associated data |
| POST | `/api/upload` | Yes | Upload file with virus scan + AI content moderation |

## Managed Roles Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/managed-roles` | Yes | List team members under a dealer (max 50) |
| PATCH | `/api/managed-roles/:uid/role` | Owner/Admin | Update team member role |
| POST | `/api/managed-roles/:uid/lock` | Owner/Admin | Lock a team member account |
| POST | `/api/managed-roles/:uid/unlock` | Owner/Admin | Unlock a team member account |
| DELETE | `/api/managed-roles/:uid` | Owner/Admin | Remove a team member (soft-delete) |
| POST | `/api/managed-roles/:uid/reset-password` | Owner/Admin | Send password reset email |

---

## Response Format

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 25 }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Display name and email are required."
  }
}
```

---

## Role Hierarchy

| Role | Managed Account Access | DealerOS Access | Admin Access |
|------|----------------------|-----------------|-------------|
| `super_admin` | All accounts | Yes | Full |
| `admin` | All accounts | Yes | Full |
| `developer` | All accounts | Yes | Full |
| `pro_dealer` | Own sub-accounts (limit 3) | Yes | No |
| `dealer` | Own sub-accounts (limit 3) | Yes | No |
| `dealer_manager` | Sibling sub-accounts | Yes | No |
| `dealer_staff` | Own listings only | Yes | No |
| `individual_seller` | None | No | No |
| `member` | None | No | No |

---

## Rate Limits

- Global: 200 requests per 15-minute window per IP
- reCAPTCHA assessment: 30 requests per minute
- Auction bidding: Rate-limited per user

## Content Moderation

Image uploads are automatically scanned using Google Cloud Vision SafeSearch API:
- **LIKELY or VERY_LIKELY** adult/violence content is blocked
- **VERY_LIKELY** racy content is blocked
- Blocked images are deleted and the listing is flagged for admin review
- Moderation runs at both upload time (server) and image processing (Cloud Function)
