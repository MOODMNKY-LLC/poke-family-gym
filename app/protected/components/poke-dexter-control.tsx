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
  Bot
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

// Form schema for chatflow
const chatflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  flowData: z.string().min(1, 'Flow data is required'),
  deployed: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  apiKey: z.string().optional(),
  chatbotConfig: z.string().optional(),
  category: z.string().optional(),
  speechToText: z.string().optional(),
  type: z.string().optional(),
  followUpPrompts: z.string().optional(),
  vectorStoreConfig: z.string().optional(),
  embeddingConfig: z.string().optional(),
  recordManagerConfig: z.string().optional(),
  createdDate: z.string().optional(),
  updatedDate: z.string().optional(),
})

type ChatFlow = z.infer<typeof chatflowSchema>

interface FamilyMember {
  id: string
  display_name: string
  chatflow_id?: string
}

interface ChatMessage {
  id: string
  role: string
  content: string
  chatflowid: string
  createdDate: string
  chatId: string
  rating?: string
}

interface DocumentStore {
  id: string
  name: string
  description: string
  status: string
  vectorStoreConfig: string
  embeddingConfig: string
}

export function PokeDexterControl() {
  const { theme } = useTheme()
  const [chatflows, setChatflows] = useState<ChatFlow[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [documentStores, setDocumentStores] = useState<DocumentStore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedChatflow, setSelectedChatflow] = useState<ChatFlow | null>(null)
  const [selectedTab, setSelectedTab] = useState('chatflows')
  const [analyticsRange, setAnalyticsRange] = useState('7d')
  const [analyticsData, setAnalyticsData] = useState<any[]>([])

  const form = useForm<ChatFlow>({
    resolver: zodResolver(chatflowSchema),
    defaultValues: {
      deployed: false,
      isPublic: false,
    },
  })

  // Fetch chatflows
  async function fetchChatflows() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chat_flow')
        .select('*')
        .order('createdDate', { ascending: false })

      if (error) throw error
      setChatflows(data || [])
    } catch (error) {
      console.error('Error fetching chatflows:', error)
      toast.error('Failed to fetch chatflows')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch family members
  async function fetchFamilyMembers() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('family_members')
        .select('id, display_name, chatflow_id')
        .order('display_name')

      if (error) throw error
      setFamilyMembers(data || [])
    } catch (error) {
      console.error('Error fetching family members:', error)
      toast.error('Failed to fetch family members')
    }
  }

  // Fetch chat messages for analytics
  async function fetchChatMessages() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chat_message')
        .select('*')
        .order('createdDate', { ascending: false })
        .limit(1000)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch messages')
    }
  }

  // Fetch document stores
  async function fetchDocumentStores() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_store')
        .select('*')
        .order('createdDate', { ascending: false })

      if (error) throw error
      setDocumentStores(data || [])
    } catch (error) {
      console.error('Error fetching document stores:', error)
      toast.error('Failed to fetch document stores')
    }
  }

  useEffect(() => {
    fetchChatflows()
    fetchFamilyMembers()
    fetchChatMessages()
    fetchDocumentStores()
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

  // Handle form submission
  async function onSubmit(data: ChatFlow) {
    try {
      const supabase = createClient()
      
      if (selectedChatflow?.id) {
        // Update existing chatflow
        const { error } = await supabase
          .from('chat_flow')
          .update({
            name: data.name,
            flowData: data.flowData,
            deployed: data.deployed,
            isPublic: data.isPublic,
            apiKey: data.apiKey,
            chatbotConfig: data.chatbotConfig,
            category: data.category,
            speechToText: data.speechToText,
            type: data.type,
            followUpPrompts: data.followUpPrompts,
            vectorStoreConfig: data.vectorStoreConfig,
            embeddingConfig: data.embeddingConfig,
            recordManagerConfig: data.recordManagerConfig,
          })
          .eq('id', selectedChatflow.id)

        if (error) throw error
        toast.success('Chatflow updated successfully')
      } else {
        // Create new chatflow
        const { error } = await supabase
          .from('chat_flow')
          .insert([{
            name: data.name,
            flowData: data.flowData,
            deployed: data.deployed,
            isPublic: data.isPublic,
            apiKey: data.apiKey,
            chatbotConfig: data.chatbotConfig,
            category: data.category,
            speechToText: data.speechToText,
            type: data.type,
            followUpPrompts: data.followUpPrompts,
            vectorStoreConfig: data.vectorStoreConfig,
            embeddingConfig: data.embeddingConfig,
            recordManagerConfig: data.recordManagerConfig,
          }])

        if (error) throw error
        toast.success('Chatflow created successfully')
      }

      setIsDialogOpen(false)
      fetchChatflows()
      form.reset()
    } catch (error) {
      console.error('Error saving chatflow:', error)
      toast.error('Failed to save chatflow')
    }
  }

  // Delete chatflow
  async function deleteChatflow(id: string) {
    if (!confirm('Are you sure you want to delete this chatflow?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('chat_flow')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Chatflow deleted successfully')
      fetchChatflows()
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      toast.error('Failed to delete chatflow')
    }
  }

  // Assign chatflow to family member
  async function assignChatflow(memberId: string, chatflowId: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('family_members')
        .update({ chatflow_id: chatflowId })
        .eq('id', memberId)

      if (error) throw error
      toast.success('Chatflow assigned successfully')
      fetchFamilyMembers()
    } catch (error) {
      console.error('Error assigning chatflow:', error)
      toast.error('Failed to assign chatflow')
    }
  }

  // Edit chatflow
  function editChatflow(chatflow: ChatFlow) {
    setSelectedChatflow(chatflow)
    form.reset({
      ...chatflow,
      flowData: chatflow.flowData || '',
      chatbotConfig: chatflow.chatbotConfig || '',
      vectorStoreConfig: chatflow.vectorStoreConfig || '',
      embeddingConfig: chatflow.embeddingConfig || '',
      recordManagerConfig: chatflow.recordManagerConfig || '',
    })
    setIsDialogOpen(true)
  }

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
              <Database className="w-4 h-4" />
              Document Store
            </TabsTrigger>
          </TabsList>
          
          {selectedTab === 'chatflows' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedChatflow(null)
                  form.reset({
                    deployed: false,
                    isPublic: false,
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
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="flowData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flow Data</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={5} />
                          </FormControl>
                          <FormDescription>
                            JSON configuration for the chatflow
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="chat">Chat</SelectItem>
                              <SelectItem value="task">Task</SelectItem>
                              <SelectItem value="assistant">Assistant</SelectItem>
                              <SelectItem value="document">Document QA</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deployed"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Deployed</FormLabel>
                              <FormDescription>
                                Make this chatflow active
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
                        name="isPublic"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Public</FormLabel>
                              <FormDescription>
                                Allow public access
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
                    <FormField
                      control={form.control}
                      name="vectorStoreConfig"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vector Store Configuration</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormDescription>
                            Configure vector store settings for document retrieval
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="embeddingConfig"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Embedding Configuration</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormDescription>
                            Configure embedding model settings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatflows.map((chatflow) => (
                      <TableRow key={chatflow.id}>
                        <TableCell className="font-medium">{chatflow.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {chatflow.type || 'Chat'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={chatflow.deployed ? 'default' : 'secondary'}>
                            {chatflow.deployed ? 'Deployed' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={chatflow.isPublic ? 'default' : 'secondary'}>
                            {chatflow.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {chatflow.createdDate ? new Date(chatflow.createdDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editChatflow(chatflow)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteChatflow(chatflow.id!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                Assign chatflows to family members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Current Chatflow</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.display_name}
                        </TableCell>
                        <TableCell>
                          {chatflows.find(cf => cf.id === member.chatflow_id)?.name || 'None'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.chatflow_id}
                            onValueChange={(value) => assignChatflow(member.id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select a chatflow" />
                            </SelectTrigger>
                            <SelectContent>
                              {chatflows.map((chatflow) => (
                                <SelectItem key={chatflow.id} value={chatflow.id!}>
                                  {chatflow.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {familyMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          No family members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
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
                  onValueChange={setAnalyticsRange}
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