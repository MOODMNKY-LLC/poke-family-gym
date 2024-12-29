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
    <div className="h-1.5 sm:h-2 w-full bg-muted rounded-full overflow-hidden relative">
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
            "opacity-40"
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
      <SheetContent side="right" className="w-full sm:max-w-xl p-4 sm:p-6">
        <ScrollArea className="h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] pr-2 sm:pr-4">
          <SheetHeader className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <span className="capitalize text-xl sm:text-2xl">{pokemon.name}</span>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    #{String(pokemon.id).padStart(3, '0')}
                  </Badge>
                </SheetTitle>
                {species?.genera.find(g => g.language.name === "en")?.genus && (
                  <SheetDescription className="text-xs sm:text-sm mt-1">
                    {species.genera.find(g => g.language.name === "en")?.genus}
                  </SheetDescription>
                )}
              </div>
              <div className="flex gap-1 sm:gap-2">
                {pokemon.types.map((type) => {
                  const TypeIcon = typeIcons[type.type.name as keyof typeof typeIcons] || Circle
                  return (
                    <Badge
                      key={type.type.name}
                      className={cn(
                        "text-xs sm:text-sm capitalize",
                        typeColors[type.type.name as keyof typeof typeColors]
                      )}
                    >
                      <TypeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {type.type.name}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Pokemon Image */}
            <div className="relative aspect-square w-full max-w-[240px] mx-auto">
              <Image
                src={pokemon.sprites.other?.["official-artwork"].front_default || pokemon.sprites.front_default || "/placeholder-pokemon.png"}
                alt={pokemon.name}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Description */}
            {flavorText && (
              <Card className="p-3 sm:p-4 text-xs sm:text-sm bg-muted/50">
                {flavorText}
              </Card>
            )}
          </SheetHeader>

          <Tabs defaultValue="stats" className="mt-4 sm:mt-6">
            <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10 text-xs sm:text-sm">
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="evolution">Evolution</TabsTrigger>
              <TabsTrigger value="moves">Moves</TabsTrigger>
            </TabsList>

            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <TabsContent value="stats" className="space-y-4">
                {/* Base Stats */}
                <div className="space-y-3">
                  {pokemon.stats.map((stat, index) => {
                    const statName = stat.stat.name.replace(/-/g, ' ')
                    const StatIcon = index === 0 ? Heart
                      : index === 1 ? Swords
                      : index === 2 ? Shield
                      : index === 3 ? Brain
                      : index === 4 ? FastForward
                      : Target

                    return (
                      <div key={stat.stat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <StatIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="capitalize">{statName}</span>
                          </div>
                          <span>{stat.base_stat}</span>
                        </div>
                        <StatBar
                          value={(stat.base_stat / 255) * 100}
                          color={
                            index === 0 ? "bg-red-400"
                            : index === 1 ? "bg-orange-400"
                            : index === 2 ? "bg-yellow-400"
                            : index === 3 ? "bg-blue-400"
                            : index === 4 ? "bg-green-400"
                            : "bg-purple-400"
                          }
                        />
                      </div>
                    )
                  })}

                  <Separator />
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium">Total</span>
                    <span>{baseStatsTotal}</span>
                  </div>
                </div>
              </TabsContent>

              {/* Rest of the tabs content with similar responsive adjustments */}
              {/* ... */}
            </div>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 