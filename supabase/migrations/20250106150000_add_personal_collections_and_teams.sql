-- Migration: Add Personal Collections and Teams
-- Description: Creates tables for managing personal Pokémon collections and teams
-- Author: CODE MNKY

begin;

-- Create personal_pokemon_collections table first
create table personal_pokemon_collections (
  id bigint generated always as identity primary key,
  member_id uuid references family_members(id) on delete cascade not null,
  pokemon_id integer not null,
  nickname text,
  level integer default 1,
  experience_points integer default 0,
  friendship integer default 0,
  nature text,
  ability text,
  held_item text,
  -- Competitive Stats
  ev_hp integer default 0 check (ev_hp between 0 and 252),
  ev_attack integer default 0 check (ev_attack between 0 and 252),
  ev_defense integer default 0 check (ev_defense between 0 and 252),
  ev_special_attack integer default 0 check (ev_special_attack between 0 and 252),
  ev_special_defense integer default 0 check (ev_special_defense between 0 and 252),
  ev_speed integer default 0 check (ev_speed between 0 and 252),
  -- Ensure total EVs don't exceed 510
  constraint total_evs check (
    coalesce(ev_hp, 0) + 
    coalesce(ev_attack, 0) + 
    coalesce(ev_defense, 0) + 
    coalesce(ev_special_attack, 0) + 
    coalesce(ev_special_defense, 0) + 
    coalesce(ev_speed, 0) <= 510
  ),
  -- IVs (0-31)
  iv_hp integer default 31 check (iv_hp between 0 and 31),
  iv_attack integer default 31 check (iv_attack between 0 and 31),
  iv_defense integer default 31 check (iv_defense between 0 and 31),
  iv_special_attack integer default 31 check (iv_special_attack between 0 and 31),
  iv_special_defense integer default 31 check (iv_special_defense between 0 and 31),
  iv_speed integer default 31 check (iv_speed between 0 and 31),
  -- Moves
  move_1 text,
  move_2 text,
  move_3 text,
  move_4 text,
  -- Metadata
  obtained_at timestamptz default now() not null,
  obtained_from text not null,
  is_favorite boolean default false,
  is_starter boolean default false,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  constraint valid_level check (level >= 1 and level <= 100),
  constraint valid_friendship check (friendship >= 0 and friendship <= 255),
  constraint valid_nature check (nature in (
    'hardy', 'lonely', 'brave', 'adamant', 'naughty',
    'bold', 'docile', 'relaxed', 'impish', 'lax',
    'timid', 'hasty', 'serious', 'jolly', 'naive',
    'modest', 'mild', 'quiet', 'bashful', 'rash',
    'calm', 'gentle', 'sassy', 'careful', 'quirky'
  ))
);

-- Create pokemon_teams table with competitive focus
create table pokemon_teams (
  id bigint generated always as identity primary key,
  member_id uuid references family_members(id) on delete cascade not null,
  name text not null,
  description text,
  team_format text not null default 'standard', -- standard, doubles, etc.
  team_style text, -- offensive, defensive, balanced, etc.
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create pokemon_team_members table with role information
create table pokemon_team_members (
  id bigint generated always as identity primary key,
  team_id bigint references pokemon_teams(id) on delete cascade not null,
  collection_id bigint references personal_pokemon_collections(id) on delete cascade not null,
  slot_number integer not null check (slot_number between 1 and 6),
  team_role text, -- sweeper, wall, support, etc.
  notes text, -- strategy notes
  created_at timestamptz default now() not null,
  
  -- Ensure each Pokémon only appears once in a team
  unique(team_id, collection_id),
  -- Ensure each slot in a team is unique
  unique(team_id, slot_number)
);

-- Function to add starter Pokémon to personal collection
create or replace function add_starter_to_collection()
returns trigger as $$
begin
  -- Only proceed if this is a new starter Pokémon assignment
  if new.starter_pokemon_form_id is not null and 
     (old.starter_pokemon_form_id is null or new.starter_pokemon_form_id != old.starter_pokemon_form_id) then
    
    insert into personal_pokemon_collections (
      member_id,
      pokemon_id,
      nickname,
      level,
      experience_points,
      friendship,
      nature,
      move_1,
      move_2,
      move_3,
      move_4,
      obtained_from,
      is_starter
    ) values (
      new.id,
      new.starter_pokemon_form_id,
      new.starter_pokemon_nickname,
      1, -- Starting level
      0, -- Initial experience
      70, -- Base friendship
      new.starter_pokemon_nature,
      new.starter_pokemon_move_1,
      new.starter_pokemon_move_2,
      new.starter_pokemon_move_3,
      new.starter_pokemon_move_4,
      'starter_selection',
      true
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to add starter to collection
create trigger add_starter_to_collection_on_update
  after update of starter_pokemon_form_id on family_members
  for each row
  execute function add_starter_to_collection();

-- Add trigger to update family_pokedex when a new Pokémon is added to personal collection
create or replace function update_family_pokedex()
returns trigger as $$
begin
  insert into family_pokedex (family_id, pokemon_form_id, first_caught_at, caught_count)
  select 
    fm.family_id,
    new.pokemon_id,
    new.obtained_at,
    1
  from family_members fm
  where fm.id = new.member_id
  on conflict (family_id, pokemon_form_id) 
  do update set 
    caught_count = family_pokedex.caught_count + 1;
  return new;
end;
$$ language plpgsql security definer;

create trigger update_family_pokedex_on_collection_insert
  after insert on personal_pokemon_collections
  for each row
  execute function update_family_pokedex();

-- Enable RLS
alter table personal_pokemon_collections enable row level security;
alter table pokemon_teams enable row level security;
alter table pokemon_team_members enable row level security;

-- RLS Policies for personal_pokemon_collections
create policy "Users can view their own collection"
  on personal_pokemon_collections for select
  to authenticated
  using (member_id = auth.uid());

create policy "Users can manage their own collection"
  on personal_pokemon_collections for all
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- RLS Policies for pokemon_teams
create policy "Users can view their own teams"
  on pokemon_teams for select
  to authenticated
  using (member_id = auth.uid());

create policy "Users can manage their own teams"
  on pokemon_teams for all
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- RLS Policies for pokemon_team_members
create policy "Users can view their own team members"
  on pokemon_team_members for select
  to authenticated
  using (
    exists (
      select 1 from pokemon_teams
      where pokemon_teams.id = team_id
      and pokemon_teams.member_id = auth.uid()
    )
  );

create policy "Users can manage their own team members"
  on pokemon_team_members for all
  to authenticated
  using (
    exists (
      select 1 from pokemon_teams
      where pokemon_teams.id = team_id
      and pokemon_teams.member_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from pokemon_teams
      where pokemon_teams.id = team_id
      and pokemon_teams.member_id = auth.uid()
    )
  );

-- Add helpful comments
comment on table personal_pokemon_collections is 'Stores individual Pokémon owned by family members, including competitive stats';
comment on table pokemon_teams is 'Stores Pokémon teams with competitive format information';
comment on table pokemon_team_members is 'Maps Pokémon from personal collections to team slots with competitive roles';

commit; 