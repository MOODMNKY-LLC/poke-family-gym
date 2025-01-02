import { createClient } from './client'
import { FamilyMember } from '@/types'

export interface PokeBallBalance {
  pokeball_balance: number
  great_ball_balance: number
  ultra_ball_balance: number
  master_ball_balance: number
}

export type BallType = 'poke_ball' | 'great_ball' | 'ultra_ball' | 'master_ball'

export const PokeBallsAPI = {
  async getMemberBalance(memberId: string): Promise<PokeBallBalance> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          pokeball_balance,
          great_ball_balance,
          ultra_ball_balance,
          master_ball_balance
        `)
        .eq('id', memberId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching Pokéball balance:', error)
      throw error
    }
  },

  async addPokeBalls(memberId: string, ballType: BallType, amount: number, reason: string): Promise<void> {
    if (amount <= 0) throw new Error('Amount must be positive')

    try {
      const supabase = createClient()

      const { error: transactionError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: memberId,
          ball_type: ballType,
          amount: amount,
          reason: reason,
          details: {}
        })

      if (transactionError) throw transactionError
    } catch (error) {
      console.error('Error adding Pokéballs:', error)
      throw error
    }
  },

  async spendPokeBalls(memberId: string, ballType: BallType, amount: number, reason: string): Promise<void> {
    if (amount <= 0) throw new Error('Amount must be positive')

    try {
      const supabase = createClient()

      // First check if member has enough balls
      const balance = await this.getMemberBalance(memberId)
      const currentBalance = balance[`${ballType.replace('_', '')}_balance` as keyof PokeBallBalance]
      
      if (currentBalance < amount) {
        throw new Error(`Not enough ${ballType.replace('_', ' ')}s`)
      }

      const { error: transactionError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: memberId,
          ball_type: ballType,
          amount: -amount, // Negative amount for spending
          reason: reason,
          details: {}
        })

      if (transactionError) throw transactionError
    } catch (error) {
      console.error('Error spending Pokéballs:', error)
      throw error
    }
  },

  async getTransactionHistory(memberId: string): Promise<Array<{
    ball_type: BallType
    amount: number
    reason: string
    created_at: string
  }>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('pokeball_transactions')
        .select(`
          ball_type,
          amount,
          reason,
          created_at
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      throw error
    }
  }
} 