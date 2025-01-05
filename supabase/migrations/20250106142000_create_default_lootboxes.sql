-- Migration: Create Default Loot Boxes
-- Description: Creates default loot boxes for each ball type with appropriate costs
-- Dependencies: Requires pokemon data to be populated first

begin transaction;

-- Create default loot boxes for each family
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
    f.id as family_id,
    case ball_type
        when 'poke_ball' then 'Poké Ball Pack'
        when 'great_ball' then 'Great Ball Pack'
        when 'ultra_ball' then 'Ultra Ball Pack'
        when 'master_ball' then 'Master Ball Pack'
    end as name,
    case ball_type
        when 'poke_ball' then 'A basic pack containing mostly common Pokémon.'
        when 'great_ball' then 'A better pack with improved chances for uncommon Pokémon.'
        when 'ultra_ball' then 'A premium pack with high chances for rare Pokémon.'
        when 'master_ball' then 'An ultimate pack guaranteed to contain ultra rare or better Pokémon.'
    end as description,
    case ball_type
        when 'poke_ball' then cast('common' as pokemon_rarity)
        when 'great_ball' then cast('uncommon' as pokemon_rarity)
        when 'ultra_ball' then cast('rare' as pokemon_rarity)
        when 'master_ball' then cast('ultra_rare' as pokemon_rarity)
    end as rarity,
    cast(ball_type as reward_type) as cost_type,
    case ball_type
        when 'poke_ball' then 25
        when 'great_ball' then 50
        when 'ultra_ball' then 75
        when 'master_ball' then 100
    end as cost_amount,
    case ball_type
        when 'poke_ball' then 0.0
        when 'great_ball' then 0.1
        when 'ultra_ball' then 0.2
        when 'master_ball' then 0.3
    end as buff_percentage,
    true as is_active,
    case ball_type
        when 'poke_ball' then '🔴'
        when 'great_ball' then '🔵'
        when 'ultra_ball' then '⚫'
        when 'master_ball' then '🟣'
    end as symbol,
    case ball_type
        when 'poke_ball' then 3
        when 'great_ball' then 3
        when 'ultra_ball' then 4
        when 'master_ball' then 5
    end as guaranteed_slots,
    case ball_type
        when 'poke_ball' then 5
        when 'great_ball' then 5
        when 'ultra_ball' then 6
        when 'master_ball' then 7
    end as max_per_pack
from family_profiles f
cross join (
    values 
        ('poke_ball'),
        ('great_ball'),
        ('ultra_ball'),
        ('master_ball')
) as ball_types(ball_type)
where not exists (
    select 1 
    from family_lootboxes fl 
    where fl.family_id = f.id 
    and cast(fl.cost_type as text) = ball_type
);

commit transaction; 