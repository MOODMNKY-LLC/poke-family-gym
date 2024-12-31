-- Migration: Add Session ID to Family Members
-- Description: Add session_id column to family_members table for grouping family conversations
-- Author: CODE MNKY

begin;

-- Add session_id column if it doesn't exist
alter table family_members
  add column if not exists session_id text;

comment on column family_members.session_id is 'Groups family conversations by linking members to a shared session';

-- Add index for better query performance
create index if not exists idx_family_members_session_id 
on family_members(session_id);

commit; 