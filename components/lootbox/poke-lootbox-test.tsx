'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PokeLootBox } from './poke-lootbox'
import { 
  PokemonLootItem, 
  LootBoxPokemon, 
  pokemonLootTable,
  type PokemonRarity 
} from './pokemon-loot-table'
import { boxConfig, BoxConfig } from './box-config'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { PokemonClient, EvolutionClient, type Pokemon, type PokemonSpecies, type EvolutionChain } from 'pokenode-ts'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Initialize PokeAPI clients
const pokeApi = new PokemonClient()
const evolutionApi = new EvolutionClient()

interface FamilyLootbox {
  id: number
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'secret_rare' | 'special_rare' | 'hyper_rare' | 'crown_rare'
  cost_amount: number
  cost_type: string
  buff_percentage: number
  is_active: boolean
  symbol?: string
  guaranteed_slots?: number
  max_per_pack?: number
}

interface LootBoxOdds {
  boxes: { [key: string]: number }
  items: { [key: string]: number }
}

type BoxConfigWithBoxes = {
  boxes: Array<BoxConfig>
}

const typedBoxConfig = boxConfig as unknown as BoxConfigWithBoxes

interface ExtendedPokemonData extends PokemonLootItem {
  species?: PokemonSpecies
  evolutionChain?: EvolutionChain
  abilities?: Pokemon['abilities']
  moves?: Pokemon['moves']
}

