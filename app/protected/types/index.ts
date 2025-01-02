export interface FamilySynergy {
  id: string
  family_id: string
  synergy_date: string
  active_members: number
  bonus_awarded: boolean
  created_at: string
  updated_at: string
}

export interface TaskStreak {
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

export interface SynergyStatsProps {
  synergy: FamilySynergy | null
}

export interface StreakStatsProps {
  streaks: TaskStreak[] | null
} 