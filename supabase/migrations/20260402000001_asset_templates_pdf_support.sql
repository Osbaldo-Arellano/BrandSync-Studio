alter table public.tenant_asset_templates
  add column type text not null default 'template'
    check (type in ('template', 'pdf')),
  add column pdf_url text,
  alter column html_body drop not null;

comment on column public.tenant_asset_templates.type is
  '"template" = html_body rendered at order time via Puppeteer.
   "pdf" = static PDF stored in Supabase Storage; pdf_url points to it.';
