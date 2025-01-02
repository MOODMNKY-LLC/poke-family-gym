'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Star, Clock, Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TaskStreak {
  id: string
  member_id: string
  family_id: string
  current_streak: number
  longest_streak: number
  last_completed_at: string
  created_at: string
  updated_at: string
  member: {
    display_name: string
    avatar_url: string | null
  }
}

interface StreakStatsProps {
  streaks: TaskStreak[] | null
}

export function StreakStats({ streaks }: StreakStatsProps) {
  if (!streaks || streaks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Task Streaks
          </CardTitle>
          <CardDescription>No streak data available yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Sort streaks by current streak length
  const sortedStreaks = [...streaks].sort((a, b) => b.current_streak - a.current_streak)
  const topStreak = sortedStreaks[0]
  const longestEver = Math.max(...streaks.map(s => s.longest_streak))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Task Streaks
        </CardTitle>
        <CardDescription>Keep the momentum going!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Best Streak */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Current Best Streak
              </p>
              <p className="text-2xl font-bold text-primary">
                {topStreak.current_streak} Days
              </p>
            </div>
          </div>
        </div>

        {/* All-Time Record */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                All-Time Record
              </p>
              <p className="text-2xl font-bold text-primary">
                {longestEver} Days
              </p>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Last Activity
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(topStreak.last_completed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Active Streaks List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Active Streaks</h4>
          <div className="space-y-2">
            {sortedStreaks.map((streak) => (
              <div key={streak.member_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={streak.member.avatar_url || undefined} />
                    <AvatarFallback>
                      {streak.member.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{streak.member.display_name}</span>
                </div>
                <span className="text-sm font-medium">{streak.current_streak} days</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 