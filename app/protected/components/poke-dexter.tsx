"use client"

import { useState } from 'react'
import { Bot, User, AlertCircle } from 'lucide-react'
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from '@/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { ChatInput } from '@/components/ui/chat/chat-input'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  error?: boolean
}

export function PokeDexter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm PokéDexter, your personal Pokémon assistant. I can help you learn about Pokémon, battle strategies, and manage your family gym. What would you like to know?",
      role: 'assistant',
      timestamp: new Date().toISOString()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatId] = useState(() => uuidv4())

  async function handleSendMessage(content: string) {
    if (!content.trim()) return

    setError(null)

    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content,
          chatId,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      const assistantMessage: Message = {
        id: uuidv4(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      
      const errorAssistantMessage: Message = {
        id: uuidv4(),
        content: "Sorry, I'm having trouble connecting to my Pokédex right now. Please try again later!",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        error: true
      }
      setMessages(prev => [...prev, errorAssistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] relative">
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      <ChatMessageList className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            variant={message.role === 'user' ? 'sent' : 'received'}
          >
            <ChatBubbleAvatar
              src={message.role === 'assistant' ? '/pokedexter-avatar.png' : undefined}
              fallback={message.role === 'user' ? 'U' : 'PD'}
            />
            <ChatBubbleMessage>
              {message.content}
            </ChatBubbleMessage>
          </ChatBubble>
        ))}
        {isLoading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar
              src="/pokedexter-avatar.png"
              fallback="PD"
            />
            <ChatBubbleMessage isLoading />
          </ChatBubble>
        )}
      </ChatMessageList>
      <div className="p-4 border-t">
        <ChatInput
          placeholder="Ask PokéDexter anything about Pokémon..."
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </Card>
  )
} 