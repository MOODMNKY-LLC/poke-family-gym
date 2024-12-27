begin;

-- Create member_chatflow_assignments table for many-to-many relationship
create table if not exists public.member_chatflow_assignments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.family_members(id) on delete cascade,
  chatflow_id text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Ensure unique active assignment per member
  unique (member_id, chatflow_id, is_active)
);

-- Add indexes for performance
create index if not exists idx_member_chatflow_assignments_member on member_chatflow_assignments(member_id);
create index if not exists idx_member_chatflow_assignments_chatflow on member_chatflow_assignments(chatflow_id);
create index if not exists idx_member_chatflow_assignments_active on member_chatflow_assignments(is_active);

-- Enable RLS
alter table public.member_chatflow_assignments enable row level security;

-- Create RLS policies for member_chatflow_assignments
create policy "Users can manage chatflow assignments for their family members"
  on public.member_chatflow_assignments
  for all
  using (
    exists (
      select 1 
      from family_members fm
      join family_profiles fp on fp.id = fm.family_id
      where fm.id = member_chatflow_assignments.member_id
      and fp.id = auth.uid()
    )
  );

-- Create function to sync chatflow_id in family_members table
create or replace function public.sync_member_chatflow()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Update the family_members table with the latest active chatflow
  update public.family_members
  set chatflow_id = (
    select chatflow_id
    from public.member_chatflow_assignments
    where member_id = new.member_id
    and is_active = true
    order by updated_at desc
    limit 1
  )
  where id = new.member_id;

  -- Log the assignment change
  insert into activity_events (
    family_id,
    member_id,
    event_type,
    event_data,
    created_at
  )
  select
    fm.family_id,
    fm.id,
    'chatflow_assignment',
    jsonb_build_object(
      'previous_chatflow_id', fm.chatflow_id,
      'new_chatflow_id', new.chatflow_id,
      'member_name', fm.display_name,
      'assignment_id', new.id
    ),
    now()
  from public.family_members fm
  where fm.id = new.member_id;

  return new;
end;
$$;

-- Create trigger for syncing chatflow assignments
drop trigger if exists sync_member_chatflow_trigger on public.member_chatflow_assignments;
create trigger sync_member_chatflow_trigger
  after insert or update on public.member_chatflow_assignments
  for each row
  when (new.is_active = true)
  execute function public.sync_member_chatflow();

-- Create function to validate chatflow exists
create or replace function public.validate_chatflow_exists()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Check if the chatflow exists and is deployed
  if not exists (
    select 1 
    from chat_flow 
    where id = new.chatflow_id
    and deployed = true
  ) then
    raise exception 'Chatflow with ID % does not exist or is not deployed', new.chatflow_id;
  end if;

  -- Deactivate any other active assignments for this member
  if new.is_active then
    update public.member_chatflow_assignments
    set is_active = false
    where member_id = new.member_id
    and id != new.id
    and is_active = true;
  end if;

  return new;
end;
$$;

-- Create trigger to validate chatflow before assignment
drop trigger if exists validate_chatflow_assignment on public.member_chatflow_assignments;
create trigger validate_chatflow_assignment
  before insert or update on public.member_chatflow_assignments
  for each row
  execute function public.validate_chatflow_exists();

-- Add updated_at trigger
create trigger handle_updated_at
  before update on public.member_chatflow_assignments
  for each row
  execute procedure moddatetime();

comment on table public.member_chatflow_assignments is 'Tracks assignments between family members and chatflows';
comment on function public.sync_member_chatflow is 'Syncs the latest active chatflow assignment to the family_members table';
comment on function public.validate_chatflow_exists is 'Validates chatflow existence and manages active assignments';

commit; 