begin;

-- Drop existing policies
drop policy if exists "Users can view family members" on family_members;
drop policy if exists "Users can create family members" on family_members;
drop policy if exists "Users can update family members" on family_members;

-- Create new policies with proper access control
create policy "Users can view family members"
on family_members
for select
using (
  auth.uid() in (
    select id 
    from family_profiles
    where id = family_members.family_id
  )
);

create policy "Users can create family members"
on family_members
for insert
with check (
  auth.uid() in (
    select id 
    from family_profiles
    where id = family_members.family_id
  )
);

create policy "Users can update family members"
on family_members
for update
using (
  auth.uid() in (
    select id 
    from family_profiles
    where id = family_members.family_id
  )
);

commit; 