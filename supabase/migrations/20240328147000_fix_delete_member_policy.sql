-- Migration: Fix Delete Member Policy
-- Description: Fix the policy for deleting family members to properly handle admin and non-admin cases
-- Author: MOODMNKY LLC

begin;

-- Drop existing policies
drop policy if exists "Users can delete family members" on family_members;
drop policy if exists "Allow admin to delete non-admin members" on family_members;
drop policy if exists "allow_admin_delete_non_admin_members" on family_members;

-- Create new delete policy with a simpler approach
create policy "Admins can delete non-admin members of their family"
on family_members
for delete
to authenticated
using (
    -- Get the family_id of the current user
    (select family_id from family_members where id = auth.uid()) = family_members.family_id
    and
    -- Check if current user is admin
    (select role_id from family_members where id = auth.uid()) = (select id from roles where name = 'admin')
    and
    -- Ensure target member is not an admin
    family_members.role_id != (select id from roles where name = 'admin')
);

commit; 