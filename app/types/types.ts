export interface GymStats {
  totalMembers: number
  totalPoints: number
  activeQuests: number
  tasksCompleted: number
  weeklyProgress: number
  rank: string
}

export interface Role {
  id: number
  name: string
  description: string
}

export interface DashboardMember {
  id: string
  display_name: string
  full_name: string
  avatar_url: string | null
  role: Role
  personal_motto: string | null
  last_active: string
  starterPokemon: {
    formId: number
    nickname: string | null
    friendship: number
    experience: number
  } | null
}

export interface PokemonStats {
  totalCaught: number
  totalAvailable: number
  uniqueSpecies: number
  favoritePokemon: {
    formId: number
    name: string
    friendship: number
  } | null
  recentlyObtained: Array<{
    formId: number
    name: string
    obtainedAt: string
  }>
}

export interface ActivityEvent {
  id: string
  type: 'task_completed' | 'pokemon_caught' | 'quest_started' | 'quest_completed' | 'level_up'
  userId: string
  userName: string
  timestamp: string
  details: Record<string, any>
}

export type { Pokemon } from 'pokenode-ts' 