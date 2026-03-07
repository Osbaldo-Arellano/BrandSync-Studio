-- Link invoices back to the estimate they were generated from
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS estimate_id   uuid REFERENCES estimates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_email text;
