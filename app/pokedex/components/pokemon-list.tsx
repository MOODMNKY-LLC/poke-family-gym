"use client"

import { Pokemon } from "pokenode-ts"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { typeColors } from "../lib/pokemon-types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { PokemonDetailsSheet } from "./pokemon-details-sheet"

interface PokemonListProps {
  pokemon: Pokemon[]
}

export function PokemonList({ pokemon }: PokemonListProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  return (
    <>
      <div className="space-y-2">
        {pokemon.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
            onClick={() => setSelectedPokemon(p)}
          >
            <div className="w-[40px] text-sm text-muted-foreground">
              #{String(p.id).padStart(3, '0')}
            </div>
            <div className="relative h-8 w-8">
              <Image
                src={p.sprites.front_default || "/placeholder-pokemon.png"}
                alt={p.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 font-medium capitalize">{p.name}</div>
            <div className="flex gap-2">
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
            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div>HP: {p.stats[0].base_stat}</div>
              <div>ATK: {p.stats[1].base_stat}</div>
              <div>DEF: {p.stats[2].base_stat}</div>
              <div>SPD: {p.stats[5].base_stat}</div>
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