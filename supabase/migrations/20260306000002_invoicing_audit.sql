-- =============================================
-- 1. Invoice sequential numbering
-- =============================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number INTEGER;

-- Backfill existing rows in created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM invoices
)
UPDATE invoices SET invoice_number = numbered.rn
FROM numbered WHERE invoices.id = numbered.id;

SELECT setval('invoice_number_seq', COALESCE((SELECT MAX(invoice_number) FROM invoices), 0));

ALTER TABLE invoices ALTER COLUMN invoice_number SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT nextval('invoice_number_seq');

CREATE OR REPLACE FUNCTION assign_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := nextval('invoice_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_assign_number ON invoices;
CREATE TRIGGER invoices_assign_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION assign_invoice_number();

-- =============================================
-- 2. Invoice additional fields
-- =============================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS due_date         text,
  ADD COLUMN IF NOT EXISTS notes            text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS customer_phone   text;

-- =============================================
-- 3. Void status (drop & recreate constraint)
-- =============================================
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft','sent','paid','overdue','partial','cash','deferred','void'));

-- =============================================
-- 4. Invoice items — line_total
-- =============================================
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS line_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- =============================================
-- 5. Estimate additional fields
-- =============================================
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS expires_at       timestamptz,
  ADD COLUMN IF NOT EXISTS tax_rate         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0;
