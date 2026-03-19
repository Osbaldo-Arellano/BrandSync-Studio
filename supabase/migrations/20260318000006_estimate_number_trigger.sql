-- Auto-assign per-tenant sequential estimate numbers

CREATE OR REPLACE FUNCTION assign_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = 0 THEN
    SELECT COALESCE(MAX(estimate_number), 0) + 1
      INTO NEW.estimate_number
      FROM estimates
     WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estimates_assign_number ON estimates;
CREATE TRIGGER estimates_assign_number
  BEFORE INSERT ON estimates
  FOR EACH ROW EXECUTE FUNCTION assign_estimate_number();
