import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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

export interface FamilyMember {
  id: string
  family_id: string
  display_name: string
  full_name: string
  role_id: number
  birth_date?: string
  favorite_color?: string
  current_status?: string
  avatar_url: string | null
  pin?: string
  created_at: string
  updated_at: string
  starter_pokemon_form_id?: number
  starter_pokemon_nickname?: string
  starter_pokemon_obtained_at?: string
  token_balance?: number
  personal_motto?: string
  chatflow_id?: string
  starter_pokemon_friendship?: number
  starter_pokemon_nature?: string
  starter_pokemon_move_1?: string
  starter_pokemon_move_2?: string
  starter_pokemon_move_3?: string
  starter_pokemon_move_4?: string
  starter_pokemon_ribbons?: string[]
  experience_points?: number
  trainer_class?: string
  badges_earned?: number
} 