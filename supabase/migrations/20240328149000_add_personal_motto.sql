-- Migration: Add Personal Motto
-- Description: Add personal motto field to family members
-- Author: CODE MNKY

begin;

-- Add personal motto column to family_members
alter table family_members
  add column if not exists personal_motto text;

comment on column family_members.personal_motto is 'Personal motto or catchphrase of the family member';

commit; 