-- Migration: Add Delete Policies
-- Description: Add policies for deleting family members and cascade rules
-- Author: CODE MNKY

begin;

-- Add delete policy for family members
create policy "Users can delete family members"
on family_members
for delete
to authenticated
using (
  exists (
    select 1
    from family_profiles fp
    join family_members fm on fm.family_id = fp.id
    where fp.id = auth.uid()
    and fm.role_id != (select id from roles where name = 'admin')
  )
);

-- Add delete policy for family profiles (admin self-deletion)
create policy "Users can delete their own family profile"
on family_profiles
for delete
to authenticated
using (id = auth.uid());

-- Add delete policy for family pokedex entries
create policy "Users can delete family pokedex entries"
on family_pokedex
for delete
to authenticated
using (
  family_id in (
    select id 
    from family_profiles 
    where id = auth.uid()
  )
);

-- Add delete policy for storage objects (avatars)
create policy "Users can delete their avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

commit; 