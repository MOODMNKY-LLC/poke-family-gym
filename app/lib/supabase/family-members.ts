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

interface RemoveChatflowResult {
  removedCount: number
  members: Array<{ id: string, display_name: string }>
}

interface AssignChatflowResponse {
  success: boolean
  message: string
  data?: any
  error?: any
}

export const FamilyMembersAPI = {
  // Get all family members
  async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const supabase = createClient()

      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!user) {
        throw new Error('No authenticated user found')
      }

      console.debug('Fetching family members as user:', {
        userId: user.id,
        email: user.email
      })

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

      if (error) {
        console.error('Database error:', {
          error,
          context: {
            userId: user.id,
            errorCode: error.code,
            details: error.details
          }
        })
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching family members:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      })
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
  async removeChatflowAssignments(chatflowId: string): Promise<RemoveChatflowResult> {
    try {
      const supabase = createClient()

      // Get members with this chatflow before updating
      const { data: members, error: fetchError } = await supabase
        .from('family_members')
        .select('id, display_name')
        .eq('chatflow_id', chatflowId)

      if (fetchError) {
        console.error('Error fetching members with chatflow:', {
          chatflowId,
          error: fetchError,
          timestamp: new Date().toISOString()
        })
        throw fetchError
      }

      // Update all members with this chatflow_id to null
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ 
          chatflow_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('chatflow_id', chatflowId)

      if (updateError) {
        console.error('Error removing chatflow assignments:', {
          chatflowId,
          error: updateError,
          timestamp: new Date().toISOString()
        })
        throw updateError
      }

      console.debug('Successfully removed chatflow assignments:', {
        chatflowId,
        removedCount: members?.length || 0,
        members,
        timestamp: new Date().toISOString()
      })

      return {
        removedCount: members?.length || 0,
        members: members || []
      }
    } catch (error: unknown) {
      console.error('Error removing chatflow assignments:', {
        error,
        context: {
          chatflowId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      })
      throw error instanceof Error ? error : new Error('Failed to remove chatflow assignments')
    }
  }
} 