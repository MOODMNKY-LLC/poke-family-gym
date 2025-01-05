-- Migration: Create Default Pokéball Pack System
-- Description: Sets up the default Pokéball-themed loot boxes for each family
-- Dependencies: Requires previous lootbox system migrations

begin;

-- Create default Pokéball packs for each family
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
    case pack.ball_type
        when 'poke_ball' then 'Poké Ball Pack'
        when 'great_ball' then 'Great Ball Pack'
        when 'ultra_ball' then 'Ultra Ball Pack'
        when 'master_ball' then 'Master Ball Pack'
    end as name,
    case pack.ball_type
        when 'poke_ball' then 'A basic pack containing mostly common Pokémon with a chance for uncommon ones.'
        when 'great_ball' then 'An enhanced pack with guaranteed uncommon Pokémon and a chance for rare ones.'
        when 'ultra_ball' then 'A premium pack with guaranteed rare Pokémon and a chance for ultra rares.'
        when 'master_ball' then 'The ultimate pack with guaranteed ultra rare Pokémon and a chance for legendary ones.'
    end as description,
    case pack.ball_type
        when 'poke_ball' then cast('common' as pokemon_rarity)
        when 'great_ball' then cast('uncommon' as pokemon_rarity)
        when 'ultra_ball' then cast('rare' as pokemon_rarity)
        when 'master_ball' then cast('ultra_rare' as pokemon_rarity)
    end as rarity,
    cast(pack.ball_type as reward_type) as cost_type,
    case pack.ball_type
        when 'poke_ball' then 1
        when 'great_ball' then 3
        when 'ultra_ball' then 5
        when 'master_ball' then 10
    end as cost_amount,
    case pack.ball_type
        when 'poke_ball' then 0.0
        when 'great_ball' then 0.1
        when 'ultra_ball' then 0.2
        when 'master_ball' then 0.3
    end as buff_percentage,
    true as is_active,
    case pack.ball_type
        when 'poke_ball' then '◇1'
        when 'great_ball' then '◇2'
        when 'ultra_ball' then '◇3'
        when 'master_ball' then '★1'
    end as symbol,
    case pack.ball_type
        when 'poke_ball' then 5  -- 5 common slots
        when 'great_ball' then 3  -- 3 uncommon slots
        when 'ultra_ball' then 2  -- 2 rare slots
        when 'master_ball' then 1 -- 1 ultra rare slot
    end as guaranteed_slots,
    case pack.ball_type
        when 'poke_ball' then 6   -- Up to 6 Pokémon
        when 'great_ball' then 5   -- Up to 5 Pokémon
        when 'ultra_ball' then 4   -- Up to 4 Pokémon
        when 'master_ball' then 3  -- Up to 3 Pokémon
    end as max_per_pack
from family_profiles fp
cross join (
    values 
        ('poke_ball'),
        ('great_ball'),
        ('ultra_ball'),
        ('master_ball')
) as pack(ball_type)
where not exists (
    select 1 from family_lootboxes fl
    where fl.family_id = fp.id
    and fl.cost_type = cast(pack.ball_type as reward_type)
);

-- Populate the default Pokémon pools for each pack type
with pack_pokemon as (
    select fl.id as lootbox_id,
           p.id as pokemon_id,
           p.name as pokemon_name,
           case 
               when fl.cost_type = 'poke_ball' and p.id in (16, 19, 10, 13, 41, 43, 129) then cast('common' as pokemon_rarity)
               when fl.cost_type = 'poke_ball' then cast('uncommon' as pokemon_rarity)
               when fl.cost_type = 'great_ball' and p.id in (25, 133, 5, 8, 2, 64) then cast('uncommon' as pokemon_rarity)
               when fl.cost_type = 'great_ball' then cast('rare' as pokemon_rarity)
               when fl.cost_type = 'ultra_ball' and p.id in (6, 9, 3, 149, 130, 143) then cast('rare' as pokemon_rarity)
               when fl.cost_type = 'ultra_ball' then cast('ultra_rare' as pokemon_rarity)
               when fl.cost_type = 'master_ball' and p.id in (144, 145, 146, 243, 244, 245) then cast('ultra_rare' as pokemon_rarity)
               else cast('secret_rare' as pokemon_rarity)
           end as rarity
    from family_lootboxes fl
    cross join pokemon p
    where fl.cost_type in ('poke_ball', 'great_ball', 'ultra_ball', 'master_ball')
    and (
        (fl.cost_type = 'poke_ball' and p.id in (
            16, 19, 10, 13, 41, 43, 129,  -- Common (Pidgey, Rattata, Caterpie, Weedle, Zubat, Oddish, Magikarp)
            25, 133, 5, 8, 2, 64          -- Uncommon (Pikachu, Eevee, Charmeleon, Wartortle, Ivysaur, Kadabra)
        )) or
        (fl.cost_type = 'great_ball' and p.id in (
            25, 133, 5, 8, 2, 64,         -- Uncommon
            6, 9, 3, 149, 130, 143        -- Rare (Charizard, Blastoise, Venusaur, Dragonite, Gyarados, Snorlax)
        )) or
        (fl.cost_type = 'ultra_ball' and p.id in (
            6, 9, 3, 149, 130, 143,       -- Rare
            248, 373, 376, 445            -- Ultra Rare (Tyranitar, Salamence, Metagross, Garchomp)
        )) or
        (fl.cost_type = 'master_ball' and p.id in (
            248, 373, 376, 445,           -- Ultra Rare
            144, 145, 146, 243, 244, 245  -- Secret Rare (Legendary Birds and Beasts)
        ))
    )
)
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
    pp.lootbox_id,
    pp.pokemon_id,
    pp.pokemon_name,
    pp.rarity,
    1.0 as weight,
    cast('normal' as pokemon_variant) as variant,
    false as is_shiny
from pack_pokemon pp
where not exists (
    select 1 from lootbox_pokemon_pools lpp
    where lpp.lootbox_id = pp.lootbox_id
    and lpp.pokemon_id = pp.pokemon_id
);

commit; 