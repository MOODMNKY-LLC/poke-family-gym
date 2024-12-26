-- Migration: Fix Chatflow Assignments
-- Description: Create and properly configure the family_member_chatflows table
-- Author: CODE MNKY

BEGIN;

-- Create the family_member_chatflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.family_member_chatflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    chatflow_id UUID NOT NULL REFERENCES public.chat_flow(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(member_id, chatflow_id)
);

-- Enable RLS
ALTER TABLE public.family_member_chatflows ENABLE ROW LEVEL SECURITY;

-- Add policies for family_member_chatflows
CREATE POLICY "Family admins can manage chatflow assignments"
    ON public.family_member_chatflows
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = auth.uid()
            AND fm.role_id = '1'
            AND fm.family_id = (
                SELECT family_id FROM public.family_members
                WHERE id = family_member_chatflows.member_id
            )
        )
    );

CREATE POLICY "Members can view their own chatflow assignments"
    ON public.family_member_chatflows
    FOR SELECT
    USING (
        member_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.id = auth.uid()
            AND fm.family_id = (
                SELECT family_id FROM public.family_members
                WHERE id = family_member_chatflows.member_id
            )
        )
    );

-- Create function to assign chatflows to members
CREATE OR REPLACE FUNCTION public.assign_chatflow_to_member(
    p_member_id UUID,
    p_chatflow_id UUID,
    p_role TEXT DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    -- Verify member exists
    IF NOT EXISTS (SELECT 1 FROM public.family_members WHERE id = p_member_id) THEN
        RAISE EXCEPTION 'Member not found';
    END IF;

    -- Verify chatflow exists
    IF NOT EXISTS (SELECT 1 FROM public.chat_flow WHERE id = p_chatflow_id) THEN
        RAISE EXCEPTION 'Chatflow not found';
    END IF;

    -- Insert or update the assignment
    INSERT INTO public.family_member_chatflows (member_id, chatflow_id, role)
    VALUES (p_member_id, p_chatflow_id, p_role)
    ON CONFLICT (member_id, chatflow_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_assignment_id;

    RETURN v_assignment_id;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.family_member_chatflows TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_chatflow_to_member TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_member_chatflows_member_id ON public.family_member_chatflows(member_id);
CREATE INDEX IF NOT EXISTS idx_family_member_chatflows_chatflow_id ON public.family_member_chatflows(chatflow_id);

COMMIT; 