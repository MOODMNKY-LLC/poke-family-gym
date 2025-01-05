-- Migration: Fix Pokemon Table Relationships
-- Description: Adds proper foreign key relationships between pokemon and pokemon_forms tables
-- Author: CODE MNKY

begin;

-- Add species_id to pokemon table if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
    where table_name = 'pokemon' and column_name = 'species_id') then
    alter table pokemon 
    add column species_id bigint references pokemon_species(id);
  end if;
end $$;

-- Update species_id for existing pokemon
update pokemon p
set species_id = ps.id
from pokemon_species ps
where p.name = ps.name
  and p.species_id is null;

-- Add form_id to pokemon table if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
    where table_name = 'pokemon' and column_name = 'form_id') then
    alter table pokemon 
    add column form_id bigint references pokemon_forms(id);
  end if;
end $$;

-- Update form_id for existing pokemon
update pokemon p
set form_id = pf.id
from pokemon_forms pf
where p.name = pf.name
  and p.form_id is null;

-- Add foreign key from pokemon_forms to pokemon
do $$ 
begin
  if not exists (select 1 from information_schema.columns 
    where table_name = 'pokemon_forms' and column_name = 'pokemon_id') then
    alter table pokemon_forms 
    add column pokemon_id bigint references pokemon(id);
  end if;
end $$;

-- Update pokemon_id for existing forms
update pokemon_forms pf
set pokemon_id = p.id
from pokemon p
where p.name = pf.name
  and pf.pokemon_id is null;

-- Make sure all pokemon have a species and form
do $$ 
begin
  -- For any pokemon without a species, create one
  insert into pokemon_species (id, name)
  select p.id, p.name
  from pokemon p
  where p.species_id is null
    and not exists (
      select 1 from pokemon_species ps where ps.name = p.name
    );

  -- For any pokemon without a form, create one
  insert into pokemon_forms (id, name, species_id, pokemon_id)
  select p.id, p.name, p.species_id, p.id
  from pokemon p
  where p.form_id is null
    and not exists (
      select 1 from pokemon_forms pf where pf.name = p.name
    );
end $$;

-- Add helpful comments
comment on column pokemon.species_id is 'Reference to the Pokemon species';
comment on column pokemon.form_id is 'Reference to the Pokemon form';
comment on column pokemon_forms.pokemon_id is 'Reference to the Pokemon data (stats, types, etc)';

commit; 