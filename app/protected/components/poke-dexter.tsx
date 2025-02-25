"use client"

import { useState, useEffect, useRef } from 'react'
import { cn, getPokeBallImage } from '../../../lib/utils'
import { 
  Bot, 
  User, 
  AlertCircle, 
  Info, 
  ImagePlus, 
  Mic,
  MicOff,
  Send,
  UserPlus,
  Volume2,
  VolumeX,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Settings,
  Archive,
  Gamepad2,
  Settings2,
  LogOut,
  Square,
  Play
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
import { FlowiseAPI, FlowiseAPIError } from '@/lib/flowise'
import socketIOClient from 'socket.io-client'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import AvatarCircles from '@/components/ui/avatar-circles'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FlowiseClient } from 'flowise-sdk'

// Define the structure of streaming events
interface StreamEvent {
  event: 'start' | 'token' | 'sourceDocuments' | 'error' | 'end'
  data?: string | Array<{
    pageContent: string
    metadata: Record<string, any>
  }> | {
    message: string
  }
}

interface FileUpload {
  data: string
  type: 'file'
  name: string
  mime: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  image?: string
  error?: boolean
  uploads?: FileUpload[]
  sourceDocuments?: Array<{
    pageContent: string
    metadata: Record<string, any>
  }>
}

interface FlowiseMessage {
  message: string
  type: 'userMessage' | 'apiMessage'
}

interface MessageBubbleProps {
  message: Message
  isUser: boolean
  isSpeaking: boolean
  audioRef: React.RefObject<HTMLAudioElement | null>
  speakText: (text: string) => Promise<void>
  setIsSpeaking: (speaking: boolean) => void
  chatId: string
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setError: (error: string | null) => void
  theme?: string
  selectedMember?: FamilyMember | null
}

