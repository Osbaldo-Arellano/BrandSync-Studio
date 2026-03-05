ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS customer_email  text,
  ADD COLUMN IF NOT EXISTS customer_phone  text,
  ADD COLUMN IF NOT EXISTS signature_url   text,
  ADD COLUMN IF NOT EXISTS signed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS signed_by_name  text,
  ADD COLUMN IF NOT EXISTS signed_ip       text,
  ADD COLUMN IF NOT EXISTS sent_at         timestamptz;
