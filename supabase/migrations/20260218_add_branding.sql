-- ================================================================
-- Migration: Add Branding section
-- Date: 2026-02-18
-- Extends the brands table with branding fields and adds a/
-- brand_photos table + storage bucket for the photo gallery.
-- Existing columns (email, phone, logo_url, name, tagline) are
-- untouched — no data migration required.
-- ================================================================


-- ================================================================
-- 1. EXTEND brands TABLE
-- ================================================================
alter table brands
  add column if not exists about_us      text,
  add column if not exists address       jsonb not null default '{}'::jsonb,
  add column if not exists social_links  jsonb not null default '[]'::jsonb,
  add column if not exists logo_variants jsonb not null default '{}'::jsonb,
  add column if not exists icon_url      text,        -- square brand mark, separate from the wide logo
  add column if not exists website_url   text;        -- brand website; encoded as QR code on business cards

-- Enforce expected JSONB shapes at the DB level
alter table brands
  add constraint address_is_object
    check (jsonb_typeof(address) = 'object'),
  add constraint social_links_is_array
    check (jsonb_typeof(social_links) = 'array'),
  add constraint logo_variants_is_object
    check (jsonb_typeof(logo_variants) = 'object');


-- ================================================================
-- 2. updated_at TRIGGER
-- Ensures updated_at always reflects the last real write.
-- Without this, updated_at only sets on insert.
-- ================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists brands_set_updated_at on brands;
create trigger brands_set_updated_at
  before update on brands
  for each row execute function set_updated_at();


-- ================================================================
-- 3. brand_photos TABLE (Photo Gallery)
-- Separate table, not JSONB — rows can be individually sorted,
-- deleted, and paginated without loading the full gallery.
-- Cascades on delete so cleanup is automatic when a brand is removed.
-- ================================================================
create table if not exists brand_photos (
  id         uuid        primary key default gen_random_uuid(),
  user_id    text        not null references brands(user_id) on delete cascade,
  url        text        not null,
  alt_text   text,                          -- accessibility + SEO
  caption    text,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

-- Fast lookup by user
create index if not exists brand_photos_user_id_idx
  on brand_photos(user_id);

-- Ordered gallery fetches (SELECT ... ORDER BY sort_order)
create index if not exists brand_photos_user_sort_idx
  on brand_photos(user_id, sort_order);

alter table brand_photos enable row level security;
create policy "Allow all access" on brand_photos
  for all using (true) with check (true);


-- ================================================================
-- 4. STORAGE: brand-photos bucket
-- Logo variants reuse the existing `logos` bucket scoped by path:
--   logos/{user_id}/variants/{name}.png
-- This keeps buckets minimal and paths predictable.
-- ================================================================
insert into storage.buckets (id, name, public)
values ('brand-photos', 'brand-photos', true)
on conflict (id) do nothing;

create policy "Public read brand-photos"
  on storage.objects for select
  using (bucket_id = 'brand-photos');

create policy "Allow upload brand-photos"
  on storage.objects for insert
  with check (bucket_id = 'brand-photos');

create policy "Allow update brand-photos"
  on storage.objects for update
  using (bucket_id = 'brand-photos');

create policy "Allow delete brand-photos"
  on storage.objects for delete
  using (bucket_id = 'brand-photos');


-- ================================================================
-- REFERENCE: Expected JSONB shapes
-- ================================================================
-- address:
--   { "street": "123 Main St", "city": "Austin", "state": "TX", "zip": "78701", "country": "US" }
--
-- social_links:
--   [
--     { "platform": "instagram", "handle": "@brand", "url": "https://instagram.com/brand" },
--     { "platform": "facebook",  "handle": "brand",  "url": "https://facebook.com/brand"  },
--     { "platform": "tiktok",    "handle": "@brand", "url": "https://tiktok.com/@brand"   },
--     { "platform": "x",         "handle": "@brand", "url": "https://x.com/brand"         },
--     { "platform": "linkedin",  "handle": "brand",  "url": "https://linkedin.com/brand"  },
--     { "platform": "youtube",   "handle": "@brand", "url": "https://youtube.com/@brand"  }
--   ]
--
-- logo_variants (URLs point into the existing `logos` storage bucket):
--   {
--     "primary":    "https://<ref>.supabase.co/storage/v1/object/public/logos/<uid>/variants/primary.png",
--     "horizontal": "...",
--     "dark":       "...",
--     "light":      "...",
--     "favicon":    "..."
--   }
