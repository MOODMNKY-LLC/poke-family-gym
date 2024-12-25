import { NextResponse } from 'next/server'

interface ChatRequest {
  message: string
  chatId: string
  chatflowId?: string
  history: Array<{
    role: 'user' | 'assistant'
    content: string
    uploads?: Array<{
      data: string
      type: string
      name: string
      mime: string
    }>
  }>
}

export async function POST(request: Request) {
  try {
    const { message, chatId, chatflowId, history } = await request.json() as ChatRequest

    // Use the provided chatflowId or fall back to the default
    const flowiseApiUrl = chatflowId 
      ? `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/prediction/${chatflowId}`
      : `${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/prediction/${process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID}`

    const response = await fetch(flowiseApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLOWISE_API_KEY}`
      },
      body: JSON.stringify({
        question: message,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content,
          uploads: msg.uploads
        })),
        chatId,
        overrideConfig: {
          returnSourceDocuments: true
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get response from Flowise')
    }

    const data = await response.json()

    return NextResponse.json({ message: data.text })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
} 