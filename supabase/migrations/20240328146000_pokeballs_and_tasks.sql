-- Migration: Add Pokéballs and Tasks Tables
-- Description: Creates tables for tracking Pokéballs and tasks
-- Author: CODE MNKY

begin;

-- Create pokeball_transactions table
create table pokeball_transactions (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references family_profiles(id) on delete cascade not null,
  member_id uuid references family_members(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Create tasks table
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references family_profiles(id) on delete cascade not null,
  title text not null,
  description text,
  pokeball_reward integer not null default 1,
  assigned_to uuid references family_members(id) on delete cascade,
  due_date timestamptz,
  status text not null default 'pending' check (
    status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  recurring_type text check (
    recurring_type in ('daily', 'weekly', 'monthly', null)
  ),
  recurring_details jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  completed_at timestamptz,
  completed_by uuid references family_members(id) on delete set null
);

-- Create task_history table for tracking recurring task completions
create table task_history (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  completed_by uuid references family_members(id) on delete cascade not null,
  completed_at timestamptz default now() not null,
  pokeballs_earned integer not null,
  details jsonb not null default '{}'::jsonb
);

-- Add indexes
create index pokeball_transactions_family_id_idx on pokeball_transactions(family_id);
create index pokeball_transactions_member_id_idx on pokeball_transactions(member_id);
create index tasks_family_id_idx on tasks(family_id);
create index tasks_assigned_to_idx on tasks(assigned_to);
create index tasks_status_idx on tasks(status);
create index task_history_task_id_idx on task_history(task_id);
create index task_history_completed_by_idx on task_history(completed_by);

-- Add RLS policies
alter table pokeball_transactions enable row level security;
alter table tasks enable row level security;
alter table task_history enable row level security;

-- Pokeball transactions policies
create policy "Users can view their family's pokeball transactions"
  on pokeball_transactions
  for select
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = pokeball_transactions.family_id
      and family_profiles.id = auth.uid()
    )
  );

create policy "Users can create pokeball transactions for their family"
  on pokeball_transactions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = pokeball_transactions.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Tasks policies
create policy "Users can view their family's tasks"
  on tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = tasks.family_id
      and family_profiles.id = auth.uid()
    )
  );

create policy "Users can manage their family's tasks"
  on tasks
  for all
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = tasks.family_id
      and family_profiles.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = tasks.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Task history policies
create policy "Users can view their family's task history"
  on task_history
  for select
  to authenticated
  using (
    exists (
      select 1
      from tasks
      inner join family_profiles on family_profiles.id = tasks.family_id
      where tasks.id = task_history.task_id
      and family_profiles.id = auth.uid()
    )
  );

create policy "Users can create task history for their family"
  on task_history
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from tasks
      inner join family_profiles on family_profiles.id = tasks.family_id
      where tasks.id = task_history.task_id
      and family_profiles.id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute procedure update_updated_at_column();

-- Add comments for documentation
comment on table pokeball_transactions is 'Tracks Pokéball earnings and spending';
comment on table tasks is 'Stores family tasks and chores';
comment on table task_history is 'Tracks completion history of recurring tasks';

comment on column pokeball_transactions.amount is 'Positive for earnings, negative for spending';
comment on column tasks.recurring_type is 'Whether the task repeats daily, weekly, or monthly';
comment on column tasks.recurring_details is 'JSON object with recurring schedule details';
comment on column task_history.pokeballs_earned is 'Number of Pokéballs earned for this completion';

commit; 