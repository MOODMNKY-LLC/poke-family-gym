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
import { 
  Plus, 
  Pencil, 
  Trash2,
  Bot,
  BarChart2,
  Users,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
  Settings2
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { FlowiseAPI } from '@/lib/flowise/api'
import { FamilyMembersAPI } from '@/lib/supabase/family-members'
import type { FamilyMember } from '@/lib/supabase/family-members'
import { ChatFlowSelect } from '@/components/ui/chatflow-select'
import { ChatFlowsAPI } from '@/lib/supabase/chatflows'
import type { ChatFlow } from '@/lib/supabase/chatflows'

// Simplified ChatFlow interface
interface PokeChatFlow {
  id: string
  name: string
  flowData: string
  deployed: boolean | null
  isPublic: boolean | null
  apikeyid: string | null
  chatbotConfig: string | null
  apiConfig: string | null
  analytic: string | null
  speechToText: string | null
  category: string | null
  type: 'CHATFLOW' | 'MULTIAGENT'
  createdDate: string
  updatedDate: string
  systemMessage: string | null
  temperature: number | null
  maxTokens: number | null
  topP: number | null
  frequencyPenalty: number | null
  presencePenalty: number | null
  memoryType: string | null
  memoryWindow: number | null
}

// Analytics data type
interface AnalyticsData {
  date: string
  messages: number
  positiveRatings: number
  negativeRatings: number
}

// Form schema
const chatflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemMessage: z.string().min(1, 'System message is required'),
  type: z.enum(['CHATFLOW', 'MULTIAGENT']).default('CHATFLOW'),
  category: z.string().nullish(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(2000),
  memoryEnabled: z.boolean().default(true),
  publicAccess: z.boolean().default(false),
  topP: z.number().min(0).max(1).default(0.95),
  frequencyPenalty: z.number().min(0).max(2).default(0),
  presencePenalty: z.number().min(0).max(2).default(0),
  memoryType: z.string().default('simple'),
  memoryWindow: z.number().min(1).max(100).default(5)
})

type ChatflowFormData = z.infer<typeof chatflowSchema>

// Default form values
const defaultFormValues: ChatflowFormData = {
  name: '',
  systemMessage: 'You are PokéDexter, an advanced AI assistant.',
  type: 'CHATFLOW',
  category: null,
  temperature: 0.7,
  maxTokens: 2000,
  memoryEnabled: true,
  publicAccess: false,
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,
  memoryType: 'simple',
  memoryWindow: 5
}

const DASHBOARD_TABS = {
  FLOWS: {
    id: 'flows',
    icon: Bot,
    label: 'My Flows'
  },
  TEMPLATES: {
    id: 'templates',
    icon: Sparkles,
    label: 'Templates'
  },
  ASSIGNMENTS: {
    id: 'assignments',
    icon: Users,
    label: 'Family Access'
  },
  ANALYTICS: {
    id: 'analytics',
    icon: BarChart2,
    label: 'Usage Stats'
  }
}

