import { Pokemon, PokemonClient, PokemonSpecies as PokemonSpeciesAPI } from "pokenode-ts"
import Image from "next/image"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Heart, 
  Swords, 
  Shield, 
  Zap, 
  FastForward, 
  Target,
  Trophy,
  Scale,
  Ruler,
  Dumbbell,
  ChevronRight,
  Sparkles,
  Gamepad2,
  Brain,
  ScrollText,
  Flame,
  Droplet,
  Leaf,
  Snowflake,
  Sword,
  Beaker,
  Mountain,
  Cloud,
  Eye,
  Bug as BugIcon,
  Circle,
  GhostIcon,
  Infinity,
  Moon,
  Hexagon,
} from "lucide-react"
import { typeColors } from "../lib/pokemon-types"
import Link from "next/link"

interface PokemonDetailsSheetProps {
  pokemon: Pokemon
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface PokemonGenus {
  genus: string
  language: {
    name: string
    url: string
  }
}

interface PokemonSpecies extends Omit<PokemonSpeciesAPI, 'flavor_text_entries'> {
  genera: PokemonGenus[]
  growth_rate: {
    name: string
    url: string
  }
  base_happiness: number
  capture_rate: number
  evolution_chain: {
    url: string
  }
  flavor_text_entries: Array<{
    flavor_text: string
    language: {
      name: string
      url: string
    }
    version: {
      name: string
      url: string
    }
  }>
}

function StatBar({ value, color }: { value: number, color: string }) {
  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
      {/* Base stat bar (0-100) */}
      <div
        className={cn(
          "h-full transition-all duration-500",
          color
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
      
      {/* Bonus stat bar (100-110) */}
      {value > 100 && (
        <div
          className={cn(
            "h-full transition-all duration-500 absolute right-0",
            color,
            "opacity-40" // Make bonus stats slightly transparent
          )}
          style={{ width: `${Math.min(value - 100, 10)}%` }}
        />
      )}
      
      {/* 100 mark divider */}
      <div className="absolute right-[9.09%] top-0 h-full w-0.5 bg-background/50" />
    </div>
  )
}

export function PokemonDetailsSheet({ pokemon, isOpen, onOpenChange }: PokemonDetailsSheetProps) {
  const [species, setSpecies] = useState<PokemonSpecies | null>(null)
  const [evolutionChain, setEvolutionChain] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add version filtering state
  const [selectedVersion, setSelectedVersion] = useState<string>("latest")
  const [selectedMoveMethod, setSelectedMoveMethod] = useState<string>("all")

  // Group moves by learn method
  const groupedMoves = pokemon.moves.reduce((acc, move) => {
    const method = move.version_group_details[0].move_learn_method.name
    if (!acc[method]) acc[method] = []
    acc[method].push(move)
    return acc
  }, {} as Record<string, typeof pokemon.moves>)

  useEffect(() => {
    async function fetchSpeciesData() {
      try {
        setIsLoading(true)
        const api = new PokemonClient()
        
        // Fetch species data and cast it to our interface
        const speciesData = await api.getPokemonSpeciesById(pokemon.id) as unknown as PokemonSpecies
        setSpecies(speciesData)

        // Fetch evolution chain
        const evolutionChainId = speciesData.evolution_chain.url.split('/').slice(-2, -1)[0]
        const evolutionResponse = await fetch(speciesData.evolution_chain.url)
        const evolutionData = await evolutionResponse.json()

        // Process evolution chain
        const processedEvolutions = await processEvolutionChain(evolutionData.chain)
        setEvolutionChain(processedEvolutions)
      } catch (error) {
        console.error("Error fetching Pokemon data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchSpeciesData()
    }
  }, [isOpen, pokemon.id])

  async function processEvolutionChain(chain: any) {
    const evolutions = []
    let current = chain
    const api = new PokemonClient()

    while (current) {
      const pokemonId = current.species.url.split('/').slice(-2, -1)[0]
      let pokemonData = null
      
      try {
        pokemonData = await api.getPokemonById(Number(pokemonId))
      } catch (error) {
        console.error(`Failed to fetch Pokemon data for ID ${pokemonId}`)
      }

      evolutions.push({
        id: pokemonId,
        name: current.species.name,
        sprite: pokemonData?.sprites.other?.["official-artwork"].front_default,
        details: current.evolution_details[0] || {},
        pokemon: pokemonData,
      })
      
      current = current.evolves_to[0]
    }
    
    return evolutions
  }

  // Get base stats total
  const baseStatsTotal = pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0)

  // Add type icon mapping
  const typeIcons = {
    normal: Circle,
    fire: Flame,
    water: Droplet,
    grass: Leaf,
    electric: Zap,
    ice: Snowflake,
    fighting: Sword,
    poison: Beaker,
    ground: Mountain,
    flying: Cloud,
    psychic: Brain,
    bug: BugIcon,
    rock: Mountain,
    ghost: GhostIcon,
    dragon: Infinity,
    dark: Moon,
    steel: Hexagon,
    fairy: Heart,
  } as const

  // Get the latest English flavor text
  const flavorText = species?.flavor_text_entries
    .filter(entry => entry.language.name === "en")
    .reverse()[0]?.flavor_text.replace(/\f/g, ' ')

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <ScrollArea className="h-full pr-4">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <span className="capitalize text-2xl">{pokemon.name}</span>
                  <Badge variant="outline">
                    #{String(pokemon.id).padStart(3, '0')}
                  </Badge>
                </SheetTitle>
                {species && (
                  <SheetDescription>
                    {species.genera.find((g: PokemonGenus) => g.language.name === "en")?.genus}
                  </SheetDescription>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {baseStatsTotal}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Base Stats Total</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Main Card with Types and Evolution Chain */}
            <Card className="overflow-hidden">
              {/* Pokemon Image and Types */}
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80" />
                <Image
                  src={pokemon.sprites.other?.["official-artwork"].front_default || ""}
                  alt={pokemon.name}
                  fill
                  className="object-contain p-4 transition-transform duration-300 hover:scale-105"
                  priority
                />
              </div>
              
              <div className="p-4 border-b">
                <div className="flex gap-2">
                  {pokemon.types.map((type) => (
                    <Badge
                      key={type.type.name}
                      className={cn(typeColors[type.type.name as keyof typeof typeColors])}
                    >
                      {type.type.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Evolution Chain */}
              {evolutionChain.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Evolution Line</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    {evolutionChain.map((evo, index) => (
                      <div key={evo.id} className="flex-1 flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center gap-2">
                          <div 
                            className={cn(
                              "relative w-16 h-16 rounded-lg",
                              evo.id === pokemon.id.toString() && "ring-2 ring-primary ring-offset-2"
                            )}
                          >
                            <Image
                              src={evo.sprite || ""}
                              alt={evo.name}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-medium capitalize text-sm">
                              {evo.name}
                            </p>
                            {evo.details.trigger && index > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {evo.details.min_level && (
                                  <p className="flex items-center justify-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Level {evo.details.min_level}
                                  </p>
                                )}
                                {evo.details.item && (
                                  <p className="flex items-center justify-center gap-1">
                                    <Gamepad2 className="h-3 w-3" />
                                    {evo.details.item.name.replace('-', ' ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {index < evolutionChain.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Description Card - Simplified */}
            {species && flavorText && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Description</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {flavorText}
                  </p>
                  
                  {/* Additional Pokemon Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                      <p className="text-sm">
                        {species.genera.find(g => g.language.name === "en")?.genus}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Habitat</h4>
                      <p className="text-sm capitalize">
                        {species.habitat?.name.replace('-', ' ') || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Shape</h4>
                      <p className="text-sm capitalize">
                        {species.shape?.name.replace('-', ' ') || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Color</h4>
                      <p className="text-sm capitalize">
                        {species.color?.name.replace('-', ' ') || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Enhanced Tabs with Stats First */}
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="moves">Moves</TabsTrigger>
                <TabsTrigger value="abilities">Abilities</TabsTrigger>
                <TabsTrigger value="breeding">Breeding</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
              </TabsList>

              {/* Stats Tab */}
              <TabsContent value="stats">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Base Stats</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {baseStatsTotal}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Base Stats Total</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-3">
                    {pokemon.stats.map((stat, index) => {
                      const statPercentage = (stat.base_stat / 110) * 100
                      const statColor = {
                        "hp": "bg-red-400",
                        "attack": "bg-orange-400",
                        "defense": "bg-blue-400",
                        "special-attack": "bg-purple-400",
                        "special-defense": "bg-green-400",
                        "speed": "bg-pink-400",
                      }[stat.stat.name] || "bg-neutral-400"

                      return (
                        <div key={stat.stat.name} className="grid grid-cols-8 gap-2 items-center">
                          <div className="col-span-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-sm font-medium capitalize">
                                  {stat.stat.name.replace('-', ' ')}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Base {stat.stat.name.replace('-', ' ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="col-span-1 text-sm text-right">
                            {stat.base_stat}
                          </div>
                          <div className="col-span-5">
                            <StatBar value={statPercentage} color={statColor} />
                          </div>
                        </div>
                      )
                    })}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Total</span>
                        <span>{baseStatsTotal}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Moves Tab */}
              <TabsContent value="moves">
                <Card>
                  <div className="p-4 border-b">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Moves</h3>
                        <Badge variant="secondary">
                          {pokemon.moves.length} Total
                        </Badge>
                      </div>
                      
                      {/* Move Filters */}
                      <div className="flex gap-2">
                        <select
                          className="text-sm rounded-md border bg-background px-3 py-1"
                          value={selectedMoveMethod}
                          onChange={(e) => setSelectedMoveMethod(e.target.value)}
                        >
                          <option value="all">All Methods</option>
                          {Object.keys(groupedMoves).map((method) => (
                            <option key={method} value={method}>
                              {method.replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px]">
                    <div className="p-4 space-y-2">
                      {(selectedMoveMethod === "all" 
                        ? pokemon.moves 
                        : groupedMoves[selectedMoveMethod] || []
                      ).map((move) => {
                        const learnDetails = move.version_group_details[0]
                        const methodColor = {
                          'level-up': 'bg-blue-500',
                          'egg': 'bg-green-500',
                          'tutor': 'bg-purple-500',
                          'machine': 'bg-orange-500',
                        }[learnDetails.move_learn_method.name] || 'bg-gray-500'

                        return (
                          <div
                            key={move.move.name}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                methodColor
                              )} />
                              <span className="capitalize">
                                {move.move.name.replace('-', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {learnDetails.level_learned_at > 0 && (
                                <Badge variant="outline">
                                  Lv. {learnDetails.level_learned_at}
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                {learnDetails.move_learn_method.name}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              {/* Abilities Tab */}
              <TabsContent value="abilities">
                <Card className="p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {pokemon.abilities.map((ability) => (
                      <AccordionItem key={ability.ability.name} value={ability.ability.name}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">
                              {ability.ability.name.replace('-', ' ')}
                            </span>
                            {ability.is_hidden && (
                              <Badge variant="outline" className="ml-2">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <p className="text-muted-foreground">
                              {/* Fetch and display ability description */}
                              This is {pokemon.name}'s {ability.is_hidden ? 'hidden' : 'regular'} ability.
                            </p>
                            {ability.is_hidden && (
                              <p className="text-sm text-muted-foreground">
                                Hidden abilities are special abilities that were introduced in Generation V.
                              </p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </TabsContent>

              {/* Breeding Tab */}
              <TabsContent value="breeding">
                <Card className="p-4 space-y-4">
                  {species && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Egg Groups
                        </h4>
                        <div className="flex gap-2">
                          {species.egg_groups.map((group: any) => (
                            <Badge key={group.name} variant="secondary">
                              {group.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Gender Ratio
                        </h4>
                        {species.gender_rate === -1 ? (
                          <Badge>Genderless</Badge>
                        ) : (
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ 
                                width: `${((8 - species.gender_rate) / 8) * 100}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Hatch Time
                        </h4>
                        <p>{species.hatch_counter * 257} steps</p>
                      </div>
                    </>
                  )}
                </Card>
              </TabsContent>

              {/* Training Tab */}
              <TabsContent value="training">
                <Card className="p-4 space-y-4">
                  {species && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Base Experience
                        </h4>
                        <p>{pokemon.base_experience} EXP</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Base Happiness
                        </h4>
                        <Progress 
                          value={(species.base_happiness / 255) * 100}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Catch Rate
                        </h4>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(species.capture_rate / 255) * 100}
                            className="h-2"
                          />
                          <span className="text-sm">
                            {((species.capture_rate / 255) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Growth Rate
                        </h4>
                        <Badge variant="secondary" className="capitalize">
                          {species.growth_rate.name.replace('-', ' ')}
                        </Badge>
                      </div>

                      {/* Add EV Yields */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          EV Yields
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {pokemon.stats.filter(stat => stat.effort > 0).map((stat) => (
                            <div key={stat.stat.name} className="flex items-center gap-2">
                              <span className="capitalize text-sm">
                                {stat.stat.name.replace('-', ' ')}:
                              </span>
                              <Badge variant="secondary">+{stat.effort}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add Location Areas if available */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Location Areas
                        </h4>
                        <div className="text-sm">
                          <Link 
                            href={`https://pokeapi.co${pokemon.location_area_encounters}`}
                            className="text-primary hover:underline"
                            target="_blank"
                          >
                            View encounter locations
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </TabsContent>

              {/* Add new Version History Tab */}
              <TabsContent value="versions">
                <Card>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Version History</h3>
                      <Badge variant="secondary">
                        {species?.flavor_text_entries.filter(entry => entry.language.name === "en").length || 0} Entries
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-4">
                      {species?.flavor_text_entries
                        .filter(entry => entry.language.name === "en")
                        .reverse()
                        .map((entry, index) => (
                          <div key={index} className="space-y-2">
                            <Badge variant="outline" className="capitalize">
                              {entry.version.name.replace('-', ' ')}
                            </Badge>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {entry.flavor_text.replace(/\f/g, ' ')}
                            </p>
                            {index < species.flavor_text_entries.length - 1 && (
                              <Separator className="my-2" />
                            )}
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Version Tags moved to bottom */}
            {pokemon.game_indices.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Game Appearances</h3>
                <div className="flex flex-wrap gap-2">
                  {pokemon.game_indices.map((index) => (
                    <Badge 
                      key={index.version.name}
                      variant="outline" 
                      className="text-xs capitalize"
                    >
                      {index.version.name.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 