-- booking_messages table for in-app chat

CREATE TABLE IF NOT EXISTS booking_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_created_at ON booking_messages(booking_id, created_at);

ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking participants can read messages"
  ON booking_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_messages.booking_id
      AND (b.customer_id = auth.uid()::text OR b.provider_id = auth.uid()::text)
    )
  );

CREATE POLICY "booking participants can insert messages"
  ON booking_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_messages.booking_id
      AND (b.customer_id = auth.uid()::text OR b.provider_id = auth.uid()::text)
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE booking_messages;
