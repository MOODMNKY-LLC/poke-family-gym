begin;

-- Create a function to validate chatflow exists
create or replace function public.validate_chatflow_exists()
returns trigger 
language plpgsql
security definer
as $$
begin
  -- If chatflow_id is null, allow the update (removing assignment)
  if new.chatflow_id is null then
    return new;
  end if;

  -- Check if the chatflow exists and is deployed
  if not exists (
    select 1 
    from chat_flow 
    where id = new.chatflow_id
    and deployed = true
  ) then
    raise exception 'Chatflow with ID % does not exist or is not deployed', new.chatflow_id;
  end if;

  return new;
end;
$$;

-- Create a function to log chatflow assignments
create or replace function public.log_chatflow_assignment()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into activity_events (
    family_id,
    member_id,
    event_type,
    event_data,
    created_at
  ) values (
    new.family_id,
    new.id,
    'chatflow_assignment',
    jsonb_build_object(
      'previous_chatflow_id', old.chatflow_id,
      'new_chatflow_id', new.chatflow_id,
      'member_name', new.display_name
    ),
    now()
  );
  return new;
end;
$$;

-- Create trigger to validate chatflow before assignment
drop trigger if exists validate_chatflow_assignment on public.family_members;
create trigger validate_chatflow_assignment
  before update of chatflow_id on public.family_members
  for each row
  execute function public.validate_chatflow_exists();

-- Create trigger to log chatflow assignments
drop trigger if exists log_chatflow_assignment on public.family_members;
create trigger log_chatflow_assignment
  after update of chatflow_id on public.family_members
  for each row
  when (old.chatflow_id is distinct from new.chatflow_id)
  execute function public.log_chatflow_assignment();

-- Update RLS policies for family_members table
drop policy if exists "Users can update chatflow assignments for their family members" on public.family_members;
create policy "Users can update chatflow assignments for their family members"
  on public.family_members
  for update
  using (
    exists (
      select 1 
      from family_profiles fp
      where fp.id = family_members.family_id
      and fp.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 
      from family_profiles fp
      where fp.id = family_members.family_id
      and fp.id = auth.uid()
    )
  );

comment on function public.validate_chatflow_exists is 'Validates that a chatflow exists and is deployed before it can be assigned to a family member';
comment on function public.log_chatflow_assignment is 'Logs chatflow assignment changes to the activity_events table';

commit; 