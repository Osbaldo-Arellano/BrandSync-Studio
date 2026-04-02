create table public.tenant_asset_templates (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     uuid        not null references public.tenants(id) on delete cascade,
  asset_type_id text        not null,
  template_id   text        not null,
  html_body     text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, asset_type_id, template_id)
);

alter table public.tenant_asset_templates enable row level security;

create policy "tenant reads own templates"
  on public.tenant_asset_templates
  for select
  using (tenant_id = auth.uid());

comment on table public.tenant_asset_templates is
  'Per-tenant HTML templates for print assets. Each row is one (asset_type_id, template_id) variant.
   html_body uses {{placeholder}} tokens: {{logo}}, {{icon}}, {{tagline}}, {{website}}, {{qr_code}},
   {{name}}, {{title}}, {{email}}, {{phone}}, {{fromName}}, {{fromAddress}}, {{toName}}, {{toAddress}}, {{googleUrl}}.
   Presence of a row = that asset type/template is enabled for that tenant.';
