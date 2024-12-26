import { createClient } from '@/lib/supabase/client'
import { ChatMessage, ChatMessageFeedback } from '@/app/api/flowise/types'

export interface AnalyticsData {
  messageCount: number
  feedbackCount: number
  positiveRatings: number
  negativeRatings: number
  messages: ChatMessage[]
  feedback: ChatMessageFeedback[]
}

export const AnalyticsAPI = {
  // Get chat messages and feedback for analytics
  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const supabase = createClient()

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_message')
        .select('*')
        .order('createdDate', { ascending: false })
        .limit(1000)

      if (messagesError) throw messagesError

      // Fetch feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('chat_message_feedback')
        .select('*')
        .order('createdDate', { ascending: false })

      if (feedbackError) throw feedbackError

      // Calculate metrics
      const positiveRatings = feedback?.filter(f => f.rating === 'positive').length || 0
      const negativeRatings = feedback?.filter(f => f.rating === 'negative').length || 0

      return {
        messageCount: messages?.length || 0,
        feedbackCount: feedback?.length || 0,
        positiveRatings,
        negativeRatings,
        messages: messages || [],
        feedback: feedback || []
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      throw error
    }
  },

  // Add feedback for a message
  async addMessageFeedback(messageId: string, chatflowId: string, rating: 'positive' | 'negative', content?: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('chat_message_feedback')
        .insert([{
          messageId,
          chatflowid: chatflowId,
          rating,
          content,
          createdDate: new Date().toISOString()
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error adding message feedback:', error)
      throw error
    }
  }
} 