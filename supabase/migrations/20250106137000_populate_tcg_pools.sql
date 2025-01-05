-- Migration: Populate TCG-Style Lootbox System
-- Description: Populates the lootbox system with TCG-accurate Pokemon data and default lootboxes
-- Dependencies: Requires 20250106136000_update_lootbox_system.sql to be applied first
-- Tables Modified: pokemon, family_lootboxes, lootbox_pokemon_pools

-- Step 1: Populate Pokemon table with base data for each rarity tier
insert into pokemon (id, name, types, stats, sprites)
values 
    -- Common Pool (Basic Pokemon)
    (16, 'pidgey', array['normal', 'flying'], 
        '{"hp": 40, "attack": 45, "defense": 40, "special-attack": 35, "special-defense": 35, "speed": 56}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png"}'::jsonb),
    (19, 'rattata', array['normal'], 
        '{"hp": 30, "attack": 56, "defense": 35, "special-attack": 25, "special-defense": 35, "speed": 72}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png"}'::jsonb),
    (10, 'caterpie', array['bug'], 
        '{"hp": 45, "attack": 30, "defense": 35, "special-attack": 20, "special-defense": 20, "speed": 45}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png"}'::jsonb),
    (13, 'weedle', array['bug', 'poison'], 
        '{"hp": 40, "attack": 35, "defense": 30, "special-attack": 20, "special-defense": 20, "speed": 50}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/13.png"}'::jsonb),
    (41, 'zubat', array['poison', 'flying'], 
        '{"hp": 40, "attack": 45, "defense": 35, "special-attack": 30, "special-defense": 40, "speed": 55}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png"}'::jsonb),
    (43, 'oddish', array['grass', 'poison'], 
        '{"hp": 45, "attack": 50, "defense": 55, "special-attack": 75, "special-defense": 65, "speed": 30}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/43.png"}'::jsonb),
    (129, 'magikarp', array['water'], 
        '{"hp": 20, "attack": 10, "defense": 55, "special-attack": 15, "special-defense": 20, "speed": 80}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png"}'::jsonb),

    -- Uncommon Pool
    (25, 'pikachu', array['electric'], 
        '{"hp": 35, "attack": 55, "defense": 40, "special-attack": 50, "special-defense": 50, "speed": 90}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"}'::jsonb),
    (133, 'eevee', array['normal'], 
        '{"hp": 55, "attack": 55, "defense": 50, "special-attack": 45, "special-defense": 65, "speed": 55}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png"}'::jsonb),
    (5, 'charmeleon', array['fire'], 
        '{"hp": 58, "attack": 64, "defense": 58, "special-attack": 80, "special-defense": 65, "speed": 80}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png"}'::jsonb),
    (8, 'wartortle', array['water'], 
        '{"hp": 59, "attack": 63, "defense": 80, "special-attack": 65, "special-defense": 80, "speed": 58}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png"}'::jsonb),
    (2, 'ivysaur', array['grass', 'poison'], 
        '{"hp": 60, "attack": 62, "defense": 63, "special-attack": 80, "special-defense": 80, "speed": 60}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png"}'::jsonb),
    (64, 'kadabra', array['psychic'], 
        '{"hp": 40, "attack": 35, "defense": 30, "special-attack": 120, "special-defense": 70, "speed": 105}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/64.png"}'::jsonb),

    -- Rare Pool
    (6, 'charizard', array['fire', 'flying'], 
        '{"hp": 78, "attack": 84, "defense": 78, "special-attack": 109, "special-defense": 85, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"}'::jsonb),
    (9, 'blastoise', array['water'], 
        '{"hp": 79, "attack": 83, "defense": 100, "special-attack": 85, "special-defense": 105, "speed": 78}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png"}'::jsonb),
    (3, 'venusaur', array['grass', 'poison'], 
        '{"hp": 80, "attack": 82, "defense": 83, "special-attack": 100, "special-defense": 100, "speed": 80}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png"}'::jsonb),
    (149, 'dragonite', array['dragon', 'flying'], 
        '{"hp": 91, "attack": 134, "defense": 95, "special-attack": 100, "special-defense": 100, "speed": 80}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png"}'::jsonb),
    (130, 'gyarados', array['water', 'flying'], 
        '{"hp": 95, "attack": 125, "defense": 79, "special-attack": 60, "special-defense": 100, "speed": 81}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png"}'::jsonb),
    (143, 'snorlax', array['normal'], 
        '{"hp": 160, "attack": 110, "defense": 65, "special-attack": 65, "special-defense": 110, "speed": 30}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png"}'::jsonb),

    -- Ultra Rare Pool
    (248, 'tyranitar', array['rock', 'dark'], 
        '{"hp": 100, "attack": 134, "defense": 110, "special-attack": 95, "special-defense": 100, "speed": 61}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/248.png"}'::jsonb),
    (373, 'salamence', array['dragon', 'flying'], 
        '{"hp": 95, "attack": 135, "defense": 80, "special-attack": 110, "special-defense": 80, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/373.png"}'::jsonb),
    (376, 'metagross', array['steel', 'psychic'], 
        '{"hp": 80, "attack": 135, "defense": 130, "special-attack": 95, "special-defense": 90, "speed": 70}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/376.png"}'::jsonb),
    (445, 'garchomp', array['dragon', 'ground'], 
        '{"hp": 108, "attack": 130, "defense": 95, "special-attack": 80, "special-defense": 85, "speed": 102}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/445.png"}'::jsonb),

    -- Secret Rare Pool (Legendary Birds + Beasts)
    (144, 'articuno', array['ice', 'flying'], 
        '{"hp": 90, "attack": 85, "defense": 100, "special-attack": 95, "special-defense": 125, "speed": 85}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png"}'::jsonb),
    (145, 'zapdos', array['electric', 'flying'], 
        '{"hp": 90, "attack": 90, "defense": 85, "special-attack": 125, "special-defense": 90, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png"}'::jsonb),
    (146, 'moltres', array['fire', 'flying'], 
        '{"hp": 90, "attack": 100, "defense": 90, "special-attack": 125, "special-defense": 85, "speed": 90}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png"}'::jsonb),
    (243, 'raikou', array['electric'], 
        '{"hp": 90, "attack": 85, "defense": 75, "special-attack": 115, "special-defense": 100, "speed": 115}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/243.png"}'::jsonb),
    (244, 'entei', array['fire'], 
        '{"hp": 115, "attack": 115, "defense": 85, "special-attack": 90, "special-defense": 75, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/244.png"}'::jsonb),
    (245, 'suicune', array['water'], 
        '{"hp": 100, "attack": 75, "defense": 115, "special-attack": 90, "special-defense": 115, "speed": 85}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png"}'::jsonb),

    -- Hyper Rare Pool (Major Legendaries)
    (150, 'mewtwo', array['psychic'], 
        '{"hp": 106, "attack": 110, "defense": 90, "special-attack": 154, "special-defense": 90, "speed": 130}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png"}'::jsonb),
    (249, 'lugia', array['psychic', 'flying'], 
        '{"hp": 106, "attack": 90, "defense": 130, "special-attack": 90, "special-defense": 154, "speed": 110}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png"}'::jsonb),
    (250, 'ho-oh', array['fire', 'flying'], 
        '{"hp": 106, "attack": 130, "defense": 90, "special-attack": 110, "special-defense": 154, "speed": 90}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png"}'::jsonb),
    (384, 'rayquaza', array['dragon', 'flying'], 
        '{"hp": 105, "attack": 150, "defense": 90, "special-attack": 150, "special-defense": 90, "speed": 95}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png"}'::jsonb),

    -- Crown Rare Pool (Mythicals)
    (151, 'mew', array['psychic'], 
        '{"hp": 100, "attack": 100, "defense": 100, "special-attack": 100, "special-defense": 100, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png"}'::jsonb),
    (251, 'celebi', array['psychic', 'grass'], 
        '{"hp": 100, "attack": 100, "defense": 100, "special-attack": 100, "special-defense": 100, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/251.png"}'::jsonb),
    (385, 'jirachi', array['steel', 'psychic'], 
        '{"hp": 100, "attack": 100, "defense": 100, "special-attack": 100, "special-defense": 100, "speed": 100}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/385.png"}'::jsonb),
    (386, 'deoxys', array['psychic'], 
        '{"hp": 50, "attack": 150, "defense": 50, "special-attack": 150, "special-defense": 50, "speed": 150}'::jsonb,
        '{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/386.png"}'::jsonb)

