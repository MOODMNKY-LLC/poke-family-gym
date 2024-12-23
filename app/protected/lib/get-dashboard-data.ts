import { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardData } from '@/types/dashboard'

interface DatabaseMember {
  id: string
  display_name: string
  full_name: string
  avatar_url: string | null
  birth_date: string | null
  favorite_color: string | null
  current_status: string
  personal_motto: string | null
  role_id: number
  roles: {
    id: number
    name: string
  }
  starter_pokemon_form_id: number | null
  starter_pokemon_nickname: string | null
  starter_pokemon_friendship: number | null
  experience_points: number | null
  starter_pokemon_ribbons: string[] | null
  updated_at: string
}

interface FamilyPokedexEntry {
  pokemon_form_id: number
  first_caught_at: string
  nickname: string | null
  is_favorite: boolean
  caught_count: number
}

interface ActivityEventEntry {
  id: string
  type: 'TASK_COMPLETE' | 'POKEMON_CAUGHT' | 'ACHIEVEMENT_EARNED' | 'LEVEL_UP' | 'BADGE_EARNED'
  member_id: string
  timestamp: string
  details: Record<string, any>
}

interface TaskEntry {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  pokeball_reward: number
  due_date: string | null
}

interface PokeballTransaction {
  amount: number
  created_at: string
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  // Fetch family profile
  const { data: familyProfile, error: familyError } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (familyError) throw familyError

  // Fetch family members
  const { data: members, error: membersError } = await supabase
    .from('family_members')
    .select(`
      id,
      display_name,
      full_name,
      avatar_url,
      birth_date,
      favorite_color,
      current_status,
      personal_motto,
      role_id,
      roles (
        id,
        name
      ),
      starter_pokemon_form_id,
      starter_pokemon_nickname,
      starter_pokemon_friendship,
      experience_points,
      starter_pokemon_ribbons,
      updated_at
    `)
    .eq('family_id', userId)
    .order('created_at', { ascending: true }) as { data: DatabaseMember[] | null, error: any }

  if (membersError) throw membersError

  // Get member counts by role
  const membersByRole = (members || []).reduce((acc: Record<string, number>, member: DatabaseMember) => {
    const roleName = member.roles?.name
    if (roleName) {
      acc[roleName] = (acc[roleName] || 0) + 1
    }
    return acc
  }, {})

  // Fetch Pokédex stats
  const { data: pokedexStats } = await supabase
    .from('family_pokedex')
    .select('*')
    .eq('family_id', userId) as { data: FamilyPokedexEntry[] | null }

  // Calculate total caught by summing caught_count values
  const totalCaught = (pokedexStats || []).reduce((total, entry) => total + (entry.caught_count || 0), 0)
  
  // Calculate unique species (already correct, using distinct pokemon_form_id values)
  const uniqueSpecies = new Set(pokedexStats?.map(p => p.pokemon_form_id)).size || 0

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('activity_events')
    .select('*')
    .eq('family_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50) as { data: ActivityEventEntry[] | null }

  // Fetch active tasks
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('due_date', { ascending: true }) as { data: TaskEntry[] | null }

  // Fetch completed tasks for the current week
  const startOfWeek = new Date()
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  const { data: completedTasks } = await supabase
    .from('task_history')
    .select('*')
    .gte('completed_at', startOfWeek.toISOString())
    .order('completed_at', { ascending: false }) as { data: TaskEntry[] | null }

  // Fetch Pokéball balance
  const { data: pokeballTransactions } = await supabase
    .from('pokeball_transactions')
    .select('amount, created_at')
    .eq('family_id', userId)
    .order('created_at', { ascending: false }) as { data: PokeballTransaction[] | null }

  // Calculate total Pokéballs
  const totalPokeballs = (pokeballTransactions || []).reduce(
    (total, tx) => total + tx.amount,
    0
  )

  // Calculate gym rank based on total Pokéballs and tasks
  const gymRank = calculateGymRank(totalPokeballs, completedTasks?.length || 0)

  // Calculate weekly progress
  const weeklyProgress = calculateWeeklyProgress(completedTasks || [])

  // Format the data according to our dashboard interface
  return {
    gymStats: {
      totalPokeballs,
      completedTasks: completedTasks?.length || 0,
      activeQuests: activeTasks?.length || 0,
      gymRank,
      weeklyProgress,
      totalMembers: members?.length || 0,
      membersByRole: membersByRole || {}
    },
    pokemonStats: {
      totalCaught,
      uniqueSpecies,
      recentlyObtained: (pokedexStats || [])
        .sort((a, b) => new Date(b.first_caught_at).getTime() - new Date(a.first_caught_at).getTime())
        .slice(0, 3)
        .map(p => ({
          pokemonFormId: p.pokemon_form_id,
          caughtAt: p.first_caught_at,
          nickname: p.nickname
        })),
      favoritePokemon: pokedexStats?.find(p => p.is_favorite) ? {
        formId: pokedexStats.find(p => p.is_favorite)!.pokemon_form_id,
        nickname: pokedexStats.find(p => p.is_favorite)!.nickname,
        friendship: 0 // TODO: Implement friendship system
      } : undefined
    },
    recentActivity: (recentActivity || []).map(event => ({
      id: event.id,
      type: event.type,
      memberId: event.member_id,
      memberName: members?.find(m => m.id === event.member_id)?.display_name || 'Unknown',
      timestamp: event.timestamp,
      details: {
        title: event.details.title || '',
        description: event.details.description || '',
        ...event.details
      }
    })),
    familyProfile: {
      id: familyProfile.id,
      name: familyProfile.family_name,
      motto: familyProfile.family_motto,
      avatarUrl: familyProfile.avatar_url,
      theme: familyProfile.theme_color,
      createdAt: familyProfile.created_at
    },
    members: (members || []).map(member => ({
      id: member.id,
      displayName: member.display_name,
      avatarUrl: member.avatar_url,
      birthDate: member.birth_date,
      favoriteColor: member.favorite_color,
      personalMotto: member.personal_motto,
      role: {
        id: member.roles.id,
        name: member.roles.name
      },
      starterPokemon: member.starter_pokemon_form_id ? {
        formId: member.starter_pokemon_form_id,
        nickname: member.starter_pokemon_nickname,
        friendship: member.starter_pokemon_friendship ?? 0,
        experience: member.experience_points ?? 0,
        ribbons: member.starter_pokemon_ribbons ?? []
      } : undefined,
      status: member.current_status,
      lastActive: member.updated_at
    }))
  }
}

function calculateGymRank(totalPokeballs: number, completedTasks: number): string {
  if (totalPokeballs >= 1000 && completedTasks >= 100) return 'Master'
  if (totalPokeballs >= 500 && completedTasks >= 50) return 'Diamond'
  if (totalPokeballs >= 250 && completedTasks >= 25) return 'Platinum'
  if (totalPokeballs >= 100 && completedTasks >= 10) return 'Gold'
  if (totalPokeballs >= 50 && completedTasks >= 5) return 'Silver'
  if (totalPokeballs >= 25 && completedTasks >= 3) return 'Bronze'
  return 'Beginner'
}

function calculateWeeklyProgress(completedTasks: TaskEntry[]): number {
  // Target: Complete at least 5 tasks per day, 35 per week
  const weeklyTarget = 35
  const progress = (completedTasks.length / weeklyTarget) * 100
  return Math.min(Math.round(progress), 100)
} 