-- Add tenant_id to brands (1:1 so tenant_id = user_id = auth.uid())
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
UPDATE brands SET tenant_id = user_id WHERE tenant_id IS NULL;
ALTER TABLE brands ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX ON brands(tenant_id);

-- Enable RLS on brands (if not already)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant scoped" ON brands FOR ALL
  USING (tenant_id = auth.uid());

-- Same for brand_photos
ALTER TABLE brand_photos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
UPDATE brand_photos SET tenant_id = user_id WHERE tenant_id IS NULL;
ALTER TABLE brand_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant scoped" ON brand_photos FOR ALL
  USING (tenant_id = auth.uid());
