-- Migration: Rename obtained_method column
-- Description: Renames obtained_method to obtained_from in personal_pokemon_collections table
-- Author: CODE MNKY

begin;

alter table personal_pokemon_collections 
rename column obtained_method to obtained_from;

commit; 