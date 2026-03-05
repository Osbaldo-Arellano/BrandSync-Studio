-- Drop existing status check on estimates and recreate with 'declined'
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_status_check;
ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
  CHECK (status IN ('draft', 'sent', 'approved', 'invoiced', 'declined'));

-- Add customer_name to invoices for display without a customer FK lookup
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name text NOT NULL DEFAULT '';
