-- Drop existing objects first to avoid conflicts
drop trigger if exists handle_updated_at on public.chat_message_feedback;
drop policy if exists "Users can insert feedback" on public.chat_message_feedback;
drop policy if exists "Users can view feedback" on public.chat_message_feedback;
drop table if exists public.chat_message_feedback;

-- Create chat_message_feedback table
create table public.chat_message_feedback (
  id uuid default gen_random_uuid() primary key,
  message_id text not null,
  chat_id text not null,
  rating text not null check (rating in ('positive', 'negative')),
  content text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid references auth.users(id) default auth.uid() not null,
  family_id uuid references public.family_profiles(id) not null
);

-- Add indexes for performance
create index chat_message_feedback_message_id_idx on public.chat_message_feedback(message_id);
create index chat_message_feedback_chat_id_idx on public.chat_message_feedback(chat_id);
create index chat_message_feedback_user_id_idx on public.chat_message_feedback(user_id);
create index chat_message_feedback_family_id_idx on public.chat_message_feedback(family_id);

-- Enable Row Level Security
alter table public.chat_message_feedback enable row level security;

-- Create RLS policies
create policy "Users can insert feedback for their family"
  on public.chat_message_feedback
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.family_profiles
      where family_profiles.id = chat_message_feedback.family_id
      and family_profiles.id = auth.uid()
    )
  );

create policy "Users can view their family's feedback"
  on public.chat_message_feedback
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.family_profiles
      where family_profiles.id = chat_message_feedback.family_id
      and family_profiles.id = auth.uid()
    )
  );

-- Add updated_at trigger
create trigger handle_updated_at
  before update on public.chat_message_feedback
  for each row
  execute function moddatetime(); 