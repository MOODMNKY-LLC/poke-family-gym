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
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  Wand2,
  Lock
} from 'lucide-react'
import { FlowiseAPI } from '@/lib/flowise/api'
import type { ChatFlow, ChatFlowConfig } from '@/lib/flowise/types'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

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
})

type ChatFlowFormValues = z.infer<typeof chatflowSchema>

export function FlowiseControlPanel() {
  const { theme } = useTheme()
  const [chatflows, setChatflows] = useState<ChatFlow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedChatflow, setSelectedChatflow] = useState<ChatFlow | null>(null)
  const [selectedTab, setSelectedTab] = useState('chatflows')
  const [chatflowToDelete, setChatflowToDelete] = useState<ChatFlow | null>(null)
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false)

  const form = useForm<ChatFlowFormValues>({
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

  // Fetch chatflows
  const fetchChatflows = async () => {
    setIsLoading(true)
    try {
      const response = await FlowiseAPI.getChatFlows()
      setChatflows(response.chatflows)
    } catch (error) {
      console.error('Error fetching chatflows:', error)
      toast.error('Failed to fetch chatflows')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const onSubmit = async (values: ChatFlowFormValues) => {
    setIsLoading(true)
    try {
      // Prepare chatflow data
      const chatflowData = {
        ...values,
        flowData: selectedChatflow?.flowData || JSON.stringify({
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        }),
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
        })
      }

      if (selectedChatflow) {
        // Update existing chatflow
        await FlowiseAPI.updateChatflow(selectedChatflow.id!, chatflowData)
        toast.success('Chatflow updated successfully')
      } else {
        // Create new chatflow
        await FlowiseAPI.createChatflow(chatflowData)
        toast.success('Chatflow created successfully')
      }

      // Close dialog and refresh list
      setIsDialogOpen(false)
      fetchChatflows()
    } catch (error) {
      console.error('Error saving chatflow:', error)
      toast.error('Failed to save chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  // Edit chatflow
  const editChatflow = async (chatflow: ChatFlow) => {
    try {
      setIsLoading(true)
      const response = await FlowiseAPI.getChatFlow(chatflow.id!)
      const config = JSON.parse(response.chatbotConfig || '{}')

      setSelectedChatflow(response)
      form.reset({
        ...response,
        // Ensure all fields have values
        name: response.name,
        type: response.type || 'chat',
        isPublic: response.isPublic || false,
        category: response.category || null,
        // Tool Agent Configuration
        systemMessage: config.systemMessage || form.getValues('systemMessage'),
        maxIterations: config.maxIterations || 10,
        tools: config.tools || [],
        // ChatOpenAI Configuration
        temperature: config.temperature || 0.4,
        streaming: config.streaming ?? true,
        maxTokens: config.maxTokens || 2000,
        // Memory Configuration
        memoryType: config.memoryType || 'zep',
        memoryBaseUrl: config.memoryBaseUrl || 'https://poke-gym-zep.moodmnky.com',
        memorySessionId: config.memorySessionId || '',
        memoryWindow: config.memoryWindow || 10,
        // Legacy API compatibility
        apikeyid: response.apikeyid || null,
        speechToText: response.speechToText || null,
        followUpPrompts: response.followUpPrompts || null,
        topP: config.topP || 0.95,
        frequencyPenalty: config.frequencyPenalty || 0,
        presencePenalty: config.presencePenalty || 0
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error loading chatflow:', error)
      toast.error('Failed to load chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete chatflow
  const confirmDelete = async () => {
    if (!chatflowToDelete) return

    try {
      setIsLoading(true)
      const response = await FlowiseAPI.deleteChatflow(chatflowToDelete.id!)
      
      if (response.affected > 0) {
        toast.success('Chatflow deleted successfully')
        fetchChatflows()
      } else {
        toast.error('Failed to delete chatflow')
      }
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      toast.error('Failed to delete chatflow')
    } finally {
      setIsLoading(false)
      setChatflowToDelete(null)
    }
  }

  // Deploy/Undeploy chatflow
  const toggleDeploy = async (chatflow: ChatFlow) => {
    try {
      setIsLoading(true)
      if (chatflow.deployed) {
        await FlowiseAPI.undeployChatflow(chatflow.id!)
        toast.success('Chatflow undeployed successfully')
      } else {
        await FlowiseAPI.deployChatflow(chatflow.id!)
        toast.success('Chatflow deployed successfully')
      }
      fetchChatflows()
    } catch (error) {
      console.error('Error toggling deployment:', error)
      toast.error(`Failed to ${chatflow.deployed ? 'undeploy' : 'deploy'} chatflow`)
    } finally {
      setIsLoading(false)
    }
  }

  // Copy chatflow ID
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success('Chatflow ID copied to clipboard')
  }

  // Toggle public/private status
  const togglePublic = async (chatflow: ChatFlow) => {
    try {
      setIsLoading(true)
      await FlowiseAPI.updateChatflow(chatflow.id!, {
        ...chatflow,
        isPublic: !chatflow.isPublic
      })
      toast.success(`Chatflow is now ${chatflow.isPublic ? 'private' : 'public'}`)
      fetchChatflows()
    } catch (error) {
      console.error('Error toggling public status:', error)
      toast.error('Failed to update chatflow visibility')
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchChatflows()
  }, [])

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open && form.formState.isDirty) {
      setShowUnsavedChanges(true)
    } else {
      setIsDialogOpen(false)
      form.reset()
    }
  }

  // Handle unsaved changes confirmation
  const handleUnsavedChanges = (confirm: boolean) => {
    setShowUnsavedChanges(false)
    if (confirm) {
      setIsDialogOpen(false)
      form.reset()
    }
  }

  return (
    <div className="container mx-auto py-6">
      <TooltipProvider>
        <Tabs defaultValue="chatflows" className="space-y-4" onValueChange={setSelectedTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="chatflows" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Chatflows
              </TabsTrigger>
            </TabsList>
            
            {selectedTab === 'chatflows' && (
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setSelectedChatflow(null)
                    form.reset()
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Chatflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <DialogDescription>
                        {selectedChatflow ? 'Loading chatflow...' : 'Creating chatflow...'}
                      </DialogDescription>
                    </div>
                  ) : (
                    <>
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
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="">No Category</SelectItem>
                                        <SelectItem value="assistant">Assistant</SelectItem>
                                        <SelectItem value="game">Game</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                        <SelectItem value="productivity">Productivity</SelectItem>
                                        <SelectItem value="utility">Utility</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Group similar chatflows together
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Separator className="my-4" />

                              <div className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="isPublic"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                      <div className="space-y-0.5">
                                        <FormLabel>Public Access</FormLabel>
                                        <FormDescription>
                                          Allow anyone to use this chatflow without authentication
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

                                <FormField
                                  control={form.control}
                                  name="deployed"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                      <div className="space-y-0.5">
                                        <FormLabel>Deployment Status</FormLabel>
                                        <FormDescription>
                                          Enable or disable this chatflow
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
                              </div>

                              <Separator className="my-4" />

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
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              {selectedChatflow ? 'Update' : 'Create'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsContent value="chatflows" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chatflows</CardTitle>
                    <CardDescription>
                      Manage your Flowise chatflows and configurations
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchChatflows}
                        disabled={isLoading}
                      >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh chatflows</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Memory</TableHead>
                        <TableHead>Configuration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading chatflows...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : chatflows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Bot className="w-8 h-8 text-muted-foreground" />
                              <span>No chatflows found</span>
                              <span className="text-sm text-muted-foreground">
                                Create your first chatflow to get started
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        chatflows.map((chatflow) => {
                          const config = JSON.parse(chatflow.chatbotConfig || '{}')
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
                                    Temp: {config.temperature || 0.4}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={config.memoryType === 'zep' ? 'default' : 'secondary'}>
                                    {config.memoryType === 'zep' ? 'Zep Memory' : 'No Memory'}
                                  </Badge>
                                  {config.memoryType === 'zep' && (
                                    <span className="text-sm text-muted-foreground">
                                      Window: {config.memoryWindow || 10}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      Max Iterations: {config.maxIterations || 'Default'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      Max Tokens: {config.maxTokens || 'Default'}
                                    </span>
                                  </div>
                                  {config.streaming && (
                                    <Badge variant="outline" className="w-fit">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Streaming
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={chatflow.deployed ? 'default' : 'secondary'}>
                                    {chatflow.deployed ? 'Deployed' : 'Draft'}
                                  </Badge>
                                  <Badge variant={chatflow.isPublic ? 'default' : 'outline'}>
                                    {chatflow.isPublic ? 'Public' : 'Private'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copyId(chatflow.id!)}
                                      disabled={isLoading}
                                    >
                                      <Link2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy chatflow ID</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => togglePublic(chatflow)}
                                      disabled={isLoading}
                                    >
                                      {chatflow.isPublic ? (
                                        <Users className="w-4 h-4" />
                                      ) : (
                                        <Lock className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {chatflow.isPublic ? 'Make private' : 'Make public'}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleDeploy(chatflow)}
                                      disabled={isLoading}
                                    >
                                      {chatflow.deployed ? (
                                        <X className="w-4 h-4" />
                                      ) : (
                                        <Sparkles className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {chatflow.deployed ? 'Undeploy chatflow' : 'Deploy chatflow'}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => editChatflow(chatflow)}
                                      disabled={isLoading}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit chatflow</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setChatflowToDelete(chatflow)}
                                      disabled={isLoading}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete chatflow</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!chatflowToDelete} onOpenChange={(open) => !open && setChatflowToDelete(null)}>
          <DialogContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <DialogDescription>
                  Deleting chatflow...
                </DialogDescription>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Delete Chatflow</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the chatflow "{chatflowToDelete?.name}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setChatflowToDelete(null)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Unsaved Changes Dialog */}
        <Dialog open={showUnsavedChanges} onOpenChange={(open) => !open && setShowUnsavedChanges(false)}>
          <DialogContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <DialogDescription>
                  Discarding changes...
                </DialogDescription>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Unsaved Changes</DialogTitle>
                  <DialogDescription>
                    You have unsaved changes. Are you sure you want to close? Your changes will be lost.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleUnsavedChanges(false)}
                    disabled={isLoading}
                  >
                    Keep Editing
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUnsavedChanges(true)}
                    disabled={isLoading}
                  >
                    Discard Changes
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  )
} 