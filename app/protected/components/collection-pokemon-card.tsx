'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PokemonSpriteImage } from '@/components/pokemon/pokemon-sprite-image'
import { Heart, Pencil, Crown, Lock } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  onFavoriteToggle?: (id: string) => void
}

export function CollectionPokemonCard({ 
  pokemon, 
  onFavoriteToggle
}: CollectionPokemonCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Get the official artwork or fallback to other sprites
  const spriteUrl = pokemon.sprites.other?.['official-artwork'].front_default ||
                   pokemon.sprites.other?.home.front_default ||
                   pokemon.sprites.front_default

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={cn(
              "aspect-square rounded-lg overflow-hidden glass-effect glass-border transition-transform hover:scale-105",
              !pokemon.is_collected && "opacity-60",
              pokemon.is_starter && pokemon.is_collected && "ring-2 ring-blue-400"
            )}>
              {/* Pokemon Image */}
              <div className="absolute inset-0">
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <PokemonSpriteImage
                    src={spriteUrl || `/images/pokemon/${pokemon.id}.png`}
                    alt={pokemon.name}
                    className={cn(
                      "w-full h-full object-contain",
                      !pokemon.is_collected && "grayscale"
                    )}
                  />
                  {!pokemon.is_collected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white/80" />
                    </div>
                  )}
                </div>
              </div>

              {/* Starter Badge */}
              {pokemon.is_starter && pokemon.is_collected && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-blue-400 border-blue-400/50">
                    <Crown className="w-3 h-3 mr-1" />
                    Starter
                  </Badge>
                </div>
              )}

              {/* Pokemon Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium capitalize">
                    {pokemon.is_collected ? pokemon.nickname || pokemon.name : `#${pokemon.id} ${pokemon.name}`}
                  </div>
                  {pokemon.is_collected && pokemon.level && (
                    <div className="text-xs text-muted-foreground">
                      Lv. {pokemon.level}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 mt-1">
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
              </div>

              {/* Quick Actions */}
              {pokemon.is_collected && pokemon.collectionId && (
                <div className={cn(
                  "absolute top-2 right-2 transition-opacity",
                  isHovered ? "opacity-100" : "opacity-0"
                )}>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant={pokemon.is_favorite ? "default" : "ghost"}
                      className="h-7 w-7"
                      onClick={() => onFavoriteToggle?.(pokemon.collectionId!)}
                    >
                      <Heart 
                        className={cn(
                          "w-4 h-4",
                          pokemon.is_favorite && "fill-current"
                        )} 
                      />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 p-2">
            <div className="font-medium capitalize">
              {pokemon.is_collected ? pokemon.nickname || pokemon.name : `#${pokemon.id} ${pokemon.name}`}
            </div>
            {pokemon.is_collected ? (
              <>
                <div className="text-sm text-muted-foreground max-w-[200px]">
                  Caught on {new Date(pokemon.obtained_at!).toLocaleDateString()}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {pokemon.stats.map(stat => (
                    <div key={stat.stat.name} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {stat.stat.name.replace('-', ' ')}:
                      </span>
                      <span className="font-medium">{stat.base_stat}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Not yet discovered! Complete tasks or open Poké Packs to add this Pokémon to your collection.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 