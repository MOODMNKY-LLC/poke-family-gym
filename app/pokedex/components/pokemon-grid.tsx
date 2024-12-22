"use client"

import { useState, useEffect } from "react"
import { PokemonClient, Pokemon } from "pokenode-ts"
import { PokemonCard } from "./pokemon-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { ViewSwitcher } from "./view-switcher"
import { PokemonTable } from "./pokemon-table"
import { PokemonKanban } from "./pokemon-kanban"
import { PokemonStatsGrid } from "./pokemon-stats-grid"
import type { ViewMode } from "./view-switcher"
import { ScrollArea } from "@/components/ui/scroll-area"

const POKEMON_PER_PAGE = 20
const POKEMON_GENERATIONS = {
  'Gen I': { start: 1, end: 151 },
  'Gen II': { start: 152, end: 251 },
  'Gen III': { start: 252, end: 386 },
  'Gen IV': { start: 387, end: 493 },
  'Gen V': { start: 494, end: 649 },
  'Gen VI': { start: 650, end: 721 },
  'Gen VII': { start: 722, end: 809 },
  'Gen VIII': { start: 810, end: 905 },
  'Gen IX': { start: 906, end: 1010 },
} as const

export function PokemonGrid() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [filteredPokemon, setFilteredPokemon] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentGen, setCurrentGen] = useState<keyof typeof POKEMON_GENERATIONS>('Gen I')
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  // Calculate total pages for current generation
  const totalPokemon = filteredPokemon.length
  const totalPages = Math.ceil(totalPokemon / POKEMON_PER_PAGE)

  useEffect(() => {
    async function fetchPokemon() {
      try {
        setIsLoading(true)
        const api = new PokemonClient()
        
        const { start, end } = POKEMON_GENERATIONS[currentGen]
        const pokemonList = await Promise.all(
          Array.from({ length: end - start + 1 }, (_, i) =>
            api.getPokemonById(start + i)
          )
        )
        
        setPokemon(pokemonList)
        setFilteredPokemon(pokemonList)
      } catch (err) {
        setError("Failed to fetch Pokemon")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPokemon()
  }, [currentGen])

  // Handle search
  useEffect(() => {
    const filtered = pokemon.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPokemon(filtered)
    setPage(1) // Reset to first page when search changes
  }, [searchQuery, pokemon])

  const handleGenChange = (value: keyof typeof POKEMON_GENERATIONS) => {
    setCurrentGen(value)
    setPage(1)
    setSearchQuery("") // Clear search when changing generation
  }

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
      {/* Controls Row - Keep outside ScrollArea */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={currentGen}
          onValueChange={(value) => {
            setCurrentGen(value as keyof typeof POKEMON_GENERATIONS)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(POKEMON_GENERATIONS).map((gen) => (
              <SelectItem key={gen} value={gen}>
                {gen}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Pokemon..."
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

      {/* Wrap the content in ScrollArea */}
      <ScrollArea className="h-[calc(100vh-24rem)] rounded-lg border bg-card">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-muted-foreground">
                Loading Pokemon...
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[200px] text-destructive">
              Error: {error}
            </div>
          ) : filteredPokemon.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
              No Pokemon found matching "{searchQuery}"
            </div>
          ) : (
            renderPokemonView()
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
// ... rest of the file remains the same 