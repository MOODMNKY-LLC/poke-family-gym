-- Migration: Add Pokeball Type to Task Templates
-- Description: Adds pokeball_type column to task_templates table
-- Author: CODE MNKY

begin;

-- Add pokeball_type column to task_templates
alter table task_templates
add column pokeball_type text not null default 'poke_ball';

-- Add check constraint to ensure valid pokeball types
alter table task_templates
add constraint task_templates_pokeball_type_check
check (pokeball_type in ('poke_ball', 'great_ball', 'ultra_ball', 'master_ball'));

-- Add comment for documentation
comment on column task_templates.pokeball_type is 'Type of Pokéball used as reward (poke_ball, great_ball, ultra_ball, master_ball)';

commit; 