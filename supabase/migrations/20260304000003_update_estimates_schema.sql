-- Add missing columns to estimates
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS customer_name    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS salesperson      text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS job              text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_terms    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS due_date         text NOT NULL DEFAULT 'TBD',
  ADD COLUMN IF NOT EXISTS deposit          numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_note        text NOT NULL DEFAULT '';

-- customer_id is now optional (free-form text used instead of FK lookup)
ALTER TABLE estimates ALTER COLUMN customer_id DROP NOT NULL;

-- Add line_total to estimate_items (editable override of qty * unit_price)
ALTER TABLE estimate_items
  ADD COLUMN IF NOT EXISTS line_total numeric(10,2) NOT NULL DEFAULT 0;
