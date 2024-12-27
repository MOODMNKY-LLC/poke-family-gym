import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { flowiseRequest, validateChatflowConfig, handleFlowiseError } from '../config'

// Helper function to transform Flowise data to Supabase format
function transformFlowiseToSupabase(flowiseData: any) {
  return {
    id: flowiseData.id,
    name: flowiseData.name,
    flowData: flowiseData.flowData,
    deployed: flowiseData.deployed || false,
    isPublic: flowiseData.isPublic || false,
    apikeyid: flowiseData.apikeyid,
    chatbotConfig: flowiseData.chatbotConfig ? JSON.parse(flowiseData.chatbotConfig) : null,
    category: flowiseData.category,
    speechToText: flowiseData.speechToText,
    type: flowiseData.type || 'chat',
    followUpPrompts: flowiseData.followUpPrompts,
    createdDate: flowiseData.createdDate || new Date().toISOString(),
    updatedDate: flowiseData.updatedDate || new Date().toISOString(),
    apiConfig: flowiseData.apiConfig ? JSON.parse(flowiseData.apiConfig) : null,
    analytic: flowiseData.analytic ? JSON.parse(flowiseData.analytic) : null,
    systemMessage: flowiseData.systemMessage,
    temperature: flowiseData.temperature || 0.7,
    maxTokens: flowiseData.maxTokens || 2000,
    topP: flowiseData.topP || 0.95,
    frequencyPenalty: flowiseData.frequencyPenalty || 0,
    presencePenalty: flowiseData.presencePenalty || 0,
    memoryType: flowiseData.memoryType || 'simple',
    memoryWindow: flowiseData.memoryWindow || 5
  }
}

// Helper function to transform Supabase data to Flowise format
function transformSupabaseToFlowise(supabaseData: any) {
  return {
    id: supabaseData.id,
    name: supabaseData.name,
    flowData: supabaseData.flowData,
    deployed: supabaseData.deployed,
    isPublic: supabaseData.isPublic,
    apikeyid: supabaseData.apikeyid,
    chatbotConfig: supabaseData.chatbotConfig ? JSON.stringify(supabaseData.chatbotConfig) : null,
    category: supabaseData.category,
    speechToText: supabaseData.speechToText,
    type: supabaseData.type,
    followUpPrompts: supabaseData.followUpPrompts,
    createdDate: supabaseData.createdDate,
    updatedDate: supabaseData.updatedDate,
    apiConfig: supabaseData.apiConfig ? JSON.stringify(supabaseData.apiConfig) : null,
    analytic: supabaseData.analytic ? JSON.stringify(supabaseData.analytic) : null,
    systemMessage: supabaseData.systemMessage,
    temperature: supabaseData.temperature,
    maxTokens: supabaseData.maxTokens,
    topP: supabaseData.topP,
    frequencyPenalty: supabaseData.frequencyPenalty,
    presencePenalty: supabaseData.presencePenalty,
    memoryType: supabaseData.memoryType,
    memoryWindow: supabaseData.memoryWindow
  }
}

// GET /api/flowise/chatflows - Get all chatflows
export async function GET(req: NextRequest) {
  try {
    // Get chatflows from Flowise
    const flowiseData = await flowiseRequest('chatflows')

    // Get chatflows from Supabase
    const supabase = createClient()
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('chat_flow')
      .select('*')
      .order('createdDate', { ascending: false })

    if (supabaseError) {
      throw supabaseError
    }

    // Merge data, preferring Flowise data but keeping Supabase's additional fields
    const mergedFlows = (supabaseData || []).map(flow => transformSupabaseToFlowise(flow))
    
    flowiseData.forEach((flowiseFlow: any) => {
      const existingIndex = mergedFlows.findIndex(f => f.id === flowiseFlow.id)
      if (existingIndex >= 0) {
        mergedFlows[existingIndex] = {
          ...mergedFlows[existingIndex],
          ...flowiseFlow,
          flowData: typeof flowiseFlow.flowData === 'string' 
            ? flowiseFlow.flowData 
            : JSON.stringify(flowiseFlow.flowData)
        }
      } else {
        mergedFlows.push(flowiseFlow)
      }
    })

    return NextResponse.json(mergedFlows)
  } catch (error) {
    console.error('Error in GET /api/flowise/chatflows:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// POST /api/flowise/chatflows - Create a new chatflow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    validateChatflowConfig(body)

    // Create in Flowise
    const flowiseData = await flowiseRequest('chatflows', {
      method: 'POST',
      body: JSON.stringify(body)
    })

    // Transform and sync with Supabase
    const supabase = createClient()
    const supabaseData = transformFlowiseToSupabase(flowiseData)

    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .insert([supabaseData])

    if (supabaseError) {
      console.warn('Failed to sync with Supabase:', supabaseError)
    }

    return NextResponse.json(flowiseData)
  } catch (error) {
    console.error('Error in POST /api/flowise/chatflows:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// PUT /api/flowise/chatflows/[id] - Update a chatflow
export async function PUT(req: NextRequest) {
  try {
    const id = req.url.split('/').pop()
    if (!id) {
      throw new Error('Chatflow ID is required')
    }

    const body = await req.json()
    validateChatflowConfig(body)

    // Update in Flowise
    const flowiseData = await flowiseRequest(`chatflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })

    // Transform and sync with Supabase
    const supabase = createClient()
    const supabaseData = transformFlowiseToSupabase(flowiseData)

    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .update(supabaseData)
      .eq('id', id)

    if (supabaseError) {
      console.warn('Failed to sync with Supabase:', supabaseError)
    }

    return NextResponse.json(flowiseData)
  } catch (error) {
    console.error('Error in PUT /api/flowise/chatflows:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// DELETE /api/flowise/chatflows/[id] - Delete a chatflow
export async function DELETE(req: NextRequest) {
  try {
    const id = req.url.split('/').pop()
    if (!id) {
      throw new Error('Chatflow ID is required')
    }

    // Delete from Flowise
    await flowiseRequest(`chatflows/${id}`, {
      method: 'DELETE'
    })

    // Sync with Supabase
    const supabase = createClient()
    
    // First, remove any references from family_members
    await supabase
      .from('family_members')
      .update({ chatflow_id: null })
      .eq('chatflow_id', id)

    // Then delete the chatflow
    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .delete()
      .eq('id', id)

    if (supabaseError) {
      console.warn('Failed to sync with Supabase:', supabaseError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/flowise/chatflows:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 