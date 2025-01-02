import { PokemonClient } from 'pokenode-ts'

const api = new PokemonClient()

export interface PokeItem {
  name: string
  sprites: {
    default: string
  }
  cost: number
  category: {
    name: string
  }
}

interface PokeAPIItem {
  name: string
  sprites: {
    default: string | null
  }
  cost: number
  category: {
    name: string
  }
}

const POKEBALL_NAMES = ['poke-ball', 'great-ball', 'ultra-ball', 'master-ball']

const POKEBALL_SPRITES = {
  'poke-ball': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  'great-ball': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
  'ultra-ball': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  'master-ball': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png'
}

const POKEBALL_COSTS = {
  'poke-ball': 200,
  'great-ball': 600,
  'ultra-ball': 1200,
  'master-ball': 0 // Cannot be bought
}

export const PokeAPI = {
  async getPokeballs(): Promise<PokeItem[]> {
    try {
      return POKEBALL_NAMES.map(name => ({
        name,
        sprites: {
          default: POKEBALL_SPRITES[name as keyof typeof POKEBALL_SPRITES]
        },
        cost: POKEBALL_COSTS[name as keyof typeof POKEBALL_COSTS],
        category: {
          name: 'pokeballs'
        }
      }))
    } catch (error) {
      console.error('Error fetching Pokéballs:', error)
      throw error
    }
  }
} 