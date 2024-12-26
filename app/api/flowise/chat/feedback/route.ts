import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { handleFlowiseError } from '../../config'

// POST /api/flowise/chat/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messageId, chatflowId, chatId, rating, content } = body

    if (!messageId || !chatflowId || !chatId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store feedback in Supabase
    const supabase = createClient()
    const { error: feedbackError } = await supabase
      .from('chat_message_feedback')
      .insert([{
        messageId,
        chatflowid: chatflowId,
        chatId,
        rating,
        content,
        createdDate: new Date().toISOString()
      }])

    if (feedbackError) {
      throw feedbackError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/flowise/chat/feedback:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 