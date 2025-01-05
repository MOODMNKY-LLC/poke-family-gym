-- Migration: Update Lootbox System for TCG-Style Mechanics
-- Description: Enhances the lootbox system with TCG-style rarity tiers, variants, and pack mechanics
-- Affected Tables: family_lootboxes, lootbox_pokemon_pools, lootbox_rewards
-- Special Considerations: Migrates existing 'legendary' rarity to 'hyper_rare'

-- Step 1: Create new enum types
do $$ begin
    -- Safely drop existing enum if needed
    if exists (select 1 from pg_type where typname = 'pokemon_rarity') then
        alter type pokemon_rarity rename to pokemon_rarity_old;
    end if;
end $$;

create type pokemon_rarity as enum (
    'common',
    'uncommon',
    'rare',
    'ultra_rare',
    'secret_rare',
    'special_rare',
    'hyper_rare',
    'crown_rare'
);

create type pokemon_variant as enum (
    'normal',
    'special',
    'regional',
    'mega',
    'gmax'
);

-- Step 2: Migrate existing data with type conversion
-- family_lootboxes
alter table family_lootboxes 
    alter column rarity type text;

update family_lootboxes set
    rarity = case rarity
        when 'legendary' then 'hyper_rare'
        else rarity
    end;

alter table family_lootboxes 
    alter column rarity type pokemon_rarity using rarity::pokemon_rarity;

-- lootbox_pokemon_pools
alter table lootbox_pokemon_pools 
    alter column rarity type text;

update lootbox_pokemon_pools set
    rarity = case rarity
        when 'legendary' then 'hyper_rare'
        else rarity
    end;

alter table lootbox_pokemon_pools 
    alter column rarity type pokemon_rarity using rarity::pokemon_rarity;

-- lootbox_rewards
alter table lootbox_rewards
    alter column rarity type text;

update lootbox_rewards set
    rarity = case rarity
        when 'legendary' then 'hyper_rare'
        else rarity
    end;

alter table lootbox_rewards
    alter column rarity type pokemon_rarity using rarity::pokemon_rarity;

-- Step 3: Add TCG-specific columns
-- family_lootboxes enhancements
alter table family_lootboxes
    add column if not exists symbol text,
    add column if not exists guaranteed_slots integer,
    add column if not exists max_per_pack integer;

-- lootbox_pokemon_pools enhancements
alter table lootbox_pokemon_pools
    add column if not exists variant pokemon_variant default 'normal',
    add column if not exists is_shiny boolean default false;

-- lootbox_rewards enhancements
alter table lootbox_rewards
    add column if not exists variant pokemon_variant default 'normal',
    add column if not exists is_shiny boolean default false;

-- Step 4: Add helpful comments
comment on type pokemon_rarity is 'TCG-style rarity tiers for Pokemon';
comment on type pokemon_variant is 'Special forms a Pokemon can take';
comment on column family_lootboxes.symbol is 'Visual indicator of the lootbox rarity (e.g., ◇1, ★2, 👑)';
comment on column family_lootboxes.guaranteed_slots is 'Number of guaranteed cards of this rarity in the pack';
comment on column family_lootboxes.max_per_pack is 'Maximum number of cards of this rarity allowed in a pack';
comment on column lootbox_pokemon_pools.variant is 'Special form of the Pokemon (e.g., Mega, Gmax)';
comment on column lootbox_pokemon_pools.is_shiny is 'Whether this is a shiny variant';
comment on column lootbox_rewards.variant is 'Special form of the rewarded Pokemon';
comment on column lootbox_rewards.is_shiny is 'Whether the rewarded Pokemon is shiny';

-- Step 5: Cleanup
do $$ begin
    if exists (select 1 from pg_type where typname = 'pokemon_rarity_old') then
        drop type pokemon_rarity_old;
    end if;
end $$; 