export function PokeLootBoxTest() {
  const [results, setResults] = useState<PokemonLootItem[]>([])
  const [selectedBox, setSelectedBox] = useState<number | null>(null)
  const [packSize, setPackSize] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<PokemonLootItem[]>([])
  const [odds, setOdds] = useState<LootBoxOdds>({ boxes: {}, items: {} })
  const [familyLootboxes, setFamilyLootboxes] = useState<FamilyLootbox[]>([])
  const [isLoadingLootboxes, setIsLoadingLootboxes] = useState(true)
  const [lootBox, setLootBox] = useState<PokeLootBox | null>(null)
  const [extendedData, setExtendedData] = useState<{ [key: string]: ExtendedPokemonData }>({})

  // Load family lootboxes
  useEffect(() => {
    const loadLootboxes = async () => {
      try {
        const supabase = createClient()
        
        // Get current user's family ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: familyMember, error: memberError } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('id', user.id)
          .single()

        if (memberError) throw memberError
        if (!familyMember?.family_id) throw new Error('No family found')

        // Load active lootboxes
        const { data: lootboxData, error: lootboxError } = await supabase
          .from('family_lootboxes')
          .select('*')
          .eq('family_id', familyMember.family_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (lootboxError) throw lootboxError
        setFamilyLootboxes(lootboxData || [])

        // Set first lootbox as selected if available
        if (lootboxData && lootboxData.length > 0) {
          setSelectedBox(lootboxData[0].id)
        }

      } catch (error: any) {
        console.error('Error loading lootboxes:', error)
        toast.error(error.message || 'Failed to load lootboxes')
      } finally {
        setIsLoadingLootboxes(false)
      }
    }

    loadLootboxes()
  }, [])

  // Initialize lootbox when selection changes
  useEffect(() => {
    const initializeLootBox = async () => {
      if (!selectedBox) return

      try {
        const selectedLootbox = familyLootboxes.find(box => box.id === selectedBox)
        if (!selectedLootbox) throw new Error('Selected lootbox not found')

        const supabase = createClient()
        
        // Get the Pokémon pool for this lootbox
        const { data: poolData, error: poolError } = await supabase
          .from('lootbox_pokemon_pools')
          .select('pokemon_id, pokemon_name, rarity, weight, variant, is_shiny')
          .eq('lootbox_id', selectedBox)

        if (poolError) throw poolError

        // Create a custom loot table based on the pool data
        const customLootTable: typeof pokemonLootTable = {
          common: [],
          uncommon: [],
          rare: [],
          ultra_rare: [],
          secret_rare: [],
          special_rare: [],
          hyper_rare: [],
          crown_rare: []
        }

        // Populate the custom loot table
        poolData?.forEach(pool => {
          const rarity = pool.rarity as PokemonRarity
          
          // For special_rare, we need to ensure variant is present
          if (rarity === 'special_rare' && !pool.variant) {
            console.warn(`Skipping special rare Pokémon ${pool.pokemon_name} without variant`)
            return
          }

          const pokemon = {
            id: pool.pokemon_id.toString(),
            label: pool.pokemon_name,
            pokemonId: pool.pokemon_id,
            ...(pool.is_shiny ? { shiny: pool.is_shiny } : {}),
            ...(rarity === 'special_rare' ? { variant: pool.variant } : {})
          }
          
          // Add the Pokémon to its rarity pool
          if (rarity in customLootTable) {
            // Type assertion needed because TypeScript doesn't know about the variant check above
            customLootTable[rarity].push(pokemon as any)
          }
        })

        // For each empty pool, use the default pool from pokemonLootTable
        Object.keys(customLootTable).forEach(rarity => {
          const rarityKey = rarity as PokemonRarity
          if (customLootTable[rarityKey].length === 0) {
            if (rarityKey === 'special_rare') {
              // Special rare Pokémon must have variants
              customLootTable[rarityKey] = pokemonLootTable[rarityKey].map(pokemon => ({
                ...pokemon,
                variant: pokemon.variant || 'normal'
              }))
            } else {
              customLootTable[rarityKey] = pokemonLootTable[rarityKey]
            }
          }
        })

        // Create new loot box with the custom table
        const newLootBox = new PokeLootBox({
          customLootTable,
          buff: selectedLootbox.buff_percentage
        })

        setLootBox(newLootBox)

        // Calculate odds
        const oddsData = newLootBox.getOdds()
        setOdds({
          boxes: oddsData.reduce((acc, box) => ({ ...acc, [box.box]: box.chance }), {}),
          items: oddsData.reduce((acc, box) => ({
            ...acc,
            ...box.items.reduce((itemAcc, item) => ({
              ...itemAcc,
              [item.item]: item.globalChance
            }), {})
          }), {})
        })

        // Load preview
        const previewData = await newLootBox.getPreview(selectedLootbox.rarity)
        setPreview(previewData)

      } catch (error: any) {
        console.error('Error initializing lootbox:', error)
        toast.error(error.message || 'Failed to initialize lootbox')
      }
    }

    initializeLootBox()
  }, [selectedBox, familyLootboxes])

  // Function to fetch extended Pokémon data
  const fetchExtendedData = async (pokemon: PokemonLootItem) => {
    try {
      // Get species data
      const species = await pokeApi.getPokemonSpeciesByName(pokemon.name)
      
      // Get evolution chain
      const evolutionChainId = species.evolution_chain.url.split('/').filter(Boolean).pop()
      const evolutionChain = evolutionChainId 
        ? await evolutionApi.getEvolutionChainById(parseInt(evolutionChainId))
        : undefined

      // Get full Pokémon data for abilities and moves
      const fullData = await pokeApi.getPokemonByName(pokemon.name)

      setExtendedData(prev => ({
        ...prev,
        [pokemon.id]: {
          ...pokemon,
          species,
          evolutionChain,
          abilities: fullData.abilities,
          moves: fullData.moves
        }
      }))
    } catch (error) {
      console.error(`Error fetching extended data for ${pokemon.name}:`, error)
    }
  }

  const handleOpenPack = async () => {
    if (!lootBox || !selectedBox) {
      toast.error('Please select a lootbox first')
      return
    }

    setIsLoading(true)
    try {
      const selectedLootbox = familyLootboxes.find(box => box.id === selectedBox)
      if (!selectedLootbox) throw new Error('Selected lootbox not found')

      const packResults = []
      for (let i = 0; i < packSize; i++) {
        const result = await lootBox.openPack(selectedLootbox.max_per_pack || 5)
        packResults.push(...result)
      }
      setResults(packResults)

      // Fetch extended data for each Pokémon
      await Promise.all(packResults.map(pokemon => fetchExtendedData(pokemon)))
    } catch (error: any) {
      console.error('Failed to open pack:', error)
      toast.error(error.message || 'Failed to open pack')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBoxChange = async (boxId: string) => {
    setSelectedBox(parseInt(boxId))
  }

  // Sort lootboxes in the correct order
  const sortedLootboxes = [...familyLootboxes].sort((a, b) => {
    const order = {
      'poke_ball': 1,
      'great_ball': 2,
      'ultra_ball': 3,
      'master_ball': 4
    }
    return (order[a.cost_type as keyof typeof order] || 0) - (order[b.cost_type as keyof typeof order] || 0)
  })

  if (isLoadingLootboxes) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (familyLootboxes.length === 0) {
    return (
      <div className="p-4">
        <p className="text-center text-muted-foreground">
          No active lootboxes found. Please create and activate some lootboxes first.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">PokéPack Test System</h2>
      
      <Tabs defaultValue={sortedLootboxes[0]?.id.toString()} className="w-full">
        <TabsList className="w-full">
          {sortedLootboxes.map(box => (
            <TabsTrigger 
              key={box.id} 
              value={box.id.toString()}
              className="flex items-center gap-2"
              onClick={() => handleBoxChange(box.id.toString())}
            >
              {box.symbol} {box.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedLootboxes.map(box => (
          <TabsContent key={box.id} value={box.id.toString()} className="space-y-4">
            {/* Pack Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Pack Info</h3>
              <div className="p-4 border rounded space-y-2">
                <p><strong>Cost:</strong> {box.cost_amount} {box.cost_type}</p>
                <p><strong>Guaranteed:</strong> {box.guaranteed_slots || 0} {box.rarity} slots</p>
                <p><strong>Max per pack:</strong> {box.max_per_pack || 'No limit'}</p>
                <p><strong>Buff:</strong> {(box.buff_percentage * 100).toFixed(1)}% increased chances</p>
              </div>
            </div>

            {/* Pack Size Selection */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Number of Packs</h3>
              <input 
                type="number"
                min="1"
                max="10"
                value={packSize}
                onChange={(e) => setPackSize(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Open Pack Button */}
            <button
              onClick={handleOpenPack}
              disabled={isLoading}
              className="w-full p-2 text-white rounded disabled:opacity-50"
              style={{ backgroundColor: getBoxColor(box.rarity) }}
            >
              {isLoading ? 'Opening...' : `Open ${packSize} Pack${packSize > 1 ? 's' : ''}`}
            </button>

            {/* Results Display */}
            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((pokemon, index) => (
                    <EnhancedPokemonCard 
                      key={`${pokemon.id}-${index}`}
                      pokemon={pokemon}
                      extendedData={extendedData[pokemon.id]}
                      boxColor={getBoxColor(box.rarity)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Preview Section */}
            {preview.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Possible Rewards</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {preview.map((pokemon) => (
                    <PokemonCard 
                      key={pokemon.id}
                      pokemon={pokemon}
                      boxColor={getBoxColor(box.rarity)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Odds Display */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Current Odds</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Box Type Odds */}
                <div className="p-4 space-y-2 bg-zinc-800 rounded-lg border border-zinc-700">
                  <h4 className="font-medium text-white">Pack Type Chances</h4>
                  {odds?.boxes && Object.entries(odds.boxes).map(([boxId, chance]) => {
                    const config = typedBoxConfig.boxes.find((box: BoxConfig) => box.id === boxId)
                    return (
                      <div 
                        key={boxId}
                        className="flex items-center justify-between p-2 bg-zinc-900 rounded-md border border-zinc-700"
                      >
                        <span className="capitalize text-white">{config?.label || boxId}</span>
                        <span 
                          className="px-2 py-1 text-xs text-white rounded"
                          style={{ backgroundColor: getBoxColor(boxId as any) }}
                        >
                          {(Number(chance) * 100).toFixed(2)}%
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Individual Pokémon Odds */}
                <div className="p-4 space-y-2 bg-zinc-800 rounded-lg border border-zinc-700">
                  <h4 className="font-medium text-white">Pokémon Chances</h4>
                  <div className="max-h-48 space-y-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-900">
                    {odds?.items && Object.entries(odds.items).map(([itemId, chance]) => {
                      return (
                        <div 
                          key={itemId}
                          className="flex items-center justify-between p-2 bg-zinc-900 rounded-md border border-zinc-700"
                        >
                          <span className="capitalize text-white">Pokémon #{itemId}</span>
                          <span 
                            className="px-2 py-1 text-xs text-white rounded"
                            style={{ backgroundColor: getBoxColor(box.rarity) }}
                          >
                            {(Number(chance) * 100).toFixed(2)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function EnhancedPokemonCard({ 
  pokemon, 
  extendedData,
  boxColor 
}: { 
  pokemon: PokemonLootItem
  extendedData?: ExtendedPokemonData
  boxColor: string 
}) {
  const maxStat = 255

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="pokemon-details">
        <AccordionTrigger>
          <div className="flex items-center space-x-2 w-full">
            {pokemon.sprites.front_default && (
              <div className="relative w-16 h-16">
                <Image
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-base font-semibold capitalize">{pokemon.name}</h4>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {pokemon.types.map(type => (
                  <span 
                    key={type}
                    className="px-1.5 py-0.5 text-xs rounded capitalize"
                    style={{ 
                      backgroundColor: getPokemonTypeColor(type),
                      color: 'white'
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <span 
              className="px-2 py-0.5 text-xs rounded-full"
              style={{ 
                backgroundColor: boxColor,
                color: 'white'
              }}
            >
              {pokemon.rarity}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-2 space-y-4">
            {/* Pokédex Entry */}
            {extendedData?.species && (
              <div className="space-y-1">
                <h5 className="text-sm font-semibold">Pokédex Entry</h5>
                <p className="text-xs text-muted-foreground">
                  {extendedData.species.flavor_text_entries
                    .find(entry => entry.language.name === 'en')
                    ?.flavor_text.replace(/\f/g, ' ')}
                </p>
              </div>
            )}

            {/* Stats with Progress Bars */}
            <div className="space-y-1">
              <h5 className="text-sm font-semibold">Base Stats</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span>HP</span>
                    <span>{pokemon.stats.hp}</span>
                  </div>
                  <Progress value={(pokemon.stats.hp / maxStat) * 100} className="h-1.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span>Attack</span>
                    <span>{pokemon.stats.attack}</span>
                  </div>
                  <Progress value={(pokemon.stats.attack / maxStat) * 100} className="h-1.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span>Defense</span>
                    <span>{pokemon.stats.defense}</span>
                  </div>
                  <Progress value={(pokemon.stats.defense / maxStat) * 100} className="h-1.5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span>Speed</span>
                    <span>{pokemon.stats.speed}</span>
                  </div>
                  <Progress value={(pokemon.stats.speed / maxStat) * 100} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Abilities */}
            {extendedData?.abilities && (
              <div className="space-y-1">
                <h5 className="text-sm font-semibold">Abilities</h5>
                <div className="grid grid-cols-2 gap-1">
                  {extendedData.abilities.map(ability => (
                    <div 
                      key={ability.ability.name}
                      className="p-1 rounded bg-muted text-xs"
                    >
                      <span className="capitalize">{ability.ability.name.replace('-', ' ')}</span>
                      {ability.is_hidden && (
                        <span className="ml-1 text-[10px] text-muted-foreground">(Hidden)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evolution Chain */}
            {extendedData?.evolutionChain && (
              <div className="space-y-1">
                <h5 className="text-sm font-semibold">Evolution Chain</h5>
                <div className="flex items-center justify-center space-x-2">
                  <EvolutionChainDisplay chain={extendedData.evolutionChain.chain} />
                </div>
              </div>
            )}

            {/* Moves */}
            {extendedData?.moves && (
              <div className="space-y-1">
                <h5 className="text-sm font-semibold">Moves</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                  {extendedData.moves.slice(0, 8).map(move => (
                    <div 
                      key={move.move.name}
                      className="p-1 text-xs rounded bg-muted"
                    >
                      <span className="capitalize">{move.move.name.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function EvolutionChainDisplay({ chain }: { chain: EvolutionChain['chain'] }) {
  const renderEvolutionNode = (node: typeof chain) => {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-center">
          <span className="capitalize">{node.species.name}</span>
          {node.evolution_details[0]?.min_level && (
            <div className="text-xs text-muted-foreground">
              Level {node.evolution_details[0].min_level}
            </div>
          )}
        </div>
        {node.evolves_to.length > 0 && (
          <>
            <ChevronDown className="rotate-90" />
            {node.evolves_to.map((evolution, index) => (
              <div key={index}>
                {renderEvolutionNode(evolution)}
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return renderEvolutionNode(chain)
}

function PokemonCard({ pokemon, boxColor }: { pokemon: PokemonLootItem; boxColor: string }) {
  return (
    <div 
      className="p-2 border rounded-lg shadow-sm"
      style={{ borderColor: boxColor }}
    >
      {pokemon.sprites.front_default && (
        <div className="relative w-16 h-16 mx-auto">
          <Image
            src={pokemon.sprites.front_default}
            alt={pokemon.name}
            fill
            className="object-contain"
          />
        </div>
      )}
      <div className="mt-1 text-center">
        <h4 className="text-base font-semibold capitalize">{pokemon.name}</h4>
        <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
          {pokemon.types.map(type => (
            <span 
              key={type}
              className="px-1.5 py-0.5 text-xs rounded capitalize"
              style={{ 
                backgroundColor: getPokemonTypeColor(type),
                color: 'white'
              }}
            >
              {type}
            </span>
          ))}
        </div>
        <div className="mt-1 text-xs">
          <div className="grid grid-cols-2 gap-0.5">
            <div>HP: {pokemon.stats.hp}</div>
            <div>ATK: {pokemon.stats.attack}</div>
            <div>DEF: {pokemon.stats.defense}</div>
            <div>SPD: {pokemon.stats.speed}</div>
          </div>
        </div>
        <div className="mt-1">
          <span 
            className="px-2 py-0.5 text-xs rounded-full"
            style={{ 
              backgroundColor: boxColor,
              color: 'white'
            }}
          >
            {pokemon.rarity}
          </span>
        </div>
      </div>
    </div>
  )
}

function getBoxColor(rarity: string): string {
  const colors: { [key: string]: string } = {
    common: '#A8A878',      // Normal-type color
    uncommon: '#6890F0',    // Water-type color
    rare: '#A040A0',        // Poison-type color
    ultra_rare: '#F8D030',  // Electric-type color
    secret_rare: '#B8A038', // Rock-type color
    special_rare: '#705898', // Ghost-type color
    hyper_rare: '#7038F8',  // Dragon-type color
    crown_rare: '#B8B8D0'   // Steel-type color
  }
  return colors[rarity.toLowerCase()] || '#68A090'
}

function getPokemonTypeColor(type: string): string {
  const colors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  }
  return colors[type.toLowerCase()] || '#68A090'
} 