'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { LoadingCard } from './loading-card'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Star, Trophy, CheckCircle2, Zap, Medal } from 'lucide-react'
import type { ActivityEvent } from '@/types/dashboard'

interface ActivityFeedProps {
  initialEvents: ActivityEvent[]
  familyId: string
}

const eventIcons = {
  TASK_COMPLETE: CheckCircle2,
  POKEMON_CAUGHT: Star,
  ACHIEVEMENT_EARNED: Trophy,
  LEVEL_UP: Zap,
  BADGE_EARNED: Medal
} as const

export function ActivityFeed({ initialEvents, familyId }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Set up real-time subscription
    const channel = supabase
      .channel('activity_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          const newEvent = payload.new as ActivityEvent
          setEvents((current) => {
            const updated = [newEvent, ...current]
            return updated.slice(0, 50) // Keep max 50 events
          })
        }
      )
      .subscribe()

    setIsLoading(false)

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId])

  if (isLoading) {
    return <LoadingCard rows={5} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <AnimatePresence initial={false}>
              {events.map((event, index) => {
                const Icon = eventIcons[event.type]
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1, duration: 0.2 }}
                    className={cn(
                      "flex items-start gap-4 py-4",
                      index !== events.length - 1 && "border-b"
                    )}
                  >
                    <div className={cn(
                      "rounded-full p-2",
                      event.type === 'TASK_COMPLETE' && "bg-green-500/20 text-green-500",
                      event.type === 'POKEMON_CAUGHT' && "bg-yellow-500/20 text-yellow-500",
                      event.type === 'ACHIEVEMENT_EARNED' && "bg-purple-500/20 text-purple-500",
                      event.type === 'LEVEL_UP' && "bg-blue-500/20 text-blue-500",
                      event.type === 'BADGE_EARNED' && "bg-red-500/20 text-red-500"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        <span className="font-semibold">{event.memberName}</span>
                        {' '}
                        {event.type === 'TASK_COMPLETE' && 'completed a task'}
                        {event.type === 'POKEMON_CAUGHT' && 'caught a new Pokémon'}
                        {event.type === 'ACHIEVEMENT_EARNED' && 'earned an achievement'}
                        {event.type === 'LEVEL_UP' && 'leveled up'}
                        {event.type === 'BADGE_EARNED' && 'earned a badge'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.details.title}
                      </p>
                      {event.details.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.details.description}
                        </p>
                      )}
                      {event.details.pokemonFormId && event.details.pokemonNickname && (
                        <p className="text-sm font-medium text-muted-foreground">
                          Nickname: {event.details.pokemonNickname}
                        </p>
                      )}
                      {event.details.rewardAmount && (
                        <p className="text-sm font-medium text-muted-foreground">
                          Reward: {event.details.rewardAmount} PB
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
} 