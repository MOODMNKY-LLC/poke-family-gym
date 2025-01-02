-- Migration: Add Pokéball Transaction Policies
-- Description: Add RLS policies for pokeball transactions
-- Author: CODE MNKY

begin;

-- Enable RLS on pokeball_transactions
alter table pokeball_transactions enable row level security;

-- Policy for inserting transactions
-- Members can insert transactions for themselves or for other members in their family
create policy "Members can insert transactions for their family"
  on pokeball_transactions
  for insert
  with check (
    exists (
      select 1 from family_members fm
      where fm.id = auth.uid()
      and exists (
        select 1 from family_members target
        where target.id = pokeball_transactions.member_id
        and target.family_id = fm.family_id
      )
    )
  );

-- Policy for viewing transactions
-- Members can view transactions for their family
create policy "Members can view family transactions"
  on pokeball_transactions
  for select
  using (
    exists (
      select 1 from family_members fm
      where fm.id = auth.uid()
      and exists (
        select 1 from family_members target
        where target.id = pokeball_transactions.member_id
        and target.family_id = fm.family_id
      )
    )
  );

-- Add comments for documentation
comment on policy "Members can insert transactions for their family" on pokeball_transactions is 'Allow members to create transactions for anyone in their family';
comment on policy "Members can view family transactions" on pokeball_transactions is 'Allow members to view transactions for their family';

commit; 