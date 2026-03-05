-- estimates
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','approved','invoiced')),
  notes text NOT NULL DEFAULT '',
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- estimate_items
CREATE TABLE estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0
);

-- Link invoices back to the estimate that generated them
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS estimate_id uuid REFERENCES estimates(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX ON estimates(tenant_id);
CREATE INDEX ON estimate_items(estimate_id);
CREATE INDEX ON invoices(estimate_id);

-- RLS
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant scoped" ON estimates FOR ALL
  USING (tenant_id = auth.uid());

CREATE POLICY "estimate owner" ON estimate_items FOR ALL
  USING (estimate_id IN (SELECT id FROM estimates WHERE tenant_id = auth.uid()));
