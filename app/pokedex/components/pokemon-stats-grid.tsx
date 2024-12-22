"use client"

import { Pokemon } from "pokenode-ts"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { typeColors } from "../lib/pokemon-types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { PokemonDetailsSheet } from "./pokemon-details-sheet"

interface PokemonStatsGridProps {
  pokemon: Pokemon[]
}

export function PokemonStatsGrid({ pokemon }: PokemonStatsGridProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {pokemon.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
            onClick={() => setSelectedPokemon(p)}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="relative h-12 w-12">
                <Image
                  src={p.sprites.front_default || "/placeholder-pokemon.png"}
                  alt={p.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-medium capitalize">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  #{String(p.id).padStart(3, '0')}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {p.stats.map((stat) => (
                <div key={stat.stat.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">
                      {stat.stat.name.replace('-', ' ')}
                    </span>
                    <span>{stat.base_stat}</span>
                  </div>
                  <Progress value={(stat.base_stat / 255) * 100} />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              {p.types.map((type) => (
                <Badge
                  key={type.type.name}
                  className={cn(
                    "capitalize",
                    typeColors[type.type.name as keyof typeof typeColors]
                  )}
                >
                  {type.type.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedPokemon && (
        <PokemonDetailsSheet
          pokemon={selectedPokemon}
          isOpen={!!selectedPokemon}
          onOpenChange={(isOpen) => !isOpen && setSelectedPokemon(null)}
        />
      )}
    </>
  )
} 