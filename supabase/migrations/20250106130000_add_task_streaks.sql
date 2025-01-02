-- Migration: Add Task Streak Tracking
-- Description: Add streak tracking for task completion
-- Author: CODE MNKY

begin;

-- Create task_streaks table
create table task_streaks (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references family_members(id) on delete cascade not null,
  family_id uuid references family_profiles(id) on delete cascade not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add indexes
create index task_streaks_member_id_idx on task_streaks(member_id);
create index task_streaks_family_id_idx on task_streaks(family_id);

-- Enable RLS
alter table task_streaks enable row level security;

-- Add RLS policies
create policy "Users can view their family's task streaks"
  on task_streaks
  for select
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = task_streaks.family_id
      and family_profiles.id = auth.uid()
    )
  );

create policy "Users can update their family's task streaks"
  on task_streaks
  for update
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = task_streaks.family_id
      and family_profiles.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = task_streaks.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Create function to update streaks
create or replace function update_task_streak()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_completion timestamptz;
  streak_record record;
begin
  -- Get or create streak record
  select * into streak_record
  from task_streaks
  where member_id = NEW.completed_by
  and family_id = (
    select family_id
    from tasks
    where id = NEW.task_id
  );
  
  if not found then
    insert into task_streaks (member_id, family_id)
    values (
      NEW.completed_by,
      (select family_id from tasks where id = NEW.task_id)
    )
    returning * into streak_record;
  end if;
  
  -- Update streak based on last completion
  if streak_record.last_completed_at is null then
    -- First completion
    update task_streaks
    set current_streak = 1,
        longest_streak = 1,
        last_completed_at = NEW.completed_at
    where id = streak_record.id;
  else
    -- Check if completion is within 24 hours of last completion
    if NEW.completed_at <= streak_record.last_completed_at + interval '24 hours' then
      update task_streaks
      set current_streak = current_streak + 1,
          longest_streak = greatest(longest_streak, current_streak + 1),
          last_completed_at = NEW.completed_at
      where id = streak_record.id;
    else
      -- Streak broken, reset to 1
      update task_streaks
      set current_streak = 1,
          last_completed_at = NEW.completed_at
      where id = streak_record.id;
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for updating streaks
create trigger update_streak_on_completion
  after insert on task_history
  for each row
  execute function update_task_streak();

-- Add trigger for updated_at
create trigger update_task_streaks_updated_at
  before update on task_streaks
  for each row
  execute procedure update_updated_at_column();

-- Add comments
comment on table task_streaks is 'Tracks daily task completion streaks for family members';
comment on column task_streaks.current_streak is 'Current consecutive days with completed tasks';
comment on column task_streaks.longest_streak is 'Longest streak of consecutive days with completed tasks';
comment on column task_streaks.last_completed_at is 'Timestamp of last task completion';

commit; 