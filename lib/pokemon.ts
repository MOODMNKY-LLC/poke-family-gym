import { ChainLink, EvolutionDetail } from 'pokenode-ts'

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