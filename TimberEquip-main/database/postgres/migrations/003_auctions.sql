-- ============================================================================
-- Phase 3: Auction Platform
-- Migration: 003_auctions.sql
-- Date: 2026-04-05
-- Description: Flattens nested Firestore auction subcollections into
--              relational PostgreSQL tables: auctions, auction_lots,
--              auction_bids, auction_invoices, and bidder_profiles.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Auctions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auctions (
  id                             TEXT PRIMARY KEY,                 -- Firestore doc ID
  title                          TEXT NOT NULL,
  slug                           TEXT UNIQUE NOT NULL,
  description                    TEXT,
  cover_image_url                TEXT,
  start_time                     TIMESTAMPTZ NOT NULL,
  end_time                       TIMESTAMPTZ NOT NULL,
  preview_start_time             TIMESTAMPTZ,
  status                         TEXT NOT NULL DEFAULT 'draft',
  lot_count                      INTEGER DEFAULT 0,
  total_bids                     INTEGER DEFAULT 0,
  total_gmv                      NUMERIC(14,2) DEFAULT 0,
  default_buyer_premium_percent  NUMERIC(5,2) DEFAULT 10.00,
  soft_close_threshold_min       INTEGER DEFAULT 5,
  soft_close_extension_min       INTEGER DEFAULT 3,
  stagger_interval_min           INTEGER DEFAULT 1,
  default_payment_deadline_days  INTEGER DEFAULT 7,
  default_removal_deadline_days  INTEGER DEFAULT 14,
  terms_and_conditions_url       TEXT,
  featured                       BOOLEAN DEFAULT FALSE,
  banner_enabled                 BOOLEAN DEFAULT FALSE,
  banner_image_url               TEXT,
  created_by                     TEXT NOT NULL,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_auctions_title_nonempty
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT chk_auctions_slug_nonempty
    CHECK (length(btrim(slug)) > 0),
  CONSTRAINT chk_auctions_status
    CHECK (status IN ('draft','preview','active','closed','settling','settled','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_auctions_status_start
  ON auctions (status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_auctions_slug
  ON auctions (slug);

CREATE TRIGGER trg_auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 2. Auction Lots (flattened from auctions/{id}/lots subcollection)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_lots (
  id                             TEXT PRIMARY KEY,                 -- Firestore doc ID
  auction_id                     TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  listing_id                     TEXT,                             -- FK to listings.legacy_firestore_id
  lot_number                     TEXT NOT NULL,
  close_order                    INTEGER NOT NULL DEFAULT 0,
  starting_bid                   NUMERIC(12,2),
  reserve_price                  NUMERIC(12,2),
  reserve_met                    BOOLEAN DEFAULT FALSE,
  buyer_premium_percent          NUMERIC(5,2) DEFAULT 10.00,
  start_time                     TIMESTAMPTZ,
  end_time                       TIMESTAMPTZ,
  original_end_time              TIMESTAMPTZ,
  soft_close_threshold_min       INTEGER DEFAULT 5,
  soft_close_extension_min       INTEGER DEFAULT 3,
  soft_close_group_id            TEXT,
  extension_count                INTEGER DEFAULT 0,
  current_bid                    NUMERIC(12,2) DEFAULT 0,
  current_bidder_id              TEXT,
  current_bidder_anonymous_id    TEXT,
  bid_count                      INTEGER DEFAULT 0,
  unique_bidders                 INTEGER DEFAULT 0,
  last_bid_time                  TIMESTAMPTZ,
  status                         TEXT NOT NULL DEFAULT 'upcoming',
  promoted                       BOOLEAN DEFAULT FALSE,
  promoted_order                 INTEGER,
  winning_bidder_id              TEXT,
  winning_bid                    NUMERIC(12,2),
  watcher_count                  INTEGER DEFAULT 0,
  -- Denormalized listing fields for fast reads
  title                          TEXT,
  manufacturer                   TEXT,
  model                          TEXT,
  year                           INTEGER,
  thumbnail_url                  TEXT,
  pickup_location                TEXT,
  -- Lot-level terms
  payment_deadline_days          INTEGER DEFAULT 7,
  removal_deadline_days          INTEGER DEFAULT 14,
  storage_fee_per_day            NUMERIC(8,2) DEFAULT 0,
  is_titled_item                 BOOLEAN DEFAULT FALSE,
  title_document_fee             NUMERIC(8,2) DEFAULT 0,
  released_at                    TIMESTAMPTZ,
  released_by                    TEXT,
  release_authorized_at          TIMESTAMPTZ,
  release_authorized_by          TEXT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_auction_lot_number UNIQUE (auction_id, lot_number),
  CONSTRAINT chk_lots_status
    CHECK (status IN ('upcoming','preview','active','extended','closed','sold','unsold','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_lots_auction_id
  ON auction_lots (auction_id, close_order);
CREATE INDEX IF NOT EXISTS idx_lots_auction_status
  ON auction_lots (auction_id, status);
CREATE INDEX IF NOT EXISTS idx_lots_listing_id
  ON auction_lots (listing_id) WHERE listing_id IS NOT NULL;

CREATE TRIGGER trg_auction_lots_updated_at
  BEFORE UPDATE ON auction_lots
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 3. Auction Bids (flattened from auctions/{id}/lots/{id}/bids)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_bids (
  id                             TEXT PRIMARY KEY,
  auction_id                     TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  lot_id                         TEXT NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_id                      TEXT NOT NULL,
  bidder_anonymous_id            TEXT NOT NULL,
  amount                         NUMERIC(12,2) NOT NULL,
  max_bid                        NUMERIC(12,2),
  type                           TEXT NOT NULL DEFAULT 'manual',
  status                         TEXT NOT NULL DEFAULT 'active',
  triggered_extension            BOOLEAN DEFAULT FALSE,
  bid_time                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_bids_amount_positive
    CHECK (amount > 0),
  CONSTRAINT chk_bids_type
    CHECK (type IN ('manual','proxy','auto_increment')),
  CONSTRAINT chk_bids_status
    CHECK (status IN ('active','outbid','retracted','winning'))
);

CREATE INDEX IF NOT EXISTS idx_bids_auction_lot
  ON auction_bids (auction_id, lot_id, bid_time DESC);
CREATE INDEX IF NOT EXISTS idx_bids_bidder
  ON auction_bids (bidder_id, bid_time DESC);

-- --------------------------------------------------------------------------
-- 4. Auction Invoices (settlement records)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_invoices (
  id                             TEXT PRIMARY KEY,
  auction_id                     TEXT NOT NULL REFERENCES auctions(id),
  lot_id                         TEXT NOT NULL REFERENCES auction_lots(id),
  buyer_id                       TEXT NOT NULL,
  seller_id                      TEXT NOT NULL,
  hammer_price                   NUMERIC(12,2) NOT NULL,
  buyer_premium                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  documentation_fee              NUMERIC(8,2) DEFAULT 0,
  card_processing_fee            NUMERIC(8,2) DEFAULT 0,
  sales_tax_rate                 NUMERIC(6,5) DEFAULT 0,
  sales_tax_amount               NUMERIC(12,2) DEFAULT 0,
  sales_tax_state                TEXT,
  total_due                      NUMERIC(14,2) NOT NULL,
  currency                       TEXT DEFAULT 'usd',
  status                         TEXT NOT NULL DEFAULT 'pending',
  payment_method                 TEXT,
  stripe_invoice_id              TEXT,
  stripe_checkout_session_id     TEXT,
  stripe_payment_intent_id       TEXT,
  buyer_tax_exempt               BOOLEAN DEFAULT FALSE,
  buyer_tax_exempt_state         TEXT,
  buyer_tax_exempt_certificate_url TEXT,
  due_date                       TIMESTAMPTZ NOT NULL,
  paid_at                        TIMESTAMPTZ,
  wire_received_at               TIMESTAMPTZ,
  wire_received_by               TEXT,
  release_authorized_at          TIMESTAMPTZ,
  release_authorized_by          TEXT,
  seller_commission              NUMERIC(12,2),
  seller_payout                  NUMERIC(12,2),
  seller_payout_transfer_id      TEXT,
  seller_paid_at                 TIMESTAMPTZ,
  removal_confirmed_at           TIMESTAMPTZ,
  storage_fees_accrued           NUMERIC(10,2) DEFAULT 0,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_auction_inv_status
    CHECK (status IN ('pending','paid','overdue','cancelled','refunded')),
  CONSTRAINT chk_auction_inv_payment_method
    CHECK (payment_method IS NULL OR payment_method IN ('wire','ach','card','financing'))
);

CREATE INDEX IF NOT EXISTS idx_auction_inv_auction
  ON auction_invoices (auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_inv_buyer
  ON auction_invoices (buyer_id);
CREATE INDEX IF NOT EXISTS idx_auction_inv_seller
  ON auction_invoices (seller_id);
CREATE INDEX IF NOT EXISTS idx_auction_inv_status_due
  ON auction_invoices (status, due_date);

CREATE TRIGGER trg_auction_invoices_updated_at
  BEFORE UPDATE ON auction_invoices
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 5. Bidder Profiles
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bidder_profiles (
  id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                        TEXT UNIQUE NOT NULL,
  verification_tier              TEXT NOT NULL DEFAULT 'basic',
  full_name                      TEXT,
  phone                          TEXT,
  phone_verified                 BOOLEAN DEFAULT FALSE,
  address_street                 TEXT,
  address_city                   TEXT,
  address_state                  TEXT,
  address_zip                    TEXT,
  address_country                TEXT,
  company_name                   TEXT,
  stripe_customer_id             TEXT,
  id_verification_status         TEXT DEFAULT 'not_started',
  id_verified_at                 TIMESTAMPTZ,
  bidder_approved_at             TIMESTAMPTZ,
  bidder_approved_by             TEXT,
  total_auctions_participated    INTEGER DEFAULT 0,
  total_items_won                INTEGER DEFAULT 0,
  total_spent                    NUMERIC(14,2) DEFAULT 0,
  non_payment_count              INTEGER DEFAULT 0,
  tax_exempt                     BOOLEAN DEFAULT FALSE,
  tax_exempt_state               TEXT,
  tax_exempt_certificate_url     TEXT,
  default_payment_method_id      TEXT,
  default_payment_method_brand   TEXT,
  default_payment_method_last4   TEXT,
  terms_accepted_at              TIMESTAMPTZ,
  terms_version                  TEXT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_bidder_tier
    CHECK (verification_tier IN ('basic','verified','approved')),
  CONSTRAINT chk_bidder_id_status
    CHECK (id_verification_status IN ('not_started','pending','verified','failed'))
);

CREATE INDEX IF NOT EXISTS idx_bidder_user
  ON bidder_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_bidder_stripe
  ON bidder_profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TRIGGER trg_bidder_profiles_updated_at
  BEFORE UPDATE ON bidder_profiles
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

COMMIT;
