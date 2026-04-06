-- ============================================================================
-- Phase 2: Users, Storefronts & Billing
-- Migration: 002_users_billing.sql
-- Date: 2026-04-05
-- Description: Core user identity, dealer storefronts, subscriptions,
--              invoices, and seller program applications.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Users
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                    TEXT PRIMARY KEY,                  -- Firebase UID
  email                 TEXT UNIQUE NOT NULL,
  display_name          TEXT,
  phone_number          TEXT,
  bio                   TEXT,
  role                  TEXT NOT NULL DEFAULT 'member',    -- member, seller, dealer, pro_dealer, operator, admin
  email_verified        BOOLEAN DEFAULT FALSE,
  photo_url             TEXT,
  location              TEXT,                              -- Free-text "City, State"
  latitude              DECIMAL(10,7),
  longitude             DECIMAL(10,7),
  company               TEXT,
  business_name         TEXT,
  street1               TEXT,
  street2               TEXT,
  city                  TEXT,
  state                 TEXT,
  county                TEXT,
  postal_code           TEXT,
  country               TEXT,
  website               TEXT,
  account_status        TEXT DEFAULT 'active',             -- active, suspended, deleted
  parent_account_uid    TEXT REFERENCES users(id),
  account_access_source TEXT,
  mfa_enabled           BOOLEAN DEFAULT FALSE,
  mfa_method            TEXT,
  mfa_phone_number      TEXT,
  mfa_enrolled_at       TIMESTAMPTZ,
  favorites             JSONB DEFAULT '[]',                -- Array of listing IDs
  storefront_enabled    BOOLEAN DEFAULT FALSE,
  storefront_slug       TEXT,
  storefront_name       TEXT,
  storefront_tagline    TEXT,
  storefront_description TEXT,
  storefront_logo_url   TEXT,
  cover_photo_url       TEXT,
  seo_title             TEXT,
  seo_description       TEXT,
  seo_keywords          JSONB DEFAULT '[]',
  metadata_json         JSONB DEFAULT '{}',                -- Overflow fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2. Storefronts (denormalized read-model for public dealer pages)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS storefronts (
  id                          TEXT PRIMARY KEY,            -- Document ID (may match user ID)
  user_id                     TEXT NOT NULL REFERENCES users(id),
  storefront_enabled          BOOLEAN DEFAULT FALSE,
  storefront_slug             TEXT UNIQUE,
  canonical_path              TEXT,
  storefront_name             TEXT,
  storefront_tagline          TEXT,
  storefront_description      TEXT,
  logo_url                    TEXT,
  cover_photo_url             TEXT,
  business_name               TEXT,
  street1                     TEXT,
  street2                     TEXT,
  city                        TEXT,
  state                       TEXT,
  county                      TEXT,
  postal_code                 TEXT,
  country                     TEXT,
  location                    TEXT,
  latitude                    DECIMAL(10,7),
  longitude                   DECIMAL(10,7),
  phone                       TEXT,
  email                       TEXT,
  website                     TEXT,
  service_area_scopes         JSONB DEFAULT '[]',
  service_area_states         JSONB DEFAULT '[]',
  service_area_counties       JSONB DEFAULT '[]',
  services_offered_categories JSONB DEFAULT '[]',
  services_offered_subcategories JSONB DEFAULT '[]',
  seo_title                   TEXT,
  seo_description             TEXT,
  seo_keywords                JSONB DEFAULT '[]',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 3. Subscriptions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      TEXT PRIMARY KEY,                -- Stripe subscription ID or doc ID
  user_id                 TEXT NOT NULL REFERENCES users(id),
  listing_id              TEXT,                            -- Listing this subscription covers
  plan_id                 TEXT NOT NULL,
  plan_name               TEXT,
  listing_cap             INTEGER,
  status                  TEXT NOT NULL DEFAULT 'pending', -- active, canceled, past_due, trialing, pending
  stripe_subscription_id  TEXT UNIQUE,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 4. Invoices
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id                        TEXT PRIMARY KEY,              -- Stripe checkout session or invoice ID
  user_id                   TEXT NOT NULL REFERENCES users(id),
  listing_id                TEXT,
  stripe_invoice_id         TEXT,
  stripe_checkout_session_id TEXT,
  amount                    INTEGER NOT NULL DEFAULT 0,    -- cents
  currency                  TEXT DEFAULT 'usd',
  status                    TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, overdue, canceled
  items                     JSONB DEFAULT '[]',
  source                    TEXT,                          -- checkout, webhook, manual
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 5. Seller Program Applications
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_program_applications (
  id                              TEXT PRIMARY KEY,        -- Stripe checkout session ID
  user_id                         TEXT NOT NULL REFERENCES users(id),
  plan_id                         TEXT,
  status                          TEXT DEFAULT 'pending',  -- pending, checkout_confirmed, checkout_processing, active
  stripe_customer_id              TEXT,
  stripe_subscription_id          TEXT,
  legal_full_name                 TEXT,
  legal_title                     TEXT,
  company_name                    TEXT,
  billing_email                   TEXT,
  phone_number                    TEXT,
  website                         TEXT,
  country                         TEXT,
  tax_id_or_vat                   TEXT,
  notes                           TEXT,
  statement_label                 TEXT,
  legal_scope                     TEXT,
  legal_terms_version             TEXT,
  legal_accepted_at_iso           TEXT,
  accepted_terms                  BOOLEAN DEFAULT FALSE,
  accepted_privacy                BOOLEAN DEFAULT FALSE,
  accepted_recurring_billing      BOOLEAN DEFAULT FALSE,
  accepted_visibility_policy      BOOLEAN DEFAULT FALSE,
  accepted_authority              BOOLEAN DEFAULT FALSE,
  source                          TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_account_uid) WHERE parent_account_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_storefront_slug ON users(storefront_slug) WHERE storefront_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Storefronts
CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON storefronts(storefront_slug);
CREATE INDEX IF NOT EXISTS idx_storefronts_user ON storefronts(user_id);
CREATE INDEX IF NOT EXISTS idx_storefronts_enabled ON storefronts(storefront_enabled) WHERE storefront_enabled = TRUE;

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(current_period_end) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_listing ON subscriptions(listing_id) WHERE listing_id IS NOT NULL;

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_listing ON invoices(listing_id) WHERE listing_id IS NOT NULL;

-- Seller Program Applications
CREATE INDEX IF NOT EXISTS idx_spa_user ON seller_program_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_status ON seller_program_applications(status);

-- ==========================================================================
-- TRIGGERS: auto-update updated_at
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_storefronts_updated_at') THEN
    CREATE TRIGGER trg_storefronts_updated_at
      BEFORE UPDATE ON storefronts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subscriptions_updated_at') THEN
    CREATE TRIGGER trg_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_spa_updated_at') THEN
    CREATE TRIGGER trg_spa_updated_at
      BEFORE UPDATE ON seller_program_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMIT;
