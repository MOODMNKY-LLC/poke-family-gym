# Pokémon Lootbox System

## Overview

The Pokémon Lootbox System is a gacha-style reward mechanism that allows families to earn and open Pokémon packs. The system features different rarity tiers, configurable odds, and integration with the PokeAPI for accurate Pokémon data.

## Architecture

### Core Components

1. **PokeLootBox Class** (`components/lootbox/poke-lootbox.ts`)
   - Main class handling lootbox mechanics
   - Manages Pokémon data caching
   - Handles pack opening and odds calculation

2. **Loot Table** (`components/lootbox/pokemon-loot-table.ts`)
   - Defines available Pokémon per rarity tier
   - Configures initial Pokémon pools
   - Supports custom loot tables

3. **Box Configuration** (`components/lootbox/box-config.ts`)
   - Defines pack types and their properties
   - Configures rarity chances
   - Sets visual styling per pack type

4. **Test Interface** (`components/lootbox/poke-lootbox-test.tsx`)
   - UI for testing lootbox mechanics
   - Displays odds and previews
   - Simulates pack opening

### Database Schema

```sql
-- Family Lootbox Configuration
CREATE TYPE pokemon_rarity AS ENUM ('common', 'uncommon', 'rare', 'legendary');
CREATE TYPE reward_type AS ENUM ('poke_ball', 'great_ball', 'ultra_ball', 'master_ball');

CREATE TABLE family_lootboxes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  family_id UUID REFERENCES family_profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  rarity pokemon_rarity NOT NULL,
  cost_type reward_type NOT NULL,
  cost_amount INTEGER NOT NULL,
  buff_percentage DECIMAL NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lootbox Pokemon Pools
CREATE TABLE lootbox_pokemon_pools (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lootbox_id BIGINT REFERENCES family_lootboxes(id),
  pokemon_id INTEGER NOT NULL,
  rarity pokemon_rarity NOT NULL,
  weight DECIMAL NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lootbox Rewards History
CREATE TABLE lootbox_rewards (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  family_id UUID REFERENCES family_profiles(id),
  member_id UUID REFERENCES family_members(id),
  lootbox_id BIGINT REFERENCES family_lootboxes(id),
  pokemon_id INTEGER NOT NULL,
  rarity pokemon_rarity NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Pack Types & Rarities

### Default Pack Types

1. **Common PokéPack**
   - Color: `#A8A878` (Normal-type)
   - Base Chance: 100%
   - Contains: Basic Pokémon

2. **Great PokéPack**
   - Color: `#6890F0` (Water-type)
   - Base Chance: 20%
   - Contains: Evolved Pokémon

3. **Ultra PokéPack**
   - Color: `#A040A0` (Poison-type)
   - Base Chance: 3%
   - Contains: Rare Evolved Pokémon

4. **Master PokéPack**
   - Color: `#F8D030` (Electric-type)
   - Base Chance: 1%
   - Contains: Legendary Pokémon

### Default Pokémon Pools

```typescript
// Legendary Pool
- Mewtwo (ID: 150)
- Mew (ID: 151)
- Lugia (ID: 249)
- Ho-Oh (ID: 250)

// Rare Pool
- Dragonite (ID: 149)
- Tyranitar (ID: 248)
- Snorlax (ID: 143)
- Lapras (ID: 131)

// Uncommon Pool
- Pikachu (ID: 25)
- Eevee (ID: 133)
- Arcanine (ID: 59)
- Gyarados (ID: 130)

// Common Pool
- Pidgey (ID: 16)
- Rattata (ID: 19)
- Zubat (ID: 41)
- Magikarp (ID: 129)
```

## Usage

### Opening Packs

```typescript
const lootBox = new PokeLootBox()

// Open a single pack
const reward = await lootBox.openPack()

// Open multiple packs
const rewards = await lootBox.openMultiplePacks(5)
```

### Customizing Odds

```typescript
const lootBox = new PokeLootBox({
  buff: 0.1 // 10% increased chance for better rewards
})
```

### Getting Odds

```typescript
const odds = lootBox.getOdds()
// Returns:
{
  boxes: {
    common: 1,
    uncommon: 0.20,
    rare: 0.03,
    legendary: 0.01
  },
  items: {
    // Individual Pokémon chances
  }
}
```

### Previewing Rewards

```typescript
const legendaryPokemon = await lootBox.getPreview('legendary')
```

## Integration with Family System

1. **Earning Packs**
   - Complete chores and tasks
   - Achieve family goals
   - Special events and celebrations

2. **Pack Management**
   - Families can customize pack contents
   - Adjust odds for special occasions
   - Track reward history

3. **Reward Distribution**
   - Automatic reward crediting
   - Family-wide reward sharing
   - Special family member bonuses

## UI Components

### PokeLootBoxTest Component

```typescript
<PokeLootBoxTest />
```

Features:
- Pack type selection
- Multi-pack opening
- Odds display
- Reward preview
- Pokémon card display

### Styling

- Uses Pokémon type colors
- Responsive grid layout
- Animated pack opening
- Rarity indicators

