-- Migration: Update Remote Schema
-- Description: Update chatflow policies and functions
-- Author: CODE MNKY

BEGIN;

-- Drop existing items in correct order
drop trigger if exists "handle_chat_flow_updated_at" on "public"."chat_flow";

drop policy if exists "Authenticated users can create chatflows" on "public"."chat_flow";
drop policy if exists "Users can delete their own chatflows" on "public"."chat_flow";
drop policy if exists "Users can update their own chatflows" on "public"."chat_flow";
drop policy if exists "Users can view all chatflows" on "public"."chat_flow";

drop function if exists "public"."handle_updated_at"();

drop index if exists "public"."chat_flow_category_idx";
drop index if exists "public"."chat_flow_name_idx";
drop index if exists "public"."chat_flow_type_idx";

-- Set function body checks
set check_function_bodies = off;

-- Create or replace document matching functions
CREATE OR REPLACE FUNCTION public.match_documents(
    query_embedding vector,
    match_count integer DEFAULT NULL::integer,
    filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id text, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.match_ollama_documents(
    query_embedding vector,
    match_count integer DEFAULT NULL::integer,
    filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id text, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (ollama_documents.embedding <=> query_embedding) as similarity
  from ollama_documents
  where metadata @> filter
  order by ollama_documents.embedding <=> query_embedding
  limit match_count;
end;
$function$;

-- Create new chatflow policies
create policy "Members can view their own chatflow"
on "public"."chat_flow"
as permissive
for select
to authenticated
using (
    id IN (
        SELECT family_members.chatflow_id
        FROM family_members
        WHERE family_members.family_id = auth.uid()
    )
);

create policy "Members can use their own chatflow"
on "public"."chat_message"
as permissive
for insert
to authenticated
with check (
    chatflowid IN (
        SELECT family_members.chatflow_id
        FROM family_members
        WHERE family_members.family_id = auth.uid()
    )
);

COMMIT;