on conflict (id) do update set
    name = excluded.name,
    types = excluded.types,
    stats = excluded.stats,
    sprites = excluded.sprites,
    updated_at = now();

-- Step 2: Create default TCG-style lootboxes for each family
insert into family_lootboxes (
    family_id,
    name,
    description,
    rarity,
    cost_type,
    cost_amount,
    buff_percentage,
    is_active,
    symbol,
    guaranteed_slots,
    max_per_pack
)
select 
    fp.id as family_id,
    case r.rarity
        when 'common' then 'Common PokéPack'
        when 'uncommon' then 'Great PokéPack'
        when 'rare' then 'Ultra PokéPack'
        when 'ultra_rare' then 'Master PokéPack'
        when 'secret_rare' then 'Secret PokéPack'
        when 'special_rare' then 'Special PokéPack'
        when 'hyper_rare' then 'Hyper PokéPack'
        when 'crown_rare' then 'Crown PokéPack'
    end as name,
    case r.rarity
        when 'common' then 'A basic pack containing common Pokémon'
        when 'uncommon' then 'A pack with a chance for uncommon Pokémon'
        when 'rare' then 'A pack containing at least one rare Pokémon'
        when 'ultra_rare' then 'A special pack with ultra rare Pokémon'
        when 'secret_rare' then 'A pack containing legendary bird or beast Pokémon'
        when 'special_rare' then 'A pack with special variant Pokémon'
        when 'hyper_rare' then 'A pack containing major legendary Pokémon'
        when 'crown_rare' then 'A mythical pack with the rarest Pokémon'
    end as description,
    r.rarity::pokemon_rarity as rarity,
    case r.rarity
        when 'common' then 'poke_ball'::reward_type
        when 'uncommon' then 'great_ball'::reward_type
        when 'rare' then 'ultra_ball'::reward_type
        else 'master_ball'::reward_type
    end as cost_type,
    case r.rarity
        when 'common' then 1
        when 'uncommon' then 3
        when 'rare' then 5
        when 'ultra_rare' then 10
        when 'secret_rare' then 15
        when 'special_rare' then 20
        when 'hyper_rare' then 25
        when 'crown_rare' then 50
    end as cost_amount,
    0 as buff_percentage,
    true as is_active,
    case r.rarity
        when 'common' then '◇1'
        when 'uncommon' then '◇2'
        when 'rare' then '◇3'
        when 'ultra_rare' then '◇4'
        when 'secret_rare' then '★1'
        when 'special_rare' then '★2'
        when 'hyper_rare' then '★3'
        when 'crown_rare' then '👑'
    end as symbol,
    case r.rarity
        when 'common' then 3
        when 'uncommon' then 1
        when 'rare' then 1
        else null
    end as guaranteed_slots,
    case r.rarity
        when 'common' then 3
        when 'uncommon' then 2
        when 'rare' then 1
        else null
    end as max_per_pack