export function PokeDexterControl() {
  const { theme } = useTheme()
  const [chatflows, setChatflows] = useState<PokeChatFlow[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedChatflow, setSelectedChatflow] = useState<PokeChatFlow | null>(null)
  const [selectedTab, setSelectedTab] = useState(DASHBOARD_TABS.FLOWS.id)
  const [analyticsRange, setAnalyticsRange] = useState<'24h' | '7d' | '30d'>('7d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])

  const form = useForm<ChatflowFormData>({
    resolver: zodResolver(chatflowSchema),
    defaultValues: defaultFormValues
  })

  // Fetch chatflows
  const fetchChatflows = async () => {
    setIsLoading(true)
    try {
      const flows = await FlowiseAPI.getChatflows()
      console.debug('Fetched chatflows:', flows)
      
      setChatflows(flows.map(flow => {
        // Parse the flowData to extract node configuration
        const flowData = typeof flow.flowData === 'string' 
          ? JSON.parse(flow.flowData)
          : flow.flowData

        // Find the chat node configuration
        const chatNode = flowData.nodes?.find((node: any) => node.type === 'customNode')
        const nodeData = chatNode?.data?.inputs || {}
        
        console.debug('Extracted node data for flow:', flow.id, {
          flowData,
          chatNode,
          nodeData
        })

        // Convert to PokeChatFlow type
        return {
          id: flow.id,
          name: flow.name,
          flowData: typeof flow.flowData === 'string' ? flow.flowData : JSON.stringify(flow.flowData),
          deployed: flow.deployed ?? false,
          isPublic: flow.isPublic ?? false,
          apikeyid: flow.apikeyid,
          chatbotConfig: flow.chatbotConfig,
          apiConfig: flow.apiConfig,
          analytic: flow.analytic,
          speechToText: flow.speechToText,
          category: flow.category,
          type: flow.type as 'CHATFLOW' | 'MULTIAGENT',
          createdDate: flow.createdDate,
          updatedDate: flow.updatedDate,
          systemMessage: nodeData.systemMessage ?? flow.systemMessage ?? null,
          temperature: nodeData.temperature ?? flow.temperature ?? null,
          maxTokens: nodeData.maxTokens ?? flow.maxTokens ?? null,
          topP: nodeData.topP ?? flow.topP ?? null,
          frequencyPenalty: nodeData.frequencyPenalty ?? flow.frequencyPenalty ?? null,
          presencePenalty: nodeData.presencePenalty ?? flow.presencePenalty ?? null,
          memoryType: nodeData.memoryType ?? flow.memoryType ?? null,
          memoryWindow: nodeData.memoryWindow ?? flow.memoryWindow ?? null
        }
      }))
    } catch (error) {
      console.error('Error fetching chatflows:', error)
      toast.error('Failed to fetch chatflows')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const onSubmit = async (values: ChatflowFormData) => {
    try {
      setIsLoading(true)
      
      // Extract the chat node configuration from the example flowData
      const flowData = {
        nodes: [
          {
            id: "toolAgent_0",
            position: { x: 1097, y: 413 },
            type: "customNode",
            data: {
              id: "toolAgent_0",
              label: "Tool Agent",
              name: "toolAgent",
              type: "AgentExecutor",
              baseClasses: ["AgentExecutor", "BaseChain", "Runnable"],
              category: "Agents",
              description: "Agent that uses Function Calling to pick the tools and args to call",
              inputParams: [
                {
                  label: "System Message",
                  name: "systemMessage",
                  type: "string",
                  value: values.systemMessage
                }
              ],
              inputs: {
                systemMessage: values.systemMessage,
                temperature: values.temperature,
                maxTokens: values.maxTokens,
                topP: values.topP,
                frequencyPenalty: values.frequencyPenalty,
                presencePenalty: values.presencePenalty,
                memoryType: values.memoryEnabled ? values.memoryType : 'none',
                memoryWindow: values.memoryWindow
              }
            }
          }
        ],
        edges: []
      }

      const payload = {
        name: values.name,
        flowData: JSON.stringify(flowData),
        deployed: true,
        isPublic: values.publicAccess,
        type: 'CHATFLOW',
        category: values.category || undefined,
        chatbotConfig: JSON.stringify({
          theme: {
            chatWindow: {
              welcomeMessage: values.systemMessage,
              backgroundColor: '#ffffff',
              height: 700,
              width: 400,
              fontSize: 16,
              poweredByTextColor: '#303235',
              botMessage: {
                backgroundColor: '#f7f8ff',
                textColor: '#303235',
                showAvatar: true,
                avatarSrc: null
              },
              userMessage: {
                backgroundColor: '#3B81F6',
                textColor: '#ffffff',
                showAvatar: true,
                avatarSrc: null
              },
              textInput: {
                placeholder: 'Type your message',
                backgroundColor: '#ffffff',
                textColor: '#303235',
                sendButtonColor: '#3B81F6'
              }
            }
          }
        }),
        apiConfig: JSON.stringify({}),
        analytic: JSON.stringify({}),
        speechToText: JSON.stringify({}),
        systemMessage: values.systemMessage,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        topP: values.topP,
        frequencyPenalty: values.frequencyPenalty,
        presencePenalty: values.presencePenalty,
        memoryType: values.memoryEnabled ? values.memoryType : 'none',
        memoryWindow: values.memoryWindow
      }

      console.debug('Creating/updating chatflow with data:', {
        ...payload,
        flowData: JSON.parse(payload.flowData),
        chatbotConfig: JSON.parse(payload.chatbotConfig)
      })

      let response
      if (selectedChatflow?.id) {
        console.debug('Updating chatflow:', selectedChatflow.id)
        response = await FlowiseAPI.updateChatflow(selectedChatflow.id, payload)
        console.debug('Update response:', response)
        toast.success('Flow updated successfully')
      } else {
        console.debug('Creating new chatflow')
        response = await FlowiseAPI.createChatflow(payload)
        console.debug('Create response:', response)
        toast.success('Flow created successfully')
      }

      setIsDialogOpen(false)
      await fetchChatflows()
      form.reset(defaultFormValues)
    } catch (error) {
      console.error('Error saving chatflow:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      toast.error(error instanceof Error ? error.message : 'Failed to save flow')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete chatflow
  const deleteChatflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chatflow?')) return

    try {
      setIsLoading(true)
      await FamilyMembersAPI.removeChatflowAssignments(id)
      await FlowiseAPI.deleteChatflow(id)
      toast.success('Chatflow deleted successfully')
      await Promise.all([fetchChatflows(), fetchFamilyMembers()])
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      toast.error('Failed to delete chatflow')
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

  // Load initial data
  useEffect(() => {
    fetchChatflows()
    fetchFamilyMembers()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue={DASHBOARD_TABS.FLOWS.id} className="space-y-4" onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            {Object.values(DASHBOARD_TABS).map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {selectedTab === DASHBOARD_TABS.FLOWS.id && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedChatflow(null)
                  form.reset(defaultFormValues)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Flow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedChatflow ? 'Edit Flow' : 'Create Flow'}</DialogTitle>
                  <DialogDescription>
                    Configure your AI assistant's behavior and settings
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                        <TabsTrigger value="memory">Memory Settings</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Homework Helper" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assistant Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select assistant type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CHATFLOW">Single Agent</SelectItem>
                                  <SelectItem value="MULTIAGENT">Multi Agent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose between a single agent or multi-agent system
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="e.g., homework, chores, general"
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormDescription>
                                Optional category to help organize your flows
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
                                  rows={5}
                                />
                              </FormControl>
                              <FormDescription>
                                This message defines how your AI assistant will behave
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="publicAccess"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Public Access</FormLabel>
                                <FormDescription>
                                  Allow access without authentication
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

                      <TabsContent value="advanced" className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperature</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                  step={0.1}
                                  min={0}
                                  max={2}
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
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                  step={100}
                                  min={1}
                                  max={4000}
                                />
                              </FormControl>
                              <FormDescription>
                                Maximum length of the response (1-4000)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="topP"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top P</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                  step={0.05}
                                  min={0}
                                  max={1}
                                />
                              </FormControl>
                              <FormDescription>
                                Controls diversity of responses (0-1)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="frequencyPenalty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency Penalty</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                  step={0.1}
                                  min={0}
                                  max={2}
                                />
                              </FormControl>
                              <FormDescription>
                                Reduces repetition in responses (0-2)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presencePenalty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Presence Penalty</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                  step={0.1}
                                  min={0}
                                  max={2}
                                />
                              </FormControl>
                              <FormDescription>
                                Encourages discussing new topics (0-2)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="memory" className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="memoryEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Conversation Memory</FormLabel>
                                <FormDescription>
                                  Remember previous messages in conversations
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

                        {form.watch('memoryEnabled') && (
                          <>
                            <FormField
                              control={form.control}
                              name="memoryType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Memory Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select memory type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="simple">Simple</SelectItem>
                                      <SelectItem value="zep">Zep</SelectItem>
                                      <SelectItem value="redis">Redis</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Type of memory storage to use
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
                                      onChange={e => field.onChange(parseInt(e.target.value))}
                                      step={1}
                                      min={1}
                                      max={100}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Number of previous messages to remember (1-100)
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
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {selectedChatflow ? 'Update Flow' : 'Create Flow'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value={DASHBOARD_TABS.FLOWS.id} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Flows</CardTitle>
              <CardDescription>
                Manage your AI assistants and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Memory</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatflows.map((flow) => {
                      const assignedMembers = familyMembers.filter(m => m.chatflow_id === flow.id).length

                      return (
                        <TableRow key={flow.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{flow.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {flow.category || 'No category'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {flow.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={flow.memoryType !== 'none' ? 'default' : 'secondary'}>
                              {flow.memoryType !== 'none' ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={flow.isPublic ? 'default' : 'outline'}>
                              {flow.isPublic ? 'Public' : 'Private'}
                            </Badge>
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
                              onClick={async () => {
                                try {
                                  console.debug('Fetching chatflow for editing:', flow.id)
                                  setIsLoading(true)
                                  
                                  // Fetch complete chatflow data
                                  const chatflowData = await FlowiseAPI.getChatflow(flow.id)
                                  console.debug('Fetched chatflow data:', chatflowData)
                                  
                                  // Parse flowData
                                  const flowData = typeof chatflowData.flowData === 'string' 
                                    ? JSON.parse(chatflowData.flowData)
                                    : chatflowData.flowData
                                  
                                  // Find the chat node configuration
                                  const chatNode = flowData.nodes?.find((node: any) => node.type === 'customNode')
                                  const nodeData = chatNode?.data?.inputs || {}
                                  
                                  console.debug('Extracted node data:', {
                                    flowData,
                                    chatNode,
                                    nodeData
                                  })

                                  // Convert to PokeChatFlow type
                                  const pokeChatFlow: PokeChatFlow = {
                                    id: chatflowData.id,
                                    name: chatflowData.name,
                                    flowData: typeof chatflowData.flowData === 'string' 
                                      ? chatflowData.flowData 
                                      : JSON.stringify(chatflowData.flowData),
                                    deployed: chatflowData.deployed ?? false,
                                    isPublic: chatflowData.isPublic ?? false,
                                    apikeyid: chatflowData.apikeyid,
                                    chatbotConfig: chatflowData.chatbotConfig,
                                    apiConfig: chatflowData.apiConfig,
                                    analytic: chatflowData.analytic,
                                    speechToText: chatflowData.speechToText,
                                    category: chatflowData.category,
                                    type: chatflowData.type as 'CHATFLOW' | 'MULTIAGENT',
                                    createdDate: chatflowData.createdDate,
                                    updatedDate: chatflowData.updatedDate,
                                    systemMessage: nodeData.systemMessage ?? chatflowData.systemMessage ?? null,
                                    temperature: nodeData.temperature ?? chatflowData.temperature ?? null,
                                    maxTokens: nodeData.maxTokens ?? chatflowData.maxTokens ?? null,
                                    topP: nodeData.topP ?? chatflowData.topP ?? null,
                                    frequencyPenalty: nodeData.frequencyPenalty ?? chatflowData.frequencyPenalty ?? null,
                                    presencePenalty: nodeData.presencePenalty ?? chatflowData.presencePenalty ?? null,
                                    memoryType: nodeData.memoryType ?? chatflowData.memoryType ?? null,
                                    memoryWindow: nodeData.memoryWindow ?? chatflowData.memoryWindow ?? null
                                  }

                                  // Set form values using the converted data
                                  setSelectedChatflow(pokeChatFlow)
                                  form.reset({
                                    name: pokeChatFlow.name,
                                    systemMessage: pokeChatFlow.systemMessage || '',
                                    type: pokeChatFlow.type,
                                    category: pokeChatFlow.category || undefined,
                                    temperature: pokeChatFlow.temperature || 0.7,
                                    maxTokens: pokeChatFlow.maxTokens || 2000,
                                    memoryEnabled: pokeChatFlow.memoryType !== 'none',
                                    publicAccess: pokeChatFlow.isPublic || false,
                                    topP: pokeChatFlow.topP || 0.95,
                                    frequencyPenalty: pokeChatFlow.frequencyPenalty || 0,
                                    presencePenalty: pokeChatFlow.presencePenalty || 0,
                                    memoryType: pokeChatFlow.memoryType || 'simple',
                                    memoryWindow: pokeChatFlow.memoryWindow || 5
                                  })
                                  setIsDialogOpen(true)
                                } catch (error) {
                                  console.error('Error fetching chatflow:', error)
                                  toast.error('Failed to load chatflow data')
                                } finally {
                                  setIsLoading(false)
                                }
                              }}
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteChatflow(flow.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {chatflows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Bot className="w-8 h-8 text-muted-foreground" />
                            <p>No flows found</p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedChatflow(null)
                                form.reset(defaultFormValues)
                                setIsDialogOpen(true)
                              }}
                            >
                              Create your first flow
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={DASHBOARD_TABS.TEMPLATES.id}>
          <Card>
            <CardHeader>
              <CardTitle>Flow Templates</CardTitle>
              <CardDescription>
                Quick-start templates for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Template cards will go here */}
                <Card>
                  <CardHeader>
                    <CardTitle>Homework Helper</CardTitle>
                    <CardDescription>
                      An AI tutor that helps with assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Includes math problem solving, writing assistance, and study tips
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Add more template cards */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={DASHBOARD_TABS.ASSIGNMENTS.id}>
          <Card>
            <CardHeader>
              <CardTitle>Family Access</CardTitle>
              <CardDescription>
                Manage which family members can access each flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Active Flow</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyMembers.map((member) => (
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
                            toast.success(`Removed flow from ${member.display_name}`)
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.updated_at ? new Date(member.updated_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.chatflow_id ? 'default' : 'secondary'}>
                          {member.chatflow_id ? 'Active' : 'No Flow'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={DASHBOARD_TABS.ANALYTICS.id}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    Track how your flows are being used
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Conversations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.reduce((sum, day) => sum + day.messages, 0)}
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
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">
                        {analyticsData.reduce((sum, day) => sum + day.positiveRatings, 0)}
                      </div>
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">
                        {analyticsData.reduce((sum, day) => sum + day.negativeRatings, 0)}
                      </div>
                      <ThumbsDown className="w-4 h-4 text-red-500" />
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
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="#8884d8" 
                    name="Messages" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="positiveRatings" 
                    stroke="#82ca9d" 
                    name="Positive" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="negativeRatings" 
                    stroke="#ff7300" 
                    name="Needs Improvement" 
                  />
                </LineChart>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 