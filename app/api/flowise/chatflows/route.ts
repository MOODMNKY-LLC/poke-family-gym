import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { handleFlowiseError } from '@/app/api/flowise/config'
import { FlowiseAPI } from '@/lib/flowise/api'
import type { ChatFlow } from '@/lib/flowise/types'

// GET /api/flowise/chatflows - List all chatflows
export async function GET() {
  try {
    // 1. Get chatflows from Flowise
    const flowiseResponse = await FlowiseAPI.getChatFlows()
    const flowiseChatflows = flowiseResponse.chatflows || []

    // 2. Get chatflows from Supabase
    const supabase = createClient()
    const { data: supabaseChatflows, error: supabaseError } = await supabase
      .from('chat_flow')
      .select('*')

    if (supabaseError) {
      console.error('Error fetching from Supabase:', supabaseError)
      // Continue with Flowise data only
    }

    // 3. Merge data, preferring Flowise but keeping Supabase-only entries
    const mergedChatflows = flowiseChatflows.map(flowiseFlow => {
      const supabaseFlow = supabaseChatflows?.find(sf => sf.id === flowiseFlow.id)
      return {
        ...supabaseFlow,
        ...flowiseFlow,
        flowData: typeof flowiseFlow.flowData === 'string'
          ? flowiseFlow.flowData
          : JSON.stringify(flowiseFlow.flowData)
      }
    })

    // Add any chatflows that exist only in Supabase
    if (supabaseChatflows) {
      const flowiseIds = new Set(flowiseChatflows.map(f => f.id))
      const supabaseOnlyFlows = supabaseChatflows.filter(sf => !flowiseIds.has(sf.id))
      mergedChatflows.push(...supabaseOnlyFlows)
    }

    return NextResponse.json({ chatflows: mergedChatflows })
  } catch (error) {
    console.error('Error in GET /api/flowise/chatflows:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// POST /api/flowise/chatflows - Create a new chatflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Create in Flowise
    const flowiseResponse = await FlowiseAPI.createChatflow(body)
    
    if (!flowiseResponse || !flowiseResponse.id) {
      throw new Error('Failed to create chatflow in Flowise')
    }

    // 2. Store in Supabase
    const supabase = createClient()
    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .insert({
        id: flowiseResponse.id,
        name: flowiseResponse.name,
        flowData: typeof flowiseResponse.flowData === 'string'
          ? flowiseResponse.flowData
          : JSON.stringify(flowiseResponse.flowData),
        deployed: flowiseResponse.deployed,
        isPublic: flowiseResponse.isPublic,
        category: flowiseResponse.category,
        type: flowiseResponse.type || 'chat',
        chatbotConfig: flowiseResponse.chatbotConfig,
        apiConfig: flowiseResponse.apiConfig,
        analytic: flowiseResponse.analytic,
        speechToText: flowiseResponse.speechToText
      })

    if (supabaseError) {
      console.warn('Failed to sync with Supabase:', supabaseError)
      // Don't throw as Flowise creation was successful
    }

    return NextResponse.json(flowiseResponse)
  } catch (error) {
    console.error('Error in POST /api/flowise/chatflows:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 