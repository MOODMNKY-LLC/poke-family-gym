'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LoadingCard } from './loading-card'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Users, Trophy, Scroll, Target } from 'lucide-react'
import type { GymStats as GymStatsType } from '@/types/dashboard'

interface GymStatsProps {
  stats: GymStatsType
}

const statCards = [
  {
    title: 'Total Members',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    getValue: (stats: GymStatsType) => stats.totalMembers.toString(),
    getSubtext: (stats: GymStatsType) => {
      const roles = Object.entries(stats.membersByRole)
        .map(([role, count]) => `${count} ${role}${count === 1 ? '' : 's'}`)
      return roles.join(', ')
    }
  },
  {
    title: 'Gym Rank',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    getValue: (stats: GymStatsType) => stats.gymRank,
    getSubtext: (stats: GymStatsType) => `${stats.totalPokeballs} total Pokéballs`
  },
  {
    title: 'Active Quests',
    icon: Scroll,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    getValue: (stats: GymStatsType) => stats.activeQuests.toString(),
    getSubtext: (stats: GymStatsType) => `${stats.completedTasks} tasks completed`
  },
  {
    title: 'Weekly Progress',
    icon: Target,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    getValue: (stats: GymStatsType) => `${stats.weeklyProgress}%`,
    getSubtext: (stats: GymStatsType) => 'Towards weekly goal'
  }
] as const

export function GymStats({ stats }: GymStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {card.getValue(stats)}
                    </p>
                  </div>
                  <div className={cn("rounded-full p-3", card.bgColor)}>
                    <Icon className={cn("h-5 w-5", card.color)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {card.getSubtext(stats)}
                  </p>
                  {card.title === 'Weekly Progress' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <Progress value={stats.weeklyProgress} className="h-2" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
} 