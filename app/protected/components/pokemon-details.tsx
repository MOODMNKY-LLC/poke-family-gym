'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PokemonClient } from 'pokenode-ts'
import { LoadingCard } from './loading-card'

interface PokemonDetailsProps {
  pokemonId: number
  nickname?: string
  friendship?: number
  className?: string
}

const typeColors = {
  normal: { text: 'text-gray-500', bg: 'bg-gray-500/20' },
  fire: { text: 'text-red-500', bg: 'bg-red-500/20' },
  water: { text: 'text-blue-500', bg: 'bg-blue-500/20' },
  electric: { text: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  grass: { text: 'text-green-500', bg: 'bg-green-500/20' },
  ice: { text: 'text-cyan-500', bg: 'bg-cyan-500/20' },
  fighting: { text: 'text-orange-500', bg: 'bg-orange-500/20' },
  poison: { text: 'text-purple-500', bg: 'bg-purple-500/20' },
  ground: { text: 'text-amber-500', bg: 'bg-amber-500/20' },
  flying: { text: 'text-indigo-500', bg: 'bg-indigo-500/20' },
  psychic: { text: 'text-pink-500', bg: 'bg-pink-500/20' },
  bug: { text: 'text-lime-500', bg: 'bg-lime-500/20' },
  rock: { text: 'text-stone-500', bg: 'bg-stone-500/20' },
  ghost: { text: 'text-violet-500', bg: 'bg-violet-500/20' },
  dragon: { text: 'text-teal-500', bg: 'bg-teal-500/20' },
  dark: { text: 'text-neutral-500', bg: 'bg-neutral-500/20' },
  steel: { text: 'text-zinc-500', bg: 'bg-zinc-500/20' },
  fairy: { text: 'text-rose-500', bg: 'bg-rose-500/20' }
}

export function PokemonDetails({ pokemonId, nickname, friendship = 0, className }: PokemonDetailsProps) {
  const [pokemon, setPokemon] = useState<any>(null)
  const [species, setSpecies] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPokemonData() {
      try {
        const api = new PokemonClient()
        
        // Fetch basic Pokémon data
        const pokemonData = await api.getPokemonById(pokemonId)
        setPokemon(pokemonData)
        
        // Fetch species data for additional details
        const speciesData = await api.getPokemonSpeciesById(pokemonId)
        setSpecies(speciesData)
        
        setIsLoading(false)
      } catch (err) {
        setError('Failed to load Pokémon data')
        setIsLoading(false)
      }
    }

    fetchPokemonData()
  }, [pokemonId])

  if (isLoading) return <LoadingCard rows={4} />
  if (error) return <div className="text-red-500">{error}</div>
  if (!pokemon || !species) return null

  const displayName = nickname || pokemon.name
  const description = species.flavor_text_entries
    .find((entry: any) => entry.language.name === 'en')
    ?.flavor_text.replace(/\f/g, ' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{displayName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pokémon Image and Types */}
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <img
                src={pokemon.sprites.other['official-artwork'].front_default}
                alt={pokemon.name}
                className="w-32 h-32 object-contain"
              />
            </motion.div>
            <div className="space-y-2">
              <div className="flex gap-2">
                {pokemon.types.map((type: any) => {
                  const colors = typeColors[type.type.name as keyof typeof typeColors]
                  return (
                    <Badge
                      key={type.type.name}
                      className={cn("capitalize", colors.bg, colors.text)}
                    >
                      {type.type.name}
                    </Badge>
                  )
                })}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <h4 className="font-medium">Base Stats</h4>
            <div className="space-y-2">
              {pokemon.stats.map((stat: any) => (
                <div key={stat.stat.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{stat.stat.name.replace('-', ' ')}</span>
                    <span className="font-medium">{stat.base_stat}</span>
                  </div>
                  <Progress 
                    value={(stat.base_stat / 255) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Friendship */}
          {friendship > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Friendship</h4>
              <Progress 
                value={(friendship / 255) * 100} 
                className="h-2" 
              />
              <p className="text-sm text-muted-foreground">
                {friendship}/255
              </p>
            </div>
          )}

          {/* Abilities */}
          <div className="space-y-2">
            <h4 className="font-medium">Abilities</h4>
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map((ability: any) => (
                <Badge
                  key={ability.ability.name}
                  variant={ability.is_hidden ? "secondary" : "default"}
                  className="capitalize"
                >
                  {ability.ability.name.replace('-', ' ')}
                  {ability.is_hidden && ' (Hidden)'}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 