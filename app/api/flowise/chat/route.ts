import { FlowiseClient } from 'flowise-sdk'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { chatflowId, question, sessionId } = await req.json()

    // Validate required fields
    if (!chatflowId) {
      return new Response(
        JSON.stringify({ error: 'Missing chatflow ID' }), 
        { status: 400 }
      )
    }
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Missing question' }), 
        { status: 400 }
      )
    }

    // Initialize Flowise client
    const client = new FlowiseClient({ 
      baseUrl: process.env.FLOWISE_API_URL,
      apiKey: process.env.FLOWISE_API_KEY 
    })

    // Create prediction without streaming
    const prediction = await client.createPrediction({
      chatflowId,
      question,
      sessionId,
      streaming: false,
    })

    // Return the response
    return new Response(
      JSON.stringify({ content: prediction }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    )
  }
} 