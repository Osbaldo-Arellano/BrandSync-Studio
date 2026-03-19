-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  title       text NOT NULL DEFAULT '',
  address     text,
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','completed','cancelled')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_jobs" ON jobs
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Add job_id FK to estimates and invoices (nullable, backwards-compatible)
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES jobs(id) ON DELETE SET NULL;
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES jobs(id) ON DELETE SET NULL;
