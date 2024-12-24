import { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardData, DashboardMember } from '@/types/dashboard'
import { PokemonClient } from 'pokenode-ts'

interface RawMember {
  id: string
  display_name: string
  avatar_url: string | null
  birth_date: string | null
  favorite_color: string | null
  personal_motto: string | null
  roles: {
    id: number
    name: string
  }
  starter_pokemon: {
    form_id: number
    nickname: string | null
    friendship: number
    experience: number
    ribbons: string[]
  } | null
  status: string
  last_active: string
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  // Fetch family profile
  const { data: familyProfile } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('owner_id', userId)
    .single()

  if (!familyProfile) {
    throw new Error('Family profile not found')
  }

  // Fetch family members
  const { data: rawMembers } = await supabase
    .from('family_members')
    .select(`
      id,
      display_name,
      avatar_url,
      birth_date,
      favorite_color,
      personal_motto,
      roles:roles!inner(id, name),
      starter_pokemon:starter_pokemon(
        form_id,
        nickname,
        friendship,
        experience,
        ribbons
      ),
      status,
      last_active
    `)
    .eq('family_id', familyProfile.id)

  // Transform members data to match DashboardMember type
  const members: DashboardMember[] = (rawMembers || []).map((member: any) => ({
    id: member.id,
    displayName: member.display_name,
    avatarUrl: member.avatar_url,
    birthDate: member.birth_date,
    favoriteColor: member.favorite_color,
    personalMotto: member.personal_motto,
    role: {
      id: member.roles[0]?.id ?? 0,
      name: member.roles[0]?.name ?? 'Member'
    },
    starterPokemon: member.starter_pokemon?.[0] ? {
      formId: member.starter_pokemon[0].form_id,
      nickname: member.starter_pokemon[0].nickname,
      friendship: member.starter_pokemon[0].friendship,
      experience: member.starter_pokemon[0].experience,
      ribbons: member.starter_pokemon[0].ribbons || []
    } : undefined,
    status: member.status || 'active',
    lastActive: member.last_active
  }))

  // Fetch gym stats
  const { data: gymStats } = await supabase
    .from('gym_stats')
    .select('*')
    .eq('family_id', familyProfile.id)
    .single()

  // Fetch Pokémon stats
  const { data: pokemonStats } = await supabase
    .from('pokemon_stats')
    .select('*')
    .eq('family_id', familyProfile.id)
    .single()

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('activity_events')
    .select('*')
    .eq('family_id', familyProfile.id)
    .order('timestamp', { ascending: false })
    .limit(10)

  // Return the dashboard data
  return {
    familyProfile,
    members,
    gymStats: gymStats || {
      totalPokeballs: 0,
      completedTasks: 0,
      activeQuests: 0,
      gymRank: 'Novice',
      weeklyProgress: 0,
      totalMembers: 0,
      membersByRole: {}
    },
    pokemonStats: pokemonStats || {
      totalCaught: 0,
      uniqueSpecies: 0,
      recentlyObtained: [],
      favoritePokemon: null
    },
    recentActivity: recentActivity || []
  }
} 