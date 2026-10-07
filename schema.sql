CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name VARCHAR(120) NOT NULL,
 email VARCHAR(255) UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 email_verified BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
 name VARCHAR(100) NOT NULL,
 key_prefix VARCHAR(24) NOT NULL,
 key_hash CHAR(64) UNIQUE NOT NULL,
 revoked_at TIMESTAMPTZ,
 last_used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
 reference VARCHAR(100) UNIQUE NOT NULL,
 amount BIGINT NOT NULL CHECK(amount>0),
 currency CHAR(3) NOT NULL DEFAULT 'NGN',
 customer_email VARCHAR(255) NOT NULL,
 customer_name VARCHAR(120),
 status VARCHAR(30) NOT NULL DEFAULT 'pending',
 provider VARCHAR(40) NOT NULL,
 provider_reference VARCHAR(150),
 checkout_url TEXT,
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS transactions_customer_idx ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);

CREATE TABLE IF NOT EXISTS refunds(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
 amount BIGINT NOT NULL CHECK(amount>0),
 status VARCHAR(30) NOT NULL DEFAULT 'pending',
 provider_reference VARCHAR(150),
 reason TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 provider VARCHAR(40) NOT NULL,
 event_id VARCHAR(200),
 payload JSONB NOT NULL,
 processed BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(provider,event_id)
);

CREATE TABLE IF NOT EXISTS audit_logs(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 actor VARCHAR(120),
 action VARCHAR(120) NOT NULL,
 target VARCHAR(200),
 details JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
