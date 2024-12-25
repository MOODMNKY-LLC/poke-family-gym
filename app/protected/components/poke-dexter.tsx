"use client"

import { useState, useEffect, useRef } from 'react'
import { 
  Bot, 
  User, 
  AlertCircle, 
  Info, 
  ImagePlus, 
  Paperclip, 
  Mic,
  MicOff,
  Send,
  UserPlus,
  Volume2,
  VolumeX,
  Menu,
  X
} from 'lucide-react'
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

interface FileUpload {
  data: string
  type: 'file'
  name: string
  mime: string
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  error?: boolean
  uploads?: FileUpload[]
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [hasMicPermission, setHasMicPermission] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTTSEnabled, setIsTTSEnabled] = useState(true)
  const [autoPlayTTS, setAutoPlayTTS] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string>('nova')
  const openAIVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  // Function to handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    
    // Convert files to base64
    const uploads = await Promise.all(
      files.map(async (file): Promise<FileUpload> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              data: reader.result as string,
              type: 'file',
              name: file.name,
              mime: file.type
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })
    )

    // Create a message with the uploads
    if (uploads.length > 0) {
      const userMessage: Message = {
        id: uuidv4(),
        content: `Uploaded ${uploads.length} file${uploads.length > 1 ? 's' : ''}`,
        role: 'user',
        timestamp: new Date().toISOString(),
        uploads
      }
      setMessages(prev => [...prev, userMessage])
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSelectedFiles([])
    }
  }

  // Function to handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Convert images to base64
    const uploads = await Promise.all(
      files.map(async (file): Promise<FileUpload> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              data: reader.result as string,
              type: 'file',
              name: file.name,
              mime: file.type
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })
    )

    // Create a message with the image uploads
    if (uploads.length > 0) {
      const userMessage: Message = {
        id: uuidv4(),
        content: `Uploaded ${uploads.length} image${uploads.length > 1 ? 's' : ''}`,
        role: 'user',
        timestamp: new Date().toISOString(),
        uploads
      }
      setMessages(prev => [...prev, userMessage])
      
      // Clear the file input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  // Function to handle microphone permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasMicPermission(true)
      return stream
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setHasMicPermission(false)
      return null
    }
  }

  // Function to start recording
  const startRecording = async () => {
    const stream = await requestMicPermission()
    if (!stream) return

    audioChunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream)
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      const reader = new FileReader()
      
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const userMessage: Message = {
            id: uuidv4(),
            content: 'Voice message',
            role: 'user',
            timestamp: new Date().toISOString(),
            uploads: [{
              data: reader.result,
              type: 'file',
              name: 'voice-message.wav',
              mime: 'audio/wav'
            }]
          }
          setMessages(prev => [...prev, userMessage])
          
          // Send the message to be processed
          handleSendMessage(undefined, userMessage)
        }
      }
      
      reader.readAsDataURL(audioBlob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
  }

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  // Function to toggle recording
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  // Function to speak text using OpenAI TTS
  const speakText = async (text: string) => {
    if (!isTTSEnabled) return
    
    try {
      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      setIsSpeaking(true)
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: selectedVoice
        })
      })

      if (!response.ok) {
        throw new Error('TTS request failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
    }
  }

  // Update handleSendMessage to include voice messages
  async function handleSendMessage(e?: React.FormEvent, voiceMessage?: Message) {
    e?.preventDefault()
    const content = inputMessage.trim()
    if (!content && !voiceMessage && selectedFiles.length === 0) return

    setError(null)
    setInputMessage('')

    const userMessage = voiceMessage || {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    }

    if (!voiceMessage) {
      setMessages(prev => [...prev, userMessage])
    }
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          chatId,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            uploads: msg.uploads
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
      
      // Speak the assistant's response if auto playback is enabled
      if (autoPlayTTS && isTTSEnabled) {
        speakText(data.message)
      }
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

  const scrollToBottom = () => {
    if (scrollAreaRef.current && messagesEndRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex h-[600px] bg-background border rounded-lg overflow-hidden">
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
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground capitalize"
            >
              {openAIVoices.map(voice => (
                <option key={voice} value={voice} className="capitalize">
                  {voice}
                </option>
              ))}
            </select>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setAutoPlayTTS(!autoPlayTTS)}
              className={autoPlayTTS ? 'text-green-500' : 'text-muted-foreground'}
              title={autoPlayTTS ? 'Disable Auto Playback' : 'Enable Auto Playback'}
            >
              {autoPlayTTS ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsTTSEnabled(!isTTSEnabled)}
              className={isTTSEnabled ? 'text-green-500' : 'text-muted-foreground'}
              title={isTTSEnabled ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
            >
              {isTTSEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Family Members Sidebar */}
          <div 
            className={`${
              isSidebarOpen ? 'w-80' : 'w-0'
            } border-r flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
          >
            <div className="p-4 border-b flex items-center justify-between bg-accent/50">
              <h2 className="text-lg font-semibold">Family Members</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="hover:bg-accent"
                title="Hide family members"
              >
                <X className="h-4 w-4" />
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

          {/* Messages Area with Toggle Button */}
          <div className="flex-1 flex flex-col relative">
            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className={`absolute left-2 top-2 z-10 hover:bg-accent ${isSidebarOpen ? 'hidden' : ''}`}
              title="Show family members"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
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
                      {message.uploads && message.uploads.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.uploads.map((upload, index) => (
                            <div key={index}>
                              {upload.mime.startsWith('image/') ? (
                                <div className="relative group">
                                  <div className="max-w-[200px] max-h-[200px] overflow-hidden rounded-lg">
                                    <img
                                      src={upload.data}
                                      alt={upload.name}
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(upload.data, '_blank')}
                                    />
                                  </div>
                                  <div className="mt-1 text-xs flex items-center gap-2 text-muted-foreground">
                                    <ImagePlus className="h-3 w-3" />
                                    <span>{upload.name}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm flex items-center gap-2">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{upload.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.role === 'assistant' && isTTSEnabled && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSpeaking) {
                                window.speechSynthesis.cancel()
                                setIsSpeaking(false)
                              } else {
                                speakText(message.content)
                              }
                            }}
                            title="Read aloud"
                            className={`inline-flex items-center justify-center rounded-full w-5 h-5 ${
                              isSpeaking 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20'
                            } transition-colors`}
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
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
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              className={selectedFiles.length > 0 ? 'text-green-500' : ''}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              onChange={handleImageSelect}
              multiple
              accept="image/*"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className={selectedFiles.length > 0 ? 'text-green-500' : ''}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              multiple
              accept=".txt,.pdf,.doc,.docx,.csv,.json"
            />
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={toggleRecording}
              className={isRecording ? 'text-green-500' : ''}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button 
              type="submit" 
              variant="ghost" 
              size="icon" 
              disabled={!inputMessage.trim() || isLoading}
              className={inputMessage.trim() ? 'text-green-500' : ''}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 