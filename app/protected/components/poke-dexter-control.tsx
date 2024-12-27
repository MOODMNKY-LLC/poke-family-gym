"use client"

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Link2, 
  Settings2,
  FileText,
  BarChart2,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Database,
  Search,
  Upload,
  Bot,
  X,
  Loader2,
  Sparkles,
  Beaker,
  Wand2
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { getAvatarUrl } from '@/lib/utils'
import { FlowiseAPI } from '@/lib/flowise/api'
import { FamilyMembersAPI } from '@/lib/supabase/family-members'
import type { FamilyMember } from '@/lib/supabase/family-members'
import { AnalyticsAPI } from '@/lib/supabase/analytics'
import { DocumentStoreAPI, type DocumentStore } from '@/lib/supabase/document-store'
import { cn } from '@/lib/utils'
import { ChatFlowSelect } from '@/components/ui/chatflow-select'
import { ChatFlowsAPI, type ChatFlow as ChatFlowType } from '@/lib/supabase/chatflows'

// Update PokeChatFlow to properly extend ChatFlow
interface PokeChatFlow extends Omit<ChatFlowType, 'deployed' | 'isPublic' | 'systemMessage' | 'id' | 'createdDate' | 'updatedDate'> {
  id?: string
  deployed?: boolean
  isPublic?: boolean
  systemMessage: string
  createdDate?: string
  updatedDate?: string
  // Additional fields for form handling
  tools?: string[]
  streaming?: boolean
  memoryBaseUrl?: string
  memorySessionId?: string
  maxIterations?: number
}

// Form schema for chatflow
const chatflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  flowData: z.string().default(''),
  // Tool Agent Configuration
  systemMessage: z.string().min(1, 'System message is required'),
  maxIterations: z.number().optional(),
  tools: z.array(z.string()).optional(),
  // ChatOpenAI Configuration
  type: z.string().default('chat'),
  temperature: z.number().min(0).max(2).default(0.4),
  streaming: z.boolean().default(true),
  maxTokens: z.number().min(1).max(4000).default(2000),
  // Memory Configuration
  memoryType: z.string().default('zep'),
  memoryBaseUrl: z.string().optional(),
  memorySessionId: z.string().optional(),
  memoryWindow: z.number().min(1).max(50).default(10),
  // Metadata
  isPublic: z.boolean().default(false),
  category: z.string().nullable().default(null),
  // Legacy API compatibility
  deployed: z.boolean().default(true),
  apikeyid: z.string().nullable().default(null),
  chatbotConfig: z.string().nullable().default(null),
  speechToText: z.string().nullable().default(null),
  followUpPrompts: z.string().nullable().default(null),
  topP: z.number().default(0.95),
  frequencyPenalty: z.number().default(0),
  presencePenalty: z.number().default(0),
  // Generated fields
  createdDate: z.string().optional(),
  updatedDate: z.string().optional(),
  apiConfig: z.string().nullable().default(null),
  analytic: z.string().nullable().default(null)
}).strict() as z.ZodType<PokeChatFlow>

interface ChatMessage {
  id: string
  role: string
  chatflowid: string
  content: string
  sourceDocuments?: string
  createdDate: string
  chatType: string
  chatId: string
  memoryType?: string
  sessionId?: string
  usedTools?: string
  fileAnnotations?: string
  fileUploads?: string
  leadEmail?: string
  agentReasoning?: string
  action?: string
  artifacts?: string
  followUpPrompts?: string
  rating?: string // Added for analytics
}

interface ChatMessageFeedback {
  id: string
  chatflowid: string
  content?: string
  chatId: string
  messageId: string
  rating: string
  createdDate: string
}

// Error types
interface BaseErrorContext {
  memberId: string | undefined
  timestamp: string
}

interface VerifyFlowContext extends BaseErrorContext {
  operation: 'verifyFlow'
  chatflowId: string | undefined
}

interface AssignChatflowContext extends BaseErrorContext {
  operation: 'assignChatflow'
  chatflowId: string | null | undefined
}

type ErrorContext = VerifyFlowContext | AssignChatflowContext

