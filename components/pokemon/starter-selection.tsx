"use client"

import { useState, useEffect } from "react"
import { PokemonClient } from "pokenode-ts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { StarterCard } from "./starter-card"
import { motion, AnimatePresence } from "framer-motion"
import { StarterPokemon } from "./starter-card"

// Map of generations to their starter Pokemon IDs
const STARTER_POKEMON = {
  1: [1, 4, 7],      // Bulbasaur, Charmander, Squirtle
  2: [152, 155, 158], // Chikorita, Cyndaquil, Totodile
  3: [252, 255, 258], // Treecko, Torchic, Mudkip
  4: [387, 390, 393], // Turtwig, Chimchar, Piplup
  5: [495, 498, 501], // Snivy, Tepig, Oshawott
  6: [650, 653, 656], // Chespin, Fennekin, Froakie
  7: [722, 725, 728], // Rowlet, Litten, Popplio
  8: [810, 813, 816], // Grookey, Scorbunny, Sobble
  9: [906, 909, 912], // Sprigatito, Fuecoco, Quaxly
} as const

interface StarterSelectionProps {
  onSelect: (formId: number, nickname: string) => void
  selectedGeneration?: number
}

export function StarterSelection({ onSelect, selectedGeneration = 1 }: StarterSelectionProps) {
  const [generation, setGeneration] = useState(selectedGeneration)
  const [starters, setStarters] = useState<StarterPokemon[]>([])
  const [selectedStarter, setSelectedStarter] = useState<StarterPokemon | null>(null)
  const [nickname, setNickname] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSelecting, setIsSelecting] = useState(false)

  useEffect(() => {
    async function fetchStarters() {
      setIsLoading(true)
      try {
        const api = new PokemonClient()
        const starterIds = STARTER_POKEMON[generation as keyof typeof STARTER_POKEMON]
        
        const pokemonData = await Promise.all(
          starterIds.map(async (id) => {
            const [pokemon, species] = await Promise.all([
              api.getPokemonById(id),
              api.getPokemonSpeciesById(id)
            ])

            const genus = species.genera.find(g => g.language.name === "en")?.genus || "Unknown"
            
            const generationNum = parseInt(species.generation.url.split('/').slice(-2, -1)[0])

            const flavorText = species.flavor_text_entries
              .find(entry => entry.language.name === "en")
              ?.flavor_text.replace(/\f/g, ' ') || ""

            return {
              id: pokemon.id,
              name: pokemon.name,
              spriteUrl: pokemon.sprites.other?.["official-artwork"].front_default || 
                        pokemon.sprites.front_default || 
                        `/fallback-pokemon-${id}.png`,
              types: pokemon.types.map(t => t.type.name),
              height: pokemon.height,
              weight: pokemon.weight,
              category: genus,
              generation: generationNum,
              description: flavorText,
              stats: pokemon.stats.map(s => ({
                name: s.stat.name,
                base: s.base_stat
              })),
              abilities: pokemon.abilities
                .filter(a => !a.is_hidden)
                .map(a => a.ability.name)
            } satisfies StarterPokemon
          })
        )
        
        setStarters(pokemonData)
      } catch (error) {
        toast.error("Failed to load starter Pokémon")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStarters()
  }, [generation])

  const handleGenerationChange = (value: string) => {
    setGeneration(parseInt(value))
    setSelectedStarter(null)
    setNickname("")
  }

  const handleStarterSelect = (starter: StarterPokemon) => {
    setSelectedStarter(starter)
  }

  const handleConfirmSelection = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (selectedStarter && nickname) {
      setIsSelecting(true)
      // Add a small delay for the animation effect
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSelect(selectedStarter.id, nickname)
    } else {
      toast.error("Please select a starter Pokémon and provide a nickname.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Label htmlFor="generation" className="min-w-24">Generation</Label>
        <Select
          value={generation.toString()}
          onValueChange={handleGenerationChange}
        >
          <SelectTrigger id="generation">
            <SelectValue placeholder="Select generation" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STARTER_POKEMON).map((gen) => (
              <SelectItem key={gen} value={gen}>
                Generation {gen}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-sm mx-auto"
          >
            <CarouselContent>
              {starters.map((starter) => (
                <CarouselItem key={starter.id}>
                  <div className="p-1">
                    <StarterCard
                      pokemon={starter}
                      isSelected={selectedStarter?.id === starter.id}
                      onSelect={handleStarterSelect}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </motion.div>
      )}

      {selectedStarter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t"
        >
          <div className="space-y-2">
            <Label htmlFor="nickname">
              Nickname for {selectedStarter.name}
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              placeholder={`Give ${selectedStarter.name} a nickname`}
            />
          </div>

          <motion.div
            animate={isSelecting ? {
              rotate: [0, -10, 10, -10, 10, 0],
              transition: {
                duration: 0.5,
                ease: "easeInOut"
              }
            } : {}}
          >
            <Button
              onClick={handleConfirmSelection}
              disabled={!nickname.trim() || isSelecting}
              className={`w-full transition-all duration-300 ${
                isSelecting ? "bg-primary hover:bg-primary text-primary-foreground" : ""
              }`}
            >
              {isSelecting 
                ? `${selectedStarter?.name}, I choose you!` 
                : "Confirm Starter Selection"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 