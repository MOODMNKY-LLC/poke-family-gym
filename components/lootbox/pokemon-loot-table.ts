import { SimplifiedPokemon } from '@/lib/services/poke-api.service'

export type PokemonRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'ultra_rare'
  | 'secret_rare'
  | 'special_rare'
  | 'hyper_rare'
  | 'crown_rare'

export type PokemonVariant = 'normal' | 'special' | 'regional' | 'mega' | 'gmax'

export interface PokemonLootItem extends SimplifiedPokemon {
  rarity: PokemonRarity
}

export interface LootBoxPokemon {
  id: string
  label: string
  pokemonId: number
  shiny?: boolean
  variant?: PokemonVariant
}

// Initial Pokémon pool - this will be expanded with the full Pokédex
export const pokemonLootTable = {
  common: [
    // Common, basic Pokémon
    { id: 'pidgey', label: 'Pidgey', pokemonId: 16 },
    { id: 'rattata', label: 'Rattata', pokemonId: 19 },
    { id: 'caterpie', label: 'Caterpie', pokemonId: 10 },
    { id: 'weedle', label: 'Weedle', pokemonId: 13 },
    { id: 'zubat', label: 'Zubat', pokemonId: 41 },
    { id: 'oddish', label: 'Oddish', pokemonId: 43 },
    { id: 'magikarp', label: 'Magikarp', pokemonId: 129 }
  ],
  uncommon: [
    // Stage 1 evolutions and popular basic Pokémon
    { id: 'pikachu', label: 'Pikachu', pokemonId: 25 },
    { id: 'eevee', label: 'Eevee', pokemonId: 133 },
    { id: 'charmeleon', label: 'Charmeleon', pokemonId: 5 },
    { id: 'wartortle', label: 'Wartortle', pokemonId: 8 },
    { id: 'ivysaur', label: 'Ivysaur', pokemonId: 2 },
    { id: 'kadabra', label: 'Kadabra', pokemonId: 64 }
  ],
  rare: [
    // Final evolutions and strong single-stage Pokémon
    { id: 'charizard', label: 'Charizard', pokemonId: 6 },
    { id: 'blastoise', label: 'Blastoise', pokemonId: 9 },
    { id: 'venusaur', label: 'Venusaur', pokemonId: 3 },
    { id: 'dragonite', label: 'Dragonite', pokemonId: 149 },
    { id: 'gyarados', label: 'Gyarados', pokemonId: 130 },
    { id: 'snorlax', label: 'Snorlax', pokemonId: 143 }
  ],
  ultra_rare: [
    // Powerful final evolutions and pseudo-legendaries
    { id: 'tyranitar', label: 'Tyranitar', pokemonId: 248 },
    { id: 'salamence', label: 'Salamence', pokemonId: 373 },
    { id: 'metagross', label: 'Metagross', pokemonId: 376 },
    { id: 'garchomp', label: 'Garchomp', pokemonId: 445 }
  ],
  secret_rare: [
    // Sub-legendary Pokémon
    { id: 'articuno', label: 'Articuno', pokemonId: 144 },
    { id: 'zapdos', label: 'Zapdos', pokemonId: 145 },
    { id: 'moltres', label: 'Moltres', pokemonId: 146 },
    { id: 'raikou', label: 'Raikou', pokemonId: 243 },
    { id: 'entei', label: 'Entei', pokemonId: 244 },
    { id: 'suicune', label: 'Suicune', pokemonId: 245 }
  ],
  special_rare: [
    // Special variants of popular Pokémon
    { id: 'charizard-mega-x', label: 'Mega Charizard X', pokemonId: 6, variant: 'mega' as PokemonVariant },
    { id: 'mewtwo-mega-y', label: 'Mega Mewtwo Y', pokemonId: 150, variant: 'mega' as PokemonVariant },
    { id: 'rayquaza-mega', label: 'Mega Rayquaza', pokemonId: 384, variant: 'mega' as PokemonVariant },
    { id: 'charizard-gmax', label: 'Gigantamax Charizard', pokemonId: 6, variant: 'gmax' as PokemonVariant }
  ],
  hyper_rare: [
    // Major legendary Pokémon
    { id: 'mewtwo', label: 'Mewtwo', pokemonId: 150 },
    { id: 'lugia', label: 'Lugia', pokemonId: 249 },
    { id: 'ho-oh', label: 'Ho-Oh', pokemonId: 250 },
    { id: 'rayquaza', label: 'Rayquaza', pokemonId: 384 }
  ],
  crown_rare: [
    // Mythical and special legendary Pokémon
    { id: 'mew', label: 'Mew', pokemonId: 151 },
    { id: 'celebi', label: 'Celebi', pokemonId: 251 },
    { id: 'jirachi', label: 'Jirachi', pokemonId: 385 },
    { id: 'deoxys', label: 'Deoxys', pokemonId: 386 }
  ]
} 