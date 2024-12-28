import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL
const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY

// Helper function to handle Flowise API calls
async function flowiseRequest(endpoint: string, options: RequestInit = {}) {
  if (!FLOWISE_API_URL || !FLOWISE_API_KEY) {
    throw new Error('Flowise API configuration missing')
  }

  const url = `${FLOWISE_API_URL}/${endpoint}`
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${FLOWISE_API_KEY}`)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Flowise API error: ${response.status} - ${errorText}`)
  }

  return response.json()
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

    // Merge data, preferring Flowise data
    const mergedFlows = [...(supabaseData || [])]
    flowiseData.forEach((flowiseFlow: any) => {
      const existingIndex = mergedFlows.findIndex(f => f.id === flowiseFlow.id)
      if (existingIndex >= 0) {
        mergedFlows[existingIndex] = {
          ...mergedFlows[existingIndex],
          ...flowiseFlow,
          flowData: JSON.stringify(flowiseFlow.flowData)
        }
      } else {
        mergedFlows.push({
          id: flowiseFlow.id,
          name: flowiseFlow.name,
          flowData: JSON.stringify(flowiseFlow.flowData),
          deployed: flowiseFlow.deployed || false,
          isPublic: flowiseFlow.isPublic || false,
          apikeyid: flowiseFlow.apikeyid,
          chatbotConfig: flowiseFlow.chatbotConfig,
          createdDate: flowiseFlow.createdDate || new Date().toISOString(),
          updatedDate: flowiseFlow.updatedDate || new Date().toISOString(),
          apiConfig: flowiseFlow.apiConfig,
          analytic: flowiseFlow.analytic,
          category: flowiseFlow.category,
          speechToText: flowiseFlow.speechToText,
          type: flowiseFlow.type,
          followUpPrompts: flowiseFlow.followUpPrompts
        })
      }
    })

    return NextResponse.json(mergedFlows)
  } catch (error) {
    console.error('Error in GET /api/flowise/chatflows:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/flowise/chatflows - Create a new chatflow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Create in Flowise
    const flowiseData = await flowiseRequest('chatflows', {
      method: 'POST',
      body: JSON.stringify(body)
    })

    // Sync with Supabase
    const supabase = createClient()
    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .insert([{
        id: flowiseData.id,
        name: body.name,
        flowData: JSON.stringify(body.flowData),
        deployed: body.deployed,
        isPublic: body.isPublic,
        apikeyid: body.apikeyid,
        chatbotConfig: body.chatbotConfig,
        category: body.category,
        speechToText: body.speechToText,
        type: body.type,
        followUpPrompts: body.followUpPrompts,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      }])

    if (supabaseError) {
      console.warn('Failed to sync with Supabase:', supabaseError)
    }

    return NextResponse.json(flowiseData)
  } catch (error) {
    console.error('Error in POST /api/flowise/chatflows:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}

// PATCH /api/flowise/chatflows/[id] - Update a chatflow
export async function PATCH(req: NextRequest) {
  try {
    const id = req.url.split('/').pop()
    if (!id) {
      throw new Error('Chatflow ID is required')
    }

    const body = await req.json()

    // Update in Flowise
    const flowiseData = await flowiseRequest(`chatflows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })

    // Sync with Supabase
    const supabase = createClient()
    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .update({
        name: body.name,
        flowData: JSON.stringify(body.flowData),
        deployed: body.deployed,
        isPublic: body.isPublic,
        apikeyid: body.apikeyid,
        chatbotConfig: body.chatbotConfig,
        category: body.category,
        speechToText: body.speechToText,
        type: body.type,
        followUpPrompts: body.followUpPrompts,
        updatedDate: new Date().toISOString()
      })
      .eq('id', id)

    if (supabaseError) {
      console.warn('Failed to sync with Supabase:', supabaseError)
    }

    return NextResponse.json(flowiseData)
  } catch (error) {
    console.error('Error in PATCH /api/flowise/chatflows:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
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
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
