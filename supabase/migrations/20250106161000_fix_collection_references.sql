-- Migration: Fix Collection References
-- Description: Adds foreign key reference to pokemon_forms
-- Author: CODE MNKY

begin;

-- Drop existing constraint if exists
alter table personal_pokemon_collections 
  drop constraint if exists personal_pokemon_collections_pokemon_id_fkey;

-- Add new foreign key constraint
alter table personal_pokemon_collections 
  add constraint personal_pokemon_collections_pokemon_id_fkey 
  foreign key (pokemon_id) 
  references pokemon_forms(id);

commit; 