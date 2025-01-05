-- Migration: Ensure Pokémon Data Population
-- Description: Ensures all necessary Pokémon data is populated before creating pools
-- Dependencies: Requires previous migrations to be applied first

begin transaction;

-- Common Pool
insert into pokemon (id, name, types, stats, sprites)
select 19, 'rattata', string_to_array('normal', ','), 
    cast('{"hp": 30, "attack": 56, "defense": 35, "special-attack": 25, "special-defense": 35, "speed": 72}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 19);

insert into pokemon (id, name, types, stats, sprites)
select 10, 'caterpie', string_to_array('bug', ','),
    cast('{"hp": 45, "attack": 30, "defense": 35, "special-attack": 20, "special-defense": 20, "speed": 45}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 10);

-- Uncommon Pool
insert into pokemon (id, name, types, stats, sprites)
select 25, 'pikachu', string_to_array('electric', ','),
    cast('{"hp": 35, "attack": 55, "defense": 40, "special-attack": 50, "special-defense": 50, "speed": 90}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 25);

insert into pokemon (id, name, types, stats, sprites)
select 133, 'eevee', string_to_array('normal', ','),
    cast('{"hp": 55, "attack": 55, "defense": 50, "special-attack": 45, "special-defense": 65, "speed": 55}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 133);

-- Rare Pool
insert into pokemon (id, name, types, stats, sprites)
select 149, 'dragonite', string_to_array('dragon,flying', ','),
    cast('{"hp": 91, "attack": 134, "defense": 95, "special-attack": 100, "special-defense": 100, "speed": 80}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 149);

insert into pokemon (id, name, types, stats, sprites)
select 130, 'gyarados', string_to_array('water,flying', ','),
    cast('{"hp": 95, "attack": 125, "defense": 79, "special-attack": 60, "special-defense": 100, "speed": 81}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 130);

-- Ultra Rare Pool
insert into pokemon (id, name, types, stats, sprites)
select 373, 'salamence', string_to_array('dragon,flying', ','),
    cast('{"hp": 95, "attack": 135, "defense": 80, "special-attack": 110, "special-defense": 80, "speed": 100}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/373.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 373);

insert into pokemon (id, name, types, stats, sprites)
select 376, 'metagross', string_to_array('steel,psychic', ','),
    cast('{"hp": 80, "attack": 135, "defense": 130, "special-attack": 95, "special-defense": 90, "speed": 70}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/376.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 376);

-- Secret Rare Pool (Legendary Birds)
insert into pokemon (id, name, types, stats, sprites)
select 144, 'articuno', string_to_array('ice,flying', ','),
    cast('{"hp": 90, "attack": 85, "defense": 100, "special-attack": 95, "special-defense": 125, "speed": 85}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 144);

insert into pokemon (id, name, types, stats, sprites)
select 145, 'zapdos', string_to_array('electric,flying', ','),
    cast('{"hp": 90, "attack": 90, "defense": 85, "special-attack": 125, "special-defense": 90, "speed": 100}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 145);

insert into pokemon (id, name, types, stats, sprites)
select 146, 'moltres', string_to_array('fire,flying', ','),
    cast('{"hp": 90, "attack": 100, "defense": 90, "special-attack": 125, "special-defense": 85, "speed": 90}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 146);

-- Hyper Rare Pool (Major Legendaries)
insert into pokemon (id, name, types, stats, sprites)
select 150, 'mewtwo', string_to_array('psychic', ','),
    cast('{"hp": 106, "attack": 110, "defense": 90, "special-attack": 154, "special-defense": 90, "speed": 130}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 150);

insert into pokemon (id, name, types, stats, sprites)
select 249, 'lugia', string_to_array('psychic,flying', ','),
    cast('{"hp": 106, "attack": 90, "defense": 130, "special-attack": 90, "special-defense": 154, "speed": 110}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 249);

insert into pokemon (id, name, types, stats, sprites)
select 250, 'ho-oh', string_to_array('fire,flying', ','),
    cast('{"hp": 106, "attack": 130, "defense": 90, "special-attack": 110, "special-defense": 154, "speed": 90}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 250);

-- Crown Rare Pool (Mythicals)
insert into pokemon (id, name, types, stats, sprites)
select 151, 'mew', string_to_array('psychic', ','),
    cast('{"hp": 100, "attack": 100, "defense": 100, "special-attack": 100, "special-defense": 100, "speed": 100}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 151);

insert into pokemon (id, name, types, stats, sprites)
select 251, 'celebi', string_to_array('psychic,grass', ','),
    cast('{"hp": 100, "attack": 100, "defense": 100, "special-attack": 100, "special-defense": 100, "speed": 100}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/251.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 251);

insert into pokemon (id, name, types, stats, sprites)
select 385, 'jirachi', string_to_array('steel,psychic', ','),
    cast('{"hp": 100, "attack": 100, "defense": 100, "special-attack": 100, "special-defense": 100, "speed": 100}' as jsonb),
    cast('{"front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/385.png"}' as jsonb)
where not exists (select 1 from pokemon where id = 385);

commit transaction; 