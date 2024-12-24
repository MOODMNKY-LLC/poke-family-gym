import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on our schema
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  chatflowid: string
  content: string
  sourceDocuments?: string
  createdDate: string
  chatType: string
  chatId: string
  memoryType?: string
  sessionId?: string
  usedTools?: string
  agentReasoning?: string
}

export interface ChatMessageFeedback {
  id: string
  chatflowid: string
  content?: string
  chatId: string
  messageId: string
  rating: string
  createdDate: string
} 