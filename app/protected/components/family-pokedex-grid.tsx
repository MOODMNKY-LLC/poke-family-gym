"use client"

import { useState, useEffect } from "react"
import { PokemonClient, Pokemon } from "pokenode-ts"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { ViewSwitcher } from "@/app/pokedex/components/view-switcher"
import type { ViewMode } from "@/app/pokedex/components/view-switcher"
import { PokemonCard } from "./family-pokemon-card"
import { PokemonTable } from "@/app/pokedex/components/pokemon-table"
import { PokemonKanban } from "@/app/pokedex/components/pokemon-kanban"
import { PokemonStatsGrid } from "@/app/pokedex/components/pokemon-stats-grid"

const POKEMON_PER_PAGE = 20

interface FamilyPokedexGridProps {
  familyId: string
}

export function FamilyPokedexGrid({ familyId }: FamilyPokedexGridProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const supabase = createClient()

  // Calculate total pages
  const totalPokemon = filteredPokemon.length
  const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE)

  useEffect(() => {
    async function fetchFamilyPokemon() {
      try {
        // Fetch family's Pokédex entries
        const { data: pokedexEntries } = await supabase
          .from('family_pokedex')
          .select('*')
          .eq('family_id', familyId)

        if (!pokedexEntries) return

        // Fetch Pokémon data for each entry
        const api = new PokemonClient()
        const pokemonList = await Promise.all(
          pokedexEntries.map(async (entry) => {
            const pokemon = await api.getPokemonById(entry.pokemon_form_id)
            return {
              ...pokemon,
              nickname: entry.nickname,
              caught_at: entry.first_caught_at,
              caught_count: entry.caught_count,
              is_favorite: entry.is_favorite
            }
          })
        )

        setPokemon(pokemonList)
        setFilteredPokemon(pokemonList)
      } catch (error) {
        console.error('Error fetching family Pokémon:', error)
        setError("Failed to fetch your Pokémon")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFamilyPokemon()
  }, [familyId])

  // Handle search
  useEffect(() => {
    const filtered = pokemon.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p as any).nickname?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPokemon(filtered)
    setPage(1) // Reset to first page when search changes
  }, [searchQuery, pokemon])

  // Get current page of Pokemon
  const getCurrentPagePokemon = () => {
    if (viewMode === "kanban") {
      return filteredPokemon
    }
    
    const startIndex = (page - 1) * POKEMON_PER_PAGE
    const endIndex = startIndex + POKEMON_PER_PAGE
    return filteredPokemon.slice(startIndex, endIndex)
  }

  const renderPokemonView = () => {
    switch (viewMode) {
      case "grid":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {getCurrentPagePokemon().map((p) => (
              <PokemonCard key={p.id} pokemon={p} />
            ))}
          </div>
        )
      case "table":
        return <PokemonTable pokemon={getCurrentPagePokemon()} />
      case "kanban":
        return <PokemonKanban pokemon={getCurrentPagePokemon()} />
      case "stats":
        return <PokemonStatsGrid pokemon={getCurrentPagePokemon()} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or nickname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {filteredPokemon.length} found
            </div>
          )}
        </div>

        {viewMode !== "kanban" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 min-w-[100px] justify-center">
              <span className="text-sm">
                Page {page} of {totalPages || 1}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="h-[calc(100vh-24rem)] rounded-lg border bg-card">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-muted-foreground">
                Loading your Pokémon...
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[200px] text-destructive">
              Error: {error}
            </div>
          ) : filteredPokemon.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
              {searchQuery 
                ? `No Pokémon found matching "${searchQuery}"`
                : "Your Pokédex is empty. Start catching some Pokémon!"
              }
            </div>
          ) : (
            renderPokemonView()
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 