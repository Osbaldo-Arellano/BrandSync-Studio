-- Create a global sequence for human-readable estimate numbers
CREATE SEQUENCE IF NOT EXISTS estimate_number_seq START 1;

-- Add the column (nullable so backfill can run first)
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS estimate_number INTEGER;

-- Backfill existing rows in created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM estimates
)
UPDATE estimates
SET estimate_number = numbered.rn
FROM numbered
WHERE estimates.id = numbered.id;

-- Reset sequence to continue after existing rows
SELECT setval('estimate_number_seq', COALESCE((SELECT MAX(estimate_number) FROM estimates), 0));

-- Now make it non-nullable
ALTER TABLE estimates ALTER COLUMN estimate_number SET NOT NULL;

-- Trigger function: assign next sequence value on every new insert
CREATE OR REPLACE FUNCTION assign_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estimate_number := nextval('estimate_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS estimates_assign_number ON estimates;
CREATE TRIGGER estimates_assign_number
  BEFORE INSERT ON estimates
  FOR EACH ROW
  EXECUTE FUNCTION assign_estimate_number();
