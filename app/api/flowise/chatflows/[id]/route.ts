import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { handleFlowiseError } from '@/app/api/flowise/config'

// GET /api/flowise/chatflows/[id]
export async function GET(req: NextRequest) {
  try {
    const id = req.url.split('/').pop()
    if (!id) {
      return NextResponse.json(
        { error: 'Chatflow ID is required' },
        { status: 400 }
      )
    }

    // Get from Flowise
    try {
      const flowiseResponse = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/chatflows/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
        }
      })

      if (!flowiseResponse.ok) {
        const contentType = flowiseResponse.headers.get('content-type')
        let errorMessage
        
        if (contentType?.includes('application/json')) {
          const errorData = await flowiseResponse.json()
          errorMessage = errorData.error || 'Unknown error occurred'
        } else {
          errorMessage = await flowiseResponse.text()
        }

        console.error('Flowise API error:', {
          status: flowiseResponse.status,
          statusText: flowiseResponse.statusText,
          error: errorMessage
        })

        return NextResponse.json(
          { error: errorMessage },
          { status: flowiseResponse.status }
        )
      }

      const flowiseData = await flowiseResponse.json()
      
      // Get from Supabase
      const supabase = createClient()
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('chat_flow')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError && supabaseError.code !== 'PGRST116') { // Ignore not found error
        throw supabaseError
      }

      // Merge data, preferring Flowise
      const mergedData = {
        ...(supabaseData || {}),
        ...flowiseData,
        flowData: typeof flowiseData.flowData === 'string' 
          ? flowiseData.flowData 
          : JSON.stringify(flowiseData.flowData)
      }

      return NextResponse.json(mergedData)
    } catch (flowiseError) {
      console.error('Error fetching from Flowise:', flowiseError)
      
      // Check if chatflow exists in Supabase
      const supabase = createClient()
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('chat_flow')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') { // Not found
          return NextResponse.json(
            { error: 'Chatflow not found' },
            { status: 404 }
          )
        }
        throw supabaseError
      }

      return NextResponse.json(supabaseData)
    }
  } catch (error) {
    console.error('Error in GET /api/flowise/chatflows/[id]:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 