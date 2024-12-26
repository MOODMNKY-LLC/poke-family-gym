-- Migration: Add Member Chatflow
-- Description: Add chatflow_id to family members for personal AI agents
-- Author: CODE MNKY

BEGIN;

-- Add chatflow_id column to family_members if it doesn't exist
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS chatflow_id UUID;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_members_chatflow_id_fkey'
  ) THEN
    ALTER TABLE family_members
      ADD CONSTRAINT family_members_chatflow_id_fkey
      FOREIGN KEY (chatflow_id) REFERENCES chat_flow(id);
  END IF;
END $$;

COMMENT ON COLUMN family_members.chatflow_id IS 'Reference to the member''s personal AI agent chatflow';

-- Create chat_flow table if it doesn't exist
create table if not exists public.chat_flow (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  flowData jsonb not null default '{}'::jsonb,
  deployed boolean not null default false,
  isPublic boolean not null default false,
  apikeyid text,
  chatbotConfig jsonb,
  category text,
  speechToText text,
  type text default 'chat',
  followUpPrompts text,
  createdDate timestamp with time zone default timezone('utc'::text, now()) not null,
  updatedDate timestamp with time zone default timezone('utc'::text, now()) not null,
  apiConfig jsonb,
  analytic jsonb,
  systemMessage text,
  temperature numeric default 0.7,
  maxTokens integer default 2000,
  topP numeric default 0.95,
  frequencyPenalty numeric default 0,
  presencePenalty numeric default 0,
  memoryType text default 'simple',
  memoryWindow integer default 5
);

-- Add RLS policies
alter table public.chat_flow enable row level security;

-- Policy for viewing chatflows
create policy "Users can view all chatflows"
  on public.chat_flow for select
  using (true);

-- Policy for creating chatflows
create policy "Authenticated users can create chatflows"
  on public.chat_flow for insert
  with check (auth.role() = 'authenticated');

-- Policy for updating chatflows
create policy "Users can update their own chatflows"
  on public.chat_flow for update
  using (
    exists (
      select 1
      from public.family_members fm
      where fm.family_id = (
        select family_id
        from public.family_members
        where id = auth.uid()
      )
      and fm.id = auth.uid()
    )
  );

-- Policy for deleting chatflows
create policy "Users can delete their own chatflows"
  on public.chat_flow for delete
  using (
    exists (
      select 1
      from public.family_members fm
      where fm.family_id = (
        select family_id
        from public.family_members
        where id = auth.uid()
      )
      and fm.id = auth.uid()
    )
  );

-- Add indexes for better performance
create index if not exists chat_flow_name_idx on public.chat_flow (name);
create index if not exists chat_flow_type_idx on public.chat_flow (type);
create index if not exists chat_flow_category_idx on public.chat_flow (category);

-- Add triggers for updated_date
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updatedDate = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_chat_flow_updated_at
  before update on public.chat_flow
  for each row
  execute procedure public.handle_updated_at();

-- Grant necessary permissions
grant all on public.chat_flow to authenticated;

COMMIT;