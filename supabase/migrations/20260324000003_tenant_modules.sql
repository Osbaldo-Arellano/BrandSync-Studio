alter table public.tenants
  add column if not exists modules jsonb not null default '{}'::jsonb;

comment on column public.tenants.modules is
  'Per-tenant feature flags. Empty object = all defaults. Example: {"invoices": false, "emailMarketing": true}';
