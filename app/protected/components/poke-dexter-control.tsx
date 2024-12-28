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
  Settings,
  MessageSquare,
  BarChart2,
  Users,
  Database,
  Loader2,
  Copy,
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
  Calendar
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
            <TabsTrigger value="builder">
              <Wand2 className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <Database className="w-4 h-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="assistants">
              <Users className="w-4 h-4 mr-2" />
              Assistants
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
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

        <TabsContent value="builder" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Chatflow Builder</h3>
              <p className="text-sm text-muted-foreground">
                Create and configure chatflow templates
              </p>
            </div>
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
              New Template
            </Button>
          </div>

          <Form {...form}>
            <form className="space-y-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">
                    <Bot className="w-4 h-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="model">
                    <Cpu className="w-4 h-4 mr-2" />
                    Model
                  </TabsTrigger>
                  <TabsTrigger value="memory">
                    <HardDrive className="w-4 h-4 mr-2" />
                    Memory
                  </TabsTrigger>
                  <TabsTrigger value="tools">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Tools
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid gap-4">
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
                  </div>
                </TabsContent>

                <TabsContent value="model" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                          <FormField
                            control={form.control}
                      name="temperature"
                            render={({ field }) => (
                              <FormItem>
                          <FormLabel>Temperature: {field.value}</FormLabel>
                                <FormControl>
                            <div className="flex items-center gap-4">
                              <Slider
                                min={0}
                                max={2}
                                step={0.1}
                                value={[Number(field.value)]}
                                onValueChange={([value]) => field.onChange(Number(value))}
                                className="flex-1"
                              />
                                  <Input 
                                    type="number" 
                                {...field}
                                value={Number(field.value)}
                                onChange={e => field.onChange(Number(e.target.value))}
                                className="w-20"
                              />
                            </div>
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
                            <div className="flex items-center gap-4">
                              <Slider
                                min={1}
                                max={4000}
                                step={1}
                                value={[Number(field.value)]}
                                onValueChange={([value]) => field.onChange(Number(value))}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                {...field}
                                value={Number(field.value)}
                                onChange={e => field.onChange(Number(e.target.value))}
                                className="w-20"
                              />
                            </div>
                                </FormControl>
                          <FormDescription>
                            Maximum number of tokens in the response (1-4000)
                          </FormDescription>
                          <FormMessage />
                              </FormItem>
                            )}
                          />
                  </div>
                      </TabsContent>

                      <TabsContent value="memory" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                          <FormField
                            control={form.control}
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
                              {MEMORY_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex flex-col gap-1">
                                    <span>{type.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {type.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                                </SelectContent>
                              </Select>
                                <FormDescription>
                            Choose how the chatflow remembers conversation history
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        {form.watch('memoryType') === 'zep' && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="memoryWindow"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Memory Window Size</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-4">
                                  <Slider
                                    min={1}
                                    max={50}
                                    step={1}
                                    value={[Number(field.value)]}
                                    onValueChange={([value]) => field.onChange(Number(value))}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    {...field}
                                    value={Number(field.value)}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    className="w-20"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Number of previous messages to include in context (1-50)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                              name="memoryBaseUrl"
                          render={({ field }) => (
                            <FormItem>
                                  <FormLabel>Memory Server URL</FormLabel>
                                <FormControl>
                                    <Input 
                                  {...field}
                                  placeholder="https://your-zep-server.com"
                                    />
                                </FormControl>
                              <FormDescription>
                                The URL of your Zep memory server
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="aiPrefix"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>AI Prefix</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="ai"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Prefix for AI messages in memory
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        <FormField
                          control={form.control}
                            name="humanPrefix"
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel>Human Prefix</FormLabel>
                              <FormControl>
                                    <Input 
                                    {...field}
                                    placeholder="human"
                                    />
                              </FormControl>
                              <FormDescription>
                                  Prefix for human messages in memory
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        </div>
                      </div>
                        )}
                  </div>
                      </TabsContent>

                <TabsContent value="tools" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Available Tools</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {NODE_TYPES.map(node => (
                          <Card key={node.value} className="p-4">
                            <div className="space-y-2">
                              <h5 className="font-medium">{node.label}</h5>
                              <p className="text-sm text-muted-foreground">
                                {node.description}
                              </p>
                              <Badge variant="secondary">
                                {node.category}
                          </Badge>
        </div>
                          </Card>
                        ))}
                            </div>
                            </div>
                          </div>
        </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Raw Configuration</h4>
                      <Textarea
                        className="font-mono text-sm"
                        rows={20}
                        value={JSON.stringify(form.getValues(), null, 2)}
                        readOnly
                      />
                    </div>
                    </div>
        </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Template
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
              <h3 className="text-lg font-medium">Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">
                Manage documents and training data for your chatflows
              </p>
                </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                  <DialogDescription>
                    Upload documents to be processed and indexed for your chatflows.
                  </DialogDescription>
                </DialogHeader>

                <DocumentUploadForm onSuccess={() => {
                  // Refresh document list
                }} />
              </DialogContent>
            </Dialog>
              </div>

          <DocumentList />
        </TabsContent>

        <TabsContent value="assistants" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Assistant Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Configure and manage assistant personalities
              </p>
                    </div>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              New Assistant
            </Button>
                    </div>
          {/* Assistant management UI */}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Chat History</h3>
              <p className="text-sm text-muted-foreground">
                View and manage conversation history
              </p>
                    </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
                    </div>
              </div>
          {/* Chat history and message management UI */}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Analytics & Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Monitor performance and user feedback
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
                          </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
                          </Button>
            </div>
          </div>
          {/* Analytics dashboard and feedback management UI */}
        </TabsContent>

        <TabsContent value="settings">
          {/* Settings content */}
        </TabsContent>
      </Tabs>
    </Card>
  )
} 