"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ChatFlowSelect } from '@/components/ui/chatflow-select'
import { ChatFlowsAPI } from '@/lib/supabase/chatflows'
import { ChatflowsList } from './chatflows-list'
import { FlowiseAPI } from '@/lib/flowise/api'
import { toast } from 'sonner'
import type { ChatFlow } from '@/lib/flowise/types'
import {
  Bot,
  Copy,
  Edit,
  Trash,
  Globe,
  Lock,
  Check,
  X as XIcon,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  Columns,
  Mic,
  MessagesSquare,
  CheckCircle2,
  XCircle,
  MicOff,
  Settings,
  BarChart2,
  Users,
  Database,
  Wand2,
  Sparkles,
  Braces,
  Network,
  HardDrive,
  Cpu,
  Upload,
  UserPlus,
  Filter,
  Download,
  Calendar,
  Link as LinkIcon
} from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useForm } from 'react-hook-form'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { DocumentList } from './document-list'
import { DocumentStoreAPI } from '@/lib/flowise/api'
import type { Document, ProcessingConfig } from '@/lib/flowise/types'
import { DocumentUploadForm } from './document-upload-form'
import { ChatflowAssignments } from './chatflow-assignments'

// Config types
interface ChatbotConfig {
  systemMessage?: string
  temperature?: number
  maxTokens?: number
  memoryType?: string
  memoryWindow?: number
  [key: string]: any // Allow other properties
}

interface ApiConfig {
  [key: string]: any
}

// Add type options constant
const CHATFLOW_TYPES = [
  { value: 'chat', label: 'Chat' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'agent', label: 'Agent' },
  { value: 'custom', label: 'Custom' }
] as const

// Form schema for chatflow
const chatflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemMessage: z.string().min(1, 'System message is required'),
  temperature: z.number().min(0).max(2).default(0.4),
  maxTokens: z.number().min(1).max(4000).default(2000),
  memoryType: z.string().default('zep'),
  memoryWindow: z.number().min(1).max(50).default(10),
  memoryBaseUrl: z.string().optional(),
  aiPrefix: z.string().default('ai'),
  humanPrefix: z.string().default('human'),
  isPublic: z.boolean().default(false),
  deployed: z.boolean().default(true),
  type: z.string().default('chat'),
  speechToText: z.boolean().default(false)
})

type ChatflowFormValues = z.infer<typeof chatflowSchema>

// Memory type options
const MEMORY_TYPES = [
  { 
    value: 'none', 
    label: 'No Memory',
    description: 'Chatflow will not retain conversation history'
  },
  { 
    value: 'zep', 
    label: 'Zep Memory',
    description: 'Long-term memory using Zep server for conversation history'
  },
  {
    value: 'redis',
    label: 'Redis Memory',
    description: 'In-memory storage using Redis for fast access'
  },
  {
    value: 'mongo',
    label: 'MongoDB Memory',
    description: 'Persistent storage using MongoDB for conversation history'
  }
] as const

// Node type options
const NODE_TYPES = [
  {
    value: 'chatOpenAI',
    label: 'ChatOpenAI',
    description: 'OpenAI chat completion model',
    category: 'Models'
  },
  {
    value: 'zepMemory',
    label: 'Zep Memory',
    description: 'Long-term memory storage',
    category: 'Memory'
  },
  {
    value: 'toolAgent',
    label: 'Tool Agent',
    description: 'Agent for managing tools and responses',
    category: 'Agents'
  }
] as const

// Add processing config schema
const processingConfigSchema = z.object({
  chunkSize: z.number().min(100).max(4000).default(1000),
  chunkOverlap: z.number().min(0).max(1000).default(200),
  splitStrategy: z.enum(['token', 'sentence', 'paragraph']).default('sentence'),
  embedModel: z.string().default('text-embedding-ada-002')
})

type ProcessingConfigFormValues = z.infer<typeof processingConfigSchema>

// Add new schema for flow data configuration
const flowDataSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    type: z.string(),
    data: z.object({
      id: z.string(),
      label: z.string(),
      name: z.string(),
      type: z.string(),
      baseClasses: z.array(z.string()),
      category: z.string(),
      description: z.string(),
      inputParams: z.array(z.any()),
      inputAnchors: z.array(z.any()),
      inputs: z.record(z.any()),
      outputAnchors: z.array(z.any()),
      outputs: z.record(z.any())
    }),
    width: z.number(),
    height: z.number(),
    selected: z.boolean(),
    dragging: z.boolean().optional(),
    positionAbsolute: z.object({
      x: z.number(),
      y: z.number()
    }).optional()
  })),
  edges: z.array(z.object({
    source: z.string(),
    sourceHandle: z.string(),
    target: z.string(),
    targetHandle: z.string(),
    type: z.string(),
    id: z.string()
  }))
})

type FlowDataFormValues = z.infer<typeof flowDataSchema>

// Add new schema for basic chatflow configuration
const basicChatflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemMessage: z.string().min(1, 'System message is required')
})

type BasicChatflowFormValues = z.infer<typeof basicChatflowSchema>

