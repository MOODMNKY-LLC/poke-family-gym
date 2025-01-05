-- Add pokemon_name column to lootbox_pokemon_pools with a temporary default
alter table lootbox_pokemon_pools 
  add column pokemon_name text not null default '';

-- Update existing rows with Pokemon names from the pokemon_id
update lootbox_pokemon_pools
set pokemon_name = pokemon_id::text;

-- Remove the default constraint
alter table lootbox_pokemon_pools 
  alter column pokemon_name drop default;

-- Add comment explaining the column
comment on column lootbox_pokemon_pools.pokemon_name is 'The name of the Pokemon for easier querying and display'; 