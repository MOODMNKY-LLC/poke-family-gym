"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Link2, Link2Off, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatFlow } from '@/lib/flowise/types'
import { FlowiseAPI } from '@/lib/flowise/api'
import { Button } from '@/components/ui/button'
import { updateChatflowAssignments } from './actions'

interface FamilyMember {
  id: string
  display_name: string
  chatflow_id: string | null
  avatar_url: string | null
  chat_flow?: ChatFlow | null
}

interface AssignmentChanges {
  [memberId: string]: string | null
}

export function ChatflowAssignments() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [chatflows, setChatflows] = useState<ChatFlow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedChatflow, setSelectedChatflow] = useState<ChatFlow | null>(null)
  const [pendingAssignments, setPendingAssignments] = useState<AssignmentChanges>({})
  const supabase = createClient()

  // Fetch family members and chatflows
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch family members with their assigned chatflows from Supabase
        const { data: membersData, error: membersError } = await supabase
          .from('family_members')
          .select(`
            id,
            display_name,
            chatflow_id,
            avatar_url
          `)

        if (membersError) throw membersError

        // Fetch all available chatflows using FlowiseAPI
        const { chatflows } = await FlowiseAPI.getChatFlows()
        
        // For each member, fetch their assigned chatflow details
        const membersWithChatflows = await Promise.all(
          (membersData || []).map(async (member) => {
            if (member.chatflow_id) {
              try {
                const chatflow = await FlowiseAPI.getChatFlow(member.chatflow_id)
                return { ...member, chat_flow: chatflow }
              } catch (e) {
                console.error(`Error fetching chatflow for member ${member.id}:`, e)
                return member
              }
            }
            return member
          })
        )

        setMembers(membersWithChatflows)
        setChatflows(chatflows)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load assignments')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle assignment change
  function handleAssignmentChange(memberId: string, chatflowId: string | null) {
    setPendingAssignments(prev => ({
      ...prev,
      [memberId]: chatflowId
    }))
  }

  // Submit all pending assignments
  async function handleSubmitAssignments() {
    if (Object.keys(pendingAssignments).length === 0) {
      toast.info('No changes to save')
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare the assignments for batch update
      const updates = Object.entries(pendingAssignments).map(([memberId, chatflowId]) => ({
        id: memberId,
        chatflow_id: chatflowId,
        updated_at: new Date().toISOString()
      }))

      // Submit the batch update using server action
      const { data, error } = await updateChatflowAssignments(updates)

      if (error) {
        throw new Error(error)
      }

      // Update local state with new assignments
      const updatedMembers = await Promise.all(
        members.map(async (member) => {
          const newChatflowId = pendingAssignments[member.id]
          if (newChatflowId !== undefined) {
            try {
              const chatflow = newChatflowId 
                ? await FlowiseAPI.getChatFlow(newChatflowId)
                : null
              return {
                ...member,
                chatflow_id: newChatflowId,
                chat_flow: chatflow
              }
            } catch (e) {
              console.error(`Error fetching updated chatflow for member ${member.id}:`, e)
              return member
            }
          }
          return member
        })
      )

      setMembers(updatedMembers)
      setPendingAssignments({})
      toast.success('Assignments updated successfully')
    } catch (error) {
      console.error('Error submitting assignments:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update assignments')
    } finally {
      setIsSubmitting(false)
    }
  }

  function getSystemMessage(chatflow: ChatFlow): string {
    try {
      if (chatflow.flowData) {
        const flowData = JSON.parse(chatflow.flowData)
        const toolAgentNode = flowData.nodes?.find((node: any) => 
          node.data?.name === 'toolAgent' || node.type === 'customNode'
        )
        return toolAgentNode?.data?.inputs?.systemMessage || ''
      }
    } catch (e) {
      console.error('Error parsing flowData:', e)
    }
    return ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const hasChanges = Object.keys(pendingAssignments).length > 0

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Chatflow Assignments</h3>
            <p className="text-sm text-muted-foreground">
              Assign chatflows to family members to customize their AI experience
            </p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPendingAssignments({})}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignments}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Available Chatflows */}
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-2">Available Chatflows</h4>
            <div className="grid grid-cols-2 gap-4 h-[400px]">
              {/* Chatflow List */}
              <ScrollArea className="pr-4 border-r">
                <div className="space-y-2">
                  {chatflows.map((chatflow) => (
                    <div
                      key={chatflow.id}
                      className={`flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 group cursor-pointer ${
                        selectedChatflow?.id === chatflow.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChatflow(chatflow)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{chatflow.name}</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-muted-foreground font-mono">
                            {chatflow.id}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(chatflow.id || '')
                              toast.success('Chatflow ID copied to clipboard')
                            }}
                          >
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy ID</span>
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={chatflow.deployed ? "default" : "secondary"}>
                            {chatflow.deployed ? "Deployed" : "Draft"}
                          </Badge>
                          <Badge variant={chatflow.isPublic ? "default" : "secondary"}>
                            {chatflow.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* System Prompt Viewer */}
              <div className="relative">
                <div className="absolute inset-0 flex flex-col">
                  <h4 className="text-sm font-medium mb-2 px-2">System Prompt</h4>
                  {selectedChatflow ? (
                    <div className="flex-1 overflow-hidden relative">
                      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent z-10" />
                      <div className="h-full px-2">
                        <div className="h-full overflow-y-auto hover:overflow-y-scroll">
                          <div className="animate-slow-scroll hover:animate-none hover:transform-none">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {getSystemMessage(selectedChatflow) || "No system message available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                      Select a chatflow to view its system prompt
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Member Assignments */}
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-2">Member Assignments</h4>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {members.map((member) => {
                  const pendingChatflowId = pendingAssignments[member.id]
                  const isChanged = pendingChatflowId !== undefined
                  const currentChatflowId = isChanged ? pendingChatflowId : member.chatflow_id

                  return (
                    <div 
                      key={member.id} 
                      className={`flex items-center justify-between p-2 border rounded-lg ${
                        isChanged ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.display_name}</span>
                        {member.chat_flow && (
                          <Badge variant="outline" className="ml-2">
                            {member.chat_flow.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={currentChatflowId ?? 'null'}
                          onValueChange={(value) => handleAssignmentChange(
                            member.id,
                            value === 'null' ? null : value
                          )}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a chatflow" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">
                              <div className="flex items-center gap-2">
                                <Link2Off className="h-4 w-4" />
                                <span>None</span>
                              </div>
                            </SelectItem>
                            {chatflows.map((chatflow) => (
                              <SelectItem key={chatflow.id} value={chatflow.id ?? ''}>
                                <div className="flex items-center gap-2">
                                  <Link2 className="h-4 w-4" />
                                  <span>{chatflow.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isChanged && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const { [member.id]: _, ...rest } = pendingAssignments
                              setPendingAssignments(rest)
                            }}
                            disabled={isSubmitting}
                          >
                            <Link2Off className="h-4 w-4" />
                            <span className="sr-only">Reset</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </Card>
  )
} 