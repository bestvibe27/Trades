-- PostgreSQL DDL for live trading positions table
-- Safe to run multiple times: uses IF NOT EXISTS where possible

-- Optional: create the database (run only once, and only if needed)
-- CREATE DATABASE tradingdb;

-- Connect to your target database before running the rest
-- \c tradingdb

-- Enum for position side (buy/sell) - optional; you can use TEXT + CHECK instead
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'position_side') THEN
    CREATE TYPE position_side AS ENUM ('buy', 'sell');
  END IF;
END$$;

-- Main positions table
CREATE TABLE IF NOT EXISTS public.positions (
  ticket        BIGINT PRIMARY KEY,                 -- Position ID (unique)
  symbol        TEXT        NOT NULL,               -- Symbol
  side          position_side NOT NULL,             -- Type (buy/sell)
  volume        NUMERIC(12,3) NOT NULL,            -- Volume (Lot)
  price_open    NUMERIC(18,6) NOT NULL,            -- Open Price
  price_current NUMERIC(18,6) NOT NULL,            -- Current Price
  tp            NUMERIC(18,6) DEFAULT 0,           -- Take Profit
  sl            NUMERIC(18,6) DEFAULT 0,           -- Stop Loss
  open_time     TIMESTAMPTZ  NOT NULL DEFAULT now(), -- Open Time
  swap          NUMERIC(18,2) DEFAULT 0,           -- Swap (USD)
  profit        NUMERIC(18,2) DEFAULT 0,           -- P/L (USD)
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON public.positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_open_time ON public.positions(open_time DESC);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_positions_set_updated_at'
  ) THEN
    CREATE TRIGGER tr_positions_set_updated_at
    BEFORE UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Example upsert (useful for syncing from MT5):
-- INSERT INTO public.positions (ticket, symbol, side, volume, price_open, price_current, tp, sl, open_time, swap, profit)
-- VALUES (:ticket, :symbol, :side, :volume, :price_open, :price_current, :tp, :sl, :open_time, :swap, :profit)
-- ON CONFLICT (ticket) DO UPDATE SET
--   symbol = EXCLUDED.symbol,
--   side = EXCLUDED.side,
--   volume = EXCLUDED.volume,
--   price_open = EXCLUDED.price_open,
--   price_current = EXCLUDED.price_current,
--   tp = EXCLUDED.tp,
--   sl = EXCLUDED.sl,
--   open_time = EXCLUDED.open_time,
--   swap = EXCLUDED.swap,
--   profit = EXCLUDED.profit,
--   updated_at = now();