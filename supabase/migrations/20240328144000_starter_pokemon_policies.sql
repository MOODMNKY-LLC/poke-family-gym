-- Enable RLS on family_members if not already enabled
alter table family_members enable row level security;

-- Add policy to ensure users can only select valid starters
create policy "Users can only select valid starters"
  on family_members
  for insert
  with check (
    starter_pokemon_form_id is null or
    exists (
      select 1 from starter_pokemon_config
      where pokemon_form_id = starter_pokemon_form_id
      and is_active = true
    )
  );

-- Add policy to prevent changing starter after initial selection
create policy "Cannot change starter after selection"
  on family_members
  for update
  using (
    starter_pokemon_form_id is null or
    starter_pokemon_form_id = (
      select starter_pokemon_form_id 
      from family_members 
      where id = auth.uid()
    )
  );

-- Add policy to allow users to view their own family members
create policy "Users can view their own family members"
  on family_members
  for select
  using (
    family_id = auth.uid()
  ); 