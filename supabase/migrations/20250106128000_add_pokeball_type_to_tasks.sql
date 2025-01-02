-- Migration: Add Pokeball Type to Tasks
-- Description: Adds pokeball_type column to tasks table
-- Author: CODE MNKY

begin;

-- Add pokeball_type column to tasks
alter table tasks
add column pokeball_type text not null default 'poke_ball';

-- Add check constraint to ensure valid pokeball types
alter table tasks
add constraint tasks_pokeball_type_check
check (pokeball_type in ('poke_ball', 'great_ball', 'ultra_ball', 'master_ball'));

-- Add comment for documentation
comment on column tasks.pokeball_type is 'Type of Pokéball used as reward (poke_ball, great_ball, ultra_ball, master_ball)';

commit; 