interface ErrorDetails {
  name: string
  message: string
  details?: Record<string, unknown>
  context: ErrorContext
}

// Modify getDefaultChatflowId to use first chatflow from list
const getDefaultChatflowId = (flows: PokeChatFlow[]): string | null => {
  // First try env var
  const envDefault = process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID
  if (envDefault) return envDefault
  
  // Otherwise use first chatflow from list
  return flows.length > 0 ? flows[0].id || null : null
}

export function PokeDexterControl() {
  const { theme } = useTheme()
  const [chatflows, setChatflows] = useState<PokeChatFlow[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [documentStores, setDocumentStores] = useState<DocumentStore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedChatflow, setSelectedChatflow] = useState<PokeChatFlow | null>(null)
  const [selectedTab, setSelectedTab] = useState('chatflows')
  const [analyticsRange, setAnalyticsRange] = useState<'24h' | '7d' | '30d'>('7d')
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [syncingMembers, setSyncingMembers] = useState<Record<string, boolean>>({})
  const [selectedChatflows, setSelectedChatflows] = useState<Record<string, string | null>>({})

  // Fetch chatflows
  const fetchChatflows = async () => {
    setIsLoading(true)
    try {
      console.debug('Fetching chatflows from ChatFlowsAPI...')
      const flows = await ChatFlowsAPI.getChatFlows()
      console.debug('Fetched chatflows:', {
        count: flows?.length,
        chatflows: flows?.map(cf => ({
          id: cf.id,
          name: cf.name
        }))
      })

      // Convert API chatflows to our internal PokeChatFlow type
      const convertedChatflows: PokeChatFlow[] = flows.map(cf => ({
        ...cf,
        flowData: '',
        // Tool Agent Configuration
        systemMessage: cf.systemMessage || 'You are PokéDexter, an advanced AI assistant.',
        maxIterations: 10,
        tools: [],
        // ChatOpenAI Configuration
        streaming: true,
        // Memory Configuration
        memoryBaseUrl: 'https://poke-gym-zep.moodmnky.com',
        memorySessionId: '',
        memoryWindow: 10,
        // Legacy API compatibility
        deployed: true,
        apikeyid: '',
        chatbotConfig: '',
        speechToText: '',
        followUpPrompts: '',
        topP: 0.95,
        frequencyPenalty: 0,
        presencePenalty: 0
      }))

      setChatflows(convertedChatflows)

      // Update default selections for family members if needed
      if (familyMembers.length > 0) {
        const defaultChatflowId = getDefaultChatflowId(convertedChatflows)
        setSelectedChatflows(prev => {
          const newSelections = { ...prev }
          familyMembers.forEach(member => {
            if (!newSelections[member.id]) {
              newSelections[member.id] = member.chatflow_id || defaultChatflowId
            }
          })
          return newSelections
        })
      }

    } catch (error) {
      console.error('Error in fetchChatflows:', error)
      if (error instanceof Error && error.message.includes('configuration')) {
        toast.error('Chatflow API configuration error. Please check your environment variables.')
      } else {
        toast.error('Failed to fetch chatflows. Please check Flowise server status.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const form = useForm<PokeChatFlow>({
    resolver: zodResolver(chatflowSchema),
    defaultValues: {
      name: '',
      flowData: '',
      // Tool Agent Configuration
      systemMessage: 'You are PokéDexter, an advanced AI assistant.',
      maxIterations: 10,
      tools: [],
      // ChatOpenAI Configuration
      type: 'chat',
      temperature: 0.4,
      streaming: true,
      maxTokens: 2000,
      // Memory Configuration
      memoryType: 'zep',
      memoryBaseUrl: 'https://poke-gym-zep.moodmnky.com',
      memorySessionId: '',
      memoryWindow: 10,
      // Metadata
      isPublic: false,
      category: null,
      // Legacy API compatibility
      deployed: true,
      apikeyid: null,
      chatbotConfig: null,
      speechToText: null,
      followUpPrompts: null,
      topP: 0.95,
      frequencyPenalty: 0,
      presencePenalty: 0,
      // Generated fields
      apiConfig: null,
      analytic: null
    }
  })

  // Handle form submission
  const onSubmit = async (values: PokeChatFlow) => {
    try {
      setIsLoading(true)
      console.debug('Submitting chatflow:', {
        id: selectedChatflow?.id,
        name: values.name,
        isUpdate: !!selectedChatflow
      })

      // Create the chatflow data exactly matching the API format
      const chatflowData = {
        id: selectedChatflow?.id,
        name: values.name,
        flowData: JSON.stringify({
          nodes: [],
          edges: []
        }),
        deployed: true,
        isPublic: values.isPublic || false,
        type: values.type || 'chat',
        apikeyid: values.apikeyid || '',
        chatbotConfig: JSON.stringify({
          systemMessage: values.systemMessage,
          maxIterations: values.maxIterations,
          tools: values.tools,
          temperature: values.temperature,
          streaming: values.streaming,
          maxTokens: values.maxTokens,
          memoryType: values.memoryType,
          memoryBaseUrl: values.memoryBaseUrl,
          memorySessionId: values.memorySessionId,
          memoryWindow: values.memoryWindow,
          topP: values.topP,
          frequencyPenalty: values.frequencyPenalty,
          presencePenalty: values.presencePenalty
        }),
        apiConfig: JSON.stringify({}),
        analytic: JSON.stringify({}),
        speechToText: JSON.stringify({}),
        category: values.category || '',
      }

      console.debug('Saving chatflow with data:', chatflowData)

      if (selectedChatflow?.id) {
        await FlowiseAPI.updateChatflow(selectedChatflow.id, chatflowData)
        toast.success('Chatflow updated successfully')
      } else {
        await FlowiseAPI.createChatflow(chatflowData)
        toast.success('Chatflow created successfully')
      }

      setIsDialogOpen(false)
      fetchChatflows()
      form.reset()
    } catch (error) {
      console.error('Error in onSubmit:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  // Edit chatflow
  const editChatflow = (chatflow: PokeChatFlow) => {
    let config
    try {
      config = chatflow.chatbotConfig ? JSON.parse(chatflow.chatbotConfig) : {}
    } catch (e) {
      console.warn('Failed to parse chatbot config:', e)
      config = {}
    }

    setSelectedChatflow(chatflow)
    form.reset({
      ...chatflow,
      // Ensure all fields have values
      name: chatflow.name,
      type: chatflow.type || 'chat',
      isPublic: chatflow.isPublic || false,
      category: chatflow.category || null,
      // Tool Agent Configuration
      systemMessage: chatflow.systemMessage || form.getValues('systemMessage'),
      maxIterations: config.maxIterations || 10,
      tools: config.tools || [],
      // ChatOpenAI Configuration
      temperature: chatflow.temperature || 0.4,
      streaming: config.streaming ?? true,
      maxTokens: chatflow.maxTokens || 2000,
      // Memory Configuration
      memoryType: chatflow.memoryType || 'zep',
      memoryBaseUrl: config.memoryBaseUrl || 'https://poke-gym-zep.moodmnky.com',
      memorySessionId: config.memorySessionId || '',
      memoryWindow: chatflow.memoryWindow || 10,
      // Legacy API compatibility
      apikeyid: chatflow.apikeyid || null,
      speechToText: chatflow.speechToText || null,
      followUpPrompts: chatflow.followUpPrompts || null,
      topP: chatflow.topP || 0.95,
      frequencyPenalty: chatflow.frequencyPenalty || 0,
      presencePenalty: chatflow.presencePenalty || 0
    })
    setIsDialogOpen(true)
  }

  // Delete chatflow
  const deleteChatflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chatflow?')) return

    try {
      setIsLoading(true)
      console.debug('Deleting chatflow:', { id })

      // First, remove any references from family members
      await FamilyMembersAPI.removeChatflowAssignments(id)

      // Then delete the chatflow
      await FlowiseAPI.deleteChatflow(id)
      toast.success('Chatflow deleted successfully')
      
      // Refresh data
      await Promise.all([
        fetchChatflows(),
        fetchFamilyMembers()
      ])
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch family members
  const fetchFamilyMembers = async () => {
    try {
      const data = await FamilyMembersAPI.getFamilyMembers()
      setFamilyMembers(data)
    } catch (error) {
      console.error('Error fetching family members:', error)
      toast.error('Failed to fetch family members')
    }
  }

  // Modify handleChatflowSelection to use default when 'none' is selected
  const handleChatflowSelection = (memberId: string, chatflowId: string | 'none') => {
    setSelectedChatflows(prev => ({
      ...prev,
      [memberId]: chatflowId === 'none' ? getDefaultChatflowId(chatflows) : chatflowId
    }))
  }

  // Initialize selectedChatflows with default values
  useEffect(() => {
    if (familyMembers.length > 0) {
      const defaultChatflowId = getDefaultChatflowId(chatflows)
      const defaultSelections = familyMembers.reduce((acc, member) => ({
        ...acc,
        [member.id]: member.chatflow_id || defaultChatflowId
      }), {})
      setSelectedChatflows(defaultSelections)
    }
  }, [familyMembers, chatflows])

  // Modify handleChatflowSync to remove deployment check
  async function handleChatflowSync(member: FamilyMember) {
    try {
      const selectedChatflowId = selectedChatflows[member.id]
      console.debug('Starting chatflow sync:', {
        memberId: member.id,
        memberName: member.display_name,
        currentChatflowId: member.chatflow_id,
        selectedChatflowId,
        timestamp: new Date().toISOString()
      })

      setSyncingMembers(prev => ({ ...prev, [member.id]: true }))

      // Verify chatflow exists
      if (selectedChatflowId && selectedChatflowId !== 'none') {
        const chatflow = chatflows.find(cf => cf.id === selectedChatflowId)
        if (!chatflow) {
          throw new Error(`Selected chatflow ${selectedChatflowId} not found`)
        }
      }

      // Update the assignment using the new API route
      const finalChatflowId = selectedChatflowId === 'none' ? null : selectedChatflowId
      const response = await fetch('/api/chatflows/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: member.id,
          chatflowId: finalChatflowId
        })
      })

      let errorData
      if (!response.ok) {
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: response.statusText }
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`, { 
          cause: errorData 
        })
      }

      const result = await response.json()

      // Show success message
      toast.success(
        finalChatflowId
          ? `Assigned ${chatflows.find(cf => cf.id === finalChatflowId)?.name} to ${member.display_name}`
          : `Removed chatflow from ${member.display_name}`
      )

      // Refresh the list
      await fetchFamilyMembers()

      console.debug('Successfully completed chatflow sync:', {
        memberId: member.id,
        memberName: member.display_name,
        newChatflowId: finalChatflowId,
        updatedMember: result.member,
        timestamp: new Date().toISOString()
      })

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      const errorDetails = {
        memberId: member.id,
        memberName: member.display_name,
        currentChatflowId: member.chatflow_id,
        selectedChatflowId: selectedChatflows[member.id],
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause instanceof Error ? {
            name: error.cause.name,
            message: error.cause.message,
            stack: error.cause.stack
          } : error.cause
        } : String(error),
        timestamp: new Date().toISOString()
      }

      // Log the full error details
      console.error('Error syncing chatflow:', JSON.stringify(errorDetails, null, 2))

      // Show error toast with description
      toast.error('Failed to sync chatflow', {
        description: errorMessage
      })
      
      // Reset selection to current value
      setSelectedChatflows(prev => ({
        ...prev,
        [member.id]: member.chatflow_id || 'none'
      }))

    } finally {
      setSyncingMembers(prev => ({ ...prev, [member.id]: false }))
    }
  }

  // Load initial data
  useEffect(() => {
    fetchChatflows()
    fetchFamilyMembers()
  }, [])

  // Calculate analytics data
  useEffect(() => {
    const days = analyticsRange === '7d' ? 7 : analyticsRange === '30d' ? 30 : 1
    const data = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayMessages = messages.filter(m => 
        new Date(m.createdDate).toDateString() === date.toDateString()
      )
      
      data.push({
        date: date.toLocaleDateString(),
        messages: dayMessages.length,
        positiveRatings: dayMessages.filter(m => m.rating === 'positive').length,
        negativeRatings: dayMessages.filter(m => m.rating === 'negative').length,
      })
    }
    
    setAnalyticsData(data)
  }, [messages, analyticsRange])

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="chatflows" className="space-y-4" onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="chatflows" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Chatflows
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Family Assignments
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>
          
          {selectedTab === 'chatflows' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedChatflow(null)
                  form.reset({
                    name: '',
                    type: 'chat',
                    deployed: false,
                    isPublic: false,
                    apikeyid: '',
                    chatbotConfig: '',
                    category: '',
                    speechToText: '',
                    followUpPrompts: '',
                  })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Chatflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedChatflow ? 'Edit Chatflow' : 'Create Chatflow'}</DialogTitle>
                  <DialogDescription>
                    Configure your chatflow settings and behavior
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="ai">AI Configuration</TabsTrigger>
                        <TabsTrigger value="memory">Memory Configuration</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., PokéDexter Assistant" />
                              </FormControl>
                              <FormDescription>
                                A descriptive name for this AI assistant
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="systemMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>System Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Define the AI's personality and behavior..."
                                  rows={10}
                                />
                              </FormControl>
                              <FormDescription>
                                This message defines the AI's personality, role, and behavior guidelines
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxIterations"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Iterations</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  value={field.value ?? 10}
                                  onChange={e => {
                                    const value = e.target.value === '' ? 10 : parseInt(e.target.value)
                                    field.onChange(value)
                                  }}
                                  min={1}
                                  placeholder="Default: No limit"
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum number of times the AI can use tools in a single response
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="ai" className="space-y-4 mt-4">
                          <FormField
                            control={form.control}
                          name="type"
                            render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select AI model" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="gpt-4o-mini">GPT-4 Mini</SelectItem>
                                  <SelectItem value="gpt-4o">GPT-4 Optimized</SelectItem>
                                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                </SelectContent>
                              </Select>
                                  <FormDescription>
                                Choose the OpenAI model to power this assistant
                                  </FormDescription>
                              <FormMessage />
                              </FormItem>
                            )}
                          />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="temperature"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Temperature</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    value={field.value ?? 0.4}
                                    onChange={e => {
                                      const value = e.target.value === '' ? 0.4 : parseFloat(e.target.value)
                                      field.onChange(value)
                                    }}
                                    step={0.1}
                                    min={0}
                                    max={2}
                                    placeholder="Default: 0.4"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Lower values (0.2-0.4) for more focused responses
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maxTokens"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Tokens</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    value={field.value ?? 2000}
                                    onChange={e => {
                                      const value = e.target.value === '' ? 2000 : parseInt(e.target.value)
                                      field.onChange(value)
                                    }}
                                    min={1}
                                    max={4000}
                                    placeholder="Default: Model maximum"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum length of AI responses
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                          <FormField
                            control={form.control}
                          name="streaming"
                            render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Streaming Responses</FormLabel>
                                <FormDescription>
                                  Show responses as they are generated
                                </FormDescription>
                              </div>
                                <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                      </TabsContent>

                      <TabsContent value="memory" className="space-y-4 mt-4">
                          <FormField
                            control={form.control}
                          name="memoryType"
                            render={({ field }) => (
                              <FormItem>
                              <FormLabel>Memory Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose memory type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">No Memory</SelectItem>
                                  <SelectItem value="zep">Zep Memory</SelectItem>
                                </SelectContent>
                              </Select>
                                <FormDescription>
                                Choose how the AI remembers conversation history
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        {form.watch('memoryType') === 'zep' && (
                          <>
                        <FormField
                          control={form.control}
                              name="memoryBaseUrl"
                          render={({ field }) => (
                            <FormItem>
                                  <FormLabel>Memory Server URL</FormLabel>
                                <FormControl>
                                    <Input 
                                      value={field.value ?? 'https://poke-gym-zep.moodmnky.com'}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      placeholder="Default: https://poke-gym-zep.moodmnky.com"
                                    />
                                </FormControl>
                              <FormDescription>
                                    URL of your Zep memory server
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                          <FormField
                            control={form.control}
                              name="memorySessionId"
                            render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Session ID</FormLabel>
                                <FormControl>
                                  <Input 
                                      value={field.value ?? ''}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      placeholder="Optional: Custom session identifier"
                                  />
                                </FormControl>
                                <FormDescription>
                                    Optional custom session ID for memory management
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        <FormField
                          control={form.control}
                              name="memoryWindow"
                          render={({ field }) => (
                            <FormItem>
                                  <FormLabel>Memory Window</FormLabel>
                              <FormControl>
                                    <Input 
                                      type="number" 
                                      value={field.value ?? 10}
                                      onChange={e => {
                                        const value = e.target.value === '' ? 10 : parseInt(e.target.value)
                                        field.onChange(value)
                                      }}
                                      min={1}
                                      max={50}
                                      placeholder="Default: 10 messages"
                                    />
                              </FormControl>
                              <FormDescription>
                                    Number of previous messages to remember
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                          </>
                        )}
                      </TabsContent>
                    </Tabs>

                    <DialogFooter>
                      <Button type="submit">
                        {selectedChatflow ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="chatflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatflows</CardTitle>
              <CardDescription>
                Manage your Flowise chatflows and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatflows.map((chatflow) => {
                      // Count family members using this chatflow
                      const assignedMembers = familyMembers.filter(m => m.chatflow_id === chatflow.id).length

                      return (
                      <TableRow key={chatflow.id}>
                        <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{chatflow.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {chatflow.category || 'No category'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                          <Badge variant="outline">
                                {chatflow.type || 'chat'}
                          </Badge>
                              <span className="text-sm text-muted-foreground mt-1">
                                Temp: {chatflow.temperature || 0.4}
                              </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={chatflow.memoryType === 'zep' ? 'default' : 'secondary'}>
                              {chatflow.memoryType === 'zep' ? 'Zep Memory' : 'No Memory'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="default">Deployed</Badge>
                            <Badge variant={chatflow.isPublic ? 'default' : 'outline'}>
                              {chatflow.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{assignedMembers}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editChatflow(chatflow)}
                            title="Edit chatflow"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteChatflow(chatflow.id!)}
                            title="Delete chatflow"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                    {chatflows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No chatflows found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Family Member Assignments</CardTitle>
              <CardDescription>
                Select a chatflow and click sync to assign it to a family member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Chatflow</TableHead>
                      <TableHead>Memory Session</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyMembers?.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.display_name}
                        </TableCell>
                        <TableCell>
                          <ChatFlowSelect
                            memberId={member.id}
                            currentChatflowId={member.chatflow_id}
                            onAssign={async (assignment) => {
                              await fetchFamilyMembers()
                              toast.success(`Assigned ${chatflows.find(cf => cf.id === assignment.chatflow_id)?.name} to ${member.display_name}`)
                            }}
                            onRemove={async () => {
                              await fetchFamilyMembers()
                              toast.success(`Removed chatflow from ${member.display_name}`)
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {member.chatflow_id ? `zep-${member.id.slice(0, 8)}` : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.chatflow_id ? 'default' : 'secondary'}>
                            {member.chatflow_id ? 'Active' : 'No Chatflow'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {familyMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No family members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    View usage statistics and performance metrics
                  </CardDescription>
                </div>
                <Select
                  value={analyticsRange}
                  onValueChange={(value: '24h' | '7d' | '30d') => setAnalyticsRange(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {messages.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Chatflows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {chatflows.filter(cf => cf.deployed).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Positive Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {messages.filter(m => m.rating === 'positive').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Document Stores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {documentStores.length}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="h-[300px] w-full">
                <LineChart
                  width={800}
                  height={300}
                  data={analyticsData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="messages" stroke="#8884d8" name="Messages" />
                  <Line type="monotone" dataKey="positiveRatings" stroke="#82ca9d" name="Positive Ratings" />
                  <Line type="monotone" dataKey="negativeRatings" stroke="#ff7300" name="Negative Ratings" />
                </LineChart>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Store</CardTitle>
              <CardDescription>
                Manage your document stores and vector databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.description}</TableCell>
                        <TableCell>
                          <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                            {store.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="ghost" size="icon">
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {documentStores.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No document stores found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 