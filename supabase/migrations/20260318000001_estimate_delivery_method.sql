ALTER TABLE estimates ADD COLUMN IF NOT EXISTS delivery_method TEXT
  CHECK (delivery_method IN ('email', 'link', 'print'));
