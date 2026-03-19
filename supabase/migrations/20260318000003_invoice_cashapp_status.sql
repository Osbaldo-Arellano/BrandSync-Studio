-- Add 'cashapp' to the invoices status check constraint.
-- Tracks when a customer taps "Pay via Cash App" on the public pay page.

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft','sent','paid','overdue','partial','cash','cashapp','deferred','void'));
