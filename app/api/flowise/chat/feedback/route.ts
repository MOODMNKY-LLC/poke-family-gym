import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface FeedbackRequest {
  messageId: string
  chatId: string
  rating: 'positive' | 'negative'
  content?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as FeedbackRequest
    const { messageId, chatId, rating, content } = body

    if (!messageId || !chatId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client with server-side auth
    const supabase = await createClient()

    // Get the authenticated user's family ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Store feedback in Supabase
    const { error: feedbackError } = await supabase
      .from('chat_message_feedback')
      .insert([{
        message_id: messageId,
        chat_id: chatId,
        rating,
        content,
        family_id: user.id, // The family_id is the same as the user's ID in our model
        created_at: new Date().toISOString()
      }])

    if (feedbackError) {
      console.error('Error storing feedback:', feedbackError)
      throw feedbackError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/flowise/chat/feedback:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    )
  }
} 