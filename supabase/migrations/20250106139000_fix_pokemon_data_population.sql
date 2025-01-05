-- Migration: Fix Pokemon Data Population
-- Description: Ensures Pokemon data is properly populated before creating loot boxes
-- Dependencies: Requires previous migrations to be applied first

begin transaction;

-- Step 1: Ensure Pokemon data exists
update pokemon set
    name = 'pidgey',
    types = '{normal,flying}',
    stats = cast('{"hp": 40, "attack": 45, "defense": 40, "special-attack": 35, "special-defense": 35, "speed": 56}' as jsonb),
    sprites = cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png"}' as jsonb),
    updated_at = now()
where id = 16;

update pokemon set
    name = 'tyranitar',
    types = '{rock,dark}',
    stats = cast('{"hp": 100, "attack": 134, "defense": 110, "special-attack": 95, "special-defense": 100, "speed": 61}' as jsonb),
    sprites = cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/248.png"}' as jsonb),
    updated_at = now()
where id = 248;

-- Step 2: Create default lootboxes for each family
delete from family_lootboxes where name in ('Poké Ball Pack', 'Great Ball Pack', 'Ultra Ball Pack', 'Master Ball Pack');

-- Poké Ball Pack (Common)
insert into family_lootboxes (family_id, name, description, rarity, cost_type, cost_amount, buff_percentage, is_active, symbol, guaranteed_slots, max_per_pack)
select 
    fp.id,
    'Poké Ball Pack',
    'A basic pack containing common Pokémon',
    cast('common' as pokemon_rarity),
    cast('poke_ball' as reward_type),
    25, -- 25 pokeballs
    0.0,
    true,
    '◇1',
    5,
    6
from family_profiles fp;

-- Great Ball Pack (Uncommon)
insert into family_lootboxes (family_id, name, description, rarity, cost_type, cost_amount, buff_percentage, is_active, symbol, guaranteed_slots, max_per_pack)
select 
    fp.id,
    'Great Ball Pack',
    'An enhanced pack with better chances for rare Pokémon',
    cast('uncommon' as pokemon_rarity),
    cast('great_ball' as reward_type),
    50, -- 50 pokeballs
    0.1, -- 10% buff
    true,
    '◇2',
    4,
    5
from family_profiles fp;

-- Ultra Ball Pack (Rare)
insert into family_lootboxes (family_id, name, description, rarity, cost_type, cost_amount, buff_percentage, is_active, symbol, guaranteed_slots, max_per_pack)
select 
    fp.id,
    'Ultra Ball Pack',
    'A premium pack with high chances for rare and ultra rare Pokémon',
    cast('rare' as pokemon_rarity),
    cast('ultra_ball' as reward_type),
    75, -- 75 pokeballs
    0.2, -- 20% buff
    true,
    '◇3',
    3,
    4
from family_profiles fp;

-- Master Ball Pack (Ultra Rare)
insert into family_lootboxes (family_id, name, description, rarity, cost_type, cost_amount, buff_percentage, is_active, symbol, guaranteed_slots, max_per_pack)
select 
    fp.id,
    'Master Ball Pack',
    'The ultimate pack with guaranteed ultra rare Pokémon',
    cast('ultra_rare' as pokemon_rarity),
    cast('master_ball' as reward_type),
    100, -- 100 pokeballs
    0.3, -- 30% buff
    true,
    '◇4',
    1,
    3
from family_profiles fp;

-- Step 3: Populate Pokemon pools for each lootbox
delete from lootbox_pokemon_pools where pokemon_id in (16, 248);

insert into lootbox_pokemon_pools (lootbox_id, pokemon_id, pokemon_name, rarity, weight, variant, is_shiny)
select 
    fl.id,
    p.id,
    p.name,
    fl.rarity,
    1.0,
    cast('normal' as pokemon_variant),
    false
from family_lootboxes fl
join pokemon p on p.id in (
    case when fl.cost_type = 'poke_ball' then 16
         when fl.cost_type = 'master_ball' then 248
    end
);

commit transaction; 