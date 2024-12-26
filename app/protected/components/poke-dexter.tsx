"use client"

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
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
  ChatBubbleMessage,
  ChatBubbleTimestamp
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
import Link from 'next/link'
import { FlowiseAPI } from '@/lib/flowise/api'
import socketIOClient from 'socket.io-client'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

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
  sourceDocuments?: any[]
}

interface PokeChatFlow {
  id?: string
  name: string
  flowData?: string
  chatbotConfig?: string
}

// Add new interface for analytics config
interface AnalyticsConfig {
  langFuse?: {
    userId?: string;
    sessionId?: string;
    custom?: Record<string, any>;
  };
  langSmith?: {
    userId?: string;
    sessionId?: string;
    custom?: Record<string, any>;
  };
  llmonitor?: {
    userId?: string;
    sessionId?: string;
    custom?: Record<string, any>;
  };
}

function getDefaultChatflowId(chatflows: PokeChatFlow[]): string | null {
  // First try env var
  const envDefault = process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID
  if (envDefault) return envDefault
  
  // Otherwise use first chatflow from list
  return chatflows.length > 0 ? chatflows[0].id || null : null
}

async function validateChatflow(chatflowId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/chatflows/${chatflowId}`, {
      headers: {
        ...(process.env.NEXT_PUBLIC_FLOWISE_API_KEY && {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
        })
      }
    })
    
    if (!response.ok) {
      console.warn(`Chatflow ${chatflowId} validation failed:`, response.statusText)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validating chatflow:', error)
    return false
  }
}

function FormattedMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      className="prose prose-sm dark:prose-invert max-w-none break-words"
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''
          
          if (!inline && language) {
            return (
              <div className="rounded-md overflow-hidden my-2">
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            )
          }
          
          return (
            <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-sm", className)} {...props}>
              {children}
            </code>
          )
        },
        // Style tables
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="px-4 py-2 bg-muted font-medium text-left">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="px-4 py-2 border-t">
              {children}
            </td>
          )
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4">
              {children}
            </blockquote>
          )
        },
        a({ children, href }) {
          return (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          )
        },
        p({ children }) {
          return (
            <p className="mb-4 last:mb-0">
              {children}
            </p>
          )
        },
        ul({ children }) {
          return (
            <ul className="list-disc pl-6 mb-4">
              {children}
            </ul>
          )
        },
        ol({ children }) {
          return (
            <ol className="list-decimal pl-6 mb-4">
              {children}
            </ol>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function MessageBubble({ 
  message, 
  isUser,
  isSpeaking,
  audioRef,
  speakText,
  setIsSpeaking
}: { 
  message: Message; 
  isUser: boolean;
  isSpeaking: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  speakText: (text: string) => Promise<void>;
  setIsSpeaking: (speaking: boolean) => void;
}) {
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return (
    <ChatBubble 
      variant={isUser ? "sent" : "received"}
      className={cn(message.error && "bg-destructive/10")}
    >
      {!isUser && (
        <ChatBubbleAvatar 
          fallback="PD"
          className="h-8 w-8 flex items-center justify-center"
        />
      )}
      
      <div className="flex flex-col gap-1">
        <ChatBubbleMessage>
          <FormattedMessage content={message.content} />
          {!isUser && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakText(message.content)}
                disabled={isSpeaking}
              >
                {isSpeaking ? <Volume2 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsSpeaking(false);
                  }
                }}
                disabled={!isSpeaking}
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            </div>
          )}
        </ChatBubbleMessage>
        <ChatBubbleTimestamp timestamp={timestamp} />
      </div>

      {isUser && (
        <ChatBubbleAvatar 
          fallback="U"
          className="h-8 w-8 flex items-center justify-center"
        />
      )}
    </ChatBubble>
  )
}

export function PokeDexter() {
  const { theme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
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
  const [selectedVoice, setSelectedVoice] = useState<string>('alloy')
  const openAIVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [chatflows, setChatflows] = useState<PokeChatFlow[]>([])
  const [currentChatflowId, setCurrentChatflowId] = useState<string | null>(null)
  const [socketId, setSocketId] = useState<string | null>(null)
  const socketRef = useRef<any>(null)

  // Add initial welcome message when no member is selected
  useEffect(() => {
    if (!selectedMember) {
      setMessages([{
        id: '1',
        content: "Hi! I'm PokéDexter, your personal Pokémon assistant. Select a family member to chat with their personal AI agent, or chat with me for general assistance!",
        role: 'assistant',
        timestamp: new Date().toISOString()
      }])
    } else {
      // Use member's chatflow_id if available, otherwise use default
      const chatflowId = selectedMember.chatflow_id || currentChatflowId
      const chatflow = chatflows.find(cf => cf.id === chatflowId)
      
      setMessages([{
        id: '1',
        content: `Hi! I'm ${selectedMember.display_name}'s personal AI agent${chatflow ? ` (${chatflow.name})` : ''}. How can I help you today?`,
        role: 'assistant',
        timestamp: new Date().toISOString()
      }])
    }
  }, [selectedMember, currentChatflowId, chatflows])

  function getAvatarUrl(member: FamilyMember): string {
    if (!member.avatar_url) return '/images/pokeball-light.svg'
    
    const supabase = createClient()
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(member.avatar_url)
    
    return data.publicUrl
  }

  function getPokeBallAvatar(): string {
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
        const membersWithAvatars = members?.map(member => ({
          ...member,
          avatar_url: member.avatar_url 
            ? supabase.storage.from('avatars').getPublicUrl(member.avatar_url).data.publicUrl || null
            : null
        })) || []

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
    if (!isTTSEnabled || !text?.trim()) return
    
    try {
      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      setIsSpeaking(true)
      console.debug('TTS Request:', { text, voice: selectedVoice })
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text.trim(),
          voice: selectedVoice
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`TTS request failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
      setError(error instanceof Error ? error.message : 'Failed to play audio')
    }
  }

  // Update the socket connection setup
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FLOWISE_API_URL) {
      console.error('NEXT_PUBLIC_FLOWISE_API_URL is not configured')
      return
    }

    try {
      // Initialize socket connection
      const socket = socketIOClient(process.env.NEXT_PUBLIC_FLOWISE_API_URL, {
        transports: ['websocket', 'polling'],
        path: '/api/v1/socket.io'
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.debug('Socket connected:', socket.id)
        setSocketId(socket.id)
      })

      socket.on('error', (error: any) => {
        console.error('Socket error:', error)
        setError(`Socket error: ${error?.message || 'Unknown error'}`)
      })

      socket.on('disconnect', () => {
        console.debug('Socket disconnected')
        setSocketId(null)
      })

      // Cleanup on unmount
      return () => {
        if (socket) {
          socket.removeAllListeners()
          socket.disconnect()
        }
      }
    } catch (error) {
      console.error('Socket initialization error:', error)
      setError('Failed to initialize chat connection')
    }
  }, [])

  // Update handleSendMessage function
  async function handleSendMessage(e?: React.FormEvent, voiceMessage?: Message) {
    e?.preventDefault()
    const content = inputMessage.trim()
    if (!content && !voiceMessage && selectedFiles.length === 0) return

    setError(null)
    setInputMessage('')
    let streamedMessage = ''
    let sourceDocuments: any[] = []

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
      const chatflowId = selectedMember?.chatflow_id || currentChatflowId
      if (!chatflowId) {
        throw new Error('No chatflow available')
      }

      // Enhanced request body with analytics and memory config
      const requestBody = {
        question: userMessage.content,
        history: messages.map(msg => ({
          role: msg.role === 'user' ? 'userMessage' : 'apiMessage',
          content: msg.content
        })),
        overrideConfig: {
          sessionId: chatId,
          returnSourceDocuments: true,
          socketIOClientId: socketId,
          memoryType: 'zep', // or other memory types
          memoryWindow: 5,
          analytics: {
            langFuse: {
              userId: selectedMember?.id,
              sessionId: chatId,
              custom: {
                memberName: selectedMember?.display_name,
                memberRole: selectedMember?.role_id
              }
            }
          }
        },
        uploads: userMessage.uploads
      }

      // Set up enhanced socket listeners
      if (socketRef.current && socketId) {
        const messageId = uuidv4()

        socketRef.current.removeAllListeners()

        socketRef.current.on('start', () => {
          console.debug('Stream started')
          streamedMessage = ''
          setMessages(prev => [...prev, {
            id: messageId,
            content: '',
            role: 'assistant',
            timestamp: new Date().toISOString()
          }])
        })

        socketRef.current.on('token', (token: string) => {
          streamedMessage += token
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: streamedMessage }
              : msg
          ))
        })

        socketRef.current.on('sourceDocuments', (docs: any) => {
          console.debug('Source documents:', docs)
          sourceDocuments = docs
          // Update message with source documents
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, sourceDocuments: docs }
              : msg
          ))
        })

        socketRef.current.on('error', (error: any) => {
          console.error('Stream error:', error)
          setError(`Stream error: ${error?.message || 'Unknown error'}`)
        })

        socketRef.current.on('end', async () => {
          console.debug('Stream ended')
          if (streamedMessage && autoPlayTTS && isTTSEnabled) {
            try {
              await speakText(streamedMessage)
            } catch (error) {
              console.error('Auto-playback error:', error)
            }
          }
          setIsLoading(false)
        })
      }

      // Make API request with enhanced error handling
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/api/v1/prediction/${chatflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_FLOWISE_API_KEY && {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FLOWISE_API_KEY}`
          })
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Chat request failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      // Handle non-streaming response
      if (!socketRef.current || !socketId) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: uuidv4(),
          content: data.text || data.answer || 'No response received',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          sourceDocuments: data.sourceDocuments
        }
        setMessages(prev => [...prev, assistantMessage])
        
        if (autoPlayTTS && isTTSEnabled) {
          await speakText(assistantMessage.content)
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: `Error: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        error: true
      }])
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

  function getStatusColor(status: string | undefined): string {
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

  useEffect(() => {
    async function fetchChatflows() {
      try {
        const data = await FlowiseAPI.getChatflows()
        const convertedChatflows = data.filter(cf => cf.id).map(cf => ({
          id: cf.id,
          name: cf.name,
          flowData: cf.flowData,
          chatbotConfig: cf.chatbotConfig
        }))
        setChatflows(convertedChatflows)
        
        // Set default chatflow
        const defaultId = getDefaultChatflowId(convertedChatflows)
        setCurrentChatflowId(defaultId)
      } catch (error) {
        console.error('Error fetching chatflows:', error)
      }
    }

    fetchChatflows()
  }, [])

  return (
    <div className="flex h-[600px] bg-background border rounded-lg overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedMember ? selectedMember.avatar_url || getPokeBallAvatar() : getPokeBallAvatar()}
              alt={selectedMember ? selectedMember.display_name : 'PokéDexter'}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.src = getPokeBallAvatar()
              }}
            />
            <div>
              <h3 className="font-medium">
                {selectedMember ? `${selectedMember.display_name}'s AI Agent` : 'PokéDexter'}
              </h3>
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
            <Button 
              variant="ghost" 
              size="icon"
              asChild
              title="PokéDexter Control Panel"
            >
              <Link href="/protected/admin">
                <Info className="h-4 w-4" />
              </Link>
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
                        src={member.avatar_url || getPokeBallAvatar()}
                        alt={member.display_name}
                        className="w-10 h-10 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          img.src = getPokeBallAvatar()
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
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (isSpeaking) {
                                  if (audioRef.current) {
                                    audioRef.current.pause();
                                    setIsSpeaking(false);
                                  }
                                } else {
                                  speakText(message.content);
                                }
                              }}
                              title={isSpeaking ? "Stop reading" : "Read aloud"}
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
                          </div>
                        )}
                      </div>
                    </div>
                    {message.role === 'user' && selectedMember && (
                      <img
                        src={selectedMember.avatar_url || getPokeBallAvatar()}
                        alt={selectedMember.display_name}
                        className="w-8 h-8 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          img.src = getPokeBallAvatar()
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