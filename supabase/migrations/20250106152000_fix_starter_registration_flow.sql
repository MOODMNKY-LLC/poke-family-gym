-- Migration: Fix Starter Registration Flow
-- Description: Ensure proper integration between user registration and collection triggers
-- Author: CODE MNKY

begin;

-- Update the handle_new_user_registration function to properly set starter Pokémon fields
create or replace function handle_new_user_registration()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_role_id bigint;
  starter_pokemon_id bigint;
  starter_nickname text;
  starter_nature text;
  pokemon_exists boolean;
begin
  -- Get the admin role id
  select id into admin_role_id from roles where name = 'admin';
  
  -- Get starter pokemon details from metadata if provided
  starter_pokemon_id := (new.raw_user_meta_data->>'starter_pokemon_form_id')::bigint;
  starter_nickname := new.raw_user_meta_data->>'starter_pokemon_nickname';
  starter_nature := new.raw_user_meta_data->>'starter_pokemon_nature';

  -- Validate starter pokemon if one is selected
  if starter_pokemon_id is not null then
    -- Check if the Pokémon form exists
    select exists(
      select 1 
      from pokemon_forms pf
      inner join pokemon_species ps on ps.id = pf.species_id
      where pf.id = starter_pokemon_id
    ) into pokemon_exists;

    if not pokemon_exists then
      raise notice 'Selected starter Pokémon form does not exist: %', starter_pokemon_id;
      starter_pokemon_id := null;
    end if;
  end if;
  
  -- Insert family profile with conflict handling
  insert into family_profiles (id, family_name)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'family_name', 'New Family')
  )
  on conflict (id) do nothing;
  
  -- Insert family member with conflict handling and ALL starter fields
  insert into family_members (
    id,
    family_id,
    display_name,
    full_name,
    role_id,
    starter_pokemon_form_id,
    starter_pokemon_nickname,
    starter_pokemon_obtained_at,
    starter_pokemon_nature,
    starter_pokemon_friendship,
    starter_pokemon_experience,
    starter_pokemon_move_1,
    starter_pokemon_move_2,
    starter_pokemon_move_3,
    starter_pokemon_move_4
  )
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    admin_role_id,
    starter_pokemon_id,
    starter_nickname,
    case when starter_pokemon_id is not null then now() else null end,
    starter_nature,
    70, -- Base friendship value
    0,  -- Starting experience
    null, -- Moves will be set later
    null,
    null,
    null
  )
  on conflict (id) do update set
    starter_pokemon_form_id = excluded.starter_pokemon_form_id,
    starter_pokemon_nickname = excluded.starter_pokemon_nickname,
    starter_pokemon_obtained_at = excluded.starter_pokemon_obtained_at,
    starter_pokemon_nature = excluded.starter_pokemon_nature,
    starter_pokemon_friendship = excluded.starter_pokemon_friendship,
    starter_pokemon_experience = excluded.starter_pokemon_experience;
  
  -- Add starter to pokedex with conflict handling
  if starter_pokemon_id is not null then
    insert into family_pokedex (
      family_id,
      pokemon_form_id,
      first_caught_at,
      caught_count,
      is_favorite,
      nickname,
      notes
    ) values (
      new.id,
      starter_pokemon_id,
      now(),
      1,
      true,
      starter_nickname,
      'My first partner Pokémon!'
    )
    on conflict (family_id, pokemon_form_id) do nothing;

    -- Log successful starter registration
    raise notice 'Successfully registered new user with starter Pokémon: %', starter_pokemon_id;
  end if;
  
  return new;
exception
  when others then
    -- Log any errors
    raise notice 'Error in handle_new_user_registration: %', SQLERRM;
    return new;
end;
$$;

-- Add comment explaining the function's purpose
comment on function handle_new_user_registration() is 'Handles new user registration by creating family profile, member record with starter Pokémon, and initializing Pokédex';

commit; 