declare module 'lootbox' {
  interface LootBoxItem {
    id: string
    label: string
    pokemonId?: number
    [key: string]: any
  }

  interface LootTable {
    [key: string]: LootBoxItem[]
  }

  interface BoxConfig {
    label: string
    id: string
    color: string
    chance: number
  }

  interface BoxConfigFile {
    boxes: BoxConfig[]
  }

  interface OddsResultItem {
    item: string
    internalChance: number
    globalChance: number
  }

  interface OddsResult {
    box: string
    chance: number
    items: OddsResultItem[]
  }

  class LootBox {
    constructor(lootTable: LootTable, boxes: BoxConfig[], buff?: number)
    
    private chooseBox(): BoxConfig
    private chooseLoot(rarity: string): LootBoxItem
    
    open(buff?: number): {
      box: BoxConfig
      item: LootBoxItem
    }
    
    openPack(size: number): Array<{
      box: BoxConfig
      item: LootBoxItem
    }>
    
    determineOdds(): OddsResult[]
  }

  export default LootBox
} 