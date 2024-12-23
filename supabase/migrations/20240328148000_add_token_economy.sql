-- Migration: Add Token Economy
-- Description: Add token balance and transaction tracking for family members
-- Author: MOODMNKY LLC

begin;

-- Add token balance to family_members
alter table family_members
  add column if not exists token_balance integer default 0 check (token_balance >= 0);

-- Create token transaction history table
create table token_transactions (
  id bigint generated always as identity primary key,
  family_member_id uuid references family_members(id) on delete cascade not null,
  amount integer not null,
  transaction_type text not null,
  description text,
  created_at timestamptz default now() not null,
  
  -- Ensure valid transaction types
  constraint valid_transaction_type check (
    transaction_type in ('EARN', 'SPEND', 'ADMIN_ADJUST', 'REWARD')
  ),
  
  -- Ensure amount makes sense for transaction type
  constraint valid_amount_for_type check (
    (transaction_type in ('EARN', 'ADMIN_ADJUST') and amount >= 0) or
    (transaction_type = 'SPEND' and amount <= 0) or
    (transaction_type = 'REWARD' and amount >= 0)
  )
);

comment on table token_transactions is 'Records all token balance changes for family members';
comment on column token_transactions.amount is 'Positive for earning, negative for spending';
comment on column token_transactions.transaction_type is 'Type of transaction that caused the balance change';

-- Enable RLS
alter table token_transactions enable row level security;

-- Add policies for token_transactions
create policy "Users can view their own token transactions"
on token_transactions
for select
using (
  exists (
    select 1
    from family_members fm
    where fm.id = token_transactions.family_member_id
    and fm.family_id in (
      select fp.id
      from family_profiles fp
      where fp.id = auth.uid()
    )
  )
);

create policy "Users can insert token transactions for their family"
on token_transactions
for insert
with check (
  exists (
    select 1
    from family_members fm
    join family_profiles fp on fp.id = fm.family_id
    where fm.id = token_transactions.family_member_id
    and fp.id = auth.uid()
  )
);

-- Create function to update member balance on transaction
create or replace function update_member_balance()
returns trigger as $$
begin
  -- Update the member's balance
  update family_members
  set token_balance = token_balance + NEW.amount
  where id = NEW.family_member_id;
  
  -- Verify balance doesn't go negative
  if exists (
    select 1
    from family_members
    where id = NEW.family_member_id
    and token_balance < 0
  ) then
    raise exception 'Token balance cannot be negative';
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger to update balance on transaction
create trigger update_balance_on_transaction
  after insert on token_transactions
  for each row
  execute function update_member_balance();

commit; 