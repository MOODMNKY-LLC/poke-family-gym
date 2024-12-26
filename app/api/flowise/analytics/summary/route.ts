import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { handleFlowiseError } from '../../config'

// GET /api/flowise/analytics/summary
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams
    const chatflowId = searchParams.get('chatflowId')
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const supabase = createClient()

    // Build queries
    let messageQuery = supabase
      .from('chat_message')
      .select('*')
      .gte('createdDate', startDate.toISOString())

    if (chatflowId) {
      messageQuery = messageQuery.eq('chatflowid', chatflowId)
    }

    // Get messages
    const { data: messages, error: messagesError } = await messageQuery
    if (messagesError) throw messagesError

    // Get feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('chat_message_feedback')
      .select('*')
      .in('messageId', messages.map(m => m.id))
    if (feedbackError) throw feedbackError

    // Calculate metrics
    const summary = {
      totalMessages: messages.length,
      uniqueUsers: new Set(messages.map(m => m.chatId)).size,
      totalRatings: feedback.length,
      positiveRatings: feedback.filter(f => f.rating === 'positive').length,
      negativeRatings: feedback.filter(f => f.rating === 'negative').length,
      averageResponseTime: 0,
      messagesByRole: {} as Record<string, number>,
      messagesByType: {} as Record<string, number>,
      popularChatflows: {} as Record<string, number>
    }

    // Calculate average response time
    let totalResponseTime = 0
    let responseCount = 0

    messages.forEach(message => {
      // Count by role
      summary.messagesByRole[message.role] = (summary.messagesByRole[message.role] || 0) + 1
      
      // Count by type
      if (message.chatType) {
        summary.messagesByType[message.chatType] = (summary.messagesByType[message.chatType] || 0) + 1
      }

      // Count by chatflow
      if (message.chatflowid) {
        summary.popularChatflows[message.chatflowid] = (summary.popularChatflows[message.chatflowid] || 0) + 1
      }

      // Calculate response time for assistant messages
      if (message.role === 'assistant' && message.createdDate) {
        const userMessage = messages.find(m => 
          m.chatId === message.chatId && 
          m.role === 'user' &&
          new Date(m.createdDate) < new Date(message.createdDate)
        )
        
        if (userMessage) {
          const responseTime = new Date(message.createdDate).getTime() - new Date(userMessage.createdDate).getTime()
          totalResponseTime += responseTime
          responseCount++
        }
      }
    })

    if (responseCount > 0) {
      summary.averageResponseTime = totalResponseTime / responseCount
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error in GET /api/flowise/analytics/summary:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 