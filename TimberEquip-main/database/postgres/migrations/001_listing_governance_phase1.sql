-- Forestry Equipment Sales Phase 1 listing governance schema
-- Establishes the first canonical PostgreSQL tables for listing lifecycle
-- governance, transition auditing, anomaly detection, and visibility history.
--
-- Design note:
-- Phase 1 uses constrained text columns instead of PostgreSQL enum types so the
-- Data Connect contract, JSON transition matrix, and future migrations can all
-- share the same lowercase state vocabulary without enum-alter friction.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_row_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_firestore_id text UNIQUE,
  seller_party_id text NOT NULL,
  title text NOT NULL,
  category_key text NOT NULL,
  subcategory_key text,
  manufacturer_key text,
  model_key text,
  location_text text,
  price_amount numeric(14, 2),
  currency_code text NOT NULL DEFAULT 'USD',
  lifecycle_state text NOT NULL DEFAULT 'draft',
  review_state text NOT NULL DEFAULT 'pending',
  payment_state text NOT NULL DEFAULT 'pending',
  inventory_state text NOT NULL DEFAULT 'draft',
  visibility_state text NOT NULL DEFAULT 'private',
  primary_image_url text,
  published_at timestamptz,
  expires_at timestamptz,
  sold_at timestamptz,
  source_system text NOT NULL DEFAULT 'firestore',
  external_source_name text,
  external_source_id text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_listings_title_nonempty
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT chk_listings_seller_party_nonempty
    CHECK (length(btrim(seller_party_id)) > 0),
  CONSTRAINT chk_listings_category_nonempty
    CHECK (length(btrim(category_key)) > 0),
  CONSTRAINT chk_listings_price_nonnegative
    CHECK (price_amount IS NULL OR price_amount >= 0),
  CONSTRAINT chk_listings_lifecycle_state
    CHECK (lifecycle_state IN ('draft', 'submitted', 'approved_unpaid', 'live', 'expired', 'sold', 'rejected', 'archived')),
  CONSTRAINT chk_listings_review_state
    CHECK (review_state IN ('pending', 'approved', 'rejected')),
  CONSTRAINT chk_listings_payment_state
    CHECK (payment_state IN ('pending', 'paid', 'failed', 'waived', 'refunded')),
  CONSTRAINT chk_listings_inventory_state
    CHECK (inventory_state IN ('draft', 'active', 'expired', 'sold', 'archived')),
  CONSTRAINT chk_listings_visibility_state
    CHECK (visibility_state IN ('private', 'public_live', 'public_sold', 'archived')),
  CONSTRAINT chk_listings_external_source_pair
    CHECK (
      (external_source_name IS NULL AND external_source_id IS NULL) OR
      (external_source_name IS NOT NULL AND external_source_id IS NOT NULL)
    ),
  CONSTRAINT chk_listings_live_requires_published_at
    CHECK (lifecycle_state <> 'live' OR published_at IS NOT NULL),
  CONSTRAINT chk_listings_sold_requires_sold_at
    CHECK (lifecycle_state <> 'sold' OR sold_at IS NOT NULL),
  CONSTRAINT chk_listings_expiration_window
    CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at >= published_at),
  CONSTRAINT chk_listings_visibility_consistency
    CHECK (
      (visibility_state = 'private' AND lifecycle_state IN ('draft', 'submitted', 'approved_unpaid', 'expired', 'rejected')) OR
      (visibility_state = 'public_live' AND lifecycle_state = 'live' AND review_state = 'approved' AND payment_state IN ('paid', 'waived') AND inventory_state = 'active') OR
      (visibility_state = 'public_sold' AND lifecycle_state = 'sold' AND review_state = 'approved' AND payment_state IN ('paid', 'waived') AND inventory_state = 'sold') OR
      (visibility_state = 'archived' AND lifecycle_state = 'archived' AND inventory_state = 'archived')
    )
);

DROP TRIGGER IF EXISTS trg_listings_set_updated_at ON listings;
CREATE TRIGGER trg_listings_set_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();

CREATE TABLE IF NOT EXISTS listing_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  version_reason text,
  captured_by text NOT NULL DEFAULT 'system',
  snapshot_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_listing_versions_version_positive
    CHECK (version_number > 0),
  UNIQUE (listing_id, version_number)
);

