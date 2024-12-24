"use client"

import { useState, useEffect } from 'react'
import { Bot, User, AlertCircle, Phone, Video, Info, Plus, Paperclip, Smile, Send } from 'lucide-react'
import { useTheme } from 'next-themes'
import { 
  ChatBubble, 
  ChatBubbleAvatar, 
  ChatBubbleMessage 
} from '@/components/ui/chat/chat-bubble'
import { ChatMessageList } from '@/components/ui/chat/chat-message-list'
import { ChatInput } from '@/components/ui/chat/chat-input'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient, type FamilyMember } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  error?: boolean
}

export function PokeDexter() {
  const { theme } = useTheme()
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
  const [inputMessage, setInputMessage] = useState('')
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  function getAvatarUrl(member: FamilyMember) {
    if (!member.avatar_url) return '/placeholder-avatar.png'
    
    const supabase = createClient()
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(member.avatar_url)
    
    return data.publicUrl
  }

  function getPokeBallAvatar() {
    return theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'
  }

  useEffect(() => {
    async function fetchFamilyMembers() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error('No authenticated user found')
          return
        }

        console.log('Fetching family members for user:', user.id)
        const { data: members, error: queryError } = await supabase
          .from('family_members')
          .select(`
            id,
            family_id,
            display_name,
            full_name,
            role_id,
            birth_date,
            favorite_color,
            current_status,
            avatar_url,
            pin,
            created_at,
            updated_at,
            starter_pokemon_form_id,
            starter_pokemon_nickname,
            starter_pokemon_obtained_at
          `)
          .eq('family_id', user.id)
          .order('created_at', { ascending: true })

        if (queryError) {
          console.error('Error fetching family members:', queryError)
          throw queryError
        }

        // Transform members to include full avatar URLs
        const membersWithAvatars = members?.map(member => {
          let publicUrl = null
          if (member.avatar_url) {
            const { data } = supabase
              .storage
              .from('avatars')
              .getPublicUrl(member.avatar_url)
            publicUrl = data.publicUrl
          }
          
          return {
            ...member,
            avatar_url: publicUrl
          }
        }) || []

        console.log('Fetched family members:', membersWithAvatars)
        setFamilyMembers(membersWithAvatars)
      } catch (error) {
        console.error('Error in fetchFamilyMembers:', error)
        setError('Failed to load family members')
      }
    }

    fetchFamilyMembers()
  }, [])

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const content = inputMessage.trim()
    if (!content) return

    setError(null)
    setInputMessage('')

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

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="flex h-[600px] bg-background border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Family Members</h2>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {familyMembers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No family members found
            </div>
          ) : (
            familyMembers.map(member => (
              <div
                key={member.id}
                className={`p-4 flex items-center gap-3 hover:bg-accent cursor-pointer ${
                  selectedMember?.id === member.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative">
                  <img
                    src={member.avatar_url || '/placeholder-avatar.png'}
                    alt={member.display_name}
                    className="w-10 h-10 rounded-full object-cover bg-muted"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.src = '/placeholder-avatar.png'
                    }}
                  />
                  <span 
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.current_status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium truncate">{member.display_name}</h3>
                    {member.starter_pokemon_nickname && (
                      <span className="text-xs text-muted-foreground">
                        Partner: {member.starter_pokemon_nickname}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate capitalize">
                    {member.current_status || 'offline'}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={getPokeBallAvatar()}
              alt="PokéDexter"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium">PokéDexter</h3>
              <p className="text-sm text-muted-foreground">Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {message.role === 'assistant' && (
                  <img
                    src={getPokeBallAvatar()}
                    alt="PokéDexter"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                {message.role === 'user' && selectedMember && (
                  <img
                    src={selectedMember.avatar_url || '/placeholder-avatar.png'}
                    alt={selectedMember.display_name}
                    className="w-8 h-8 rounded-full object-cover bg-muted"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.src = '/placeholder-avatar.png'
                    }}
                  />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2">
                <img
                  src={getPokeBallAvatar()}
                  alt="PokéDexter"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce delay-150" />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Button type="submit" variant="ghost" size="icon" disabled={!inputMessage.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 