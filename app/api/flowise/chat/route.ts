import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { flowiseRequest, handleFlowiseError, FlowiseError } from '../config'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// POST /api/flowise/chat - Send a chat message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chatflowId, message, history = [], overrideConfig, files } = body

    console.debug('Processing chat request:', {
      chatflowId,
      messageLength: message?.length,
      historyLength: history?.length,
      hasFiles: !!files
    })

    if (!chatflowId) {
      console.warn('Chat request missing chatflowId')
      return NextResponse.json(
        { error: 'Chatflow ID is required' },
        { status: 400 }
      )
    }

    // First, verify the chatflow exists and is deployed
    const supabase = createClient()
    const { data: chatflow, error: chatflowError } = await supabase
      .from('chat_flow')
      .select('*')
      .eq('id', chatflowId)
      .single()

    if (chatflowError) {
      console.error('Error fetching chatflow:', chatflowError)
      return NextResponse.json(
        { error: 'Failed to fetch chatflow' },
        { status: 500 }
      )
    }

    if (!chatflow) {
      console.warn('Chatflow not found:', chatflowId)
      return NextResponse.json(
        { error: 'Chatflow not found' },
        { status: 404 }
      )
    }

    if (!chatflow.deployed) {
      console.warn('Attempted to use undeployed chatflow:', chatflowId)
      return NextResponse.json(
        { error: 'Chatflow is not deployed' },
        { status: 400 }
      )
    }

    // Prepare the chat request
    const chatRequest = {
      question: message,
      history: history.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      overrideConfig: {
        ...overrideConfig,
        systemMessage: chatflow.systemMessage || overrideConfig?.systemMessage,
        temperature: chatflow.temperature || overrideConfig?.temperature,
        maxTokens: chatflow.maxTokens || overrideConfig?.maxTokens
      },
      files
    }

    console.debug('Sending request to Flowise:', {
      chatflowId,
      requestSize: JSON.stringify(chatRequest).length
    })

    // Send the chat request to Flowise
    try {
      const response = await flowiseRequest(`chatflows/${chatflowId}/predict`, {
        method: 'POST',
        body: JSON.stringify(chatRequest)
      })

      // Ensure response has the expected format
      if (!response || typeof response.text !== 'string') {
        console.error('Invalid Flowise response format:', response)
        return NextResponse.json(
          { error: 'Invalid response format from Flowise API' },
          { status: 500 }
        )
      }

      // Store the chat message in Supabase
      const { error: messageError } = await supabase
        .from('chat_message')
        .insert([{
          chatflowid: chatflowId,
          role: 'user',
          content: message,
          chatId: body.chatId || crypto.randomUUID(),
          chatType: body.chatType || 'chat',
          createdDate: new Date().toISOString()
        }])

      if (messageError) {
        console.warn('Failed to store chat message:', messageError)
      }

      // Store the assistant's response
      const { error: assistantError } = await supabase
        .from('chat_message')
        .insert([{
          chatflowid: chatflowId,
          role: 'assistant',
          content: response.text,
          chatId: body.chatId || crypto.randomUUID(),
          chatType: body.chatType || 'chat',
          createdDate: new Date().toISOString()
        }])

      if (assistantError) {
        console.warn('Failed to store assistant message:', assistantError)
      }

      return NextResponse.json({
        text: response.text,
        sourceDocuments: response.sourceDocuments
      })
    } catch (error) {
      console.error('Flowise API error:', error)
      if (error instanceof FlowiseError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        )
      }
      throw error // Re-throw for general error handling
    }
  } catch (error) {
    console.error('Error in POST /api/flowise/chat:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
}

// GET /api/flowise/chat/history - Get chat history
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams
    const chatflowId = searchParams.get('chatflowId')
    const chatId = searchParams.get('chatId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!chatflowId) {
      return NextResponse.json(
        { error: 'Chatflow ID is required' },
        { status: 400 }
      )
    }

    // Get chat history from Supabase
    const supabase = createClient()
    const query = supabase
      .from('chat_message')
      .select(`
        *,
        chat_message_feedback (
          rating,
          content
        )
      `)
      .eq('chatflowid', chatflowId)
      .order('createdDate', { ascending: false })
      .range(offset, offset + limit - 1)

    if (chatId) {
      query.eq('chatId', chatId)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      throw messagesError
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error in GET /api/flowise/chat/history:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 