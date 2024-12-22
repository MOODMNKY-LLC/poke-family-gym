-- Migration: Pokemon Schema Setup
-- Description: Creates the base Pokemon tables needed for the family management system
-- Author: CODE MNKY

-- Create base Pokemon tables needed for family management
create table generations (
  id bigint primary key,
  name text not null unique,
  main_region_id bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table pokemon_species (
  id bigint primary key,
  name text not null unique,
  generation_id bigint references generations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table pokemon_forms (
  id bigint primary key,
  name text not null,
  species_id bigint references pokemon_species(id),
  is_default boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table generations enable row level security;
alter table pokemon_species enable row level security;
alter table pokemon_forms enable row level security;

-- Add public read access policies
create policy "Anyone can view generations" on generations for select using (true);
create policy "Anyone can view pokemon_species" on pokemon_species for select using (true);
create policy "Anyone can view pokemon_forms" on pokemon_forms for select using (true);

-- Insert Gen 1 data for starters
insert into generations (id, name) values (1, 'generation-i');

-- Insert starter Pokemon species
insert into pokemon_species (id, name, generation_id) values 
  (1, 'bulbasaur', 1),
  (4, 'charmander', 1),
  (7, 'squirtle', 1);

-- Insert default forms for starters
insert into pokemon_forms (id, name, species_id, is_default) values 
  (1, 'bulbasaur', 1, true),
  (4, 'charmander', 4, true),
  (7, 'squirtle', 7, true); 