CREATE TABLE IF NOT EXISTS jazzcash_transactions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  invoice_id INTEGER NOT NULL,
  patient_id TEXT,
  organization_subdomain TEXT,
  txn_ref_no TEXT NOT NULL UNIQUE,
  bill_reference TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  amount_paisa TEXT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  response_code VARCHAR(10),
  response_message TEXT,
  retrieval_reference_no TEXT,
  secure_hash_verified BOOLEAN DEFAULT FALSE,
  callback_payload JSONB DEFAULT '{}',
  request_payload JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jazzcash_transactions_invoice ON jazzcash_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_jazzcash_transactions_org ON jazzcash_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_jazzcash_transactions_status ON jazzcash_transactions(status);
