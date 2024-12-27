import { createClient } from '@/lib/supabase/client'

export interface FamilyMember {
  id: string
  display_name: string
  chatflow_id?: string | null
  family_id: string
  full_name: string
  role_id: string
  starter_pokemon_form_id: string
  avatar_url?: string
  created_at: string
  updated_at: string
  current_status?: string
  starter_pokemon_nickname?: string
  starter_pokemon_obtained_at?: string
}

export const FamilyMembersAPI = {
  // Get all family members
  async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const supabase = createClient()

      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No authenticated user found')

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
          updated_at,
          current_status,
          starter_pokemon_nickname,
          starter_pokemon_obtained_at
        `)
        .eq('family_id', user.id)
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
    if (!memberId) throw new Error('Member ID is required')

    try {
      console.debug('Starting chatflow assignment update:', {
        memberId,
        chatflowId,
        timestamp: new Date().toISOString()
      })

      const supabase = createClient()

      // First verify the member exists
      const { data: member, error: checkError } = await supabase
        .from('family_members')
        .select('id, display_name')
        .eq('id', memberId)
        .single()

      if (checkError) {
        console.error('Error checking member existence:', {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint
        })
        throw new Error(`Failed to verify member: ${checkError.message}`)
      }

      if (!member) {
        throw new Error(`Member with ID ${memberId} not found`)
      }

      // Then update the chatflow assignment
      const { data: updated, error: updateError } = await supabase
        .from('family_members')
        .update({ 
          chatflow_id: chatflowId,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()

      if (updateError) {
        console.error('Error updating chatflow assignment:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        throw new Error(`Failed to update chatflow assignment: ${updateError.message}`)
      }

      console.debug('Successfully updated chatflow assignment:', {
        memberId,
        memberName: member.display_name,
        chatflowId,
        updatedMember: updated?.[0],
        timestamp: new Date().toISOString()
      })

    } catch (error: unknown) {
      console.error('Error in updateChatflowAssignment:', {
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