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

      // Fetch messages with error handling
      const { data: messages, error: messagesError } = await supabase
        .from('chat_message')  // Updated table name from 'chat_messages' to 'chat_message'
        .select(`
          id,
          role,
          chatflowid,
          content,
          sourceDocuments,
          createdDate,
          chatType,
          chatId,
          memoryType,
          sessionId,
          usedTools,
          fileAnnotations,
          fileUploads,
          leadEmail,
          agentReasoning,
          action,
          artifacts,
          followUpPrompts,
          rating
        `)
        .order('createdDate', { ascending: false })
        .limit(1000)

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        throw new Error(`Failed to fetch messages: ${messagesError.message}`)
      }

      // Fetch feedback with error handling
      const { data: feedback, error: feedbackError } = await supabase
        .from('chat_message_feedback')
        .select(`
          id,
          chatflowid,
          content,
          chatId,
          messageId,
          rating,
          createdDate
        `)
        .order('createdDate', { ascending: false })

      if (feedbackError) {
        console.error('Error fetching feedback:', feedbackError)
        throw new Error(`Failed to fetch feedback: ${feedbackError.message}`)
      }

      // Calculate metrics with null checks
      const safeMessages = messages || []
      const safeFeedback = feedback || []
      
      const positiveRatings = safeFeedback.filter(f => f.rating === 'positive').length
      const negativeRatings = safeFeedback.filter(f => f.rating === 'negative').length

      return {
        messageCount: safeMessages.length,
        feedbackCount: safeFeedback.length,
        positiveRatings,
        negativeRatings,
        messages: safeMessages,
        feedback: safeFeedback
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error instanceof Error ? error.message : 'Unknown error')
      throw error instanceof Error ? error : new Error('Failed to fetch analytics data')
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

      if (error) {
        console.error('Error adding feedback:', error)
        throw new Error(`Failed to add feedback: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in addMessageFeedback:', error instanceof Error ? error.message : 'Unknown error')
      throw error instanceof Error ? error : new Error('Failed to add message feedback')
    }
  }
} 