// Add new schema for node configuration
const nodeConfigSchema = z.object({
  config: z.object({
    type: z.string().default('chat'),
    isPublic: z.boolean().default(false),
    deployed: z.boolean().default(true),
    category: z.string().nullable(),
    speechToText: z.boolean().default(false)
  }),
  chatOpenAI: z.object({
    modelName: z.string(),
    temperature: z.number().min(0).max(2),
    streaming: z.boolean(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional()
  }),
  memory: z.object({
    type: z.string(),
    baseURL: z.string().default('https://poke-gym-zep.moodmnky.com'),
    sessionId: z.string().optional(),
    k: z.number().min(1).max(100),
    aiPrefix: z.string().default('ai'),
    humanPrefix: z.string().default('human')
  })
})

type NodeConfigFormValues = z.infer<typeof nodeConfigSchema>

// Simplified schema for chatflow builder
const chatflowBuilderSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required'),
  category: z.string().nullable(),
  type: z.enum(['chat', 'assistant', 'agent', 'custom']).default('chat'),
  
  // AI Configuration
  systemMessage: z.string().min(1, 'System message is required'),
  modelName: z.enum([
    'gpt-4o-mini',           // Default model
    'gpt-4o',                // Standard GPT-4o
    'gpt-4-turbo-2024-04-09', // GPT-4 Turbo
    'gpt-4-turbo-preview',    // Preview version
    'gpt-4',                  // Base GPT-4
    'gpt-3.5-turbo-0125',     // Latest GPT-3.5
    'gpt-3.5-turbo'          // Auto-updating GPT-3.5
  ]).default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.4),
  maxTokens: z.number().min(1).max(4000).default(2000),
  topP: z.number().min(0).max(1).default(0.95),
  frequencyPenalty: z.number().min(0).max(2).default(0),
  presencePenalty: z.number().min(0).max(2).default(0),
  
  // Memory Configuration
  memoryType: z.enum(['zep', 'redis', 'mongo', 'none']).default('zep'),
  memoryWindow: z.number().min(1).max(50).default(10),
  memoryBaseUrl: z.string().default('https://poke-gym-zep.moodmnky.com'),
  memorySessionId: z.string().optional(),
  aiPrefix: z.string().default('ai'),
  humanPrefix: z.string().default('human'),
  
  // Features
  isPublic: z.boolean().default(false),
  deployed: z.boolean().default(true),
  speechToText: z.boolean().default(false),
  streaming: z.boolean().default(true)
})

type ChatflowBuilderFormValues = z.infer<typeof chatflowBuilderSchema>

