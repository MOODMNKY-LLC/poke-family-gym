'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PokemonClient } from 'pokenode-ts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Swords, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompanionPokemonCardProps {
  pokemonFormId: number
  nickname?: string
}

export function CompanionPokemonCard({ pokemonFormId, nickname }: CompanionPokemonCardProps) {
  const [pokemonData, setPokemonData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPokemonData = async () => {
      try {
        const api = new PokemonClient()
        const pokemon = await api.getPokemonById(pokemonFormId)
        setPokemonData(pokemon)
      } catch (err) {
        setError('Failed to load Pokémon data')
        console.error('Error fetching Pokémon:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPokemonData()
  }, [pokemonFormId])

  if (isLoading || !pokemonData) {
    return (
      <Card className="w-full bg-black/80 animate-pulse">
        <CardContent className="p-4">
          <div className="h-32 w-full bg-muted/10 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full bg-destructive/5">
        <CardContent className="p-4 text-destructive">
          Failed to load Pokémon
        </CardContent>
      </Card>
    )
  }

  // Get main stats for display
  const mainStats = {
    hp: pokemonData.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 0,
    attack: pokemonData.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 0,
    defense: pokemonData.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 0,
  }

  return (
    <Card className="w-full bg-black/80 backdrop-blur-sm border-0">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          {/* Header with Name and Number */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-base font-medium text-white capitalize">
                {nickname || pokemonData.name}
              </h3>
              <div className="flex gap-1">
                {pokemonData.types.map((type: any) => (
                  <Badge
                    key={type.type.name}
                    className={cn(
                      "pokemon-type",
                      `pokemon-type-${type.type.name}`
                    )}
                  >
                    {type.type.name}
                  </Badge>
                ))}
              </div>
            </div>
            <span className="text-sm text-white/60">
              #{pokemonData.id.toString().padStart(3, '0')}
            </span>
          </div>

          {/* Weight and Height */}
          <div className="text-sm text-white/60">
            {(pokemonData.weight / 10).toFixed(1)} kg, {(pokemonData.height / 10).toFixed(1)} m
          </div>

          {/* Stats Display */}
          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-pokemon-hp" />
              <span className="text-sm">{mainStats.hp}</span>
            </div>
            <div className="flex items-center gap-1">
              <Swords className="h-4 w-4 text-pokemon-attack" />
              <span className="text-sm">{mainStats.attack}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-pokemon-defense" />
              <span className="text-sm">{mainStats.defense}</span>
            </div>
          </div>

          {/* Sprite Display */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative h-32 flex items-center justify-center"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-white/5" />
            </div>
            <img
              src={pokemonData.sprites.front_default}
              alt={`${nickname || pokemonData.name}'s sprite`}
              className="relative z-10 w-full h-full object-contain pixelated"
            />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
} 