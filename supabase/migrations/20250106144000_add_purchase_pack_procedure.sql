-- Migration: Add Purchase Pack Procedure
-- Description: Add stored procedure for handling pack purchases
-- Author: CODE MNKY

begin;

-- Create function to handle pack purchases
create or replace function purchase_pack(
  p_pack_id bigint,
  p_member_id uuid,
  p_cost_type text,
  p_cost_amount integer,
  p_rewards jsonb
) returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_balance_field text;
  v_current_balance integer;
  v_transaction_id bigint;
begin
  -- Construct the balance field name
  v_balance_field := p_cost_type || '_balance';
  
  -- Start transaction
  begin
    -- Lock the member row for update
    select current_setting(v_balance_field)::integer into v_current_balance
    from family_members
    where id = p_member_id
    for update;
    
    -- Check balance again (in case it changed)
    if v_current_balance < p_cost_amount then
      raise exception 'Insufficient balance';
    end if;
    
    -- Deduct cost from balance
    execute format('
      update family_members 
      set %I = %I - $1
      where id = $2
    ', v_balance_field, v_balance_field)
    using p_cost_amount, p_member_id;
    
    -- Record transaction
    insert into pokeball_transactions (
      member_id,
      transaction_type,
      amount,
      pokeball_type,
      metadata
    ) values (
      p_member_id,
      'pack_purchase',
      p_cost_amount,
      p_cost_type,
      jsonb_build_object(
        'pack_id', p_pack_id,
        'rewards', p_rewards
      )
    ) returning id into v_transaction_id;
    
    -- Add rewards to member's collection
    insert into member_pokemon (
      member_id,
      pokemon_id,
      variant,
      is_shiny,
      obtained_at,
      obtained_from
    )
    select 
      p_member_id,
      (reward->>'pokemonId')::integer,
      coalesce((reward->>'variant')::pokemon_variant, 'normal'),
      coalesce((reward->>'shiny')::boolean, false),
      now(),
      'pack_purchase'
    from jsonb_array_elements(p_rewards) as reward;
    
    -- Return transaction info
    return jsonb_build_object(
      'success', true,
      'transaction_id', v_transaction_id
    );
  exception
    when others then
      -- Rollback will happen automatically
      raise exception 'Transaction failed: %', sqlerrm;
  end;
end;
$$;

-- Add helpful comments
comment on function purchase_pack is 'Handles the purchase of a pack, including balance check, cost deduction, and reward distribution';

commit; 