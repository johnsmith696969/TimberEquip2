# Listing Governance Firestore Mapping

This document maps the current Forestry Equipment Sales listing model into the Phase 1 PostgreSQL governance model.

## Source References

- App listing shape: `src/types.ts`
- Seller create and edit flow: `src/services/equipmentService.ts`
- Public visibility filters: `functions/public-pages.js`
- SEO read model visibility filters: `functions/public-seo-read-model.js`
- Dealer feed ingestion writes: `functions/index.js`

## Goals

- preserve the current production listing behavior during dual-write
- normalize listing governance into one canonical lifecycle model
- make transition history, anomaly detection, and public visibility auditable

## Firestore Source Of Truth Today

The current Firestore `listings` documents rely on a combination of fields rather than one canonical state field.

Primary lifecycle-related fields in the live app:

- `status`
- `approvalStatus`
- `paymentStatus`
- `publishedAt`
- `expiresAt`
- `soldAt`

Public listing visibility is currently inferred from:

- `approvalStatus == "approved"`
- `paymentStatus == "paid"`
- listing not expired

The current app type also carries supporting marketplace fields such as:

- `sellerUid`
- `title`
- `category`
- `subcategory`
- `make`
- `model`
- `location`
- `price`
- `currency`
- `images`
- `stockNumber`
- `serialNumber`
- `specs`
- `externalSource`

## Phase 1 PostgreSQL Targets

Canonical governance tables:

- `listings`
- `listing_versions`
- `listing_state_transitions`
- `listing_anomalies`
- `listing_visibility_snapshots`
- `listing_media_audits`

Canonical authority rules:

- `lifecycle_state` becomes the governance source of truth
- `review_state`, `payment_state`, `inventory_state`, and `visibility_state` become normalized supporting facts
- all state changes must be written through a server-owned transition action

## Field Mapping

| Firestore field | Phase 1 target | Notes |
| --- | --- | --- |
| `id` | `listings.legacy_firestore_id` | Keep the Firestore id during migration so reverse lookup stays easy. |
| `sellerUid` or `sellerId` | `listings.seller_party_id` | Normalize to one seller or dealer party id. |
| `title` | `listings.title` | Required non-empty title. |
| `category` | `listings.category_key` | Slugify if Firestore values are display labels. |
| `subcategory` | `listings.subcategory_key` | Optional. |
| `make` or `manufacturer` or `brand` | `listings.manufacturer_key` | Normalize to SEO manufacturer slug. |
| `model` | `listings.model_key` | Normalize to SEO model slug. |
| `location` | `listings.location_text` | Keep display text in Phase 1. Structured geo tables come later. |
| `price` | `listings.price_amount` | Numeric currency value. |
| `currency` | `listings.currency_code` | Default `USD` when missing. |
| `images[0]` | `listings.primary_image_url` | First image becomes the primary preview asset. |
| `publishedAt` | `listings.published_at` | Timestamp. |
| `expiresAt` | `listings.expires_at` | Timestamp. |
| `soldAt` | `listings.sold_at` | Timestamp. |
| `externalSource.sourceName` | `listings.external_source_name` | Used for dealer feed lineage and dedupe. |
| `externalSource.externalId` | `listings.external_source_id` | Part of unique external key. |
| Full Firestore document | `listings.metadata_json` | Keep raw compatibility payload until later decomposition. |
| Full Firestore document snapshot | `listing_versions.snapshot_json` | Written whenever a lifecycle mutation saves a new version. |

## Legacy Status Mapping

This is the minimum mapping required to shadow existing Firestore behavior without surprises.

| Firestore combination | Phase 1 canonical state | Supporting state writes |
| --- | --- | --- |
| `approvalStatus = pending`, `status = pending` | `submitted` | `review_state = pending`, `inventory_state = draft`, `visibility_state = private` |
| `approvalStatus = approved`, `paymentStatus = pending` | `approved_unpaid` | `review_state = approved`, `payment_state = pending`, `visibility_state = private` |
| `approvalStatus = approved`, `paymentStatus = paid`, `status = active` | `live` | `review_state = approved`, `payment_state = paid`, `inventory_state = active`, `visibility_state = public_live` |
| `status = sold` | `sold` | `inventory_state = sold`, `visibility_state = public_sold`, `sold_at` required |
| `approvalStatus = rejected` | `rejected` | `review_state = rejected`, `visibility_state = private` |
| `status = active`, `expiresAt < now()` | `expired` | `inventory_state = expired`, `visibility_state = private` |
| archived or soft-removed records | `archived` | `inventory_state = archived`, `visibility_state = archived` |

## Derived Visibility Rules

Phase 1 public visibility should be derived from normalized state, not from ad hoc client logic.

`visibility_state = public_live` requires:

- `lifecycle_state = live`
- `review_state = approved`
- `payment_state in ("paid", "waived")`
- `inventory_state = active`
- `published_at` is present

`visibility_state = public_sold` requires:

- `lifecycle_state = sold`
- `review_state = approved`
- `payment_state in ("paid", "waived")`
- `inventory_state = sold`
- `sold_at` is present

Everything else remains non-public until a later lifecycle action changes it.

## Transition Log Mapping

Each server-owned action writes one append-only record to `listing_state_transitions`.

Minimum fields per transition:

- `listing_id`
- `transition_action`
- `previous_state`
- `next_state`
- `previous_review_state`
- `next_review_state`
- `previous_payment_state`
- `next_payment_state`
- `previous_inventory_state`
- `next_inventory_state`
- `previous_visibility_state`
- `next_visibility_state`
- `actor_type`
- `actor_id`
- `request_id`
- `reason_code`
- `reason_note`
- `source_system`
- `metadata_json`
- `occurred_at`

Recommended source ownership:

- seller submit and relist actions: app or seller workflow service
- admin approval and rejection: admin moderation service
- payment confirmation: billing webhook worker
- publish, expire, and anomaly scans: Cloud Run lifecycle workers

## Versioning Rules

Write a `listing_versions` row when:

- a lifecycle mutation changes canonical state
- a seller edit changes a public listing payload
- a dealer feed import materially changes a canonical listing

Initial versioning strategy:

- `version_number = 1` on first Postgres mirror write
- increment by 1 for each lifecycle or material payload write
- snapshot the normalized payload that the mutation actually committed

## Anomaly Seed Rules

Phase 1 should create `listing_anomalies` rows when current Firestore behavior or migration data violates canonical rules.

Seed these anomaly detections first:

- `live_without_paid_payment`
- `live_without_approved_review`
- `expired_but_public`
- `sold_without_sold_at`
- `approved_unpaid_with_published_at`
- `missing_primary_image`
- `missing_seller_reference`
- `missing_location`
- `duplicate_external_source_key`
- `orphan_transition_record`

## Dual-Write Sequence

Recommended Phase 1 migration order:

1. Keep Firestore as the serving write path.
2. Add shadow Postgres writes for create, submit, approve, reject, pay, publish, expire, relist, sold, and archive flows.
3. Compare Postgres `visibility_state` with current Firestore public visibility behavior.
4. Log mismatches as anomalies before changing any public read path.
5. Cut the public read model over only after transition parity is verified.

## Open Questions For Phase 1

- Should `seller_party_id` point directly to current user uid, dealer uid, or a new party table id?
- Which current flows are allowed to relist sold inventory without re-review?
- Should sold inventory remain publicly indexable forever or age into archived after a retention window?
- Which edits count as material enough to require a new `listing_versions` snapshot?
