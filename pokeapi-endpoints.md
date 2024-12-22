# PokeAPI Endpoints Reference

Base URL: `https://pokeapi.co/api/v2/`

## Core Resources

### Pokémon
| Endpoint | Description |
|----------|-------------|
| `/pokemon/{id or name}/` | Comprehensive Pokémon data |
| `/pokemon-species/{id or name}/` | Species-specific data |
| `/pokemon-form/{id or name}/` | Alternate form data |
| `/pokemon-habitat/{id or name}/` | Habitat information |
| `/pokemon-color/{id or name}/` | Color classifications |
| `/pokemon-shape/{id or name}/` | Shape data |

### Attributes & Stats
| Endpoint | Description |
|----------|-------------|
| `/ability/{id or name}/` | Pokémon abilities |
| `/type/{id or name}/` | Type data and relationships |
| `/stat/{id or name}/` | Base stats information |
| `/nature/{id or name}/` | Nature effects and preferences |
| `/characteristic/{id or name}/` | Stat-based characteristics |
| `/pokeathlon-stat/{id or name}/` | Pokéathlon-specific stats |

### Evolution & Breeding
| Endpoint | Description |
|----------|-------------|
| `/evolution-chain/{id}/` | Complete evolution trees |
| `/evolution-trigger/{id or name}/` | Evolution conditions |
| `/egg-group/{id or name}/` | Breeding compatibility |
| `/gender/{id or name}/` | Gender ratios |
| `/growth-rate/{id or name}/` | Experience curves |

## Game Data

### Items
| Endpoint | Description |
|----------|-------------|
| `/item/{id or name}/` | Item details |
| `/item-attribute/{id or name}/` | Item attributes |
| `/item-category/{id or name}/` | Item categories |
| `/item-fling-effect/{id or name}/` | Fling move effects |
| `/item-pocket/{id or name}/` | Bag organization |

### Moves
| Endpoint | Description |
|----------|-------------|
| `/move/{id or name}/` | Move details |
| `/move-ailment/{id or name}/` | Status conditions |
| `/move-battle-style/{id or name}/` | Battle styles |
| `/move-category/{id or name}/` | Move categories |
| `/move-damage-class/{id or name}/` | Damage classifications |
| `/move-learn-method/{id or name}/` | Learning methods |
| `/move-target/{id or name}/` | Target specifications |

### Game Mechanics
| Endpoint | Description |
|----------|-------------|
| `/machine/{id}/` | TM/HM data |
| `/berry/{id or name}/` | Berry information |
| `/berry-firmness/{id or name}/` | Berry firmness |
| `/berry-flavor/{id or name}/` | Berry flavors |

### World Data
| Endpoint | Description |
|----------|-------------|
| `/location/{id or name}/` | Areas and routes |
| `/location-area/{id or name}/` | Specific location zones |
| `/pal-park-area/{id or name}/` | Pal Park areas |
| `/region/{id or name}/` | Game regions |

### Game Info
| Endpoint | Description |
|----------|-------------|
| `/generation/{id or name}/` | Game generations |
| `/pokedex/{id or name}/` | Regional Pokédex data |
| `/version/{id or name}/` | Game versions |
| `/version-group/{id or name}/` | Related versions |

### Encounters
| Endpoint | Description |
|----------|-------------|
| `/encounter-method/{id or name}/` | Pokémon encounter methods |
| `/encounter-condition/{id or name}/` | Encounter conditions |
| `/encounter-condition-value/{id or name}/` | Condition specifics |

### Contests
| Endpoint | Description |
|----------|-------------|
| `/contest-type/{id or name}/` | Contest categories |
| `/contest-effect/{id}/` | Contest move effects |
| `/super-contest-effect/{id}/` | Super contest effects |

## API Usage

### Pagination
- Use query parameters for resource lists:
  - `?limit=NUMBER` - Items per page
  - `?offset=NUMBER` - Skip N items

### Root Endpoint
- `/` - Returns API information and available endpoints

---

**Note**: Replace `{id or name}` with either a numeric ID or the resource name in lowercase.