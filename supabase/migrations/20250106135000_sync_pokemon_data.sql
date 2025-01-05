-- Migration: Sync Pokémon Data from PokeAPI
-- Description: Creates and populates Pokémon data tables with initial data
-- Author: CODE MNKY

-- Create a comprehensive pokemon table
create table if not exists pokemon (
  id integer primary key,
  name text not null,
  types text[] not null,
  stats jsonb not null,
  sprites jsonb not null,
  height integer,
  weight integer,
  base_experience integer,
  is_default boolean default true,
  species_id integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists pokemon_name_idx on pokemon using gin (name gin_trgm_ops);
create index if not exists pokemon_types_idx on pokemon using gin (types);

-- Create a function to sync Pokémon data
create or replace function sync_pokemon_data(start_id integer, end_id integer)
returns void
language plpgsql
security definer
as $$
begin
  -- Function will be implemented in the application layer
  -- This is just a placeholder for the schema
  raise notice 'Sync pokemon data from % to %', start_id, end_id;
end;
$$;

-- Create initial pokemon pools for testing
insert into pokemon (id, name, types, stats, sprites)
values 
  (1, 'bulbasaur', array['grass', 'poison'], 
    '{"hp": 45, "attack": 49, "defense": 49, "special-attack": 65, "special-defense": 65, "speed": 45}'::jsonb,
    '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"}'::jsonb),
  (4, 'charmander', array['fire'], 
    '{"hp": 39, "attack": 52, "defense": 43, "special-attack": 60, "special-defense": 50, "speed": 65}'::jsonb,
    '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png"}'::jsonb),
  (7, 'squirtle', array['water'], 
    '{"hp": 44, "attack": 48, "defense": 65, "special-attack": 50, "special-defense": 64, "speed": 43}'::jsonb,
    '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png"}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  types = excluded.types,
  stats = excluded.stats,
  sprites = excluded.sprites,
  updated_at = now();

-- Create some initial lootbox pools for testing
insert into lootbox_pokemon_pools (lootbox_id, pokemon_id, rarity, weight)
select 
  lb.id,
  p.id,
  'common'::pokemon_rarity,
  1.0
from pokemon p
cross join (
  select id 
  from family_lootboxes 
  where is_active = true 
  limit 1
) lb
where p.id in (1, 4, 7)
on conflict do nothing;

-- Enable RLS
alter table pokemon enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Pokemon data is viewable by all users" on pokemon;
drop policy if exists "Pokemon data is modifiable by admins and parents" on pokemon;

-- Create policies
create policy "Pokemon data is viewable by all users"
  on pokemon for select
  to authenticated
  using (true);

create policy "Pokemon data is modifiable by admins and parents"
  on pokemon for all
  to authenticated
  using (
    exists (
      select 1 
      from family_members fm
      join roles r on r.id = fm.role_id
      where fm.id = auth.uid()
      and r.name in ('admin', 'parent')
    )
  );

-- Add helpful comments
comment on table pokemon is 'Comprehensive Pokémon data synced from PokeAPI';
comment on function sync_pokemon_data is 'Function to sync Pokémon data from PokeAPI in batches'; 