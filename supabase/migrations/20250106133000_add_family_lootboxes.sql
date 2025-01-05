-- Enable required extensions
create extension if not exists moddatetime schema extensions;

-- Create an enum for Pokémon rarity tiers
create type pokemon_rarity as enum (
  'common',
  'uncommon',
  'rare',
  'legendary'
);

-- Create an enum for reward types
create type reward_type as enum (
  'poke_ball',
  'great_ball',
  'ultra_ball',
  'master_ball',
  'pokemon'
);

-- Create table for family lootbox configurations
create table family_lootboxes (
  id bigint generated always as identity primary key,
  family_id uuid not null references family_profiles(id) on delete cascade,
  name text not null,
  description text,
  rarity pokemon_rarity not null,
  cost_amount integer not null check (cost_amount > 0),
  cost_type reward_type not null,
  buff_percentage decimal check (buff_percentage >= 0 and buff_percentage <= 1),
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create table for lootbox pokemon pools
create table lootbox_pokemon_pools (
  id bigint generated always as identity primary key,
  lootbox_id bigint not null references family_lootboxes(id) on delete cascade,
  pokemon_id integer not null,
  rarity pokemon_rarity not null,
  weight decimal not null check (weight > 0),
  created_at timestamptz default now() not null
);

-- Create table for lootbox rewards history
create table lootbox_rewards (
  id bigint generated always as identity primary key,
  family_id uuid not null references family_profiles(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  lootbox_id bigint not null references family_lootboxes(id) on delete cascade,
  pokemon_id integer not null,
  rarity pokemon_rarity not null,
  cost_amount integer not null,
  cost_type reward_type not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table family_lootboxes enable row level security;
alter table lootbox_pokemon_pools enable row level security;
alter table lootbox_rewards enable row level security;

-- Policies for family_lootboxes

-- View lootboxes
create policy "Family members can view their family's lootboxes"
on family_lootboxes
for select
to authenticated
using (
  family_id in (
    select family_id 
    from family_members 
    where id = auth.uid()
  )
);

-- Create/edit lootboxes (admin/parent roles only)
create policy "Admins and parents can create and edit lootboxes"
on family_lootboxes
for all
to authenticated
using (
  exists (
    select 1 
    from family_members fm
    join roles r on fm.role_id = r.id
    where fm.id = auth.uid()
    and fm.family_id = family_lootboxes.family_id
    and r.name in ('admin', 'parent')
  )
);

-- Policies for lootbox_pokemon_pools

-- View pokemon pools
create policy "Family members can view their family's pokemon pools"
on lootbox_pokemon_pools
for select
to authenticated
using (
  exists (
    select 1 
    from family_lootboxes fl
    join family_members fm on fl.family_id = fm.family_id
    where fl.id = lootbox_pokemon_pools.lootbox_id
    and fm.id = auth.uid()
  )
);

-- Manage pokemon pools (admin/parent roles only)
create policy "Admins and parents can manage pokemon pools"
on lootbox_pokemon_pools
for all
to authenticated
using (
  exists (
    select 1 
    from family_lootboxes fl
    join family_members fm on fl.family_id = fm.family_id
    join roles r on fm.role_id = r.id
    where fl.id = lootbox_pokemon_pools.lootbox_id
    and fm.id = auth.uid()
    and r.name in ('admin', 'parent')
  )
);

-- Policies for lootbox_rewards

-- View rewards
create policy "Family members can view their family's rewards"
on lootbox_rewards
for select
to authenticated
using (
  family_id in (
    select family_id 
    from family_members 
    where id = auth.uid()
  )
);

-- Record rewards (happens automatically when opening lootboxes)
create policy "System can record rewards"
on lootbox_rewards
for insert
to authenticated
with check (
  exists (
    select 1 
    from family_members 
    where id = auth.uid()
    and id = lootbox_rewards.member_id
  )
);

-- Add moddatetime trigger for updated_at
drop trigger if exists handle_updated_at on family_lootboxes;
create trigger handle_updated_at
  before update on family_lootboxes
  for each row
  execute function moddatetime(updated_at);

-- Add helpful comments
comment on table family_lootboxes is 'Configurable lootboxes for each family''s reward system';
comment on table lootbox_pokemon_pools is 'Pokemon available in each family''s lootboxes with their weights';
comment on table lootbox_rewards is 'History of rewards obtained from lootboxes'; 