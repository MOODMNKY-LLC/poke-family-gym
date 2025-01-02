-- Migration: Add Family Synergy System
-- Description: Add support for family synergy bonuses
-- Author: CODE MNKY

begin;

-- Create family_synergy table
create table family_synergy (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references family_profiles(id) on delete cascade not null,
  synergy_date date not null,
  active_members integer not null default 0,
  bonus_awarded boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(family_id, synergy_date)
);

-- Add indexes
create index family_synergy_family_id_idx on family_synergy(family_id);
create index family_synergy_date_idx on family_synergy(synergy_date);

-- Enable RLS
alter table family_synergy enable row level security;

-- Add RLS policies
create policy "Users can view their family's synergy"
  on family_synergy
  for select
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = family_synergy.family_id
      and family_profiles.id = auth.uid()
    )
  );

create policy "Users can update their family's synergy"
  on family_synergy
  for update
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = family_synergy.family_id
      and family_profiles.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = family_synergy.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Create function to update family synergy
create or replace function update_family_synergy()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  task_family_id uuid;
  sync_date date;
  active_count integer;
  synergy_record record;
begin
  -- Get the family_id for this task
  select family_id into task_family_id
  from tasks
  where id = NEW.task_id;
  
  -- Get sync date
  sync_date := date_trunc('day', NEW.completed_at)::date;
  
  -- Get or create synergy record for today
  select * into synergy_record
  from family_synergy
  where family_id = task_family_id
  and synergy_date = sync_date;
  
  if not found then
    insert into family_synergy (family_id, synergy_date)
    values (task_family_id, sync_date)
    returning * into synergy_record;
  end if;
  
  -- Count unique active members today
  select count(distinct completed_by) into active_count
  from task_history th
  join tasks t on t.id = th.task_id
  where t.family_id = task_family_id
  and date_trunc('day', th.completed_at)::date = sync_date;
  
  -- Update active members count
  update family_synergy
  set active_members = active_count
  where id = synergy_record.id;
  
  -- Award synergy bonus if we have 2 or more active members and haven't awarded bonus yet
  if active_count >= 2 and not synergy_record.bonus_awarded then
    -- Award 5 Great Balls to each active member
    insert into pokeball_transactions (
      family_id,
      member_id,
      amount,
      ball_type,
      reason,
      details
    )
    select
      task_family_id,
      th.completed_by,
      5,
      'great_ball',
      'Family Synergy Bonus',
      jsonb_build_object(
        'synergy_date', sync_date,
        'active_members', active_count
      )
    from (
      select distinct completed_by
      from task_history th2
      join tasks t2 on t2.id = th2.task_id
      where t2.family_id = task_family_id
      and date_trunc('day', th2.completed_at)::date = sync_date
    ) th;
    
    -- Mark bonus as awarded
    update family_synergy
    set bonus_awarded = true
    where id = synergy_record.id;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for updating family synergy
create trigger update_synergy_on_completion
  after insert on task_history
  for each row
  execute function update_family_synergy();

-- Add trigger for updated_at
create trigger update_family_synergy_updated_at
  before update on family_synergy
  for each row
  execute procedure update_updated_at_column();

-- Add comments
comment on table family_synergy is 'Tracks daily family task completion synergy';
comment on column family_synergy.active_members is 'Number of family members who completed tasks today';
comment on column family_synergy.bonus_awarded is 'Whether the synergy bonus has been awarded for today';

commit; 