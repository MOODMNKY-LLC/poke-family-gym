-- Migration: Add Pokéball Balance Tracking
-- Description: Add specific balance tracking for different types of Pokéballs
-- Author: CODE MNKY

begin;

-- Add Pokéball balance columns to family_members
alter table family_members
  add pokeball_balance integer not null default 0,
  add great_ball_balance integer not null default 0,
  add ultra_ball_balance integer not null default 0,
  add master_ball_balance integer not null default 0;

-- Add constraints to ensure non-negative balances
alter table family_members
  add constraint pokeball_balance_non_negative check (pokeball_balance >= 0),
  add constraint great_ball_balance_non_negative check (great_ball_balance >= 0),
  add constraint ultra_ball_balance_non_negative check (ultra_ball_balance >= 0),
  add constraint master_ball_balance_non_negative check (master_ball_balance >= 0);

-- Update pokeball_transactions table to include ball type
alter table pokeball_transactions
  add ball_type text not null default 'poke_ball';

-- Add constraint for valid ball types
alter table pokeball_transactions
  add constraint valid_ball_type check (
    ball_type in ('poke_ball', 'great_ball', 'ultra_ball', 'master_ball')
  );

-- Create function to update specific ball balance
create or replace function update_pokeball_balance()
returns trigger
language plpgsql
as $$
begin
  -- Update the member's specific ball balance
  case NEW.ball_type
    when 'poke_ball' then
      update family_members
      set pokeball_balance = pokeball_balance + NEW.amount
      where id = NEW.member_id;
    when 'great_ball' then
      update family_members
      set great_ball_balance = great_ball_balance + NEW.amount
      where id = NEW.member_id;
    when 'ultra_ball' then
      update family_members
      set ultra_ball_balance = ultra_ball_balance + NEW.amount
      where id = NEW.member_id;
    when 'master_ball' then
      update family_members
      set master_ball_balance = master_ball_balance + NEW.amount
      where id = NEW.member_id;
  end case;
  
  -- Verify balances don't go negative
  if exists (
    select 1
    from family_members
    where id = NEW.member_id
    and (
      pokeball_balance < 0 or
      great_ball_balance < 0 or
      ultra_ball_balance < 0 or
      master_ball_balance < 0
    )
  ) then
    raise exception 'Pokéball balance cannot be negative';
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for updating ball balances
drop trigger if exists update_ball_balance_on_transaction on pokeball_transactions;
create trigger update_ball_balance_on_transaction
  after insert on pokeball_transactions
  for each row
  execute function update_pokeball_balance();

-- Add comments for documentation
comment on column family_members.pokeball_balance is 'Number of regular Poké Balls owned';
comment on column family_members.great_ball_balance is 'Number of Great Balls owned';
comment on column family_members.ultra_ball_balance is 'Number of Ultra Balls owned';
comment on column family_members.master_ball_balance is 'Number of Master Balls owned';
comment on column pokeball_transactions.ball_type is 'Type of Pokéball involved in the transaction';

commit; 