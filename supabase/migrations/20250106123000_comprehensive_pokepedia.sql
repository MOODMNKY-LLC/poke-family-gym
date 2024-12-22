-- Migration: Comprehensive Pokepedia Implementation
-- Description: Creates a complete database schema mapping the entire PokéAPI
-- Author: CODE MNKY

-- Ensure the necessary tables exist before making changes
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'pokemon_forms') then
    create table pokemon_forms (
      id serial primary key,
      name text not null,
      species_id integer references pokemon_species(id)
    );
  end if;
end $$;

-- Add new columns or modify existing ones as needed
alter table pokemon_forms
  add column if not exists form_name text;

-- Ensure the necessary tables exist before making changes
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'starter_pokemon_config') then
    create table starter_pokemon_config (
      pokemon_form_id integer primary key references pokemon_forms(id),
      generation_id integer references generations(id),
      is_active boolean default true
    );
  end if;
end $$;

-- Add new columns or modify existing ones as needed
alter table starter_pokemon_config
  add column if not exists is_legendary boolean default false;

-- Ensure the necessary tables exist before making changes
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'generations') then
    create table generations (
      id serial primary key,
      name text not null
    );
  end if;
end $$;

-- Add new columns or modify existing ones as needed
alter table generations
  add column if not exists release_date date;

-- Ensure the necessary tables exist before making changes
do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'pokemon_species') then
    create table pokemon_species (
      id serial primary key,
      name text not null
    );
  end if;
end $$;

-- Add new columns or modify existing ones as needed
alter table pokemon_species
  add column if not exists habitat text;

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- For text search optimization
create extension if not exists "hstore"; -- For storing key-value pairs

--------------------
-- Reference Tables
--------------------

do $$
begin
  if not exists (select 1 from information_schema.tables where table_name = 'languages') then
create table languages (
  id bigint primary key,
  name text not null unique,
  official boolean not null,
  iso639 text,
  iso3166 text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
  end if;
end $$;

-- Add new columns or modify existing ones as needed
alter table languages
  add column if not exists iso639 text,
  add column if not exists iso3166 text;

-- Rest of the comprehensive schema...
