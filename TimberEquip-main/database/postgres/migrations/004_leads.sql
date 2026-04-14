-- ============================================================================
-- Phase 4: Leads & Inquiries
-- Migration: 004_leads.sql
-- Date: 2026-04-05
-- Description: Inquiries, financing requests, call logs, and contact requests.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Inquiries
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id                             TEXT PRIMARY KEY,
  listing_id                     TEXT,                             -- FK to listings.legacy_firestore_id
  seller_uid                     TEXT,
  buyer_uid                      TEXT,
  buyer_name                     TEXT NOT NULL,
  buyer_email                    TEXT NOT NULL,
  buyer_phone                    TEXT,
  message                        TEXT,
  type                           TEXT NOT NULL DEFAULT 'Inquiry',
  status                         TEXT NOT NULL DEFAULT 'New',
  assigned_to_uid                TEXT,
  assigned_to_name               TEXT,
  internal_notes                 JSONB DEFAULT '[]',               -- Array of note objects
  first_response_at              TIMESTAMPTZ,
  response_time_minutes          INTEGER,
  spam_score                     NUMERIC(5,2),
  spam_flags                     JSONB DEFAULT '[]',
  contact_consent_accepted       BOOLEAN DEFAULT FALSE,
  contact_consent_version        TEXT,
  contact_consent_scope          TEXT,
  contact_consent_at             TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_inquiries_type
    CHECK (type IN ('Inquiry','Financing','Shipping','Call')),
  CONSTRAINT chk_inquiries_status
    CHECK (status IN ('New','Contacted','Qualified','Won','Lost','Closed'))
);

CREATE INDEX IF NOT EXISTS idx_inquiries_seller
  ON inquiries (seller_uid);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer
  ON inquiries (buyer_uid) WHERE buyer_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_listing
  ON inquiries (listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_status
  ON inquiries (status, created_at DESC);

CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 2. Financing Requests
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financing_requests (
  id                             TEXT PRIMARY KEY,
  listing_id                     TEXT,
  seller_uid                     TEXT,
  buyer_uid                      TEXT,
  applicant_name                 TEXT NOT NULL,
  applicant_email                TEXT NOT NULL,
  applicant_phone                TEXT,
  company                        TEXT,
  requested_amount               NUMERIC(14,2),
  message                        TEXT,
  status                         TEXT NOT NULL DEFAULT 'New',
  contact_consent_accepted       BOOLEAN DEFAULT FALSE,
  contact_consent_version        TEXT,
  contact_consent_scope          TEXT,
  contact_consent_at             TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_financing_status
    CHECK (status IN ('New','Contacted','Qualified','Won','Lost','Closed'))
);

CREATE INDEX IF NOT EXISTS idx_financing_seller
  ON financing_requests (seller_uid) WHERE seller_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financing_buyer
  ON financing_requests (buyer_uid) WHERE buyer_uid IS NOT NULL;

CREATE TRIGGER trg_financing_updated_at
  BEFORE UPDATE ON financing_requests
  FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

-- --------------------------------------------------------------------------
-- 3. Call Logs
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_logs (
  id                             TEXT PRIMARY KEY,
  listing_id                     TEXT,
  listing_title                  TEXT,
  seller_uid                     TEXT,
  seller_name                    TEXT,
  seller_phone                   TEXT,
  caller_uid                     TEXT,
  caller_name                    TEXT,
  caller_email                   TEXT,
  caller_phone                   TEXT,
  duration                       INTEGER DEFAULT 0,
  status                         TEXT NOT NULL,
  source                         TEXT,
  is_authenticated               BOOLEAN DEFAULT FALSE,
  recording_url                  TEXT,
  twilio_call_sid                TEXT,
  completed_at                   TIMESTAMPTZ,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_calls_status
    CHECK (status IN ('Initiated','Completed','Missed','Voicemail','no_answer','no-answer'))
);

CREATE INDEX IF NOT EXISTS idx_calls_seller
  ON call_logs (seller_uid) WHERE seller_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_caller
  ON call_logs (caller_uid) WHERE caller_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_listing
  ON call_logs (listing_id) WHERE listing_id IS NOT NULL;

-- --------------------------------------------------------------------------
-- 4. Contact Requests
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_requests (
  id                             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name                           TEXT,
  email                          TEXT NOT NULL,
  category                       TEXT,
  message                        TEXT,
  source                         TEXT,
  status                         TEXT DEFAULT 'New',
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_status
  ON contact_requests (status, created_at DESC);

COMMIT;