CREATE TABLE IF NOT EXISTS listing_state_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  transition_action text NOT NULL,
  previous_state text,
  next_state text NOT NULL,
  previous_review_state text,
  next_review_state text,
  previous_payment_state text,
  next_payment_state text,
  previous_inventory_state text,
  next_inventory_state text,
  previous_visibility_state text,
  next_visibility_state text,
  reason_code text,
  reason_note text,
  actor_type text NOT NULL DEFAULT 'system',
  actor_id text,
  request_id text,
  source_system text NOT NULL DEFAULT 'application',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_listing_state_transitions_action
    CHECK (transition_action IN ('submit_listing', 'approve_listing', 'reject_listing', 'confirm_payment', 'publish_listing', 'expire_listing', 'relist_listing', 'mark_listing_sold', 'archive_listing')),
  CONSTRAINT chk_listing_state_transitions_actor_type
    CHECK (actor_type IN ('system', 'seller', 'dealer', 'admin', 'billing_webhook', 'migration_worker', 'operator')),
  CONSTRAINT chk_listing_state_transitions_previous_state
    CHECK (previous_state IS NULL OR previous_state IN ('draft', 'submitted', 'approved_unpaid', 'live', 'expired', 'sold', 'rejected', 'archived')),
  CONSTRAINT chk_listing_state_transitions_next_state
    CHECK (next_state IN ('draft', 'submitted', 'approved_unpaid', 'live', 'expired', 'sold', 'rejected', 'archived')),
  CONSTRAINT chk_listing_state_transitions_previous_review_state
    CHECK (previous_review_state IS NULL OR previous_review_state IN ('pending', 'approved', 'rejected')),
  CONSTRAINT chk_listing_state_transitions_next_review_state
    CHECK (next_review_state IS NULL OR next_review_state IN ('pending', 'approved', 'rejected')),
  CONSTRAINT chk_listing_state_transitions_previous_payment_state
    CHECK (previous_payment_state IS NULL OR previous_payment_state IN ('pending', 'paid', 'failed', 'waived', 'refunded')),
  CONSTRAINT chk_listing_state_transitions_next_payment_state
    CHECK (next_payment_state IS NULL OR next_payment_state IN ('pending', 'paid', 'failed', 'waived', 'refunded')),
  CONSTRAINT chk_listing_state_transitions_previous_inventory_state
    CHECK (previous_inventory_state IS NULL OR previous_inventory_state IN ('draft', 'active', 'expired', 'sold', 'archived')),
  CONSTRAINT chk_listing_state_transitions_next_inventory_state
    CHECK (next_inventory_state IS NULL OR next_inventory_state IN ('draft', 'active', 'expired', 'sold', 'archived')),
  CONSTRAINT chk_listing_state_transitions_previous_visibility_state
    CHECK (previous_visibility_state IS NULL OR previous_visibility_state IN ('private', 'public_live', 'public_sold', 'archived')),
  CONSTRAINT chk_listing_state_transitions_next_visibility_state
    CHECK (next_visibility_state IS NULL OR next_visibility_state IN ('private', 'public_live', 'public_sold', 'archived'))
);

CREATE TABLE IF NOT EXISTS listing_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  anomaly_code text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  detected_by text NOT NULL DEFAULT 'system',
  owner_id text,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_note text,
  CONSTRAINT chk_listing_anomalies_severity
    CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT chk_listing_anomalies_status
    CHECK (status IN ('open', 'resolved', 'suppressed')),
  CONSTRAINT chk_listing_anomalies_resolution_note
    CHECK (status = 'open' OR resolution_note IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS listing_visibility_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lifecycle_state text NOT NULL,
  review_state text NOT NULL,
  payment_state text NOT NULL,
  inventory_state text NOT NULL,
  visibility_state text NOT NULL,
  is_public boolean NOT NULL,
  snapshot_reason text,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_listing_visibility_snapshots_lifecycle_state
    CHECK (lifecycle_state IN ('draft', 'submitted', 'approved_unpaid', 'live', 'expired', 'sold', 'rejected', 'archived')),
  CONSTRAINT chk_listing_visibility_snapshots_review_state
    CHECK (review_state IN ('pending', 'approved', 'rejected')),
  CONSTRAINT chk_listing_visibility_snapshots_payment_state
    CHECK (payment_state IN ('pending', 'paid', 'failed', 'waived', 'refunded')),
  CONSTRAINT chk_listing_visibility_snapshots_inventory_state
    CHECK (inventory_state IN ('draft', 'active', 'expired', 'sold', 'archived')),
  CONSTRAINT chk_listing_visibility_snapshots_visibility_state
    CHECK (visibility_state IN ('private', 'public_live', 'public_sold', 'archived')),
  CONSTRAINT chk_listing_visibility_snapshots_is_public
    CHECK (is_public = (visibility_state IN ('public_live', 'public_sold')))
);

CREATE TABLE IF NOT EXISTS listing_media_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_status text NOT NULL,
  primary_image_present boolean NOT NULL DEFAULT false,
  image_count integer NOT NULL DEFAULT 0,
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_system text NOT NULL DEFAULT 'application',
  audited_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_listing_media_audits_image_count
    CHECK (image_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_listings_seller_party_id
  ON listings (seller_party_id);
CREATE INDEX IF NOT EXISTS idx_listings_lifecycle_state
  ON listings (lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_listings_visibility_state
  ON listings (visibility_state);
CREATE INDEX IF NOT EXISTS idx_listings_expires_at
  ON listings (expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_governance_queue
  ON listings (lifecycle_state, review_state, payment_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_public_visibility
  ON listings (visibility_state, updated_at DESC)
  WHERE visibility_state IN ('public_live', 'public_sold');
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_external_source_unique
  ON listings (external_source_name, external_source_id)
  WHERE external_source_name IS NOT NULL AND external_source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listing_state_transitions_listing_id_occurred_at
  ON listing_state_transitions (listing_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_state_transitions_action_occurred_at
  ON listing_state_transitions (transition_action, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_anomalies_open_by_listing
  ON listing_anomalies (listing_id, status, severity, detected_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_anomalies_open_code
  ON listing_anomalies (listing_id, anomaly_code)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_listing_visibility_snapshots_listing_id_captured_at
  ON listing_visibility_snapshots (listing_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_media_audits_listing_id_audited_at
  ON listing_media_audits (listing_id, audited_at DESC);
