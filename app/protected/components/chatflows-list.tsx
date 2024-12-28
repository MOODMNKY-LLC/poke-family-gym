'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FlowiseAPI } from '@/lib/flowise/api'
import type { ChatFlow } from '@/lib/flowise/types'
import {
  Bot,
  Copy,
  Edit,
  Trash,
  Globe,
  Lock,
  Check,
  X,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  Columns,
  Mic,
  MessagesSquare,
  CheckCircle2,
  XCircle,
  MicOff
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ChatflowsListProps {
  onSelect?: (chatflow: ChatFlow | null) => void
}

type ViewMode = 'table' | 'gallery' | 'kanban'

interface KanbanColumn {
  id: string
  title: string
  description: string
  filter: (chatflow: ChatFlow) => boolean
}

const getDeploymentInfo = (isDeployed: boolean) => ({
  label: isDeployed ? 'Deployed' : 'Disabled',
  description: isDeployed 
    ? 'Active and processing conversations'
    : 'Inactive - not processing conversations',
  variant: isDeployed ? 'default' : 'secondary'
} as const)

const getAccessInfo = (isPublic: boolean) => ({
  label: isPublic ? 'Public' : 'Private',
  description: isPublic 
    ? 'Accessible without authentication'
    : 'Requires authentication to access',
  variant: isPublic ? 'default' : 'secondary'
} as const)

const kanbanColumns: KanbanColumn[] = [
  {
    id: 'deployed-public',
    title: 'Active & Public',
    description: 'Processing conversations, accessible without auth',
    filter: (chatflow) => chatflow.deployed && chatflow.isPublic
  },
  {
    id: 'deployed-private',
    title: 'Active & Private',
    description: 'Processing conversations, requires authentication',
    filter: (chatflow) => chatflow.deployed && !chatflow.isPublic
  },
  {
    id: 'disabled-public',
    title: 'Inactive & Public',
    description: 'Not processing conversations, would be public if activated',
    filter: (chatflow) => !chatflow.deployed && chatflow.isPublic
  },
  {
    id: 'disabled-private',
    title: 'Inactive & Private',
    description: 'Not processing conversations, would require auth if activated',
    filter: (chatflow) => !chatflow.deployed && !chatflow.isPublic
  }
]

export function ChatflowsList({ onSelect }: ChatflowsListProps) {
  const [chatflows, setChatflows] = useState<ChatFlow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChatflow, setSelectedChatflow] = useState<ChatFlow | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updatingStates, setUpdatingStates] = useState<{ [key: string]: boolean }>({})
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Fetch chatflows
  const fetchChatflows = async () => {
    setIsLoading(true)
    try {
      const response = await FlowiseAPI.getChatFlows()
      const validChatflows = (response.chatflows || [])
        .filter((cf): cf is ChatFlow => Boolean(cf?.id))
        .map(cf => ({
          id: cf.id || '',
          name: cf.name || '',
          flowData: cf.flowData || '',
          deployed: cf.deployed ?? false,
          isPublic: cf.isPublic ?? false,
          chatbotConfig: cf.chatbotConfig || null,
          type: cf.type || 'chat',
          apikeyid: cf.apikeyid || null,
          apiConfig: cf.apiConfig || null,
          analytic: cf.analytic || null,
          speechToText: cf.speechToText || null,
          followUpPrompts: cf.followUpPrompts || null,
          category: cf.category || null,
          createdDate: cf.createdDate || new Date().toISOString(),
          updatedDate: cf.updatedDate || new Date().toISOString()
        } as ChatFlow))
      setChatflows(validChatflows)
    } catch (error) {
      console.error('Error fetching chatflows:', error)
      toast.error('Failed to fetch chatflows')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy chatflow ID
  const copyId = (id: string | undefined) => {
    if (!id) return
    navigator.clipboard.writeText(id)
    toast.success('Chatflow ID copied to clipboard')
  }

  // Toggle public/private status
  const togglePublic = async (chatflow: ChatFlow) => {
    if (!chatflow.id) return
    
    setUpdatingStates(prev => ({ ...prev, [`public-${chatflow.id}`]: true }))
    try {
      await FlowiseAPI.updateChatflow(chatflow.id, {
        ...chatflow,
        isPublic: !chatflow.isPublic
      })
      toast.success(`Chatflow is now ${chatflow.isPublic ? 'private' : 'public'}`)
      fetchChatflows()
    } catch (error) {
      console.error('Error toggling public status:', error)
      toast.error('Failed to update chatflow visibility')
    } finally {
      setUpdatingStates(prev => ({ ...prev, [`public-${chatflow.id}`]: false }))
    }
  }

  // Toggle deployed status
  const toggleDeployed = async (chatflow: ChatFlow) => {
    if (!chatflow.id) return
    
    setUpdatingStates(prev => ({ ...prev, [`deployed-${chatflow.id}`]: true }))
    try {
      await FlowiseAPI.updateChatflow(chatflow.id, {
        ...chatflow,
        deployed: !chatflow.deployed
      })
      toast.success(`Chatflow is now ${chatflow.deployed ? 'disabled' : 'deployed'}`)
      fetchChatflows()
    } catch (error) {
      console.error('Error toggling deployed status:', error)
      toast.error('Failed to update chatflow deployment')
    } finally {
      setUpdatingStates(prev => ({ ...prev, [`deployed-${chatflow.id}`]: false }))
    }
  }

  // Delete chatflow
  const deleteChatflow = async (chatflow: ChatFlow) => {
    if (!chatflow.id) return
    try {
      setIsLoading(true)
      await FlowiseAPI.deleteChatflow(chatflow.id)
      toast.success('Chatflow deleted')
      fetchChatflows()
      setShowDeleteConfirm(false)
      setSelectedChatflow(null)
    } catch (error) {
      console.error('Error deleting chatflow:', error)
      toast.error('Failed to delete chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  // Get system message from flowData
  const getSystemMessage = (flowData: string): string => {
    try {
      const data = JSON.parse(flowData)
      const toolAgentNode = data.nodes?.find((node: any) => 
        node.data?.name === 'toolAgent' || node.type === 'customNode'
      )
      return toolAgentNode?.data?.inputs?.systemMessage || 'No system message found'
    } catch {
      return 'Unable to parse system message'
    }
  }

  // Format date with fallback
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  // Load initial data
  useEffect(() => {
    fetchChatflows()
  }, [])

  // Add helper function to parse flowData
  const parseFlowData = (flowData: string) => {
    try {
      const data = JSON.parse(flowData)
      return {
        nodeCount: data.nodes?.length || 0,
        edges: data.edges?.length || 0,
        hasMemory: data.nodes?.some((node: any) => node.data?.name === 'ZepMemory'),
        hasOpenAI: data.nodes?.some((node: any) => node.data?.name === 'chatOpenAI'),
        hasToolAgent: data.nodes?.some((node: any) => node.data?.name === 'toolAgent'),
      }
    } catch {
      return {
        nodeCount: 0,
        edges: 0,
        hasMemory: false,
        hasOpenAI: false,
        hasToolAgent: false,
      }
    }
  }

  // Filter chatflows based on search query
  const filteredChatflows = chatflows.filter(chatflow => {
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    const nameLower = chatflow.name.toLowerCase()
    const systemPrompt = getSystemMessage(chatflow.flowData).toLowerCase()
    const category = (chatflow.category || '').toLowerCase()
    
    return nameLower.includes(searchLower) || 
           systemPrompt.includes(searchLower) ||
           category.includes(searchLower)
  })

  const renderTableView = (chatflows: ChatFlow[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Access</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>TTS</TableHead>
          <TableHead>Flow Info</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chatflows.map((chatflow) => (
          <TableRow key={chatflow.id}>
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">{chatflow.name}</span>
                      {chatflow.category && (
                        <Badge variant="outline" className="ml-2">
                          {chatflow.category}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="w-[300px] p-0">
                    <div className="p-2 bg-muted/50 rounded-t-lg">
                      <p className="text-sm font-medium">System Prompt</p>
                    </div>
                    <div 
                      className="relative h-[120px] overflow-hidden group"
                      onMouseEnter={(e) => {
                        // Pause the animation on hover
                        const target = e.currentTarget.querySelector('.scroll-content') as HTMLElement
                        if (target) target.style.animationPlayState = 'paused'
                      }}
                      onMouseLeave={(e) => {
                        // Resume the animation
                        const target = e.currentTarget.querySelector('.scroll-content') as HTMLElement
                        if (target) target.style.animationPlayState = 'running'
                      }}
                    >
                      <div 
                        className="scroll-content absolute inset-0 p-3 text-sm text-muted-foreground whitespace-pre-wrap
                        overflow-y-auto hover:overflow-y-auto
                        [&::-webkit-scrollbar]:w-2
                        [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10
                        hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
                        [&::-webkit-scrollbar-track]:bg-transparent
                        animate-slow-scroll hover:animate-none
                        "
                        style={{
                          maskImage: 'linear-gradient(to bottom, transparent, black 10px, black 90%, transparent)',
                          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10px, black 90%, transparent)'
                        }}
                      >
                        {getSystemMessage(chatflow.flowData)}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      {chatflow.deployed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {getDeploymentInfo(chatflow.deployed).label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>{getDeploymentInfo(chatflow.deployed).description}</p>
                      <p className="text-xs text-muted-foreground">Click to toggle status</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      {chatflow.isPublic ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {getAccessInfo(chatflow.isPublic).label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>{getAccessInfo(chatflow.isPublic).description}</p>
                      <p className="text-xs text-muted-foreground">Click to toggle access</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>

            <TableCell>
              <Badge variant="secondary">
                {chatflow.type || 'chat'}
              </Badge>
            </TableCell>

            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      {!!chatflow.speechToText ? (
                        <Mic className="h-4 w-4 text-green-500" />
                      ) : (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {!!chatflow.speechToText ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Text-to-speech is {!!chatflow.speechToText ? 'enabled' : 'disabled'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>

            <TableCell>
              {(() => {
                const flow = parseFlowData(chatflow.flowData)
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {flow.nodeCount} nodes
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {flow.nodeCount} nodes
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {flow.edges} edges
                            </Badge>
                          </div>
                          <div className="space-y-1 mt-2">
                            <p className="flex items-center gap-2">
                              <Check className={`h-3 w-3 ${flow.hasMemory ? 'text-green-500' : 'text-muted-foreground'}`} />
                              Memory Integration
                            </p>
                            <p className="flex items-center gap-2">
                              <Check className={`h-3 w-3 ${flow.hasOpenAI ? 'text-green-500' : 'text-muted-foreground'}`} />
                              OpenAI Integration
                            </p>
                            <p className="flex items-center gap-2">
                              <Check className={`h-3 w-3 ${flow.hasToolAgent ? 'text-green-500' : 'text-muted-foreground'}`} />
                              Tool Agent
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })()}
            </TableCell>

            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <time className="text-sm text-muted-foreground">
                      {formatDate(chatflow.createdDate)}
                    </time>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Created: {new Date(chatflow.createdDate || '').toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>

            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <time className="text-sm text-muted-foreground">
                      {formatDate(chatflow.updatedDate)}
                    </time>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last Updated: {new Date(chatflow.updatedDate || '').toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onSelect?.(chatflow)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Update
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setSelectedChatflow(chatflow)
                    setShowDeleteConfirm(true)
                  }}
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderGalleryView = (chatflows: ChatFlow[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chatflows.map((chatflow) => (
        <Card key={chatflow.id} className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-medium">{chatflow.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setSelectedChatflow(chatflow)
                    setShowDeleteConfirm(true)
                  }}
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={getDeploymentInfo(chatflow.deployed).variant}>
                      {getDeploymentInfo(chatflow.deployed).label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getDeploymentInfo(chatflow.deployed).description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={getAccessInfo(chatflow.isPublic).variant}>
                      {getAccessInfo(chatflow.isPublic).label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getAccessInfo(chatflow.isPublic).description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {chatflow.category && (
                <Badge variant="outline">
                  {chatflow.category}
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">System Prompt</label>
              <div className="relative h-[120px] group">
                <div 
                  className="absolute inset-0 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg overflow-y-auto 
                  [&::-webkit-scrollbar]:w-1.5
                  [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10
                  hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
                  [&::-webkit-scrollbar-track]:bg-transparent
                  transition-colors"
                >
                  {getSystemMessage(chatflow.flowData)}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Created</label>
                <span>{formatDate(chatflow.createdDate)}</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Updated</label>
                <span>{formatDate(chatflow.updatedDate)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                <span className="text-sm">Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {chatflow.deployed ? 'Deployed' : 'Disabled'}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                          onClick={() => toggleDeployed(chatflow)}
                        >
                          {chatflow.deployed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {getDeploymentInfo(chatflow.deployed).label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p>{getDeploymentInfo(chatflow.deployed).description}</p>
                          <p className="text-xs text-muted-foreground">Click to toggle status</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                <span className="text-sm">Access</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {chatflow.isPublic ? 'Public' : 'Private'}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                          onClick={() => togglePublic(chatflow)}
                        >
                          {chatflow.isPublic ? (
                            <Globe className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {getAccessInfo(chatflow.isPublic).label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p>{getAccessInfo(chatflow.isPublic).description}</p>
                          <p className="text-xs text-muted-foreground">Click to toggle access</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => onSelect?.(chatflow)}
              className="w-full gap-2"
            >
              <Edit className="h-4 w-4" />
              Update Configuration
            </Button>
          </div>

          {selectedChatflow?.id === chatflow.id && showDeleteConfirm && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm mb-4">
                Are you sure you want to delete this chatflow?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setSelectedChatflow(null)
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteChatflow(chatflow)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )

  const renderKanbanView = (chatflows: ChatFlow[]) => (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-12rem)] overflow-hidden">
      {kanbanColumns.map((column) => (
        <div key={column.id} className="flex flex-col h-full">
          <div className="flex items-center justify-between p-2 bg-muted rounded-t-lg">
            <div>
              <h4 className="text-sm font-medium">{column.title}</h4>
              <p className="text-xs text-muted-foreground">{column.description}</p>
            </div>
            <Badge variant="secondary">
              {chatflows.filter(column.filter).length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-muted/50 rounded-b-lg">
            {chatflows.filter(column.filter).map((chatflow) => (
              <Card key={chatflow.id} className="p-3">
                <div className="space-y-3">
                  {/* Chatflow header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium truncate">{chatflow.name}</span>
                    </div>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSelect?.(chatflow)}
                      title="Update Configuration"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* System prompt preview */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative h-[60px] group">
                          <div 
                            className="absolute inset-0 text-xs text-muted-foreground line-clamp-3 cursor-help
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-thumb]:bg-muted-foreground/10
                            hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20
                            [&::-webkit-scrollbar-track]:bg-transparent"
                          >
                            {getSystemMessage(chatflow.flowData)}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs whitespace-pre-wrap">
                          {getSystemMessage(chatflow.flowData)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Quick actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                              onClick={() => toggleDeployed(chatflow)}
                            >
                              {chatflow.deployed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                {getDeploymentInfo(chatflow.deployed).label}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p>{getDeploymentInfo(chatflow.deployed).description}</p>
                              <p className="text-xs text-muted-foreground">Click to toggle status</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedChatflow(chatflow)
                        setShowDeleteConfirm(true)
                      }}
                      title="Delete"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Chatflow Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage and monitor your AI chatflows, their configurations, and deployment status
            </p>
          </div>
          <Button onClick={fetchChatflows} variant="outline" size="sm">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, system prompt, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <p className="absolute -bottom-5 left-2 text-xs text-muted-foreground">
                Found {filteredChatflows.length} of {chatflows.length} chatflows
              </p>
            )}
          </div>
          
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('gallery')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Gallery
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-2"
            >
              <Columns className="h-4 w-4" />
              Kanban
            </Button>
          </div>
        </div>
      </div>

      {filteredChatflows.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          {searchQuery ? (
            <>
              <p>No chatflows found matching "{searchQuery}"</p>
              <p className="text-sm mt-1">Try adjusting your search terms or checking for typos</p>
            </>
          ) : (
            <>
              <p>No chatflows found</p>
              <p className="text-sm mt-1">Create your first chatflow to get started</p>
            </>
          )}
        </Card>
      ) : (
        viewMode === 'table' ? renderTableView(filteredChatflows) : 
        viewMode === 'gallery' ? renderGalleryView(filteredChatflows) : 
        renderKanbanView(filteredChatflows)
      )}
    </div>
  )
} 