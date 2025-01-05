import { ChainLink, EvolutionDetail, PokemonClient } from 'pokenode-ts'

// Create a singleton Pokemon client
const pokeClient = new PokemonClient()

// Cache for Pokemon data to avoid redundant API calls
const pokemonCache = new Map()

export interface EvolutionRequirement {
  type: 'level-up' | 'trade' | 'use-item' | 'other'
  details: {
    minLevel?: number
    item?: string
    happiness?: number
    timeOfDay?: string
    location?: string
    heldItem?: string
    move?: string
    [key: string]: any
  }
  currentPokemon: string
  evolvesTo: string
  canEvolve: boolean
  missingRequirements: string[]
}

export function checkEvolutionEligibility(
  chain: ChainLink,
  currentPokemonName: string,
  currentLevel: number,
  happiness: number = 0
): EvolutionRequirement | null {
  // If this is the current Pokémon in the chain
  if (chain.species.name === currentPokemonName) {
    // Check if there are any possible evolutions
    if (chain.evolves_to.length > 0) {
      const nextEvolution = chain.evolves_to[0]
      const evolutionDetails = nextEvolution.evolution_details[0]
      
      return processEvolutionDetails(
        evolutionDetails,
        currentPokemonName,
        nextEvolution.species.name,
        currentLevel,
        happiness
      )
    }
  }
  
  // Recursively check evolves_to chains
  for (const evolution of chain.evolves_to) {
    const result = checkEvolutionEligibility(
      evolution,
      currentPokemonName,
      currentLevel,
      happiness
    )
    if (result) return result
  }
  
  return null
}

function processEvolutionDetails(
  details: EvolutionDetail,
  currentPokemon: string,
  evolvesTo: string,
  currentLevel: number,
  happiness: number
): EvolutionRequirement {
  const missingRequirements: string[] = []
  let canEvolve = true
  let evolutionType: EvolutionRequirement['type'] = 'other'
  
  const requirementDetails: EvolutionRequirement['details'] = {}
  
  // Check level-up evolution
  if (details.min_level) {
    evolutionType = 'level-up'
    requirementDetails.minLevel = details.min_level
    if (currentLevel < details.min_level) {
      missingRequirements.push(`Needs to reach level ${details.min_level}`)
      canEvolve = false
    }
  }
  
  // Check happiness requirement
  if (details.min_happiness) {
    requirementDetails.happiness = details.min_happiness
    if (happiness < details.min_happiness) {
      missingRequirements.push(`Needs ${details.min_happiness} happiness (current: ${happiness})`)
      canEvolve = false
    }
  }
  
  // Check time of day requirement
  if (details.time_of_day) {
    const timeOfDay = details.time_of_day.toLowerCase()
    requirementDetails.timeOfDay = timeOfDay
    const currentHour = new Date().getHours()
    const isCorrectTime = (
      (timeOfDay === 'day' && currentHour >= 6 && currentHour < 18) ||
      (timeOfDay === 'night' && (currentHour >= 18 || currentHour < 6))
    )
    if (!isCorrectTime) {
      missingRequirements.push(`Must evolve during ${timeOfDay}`)
      canEvolve = false
    }
  }
  
  // Check held item requirement
  if (details.held_item) {
    evolutionType = 'use-item'
    requirementDetails.heldItem = details.held_item.name
    missingRequirements.push(`Must be holding ${details.held_item.name}`)
    canEvolve = false
  }
  
  // Check evolution item requirement
  if (details.item) {
    evolutionType = 'use-item'
    requirementDetails.item = details.item.name
    missingRequirements.push(`Requires ${details.item.name}`)
    canEvolve = false
  }
  
  // Check location requirement
  if (details.location) {
    requirementDetails.location = details.location.name
    missingRequirements.push(`Must be at ${details.location.name}`)
    canEvolve = false
  }
  
  // Check known move requirement
  if (details.known_move) {
    requirementDetails.move = details.known_move.name
    missingRequirements.push(`Must know ${details.known_move.name}`)
    canEvolve = false
  }
  
  return {
    type: evolutionType,
    details: requirementDetails,
    currentPokemon,
    evolvesTo,
    canEvolve,
    missingRequirements
  }
}

export function calculatePokemonLevel(experiencePoints: number): number {
  // This is a simplified version - you might want to use actual experience groups
  return Math.floor(Math.sqrt(experiencePoints) / 10) + 1
}

export function getExperienceForLevel(level: number): number {
  // This is a simplified version - you might want to use actual experience groups
  return Math.pow((level - 1) * 10, 2)
}

export async function getPokemonDetails(pokemonId: number) {
  // Check cache first
  if (pokemonCache.has(pokemonId)) {
    return pokemonCache.get(pokemonId)
  }

  try {
    const pokemon = await pokeClient.getPokemonById(pokemonId)
    const species = await pokeClient.getPokemonSpeciesById(pokemonId)

    const details = {
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types.map(t => t.type.name),
      stats: pokemon.stats.map(s => ({
        name: s.stat.name,
        base: s.base_stat
      })),
      sprites: {
        front_default: pokemon.sprites.front_default,
        front_shiny: pokemon.sprites.front_shiny,
        official_artwork: pokemon.sprites.other?.["official-artwork"].front_default,
        home: pokemon.sprites.other?.home.front_default
      },
      species: {
        name: species.name,
        flavor_text: species.flavor_text_entries
          .find(entry => entry.language.name === "en")
          ?.flavor_text || "",
        color: species.color.name,
        is_legendary: species.is_legendary,
        is_mythical: species.is_mythical,
        habitat: species.habitat?.name
      }
    }

    // Cache the result
    pokemonCache.set(pokemonId, details)
    return details
  } catch (error) {
    console.error(`Error fetching Pokemon ${pokemonId}:`, error)
    return null
  }
} 