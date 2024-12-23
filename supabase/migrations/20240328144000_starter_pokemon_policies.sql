begin;

-- Disable RLS temporarily
alter table family_members disable row level security;

-- Drop existing policies
drop policy if exists "Users can view family members" on family_members;
drop policy if exists "Users can create family members" on family_members;
drop policy if exists "Users can update family members" on family_members;

-- Create new policies that properly check family ownership
create policy "Users can view family members"
on family_members
for select
to authenticated
using (
  exists (
    select 1
    from family_profiles
    where family_profiles.id = family_members.family_id
    and family_profiles.id = auth.uid()
  )
);

create policy "Users can create family members"
on family_members
for insert
to authenticated
with check (
  exists (
    select 1
    from family_profiles
    where family_profiles.id = family_members.family_id
    and family_profiles.id = auth.uid()
  )
);

create policy "Users can update family members"
on family_members
for update
to authenticated
using (
  exists (
    select 1
    from family_profiles
    where family_profiles.id = family_members.family_id
    and family_profiles.id = auth.uid()
  )
);

-- Re-enable RLS
alter table family_members enable row level security;

commit;