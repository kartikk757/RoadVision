-- Apply this in the Supabase SQL Editor.  It deliberately replaces every
-- existing profiles policy, so it also repairs projects created with an older
-- policy name or an overly-restrictive policy.
alter table public.profiles enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;
end
$$;

create policy "users can read their profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "users can update their profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can insert their profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "authenticated users can manage vehicles" on public.vehicles;
create policy "authenticated users can manage vehicles"
on public.vehicles for all to authenticated using (true) with check (true);
