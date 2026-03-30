-- Automatically create a blank tenant row whenever a new auth user signs up.
-- This prevents errors when a user navigates to any page before visiting Settings.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.tenants (id, name)
  values (new.id, '')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
