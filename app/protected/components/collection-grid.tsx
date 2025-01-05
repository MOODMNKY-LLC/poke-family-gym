'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Filter, LayoutGrid, Table2, Heart } from 'lucide-react'
import { cn } from "@/lib/utils"
import { PokemonSpriteImage } from '@/components/pokemon/pokemon-sprite-image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SyncCollectionButton } from '@/app/protected/components/sync-collection-button'
import { CollectionPokemonCard } from '@/app/protected/components/collection-pokemon-card'
import { TYPE_COLORS } from '@/lib/constants'
import { PokemonClient, type Pokemon } from 'pokenode-ts'
import { createClient } from '@/utils/supabase/client'

interface CollectionPokemon {
  id: string
  member_id: string
  pokemon_form_id: number
  nickname: string | null
  level: number
  obtained_at: string
  is_starter: boolean | null
  is_favorite: boolean | null
  pokemon_form: {
    id: number
    name: string
    species: {
      id: number
      name: string
      generation_id: number
    }
  }
}

type EnrichedPokemon = Omit<Pokemon, 'id'> & {
  id: number
  collectionId: string | null
  nickname: string | null
  level: number | null
  obtained_at: string | null
  is_starter: boolean | null
  is_favorite: boolean | null
  is_collected: boolean
  generation_id: number
}

interface CollectionGridProps {
  collection: CollectionPokemon[]
  memberId: string
}

const TOTAL_POKEMON = 151 // For now, just show Gen 1
const GENERATIONS = [
  { id: 1, name: "Generation I", range: [1, 151] },
  { id: 2, name: "Generation II", range: [152, 251] },
  { id: 3, name: "Generation III", range: [252, 386] },
  { id: 4, name: "Generation IV", range: [387, 493] },
  { id: 5, name: "Generation V", range: [494, 649] },
]

type ViewMode = 'grid' | 'table'

