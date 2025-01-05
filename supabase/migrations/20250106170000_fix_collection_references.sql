-- Migration: Fix Collection References
-- Description: Updates personal_pokemon_collections to properly reference pokemon_forms
-- Author: CODE MNKY

BEGIN;

-- Rename pokemon_id to pokemon_form_id for clarity and consistency
ALTER TABLE personal_pokemon_collections 
  RENAME COLUMN pokemon_id TO pokemon_form_id;

-- Add foreign key constraint to pokemon_forms
ALTER TABLE personal_pokemon_collections 
  ADD CONSTRAINT personal_pokemon_collections_pokemon_form_id_fkey 
  FOREIGN KEY (pokemon_form_id) REFERENCES pokemon_forms(id);

-- Update the family_pokedex trigger to use pokemon_form_id
DROP FUNCTION IF EXISTS update_family_pokedex CASCADE;

CREATE FUNCTION update_family_pokedex()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_pokedex (family_id, pokemon_form_id, first_caught_at, caught_count)
  SELECT 
    fm.family_id,
    NEW.pokemon_form_id,
    NEW.obtained_at,
    1
  FROM family_members fm
  WHERE fm.id = NEW.member_id
  ON CONFLICT (family_id, pokemon_form_id) 
  DO UPDATE SET 
    caught_count = family_pokedex.caught_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_family_pokedex_trigger
  AFTER INSERT ON personal_pokemon_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_family_pokedex();

COMMIT; 