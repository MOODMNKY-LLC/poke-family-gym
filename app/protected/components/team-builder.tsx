'use client'

import { useState, useEffect, useMemo } from 'react'
import { PokemonClient } from 'pokenode-ts'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PokemonSpriteImage } from '@/components/pokemon/pokemon-sprite-image'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  Swords,
  Target,
  Zap,
  Heart,
  Plus,
  X,
  Search,
  Lock,
  Filter,
  SortAsc,
  Copy,
  FileDown,
  FileUp,
  Move,
  Trash,
  ChevronRight
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

// Create a singleton Pokemon client
const pokeClient = new PokemonClient()

// Define generations with their ranges
const GENERATIONS = {
  all: { name: 'All Generations', range: [1, 1010] },
  gen1: { name: 'Generation I', range: [1, 151] },
  gen2: { name: 'Generation II', range: [152, 251] },
  gen3: { name: 'Generation III', range: [252, 386] },
  gen4: { name: 'Generation IV', range: [387, 493] },
  gen5: { name: 'Generation V', range: [494, 649] },
  gen6: { name: 'Generation VI', range: [650, 721] },
  gen7: { name: 'Generation VII', range: [722, 809] },
  gen8: { name: 'Generation VIII', range: [810, 905] },
  gen9: { name: 'Generation IX', range: [906, 1010] }
} as const

// Sort options
const SORT_OPTIONS = {
  pokedex: { name: 'Pokédex Order', value: 'pokedex' },
  captured: { name: 'Captured First', value: 'captured' },
  name: { name: 'Name (A-Z)', value: 'name' }
} as const

interface PokemonTeamCard {
  nickname?: string
  pokemon: any // From PokeAPI
  level: number
  shiny?: boolean
  gender?: string
  item?: string
  ability: string
  moves: string[]
  stats: {
    hp?: number
    atk?: number
    def?: number
    spa?: number
    spd?: number
    spe?: number
    ev?: number
  }
}

interface TeamBuilderProps {
  memberId: string
  collection: any[] // Pokemon from personal collection
  onSave: (team: any) => void
  starterPokemonId?: number
}

