-- Migration: Fix Collection References
-- Description: Fixes pokemon_id type and adds foreign key reference to pokemon_forms
-- Author: CODE MNKY

begin;

-- Drop existing constraint if exists
alter table personal_pokemon_collections 
  drop constraint if exists personal_pokemon_collections_pokemon_id_fkey;

-- Update column type to match pokemon_forms.id
alter table personal_pokemon_collections 
  alter column pokemon_id int8;

-- Add new foreign key constraint
alter table personal_pokemon_collections 
  add foreign key (pokemon_id) 
  references pokemon_forms(id);

commit; 