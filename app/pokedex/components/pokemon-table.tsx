"use client"

import { Pokemon } from "pokenode-ts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { typeColors } from "../lib/pokemon-types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { PokemonDetailsSheet } from "./pokemon-details-sheet"

interface PokemonTableProps {
  pokemon: Pokemon[]
}

export function PokemonTable({ pokemon }: PokemonTableProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Sprite</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Types</TableHead>
              <TableHead className="text-right">HP</TableHead>
              <TableHead className="text-right">Attack</TableHead>
              <TableHead className="text-right">Defense</TableHead>
              <TableHead className="text-right">Speed</TableHead>
              <TableHead>Height</TableHead>
              <TableHead>Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pokemon.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedPokemon(p)}
              >
                <TableCell className="font-medium">
                  #{String(p.id).padStart(3, '0')}
                </TableCell>
                <TableCell>
                  <div className="relative h-10 w-10">
                    <Image
                      src={p.sprites.front_default || "/placeholder-pokemon.png"}
                      alt={p.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium capitalize">{p.name}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
                  {p.stats[0].base_stat}
                </TableCell>
                <TableCell className="text-right">
                  {p.stats[1].base_stat}
                </TableCell>
                <TableCell className="text-right">
                  {p.stats[2].base_stat}
                </TableCell>
                <TableCell className="text-right">
                  {p.stats[5].base_stat}
                </TableCell>
                <TableCell>{p.height / 10}m</TableCell>
                <TableCell>{p.weight / 10}kg</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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