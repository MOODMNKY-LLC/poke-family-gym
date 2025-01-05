'use client'

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { syncCollection } from "@/app/protected/actions/sync-collection"

interface SyncCollectionButtonProps {
  memberId: string
}

export function SyncCollectionButton({ memberId }: SyncCollectionButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const result = await syncCollection(memberId)

      if (result.error) {
        toast.error('Failed to sync collection', {
          description: result.error
        })
      } else {
        toast.success('Collection synced', {
          description: result.message
        })
      }
    } catch (error) {
      toast.error('Failed to sync collection')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Collection'}
    </Button>
  )
} 