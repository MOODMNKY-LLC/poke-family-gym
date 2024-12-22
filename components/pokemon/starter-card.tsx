"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronRight, Heart, Swords, Shield } from "lucide-react"
import { PokemonClient } from "pokenode-ts"
import { Loader2 } from "lucide-react"

export interface StarterPokemon {
  id: number
  name: string
  spriteUrl: string
  types: string[]
  height: number
  weight: number
  category: string
  generation: number
  description: string
  stats: Array<{
    name: string
    base: number
  }>
  abilities: string[]
  evolutionChain?: Array<{
    id: number
    name: string
    spriteUrl: string
    level?: number
  }>
}

interface StarterCardProps {
  pokemon: StarterPokemon
  isSelected: boolean
  onSelect: (pokemon: StarterPokemon) => void
}

// Update the color variants for stats
const statColors = {
  hp: "text-pokemon-hp",
  attack: "text-pokemon-attack",
  defense: "text-pokemon-defense",
} as const

export function StarterCard({ pokemon, isSelected, onSelect }: StarterCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [evolutionChain, setEvolutionChain] = useState<StarterPokemon['evolutionChain']>()
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)

  // Get just the three main stats we want to show
  const mainStats = {
    hp: pokemon.stats.find(s => s.name === 'hp')?.base || 0,
    attack: pokemon.stats.find(s => s.name === 'attack')?.base || 0,
    defense: pokemon.stats.find(s => s.name === 'defense')?.base || 0,
  }

  // Stats config with icons and colors
  const statsConfig = [
    { name: 'hp', icon: Heart, value: mainStats.hp, color: statColors.hp },
    { name: 'attack', icon: Swords, value: mainStats.attack, color: statColors.attack },
    { name: 'defense', icon: Shield, value: mainStats.defense, color: statColors.defense },
  ] as const

  // Convert height and weight to metric
  const heightInM = (pokemon.height / 10).toFixed(1)
  const weightInKg = (pokemon.weight / 10).toFixed(1)

  useEffect(() => {
    async function fetchEvolutionChain() {
      setIsLoadingEvolution(true)
      try {
        const api = new PokemonClient()
        
        // Get species data
        const species = await api.getPokemonSpeciesById(pokemon.id)
        if (!species.evolution_chain?.url) {
          console.warn('No evolution chain found for:', pokemon.name)
          return
        }

        // Extract evolution chain ID from URL
        const evolutionChainId = species.evolution_chain.url.split('/').slice(-2, -1)[0]
        
        // Fetch evolution chain data
        const response = await fetch(`https://pokeapi.co/api/v2/evolution-chain/${evolutionChainId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch evolution chain: ${response.statusText}`)
        }
        
        const data = await response.json()
        if (!data?.chain) {
          throw new Error('Invalid evolution chain data')
        }

        // Process evolution chain
        const evolutions: StarterPokemon['evolutionChain'] = []
        let current = data.chain

        while (current) {
          if (!current.species?.url) continue

          const pokemonId = parseInt(current.species.url.split('/').slice(-2, -1)[0])
          try {
            const pokemonData = await api.getPokemonById(pokemonId)
            
            const spriteUrl = pokemonData.sprites.front_default || `/fallback-pokemon-${pokemonId}.png`
            
            evolutions.push({
              id: pokemonId,
              name: current.species.name,
              spriteUrl,
              level: current.evolution_details?.[0]?.min_level
            })
          } catch (error) {
            console.error(`Failed to fetch Pokemon data for ID ${pokemonId}:`, error)
          }
          
          current = current.evolves_to?.[0]
        }

        if (evolutions.length > 0) {
          setEvolutionChain(evolutions)
        }
      } catch (error) {
        console.error('Failed to fetch evolution chain:', error)
      } finally {
        setIsLoadingEvolution(false)
      }
    }

    fetchEvolutionChain()
  }, [pokemon.id])

  return (
    <div
      className="relative w-full aspect-square perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => onSelect(pokemon)}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className={cn(
          "w-full h-full preserve-3d cursor-pointer",
          "transition-all duration-500",
          isSelected && "ring-2 ring-pokemon-hp"
        )}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-pokemon-gradient shadow-lg">
          <CardHeader className="p-3 space-y-1">
            <div className="flex justify-between items-start">
              <CardTitle className="capitalize text-lg">{pokemon.name}</CardTitle>
              <span className="text-xs text-muted-foreground">
                #{pokemon.id.toString().padStart(3, '0')} - {pokemon.category}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pokemon.types.map(type => (
                <span 
                  key={type}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full capitalize",
                    `pokemon-type-${type}`
                  )}
                >
                  {type}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {pokemon.description}
            </p>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={pokemon.spriteUrl}
              alt={pokemon.name}
              className="w-28 h-28 object-contain mx-auto"
            />
            
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Height:</span>
                <span>{heightInM} m</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Weight:</span>
                <span>{weightInKg} kg</span>
              </div>
            </div>

            {/* Stats with themed colors */}
            <div className="flex justify-center items-center gap-4">
              {statsConfig.map(({ name, icon: Icon, value, color }) => (
                <div key={name} className="flex items-center gap-1">
                  <Icon className={cn("w-4 h-4", color)} />
                  <span className={cn("text-sm font-medium", color)}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Abilities with themed styling */}
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Abilities: </span>
              <div className="flex flex-wrap gap-1">
                {pokemon.abilities.map(ability => (
                  <span 
                    key={ability}
                    className="text-xs px-2 py-0.5 rounded-full bg-pokemon-normal/10 text-foreground capitalize"
                  >
                    {ability.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back of card - Split Evolution Chain and Stats */}
        <Card 
          className="absolute w-full h-full backface-hidden rotate-y-180 bg-pokemon-gradient shadow-lg"
        >
          <CardContent className="flex flex-col h-full p-4">
            {/* Evolution Chain Section - Top Half */}
            <div className="flex-1 border-b">
              <h3 className="font-semibold text-center mb-2">Evolution Chain</h3>
              {isLoadingEvolution ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : evolutionChain && evolutionChain.length > 0 ? (
                <div className="flex items-center justify-center gap-1 h-full pb-2">
                  {evolutionChain.map((evolution, index) => (
                    <div key={evolution.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <img
                          src={evolution.spriteUrl}
                          alt={evolution.name}
                          className="w-14 h-14"
                        />
                        <span className="text-[10px] capitalize">{evolution.name}</span>
                        {evolution.level && (
                          <span className="text-[10px] text-muted-foreground">
                            Lv. {evolution.level}
                          </span>
                        )}
                      </div>
                      {index < (evolutionChain.length - 1) && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground">
                    No evolution data
                  </p>
                </div>
              )}
            </div>

            {/* Stats Section - Bottom Half */}
            <div className="pt-2 flex-1">
              <h3 className="font-semibold text-center mb-2">Base Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                {pokemon.stats.map(stat => (
                  <div key={stat.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {stat.name.replace('-', ' ')}
                      </span>
                      <span className="text-xs font-medium">
                        {stat.base}
                      </span>
                    </div>
                    <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.base / 255) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 