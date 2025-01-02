export interface FamilyPokedexEntry {
  id: string
  pokemonId: number
  familyId: string
  caughtBy: {
    id: string
    displayName: string
    avatarUrl: string | null
  } | null
  nickname: string | null
  level: number
  isShiny: boolean
  friendship: number
  experience: number
  caughtAt: string
  caughtCount: number
  isFavorite: boolean
  notes: string | null
}

export interface PokemonWithEntry {
  id: number
  name: string
  sprites: {
    frontDefault: string | null
    frontShiny: string | null
  }
  types: Array<{
    slot: number
    type: {
      name: string
    }
  }>
  entry?: FamilyPokedexEntry
} 