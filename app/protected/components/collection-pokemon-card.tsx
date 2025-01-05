'use client'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { PokemonSpriteImage } from '@/components/pokemon/pokemon-sprite-image'
import { TYPE_COLORS } from '@/lib/constants'
import type { Pokemon } from 'pokenode-ts'

type EnrichedPokemon = Omit<Pokemon, 'id'> & {
  id: number
  collectionId: string | null
  nickname: string | null
  level: number | null
  obtained_at: string | null
  is_starter: boolean | null
  is_favorite: boolean | null
  is_collected: boolean
  generation_id: number
}

interface CollectionPokemonCardProps {
  pokemon: EnrichedPokemon
  onFavoriteToggle?: (pokemonId: string) => void
}

export function CollectionPokemonCard({ pokemon, onFavoriteToggle }: CollectionPokemonCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      "hover:shadow-md",
      !pokemon.is_collected && "opacity-50"
    )}>
      {/* Pokemon Image */}
      <div className="relative aspect-square">
        <div className="absolute inset-0 flex items-center justify-center">
          <PokemonSpriteImage
            src={pokemon.sprites.front_default || `/images/pokemon/${pokemon.id}.png`}
            alt={pokemon.name}
            className={cn(
              "w-full h-full object-contain",
              !pokemon.is_collected && "grayscale"
            )}
          />
        </div>
      </div>

      {/* Pokemon Info */}
      <div className="p-3 space-y-2">
        {/* Name and Number */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium capitalize">
              {pokemon.is_collected ? pokemon.nickname || pokemon.name : pokemon.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              #{String(pokemon.id).padStart(3, '0')}
            </p>
          </div>
          {pokemon.is_collected && onFavoriteToggle && pokemon.collectionId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onFavoriteToggle(pokemon.collectionId!)}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  pokemon.is_favorite && "fill-current text-red-500"
                )}
              />
            </Button>
          )}
        </div>

        {/* Types */}
        <div className="flex gap-1">
          {pokemon.types.map((type) => {
            const typeColor = TYPE_COLORS[type.type.name as keyof typeof TYPE_COLORS]
            return (
              <Badge 
                key={type.type.name}
                className={cn(
                  "capitalize text-[10px] px-1.5 py-0",
                  typeColor.bg,
                  typeColor.text
                )}
              >
                {type.type.name}
              </Badge>
            )
          })}
        </div>

        {/* Collection Status */}
        {pokemon.is_collected ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Level {pokemon.level || 1}
            </Badge>
            {pokemon.is_starter && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Starter
              </Badge>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
            Not Collected
          </Badge>
        )}
      </div>
    </Card>
  )
} 