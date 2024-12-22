"use client"

import { Pokemon } from "pokenode-ts"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { typeColors } from "../lib/pokemon-types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { PokemonDetailsSheet } from "./pokemon-details-sheet"

interface PokemonKanbanProps {
  pokemon: Pokemon[]
}

export function PokemonKanban({ pokemon }: PokemonKanbanProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  // Group Pokémon by their primary type
  const pokemonByType = pokemon.reduce((acc, pokemon) => {
    const primaryType = pokemon.types[0].type.name
    if (!acc[primaryType]) acc[primaryType] = []
    acc[primaryType].push(pokemon)
    return acc
  }, {} as Record<string, Pokemon[]>)

  // Sort types by number of Pokémon
  const sortedTypes = Object.entries(pokemonByType)
    .sort((a, b) => b[1].length - a[1].length)

  const TypeCard = ({ type, pokemons }: { type: string; pokemons: Pokemon[] }) => (
    <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
      <div className={cn(
        "py-2 px-4 text-sm font-medium capitalize text-white",
        typeColors[type as keyof typeof typeColors]
      )}>
        {type} ({pokemons.length})
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {pokemons.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPokemon(p)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 rounded-sm cursor-pointer"
            >
              <div className="relative h-5 w-5 flex-none">
                <Image
                  src={p.sprites.front_default || "/placeholder-pokemon.png"}
                  alt={p.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                <span className="capitalize text-sm truncate">
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  #{String(p.id).padStart(3, '0')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[280px]">
        {sortedTypes.map(([type, pokemons]) => (
          <TypeCard
            key={type}
            type={type}
            pokemons={pokemons}
          />
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