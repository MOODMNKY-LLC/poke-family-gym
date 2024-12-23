'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PokemonClient } from 'pokenode-ts'
import { LoadingCard } from './loading-card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { PokemonStats as PokemonStatsType } from '@/types/dashboard'

interface PokemonStatsProps {
  stats: PokemonStatsType
}

export function PokemonStats({ stats }: PokemonStatsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [favoritePokemonData, setFavoritePokemonData] = useState<any>(null)
  const [recentPokemonData, setRecentPokemonData] = useState<any[]>([])

  useEffect(() => {
    async function fetchPokemonData() {
      const api = new PokemonClient()
      
      try {
        // Fetch favorite Pokémon data
        if (stats.favoritePokemon) {
          const favorite = await api.getPokemonById(stats.favoritePokemon.formId)
          setFavoritePokemonData(favorite)
        }

        // Fetch recently obtained Pokémon data
        const recentData = await Promise.all(
          stats.recentlyObtained.map(async (pokemon) => {
            const data = await api.getPokemonById(pokemon.pokemonFormId)
            return {
              ...data,
              nickname: pokemon.nickname,
              caughtAt: pokemon.caughtAt
            }
          })
        )
        setRecentPokemonData(recentData)
      } catch (error) {
        console.error('Error fetching Pokémon data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPokemonData()
  }, [stats])

  if (isLoading) return <LoadingCard rows={4} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Pokémon Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Total Caught & Unique Species */}
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Total Caught</p>
              <p className="text-2xl font-bold">{stats.totalCaught}</p>
              <Progress value={(stats.totalCaught / 151) * 100} className="h-2" />
            </motion.div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Unique Species</p>
              <p className="text-2xl font-bold">{stats.uniqueSpecies}</p>
              <Progress value={(stats.uniqueSpecies / 151) * 100} className="h-2" />
            </motion.div>
          </div>

          {/* Favorite Pokémon */}
          {favoritePokemonData && stats.favoritePokemon && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Favorite Pokémon</p>
              <div className="flex items-center gap-4">
                <img
                  src={favoritePokemonData.sprites.front_default}
                  alt={favoritePokemonData.name}
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <p className="font-semibold capitalize">
                    {stats.favoritePokemon.nickname || favoritePokemonData.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Friendship: {stats.favoritePokemon.friendship}/255
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recently Obtained */}
          {recentPokemonData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <p className="text-sm font-medium">Recently Obtained</p>
              <div className="grid gap-4 md:grid-cols-3">
                {recentPokemonData.map((pokemon, index) => (
                  <motion.div
                    key={pokemon.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg",
                      "bg-accent/50 hover:bg-accent/70 transition-colors"
                    )}
                  >
                    <img
                      src={pokemon.sprites.front_default}
                      alt={pokemon.name}
                      className="w-12 h-12 object-contain"
                    />
                    <p className="text-sm font-medium capitalize">
                      {pokemon.nickname || pokemon.name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 