export function CollectionGrid({ collection: initialCollection, memberId }: CollectionGridProps) {
  const [collection, setCollection] = useState<CollectionPokemon[]>(initialCollection)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedGeneration, setSelectedGeneration] = useState<number>(1)
  const [showCollectedOnly, setShowCollectedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string>('number')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [allPokemon, setAllPokemon] = useState<EnrichedPokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Fetch all Pokemon data for the selected generation
  useEffect(() => {
    async function fetchAllPokemon() {
      const api = new PokemonClient()
      const generation = GENERATIONS.find(g => g.id === selectedGeneration)
      if (!generation) return

      setIsLoading(true)
      
      try {
        const [start, end] = generation.range
        const pokemonPromises = []
        
        for (let i = start; i <= end; i++) {
          pokemonPromises.push(api.getPokemonById(i))
        }

        const pokemonData = await Promise.all(pokemonPromises)
        const collectedIds = new Set(collection.map(p => p.pokemon_form.species.id))

        console.log('Collection data:', {
          length: collection.length,
          firstEntry: collection[0],
          collectedIds: Array.from(collectedIds)
        })

        const enrichedPokemon = pokemonData.map(pokemon => {
          const collectionEntry = collection.find(
            c => c.pokemon_form.species.id === pokemon.id
          )

          console.log(`Enriching Pokemon ${pokemon.id} (${pokemon.name}):`, {
            inCollection: collectedIds.has(pokemon.id),
            collectionEntry: collectionEntry ? {
              id: collectionEntry.id,
              pokemon_form_id: collectionEntry.pokemon_form_id,
              species_id: collectionEntry.pokemon_form.species.id
            } : 'Not found'
          })

          const enriched = {
            ...pokemon,
            collectionId: collectionEntry?.id || null,
            nickname: collectionEntry?.nickname || null,
            level: collectionEntry?.level || null,
            obtained_at: collectionEntry?.obtained_at || null,
            is_starter: collectionEntry?.is_starter || false,
            is_favorite: collectionEntry?.is_favorite || false,
            is_collected: collectedIds.has(pokemon.id),
            generation_id: selectedGeneration
          }

          return enriched
        })

        console.log('Enriched Pokemon summary:', {
          total: enrichedPokemon.length,
          collected: enrichedPokemon.filter(p => p.is_collected).length,
          firstCollected: enrichedPokemon.find(p => p.is_collected)
        })

        setAllPokemon(enrichedPokemon)
      } catch (error) {
        console.error('Error fetching Pokemon:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllPokemon()
  }, [collection, selectedGeneration])

  // Filter and sort Pokemon
  const filteredAndSortedPokemon = useMemo(() => {
    if (!allPokemon.length) {
      console.log('No Pokemon in allPokemon')
      return []
    }

    let result = [...allPokemon]
    console.log('Starting with Pokemon:', result.length)
    console.log('Collection state:', collection)
    console.log('First few Pokemon in result:', result.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      isCollected: p.is_collected,
      collectionId: p.collectionId
    })))

    // Apply collected filter
    if (showCollectedOnly) {
      result = result.filter(pokemon => {
        const isCollected = pokemon.is_collected
        console.log(`Pokemon ${pokemon.id} (${pokemon.name}):`, {
          isCollected,
          collectionId: pokemon.collectionId,
          level: pokemon.level,
          obtainedAt: pokemon.obtained_at
        })
        return isCollected
      })
      console.log('After collected filter:', result.length, 'Pokemon')
      if (result.length > 0) {
        console.log('First collected Pokemon:', {
          id: result[0].id,
          name: result[0].name,
          isCollected: result[0].is_collected,
          collectionId: result[0].collectionId
        })
      }
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter(pokemon => {
        const hasType = pokemon.types.some(t => t.type.name === selectedType.toLowerCase())
        return hasType
      })
      console.log('After type filter:', result.length, 'Pokemon')
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'number':
          return a.id - b.id
        default:
          return a.id - b.id
      }
    })

    console.log('Final filtered and sorted Pokemon:', result.length)
    return result
  }, [allPokemon, selectedType, sortBy, showCollectedOnly, collection])

  const toggleFavorite = async (pokemonId: string) => {
    if (!pokemonId) return

    const pokemon = collection?.find(p => p.id === pokemonId)
    if (!pokemon) return

    const newFavoriteStatus = !pokemon.is_favorite

    try {
      const { error } = await supabase
        .from('personal_pokemon_collections')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', pokemonId)

      if (error) throw error

      setCollection(prev => 
        prev.map(p => 
          p.id === pokemonId 
            ? { ...p, is_favorite: newFavoriteStatus }
            : p
        )
      )
    } catch (error) {
      console.error('Error updating favorite status:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Collection ({collection.length} / {TOTAL_POKEMON} Pokémon)
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedType 
              ? `Showing ${selectedType} type Pokémon`
              : 'All Pokémon types'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'table' ? "default" : "outline"}
              className="rounded-r-none px-3"
              onClick={() => setViewMode('table')}
            >
              <Table2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              className="rounded-l-none px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Pokédex Number</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={selectedGeneration.toString()} 
            onValueChange={(value) => setSelectedGeneration(parseInt(value))}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select generation..." />
            </SelectTrigger>
            <SelectContent>
              {GENERATIONS.map(gen => (
                <SelectItem key={gen.id} value={gen.id.toString()}>
                  {gen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showCollectedOnly ? "default" : "outline"}
            onClick={() => setShowCollectedOnly(!showCollectedOnly)}
            className="h-9"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showCollectedOnly ? "Collected" : "All"}
          </Button>
          <SyncCollectionButton memberId={memberId} />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="outline"
          className={cn(
            "cursor-pointer",
            !selectedType && "bg-primary text-primary-foreground"
          )}
          onClick={() => setSelectedType(null)}
        >
          All Types
        </Badge>
        {Object.keys(TYPE_COLORS).map((type) => {
          const typeColor = TYPE_COLORS[type as keyof typeof TYPE_COLORS]
          const isSelected = selectedType === type
          return (
            <Badge 
              key={type}
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors hover:text-white",
                "hover:" + typeColor.bg,
                isSelected && typeColor.bg,
                isSelected && typeColor.text
              )}
              onClick={() => setSelectedType(type)}
            >
              <div className="capitalize">{type}</div>
            </Badge>
          )
        })}
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading Pokémon...
        </div>
      ) : filteredAndSortedPokemon.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <div className="max-w-sm mx-auto space-y-4">
            <p>No Pokémon Found</p>
            {showCollectedOnly && (
              <Button 
                variant="outline" 
                onClick={() => setShowCollectedOnly(false)}
              >
                Show All Pokémon
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAndSortedPokemon.map((pokemon) => (
            <CollectionPokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              onFavoriteToggle={pokemon.collectionId ? toggleFavorite : undefined}
            />
          ))}
        </div>
      ) : (
        // Table View
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Pokédex #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Types</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Obtained</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPokemon.map((pokemon) => (
                <TableRow key={pokemon.id}>
                  <TableCell className="font-medium">#{pokemon.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8">
                        <PokemonSpriteImage
                          src={pokemon.sprites.front_default || `/images/pokemon/${pokemon.id}.png`}
                          alt={pokemon.name}
                          className={cn(
                            "w-full h-full object-contain",
                            !pokemon.is_collected && "grayscale opacity-50"
                          )}
                        />
                      </div>
                      <span className="capitalize">
                        {pokemon.is_collected ? pokemon.nickname || pokemon.name : pokemon.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {pokemon.types.map((type) => {
                        const typeColor = TYPE_COLORS[type.type.name as keyof typeof TYPE_COLORS]
                        return (
                          <Badge 
                            key={type.type.name}
                            className={cn(
                              "capitalize text-[10px] px-1.5 py-0",
                              typeColor.bg,
                              typeColor.text
                            )}
                          >
                            {type.type.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pokemon.is_collected ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Collected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                        Undiscovered
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {pokemon.is_collected ? `Lv. ${pokemon.level}` : '-'}
                  </TableCell>
                  <TableCell>
                    {pokemon.is_collected ? new Date(pokemon.obtained_at!).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {pokemon.is_collected && pokemon.collectionId && (
                      <Button
                        size="icon"
                        variant={pokemon.is_favorite ? "default" : "ghost"}
                        className="h-7 w-7"
                        onClick={() => toggleFavorite(pokemon.collectionId!)}
                      >
                        <Heart 
                          className={cn(
                            "w-4 h-4",
                            pokemon.is_favorite && "fill-current"
                          )} 
                        />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 