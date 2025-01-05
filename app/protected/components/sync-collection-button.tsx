'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { syncMemberCollection } from '@/app/lib/collection-sync'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface SyncCollectionButtonProps {
  memberId: string
}

export function SyncCollectionButton({ memberId }: SyncCollectionButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const supabase = createClient()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      console.log('Starting collection sync for member:', memberId)
      const result = await syncMemberCollection(memberId, supabase)
      
      console.log('Sync completed:', result)

      if (result.errors.length > 0) {
        console.error('Sync errors:', result.errors)
        toast.error('Failed to sync collection', {
          description: result.errors[0]
        })
      } else {
        const message = []
        if (result.added > 0) message.push(`${result.added} Pokémon added`)
        if (result.dexAdded > 0) message.push(`${result.dexAdded} Pokédex entries added`)
        
        if (message.length > 0) {
          toast.success('Collection synced!', {
            description: message.join(', ')
          })
        } else {
          toast.info('Collection is up to date')
        }
      }
    } catch (error) {
      console.error('Error syncing collection:', error)
      toast.error('Failed to sync collection', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9"
      disabled={isSyncing}
      onClick={handleSync}
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
    </Button>
  )
} 