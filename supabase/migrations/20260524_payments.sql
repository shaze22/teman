-- payments table for Billplz FPX payment records

CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  type           TEXT NOT NULL DEFAULT 'booking_full',
  status         TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  billplz_id     TEXT UNIQUE,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id  ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id     ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_billplz_id  ON payments(billplz_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own payments"
  ON payments FOR SELECT
  USING (user_id = auth.uid()::text);
