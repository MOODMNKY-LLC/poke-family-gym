'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onRefresh}
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  )
} 