"use client"

import { Pokemon } from "pokenode-ts"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { PokemonDetailsSheet } from "./pokemon-details-sheet"
import { typeColors } from "../lib/pokemon-types"

interface PokemonCardProps {
  pokemon: Pokemon
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const heightInMeters = pokemon.height / 10
  const weightInKg = pokemon.weight / 10

  return (
    <>
      <div 
        className="group relative flex flex-col rounded-lg border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 active:scale-95 hover:-translate-y-1 overflow-hidden cursor-pointer touch-manipulation"
        onClick={() => setIsDetailsOpen(true)}
      >
        {/* Pokemon Image Container with AspectRatio */}
        <AspectRatio ratio={4/3} className="bg-gradient-to-b from-card to-muted relative">
          {/* Pokemon Number Badge */}
          <Badge 
            variant="outline" 
            className="absolute top-2 left-2 z-20 bg-background/80 backdrop-blur-sm border-primary/20 text-xs sm:text-sm"
          >
            #{String(pokemon.id).padStart(3, '0')}
          </Badge>
          
          {/* Sprite Icon with hover/touch effect */}
          <div className="absolute top-2 right-2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 overflow-hidden transition-transform group-hover:scale-110 group-active:scale-105">
            <Image
              src={pokemon.sprites.front_default || "/placeholder-pokemon.png"}
              alt={`${pokemon.name} sprite`}
              fill
              className="object-contain scale-125 group-hover:scale-150 transition-transform"
            />
          </div>

          {/* Main Pokemon Image with shine effect */}
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <Image
              src={pokemon.sprites.other?.["official-artwork"].front_default || pokemon.sprites.front_default || "/placeholder-pokemon.png"}
              alt={pokemon.name}
              fill
              className="object-contain p-3 sm:p-4 transition-transform duration-300 group-hover:scale-110 group-active:scale-105"
              priority
            />
          </div>
        </AspectRatio>

        {/* Pokemon Info */}
        <div className="bg-card p-3 sm:p-4">
          {/* Name and Generation */}
          <div className="mb-2">
            <h3 className="text-base sm:text-lg font-semibold capitalize text-foreground group-hover:text-primary transition-colors">
              {pokemon.name}
            </h3>
          </div>

          {/* Types with interactive badges */}
          <div className="flex gap-2 mb-2 sm:mb-3">
            {pokemon.types.map((type) => (
              <Badge
                key={type.type.name}
                className={cn(
                  "text-xs sm:text-sm transition-all duration-300 group-active:scale-95",
                  typeColors[type.type.name as keyof typeof typeColors]
                )}
              >
                {type.type.name}
              </Badge>
            ))}
          </div>

          {/* Physical Characteristics */}
          <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 border-t border-b border-primary/10 py-2">
            <span>{heightInMeters}m</span>
            <span className="text-primary/50">•</span>
            <span>{weightInKg}kg</span>
          </div>

          {/* Stats with animated bars */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm">
            {pokemon.stats.slice(0, 3).map((stat, index) => (
              <div key={stat.stat.name} className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className={cn(
                    "transition-colors",
                    index === 0 && "text-red-400",
                    index === 1 && "text-orange-400",
                    index === 2 && "text-blue-400"
                  )}>
                    {index === 0 && "❤️"}
                    {index === 1 && "⚔️"}
                    {index === 2 && "🛡️"}
                  </span>
                  <span>{stat.base_stat}</span>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out group-hover:opacity-100",
                      index === 0 && "bg-red-400 opacity-70",
                      index === 1 && "bg-orange-400 opacity-70",
                      index === 2 && "bg-blue-400 opacity-70"
                    )}
                    style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PokemonDetailsSheet 
        pokemon={pokemon}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  )
} 