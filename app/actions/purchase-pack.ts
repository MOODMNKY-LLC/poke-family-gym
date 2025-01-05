import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function purchasePack({ packId, userId }: { packId: string, userId: string }) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    console.log('Starting purchase process for:', { packId, userId })

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('id, family_id, pokeball_balance')
      .eq('id', userId)
      .single()

    if (memberError) throw new Error(`Failed to fetch member data: ${memberError.message}`)
    if (!member) throw new Error('Member not found')

    console.log('Member data:', { 
      memberId: member.id,
      familyId: member.family_id,
      currentBalance: member.pokeball_balance 
    })

    // Get pack cost
    const packCosts = {
      'poke_ball': 25,
      'great_ball': 50,
      'ultra_ball': 75,
      'master_ball': 100
    }
    const cost = packCosts[packId as keyof typeof packCosts]
    if (!cost) throw new Error('Invalid pack type')

    console.log('Pack details:', { packId, cost })

    // Check if user has enough Pokéballs
    if (member.pokeball_balance < cost) {
      throw new Error(`Not enough Pokéballs. Required: ${cost}, Available: ${member.pokeball_balance}`)
    }

    // Create purchase transaction
    const { data: transaction, error: purchaseError } = await supabase
      .from('pokeball_transactions')
      .insert({
        member_id: userId,
        family_id: member.family_id,
        ball_type: 'poke_ball',
        amount: -cost,
        reason: `Purchased ${packId.replace('_', ' ')} pack`,
        details: {
          transaction_type: 'purchase',
          pack_type: packId,
          pack_cost: cost
        }
      })
      .select()
      .single()

    if (purchaseError) throw new Error(`Failed to process purchase: ${purchaseError.message}`)
    console.log('Transaction created:', transaction)

    // Add pack to user's inventory
    const { data: pack, error: packError } = await supabase
      .from('pack_inventory')
      .insert({
        member_id: userId,
        family_id: member.family_id,
        pack_type: packId,
        status: 'unopened',
        cost_paid: cost
      })
      .select()
      .single()

    if (packError) {
      console.error('Pack inventory error:', packError)
      throw new Error(`Failed to add pack to inventory: ${packError.message}`)
    }

    console.log('Pack added to inventory:', pack)

    // Get updated balance
    const { data: updatedMember } = await supabase
      .from('family_members')
      .select('pokeball_balance')
      .eq('id', userId)
      .single()

    return { 
      success: true,
      transaction,
      pack,
      previousBalance: member.pokeball_balance,
      newBalance: updatedMember?.pokeball_balance
    }
  } catch (error: any) {
    console.error('Purchase error:', error)
    throw new Error(error.message || 'Failed to purchase pack')
  }
} 