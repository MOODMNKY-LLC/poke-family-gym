'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RefreshButton() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={async () => {
        setIsRefreshing(true)
        router.refresh()
        // Add a small delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsRefreshing(false)
      }}
      disabled={isRefreshing}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  )
} 