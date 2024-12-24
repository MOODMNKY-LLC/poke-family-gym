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