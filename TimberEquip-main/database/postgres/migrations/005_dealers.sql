-- ============================================================================
-- Phase 5: Dealer System
-- Migration: 005_dealers.sql
-- Date: 2026-04-05
-- Description: Dealer feed profiles, external listing mapping, ingest logs,
--              audit logs, webhook subscriptions, and widget configs.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Dealer Feed Profiles
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_feed_profiles (
  id                             TEXT PRIMARY KEY,
  seller_uid                     TEXT NOT NULL,
  dealer_name                    TEXT,
  dealer_email                   TEXT,
  source_name                    TEXT DEFAULT 'Dealer Feed',
  source_type                    TEXT,
  raw_input                      TEXT,
  feed_url                       TEXT,
  api_endpoint                   TEXT,
  status                         TEXT DEFAULT 'active',
  sync_mode                      TEXT DEFAULT 'pull',
  sync_frequency                 TEXT DEFAULT 'manual',
  nightly_sync_enabled           BOOLEAN DEFAULT FALSE,
  auto_publish                   BOOLEAN DEFAULT FALSE,
  field_mapping                  JSONB DEFAULT '[]',
  api_key_preview                TEXT,
  total_listings_synced          INTEGER DEFAULT 0,
  total_listings_active          INTEGER DEFAULT 0,
  total_listings_created         INTEGER DEFAULT 0,
  total_listings_updated         INTEGER DEFAULT 0,
  total_listings_deleted         INTEGER DEFAULT 0,
  last_sync_at                   TIMESTAMPTZ,
  next_sync_at                   TIMESTAMPTZ,
  last_sync_status               TEXT,
  last_sync_message              TEXT,
  last_resolved_type             TEXT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_feed_status
    CHECK (status IN ('active','paused','disabled')),
  CONSTRAINT chk_feed_source_type
    CHECK (source_type IS NULL OR source_type IN ('auto','json','xml','csv')),
  CONSTRAINT chk_feed_sync_mode
    CHECK (sync_mode IN ('pull','push','manual')),
  CONSTRAINT chk_feed_sync_freq
    CHECK (sync_frequency IN ('hourly','daily','weekly','manual'))
);

CREATE INDEX IF NOT EXISTS idx_feed_seller
  ON dealer_feed_profiles (seller_uid);
CREATE INDEX IF NOT EXISTS idx_feed_status
  ON dealer_feed_profiles (status);

CREATE TRIGGER trg_feed_profiles_updated_at
  BEFORE UPDATE ON dealer_feed_profiles
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 2. Dealer Listings (external item → listing mapping)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_listings (
  id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  dealer_feed_id                 TEXT NOT NULL REFERENCES dealer_feed_profiles(id) ON DELETE CASCADE,
  seller_uid                     TEXT NOT NULL,
  external_listing_id            TEXT NOT NULL,
  timberequip_listing_id         TEXT,                             -- FK to listings.legacy_firestore_id
  equipment_hash                 TEXT,
  status                         TEXT DEFAULT 'active',
  dealer_source_url              TEXT,
  data_source                    TEXT DEFAULT 'dealer',
  external_data                  JSONB DEFAULT '{}',
  mapped_data                    JSONB DEFAULT '{}',
  synced_at                      TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_feed_external_id UNIQUE (dealer_feed_id, external_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_dealer_listings_feed
  ON dealer_listings (dealer_feed_id);
CREATE INDEX IF NOT EXISTS idx_dealer_listings_seller
  ON dealer_listings (seller_uid);
CREATE INDEX IF NOT EXISTS idx_dealer_listings_te_id
  ON dealer_listings (timberequip_listing_id) WHERE timberequip_listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dealer_listings_hash
  ON dealer_listings (equipment_hash) WHERE equipment_hash IS NOT NULL;

CREATE TRIGGER trg_dealer_listings_updated_at
  BEFORE UPDATE ON dealer_listings
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 3. Dealer Feed Ingest Logs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_feed_ingest_logs (
  id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  feed_id                        TEXT REFERENCES dealer_feed_profiles(id),
  seller_uid                     TEXT NOT NULL,
  actor_uid                      TEXT,
  actor_role                     TEXT,
  source_name                    TEXT,
  total_received                 INTEGER DEFAULT 0,
  processed                      INTEGER DEFAULT 0,
  created                        INTEGER DEFAULT 0,
  updated                        INTEGER DEFAULT 0,
  upserted                       INTEGER DEFAULT 0,
  skipped                        INTEGER DEFAULT 0,
  archived                       INTEGER DEFAULT 0,
  error_count                    INTEGER DEFAULT 0,
  errors                         JSONB DEFAULT '[]',
  dry_run                        BOOLEAN DEFAULT FALSE,
  sync_context                   JSONB DEFAULT '{}',
  processed_at                   TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingest_logs_feed
  ON dealer_feed_ingest_logs (feed_id);
CREATE INDEX IF NOT EXISTS idx_ingest_logs_seller
  ON dealer_feed_ingest_logs (seller_uid, created_at DESC);

-- --------------------------------------------------------------------------
-- 4. Dealer Audit Logs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_audit_logs (
  id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  dealer_feed_id                 TEXT REFERENCES dealer_feed_profiles(id),
  seller_uid                     TEXT NOT NULL,
  action                         TEXT NOT NULL,
  details                        TEXT,
  error_message                  TEXT,
  items_processed                INTEGER,
  items_succeeded                INTEGER,
  items_failed                   INTEGER,
  metadata                       JSONB DEFAULT '{}',
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealer_audit_feed
  ON dealer_audit_logs (dealer_feed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dealer_audit_seller
  ON dealer_audit_logs (seller_uid, created_at DESC);

-- --------------------------------------------------------------------------
-- 5. Dealer Webhook Subscriptions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_webhook_subscriptions (
  id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  dealer_uid                     TEXT NOT NULL,
  callback_url                   TEXT NOT NULL,
  events                         JSONB DEFAULT '[]',
  active                         BOOLEAN DEFAULT TRUE,
  secret_masked                  TEXT,
  failure_count                  INTEGER DEFAULT 0,
  last_delivery_at               TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_dealer
  ON dealer_webhook_subscriptions (dealer_uid);

-- --------------------------------------------------------------------------
-- 6. Dealer Widget Configs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_widget_configs (
  id                             TEXT PRIMARY KEY,                 -- dealer/seller UID
  card_style                     TEXT DEFAULT 'fes-native',
  accent_color                   TEXT DEFAULT '#000000',
  font_family                    TEXT,
  dark_mode                      BOOLEAN DEFAULT FALSE,
  show_inquiry                   BOOLEAN DEFAULT TRUE,
  show_call                      BOOLEAN DEFAULT TRUE,
  show_details                   BOOLEAN DEFAULT TRUE,
  page_size                      INTEGER DEFAULT 12,
  custom_css                     TEXT,
  updated_at                     TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
