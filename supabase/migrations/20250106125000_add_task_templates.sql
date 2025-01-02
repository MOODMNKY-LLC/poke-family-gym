-- Migration: Add Task Templates
-- Description: Adds support for task templates and improves task management
-- Author: CODE MNKY

begin;

-- Create task_templates table
create table task_templates (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references family_profiles(id) on delete cascade not null,
  title text not null,
  description text,
  pokeball_reward integer not null default 1,
  estimated_time text,
  recurring_type text check (
    recurring_type in ('daily', 'weekly', 'monthly', null)
  ),
  recurring_details jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references family_members(id) on delete set null
);

-- Add indexes
create index task_templates_family_id_idx on task_templates(family_id);
create index task_templates_created_by_idx on task_templates(created_by);

-- Enable RLS
alter table task_templates enable row level security;

-- Add RLS policies
create policy "Users can view their family's task templates"
  on task_templates for select
  to authenticated
  using (
    family_id in (
      select id from family_profiles where id = auth.uid()
    )
  );

create policy "Users can create task templates for their family"
  on task_templates for insert
  to authenticated
  with check (
    family_id in (
      select id from family_profiles where id = auth.uid()
    )
  );

create policy "Users can update their family's task templates"
  on task_templates for update
  to authenticated
  using (
    family_id in (
      select id from family_profiles where id = auth.uid()
    )
  );

create policy "Users can delete their family's task templates"
  on task_templates for delete
  to authenticated
  using (
    family_id in (
      select id from family_profiles where id = auth.uid()
    )
  );

-- Add trigger for updated_at
create trigger update_task_templates_updated_at
  before update on task_templates
  for each row
  execute procedure update_updated_at_column();

-- Add comments
comment on table task_templates is 'Stores reusable task templates for families';
comment on column task_templates.estimated_time is 'Estimated time to complete the task (e.g., "30 minutes", "1 hour")';
comment on column task_templates.recurring_type is 'Whether tasks created from this template should recur daily, weekly, or monthly';
comment on column task_templates.recurring_details is 'JSON object with recurring schedule details';

commit; 