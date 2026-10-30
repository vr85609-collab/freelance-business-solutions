CREATE TABLE IF NOT EXISTS arcade_accounts (
 customer_gid text PRIMARY KEY, balance integer NOT NULL DEFAULT 0 CHECK(balance>=0),
 stars integer NOT NULL DEFAULT 0 CHECK(stars>=0), wins integer NOT NULL DEFAULT 0,
 days integer NOT NULL DEFAULT 0, streak integer NOT NULL DEFAULT 0, last_day text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS arcade_login_requests (
 state_hash text PRIMARY KEY, code_hash text, customer_gid text,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes'
);
CREATE TABLE IF NOT EXISTS arcade_logins (
 token_hash text PRIMARY KEY, customer_gid text NOT NULL REFERENCES arcade_accounts ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '8 hours'
);
CREATE TABLE IF NOT EXISTS arcade_challenges (
 id uuid PRIMARY KEY, customer_gid text NOT NULL REFERENCES arcade_accounts ON DELETE CASCADE,
 game text NOT NULL, seed bigint NOT NULL, language text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), completed boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS arcade_ledger (
 id uuid PRIMARY KEY, customer_gid text NOT NULL REFERENCES arcade_accounts ON DELETE CASCADE,
 game text, day text NOT NULL, amount integer NOT NULL, reason text NOT NULL,
 challenge_id uuid UNIQUE REFERENCES arcade_challenges ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(customer_gid,game,day)
);
CREATE TABLE IF NOT EXISTS arcade_claims (
 id uuid PRIMARY KEY, customer_gid text NOT NULL REFERENCES arcade_accounts ON DELETE CASCADE,
 reward_id text NOT NULL, cost integer NOT NULL, week text,
 status text NOT NULL CHECK(status IN ('pending','approved','issuing','issued','rejected')),
 code text UNIQUE, discount_gid text, expires_at timestamptz, variant_gid text,
 amount text, shopify_input jsonb, issuance_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(customer_gid,week)
);
CREATE UNIQUE INDEX IF NOT EXISTS arcade_one_gift ON arcade_claims(customer_gid)
 WHERE reward_id='bathbomb' AND status<>'rejected';
CREATE INDEX IF NOT EXISTS arcade_challenge_created ON arcade_challenges(created_at);
CREATE TABLE IF NOT EXISTS arcade_deleted_accounts (
 customer_hash text PRIMARY KEY, expires_at timestamptz NOT NULL DEFAULT now()+interval '365 days'
);
