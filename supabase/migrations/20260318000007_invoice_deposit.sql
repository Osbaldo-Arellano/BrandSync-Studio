-- Copy deposit from estimate to invoice at creation time
-- so pay page never needs to join estimates to get deposit amount

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deposit NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Backfill existing invoices from their linked estimates
UPDATE invoices i
   SET deposit = e.deposit
  FROM estimates e
 WHERE i.estimate_id = e.id
   AND i.deposit = 0
   AND e.deposit > 0;
