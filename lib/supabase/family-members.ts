import { createClient } from '@/lib/supabase/client'

export interface FamilyMember {
  id: string
  display_name: string
  chatflow_id?: string
  family_id: string
  full_name: string
  role_id: string
  starter_pokemon_form_id: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export const FamilyMembersAPI = {
  // Get all family members
  async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          id,
          display_name,
          chatflow_id,
          family_id,
          full_name,
          role_id,
          starter_pokemon_form_id,
          avatar_url,
          created_at,
          updated_at
        `)
        .order('display_name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching family members:', error)
      throw error
    }
  },

  // Update a family member's chatflow assignment
  async updateChatflowAssignment(memberId: string, chatflowId: string | null): Promise<void> {
    if (!memberId) {
      throw new Error('Member ID is required')
    }

    try {
      const supabase = createClient()
      
      console.debug('Updating chatflow assignment:', {
        memberId,
        chatflowId,
        timestamp: new Date().toISOString()
      })

      const { data, error } = await supabase
        .from('family_members')
        .update({ 
          chatflow_id: chatflowId,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single()

      console.debug('Update result:', {
        success: !!data,
        error,
        member: data,
        timestamp: new Date().toISOString()
      })

      if (error) {
        // Handle specific error cases
        if (error.code === '42501') {
          throw new Error('You do not have permission to update this family member')
        }
        if (error.code === 'P0001' && error.message.includes('does not exist')) {
          throw new Error('The selected chatflow does not exist')
        }
        throw error
      }

    } catch (error: unknown) {
      console.error('Error updating chatflow assignment:', {
        memberId,
        chatflowId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  },

  // Remove chatflow assignments for a specific chatflow
  async removeChatflowAssignments(chatflowId: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('family_members')
        .update({ chatflow_id: null })
        .eq('chatflow_id', chatflowId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing chatflow assignments:', error)
      throw error
    }
  }
} 