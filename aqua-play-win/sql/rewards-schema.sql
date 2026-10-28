-- Future server-side redemption system: not active in the prototype.
-- Keep only verified Shopify customer IDs, never unverified email addresses as identity.
-- Use Postgres transactions and the UNIQUE customer/week constraint to prevent concurrent double claims.
CREATE TABLE IF NOT EXISTS verified_game_sessions (
 session_id uuid PRIMARY KEY,
 shopify_customer_gid text NOT NULL,
 game_name text NOT NULL,
 started_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 verified_score integer,
 result_verified boolean NOT NULL DEFAULT false,
 CONSTRAINT completed_verified_score CHECK (NOT result_verified OR (finished_at IS NOT NULL AND verified_score IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS arcade_discount_claims (
 claim_id uuid PRIMARY KEY,
 session_id uuid NOT NULL UNIQUE REFERENCES verified_game_sessions(session_id),
 shopify_customer_gid text NOT NULL,
 week_start date NOT NULL,
 discount_percent smallint NOT NULL CHECK(discount_percent IN (5,10,15)),
 shopify_discount_gid text UNIQUE,
 code text UNIQUE,
 claim_status text NOT NULL CHECK (claim_status IN ('reserved','issued','failed','expired')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 UNIQUE(shopify_customer_gid,week_start)
);
CREATE INDEX IF NOT EXISTS idx_arcade_discount_claim_status ON arcade_discount_claims(claim_status,created_at);
-- Future implementation: reserve customer/week atomically, verify session and customer,
-- create Shopify code with a 72-hour expiry, then mark issuance within a recoverable
-- transaction/outbox workflow. Failed Shopify API calls need retry/idempotency handling.
