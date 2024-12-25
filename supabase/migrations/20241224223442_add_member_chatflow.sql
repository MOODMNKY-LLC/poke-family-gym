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

-- Enable RLS on chat_flow if not already enabled
ALTER TABLE chat_flow ENABLE ROW LEVEL SECURITY;

-- Create policy to allow members to view their own chatflow
DROP POLICY IF EXISTS "Members can view their own chatflow" ON chat_flow;
CREATE POLICY "Members can view their own chatflow"
ON chat_flow
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT chatflow_id 
    FROM family_members 
    WHERE family_id = (SELECT auth.uid())  -- Adjust this logic if necessary
  )
);

-- Create policy to allow members to use their own chatflow
DROP POLICY IF EXISTS "Members can use their own chatflow" ON chat_message;
CREATE POLICY "Members can use their own chatflow"
ON chat_message
FOR INSERT
TO authenticated
WITH CHECK (
  chatflowid IN (
    SELECT chatflow_id 
    FROM family_members 
    WHERE family_id = (SELECT auth.uid())  -- Adjust this logic if necessary
  )
);

COMMIT;