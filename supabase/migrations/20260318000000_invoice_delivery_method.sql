ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_method TEXT
  CHECK (delivery_method IN ('email', 'link', 'print'));