export function TeamBuilder({ memberId, collection, onSave, starterPokemonId }: TeamBuilderProps) {
  const [teamName, setTeamName] = useState('')
  const [teamMembers, setTeamMembers] = useState<PokemonTeamCard[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGeneration, setSelectedGeneration] = useState<keyof typeof GENERATIONS>('all')
  const [sortOption, setSortOption] = useState<keyof typeof SORT_OPTIONS>('captured')
  const [allPokemon, setAllPokemon] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonTeamCard | null>(null)

  // Fetch all Pokémon on component mount
  useEffect(() => {
    async function fetchAllPokemon() {
      try {
        const gen = GENERATIONS[selectedGeneration]
        const [start, end] = gen.range
        
        // Get list of all Pokémon for the selected generation
        const response = await pokeClient.listPokemons(start - 1, end - start + 1)
        const pokemonList = await Promise.all(
          response.results.map(async (pokemon) => {
            const details = await pokeClient.getPokemonByName(pokemon.name)
            return details
          })
        )
        setAllPokemon(pokemonList)
      } catch (error) {
        console.error('Error fetching Pokémon:', error)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    fetchAllPokemon()
  }, [selectedGeneration])

  // Function to check if a Pokémon is in the collection
  function isInCollection(pokemonId: number) {
    return collection.some(p => p.pokemon.id === pokemonId)
  }

  // Function to get collection entry for a Pokémon
  function getCollectionEntry(pokemonId: number) {
    return collection.find(p => p.pokemon.id === pokemonId)
  }

  // Enhanced sorting function
  const sortedAndFilteredPokemon = useMemo(() => {
    let filtered = allPokemon.filter(pokemon => 
      pokemon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pokemon.id.toString().includes(searchQuery)
    )

    switch (sortOption) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name))
      case 'captured':
        return filtered.sort((a, b) => {
          // Starter Pokémon comes first
          if (a.id === starterPokemonId) return -1
          if (b.id === starterPokemonId) return 1
          
          // Then other captured Pokémon
          const aCollected = isInCollection(a.id)
          const bCollected = isInCollection(b.id)
          if (aCollected && !bCollected) return -1
          if (!aCollected && bCollected) return 1
          
          // Finally, sort by Pokédex number
          return a.id - b.id
        })
      case 'pokedex':
      default:
        return filtered.sort((a, b) => a.id - b.id)
    }
  }, [allPokemon, searchQuery, sortOption, starterPokemonId, collection])

  // Function to render stat bar
  function StatBar({ value, max = 252, label }: { value?: number, max?: number, label: string }) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-8 text-xs text-muted-foreground">{label}</span>
        <Progress value={value} max={max} className="flex-1 h-2" />
        <span className="w-8 text-xs text-right">{value || '-'}</span>
      </div>
    )
  }

  // Function to render Pokemon card in team format
  function TeamPokemonCard({ member, index }: { member: PokemonTeamCard, index: number }) {
    return (
      <div className="space-y-4 p-4 rounded-lg glass-effect glass-border">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={member.nickname || member.pokemon.name}
              onChange={e => updateMember(index, { nickname: e.target.value })}
              className="w-32 h-8"
            />
            <Badge variant="outline" className="capitalize">
              {member.gender || '-'}
            </Badge>
            {member.shiny && (
              <Badge variant="default" className="bg-yellow-500/20 text-yellow-500">
                Shiny
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Move className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => removePokemon(index)}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Item</Label>
            <Select value={member.item} onValueChange={value => updateMember(index, { item: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Add items from collection */}
                <SelectItem value="assault-vest">Assault Vest</SelectItem>
                <SelectItem value="life-orb">Life Orb</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ability</Label>
            <Select value={member.ability} onValueChange={value => updateMember(index, { ability: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select ability" />
              </SelectTrigger>
              <SelectContent>
                {member.pokemon.abilities.map((ability: any) => (
                  <SelectItem key={ability.ability.name} value={ability.ability.name}>
                    <span className="capitalize">{ability.ability.name.replace('-', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Moves */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Select 
              key={i}
              value={member.moves[i]} 
              onValueChange={value => {
                const newMoves = [...member.moves]
                newMoves[i] = value
                updateMember(index, { moves: newMoves })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Move ${i + 1}`} />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Add moves from PokeAPI */}
                <SelectItem value="earthquake">Earthquake</SelectItem>
                <SelectItem value="dragon-claw">Dragon Claw</SelectItem>
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <StatBar label="HP" value={member.stats.hp} />
          <StatBar label="Atk" value={member.stats.atk} />
          <StatBar label="Def" value={member.stats.def} />
          <StatBar label="SpA" value={member.stats.spa} />
          <StatBar label="SpD" value={member.stats.spd} />
          <StatBar label="Spe" value={member.stats.spe} />
        </div>
      </div>
    )
  }

  // Function to update a team member
  function updateMember(index: number, updates: Partial<PokemonTeamCard>) {
    setTeamMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, ...updates } : member
    ))
  }

  // Function to add a Pokemon to the team
  async function addPokemon(pokemonId: number) {
    const collectionEntry = getCollectionEntry(pokemonId)
    if (!collectionEntry) return

    const newMember: PokemonTeamCard = {
      pokemon: collectionEntry.pokemon,
      level: 100,
      ability: collectionEntry.ability || collectionEntry.pokemon.abilities[0].ability.name,
      moves: collectionEntry.moves || [],
      stats: {
        hp: 0,
        atk: 0,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 0
      }
    }

    setTeamMembers(prev => [...prev, newMember])
    setSelectedSlot(null)
  }

  // Function to remove a Pokemon from the team
  function removePokemon(index: number) {
    setTeamMembers(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Team name..."
            className="w-64"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileUp className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <Button onClick={() => onSave({ name: teamName, members: teamMembers })}>
          Save Team
        </Button>
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-2 gap-4">
        {teamMembers.map((member, index) => (
          <TeamPokemonCard key={index} member={member} index={index} />
        ))}
        {teamMembers.length < 6 && (
          <Button
            variant="outline"
            className="h-[200px]"
            onClick={() => setSelectedSlot(teamMembers.length)}
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Pokémon
          </Button>
        )}
      </div>

      {/* Pokemon Selection Modal */}
      {selectedSlot !== null && (
        <GlassCard className="fixed inset-4 z-50 overflow-hidden">
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add Pokémon to Team</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSlot(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Pokémon..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedGeneration} onValueChange={(value: keyof typeof GENERATIONS) => setSelectedGeneration(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENERATIONS).map(([key, gen]) => (
                    <SelectItem key={key} value={key}>
                      {gen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOption} onValueChange={(value: keyof typeof SORT_OPTIONS) => setSortOption(value)}>
                <SelectTrigger className="w-48">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-4 gap-4 p-4">
                  {isLoading ? (
                    <div className="col-span-4 text-center py-8">
                      Loading Pokémon...
                    </div>
                  ) : sortedAndFilteredPokemon.map(pokemon => {
                    const isCollected = isInCollection(pokemon.id)
                    const isStarter = pokemon.id === starterPokemonId
                    
                    return (
                      <div
                        key={pokemon.id}
                        className={cn(
                          "relative group rounded-lg overflow-hidden",
                          "border transition-all duration-200",
                          isCollected ? "cursor-pointer hover:ring-2 hover:ring-primary" : "opacity-50",
                          isStarter && "ring-2 ring-primary"
                        )}
                        onClick={() => isCollected && addPokemon(pokemon.id)}
                      >
                        <div className="aspect-square p-2">
                          <PokemonSpriteImage
                            src={pokemon.sprites.front_default}
                            alt={pokemon.name}
                            className="w-full h-full object-contain pixelated"
                          />
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium capitalize">
                              {pokemon.name}
                            </div>
                            {isStarter && (
                              <Badge variant="default" className="bg-primary/20 text-primary border-primary/20">
                                <Heart className="w-3 h-3 mr-1" fill="currentColor" />
                                Partner
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {pokemon.types.map((type: any) => (
                              <Badge key={type.type.name} variant="outline" className="capitalize text-xs">
                                {type.type.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {!isCollected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
} 