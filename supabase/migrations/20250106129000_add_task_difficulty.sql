-- Migration: Add Task Difficulty Levels
-- Description: Add difficulty levels to tasks and default rewards
-- Author: CODE MNKY

begin;

-- Add difficulty level to tasks
alter table tasks
  add difficulty text check (
    difficulty in ('easy', 'moderate', 'complex', 'exceptional')
  );

-- Create function to set default pokeball reward based on difficulty
create or replace function set_default_pokeball_reward()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Set default reward based on difficulty if not explicitly set
  if NEW.pokeball_reward is null then
    NEW.pokeball_reward := case NEW.difficulty
      when 'easy' then 1
      when 'moderate' then 5
      when 'complex' then 10
      when 'exceptional' then 100
      else 1  -- Default to 1 if no difficulty set
    end;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger to set default reward
create trigger set_default_reward_on_insert
  before insert on tasks
  for each row
  execute function set_default_pokeball_reward();

-- Add comments
comment on column tasks.difficulty is 'Task difficulty level determining default reward';

commit; 