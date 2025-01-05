-- Migration: Populate Comprehensive Pokémon Pools
-- Description: Creates comprehensive pools of Pokémon for each loot box type
-- Dependencies: Requires previous migrations to be applied first

begin transaction;

-- Step 1: Clear existing pools to prevent duplicates
delete from lootbox_pokemon_pools;

-- Step 2: Populate pools for each loot box type
insert into lootbox_pokemon_pools (lootbox_id, pokemon_id, pokemon_name, rarity, weight, variant, is_shiny)
select 
    fl.id,
    p.id,
    p.name,
    fl.rarity,
    case
        -- Common Pokémon have higher weights in Poké Ball packs
        when fl.cost_type = 'poke_ball' and p.id in (19, 10) then 2.0
        -- Uncommon Pokémon have higher weights in Great Ball packs
        when fl.cost_type = 'great_ball' and p.id in (25, 133) then 1.5
        -- Rare Pokémon have higher weights in Ultra Ball packs
        when fl.cost_type = 'ultra_ball' and p.id in (149, 130) then 1.5
        -- All other combinations have normal weight
        else 1.0
    end as weight,
    'normal' as variant,
    case
        -- Higher chance of shiny for Master Ball packs
        when fl.cost_type = 'master_ball' and random() <= 0.1 then true
        else false
    end as is_shiny
from family_lootboxes fl
cross join pokemon p
where 
    -- Poké Ball Pack (Common + Uncommon)
    (fl.cost_type = 'poke_ball' and (
        (fl.rarity = 'common' and p.id in (19, 10)) or  -- Rattata, Caterpie
        (fl.rarity = 'uncommon' and p.id in (25, 133))  -- Pikachu, Eevee
    )) or
    -- Great Ball Pack (Uncommon + Rare)
    (fl.cost_type = 'great_ball' and (
        (fl.rarity = 'uncommon' and p.id in (25, 133)) or  -- Pikachu, Eevee
        (fl.rarity = 'rare' and p.id in (149, 130))  -- Dragonite, Gyarados
    )) or
    -- Ultra Ball Pack (Rare + Ultra Rare)
    (fl.cost_type = 'ultra_ball' and (
        (fl.rarity = 'rare' and p.id in (149, 130)) or  -- Dragonite, Gyarados
        (fl.rarity = 'ultra_rare' and p.id in (373, 376))  -- Salamence, Metagross
    )) or
    -- Master Ball Pack (Ultra Rare + Secret Rare + Special Rare + Hyper Rare + Crown Rare)
    (fl.cost_type = 'master_ball' and (
        (fl.rarity = 'ultra_rare' and p.id in (373, 376)) or  -- Salamence, Metagross
        (fl.rarity = 'secret_rare' and p.id in (144, 145, 146)) or  -- Legendary Birds
        (fl.rarity = 'special_rare' and p.id in (150)) or  -- Mewtwo
        (fl.rarity = 'hyper_rare' and p.id in (150, 249, 250)) or  -- Mewtwo, Lugia, Ho-Oh
        (fl.rarity = 'crown_rare' and p.id in (151, 251, 385))  -- Mew, Celebi, Jirachi
    ));

-- Step 3: Update the lootbox configurations
update family_lootboxes
set 
    guaranteed_slots = case
        when cost_type = 'poke_ball' then 5
        when cost_type = 'great_ball' then 4
        when cost_type = 'ultra_ball' then 3
        when cost_type = 'master_ball' then 1
    end,
    max_per_pack = case
        when cost_type = 'poke_ball' then 6
        when cost_type = 'great_ball' then 5
        when cost_type = 'ultra_ball' then 4
        when cost_type = 'master_ball' then 3
    end,
    buff_percentage = case
        when cost_type = 'poke_ball' then 0.0
        when cost_type = 'great_ball' then 0.1
        when cost_type = 'ultra_ball' then 0.2
        when cost_type = 'master_ball' then 0.3
    end
where is_active = true;

commit transaction; 