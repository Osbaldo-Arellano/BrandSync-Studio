-- address was jsonb but the app treats it as plain text everywhere.
-- Convert to text null, mapping empty objects to null.
alter table public.customers
  alter column address type text using (
    case when address = '{}'::jsonb then null
         else (address #>> '{}')
    end
  ),
  alter column address drop not null,
  alter column address drop default;
  