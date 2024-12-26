import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { handleFlowiseError } from '../config'

interface AnalyticsQuery {
  chatflowId?: string
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
  metrics?: string[]
}

interface AnalyticsMetrics {
  messages: number
  ratings: number
  positiveRatings: number
  negativeRatings: number
  users: Set<string>
  averageResponseTime: number
  totalResponseTime: number
  responseCount: number
}

interface AnalyticsResult {
  period: string
  metrics: {
    messages: number
    ratings: number
    positiveRatings: number
    negativeRatings: number
    users: number
    averageResponseTime: number
  }
}

// GET /api/flowise/analytics - Get analytics data
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams
    const query: AnalyticsQuery = {
      chatflowId: searchParams.get('chatflowId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: (searchParams.get('groupBy') as AnalyticsQuery['groupBy']) || 'day',
      metrics: searchParams.get('metrics')?.split(',') || ['messages', 'ratings', 'users']
    }

    const supabase = createClient()

    // Build the base query for messages
    let messageQuery = supabase
      .from('chat_message')
      .select('*')

    if (query.chatflowId) {
      messageQuery = messageQuery.eq('chatflowid', query.chatflowId)
    }

    if (query.startDate) {
      messageQuery = messageQuery.gte('createdDate', query.startDate)
    }

    if (query.endDate) {
      messageQuery = messageQuery.lte('createdDate', query.endDate)
    }

    const { data: messages, error: messagesError } = await messageQuery

    if (messagesError) {
      throw messagesError
    }

    // Get feedback data
    const { data: feedback, error: feedbackError } = await supabase
      .from('chat_message_feedback')
      .select('*')
      .in('messageId', messages.map(m => m.id))

    if (feedbackError) {
      throw feedbackError
    }

    // Process data based on groupBy
    const results: AnalyticsResult[] = []
    const periods = new Map<string, { period: string, metrics: AnalyticsMetrics }>()

    messages.forEach(message => {
      const date = new Date(message.createdDate)
      let periodKey: string

      switch (query.groupBy) {
        case 'week':
          // Get the Monday of the week
          const day = date.getDay()
          const diff = date.getDate() - day + (day === 0 ? -6 : 1)
          const monday = new Date(date.setDate(diff))
          periodKey = monday.toISOString().split('T')[0]
          break
        case 'month':
          periodKey = date.toISOString().slice(0, 7) // YYYY-MM
          break
        default: // day
          periodKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      }

      if (!periods.has(periodKey)) {
        periods.set(periodKey, {
          period: periodKey,
          metrics: {
            messages: 0,
            ratings: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            users: new Set<string>(),
            averageResponseTime: 0,
            totalResponseTime: 0,
            responseCount: 0
          }
        })
      }

      const period = periods.get(periodKey)!
      period.metrics.messages++

      if (message.chatId) {
        period.metrics.users.add(message.chatId)
      }

      // Calculate response times for assistant messages
      if (message.role === 'assistant' && message.createdDate) {
        const userMessage = messages.find(m => 
          m.chatId === message.chatId && 
          m.role === 'user' &&
          new Date(m.createdDate) < new Date(message.createdDate)
        )
        
        if (userMessage) {
          const responseTime = new Date(message.createdDate).getTime() - new Date(userMessage.createdDate).getTime()
          period.metrics.totalResponseTime += responseTime
          period.metrics.responseCount++
        }
      }
    })

    // Process feedback
    feedback.forEach(f => {
      const message = messages.find(m => m.id === f.messageId)
      if (message) {
        const date = new Date(message.createdDate)
        let periodKey: string

        switch (query.groupBy) {
          case 'week':
            const day = date.getDay()
            const diff = date.getDate() - day + (day === 0 ? -6 : 1)
            const monday = new Date(date.setDate(diff))
            periodKey = monday.toISOString().split('T')[0]
            break
          case 'month':
            periodKey = date.toISOString().slice(0, 7)
            break
          default:
            periodKey = date.toISOString().split('T')[0]
        }

        const period = periods.get(periodKey)
        if (period) {
          period.metrics.ratings++
          if (f.rating === 'positive') {
            period.metrics.positiveRatings++
          } else if (f.rating === 'negative') {
            period.metrics.negativeRatings++
          }
        }
      }
    })

    // Convert user Sets to counts and calculate average response times
    periods.forEach(period => {
      const userCount = period.metrics.users.size
      const responseCount = period.metrics.responseCount
      const totalResponseTime = period.metrics.totalResponseTime

      results.push({
        period: period.period,
        metrics: {
          messages: period.metrics.messages,
          ratings: period.metrics.ratings,
          positiveRatings: period.metrics.positiveRatings,
          negativeRatings: period.metrics.negativeRatings,
          users: userCount,
          averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0
        }
      })
    })

    // Sort by period
    results.sort((a, b) => a.period.localeCompare(b.period))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in GET /api/flowise/analytics:', error)
    return NextResponse.json(
      handleFlowiseError(error),
      { status: 500 }
    )
  }
} 