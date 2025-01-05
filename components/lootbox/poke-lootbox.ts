import { boxConfig, type PokeBallConfig } from './box-config'
import { pokemonLootTable, type LootBoxPokemon, type PokemonRarity, type PokemonVariant } from './pokemon-loot-table'
import { pokeApiService, type SimplifiedPokemon } from '@/lib/services/poke-api.service'

interface PokeLootBoxOptions {
  customLootTable?: typeof pokemonLootTable
  customBoxConfig?: typeof boxConfig
  buff?: number // Percentage increase for better rarities (0-1)
}

interface PokemonReward extends SimplifiedPokemon {
  rarity: PokemonRarity
  shiny?: boolean
  variant?: PokemonVariant
}

interface SlotResult {
  pokemon: LootBoxPokemon
  rarity: PokemonRarity
}

function hasVariant(pokemon: LootBoxPokemon): pokemon is LootBoxPokemon & { variant: PokemonVariant } {
  return 'variant' in pokemon
}

export class PokeLootBox {
  private lootTable: typeof pokemonLootTable
  private boxes: PokeBallConfig[]
  private buff: number
  private pokemonCache: Map<number, SimplifiedPokemon>

  constructor(options: PokeLootBoxOptions = {}) {
    this.lootTable = options.customLootTable || pokemonLootTable
    this.boxes = (options.customBoxConfig?.boxes || boxConfig.boxes) as PokeBallConfig[]
    this.buff = options.buff || 0
    this.pokemonCache = new Map()
  }

  private async ensurePokemonData(pokemonId: number): Promise<SimplifiedPokemon> {
    if (this.pokemonCache.has(pokemonId)) {
      return this.pokemonCache.get(pokemonId)!
    }

    const pokemon = await pokeApiService.getPokemon(pokemonId)
    this.pokemonCache.set(pokemonId, pokemon)
    return pokemon
  }

  private getBoxByRarity(rarity: PokemonRarity): PokeBallConfig {
    return this.boxes.find(box => box.id === rarity) as PokeBallConfig
  }

  private rollForShiny(): boolean {
    // Base shiny rate is 1/4096 (like in the games)
    const shinyRate = 1/4096
    return Math.random() < (shinyRate * (1 + this.buff))
  }

  private determineSlotRarity(): PokemonRarity {
    const rand = Math.random()
    let cumulativeChance = 0

    // Apply buff to improve chances
    const buffMultiplier = 1 + this.buff

    // Sort boxes by chance in descending order
    const sortedBoxes = [...this.boxes].sort((a, b) => b.chance - a.chance)

    for (const box of sortedBoxes) {
      const adjustedChance = Math.min(box.chance * buffMultiplier, 1)
      cumulativeChance += adjustedChance

      if (rand <= cumulativeChance) {
        return box.id as PokemonRarity
      }
    }

    // Fallback to common if somehow nothing was selected
    return 'common'
  }

  private selectPokemonFromPool(rarity: PokemonRarity): LootBoxPokemon {
    const pool = this.lootTable[rarity]
    if (!pool || pool.length === 0) {
      throw new Error(`No Pokémon available for rarity: ${rarity}`)
    }
    return pool[Math.floor(Math.random() * pool.length)]
  }

  public async openPack(size: number = 5): Promise<PokemonReward[]> {
    const rewards: PokemonReward[] = []
    const slots = new Array(size).fill(null)
    
    // Track how many of each rarity we've added
    const rarityCount: Record<PokemonRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      ultra_rare: 0,
      secret_rare: 0,
      special_rare: 0,
      hyper_rare: 0,
      crown_rare: 0
    }

    // First, handle guaranteed slots
    for (const box of this.boxes) {
      if (box.guaranteedSlots) {
        for (let i = 0; i < box.guaranteedSlots; i++) {
          // Find an empty slot
          const emptySlotIndex = slots.findIndex(slot => slot === null)
          if (emptySlotIndex === -1) break // No more empty slots

          const pokemon = this.selectPokemonFromPool(box.id as PokemonRarity)
          slots[emptySlotIndex] = {
            pokemon,
            rarity: box.id as PokemonRarity
          }
          rarityCount[box.id as PokemonRarity]++
        }
      }
    }

    // Fill remaining slots
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] === null) {
        let rarity = this.determineSlotRarity()
        const box = this.getBoxByRarity(rarity)
        
        // If we've hit the max for this rarity, try the next lower rarity
        while (box.maxPerPack && rarityCount[rarity] >= box.maxPerPack) {
          const currentIndex = this.boxes.findIndex(b => b.id === rarity)
          if (currentIndex < this.boxes.length - 1) {
            rarity = this.boxes[currentIndex + 1].id as PokemonRarity
          } else {
            rarity = 'common' // Fallback to common if we can't go lower
          }
        }

        const pokemon = this.selectPokemonFromPool(rarity)
        slots[i] = {
          pokemon,
          rarity
        }
        rarityCount[rarity]++
      }
    }

    // Process all slots and fetch Pokémon data
    for (const slot of slots) {
      if (!slot) continue

      const { pokemon, rarity } = slot as SlotResult
      const pokemonData = await this.ensurePokemonData(pokemon.pokemonId)
      
      const reward: PokemonReward = {
        ...pokemonData,
        rarity,
        shiny: this.rollForShiny()
      }

      if (hasVariant(pokemon)) {
        reward.variant = pokemon.variant
      }

      rewards.push(reward)
    }

    return rewards
  }

  public getOdds(): Array<{
    box: string
    chance: number
    items: Array<{
      item: string
      internalChance: number
      globalChance: number
    }>
  }> {
    return this.boxes.map(box => {
      const pool = this.lootTable[box.id as PokemonRarity] || []
      const items = pool.map(pokemon => ({
        item: pokemon.label,
        internalChance: pool.length > 0 ? 1 / pool.length : 0,
        globalChance: pool.length > 0 ? (box.chance * (1 + this.buff)) / pool.length : 0
      }))

      return {
        box: box.label,
        chance: box.chance * (1 + this.buff),
        items
      }
    })
  }

  public async getPreview(rarity: PokemonRarity): Promise<PokemonReward[]> {
    const pool = this.lootTable[rarity]
    if (!pool) throw new Error(`Invalid rarity: ${rarity}`)

    const previewPokemon = await Promise.all(
      pool.map(async pokemon => {
        const data = await this.ensurePokemonData(pokemon.pokemonId)
        const reward: PokemonReward = {
          ...data,
          rarity
        }

        if (hasVariant(pokemon)) {
          reward.variant = pokemon.variant
        }

        return reward
      })
    )

    return previewPokemon
  }
} 