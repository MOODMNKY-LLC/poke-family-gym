-- Migration: Add All Starter Pokémon
-- Description: Adds all starter Pokémon from generations 1-9
-- Author: CODE MNKY

begin;

-- Insert all generations if they don't exist
insert into generations (id, name) values 
  (1, 'generation-i'),
  (2, 'generation-ii'),
  (3, 'generation-iii'),
  (4, 'generation-iv'),
  (5, 'generation-v'),
  (6, 'generation-vi'),
  (7, 'generation-vii'),
  (8, 'generation-viii'),
  (9, 'generation-ix')
on conflict (id) do nothing;

-- Insert all starter Pokémon species
insert into pokemon_species (id, name, generation_id) values 
  -- Gen 1
  (1, 'bulbasaur', 1),
  (4, 'charmander', 1),
  (7, 'squirtle', 1),
  -- Gen 2
  (152, 'chikorita', 2),
  (155, 'cyndaquil', 2),
  (158, 'totodile', 2),
  -- Gen 3
  (252, 'treecko', 3),
  (255, 'torchic', 3),
  (258, 'mudkip', 3),
  -- Gen 4
  (387, 'turtwig', 4),
  (390, 'chimchar', 4),
  (393, 'piplup', 4),
  -- Gen 5
  (495, 'snivy', 5),
  (498, 'tepig', 5),
  (501, 'oshawott', 5),
  -- Gen 6
  (650, 'chespin', 6),
  (653, 'fennekin', 6),
  (656, 'froakie', 6),
  -- Gen 7
  (722, 'rowlet', 7),
  (725, 'litten', 7),
  (728, 'popplio', 7),
  -- Gen 8
  (810, 'grookey', 8),
  (813, 'scorbunny', 8),
  (816, 'sobble', 8),
  -- Gen 9
  (906, 'sprigatito', 9),
  (909, 'fuecoco', 9),
  (912, 'quaxly', 9)
on conflict (id) do nothing;

-- Insert default forms for all starters
insert into pokemon_forms (id, name, species_id, is_default) values 
  -- Gen 1
  (1, 'bulbasaur', 1, true),
  (4, 'charmander', 4, true),
  (7, 'squirtle', 7, true),
  -- Gen 2
  (152, 'chikorita', 152, true),
  (155, 'cyndaquil', 155, true),
  (158, 'totodile', 158, true),
  -- Gen 3
  (252, 'treecko', 252, true),
  (255, 'torchic', 255, true),
  (258, 'mudkip', 258, true),
  -- Gen 4
  (387, 'turtwig', 387, true),
  (390, 'chimchar', 390, true),
  (393, 'piplup', 393, true),
  -- Gen 5
  (495, 'snivy', 495, true),
  (498, 'tepig', 498, true),
  (501, 'oshawott', 501, true),
  -- Gen 6
  (650, 'chespin', 650, true),
  (653, 'fennekin', 653, true),
  (656, 'froakie', 656, true),
  -- Gen 7
  (722, 'rowlet', 722, true),
  (725, 'litten', 725, true),
  (728, 'popplio', 728, true),
  -- Gen 8
  (810, 'grookey', 810, true),
  (813, 'scorbunny', 813, true),
  (816, 'sobble', 816, true),
  -- Gen 9
  (906, 'sprigatito', 906, true),
  (909, 'fuecoco', 909, true),
  (912, 'quaxly', 912, true)
on conflict (id) do nothing;

-- Add all starters to starter_pokemon_config
insert into starter_pokemon_config (pokemon_form_id, generation_id) 
select 
  pf.id as pokemon_form_id,
  ps.generation_id
from pokemon_forms pf
inner join pokemon_species ps on ps.id = pf.species_id
where ps.name in (
  -- Gen 1
  'bulbasaur', 'charmander', 'squirtle',
  -- Gen 2
  'chikorita', 'cyndaquil', 'totodile',
  -- Gen 3
  'treecko', 'torchic', 'mudkip',
  -- Gen 4
  'turtwig', 'chimchar', 'piplup',
  -- Gen 5
  'snivy', 'tepig', 'oshawott',
  -- Gen 6
  'chespin', 'fennekin', 'froakie',
  -- Gen 7
  'rowlet', 'litten', 'popplio',
  -- Gen 8
  'grookey', 'scorbunny', 'sobble',
  -- Gen 9
  'sprigatito', 'fuecoco', 'quaxly'
)
and pf.is_default = true
on conflict (pokemon_form_id, generation_id) do nothing;

commit; 