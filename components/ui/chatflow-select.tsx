import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { ChatFlowsAPI, type ChatFlow, type ChatFlowAssignment } from '@/lib/supabase/chatflows'
import { cn } from '@/lib/utils'

interface ChatFlowSelectProps {
  memberId: string
  currentChatflowId?: string | null
  onAssign?: (assignment: ChatFlowAssignment) => void
  onRemove?: () => void
  className?: string
  disabled?: boolean
}

export function ChatFlowSelect({
  memberId,
  currentChatflowId,
  onAssign,
  onRemove,
  className,
  disabled = false
}: ChatFlowSelectProps) {
  const [chatflows, setChatflows] = useState<ChatFlow[]>([])
  const [selectedChatflowId, setSelectedChatflowId] = useState<string | null>(currentChatflowId || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available chatflows on mount
  useEffect(() => {
    async function fetchChatflows() {
      try {
        const flows = await ChatFlowsAPI.getChatFlows()
        setChatflows(flows)
      } catch (err) {
        console.error('Error fetching chatflows:', err)
        setError('Failed to load chatflows')
        toast.error('Failed to load chatflows')
      }
    }

    fetchChatflows()
  }, [])

  // Update selected value when currentChatflowId prop changes
  useEffect(() => {
    setSelectedChatflowId(currentChatflowId || null)
  }, [currentChatflowId])

  const handleAssign = async () => {
    if (!selectedChatflowId) return

    setIsLoading(true)
    setError(null)

    try {
      const assignment = await ChatFlowsAPI.assignChatFlow({
        memberId,
        chatflowId: selectedChatflowId
      })

      toast.success('Chatflow assigned successfully')
      onAssign?.(assignment)
    } catch (err) {
      console.error('Error assigning chatflow:', err)
      setError('Failed to assign chatflow')
      toast.error('Failed to assign chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentChatflowId) return

    setIsLoading(true)
    setError(null)

    try {
      await ChatFlowsAPI.removeChatFlow(memberId, currentChatflowId)
      setSelectedChatflowId(null)
      toast.success('Chatflow removed successfully')
      onRemove?.()
    } catch (err) {
      console.error('Error removing chatflow:', err)
      setError('Failed to remove chatflow')
      toast.error('Failed to remove chatflow')
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = selectedChatflowId !== currentChatflowId

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={selectedChatflowId || undefined}
        onValueChange={setSelectedChatflowId}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a chatflow" />
        </SelectTrigger>
        <SelectContent>
          {chatflows.map((chatflow) => (
            <SelectItem key={chatflow.id} value={chatflow.id}>
              {chatflow.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleAssign}
        disabled={!hasChanges || disabled || isLoading}
        className={cn(
          "transition-colors",
          hasChanges ? "text-blue-500" : "text-muted-foreground"
        )}
      >
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        <span className="sr-only">
          {isLoading ? 'Assigning...' : 'Assign chatflow'}
        </span>
      </Button>

      {currentChatflowId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={disabled || isLoading}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove chatflow</span>
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
} 