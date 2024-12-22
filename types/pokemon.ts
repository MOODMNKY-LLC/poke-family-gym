export interface PokemonSpecies {
  id: number
  name: string
  generationId: number | null
  evolutionChainId: number | null
  // ... other fields matching the database schema
}

export interface PokemonForm {
  id: number
  name: string
  speciesId: number
  isDefault: boolean
  // ... other fields
} 