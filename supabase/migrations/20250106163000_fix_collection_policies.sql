-- Migration: Fix Collection Policies
-- Description: Updates RLS policies for personal_pokemon_collections to allow viewing collections within the same family
-- Author: CODE MNKY

-- Drop existing policies
drop policy if exists "Users can view their own collection" on personal_pokemon_collections;
drop policy if exists "Users can manage their own collection" on personal_pokemon_collections;

-- Create new policies
create policy "Users can view collections in their family"
  on personal_pokemon_collections for select
  using (
    exists (
      select 1 from family_members viewer
      where viewer.id = auth.uid()
      and viewer.family_id = (
        select owner.family_id 
        from family_members owner 
        where owner.id = personal_pokemon_collections.member_id
      )
    )
  );

create policy "Users can manage their own collection"
  on personal_pokemon_collections for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid()); 