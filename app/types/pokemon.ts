import type { Pokemon } from 'pokenode-ts'

// Database types
export interface PokemonSpecies {
  id: number
  name: string
  generation_id: number
}

export interface PokemonForm {
  id: number
  name: string
  species: PokemonSpecies
}

export interface RawFamilyPokedexEntry {
  id: string
  form: PokemonForm
  family_id: string
  first_caught_at: string
  caught_count: number
  is_favorite: boolean
  nickname: string | null
  notes: string | null
  caught_by: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

// Application types
export interface FamilyPokedexEntry {
  id: string
  pokemonId: number
  familyId: string
  caughtBy: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null
  nickname: string | null
  level: number
  isShiny: boolean
  friendship: number
  experience: number
  caught_at: string
  caught_count: number
  is_favorite: boolean
  notes: string | null
}

export interface PokemonWithEntry {
  id: number
  name: string
  sprites: {
    front_default: string | null
    front_shiny: string | null
  }
  types: Array<{
    slot: number
    type: {
      name: string
    }
  }>
  entry?: FamilyPokedexEntry
}

export interface GymStats {
  totalMembers: number
  totalPoints: number
  activeQuests: number
  tasksCompleted: number
  weeklyProgress: number
  rank: string
}

export interface PokemonStats {
  totalCaught: number
  uniqueSpecies: number
  totalAvailable: number
  favoritePokemon: {
    formId: number
    nickname: string | null
    friendship: number
  } | null
  recentlyObtained: Array<{
    pokemonFormId: number
    nickname: string | null
    caughtAt: string
  }>
}

export interface DashboardMember {
  id: string
  display_name: string
  full_name: string | null
  avatar_url: string | null
  role: {
    id: number
    name: string
    description: string | null
  }
  personal_motto: string | null
  last_active: string | null
  starterPokemon: {
    formId: number
    nickname: string | null
    friendship: number
    experience: number
  } | null
}

export interface DashboardData {
  familyProfile: {
    id: string
    name: string
    motto: string | null
  }
  members: DashboardMember[]
  gymStats: GymStats
  pokemonStats: PokemonStats
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    userId: string
    metadata: Record<string, any>
  }>
  familyPokedex: FamilyPokedexEntry[]
}

export type { Pokemon } 