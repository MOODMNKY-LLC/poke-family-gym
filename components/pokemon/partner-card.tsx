"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Shield, Swords, Ruler, Scale } from "lucide-react"

interface PokemonPartnerCardProps {
  pokemon: any // TODO: Type this properly with Pokemon interface
  nickname?: string | null
  friendship: number
  experience: number
}

export function PokemonPartnerCard({ pokemon, nickname, friendship, experience }: PokemonPartnerCardProps) {
  // Convert height and weight to metric
  const heightInM = (pokemon.height / 10).toFixed(1)
  const weightInKg = (pokemon.weight / 10).toFixed(1)

  // Get first 4 moves
  const moves = pokemon.moves
    .slice(0, 4)
    .map((move: any) => move.move.name.replace('-', ' '))

  return (
    <div className="relative w-full aspect-[3/2] perspective-1000">
      <motion.div
        className="w-full h-full preserve-3d cursor-pointer"
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-gradient-to-br from-accent/50 to-background border-2">
          <CardContent className="p-3 flex flex-col h-full relative">
            {/* Header with name, number, and types */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="font-semibold capitalize text-base block">
                  {nickname || pokemon.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  #{pokemon.id.toString().padStart(3, '0')} - Seed Pokémon (Gen I)
                </span>
              </div>
              <div className="flex gap-1">
                {pokemon.types.map((type: any) => (
                  <span 
                    key={type.type.name}
                    className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium capitalize ring-1 ring-primary/20"
                  >
                    {type.type.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Main content area */}
            <div className="flex gap-3 flex-1">
              {/* Left column with sprite and stats */}
              <div className="flex flex-col items-center gap-1">
                {/* Pokemon sprite with background effect */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse" />
                  <img
                    src={pokemon.sprites.front_default || "/placeholder-pokemon.png"}
                    alt={pokemon.name}
                    className="object-contain w-full h-full relative z-10"
                  />
                </div>

                {/* Height and Weight */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> {heightInM}m
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Scale className="w-3 h-3" /> {weightInKg}kg
                  </span>
                </div>

                {/* Base Stats */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span className="font-mono text-xs">{pokemon.stats[0].base_stat}</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Swords className="w-3 h-3 text-orange-500" />
                    <span className="font-mono text-xs">{pokemon.stats[1].base_stat}</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Shield className="w-3 h-3 text-blue-500" />
                    <span className="font-mono text-xs">{pokemon.stats[2].base_stat}</span>
                  </span>
                </div>
              </div>

              {/* Right column with moves */}
              <div className="flex-1 grid grid-cols-1 gap-1">
                {moves.map((move: string, index: number) => (
                  <div 
                    key={move}
                    className="bg-accent/30 px-2 py-0.5 rounded text-xs capitalize flex items-center gap-1.5"
                  >
                    <span className="text-[10px] text-muted-foreground font-mono">#{index + 1}</span>
                    {move}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-accent/50 to-background border-2">
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Friendship and Experience bars */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Friendship</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 transition-all"
                      style={{ width: `${(friendship / 255) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">{friendship}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Experience</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(experience / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">{experience}</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pokemon.stats.map((stat: any, index: number) => (
                  <div key={stat.stat.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {stat.stat.name.replace('-', ' ')}
                      </span>
                      <span className="text-xs font-mono">
                        {stat.base_stat}
                      </span>
                    </div>
                    <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.base_stat / 255) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
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