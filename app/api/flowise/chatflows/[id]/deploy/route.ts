import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { flowiseRequest, handleFlowiseError } from '@/app/api/flowise/config'

// POST /api/flowise/chatflows/[id]/deploy
export async function POST(req: NextRequest) {
  try {
    const id = req.url.split('/').pop()
    if (!id) {
      throw new Error('Chatflow ID is required')
    }

    // Deploy in Flowise
    const flowiseData = await flowiseRequest(`chatflows/${id}/deploy`, {
      method: 'POST'
    })

    // Update deployment status in Supabase
    const supabase = createClient()
    const { error: supabaseError } = await supabase
      .from('chat_flow')
      .update({
        deployed: true,
        updatedDate: new Date().toISOString()
      })
      .eq('id', id)

    if (supabaseError) {
      console.warn('Failed to update deployment status in Supabase:', supabaseError)
    }

    return NextResponse.json(flowiseData)
  } catch (error) {
    console.error('Error in POST /api/flowise/chatflows/[id]/deploy:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 