export function PokeDexterControl() {
  const [activeTab, setActiveTab] = useState('chatflows')
  const [selectedChatflow, setSelectedChatflow] = useState<ChatFlow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<ChatflowFormValues>({
    resolver: zodResolver(chatflowSchema),
    defaultValues: {
      name: '',
      systemMessage: 'You are PokéDexter, an advanced AI assistant.',
      temperature: 0.4,
      maxTokens: 2000,
      memoryType: 'zep',
      memoryWindow: 10,
      memoryBaseUrl: '',
      aiPrefix: 'ai',
      humanPrefix: 'human',
      isPublic: false,
      deployed: true,
      type: 'chat',
      speechToText: false
    }
  })

  // Load selected chatflow data into form
  useEffect(() => {
    if (selectedChatflow) {
      try {
        // Parse the flow data to get node configurations
        const flowData = selectedChatflow.flowData ? JSON.parse(selectedChatflow.flowData) : { nodes: [] }
        
        // Find the Tool Agent node
        const toolAgentNode = flowData.nodes?.find((node: any) => 
          node.data?.name === 'toolAgent' || node.type === 'customNode'
        )

        // Find the ChatOpenAI node
        const chatOpenAINode = flowData.nodes?.find((node: any) => 
          node.data?.name === 'chatOpenAI'
        )

        // Find the Memory node
        const memoryNode = flowData.nodes?.find((node: any) => 
          node.data?.name === 'ZepMemory'
        )

        // Extract configurations and ensure number types
        const formData = {
          name: selectedChatflow.name || '',
          systemMessage: toolAgentNode?.data?.inputs?.systemMessage || 'You are PokéDexter, an advanced AI assistant.',
          temperature: Number(chatOpenAINode?.data?.inputs?.temperature) || 0.4,
          maxTokens: Number(chatOpenAINode?.data?.inputs?.maxTokens) || 2000,
          memoryType: memoryNode?.data?.inputs?.memoryType || 'zep',
          memoryWindow: Number(memoryNode?.data?.inputs?.k) || 10,
          memoryBaseUrl: memoryNode?.data?.inputs?.memoryBaseUrl || '',
          aiPrefix: memoryNode?.data?.inputs?.aiPrefix || 'ai',
          humanPrefix: memoryNode?.data?.inputs?.humanPrefix || 'human',
          isPublic: Boolean(selectedChatflow.isPublic),
          deployed: Boolean(selectedChatflow.deployed),
          type: selectedChatflow.type || 'chat',
          speechToText: Boolean(selectedChatflow.speechToText)
        }

        // Log the data being loaded
        console.debug('Loading chatflow data:', {
          original: selectedChatflow,
          flowData,
          formData
        })

        // Reset form with combined data
        form.reset(formData)

    } catch (error) {
        console.error('Error loading chatflow configuration:', error)
        toast.error('Failed to load chatflow configuration')
      }
    }
  }, [selectedChatflow, form])

  // Handle form submission
  const onSubmit = async (data: ChatflowFormValues) => {
    if (!selectedChatflow?.id) return
    
    setIsSubmitting(true)
    try {
      // Parse existing flow data
      const flowData = selectedChatflow.flowData ? JSON.parse(selectedChatflow.flowData) : { nodes: [] }
      
      console.debug('Original flow data:', flowData)

      // Update Tool Agent node
      const toolAgentNode = flowData.nodes?.find((node: any) => {
        console.debug('Checking node:', node)
        return node.data?.name === 'toolAgent' || 
               node.type === 'customNode' || 
               node.type === 'Tool Agent'
      })
      
      if (toolAgentNode) {
        toolAgentNode.data.inputs = {
          ...toolAgentNode.data.inputs,
          systemMessage: data.systemMessage
        }
      } else {
        console.warn('Tool Agent node not found')
      }

      // Update ChatOpenAI node
      const chatOpenAINode = flowData.nodes?.find((node: any) => {
        console.debug('Checking node:', node)
        return node.data?.name === 'chatOpenAI' || 
               node.type === 'ChatOpenAI'
      })
      
      if (chatOpenAINode) {
        chatOpenAINode.data.inputs = {
          ...chatOpenAINode.data.inputs,
          temperature: Number(data.temperature),
          maxTokens: Number(data.maxTokens)
        }
      } else {
        console.warn('ChatOpenAI node not found')
      }

      // Update Memory node
      const memoryNode = flowData.nodes?.find((node: any) => {
        console.debug('Checking node:', node)
        return node.data?.name === 'ZepMemory' || 
               node.type === 'ZepMemory'
      })
      
      if (memoryNode) {
        memoryNode.data.inputs = {
          ...memoryNode.data.inputs,
          k: Number(data.memoryWindow)
        }
      } else {
        console.warn('Memory node not found')
      }

      // Update the chatflow
      const updatePayload = {
        ...selectedChatflow,
        name: data.name,
        isPublic: Boolean(data.isPublic),
        deployed: Boolean(data.deployed),
        type: data.type,
        speechToText: data.speechToText ? 'true' : 'false',
        flowData: JSON.stringify(flowData)
      }

      const response = await FlowiseAPI.updateChatflow(selectedChatflow.id, updatePayload)
      console.debug('Update response:', response)

      toast.success('Chatflow updated successfully')
      setSelectedChatflow(null)
    } catch (error) {
      console.error('Error updating chatflow:', error)
      if (error instanceof Error) {
        toast.error(`Failed to update chatflow: ${error.message}`)
      } else {
        toast.error('Failed to update chatflow: Unknown error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add form initialization and handlers
  const basicForm = useForm<BasicChatflowFormValues>({
    resolver: zodResolver(basicChatflowSchema),
    defaultValues: {
      name: '',
      systemMessage: 'You are PokéDexter, an advanced AI assistant.'
    }
  })

  const flowDataForm = useForm<NodeConfigFormValues>({
    resolver: zodResolver(nodeConfigSchema),
    defaultValues: {
      config: {
        type: 'chat',
        isPublic: false,
        deployed: true,
        category: null,
        speechToText: false
      },
      chatOpenAI: {
        modelName: 'gpt-4',
        temperature: 0.4,
        streaming: true,
        maxTokens: 2000,
        topP: 0.95,
        frequencyPenalty: 0,
        presencePenalty: 0
      },
      memory: {
        type: 'zep',
        baseURL: 'https://poke-gym-zep.moodmnky.com',
        k: 10,
        aiPrefix: 'ai',
        humanPrefix: 'human'
      }
    }
  })

  const onBasicSubmit = async (data: BasicChatflowFormValues) => {
    setIsSubmitting(true)
    try {
      // Store basic config for later use with flow data
      localStorage.setItem('chatflow_basic_config', JSON.stringify(data))
      toast.success('Basic configuration saved')
    } catch (error) {
      console.error('Error saving basic config:', error)
      toast.error('Failed to save basic configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onFlowDataSubmit = async (data: NodeConfigFormValues) => {
    setIsSubmitting(true)
    try {
      // Get basic config
      const basicConfig = JSON.parse(localStorage.getItem('chatflow_basic_config') || '{}')
      
      // Transform form data into the required flow structure
      const flowData = {
        nodes: [
          {
            id: 'toolAgent_0',
            position: { x: 1097, y: 413 },
            type: 'customNode',
            data: {
              id: 'toolAgent_0',
              label: 'Tool Agent',
              version: 2,
              name: 'toolAgent',
              type: 'AgentExecutor',
              baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable'],
              category: 'Agents',
              description: 'Agent that uses Function Calling to pick the tools and args to call',
              inputParams: [
                {
                  label: 'System Message',
                  name: 'systemMessage',
                  type: 'string',
                  default: basicConfig.systemMessage
                }
              ],
              inputs: {
                tools: ['{{calculator_0.data.instance}}'],
                memory: '{{ZepMemory_0.data.instance}}',
                model: '{{chatOpenAI_0.data.instance}}',
                systemMessage: basicConfig.systemMessage
              }
            },
            width: 300,
            height: 486
          },
          {
            id: 'chatOpenAI_0',
            position: { x: 327, y: 294 },
            type: 'customNode',
            data: {
              id: 'chatOpenAI_0',
              label: 'ChatOpenAI',
              version: 8,
              name: 'chatOpenAI',
              type: 'ChatOpenAI',
              baseClasses: ['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel', 'Runnable'],
              category: 'Chat Models',
              description: 'Wrapper around OpenAI large language models that use the Chat endpoint',
              inputs: {
                modelName: data.chatOpenAI.modelName,
                temperature: data.chatOpenAI.temperature,
                streaming: data.chatOpenAI.streaming,
                maxTokens: data.chatOpenAI.maxTokens,
                topP: data.chatOpenAI.topP,
                frequencyPenalty: data.chatOpenAI.frequencyPenalty,
                presencePenalty: data.chatOpenAI.presencePenalty
              }
            },
            width: 300,
            height: 670
          },
          {
            id: 'ZepMemory_0',
            position: { x: 671, y: 317 },
            type: 'customNode',
            data: {
              id: 'ZepMemory_0',
              label: 'Zep Memory',
              version: 2,
              name: 'ZepMemory',
              type: 'ZepMemory',
              baseClasses: ['ZepMemory', 'BaseChatMemory', 'BaseMemory'],
              category: 'Memory',
              description: 'Summarizes the conversation and stores the memory in zep server',
              inputs: {
                baseURL: data.memory.baseURL,
                sessionId: data.memory.sessionId || '',
                k: data.memory.k,
                aiPrefix: data.memory.aiPrefix,
                humanPrefix: data.memory.humanPrefix,
                memoryKey: 'chat_history',
                inputKey: 'input',
                outputKey: 'text'
              }
            },
            width: 300,
            height: 427
          }
        ],
        edges: [
          {
            source: 'chatOpenAI_0',
            sourceHandle: 'chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable',
            target: 'toolAgent_0',
            targetHandle: 'toolAgent_0-input-model-BaseChatModel',
            type: 'buttonedge',
            id: 'chatOpenAI_0-chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable-toolAgent_0-toolAgent_0-input-model-BaseChatModel'
          },
          {
            source: 'ZepMemory_0',
            sourceHandle: 'ZepMemory_0-output-ZepMemory-ZepMemory|BaseChatMemory|BaseMemory',
            target: 'toolAgent_0',
            targetHandle: 'toolAgent_0-input-memory-BaseChatMemory',
            type: 'buttonedge',
            id: 'ZepMemory_0-ZepMemory_0-output-ZepMemory-ZepMemory|BaseChatMemory|BaseMemory-toolAgent_0-toolAgent_0-input-memory-BaseChatMemory'
          }
        ]
      }

      // Update the chatflowData creation in onFlowDataSubmit
      const { speechToText, ...restConfig } = data.config
      const chatflowData = {
        name: basicConfig.name,
        ...restConfig,
        speechToText: speechToText ? 'true' : 'false',
        flowData: JSON.stringify(flowData)
      }

      const response = await FlowiseAPI.createChatflow(chatflowData)
      
      // Clear stored basic config
      localStorage.removeItem('chatflow_basic_config')
      
      toast.success('Chatflow created successfully')
      console.debug('Created chatflow:', response)
    } catch (error) {
      console.error('Error creating chatflow:', error)
      toast.error('Failed to create chatflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadTemplate = () => {
    try {
      // Load PokéDexter template
      const template = require('@/instructions/_PokeDexter Chatflow.json')
      flowDataForm.reset(template)
      toast.success('Template loaded successfully')
    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Failed to load template')
    }
  }

  const validateFlow = async () => {
    try {
      const data = flowDataForm.getValues()
      const response = await FlowiseAPI.validateChatflow({
        flowData: JSON.stringify(data)
      })
      toast.success('Flow configuration is valid')
      console.debug('Validation response:', response)
    } catch (error) {
      console.error('Error validating flow:', error)
      toast.error('Flow configuration is invalid')
    }
  }

  // Add form initialization with all fields
  const builderForm = useForm<ChatflowBuilderFormValues>({
    resolver: zodResolver(chatflowBuilderSchema),
    defaultValues: {
      name: '',
      category: null,
      type: 'chat',
      systemMessage: 'You are PokéDexter, an advanced AI assistant.',
      modelName: 'gpt-4',
      temperature: 0.4,
      maxTokens: 2000,
      topP: 0.95,
      frequencyPenalty: 0,
      presencePenalty: 0,
      memoryType: 'zep',
      memoryWindow: 10,
      memoryBaseUrl: 'https://poke-gym-zep.moodmnky.com',
      memorySessionId: '',
      aiPrefix: 'ai',
      humanPrefix: 'human',
      isPublic: false,
      deployed: true,
      speechToText: false,
      streaming: true
    }
  })

  // Add form submission handler
  const onBuilderSubmit = async (data: ChatflowBuilderFormValues) => {
    console.log('Form submission started')
    console.log('Form data:', data)
    
    setIsSubmitting(true)
    try {
      const flowData = {
        nodes: [
          {
            id: "toolAgent_0",
            position: {
              x: 1097.4208657424156,
              y: 413.78962915804334
            },
            type: "customNode",
            data: {
              id: "toolAgent_0",
              label: "Tool Agent",
              version: 2,
              name: "toolAgent",
              type: "AgentExecutor",
              baseClasses: [
                "AgentExecutor",
                "BaseChain",
                "Runnable"
              ],
              category: "Agents",
              description: "Agent that uses Function Calling to pick the tools and args to call",
              inputParams: [
                {
                  label: "System Message",
                  name: "systemMessage",
                  type: "string",
                  default: "You are a helpful AI assistant.",
                  description: "If Chat Prompt Template is provided, this will be ignored",
                  rows: 4,
                  optional: true,
                  additionalParams: true,
                  id: "toolAgent_0-input-systemMessage-string"
                },
                {
                  label: "Max Iterations",
                  name: "maxIterations",
                  type: "number",
                  optional: true,
                  additionalParams: true,
                  id: "toolAgent_0-input-maxIterations-number"
                }
              ],
              inputAnchors: [
                {
                  label: "Tools",
                  name: "tools",
                  type: "Tool",
                  list: true,
                  id: "toolAgent_0-input-tools-Tool"
                },
                {
                  label: "Memory",
                  name: "memory",
                  type: "BaseChatMemory",
                  id: "toolAgent_0-input-memory-BaseChatMemory"
                },
                {
                  label: "Tool Calling Chat Model",
                  name: "model",
                  type: "BaseChatModel",
                  description: "Only compatible with models that are capable of function calling: ChatOpenAI, ChatMistral, ChatAnthropic, ChatGoogleGenerativeAI, ChatVertexAI, GroqChat",
                  id: "toolAgent_0-input-model-BaseChatModel"
                },
                {
                  label: "Chat Prompt Template",
                  name: "chatPromptTemplate",
                  type: "ChatPromptTemplate",
                  description: "Override existing prompt with Chat Prompt Template. Human Message must includes {input} variable",
                  optional: true,
                  id: "toolAgent_0-input-chatPromptTemplate-ChatPromptTemplate"
                },
                {
                  label: "Input Moderation",
                  description: "Detect text that could generate harmful output and prevent it from being sent to the language model",
                  name: "inputModeration",
                  type: "Moderation",
                  optional: true,
                  list: true,
                  id: "toolAgent_0-input-inputModeration-Moderation"
                }
              ],
              inputs: {
                tools: [
                  "{{calculator_0.data.instance}}"
                ],
                memory: "{{ZepMemory_0.data.instance}}",
                model: "{{chatOpenAI_0.data.instance}}",
                chatPromptTemplate: "",
                systemMessage: data.systemMessage,
                inputModeration: "",
                maxIterations: ""
              },
              outputAnchors: [
                {
                  id: "toolAgent_0-output-toolAgent-AgentExecutor|BaseChain|Runnable",
                  name: "toolAgent",
                  label: "AgentExecutor",
                  description: "Agent that uses Function Calling to pick the tools and args to call",
                  type: "AgentExecutor | BaseChain | Runnable"
                }
              ],
              outputs: {},
              selected: false
            },
            width: 300,
            height: 486,
            selected: false,
            dragging: false,
            positionAbsolute: {
              x: 1097.4208657424156,
              y: 413.78962915804334
            }
          },
          {
            id: "chatOpenAI_0",
            position: {
              x: 327.8478876074853,
              y: 294.4489773347999
            },
            type: "customNode",
            data: {
              id: "chatOpenAI_0",
              label: "ChatOpenAI",
              version: 8,
              name: "chatOpenAI",
              type: "ChatOpenAI",
              baseClasses: [
                "ChatOpenAI",
                "BaseChatModel",
                "BaseLanguageModel",
                "Runnable"
              ],
              category: "Chat Models",
              description: "Wrapper around OpenAI large language models that use the Chat endpoint",
              inputParams: [
                {
                  label: "Connect Credential",
                  name: "credential",
                  type: "credential",
                  credentialNames: [
                    "openAIApi"
                  ],
                  id: "chatOpenAI_0-input-credential-credential"
                },
                {
                  label: "Model Name",
                  name: "modelName",
                  type: "asyncOptions",
                  loadMethod: "listModels",
                  default: "gpt-4o-mini",
                  id: "chatOpenAI_0-input-modelName-asyncOptions"
                },
                {
                  label: "Temperature",
                  name: "temperature",
                  type: "number",
                  step: 0.1,
                  default: 0.9,
                  optional: true,
                  id: "chatOpenAI_0-input-temperature-number"
                },
                {
                  label: "Streaming",
                  name: "streaming",
                  type: "boolean",
                  default: true,
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-streaming-boolean"
                },
                {
                  label: "Max Tokens",
                  name: "maxTokens",
                  type: "number",
                  step: 1,
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-maxTokens-number"
                },
                {
                  label: "Top Probability",
                  name: "topP",
                  type: "number",
                  step: 0.1,
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-topP-number"
                },
                {
                  label: "Frequency Penalty",
                  name: "frequencyPenalty",
                  type: "number",
                  step: 0.1,
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-frequencyPenalty-number"
                },
                {
                  label: "Presence Penalty",
                  name: "presencePenalty",
                  type: "number",
                  step: 0.1,
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-presencePenalty-number"
                },
                {
                  label: "Timeout",
                  name: "timeout",
                  type: "number",
                  step: 1,
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-timeout-number"
                },
                {
                  label: "BasePath",
                  name: "basepath",
                  type: "string",
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-basepath-string"
                },
                {
                  label: "Proxy Url",
                  name: "proxyUrl",
                  type: "string",
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-proxyUrl-string"
                },
                {
                  label: "Stop Sequence",
                  name: "stopSequence",
                  type: "string",
                  rows: 4,
                  optional: true,
                  description: "List of stop words to use when generating. Use comma to separate multiple stop words.",
                  additionalParams: true,
                  id: "chatOpenAI_0-input-stopSequence-string"
                },
                {
                  label: "BaseOptions",
                  name: "baseOptions",
                  type: "json",
                  optional: true,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-baseOptions-json"
                },
                {
                  label: "Allow Image Uploads",
                  name: "allowImageUploads",
                  type: "boolean",
                  description: "Allow image input. Refer to the <a href=\"https://docs.flowiseai.com/using-flowise/uploads#image\" target=\"_blank\">docs</a> for more details.",
                  default: false,
                  optional: true,
                  id: "chatOpenAI_0-input-allowImageUploads-boolean"
                },
                {
                  label: "Image Resolution",
                  description: "This parameter controls the resolution in which the model views the image.",
                  name: "imageResolution",
                  type: "options",
                  options: [
                    {
                      label: "Low",
                      name: "low"
                    },
                    {
                      label: "High",
                      name: "high"
                    },
                    {
                      label: "Auto",
                      name: "auto"
                    }
                  ],
                  default: "low",
                  optional: false,
                  additionalParams: true,
                  id: "chatOpenAI_0-input-imageResolution-options"
                }
              ],
              inputAnchors: [
                {
                  label: "Cache",
                  name: "cache",
                  type: "BaseCache",
                  optional: true,
                  id: "chatOpenAI_0-input-cache-BaseCache"
                }
              ],
              inputs: {
                cache: "",
                modelName: "gpt-4o",
                temperature: data.temperature,
                streaming: data.streaming,
                maxTokens: data.maxTokens,
                topP: "",
                frequencyPenalty: "",
                presencePenalty: "",
                timeout: "",
                basepath: "",
                proxyUrl: "",
                stopSequence: "",
                baseOptions: "",
                allowImageUploads: true,
                imageResolution: "low"
              },
              outputAnchors: [
                {
                  id: "chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable",
                  name: "chatOpenAI",
                  label: "ChatOpenAI",
                  description: "Wrapper around OpenAI large language models that use the Chat endpoint",
                  type: "ChatOpenAI | BaseChatModel | BaseLanguageModel | Runnable"
                }
              ],
              outputs: {},
              selected: false
            },
            width: 300,
            height: 670,
            selected: false,
            positionAbsolute: {
              x: 327.8478876074853,
              y: 294.4489773347999
            },
            dragging: false
          },
          {
            id: "ZepMemory_0",
            position: {
              x: 671.0987191520683,
              y: 317.45687667552954
            },
            type: "customNode",
            data: {
              id: "ZepMemory_0",
              label: "Zep Memory - Open Source",
              version: 2,
              name: "ZepMemory",
              type: "ZepMemory",
              baseClasses: [
                "ZepMemory",
                "BaseChatMemory",
                "BaseMemory"
              ],
              category: "Memory",
              description: "Summarizes the conversation and stores the memory in zep server",
              inputParams: [
                {
                  label: "Connect Credential",
                  name: "credential",
                  type: "credential",
                  optional: true,
                  description: "Configure JWT authentication on your Zep instance (Optional)",
                  credentialNames: [
                    "zepMemoryApi"
                  ],
                  id: "ZepMemory_0-input-credential-credential"
                },
                {
                  label: "Base URL",
                  name: "baseURL",
                  type: "string",
                  default: "http://127.0.0.1:8000",
                  id: "ZepMemory_0-input-baseURL-string"
                },
                {
                  label: "Session Id",
                  name: "sessionId",
                  type: "string",
                  description: "If not specified, a random id will be used. Learn <a target=\"_blank\" href=\"https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat\">more</a>",
                  default: "",
                  additionalParams: true,
                  optional: true,
                  id: "ZepMemory_0-input-sessionId-string"
                },
                {
                  label: "Size",
                  name: "k",
                  type: "number",
                  default: "10",
                  description: "Window of size k to surface the last k back-and-forth to use as memory.",
                  additionalParams: true,
                  id: "ZepMemory_0-input-k-number"
                },
                {
                  label: "AI Prefix",
                  name: "aiPrefix",
                  type: "string",
                  default: "ai",
                  additionalParams: true,
                  id: "ZepMemory_0-input-aiPrefix-string"
                },
                {
                  label: "Human Prefix",
                  name: "humanPrefix",
                  type: "string",
                  default: "human",
                  additionalParams: true,
                  id: "ZepMemory_0-input-humanPrefix-string"
                },
                {
                  label: "Memory Key",
                  name: "memoryKey",
                  type: "string",
                  default: "chat_history",
                  additionalParams: true,
                  id: "ZepMemory_0-input-memoryKey-string"
                },
                {
                  label: "Input Key",
                  name: "inputKey",
                  type: "string",
                  default: "input",
                  additionalParams: true,
                  id: "ZepMemory_0-input-inputKey-string"
                },
                {
                  label: "Output Key",
                  name: "outputKey",
                  type: "string",
                  default: "text",
                  additionalParams: true,
                  id: "ZepMemory_0-input-outputKey-string"
                }
              ],
              inputAnchors: [],
              inputs: {
                baseURL: data.memoryBaseUrl,
                sessionId: data.memorySessionId || '',
                k: data.memoryWindow,
                aiPrefix: data.aiPrefix,
                humanPrefix: data.humanPrefix,
                memoryKey: "chat_history",
                inputKey: "input",
                outputKey: "text"
              },
              outputAnchors: [
                {
                  id: "ZepMemory_0-output-ZepMemory-ZepMemory|BaseChatMemory|BaseMemory",
                  name: "ZepMemory",
                  label: "ZepMemory",
                  description: "Summarizes the conversation and stores the memory in zep server",
                  type: "ZepMemory | BaseChatMemory | BaseMemory"
                }
              ],
              outputs: {},
              selected: false
            },
            width: 300,
            height: 427,
            selected: false,
            positionAbsolute: {
              x: 671.0987191520683,
              y: 317.45687667552954
            },
            dragging: false
          },
          {
            id: "calculator_0",
            position: {
              x: 758.1537754816807,
              y: 305.26916878938374
            },
            type: "customNode",
            data: {
              id: "calculator_0",
              label: "Calculator",
              version: 1,
              name: "calculator",
              type: "Calculator",
              baseClasses: [
                "Calculator",
                "Tool",
                "StructuredTool",
                "Runnable"
              ],
              category: "Tools",
              description: "Perform calculations on response",
              inputParams: [],
              inputAnchors: [],
              inputs: {},
              outputAnchors: [
                {
                  id: "calculator_0-output-calculator-Calculator|Tool|StructuredTool|Runnable",
                  name: "calculator",
                  label: "Calculator",
                  description: "Perform calculations on response",
                  type: "Calculator | Tool | StructuredTool | Runnable"
                }
              ],
              outputs: {},
              selected: false
            },
            width: 300,
            height: 143,
            positionAbsolute: {
              x: 758.1537754816807,
              y: 305.26916878938374
            },
            selected: false
          }
        ],
        edges: [
          {
            source: "chatOpenAI_0",
            sourceHandle: "chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable",
            target: "toolAgent_0",
            targetHandle: "toolAgent_0-input-model-BaseChatModel",
            type: "buttonedge",
            id: "chatOpenAI_0-chatOpenAI_0-output-chatOpenAI-ChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable-toolAgent_0-toolAgent_0-input-model-BaseChatModel"
          },
          {
            source: "ZepMemory_0",
            sourceHandle: "ZepMemory_0-output-ZepMemory-ZepMemory|BaseChatMemory|BaseMemory",
            target: "toolAgent_0",
            targetHandle: "toolAgent_0-input-memory-BaseChatMemory",
            type: "buttonedge",
            id: "ZepMemory_0-ZepMemory_0-output-ZepMemory-ZepMemory|BaseChatMemory|BaseMemory-toolAgent_0-toolAgent_0-input-memory-BaseChatMemory"
          },
          {
            source: "calculator_0",
            sourceHandle: "calculator_0-output-calculator-Calculator|Tool|StructuredTool|Runnable",
            target: "toolAgent_0",
            targetHandle: "toolAgent_0-input-tools-Tool",
            type: "buttonedge",
            id: "calculator_0-calculator_0-output-calculator-Calculator|Tool|StructuredTool|Runnable-toolAgent_0-toolAgent_0-input-tools-Tool"
          }
        ]
      }

      const chatflowData = {
        name: data.name,
        type: "CHATFLOW",
        isPublic: data.isPublic,
        deployed: data.deployed,
        category: "pokemon;assistant",
        speechToText: "{}",
        flowData: JSON.stringify(flowData),
        chatbotConfig: "{}",
        apiConfig: "{}",
        analytic: "{}",
        apikeyid: "apikey-pokedexter"
      }

      console.log('Submitting chatflow data:', chatflowData)

      const response = await FlowiseAPI.createChatflow(chatflowData)
      console.log('Create chatflow response:', response)

      if (response?.id) {
        builderForm.reset()
        toast.success(`Chatflow "${response.name}" created successfully!`)
        setActiveTab('chatflows')
        
        setTimeout(() => {
          const event = new CustomEvent('chatflows:refresh', { 
            detail: { id: response.id } 
          })
          window.dispatchEvent(event)
        }, 500)
      } else {
        console.error('Invalid response - missing ID:', response)
        throw new Error('Failed to create chatflow - no ID returned')
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      toast.error('Failed to create chatflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="flex-1">
      <Tabs
        defaultValue="chatflows"
        value={activeTab}
        onValueChange={setActiveTab}
        className="p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">PokéDexter Control</h2>
          <TabsList>
            <TabsTrigger value="chatflows">
              <Bot className="w-4 h-4 mr-2" />
              Chatflows
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <LinkIcon className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="builder">
              <Wand2 className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart2 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chatflows" className="space-y-4">
          <ChatflowsList onSelect={setSelectedChatflow} />
          
          <Dialog open={!!selectedChatflow} onOpenChange={(open) => !open && setSelectedChatflow(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>Edit Chatflow: {selectedChatflow?.name}</DialogTitle>
                  <DialogDescription>
                  Update the configuration for this chatflow. Changes will be applied immediately.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="configuration">Configuration</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="space-y-4 mt-4">
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
                                A descriptive name for this chatflow
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {selectedChatflow?.id && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Chatflow ID</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
                                {selectedChatflow.id}
                              </code>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (selectedChatflow?.id) {
                                    navigator.clipboard.writeText(selectedChatflow.id)
                                    toast.success('Chatflow ID copied to clipboard')
                                  }
                                }}
                                className="gap-2"
                              >
                                <Copy className="h-4 w-4" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              This is your unique chatflow identifier
                            </p>
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                              <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                  </SelectTrigger>
                              </FormControl>
                                <SelectContent>
                                  {CHATFLOW_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The type of chatflow determines its behavior and capabilities
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
                                <div className="relative">
                                <Textarea 
                                  {...field} 
                                    placeholder="Enter the system message for the AI"
                                    className="min-h-[200px] max-h-[200px] resize-none pr-4
                                      [&::-webkit-scrollbar]:w-1.5
                                      [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10
                                      hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
                                      [&::-webkit-scrollbar-track]:bg-transparent
                                      transition-colors"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none rounded-b-lg" />
                                </div>
                              </FormControl>
                              <FormDescription>
                                The system message that defines the AI's behavior
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="configuration" className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperature: {field.value}</FormLabel>
                                <FormControl>
                                <Slider
                                  min={0}
                                  max={2}
                                  step={0.1}
                                  value={[Number(field.value)]}
                                  onValueChange={([value]) => field.onChange(Number(value))}
                                />
                                </FormControl>
                                  <FormDescription>
                                Controls randomness in responses (0 = deterministic, 2 = very random)
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
                                  {...field} 
                                  value={Number(field.value)}
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum number of tokens in the response
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
                                  {...field} 
                                  value={Number(field.value)}
                                  onChange={e => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                Number of previous messages to include in context
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="features" className="space-y-4 mt-4">
                        <div className="grid gap-4 grid-cols-2">
                          <FormField
                            control={form.control}
                            name="deployed"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                                <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-0.5">
                                  <FormLabel>Deployment Status</FormLabel>
                                <FormDescription>
                                    Enable or disable this chatflow
                                </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                        <FormField
                          control={form.control}
                            name="isPublic"
                          render={({ field }) => (
                              <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-0.5">
                                  <FormLabel>Public Access</FormLabel>
                              <FormDescription>
                                    Allow public access to this chatflow
                              </FormDescription>
                                </div>
                            </FormItem>
                          )}
                        />

                          <FormField
                            control={form.control}
                            name="speechToText"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-0.5">
                                  <FormLabel>Speech to Text</FormLabel>
                                <FormDescription>
                                    Enable voice input for this chatflow
                                </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedChatflow(null)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Chatflow
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <ChatflowAssignments />
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Chatflow Builder</h3>
              <p className="text-sm text-muted-foreground">
                Create a new chatflow with our streamlined builder
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={loadTemplate}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Load Template
              </Button>
              <Button 
                variant="outline"
                onClick={validateFlow}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Validate
              </Button>
            </div>
          </div>

          <Card className="p-6">
            <Form {...builderForm}>
              <form 
                onSubmit={builderForm.handleSubmit((data) => {
                  console.log('Form submitted with data:', data)
                  onBuilderSubmit(data)
                })} 
                className="space-y-6"
              >
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="gap-2">
                      <Bot className="w-4 h-4" />
                      Basic
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2">
                      <Cpu className="w-4 h-4" />
                      AI Model
                    </TabsTrigger>
                    <TabsTrigger value="memory" className="gap-2">
                      <HardDrive className="w-4 h-4" />
                      Memory
                    </TabsTrigger>
                    <TabsTrigger value="features" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Features
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid gap-4 grid-cols-2">
                      <FormField
                        control={builderForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., PokéDexter Assistant" />
                            </FormControl>
                            <FormDescription>
                              A descriptive name for this chatflow
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={builderForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="chat">Chat</SelectItem>
                                <SelectItem value="assistant">Assistant</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The type of chatflow determines its behavior
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={builderForm.control}
                      name="systemMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Message</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea
                                {...field}
                                className="min-h-[200px] resize-none pr-4
                                  [&::-webkit-scrollbar]:w-1.5
                                  [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10
                                  hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
                                  [&::-webkit-scrollbar-track]:bg-transparent"
                                placeholder="Enter the system message that defines the AI's behavior..."
                              />
                              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none rounded-b-lg" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The system message that defines the AI's behavior and capabilities
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4 mt-4">
                    <FormField
                      control={builderForm.control}
                      name="modelName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gpt-4o-mini">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  GPT-4o Mini (Latest)
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-4o">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  GPT-4o (Standard)
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-4-turbo-2024-04-09">
                                <div className="flex items-center gap-2">
                                  <Network className="w-4 h-4 text-primary" />
                                  GPT-4 Turbo (April 2024)
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-4-turbo-preview">
                                <div className="flex items-center gap-2">
                                  <Network className="w-4 h-4 text-primary" />
                                  GPT-4 Turbo (Preview)
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-4">
                                <div className="flex items-center gap-2">
                                  <Network className="w-4 h-4 text-primary" />
                                  GPT-4 (Standard)
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-3.5-turbo-0125">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-4 h-4 text-primary" />
                                  GPT-3.5 Turbo (Jan 2024)
                                </div>
                              </SelectItem>
                              <SelectItem value="gpt-3.5-turbo">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-4 h-4 text-primary" />
                                  GPT-3.5 Turbo (Auto-updating)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The OpenAI model to use for chat completion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 grid-cols-2">
                      <FormField
                        control={builderForm.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperature: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={2}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormDescription>
                              Controls randomness in responses
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={builderForm.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Tokens</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum tokens in response
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={builderForm.control}
                      name="streaming"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel>Streaming Responses</FormLabel>
                            <FormDescription>
                              Enable token-by-token streaming
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="memory" className="space-y-4 mt-4">
                    <FormField
                      control={builderForm.control}
                      name="memoryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Memory Type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select memory type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="zep">
                                <div className="flex items-center gap-2">
                                  <HardDrive className="w-4 h-4 text-primary" />
                                  Zep Memory
                                </div>
                              </SelectItem>
                              <SelectItem value="redis">
                                <div className="flex items-center gap-2">
                                  <Database className="w-4 h-4 text-primary" />
                                  Redis Memory
                                </div>
                              </SelectItem>
                              <SelectItem value="mongo">
                                <div className="flex items-center gap-2">
                                  <Database className="w-4 h-4 text-primary" />
                                  MongoDB Memory
                                </div>
                              </SelectItem>
                              <SelectItem value="none">
                                <div className="flex items-center gap-2">
                                  <XIcon className="w-4 h-4 text-muted-foreground" />
                                  No Memory
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose how conversation history is stored
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4">
                      <FormField
                        control={builderForm.control}
                        name="memoryWindow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Memory Window</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Number of messages to remember
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={builderForm.control}
                      name="memorySessionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session ID</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              placeholder="e.g., family-123 or pokemon-trainer-red" 
                            />
                          </FormControl>
                          <FormDescription>
                            Add a custom identifier to group related conversations. Great for family groups or specific training sessions!
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4 mt-4">
                    <div className="grid gap-4 grid-cols-2">
                      <FormField
                        control={builderForm.control}
                        name="deployed"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Auto-Deploy</FormLabel>
                              <FormDescription>
                                Deploy immediately after creation
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={builderForm.control}
                        name="isPublic"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Public Access</FormLabel>
                              <FormDescription>
                                Allow access without auth
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={builderForm.control}
                        name="speechToText"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 p-4 border rounded-lg">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Voice Input</FormLabel>
                              <FormDescription>
                                Enable speech recognition
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => builderForm.reset()}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    onClick={() => console.log('Submit button clicked')}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Chatflow
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <BarChart2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium">Analytics Dashboard Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We're building a comprehensive analytics dashboard to help you monitor chatflow performance, 
                  user engagement metrics, and conversation insights. Stay tuned for detailed analytics 
                  and reporting features.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </Button>
                <Button variant="outline" disabled className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium">Settings Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Advanced configuration settings for PokéDexter are on the way. You'll soon be able to 
                  customize global preferences, manage API integrations, and configure security settings 
                  all in one place.
                </p>
              </div>
              <Button variant="outline" disabled className="gap-2">
                <Settings className="w-4 h-4" />
                Configure Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  )
} 