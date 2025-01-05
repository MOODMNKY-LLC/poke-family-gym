-- Migration: Populate Lootbox Pools
-- Description: Adds Pokémon to the lootbox pools based on their rarity
-- Dependencies: Requires default lootboxes and pokemon data to be populated first

begin transaction;

-- Add common Pokémon to Poké Ball packs
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
    cast('common' as pokemon_rarity) as rarity,
    case 
        when p.id = 19 then 60  -- Rattata (more common)
        when p.id = 10 then 40  -- Caterpie
    end as weight,
    'normal' as variant,
    false as is_shiny
from family_lootboxes fl
cross join pokemon p
where fl.cost_type = cast('poke_ball' as reward_type)
and p.id in (19, 10)  -- Common pool
and not exists (
    select 1 
    from lootbox_pokemon_pools lpp 
    where lpp.lootbox_id = fl.id 
    and lpp.pokemon_id = p.id
);

-- Add uncommon Pokémon to Great Ball packs
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
    cast('uncommon' as pokemon_rarity) as rarity,
    case 
        when p.id = 25 then 55  -- Pikachu (slightly more common)
        when p.id = 133 then 45  -- Eevee
    end as weight,
    'normal' as variant,
    false as is_shiny
from family_lootboxes fl
cross join pokemon p
where fl.cost_type = cast('great_ball' as reward_type)
and p.id in (25, 133)  -- Uncommon pool
and not exists (
    select 1 
    from lootbox_pokemon_pools lpp 
    where lpp.lootbox_id = fl.id 
    and lpp.pokemon_id = p.id
);

-- Add rare Pokémon to Ultra Ball packs
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
    cast('rare' as pokemon_rarity) as rarity,
    case 
        when p.id = 149 then 50  -- Dragonite
        when p.id = 130 then 50  -- Gyarados
    end as weight,
    'normal' as variant,
    false as is_shiny
from family_lootboxes fl
cross join pokemon p
where fl.cost_type = cast('ultra_ball' as reward_type)
and p.id in (149, 130)  -- Rare pool
and not exists (
    select 1 
    from lootbox_pokemon_pools lpp 
    where lpp.lootbox_id = fl.id 
    and lpp.pokemon_id = p.id
);

-- Add ultra rare and above Pokémon to Master Ball packs
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
    case
        when p.id in (373, 376) then cast('ultra_rare' as pokemon_rarity)
        when p.id in (144, 145, 146) then cast('secret_rare' as pokemon_rarity)
        when p.id in (150, 249, 250) then cast('hyper_rare' as pokemon_rarity)
        when p.id in (151, 251, 385) then cast('crown_rare' as pokemon_rarity)
    end as rarity,
    case 
        -- Ultra Rare (35% total)
        when p.id = 373 then 20  -- Salamence
        when p.id = 376 then 15  -- Metagross
        -- Secret Rare (30% total)
        when p.id = 144 then 10  -- Articuno
        when p.id = 145 then 10  -- Zapdos
        when p.id = 146 then 10  -- Moltres
        -- Hyper Rare (25% total)
        when p.id = 150 then 10  -- Mewtwo
        when p.id = 249 then 8   -- Lugia
        when p.id = 250 then 7   -- Ho-Oh
        -- Crown Rare (10% total)
        when p.id = 151 then 4   -- Mew
        when p.id = 251 then 3   -- Celebi
        when p.id = 385 then 3   -- Jirachi
    end as weight,
    'normal' as variant,
    false as is_shiny
from family_lootboxes fl
cross join pokemon p
where fl.cost_type = cast('master_ball' as reward_type)
and p.id in (
    373, 376,  -- Ultra Rare
    144, 145, 146,  -- Secret Rare
    150, 249, 250,  -- Hyper Rare
    151, 251, 385   -- Crown Rare
)
and not exists (
    select 1 
    from lootbox_pokemon_pools lpp 
    where lpp.lootbox_id = fl.id 
    and lpp.pokemon_id = p.id
);

commit transaction; 