-- Migration: Add Pack Inventory System
-- Description: Creates a table to track purchased but unopened packs

begin;

-- Create pack inventory table
create table pack_inventory (
  id bigint generated always as identity primary key,
  member_id uuid not null references family_members(id) on delete cascade,
  family_id uuid not null references family_profiles(id) on delete cascade,
  pack_type reward_type not null,
  status text not null check (status in ('unopened', 'opened')),
  cost_paid integer not null,
  created_at timestamptz default now() not null,
  opened_at timestamptz
);

-- Enable RLS
alter table pack_inventory enable row level security;

-- Policies for pack_inventory
create policy "Family members can view their family's pack inventory"
on pack_inventory
for select
to authenticated
using (
  family_id in (
    select family_id 
    from family_members 
    where id = auth.uid()
  )
);

create policy "Members can manage their own packs"
on pack_inventory
for all
to authenticated
using (
  member_id = auth.uid()
);

-- Add helpful comments
comment on table pack_inventory is 'Tracks purchased but unopened packs for each family member';
comment on column pack_inventory.pack_type is 'Type of pack (e.g., poke_ball, great_ball)';
comment on column pack_inventory.status is 'Current status of the pack (unopened or opened)';
comment on column pack_inventory.cost_paid is 'Amount of Pokéballs paid for this pack';
comment on column pack_inventory.opened_at is 'When the pack was opened, if it has been';

commit; 