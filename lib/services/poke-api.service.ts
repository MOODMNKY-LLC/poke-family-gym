import { PokemonClient } from 'pokenode-ts'
import { cache } from 'react'

const api = new PokemonClient()

export interface SimplifiedPokemon {
  id: number
  name: string
  types: string[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
  }
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
}

interface PokemonSpecies {
  url: string
}

export interface SearchResult {
  id: number
  name: string
}

export const pokeApiService = {
  /**
   * Get a Pokémon by its ID or name
   */
  getPokemon: cache(async (idOrName: number | string): Promise<SimplifiedPokemon> => {
    const pokemon = await api.getPokemonByName(idOrName.toString())
    
    return {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types.map(t => t.type.name),
      sprites: {
        front_default: pokemon.sprites.front_default,
        front_shiny: pokemon.sprites.front_shiny
      },
      stats: {
        hp: pokemon.stats[0].base_stat,
        attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat,
        specialAttack: pokemon.stats[3].base_stat,
        specialDefense: pokemon.stats[4].base_stat,
        speed: pokemon.stats[5].base_stat
      }
    }
  }),

  /**
   * Get a list of Pokémon by their IDs
   */
  getPokemonBatch: cache(async (ids: number[]): Promise<SimplifiedPokemon[]> => {
    const promises = ids.map(id => pokeApiService.getPokemon(id))
    return Promise.all(promises)
  }),

  /**
   * Get all Pokémon in a generation
   */
  getGenerationPokemon: cache(async (generation: number): Promise<SimplifiedPokemon[]> => {
    // Since getGenerationById is not available, we'll use a range of Pokémon IDs for each generation
    const generationRanges: { [key: number]: [number, number] } = {
      1: [1, 151],    // Gen 1
      2: [152, 251],  // Gen 2
      3: [252, 386],  // Gen 3
      4: [387, 493],  // Gen 4
      5: [494, 649],  // Gen 5
      6: [650, 721],  // Gen 6
      7: [722, 809],  // Gen 7
      8: [810, 905],  // Gen 8
      9: [906, 1010]  // Gen 9
    }

    const [start, end] = generationRanges[generation] || generationRanges[1]
    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    return pokeApiService.getPokemonBatch(ids)
  }),

  /**
   * Search for Pokémon by name
   */
  searchPokemon: cache(async (query: string): Promise<SearchResult[]> => {
    try {
      // Get the list of all Pokemon from Gen 1-9
      const response = await api.listPokemons(0, 1010)
      
      // Filter Pokemon whose names match the query
      const results = response.results
        .filter(pokemon => pokemon.name.includes(query.toLowerCase()))
        .map((pokemon, index) => ({
          id: parseInt(pokemon.url.split('/').slice(-2, -1)[0]),
          name: pokemon.name
        }))
        .slice(0, 10) // Limit to 10 results

      return results
    } catch (error) {
      console.error('Error searching Pokemon:', error)
      return []
    }
  })
} 