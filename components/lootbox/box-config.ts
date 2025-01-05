export interface BoxConfig {
  label: string
  id: string
  color: string
  chance: number
  symbol: string
}

export type PokeBallType = 'poke' | 'great' | 'ultra' | 'master'

export interface PokeBallConfig extends BoxConfig {
  ballType: PokeBallType
  guaranteedSlots?: number // How many Pokémon of this rarity are guaranteed
  maxPerPack?: number // Maximum number of this rarity per pack
}

export const boxConfig = {
  boxes: [
    {
      label: 'Common',
      id: 'common',
      color: '#A8A878', // Normal-type color
      chance: 1,
      symbol: '◇1',
      ballType: 'poke',
      guaranteedSlots: 3,
      maxPerPack: 3
    },
    {
      label: 'Uncommon',
      id: 'uncommon',
      color: '#6890F0', // Water-type color
      chance: 0.75, // 75% chance in applicable slots
      symbol: '◇2',
      ballType: 'great',
      guaranteedSlots: 1,
      maxPerPack: 2
    },
    {
      label: 'Rare',
      id: 'rare',
      color: '#A040A0', // Poison-type color
      chance: 0.125, // 12.5% chance in applicable slots
      symbol: '◇3',
      ballType: 'ultra',
      guaranteedSlots: 1,
      maxPerPack: 1
    },
    {
      label: 'Ultra Rare',
      id: 'ultra_rare',
      color: '#F8D030', // Electric-type color
      chance: 0.04166, // ~4.17% chance in rare slot
      symbol: '◇4',
      ballType: 'ultra'
    },
    {
      label: 'Secret Rare',
      id: 'secret_rare',
      color: '#B8A038', // Rock-type color
      chance: 0.0643, // ~6.43% chance in rare slot
      symbol: '★1',
      ballType: 'master'
    },
    {
      label: 'Special Illustration Rare',
      id: 'special_rare',
      color: '#705898', // Ghost-type color
      chance: 0.0125, // 1.25% chance in rare slot
      symbol: '★2',
      ballType: 'master'
    },
    {
      label: 'Hyper Rare',
      id: 'hyper_rare',
      color: '#7038F8', // Dragon-type color
      chance: 0.00555, // ~0.555% chance in rare slot
      symbol: '★3',
      ballType: 'master'
    },
    {
      label: 'Crown Rare',
      id: 'crown_rare',
      color: '#B8B8D0', // Steel-type color
      chance: 0.001, // 0.1% chance in rare slot
      symbol: '👑',
      ballType: 'master'
    }
  ]
} 