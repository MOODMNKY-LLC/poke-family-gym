"use client"

import { useState, useEffect } from "react"
import { PokemonClient, Pokemon } from "pokenode-ts"
import { PokemonCard } from "./pokemon-card"

export function PokemonGrid() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPokemon() {
      try {
        const api = new PokemonClient()
        
        // Fetch first 151 Pokemon (can be adjusted)
        const pokemonList = await Promise.all(
          Array.from({ length: 151 }, (_, i) =>
            api.getPokemonById(i + 1)
          )
        )
        
        setPokemon(pokemonList)
      } catch (err) {
        setError("Failed to fetch Pokemon")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPokemon()
  }, [])

  if (isLoading) return <div>Loading Pokemon...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {pokemon.map((p) => (
        <PokemonCard key={p.id} pokemon={p} />
      ))}
    </div>
  )
} 