interface PokeChatFlow {
  id?: string
  name: string
  flowData?: string
  chatbotConfig?: string | null
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

function getDefaultChatflowId(chatflows: PokeChatFlow[]): string {
  // First try to find the PokéDexter chatflow
  const pokeDexter = chatflows.find(cf => cf.name.toLowerCase().includes('pokedexter'))
  if (pokeDexter?.id) return pokeDexter.id
  
  // Otherwise use the first available chatflow
  if (chatflows[0]?.id) return chatflows[0].id
  
  // If no chatflows available, return empty string
  return ''
}

async function validateChatflow(chatflowId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FLOWISE_API_URL}/chatflows/${chatflowId}`, {
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

const MessageBubble = ({
  message,
  isUser,
  isSpeaking,
  audioRef,
  speakText,
  setIsSpeaking,
  chatId,
  setMessages,
  setError,
  theme,
  selectedMember,
}: MessageBubbleProps) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      
      if (!inline && language) {
        return (
          <SyntaxHighlighter
            style={theme === 'dark' ? oneDark : oneLight}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }

      return inline ? (
        <code className={cn(
          "rounded-sm bg-muted px-1 py-0.5 font-mono text-sm",
          className
        )} {...props}>
          {children}
        </code>
      ) : (
        <SyntaxHighlighter
          style={theme === 'dark' ? oneDark : oneLight}
          language="text"
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    },
    a({ node, className, children, ...props }: any) {
      return (
        <a 
          className={cn(
            "text-primary underline underline-offset-4 hover:text-primary/80",
            className
          )} 
          {...props}
        >
          {children}
        </a>
      )
    },
    p({ node, className, children, ...props }: any) {
      return (
        <p 
          className={cn("mb-2 last:mb-0", className)} 
          {...props}
        >
          {children}
        </p>
      )
    },
    ul({ node, className, children, ...props }: any) {
      return (
        <ul 
          className={cn("list-disc pl-6 mb-2", className)} 
          {...props}
        >
          {children}
        </ul>
      )
    },
    ol({ node, className, children, ...props }: any) {
      return (
        <ol 
          className={cn("list-decimal pl-6 mb-2", className)} 
          {...props}
        >
          {children}
        </ol>
      )
    },
    h1: ({ node, className, children, ...props }: any) => (
      <h1 className={cn("text-2xl font-bold mb-2", className)} {...props}>
        {children}
      </h1>
    ),
    h2: ({ node, className, children, ...props }: any) => (
      <h2 className={cn("text-xl font-bold mb-2", className)} {...props}>
        {children}
      </h2>
    ),
    h3: ({ node, className, children, ...props }: any) => (
      <h3 className={cn("text-lg font-bold mb-2", className)} {...props}>
        {children}
      </h3>
    ),
    blockquote: ({ node, className, children, ...props }: any) => (
      <blockquote 
        className={cn(
          "border-l-2 border-primary pl-4 italic mb-2",
          className
        )} 
        {...props}
      >
        {children}
      </blockquote>
    ),
    table: ({ node, className, children, ...props }: any) => (
      <div className="overflow-x-auto mb-2">
        <table 
          className={cn(
            "min-w-full divide-y divide-border",
            className
          )} 
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ node, className, children, ...props }: any) => (
      <th 
        className={cn(
          "px-3 py-2 text-left text-sm font-semibold bg-muted",
          className
        )} 
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ node, className, children, ...props }: any) => (
      <td 
        className={cn(
          "px-3 py-2 text-sm",
          className
        )} 
        {...props}
      >
        {children}
      </td>
    ),
  }

  const handleFeedback = async (helpful: boolean) => {
    setIsLoading(true)
    setIsHelpful(helpful)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          helpful,
        }),
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <img
          src={theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'}
          alt="PokéDexter"
          className="h-10 w-10 rounded-full"
        />
      )}
      <div className={cn('flex flex-col min-w-0 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'rounded-2xl px-4 py-2 break-words',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {message.error ? (
              message.content
            ) : (
              <>
                {message.uploads?.map((upload, index) => (
                  <div key={index} className={cn(
                    "first:mt-0",
                    message.content && "mb-2",
                    "max-w-[min(calc(100vw-8rem),400px)]", // Constrain width dynamically
                    "min-w-[200px]" // Minimum width
                  )}>
                    {upload.mime.startsWith('image/') && (
                      <div className="relative w-full">
                        <img
                          src={upload.data}
                          alt={upload.name}
                          className={cn(
                            "rounded-lg w-full h-auto",
                            "object-contain",
                            "min-h-[100px]",
                            "max-h-[300px]",
                            "hover:cursor-pointer"
                          )}
                          onClick={() => {
                            // Open image in new tab for full view
                            window.open(upload.data, '_blank')
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {message.content && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={MarkdownComponents}
                    className={cn(
                      "prose prose-sm max-w-none",
                      isUser 
                        ? "prose-invert" 
                        : "prose-neutral dark:prose-invert"
                    )}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </>
            )}
          </div>
        </div>
        <div className={cn('flex items-center gap-2 px-2 mt-1', isUser ? 'justify-end' : 'justify-start')}>
          <div className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
          {!isUser && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Listen to message"
                onClick={() => {
                  if (isSpeaking) {
                    audioRef.current?.pause()
                    setIsSpeaking(false)
                  } else {
                    speakText(message.content)
                  }
                }}
              >
                {isSpeaking ? (
                  <Square className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Mark as helpful"
                onClick={() => handleFeedback(true)}
                disabled={isHelpful !== null || isLoading}
              >
                <ThumbsUp
                  className={cn('h-3 w-3', {
                    'text-green-500 fill-green-500': isHelpful === true,
                  })}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Mark as unhelpful"
                onClick={() => handleFeedback(false)}
                disabled={isHelpful !== null || isLoading}
              >
                <ThumbsDown
                  className={cn('h-3 w-3', {
                    'text-red-500 fill-red-500': isHelpful === false,
                  })}
                />
              </Button>
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <AvatarCircles
          className="h-10 w-10"
          avatarUrls={[{
            imageUrl: selectedMember?.avatar_url || (theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'),
            profileUrl: '#'
          }]}
        />
      )}
    </div>
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
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [hasMicPermission, setHasMicPermission] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTTSEnabled, setIsTTSEnabled] = useState(true)
  const [autoPlayTTS, setAutoPlayTTS] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string>('echo')
  const openAIVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [chatflows, setChatflows] = useState<PokeChatFlow[]>([])
  const [currentChatflowId, setCurrentChatflowId] = useState<string | null>(null)
  const [socketId, setSocketId] = useState<string | null>(null)
  const socketRef = useRef<any>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const flowiseClient = useRef<FlowiseClient | null>(null)

  // Initialize FlowiseClient
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FLOWISE_API_URL) {
      console.error('NEXT_PUBLIC_FLOWISE_API_URL is not configured')
      return
    }

    // Remove trailing /api/v1 if present as the SDK adds it automatically
    const baseUrl = process.env.NEXT_PUBLIC_FLOWISE_API_URL.replace(/\/api\/v1\/?$/, '')
    
    flowiseClient.current = new FlowiseClient({
      baseUrl,
      apiKey: process.env.NEXT_PUBLIC_FLOWISE_API_KEY
    })

    console.debug('Initialized Flowise client with:', { 
      baseUrl,
      hasApiKey: !!process.env.NEXT_PUBLIC_FLOWISE_API_KEY
    })
  }, [])

  // Add initial welcome message when no member is selected
  useEffect(() => {
    if (!selectedMember) {
      setMessages([{
        id: '1',
        content: "Hi! I'm PokéDexter, your personal Pokémon assistant. Select a family member to chat with their personal AI agent, or chat with me for general assistance!",
        role: 'assistant',
        createdAt: new Date().toISOString()
      }])
    } else {
      // Use member's chatflow_id if available, otherwise use default
      const chatflowId = selectedMember.chatflow_id || currentChatflowId
      const chatflow = chatflows.find(cf => cf.id === chatflowId)
      
      setMessages([{
        id: '1',
        content: `Hi! I'm ${selectedMember.display_name}'s personal AI agent${chatflow ? ` (${chatflow.name})` : ''}. How can I help you today?`,
        role: 'assistant',
        createdAt: new Date().toISOString()
      }])
    }
  }, [selectedMember, currentChatflowId, chatflows])

  // Update the chatflow switching effect
  useEffect(() => {
    async function updateChatflowAndMessage() {
      console.debug('Member selection changed:', {
        memberId: selectedMember?.id,
        memberName: selectedMember?.display_name,
        assignedChatflowId: selectedMember?.chatflow_id,
        currentChatflowId
      })

      // Reset messages when member changes
      setMessages([])
      
      if (selectedMember?.chatflow_id) {
        // Find the assigned chatflow
        const assignedChatflow = chatflows.find(cf => cf.id === selectedMember.chatflow_id)
        console.debug('Found assigned chatflow:', assignedChatflow?.name)
        
        if (assignedChatflow?.id) {
          console.debug('Validating chatflow:', assignedChatflow.id)
          const isValid = await validateChatflow(assignedChatflow.id)
          
          if (isValid) {
            console.debug('Chatflow validated, switching to:', assignedChatflow.name)
            setCurrentChatflowId(assignedChatflow.id)
            setMessages([{
              id: '1',
              content: `Hi! I'm ${selectedMember.display_name}'s personal AI agent (${assignedChatflow.name}). How can I help you today?`,
              role: 'assistant',
              createdAt: new Date().toISOString()
            }])
            return
          }
          console.warn('Chatflow validation failed:', assignedChatflow.id)
        } else {
          console.warn('Assigned chatflow not found:', selectedMember.chatflow_id)
        }
      }
      
      // Fallback logic
      const defaultId = getDefaultChatflowId(chatflows)
      console.debug('Using default chatflow:', defaultId)
      setCurrentChatflowId(defaultId)
      
      if (selectedMember) {
        console.debug('Setting member-specific message for:', selectedMember.display_name)
        setMessages([{
          id: '1',
          content: `Hi! I'm ${selectedMember.display_name}'s personal AI agent. How can I help you today?`,
          role: 'assistant',
          createdAt: new Date().toISOString()
        }])
      } else {
        console.debug('Setting default PokéDexter message')
        setMessages([{
          id: '1',
          content: "Hi! I'm PokéDexter, your personal Pokémon assistant. Select a family member to chat with their personal AI agent, or chat with me for general assistance!",
          role: 'assistant',
          createdAt: new Date().toISOString()
        }])
      }
    }

    // Only run if we have chatflows loaded
    if (chatflows.length > 0) {
      updateChatflowAndMessage()
    }
  }, [selectedMember, chatflows])

  function getAvatarUrl(member: FamilyMember): string {
    if (!member.avatar_url) return theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'
    
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
            starter_pokemon_obtained_at,
            chatflow_id
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

  // Function to handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setSelectedFiles(files)

    try {
      // Create uploads array from files
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

      // Add preview message to chat
      const previewMessage: Message = {
        id: uuidv4(),
        content: inputMessage, // Include any existing input message
        role: 'user',
        createdAt: new Date().toISOString(),
        uploads
      }
      setMessages(prev => [...prev, previewMessage])
    } catch (error) {
      console.error('Error processing images:', error)
      setError('Failed to process images')
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
            createdAt: new Date().toISOString(),
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

  // Update handleSendMessage function
  async function handleSendMessage(e?: React.FormEvent, voiceMessage?: Message) {
    if (e) e.preventDefault()
    if (isStreaming) return

    try {
      setIsStreaming(true)
      setError(null)

      const userMessage = voiceMessage || {
        id: uuidv4(),
        content: inputMessage,
        role: 'user',
        createdAt: new Date().toISOString()
      }

      // Add user message to chat
      setMessages(prev => [...prev, userMessage as Message])
      setInputMessage('')

      if (!flowiseClient.current || !currentChatflowId) {
        throw new Error('Chat is not properly initialized')
      }

      const messageId = uuidv4()
      let streamedMessage = ''

      // Format history for Flowise
      const chatHistory: FlowiseMessage[] = messages.map(msg => ({
        message: msg.content,
        type: msg.role === 'user' ? 'userMessage' : 'apiMessage'
      }))

      try {
        // Create streaming prediction
        const sessionId = selectedMember?.family_id || chatId || 'default'
        console.debug('Submitting message with config:', { 
          chatflowId: selectedMember?.chatflow_id || currentChatflowId,
          sessionId,
          memberId: selectedMember?.id,
          memberName: selectedMember?.display_name,
          question: userMessage.content
        })

        const response = await flowiseClient.current.createPrediction({
          chatflowId: selectedMember?.chatflow_id || currentChatflowId,
          question: userMessage.content,
          history: chatHistory,
          overrideConfig: {
            sessionId: selectedMember?.family_id || chatId,
            returnSourceDocuments: true,
            memoryType: 'zep',
            memoryWindow: 5,
            analytics: {
              langFuse: {
                userId: selectedMember?.id || 'anonymous',
                sessionId: selectedMember?.family_id || chatId,
                custom: {
                  memberName: selectedMember?.display_name || 'anonymous',
                  memberRole: selectedMember?.role_id || 'unknown'
                }
              }
            }
          },
          streaming: true
        })

        // Handle streaming response
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
          let hasStarted = false

          for await (const chunk of response) {
            if (typeof chunk === 'object' && chunk !== null) {
              switch (chunk.event) {
                case 'start':
                  console.debug('Stream started')
                  if (!hasStarted) {
                    hasStarted = true
                    setIsLoading(false)
                    // Add empty assistant message that will be updated with streamed content
                    setMessages(prev => [...prev, {
                      id: messageId,
                      content: '',
                      role: 'assistant',
                      createdAt: new Date().toISOString()
                    }])
                  }
                  break
                
                case 'token':
                  if (typeof chunk.data === 'string') {
                    streamedMessage += chunk.data
                    setMessages(prev => prev.map(msg => 
                      msg.id === messageId 
                        ? { ...msg, content: streamedMessage }
                        : msg
                    ))
                  }
                  break
                
                case 'sourceDocuments':
                  console.debug('Source documents:', chunk.data)
                  if (Array.isArray(chunk.data) && chunk.data.every(doc => 
                    typeof doc === 'object' && 
                    'pageContent' in doc && 
                    'metadata' in doc
                  )) {
                    const typedDocs = chunk.data as Array<{
                      pageContent: string
                      metadata: Record<string, any>
                    }>
                    setMessages(prev => prev.map(msg => 
                      msg.id === messageId 
                        ? { ...msg, sourceDocuments: typedDocs }
                        : msg
                    ))
                  }
                  break
                
                case 'error':
                  console.error('Stream error:', chunk.data)
                  if (chunk.data && typeof chunk.data === 'object' && 'message' in chunk.data) {
                    setError(`Stream error: ${(chunk.data as { message: string }).message || 'Unknown error'}`)
                  } else {
                    setError('An unknown streaming error occurred')
                  }
                  break
                
                case 'end':
                  console.debug('Stream ended')
                  if (streamedMessage && autoPlayTTS && isTTSEnabled) {
                    try {
                      await speakText(streamedMessage)
                    } catch (error) {
                      console.error('Auto-playback error:', error)
                    }
                  }
                  break
              }
            }
          }
        } else {
          throw new Error('Response is not a valid async iterable')
        }
      } catch (streamError) {
        console.error('Streaming error:', streamError)
        setError(`Streaming error: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Message error:', error)
      setError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
    } finally {
      setIsStreaming(false)
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
        console.debug('Fetching chatflows...')
        const data = await FlowiseAPI.getChatFlows()
        const convertedChatflows = data.chatflows
          .filter((cf): cf is Required<typeof cf> => Boolean(cf?.id))
          .map(cf => ({
            id: cf.id,
            name: cf.name,
            flowData: cf.flowData,
            chatbotConfig: cf.chatbotConfig
          }))
        
        console.debug('Fetched chatflows:', convertedChatflows)
        setChatflows(convertedChatflows)
        
        // Set default chatflow
        const defaultId = getDefaultChatflowId(convertedChatflows)
        setCurrentChatflowId(defaultId)
      } catch (error) {
        console.error('Error fetching chatflows:', error)
        
        // Handle specific error types
        if (error instanceof FlowiseAPIError) {
          switch (error.code) {
            case 'SERVER_UNAVAILABLE':
              setError('The AI service is currently unavailable. Please try again later.')
              break
            case 'UNAUTHORIZED':
              setError('Unable to connect to the AI service due to authentication issues.')
              break
            case 'TIMEOUT':
              setError('The AI service is taking too long to respond. Please try again.')
              break
            default:
              setError(`AI service error: ${error.message}`)
          }
        } else {
          setError('Unable to connect to the AI service. Please try again later.')
        }
        
        // Set a fallback message for empty chatflows
        setMessages([{
          id: '1',
          content: "I'm currently experiencing connection issues. Please try again later or contact support if the problem persists.",
          role: 'assistant',
          createdAt: new Date().toISOString(),
          error: true
        }])
      }
    }

    fetchChatflows()
  }, [])

  return (
    <div className="flex h-[600px] overflow-hidden rounded-xl">
      {/* Sidebar */}
      <div 
        className={cn(
          "bg-secondary text-secondary-foreground flex flex-col rounded-l-xl",
          isSidebarOpen ? "w-[260px]" : "w-0",
          "transition-all duration-300 ease-in-out overflow-hidden"
        )}
      >
        {/* Family Members List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-border/10">
            <h2 className="text-sm font-medium">Family Members</h2>
          </div>
          {/* Default PokéDexter Option */}
          <div
            className={cn(
              "p-3 flex items-center gap-3 cursor-pointer transition-colors",
              "hover:bg-accent/50",
              !selectedMember ? "bg-accent/50" : ""
            )}
            onClick={() => setSelectedMember(null)}
          >
            <div className="relative">
              <AvatarCircles
                avatarUrls={[{
                  imageUrl: getPokeBallImage(theme),
                  profileUrl: '#'
                }]}
                className="scale-100"
              />
              <span 
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-secondary bg-green-500"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">PokéDexter</h3>
              <p className="text-xs text-secondary-foreground/60 truncate">
                General Assistant
              </p>
            </div>
          </div>
          {familyMembers.length === 0 ? (
            <div className="p-4 text-center text-secondary-foreground/60">
              No family members found
            </div>
          ) : (
            familyMembers.map(member => (
              <div
                key={member.id}
                className={cn(
                  "p-3 flex items-center gap-3 cursor-pointer transition-colors",
                  "hover:bg-accent/50",
                  selectedMember?.id === member.id ? "bg-accent/50" : ""
                )}
                onClick={() => setSelectedMember(member)}
              >
                <div className="relative">
                  <AvatarCircles
                    avatarUrls={[{
                      imageUrl: member.avatar_url || getPokeBallImage(theme),
                      profileUrl: '#'
                    }]}
                    className="scale-100"
                  />
                  <span 
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-secondary ${getStatusColor(member.current_status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{member.display_name}</h3>
                  {member.starter_pokemon_nickname && (
                    <p className="text-xs text-secondary-foreground/60 truncate">
                      Partner: {member.starter_pokemon_nickname}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Control Panel */}
        <div className="border-t border-border/10">
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-secondary-foreground/80 hover:bg-accent/50"
              asChild
            >
              <Link href="/protected/admin">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
          <div className="p-3 border-t border-border/10">
            <div className="flex items-center gap-2">
              <AvatarCircles
                avatarUrls={[{
                  imageUrl: selectedMember?.avatar_url || getPokeBallImage(theme),
                  profileUrl: '#'
                }]}
                className="scale-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedMember?.display_name || 'Guest User'}
                </p>
                <p className="text-xs text-secondary-foreground/60 truncate">
                  Active User
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent/50"
                asChild
              >
                <Link href="/auth/signout">
                  <LogOut className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background rounded-r-xl">
        {/* Chat Header */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-accent"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h3 className="font-medium">
              {selectedMember ? `${selectedMember.display_name}'s AI Agent` : 'PokéDexter'}
            </h3>
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
              onClick={() => {
                setMessages([{
                  id: '1',
                  content: selectedMember 
                    ? `Hi! I'm ${selectedMember.display_name}'s personal AI agent. How can I help you today?`
                    : "Hi! I'm PokéDexter, your personal Pokémon assistant. Select a family member to chat with their personal AI agent, or chat with me for general assistance!",
                  role: 'assistant',
                  createdAt: new Date().toISOString()
                }])
              }}
              className="hover:text-primary"
              title="Refresh chat"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
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
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              title="PokéDexter Control Panel"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Admin Panel Dropdown */}
        {showAdminPanel && (
          <div className="absolute right-4 top-12 w-56 z-50 bg-background border rounded-xl shadow-lg p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              asChild
            >
              <Link href="/protected/admin">
                <Settings2 className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              asChild
            >
              <Link href="/protected/admin">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
                isSpeaking={isSpeaking}
                audioRef={audioRef}
                speakText={speakText}
                setIsSpeaking={setIsSpeaking}
                chatId={chatId}
                setMessages={setMessages}
                setError={setError}
                theme={theme}
                selectedMember={selectedMember}
              />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <img
                  src={theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'}
                  alt="PokéDexter"
                  className="h-8 w-8 rounded-full"
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

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-muted/50 rounded-xl p-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={() => imageInputRef.current?.click()}
                className={cn(
                  "transition-all duration-200 shrink-0",
                  selectedFiles.length > 0 && "text-primary scale-110"
                )}
                title="Upload images"
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
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={selectedFiles.length > 0 ? "Add a message about your images..." : "Type a message..."}
                className="flex-1 min-w-0"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={toggleRecording}
                className={cn(
                  "transition-all duration-200 shrink-0",
                  isRecording && "text-primary scale-110"
                )}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                disabled={(!inputMessage.trim() && !selectedFiles.length) || isLoading}
                className={cn(
                  "transition-all duration-200 shrink-0",
                  (inputMessage.trim() || selectedFiles.length > 0) && "text-primary scale-110"
                )}
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 