## Best Practices

1. **Performance**
   - Cache Pokémon data
   - Batch API requests
   - Optimize image loading

2. **Fairness**
   - Transparent odds display
   - Guaranteed rarity thresholds
   - Pity timer system (future)

3. **User Experience**
   - Clear feedback
   - Engaging animations
   - Reward history
   - Achievement tracking

## Future Enhancements

1. **Planned Features**
   - Pity timer system
   - Special event packs
   - Collection bonuses
   - Trading system

2. **Technical Improvements**
   - Enhanced caching
   - Real-time updates
   - Analytics tracking
   - Advanced customization

## Troubleshooting

Common issues and solutions:

1. **Missing Pokémon Data**
   ```typescript
   // Ensure PokeAPI service is working
   await pokeApiService.getPokemonBatch([1, 2, 3])
   ```

2. **Incorrect Odds**
   ```typescript
   // Verify box configuration
   console.log(boxConfig.boxes)
   ```

3. **Cache Issues**
   ```typescript
   // Clear cache if needed
   pokemonCache.clear()
   ```

## Core Lootbox Library

The system is built on top of the `lootbox` npm package, which provides the core randomization and odds calculation functionality.

### Library Installation
```bash
npm install lootbox
```

### Library Structure

The library provides a `LootBox` class with the following key methods:

```typescript
class LootBox {
  constructor(
    lootTable: LootTable,
    boxes: BoxConfig[],
    buff: number = 0
  )

  // Choose a box based on rarity chances
  private chooseBox(): BoxConfig

  // Choose an item from the specified rarity pool
  private chooseLoot(rarity: string): LootItem

  // Open a single box and get a reward
  public open(buff?: number): {
    box: BoxConfig
    item: LootItem
  }

  // Open multiple boxes at once
  public openPack(size: number): Array<{
    box: BoxConfig
    item: LootItem
  }>

  // Calculate odds for boxes and items
  public determineOdds(): Array<{
    box: string
    chance: number
    items: Array<{
      item: string
      internalChance: number
      globalChance: number
    }>
  }>
}
```

### Configuration Types

#### Loot Table Structure
```typescript
interface LootTable {
  [key: string]: Array<{
    id: string
    label: string
    [key: string]: any  // Additional properties (e.g., pokemonId)
  }>
}
```

Example:
```typescript
const pokemonLootTable = {
  legendary: [
    { id: 'mewtwo', label: 'Mewtwo', pokemonId: 150 },
    { id: 'mew', label: 'Mew', pokemonId: 151 }
  ],
  rare: [
    { id: 'dragonite', label: 'Dragonite', pokemonId: 149 },
    { id: 'tyranitar', label: 'Tyranitar', pokemonId: 248 }
  ]
  // ... other rarities
}
```

#### Box Configuration
```typescript
interface BoxConfig {
  label: string    // Display name
  id: string       // Unique identifier
  color: string    // Visual styling
  chance: number   // Probability (0-1)
}

interface BoxConfigFile {
  boxes: BoxConfig[]
}
```

Example:
```typescript
const boxConfig = {
  boxes: [
    {
      label: 'Common PokéPack',
      id: 'common',
      color: '#A8A878',
      chance: 1
    },
    {
      label: 'Great PokéPack',
      id: 'uncommon',
      color: '#6890F0',
      chance: 0.20
    }
    // ... other box types
  ]
}
```

### Odds Calculation

The `determineOdds()` method returns detailed probability information:

```typescript
interface OddsResult {
  box: string          // Box identifier
  chance: number       // Box probability (percentage)
  items: Array<{
    item: string       // Item identifier
    internalChance: number  // Chance within the box
    globalChance: number    // Overall chance to get this item
  }>
}
```

Example odds calculation:
```typescript
const odds = lootBox.determineOdds()
// Returns:
[
  {
    box: 'legendary',
    chance: 1,  // 1%
    items: [
      {
        item: 'mewtwo',
        internalChance: 25,  // 25% within legendary box
        globalChance: 0.25   // 0.25% overall
      }
      // ... other items
    ]
  }
  // ... other boxes
]
```

### Integration with PokéLootBox

Our `PokeLootBox` class extends the base functionality:

1. **Type Safety**
   ```typescript
   export class PokeLootBox {
     private lootBox: LootBox
     private pokemonCache: Map<number, SimplifiedPokemon>

     constructor(options: PokeLootBoxOptions = {}) {
       this.lootBox = new LootBox(
         options.customLootTable || pokemonLootTable,
         options.customBoxConfig?.boxes || boxConfig.boxes,
         options.buff || 0
       )
     }
   }
   ```

2. **Enhanced Features**
   - Pokémon data caching
   - PokeAPI integration
   - Rarity determination
   - Preview functionality

3. **Error Handling**
   ```typescript
   public async openPack(): Promise<PokemonLootItem> {
     const { item } = this.lootBox.open()
     if (!item?.pokemonId) {
       throw new Error('Invalid loot item format')
     }
     // ... additional processing
   }
   ``` 