-- Migration: Add Activity Events Table
-- Description: Creates a table to track family activity events
-- Author: CODE MNKY

begin;

-- Create activity_events table
create table activity_events (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references family_profiles(id) on delete cascade not null,
  member_id uuid references family_members(id) on delete cascade not null,
  type text not null check (
    type in (
      'TASK_COMPLETE',
      'POKEMON_CAUGHT',
      'ACHIEVEMENT_EARNED',
      'LEVEL_UP',
      'BADGE_EARNED'
    )
  ),
  timestamp timestamptz default now() not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add indexes for common queries
create index activity_events_family_id_idx on activity_events(family_id);
create index activity_events_member_id_idx on activity_events(member_id);
create index activity_events_timestamp_idx on activity_events(timestamp desc);

-- Add RLS policies
alter table activity_events enable row level security;

-- Allow family members to view their family's events
create policy "Users can view family activity events"
  on activity_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = activity_events.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Allow family members to create events
create policy "Users can create family activity events"
  on activity_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from family_profiles
      where family_profiles.id = activity_events.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
create trigger update_activity_events_updated_at
  before update on activity_events
  for each row
  execute procedure update_updated_at_column();

-- Add comments for documentation
comment on table activity_events is 'Stores family activity events like task completions and achievements';
comment on column activity_events.type is 'Type of activity event (e.g., TASK_COMPLETE, POKEMON_CAUGHT)';
comment on column activity_events.details is 'JSON object containing event-specific details';

commit; 