ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tagline        text,
  ADD COLUMN IF NOT EXISTS email          text,
  ADD COLUMN IF NOT EXISTS phone          text,
  ADD COLUMN IF NOT EXISTS website        text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_city   text,
  ADD COLUMN IF NOT EXISTS address_state  text,
  ADD COLUMN IF NOT EXISTS address_zip    text;
