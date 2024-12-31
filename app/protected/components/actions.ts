'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { FlowiseAPI } from '@/lib/flowise/api'

interface AssignmentUpdate {
  id: string
  chatflow_id: string | null
  session_id?: string | null
  updated_at: string
}

export async function updateChatflowAssignments(updates: AssignmentUpdate[]) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Attempting to update assignments:', updates)

    // First verify that all chatflows exist in Flowise
    const chatflowIds = updates
      .map(u => u.chatflow_id)
      .filter((id): id is string => id !== null)

    if (chatflowIds.length > 0) {
      // Fetch chatflows from Flowise
      const flowisePromises = chatflowIds.map(async (id) => {
        try {
          const chatflow = await FlowiseAPI.getChatFlow(id)
          return chatflow ? {
            id: chatflow.id,
            name: chatflow.name,
            isPublic: chatflow.isPublic ?? false,
            deployed: chatflow.deployed ?? false,
            flowData: chatflow.flowData ?? '{}',
            chatbotConfig: chatflow.chatbotConfig ?? '{}',
            apiConfig: chatflow.apiConfig ?? '{}',
            analytic: chatflow.analytic ?? '{}',
            category: chatflow.category ?? 'Default',
            type: chatflow.type ?? 'Generic',
            speechToText: chatflow.speechToText ?? null,
            followUpPrompts: chatflow.followUpPrompts ?? '[]'
          } : null
        } catch (e) {
          console.error(`Error fetching chatflow ${id} from Flowise:`, e)
          return null
        }
      })

      const flowiseData = await Promise.all(flowisePromises)
      const validFlows = flowiseData.filter((flow): flow is NonNullable<typeof flow> => flow !== null)
      
      if (validFlows.length !== chatflowIds.length) {
        const foundIds = new Set(validFlows.map(f => f.id))
        const missingIds = chatflowIds.filter(id => !foundIds.has(id))
        throw new Error(`Some chatflows not found in Flowise: ${missingIds.join(', ')}`)
      }

      // Sync Flowise data to Supabase
      const { error: syncError } = await supabase
        .from('chat_flow')
        .upsert(validFlows, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (syncError) {
        console.error('Error syncing chatflows to database:', syncError)
        throw new Error(syncError.message)
      }
    }

    // Get existing members to preserve required fields
    const { data: existingMembers, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .in('id', updates.map(u => u.id))

    if (fetchError) {
      console.error('Error fetching existing members:', fetchError)
      throw new Error(fetchError.message)
    }

    // Merge updates with existing data
    const mergedUpdates = updates.map(update => {
      const existing = existingMembers?.find(m => m.id === update.id)
      if (!existing) {
        throw new Error(`Member not found: ${update.id}`)
      }
      return {
        ...existing,
        chatflow_id: update.chatflow_id,
        session_id: update.session_id,
        updated_at: update.updated_at
      }
    })

    // Update family members with new assignments
    const { data, error } = await supabase
      .from('family_members')
      .upsert(mergedUpdates, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error updating assignments:', error)
      throw new Error(error.message)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateChatflowAssignments:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 