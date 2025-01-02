'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Users, Trophy } from "lucide-react"

interface FamilySynergy {
  id: string
  family_id: string
  synergy_date: string
  active_members: number
  bonus_awarded: boolean
  created_at: string
  updated_at: string
}

interface SynergyStatsProps {
  synergy: FamilySynergy | null
}

export function SynergyStats({ synergy }: SynergyStatsProps) {
  if (!synergy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Family Synergy
          </CardTitle>
          <CardDescription>No synergy data available yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const date = new Date(synergy.synergy_date).toLocaleDateString()
  const progress = (synergy.active_members / 5) * 100 // Assuming max 5 family members

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Family Synergy
        </CardTitle>
        <CardDescription>Last updated: {date}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Members</span>
            </div>
            <span className="text-sm font-medium">{synergy.active_members}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${synergy.bonus_awarded ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {synergy.bonus_awarded ? 'Bonus Awarded!' : 'No Bonus Yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {synergy.bonus_awarded 
                  ? 'Your family earned 5 Great Balls each!'
                  : 'Complete tasks together to earn bonus rewards'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 