from family_profiles fp
cross join (
    select unnest(enum_range(null::pokemon_rarity)) as rarity
) r
on conflict do nothing;

-- Step 3: Populate Pokemon pools for each lootbox with appropriate variants
insert into lootbox_pokemon_pools (
    lootbox_id,
    pokemon_id,
    pokemon_name,
    rarity,
    weight,
    variant,
    is_shiny
)
select 
    fl.id as lootbox_id,
    p.id as pokemon_id,
    p.name as pokemon_name,
    fl.rarity,
    1.0 as weight,
    case 
        when p.id = 6 and fl.rarity = 'special_rare' then 'mega'::pokemon_variant
        when p.id = 150 and fl.rarity = 'special_rare' then 'mega'::pokemon_variant
        when p.id = 384 and fl.rarity = 'special_rare' then 'mega'::pokemon_variant
        when p.id = 6 and fl.rarity = 'special_rare' then 'gmax'::pokemon_variant
        else 'normal'::pokemon_variant
    end as variant,
    false as is_shiny
from family_lootboxes fl
cross join pokemon p
where 
    (fl.rarity = 'common' and p.id in (16, 19, 10, 13, 41, 43, 129)) or
    (fl.rarity = 'uncommon' and p.id in (25, 133, 5, 8, 2, 64)) or
    (fl.rarity = 'rare' and p.id in (6, 9, 3, 149, 130, 143)) or
    (fl.rarity = 'ultra_rare' and p.id in (248, 373, 376, 445)) or
    (fl.rarity = 'secret_rare' and p.id in (144, 145, 146, 243, 244, 245)) or
    (fl.rarity = 'special_rare' and p.id in (6, 150, 384)) or
    (fl.rarity = 'hyper_rare' and p.id in (150, 249, 250, 384)) or
    (fl.rarity = 'crown_rare' and p.id in (151, 251, 385, 386))
on conflict do nothing; 