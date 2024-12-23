export interface GymStats {
  totalPokeballs: number
  completedTasks: number
  activeQuests: number
  gymRank: string
  weeklyProgress: number
  totalMembers: number
  membersByRole: Record<string, number>
}

export interface PokemonStats {
  totalCaught: number
  uniqueSpecies: number
  recentlyObtained: Array<{
    pokemonFormId: number
    caughtAt: string
    nickname: string | null
  }>
  favoritePokemon?: {
    formId: number
    nickname: string | null
    friendship: number
  }
}

export interface ActivityEvent {
  id: string
  type: 'TASK_COMPLETE' | 'POKEMON_CAUGHT' | 'ACHIEVEMENT_EARNED' | 'LEVEL_UP' | 'BADGE_EARNED'
  memberId: string
  memberName: string
  timestamp: string
  details: {
    title: string
    description: string
    pokemonFormId?: number
    pokemonNickname?: string
    rewardAmount?: number
    achievementType?: string
    badgeType?: string
  }
}

export interface DashboardData {
  gymStats: GymStats
  pokemonStats: PokemonStats
  recentActivity: ActivityEvent[]
  familyProfile: {
    id: string
    name: string
    motto: string | null
    avatarUrl: string | null
    theme: string | null
    createdAt: string
  }
  members: Array<DashboardMember>
}

export interface DashboardMember {
  id: string
  displayName: string
  avatarUrl: string | null
  birthDate: string | null
  favoriteColor: string | null
  personalMotto: string | null
  role: {
    id: number
    name: string
  }
  starterPokemon?: {
    formId: number
    nickname: string | null
    friendship: number
    experience: number
    ribbons: string[]
  }
  status: string
  lastActive: string
} 