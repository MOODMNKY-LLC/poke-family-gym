export interface Pokeball {
  name: string
  baseValue: number
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra_rare'
  quantity: number
  image: string
}

// Predefined Pokéballs with their base values
export const pokeballs: Pokeball[] = [
  {
    name: 'Poké Ball',
    baseValue: 1,
    rarity: 'common',
    quantity: 50,
    image: '/images/pokeballs/poke-ball.png'
  },
  {
    name: 'Great Ball',
    baseValue: 2,
    rarity: 'uncommon',
    quantity: 30,
    image: '/images/pokeballs/great-ball.png'
  },
  {
    name: 'Ultra Ball',
    baseValue: 3,
    rarity: 'rare',
    quantity: 15,
    image: '/images/pokeballs/ultra-ball.png'
  },
  {
    name: 'Master Ball',
    baseValue: 5,
    rarity: 'ultra_rare',
    quantity: 5,
    image: '/images/pokeballs/master-ball.png'
  }
] 