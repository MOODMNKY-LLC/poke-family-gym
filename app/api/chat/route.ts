import { NextResponse } from 'next/server'

const FLOWISE_API_URL = process.env.NEXT_PUBLIC_FLOWISE_API_URL || process.env.FLOWISE_API_URL
const FLOWISE_API_KEY = process.env.NEXT_PUBLIC_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY
const FLOWISE_CHATFLOW_ID = process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID

interface ChatRequest {
  message: string
  chatId: string
  history: {
    role: 'user' | 'assistant'
    content: string
    uploads?: {
      data: string
      type: 'file'
      name: string
      mime: string
    }[]
  }[]
}

export async function POST(request: Request) {
  try {
    const { message, chatId, history } = await request.json() as ChatRequest
    
    if (!FLOWISE_API_URL || !FLOWISE_API_KEY || !FLOWISE_CHATFLOW_ID) {
      throw new Error('Missing Flowise configuration')
    }

    // Get the latest message's uploads if any
    const latestMessage = history[history.length - 1]
    const uploads = latestMessage?.uploads || []

    // Format history for Flowise
    const formattedHistory = history.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Prepare the request body
    const requestBody: any = {
      question: message,
      history: formattedHistory,
      chatId,
      overrideConfig: {
        returnSourceDocuments: true
      }
    }

    // Add uploads if present
    if (uploads.length > 0) {
      requestBody.uploads = uploads.map(upload => ({
        data: upload.data,
        type: upload.type,
        name: upload.name,
        mime: upload.mime
      }))
    }

    console.log('Sending request to Flowise:', {
      url: `${FLOWISE_API_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`,
      hasUploads: uploads.length > 0,
      historyLength: formattedHistory.length
    })

    // Send request to Flowise API
    const flowiseResponse = await fetch(`${FLOWISE_API_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!flowiseResponse.ok) {
      const errorText = await flowiseResponse.text()
      console.error('Flowise API error:', {
        status: flowiseResponse.status,
        statusText: flowiseResponse.statusText,
        error: errorText
      })
      throw new Error(`Flowise API error: ${flowiseResponse.status} ${flowiseResponse.statusText}`)
    }

    const data = await flowiseResponse.json()
    
    return NextResponse.json({ 
      message: data.text,
      sourceDocuments: data.sourceDocuments
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat message' },
      { status: 500 }
    )
  }
} 