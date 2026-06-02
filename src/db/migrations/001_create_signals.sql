-- Migration: create signals table
-- Run with: npm run migrate

-- UUID generation. pgcrypto provides gen_random_uuid() on modern Postgres.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums for direction and status keep the data layer authoritative.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_direction') THEN
    CREATE TYPE signal_direction AS ENUM ('BUY', 'SELL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_status') THEN
    CREATE TYPE signal_status AS ENUM ('OPEN', 'TARGET_HIT', 'STOPLOSS_HIT', 'EXPIRED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol        VARCHAR(20)      NOT NULL,
  direction     signal_direction NOT NULL,
  entry_price   NUMERIC(20, 8)   NOT NULL,
  stop_loss     NUMERIC(20, 8)   NOT NULL,
  target_price  NUMERIC(20, 8)   NOT NULL,
  entry_time    TIMESTAMPTZ      NOT NULL,
  expiry_time   TIMESTAMPTZ      NOT NULL,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  status        signal_status    NOT NULL DEFAULT 'OPEN',
  realized_roi  NUMERIC(12, 2),

  -- Data-level guard: expiry must be strictly after entry.
  CONSTRAINT chk_expiry_after_entry CHECK (expiry_time > entry_time)
);

-- Common lookups: by symbol and by status.
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals (symbol);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals (status);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals (created_at DESC);
