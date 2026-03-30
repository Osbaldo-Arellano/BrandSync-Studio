alter table public.invoices
  add column if not exists payment_terms text null;
