import { PokemonClient } from 'pokenode-ts'
import { createAdminClient } from '@/utils/supabase/admin'

const api = new PokemonClient()

export class PokeSyncService {
  async syncPokemon(startId: number, endId: number) {
    console.log(`Syncing Pokemon from ${startId} to ${endId}...`)
    
    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    
    for (let id = startId; id <= endId; id++) {
      try {
        // Fetch Pokemon data from PokeAPI
        const pokemon = await api.getPokemonById(id)
        
        // Transform data for our schema
        const pokemonData = {
          id: pokemon.id,
          name: pokemon.name,
          types: pokemon.types.map(t => t.type.name),
          stats: Object.fromEntries(
            pokemon.stats.map(s => [s.stat.name, s.base_stat])
          ),
          sprites: {
            front_default: pokemon.sprites.front_default,
            back_default: pokemon.sprites.back_default,
            front_shiny: pokemon.sprites.front_shiny,
            back_shiny: pokemon.sprites.back_shiny
          },
          height: pokemon.height,
          weight: pokemon.weight,
          base_experience: pokemon.base_experience,
          species_id: parseInt(pokemon.species.url.split('/').slice(-2)[0])
        }

        // Upsert Pokemon data
        const { error } = await supabase
          .from('pokemon')
          .upsert(pokemonData)

        if (error) {
          console.error(`Error upserting Pokemon ${id}:`, error)
          continue
        }

        console.log(`Synced Pokemon ${id}: ${pokemon.name}`)
      } catch (error: any) {
        // Skip if Pokemon doesn't exist (404)
        if (error.response?.status === 404) {
          console.log(`Pokemon ${id} not found, skipping...`)
          continue
        }
        console.error(`Error syncing Pokemon ${id}:`, error)
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  async getTotalPokemonCount(): Promise<number> {
    try {
      // Get the count of all Pokemon species
      const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/?limit=1')
      const data = await response.json()
      return data.count
    } catch (error) {
      console.error('Error getting total Pokemon count:', error)
      throw error
    }
  }

  async syncAllPokemon() {
    try {
      const totalPokemon = await this.getTotalPokemonCount()
      console.log(`Starting sync for ${totalPokemon} Pokemon...`)

      // Sync in batches of 50 to avoid overwhelming the API
      const batchSize = 50
      for (let i = 1; i <= totalPokemon; i += batchSize) {
        const endId = Math.min(i + batchSize - 1, totalPokemon)
        await this.syncPokemon(i, endId)
        console.log(`Completed batch ${i} to ${endId}`)
      }

      console.log('Pokemon sync completed successfully')
    } catch (error) {
      console.error('Error during Pokemon sync:', error)
      throw error
    }
  }
}

export const pokeSyncService = new PokeSyncService() 