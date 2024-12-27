-- Migration: Fix Member Policies
-- Description: Fix infinite recursion in family_members RLS policies
-- Author: CODE MNKY

begin;

-- Drop existing policies
drop policy if exists "Users can view family members" on family_members;
drop policy if exists "Users can create family members" on family_members;
drop policy if exists "Users can update family members" on family_members;
drop policy if exists "Admins can delete non-admin members of their family" on family_members;

-- Create simplified policies that avoid circular references
create policy "Users can view family members"
on family_members
for select
to authenticated
using (
  family_id in (
    select id from family_profiles where id = auth.uid()
  )
);

create policy "Users can create family members"
on family_members
for insert
to authenticated
with check (
  family_id in (
    select id from family_profiles where id = auth.uid()
  )
);

create policy "Users can update family members"
on family_members
for update
to authenticated
using (
  family_id in (
    select id from family_profiles where id = auth.uid()
  )
);

create policy "Admins can delete non-admin members"
on family_members
for delete
to authenticated
using (
  family_id in (
    select id from family_profiles where id = auth.uid()
  )
  and
  role_id != (select id from roles where name = 'admin')
);

commit; 