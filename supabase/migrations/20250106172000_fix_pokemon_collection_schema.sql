-- Migration: Fix Pokemon Collection Schema
-- Description: Updates pokemon_id to bigint and adds foreign key reference to pokemon_forms
-- Author: CODE MNKY

begin;

-- Drop existing constraint if exists
alter table personal_pokemon_collections 
  drop constraint if exists personal_pokemon_collections_pokemon_id_fkey;

-- Alter column type
alter table personal_pokemon_collections 
  alter column pokemon_id set data type bigint using pokemon_id::bigint;

-- Add foreign key constraint
alter table personal_pokemon_collections 
  add constraint personal_pokemon_collections_pokemon_id_fkey 
  foreign key (pokemon_id) 
  references pokemon_forms(id);

commit; 