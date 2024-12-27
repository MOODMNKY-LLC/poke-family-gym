import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

export interface ChatFlow {
  id: string
  name: string
  flowData: string
  deployed: boolean
  isPublic: boolean
  apikeyid: string | null
  chatbotConfig: string | null
  category: string | null
  speechToText: string | null
  type: string
  followUpPrompts: string | null
  createdDate: string
  updatedDate: string
  apiConfig: string | null
  analytic: string | null
  systemMessage: string | null
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  memoryType: string
  memoryWindow: number
}

export interface ChatFlowAssignment {
  id: string
  member_id: string
  chatflow_id: string
  role: string
  created_at: string
  updated_at: string
}

export const ChatFlowsAPI = {
  /**
   * Fetch all available chatflows
   */
  async getChatFlows(): Promise<ChatFlow[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('chat_flow')
      .select('*')
      .order('name')
    
    if (error) throw error

    // Convert the raw data to match our ChatFlow interface
    return data.map(flow => ({
      ...flow,
      // Ensure all required fields have default values
      flowData: flow.flowData || '',
      deployed: flow.deployed ?? true,
      isPublic: flow.isPublic ?? false,
      type: flow.type || 'chat',
      systemMessage: flow.systemMessage || null,
      temperature: flow.temperature ?? 0.7,
      maxTokens: flow.maxTokens ?? 2000,
      topP: flow.topP ?? 0.95,
      frequencyPenalty: flow.frequencyPenalty ?? 0,
      presencePenalty: flow.presencePenalty ?? 0,
      memoryType: flow.memoryType || 'zep',
      memoryWindow: flow.memoryWindow ?? 10
    }))
  },

  /**
   * Fetch chatflow assignments for a family member
   */
  async getMemberChatFlows(memberId: string): Promise<ChatFlowAssignment[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('family_member_chatflows')
      .select('*')
      .eq('member_id', memberId)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data as ChatFlowAssignment[]
  },

  /**
   * Assign a chatflow to a family member
   */
  async assignChatFlow({
    memberId,
    chatflowId,
    role = 'user'
  }: {
    memberId: string
    chatflowId: string
    role?: string
  }): Promise<ChatFlowAssignment> {
    const supabase = createClient()
    
    // Call the RPC function to assign the chatflow
    const { data, error } = await supabase
      .rpc('assign_chatflow_to_member', {
        p_member_id: memberId,
        p_chatflow_id: chatflowId,
        p_role: role
      })
    
    if (error) throw error

    // Fetch the created assignment
    const { data: assignment, error: fetchError } = await supabase
      .from('family_member_chatflows')
      .select('*')
      .eq('id', data)
      .single()
    
    if (fetchError) throw fetchError
    return assignment as ChatFlowAssignment
  },

  /**
   * Remove a chatflow assignment from a family member
   */
  async removeChatFlow(memberId: string, chatflowId: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('family_member_chatflows')
      .delete()
      .match({ member_id: memberId, chatflow_id: chatflowId })
    
    if (error) throw error
  }
} 