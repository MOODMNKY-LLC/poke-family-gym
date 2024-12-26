-- Migration: Add chatflow_id to family_members
-- Description: Add chatflow_id column to family_members table and update RLS policies
-- Author: CODE MNKY

begin;

-- Add chatflow_id column if it doesn't exist
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'family_members' 
    and column_name = 'chatflow_id'
  ) then
    alter table family_members add column chatflow_id text;
  end if;
end $$;

-- Drop existing update policy
drop policy if exists "Users can update family members" on family_members;

-- Create new update policy that explicitly allows chatflow_id updates
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
)
with check (
  exists (
    select 1
    from family_profiles
    where family_profiles.id = family_members.family_id
    and family_profiles.id = auth.uid()
  )
);

-- Add index for better performance
create index if not exists idx_family_members_chatflow_id 
on family_members(chatflow_id);

commit; 