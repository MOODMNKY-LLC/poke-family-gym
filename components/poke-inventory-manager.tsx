'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshButton } from '@/components/refresh-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'
import { PokeLootBox } from '@/components/lootbox/poke-lootbox'
import type { LootBoxPokemon, PokemonRarity, PokemonVariant } from '@/components/lootbox/pokemon-loot-table'
import { pokeApiService } from '@/lib/services/poke-api.service'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Dynamically import the test component to avoid SSR issues with browser-specific code
const PokeLootboxTest = dynamic<any>(
  () => import('@/components/lootbox/poke-lootbox-test').then(mod => mod.PokeLootBoxTest),
  { ssr: false }
)

interface OddsResultItem {
  item: string
  internalChance: number
  globalChance: number
}

interface OddsResult {
  box: string
  chance: number
  items: OddsResultItem[]
}

interface LootboxOdds {
  lootboxId: number
  odds: OddsResult[]
}

interface Pokemon {
  id: number
  name: string
  types: string[]
  sprites: {
    front_default: string | null
    back_default: string | null
    front_shiny: string | null
    back_shiny: string | null
  }
  stats: {
    hp: number
    attack: number
    defense: number
    special_attack: number
    special_defense: number
    speed: number
  }
  height: number
  weight: number
  base_experience: number
  species_id: number
}

interface PokemonPool {
  id: number
  lootbox_id: number
  pokemon_id: number
  rarity: PokemonRarity
  weight: number
  variant?: PokemonVariant
  is_shiny?: boolean
  pokemon?: Pokemon
  created_at?: string
  updated_at?: string
}

interface FamilyLootbox {
  id: number
  family_id: string
  name: string
  description: string
  rarity: PokemonRarity
  cost_amount: number
  cost_type: 'poke_ball' | 'great_ball' | 'ultra_ball' | 'master_ball'
  buff_percentage: number
  is_active: boolean
  symbol?: string
  guaranteed_slots?: number
  max_per_pack?: number
  created_at?: string
  updated_at?: string
}

interface LootTableMap {
  common: Array<Omit<LootBoxPokemon, 'variant'>>
  uncommon: Array<Omit<LootBoxPokemon, 'variant'>>
  rare: Array<Omit<LootBoxPokemon, 'variant'>>
  ultra_rare: Array<Omit<LootBoxPokemon, 'variant'>>
  secret_rare: Array<Omit<LootBoxPokemon, 'variant'>>
  special_rare: Array<LootBoxPokemon & { variant: PokemonVariant }>
  hyper_rare: Array<Omit<LootBoxPokemon, 'variant'>>
  crown_rare: Array<Omit<LootBoxPokemon, 'variant'>>
}

const transformPoolToLootItem = (pool: PokemonPool): LootBoxPokemon => {
  const base = {
    id: pool.pokemon_id.toString(),
    label: pool.pokemon?.name || `Pokemon #${pool.pokemon_id}`,
    pokemonId: pool.pokemon_id,
    shiny: pool.is_shiny || false
  }

  // Special rare Pokémon must have a variant
  if (pool.rarity === 'special_rare') {
    return {
      ...base,
      variant: pool.variant || 'normal'
    }
  }

  // For other rarities, variant is optional
  return base
}

function getPokemonTypeColor(type: string): string {
  const colors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  }
  return colors[type.toLowerCase()] || '#68A090'
}

export default function PokeInventoryManager() {
  const [activeTab, setActiveTab] = useState('lootboxes')
  const [lootboxes, setLootboxes] = useState<FamilyLootbox[]>([])
  const [pokemonPools, setPokemonPools] = useState<PokemonPool[]>([])
  const [lootboxOdds, setLootboxOdds] = useState<LootboxOdds[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingLootbox, setIsAddingLootbox] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [selectedLootbox, setSelectedLootbox] = useState<number | null>(null)
  const [newLootbox, setNewLootbox] = useState<Partial<FamilyLootbox>>({
    rarity: 'common',
    cost_type: 'poke_ball',
    cost_amount: 1,
    buff_percentage: 0,
    is_active: true
  })
  const [isAddingPool, setIsAddingPool] = useState(false)
  const [selectedLootboxId, setSelectedLootboxId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [newPool, setNewPool] = useState<Partial<PokemonPool>>({
    rarity: 'common',
    weight: 1
  })
  const [isEditingLootbox, setIsEditingLootbox] = useState(false)
  const [editingLootbox, setEditingLootbox] = useState<FamilyLootbox | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (lootboxes.length > 0 && pokemonPools.length > 0) {
      calculateOdds()
    }
  }, [lootboxes, pokemonPools])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Get current user's family ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get the user's family member record
      const { data: familyMember, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle()

      if (memberError) throw memberError
      if (!familyMember?.family_id) throw new Error('No family found')
      
      setFamilyId(familyMember.family_id)
      
      // Load lootboxes for this family
      const { data: lootboxData, error: lootboxError } = await supabase
        .from('family_lootboxes')
        .select('*')
        .eq('family_id', familyMember.family_id)
        .order('created_at', { ascending: false })

      if (lootboxError) throw lootboxError
      setLootboxes(lootboxData || [])

      // Load pokemon pools for this family's lootboxes
      const { data: poolData, error: poolError } = await supabase
        .from('lootbox_pokemon_pools')
        .select('*')
        .in('lootbox_id', lootboxData?.map(box => box.id) || [])
        .order('created_at', { ascending: false })

      if (poolError) throw poolError

      if (poolData && poolData.length > 0) {
        // Load pokemon data for each pool
        const pokemonIds = Array.from(new Set(poolData.map(pool => pool.pokemon_id)))
        const { data: pokemonData, error: pokemonError } = await supabase
          .from('pokemon')
          .select('id, name, types, sprites, stats')
          .in('id', pokemonIds)

        if (pokemonError) throw pokemonError

        // Merge pokemon data with pool data
        const poolsWithPokemon = poolData.map(pool => ({
          ...pool,
          pokemon: pokemonData?.find(p => p.id === pool.pokemon_id)
        }))

        setPokemonPools(poolsWithPokemon)
      } else {
        setPokemonPools([])
      }

    } catch (error: any) {
      console.error('Error loading data:', error.message)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateOdds = () => {
    const odds: LootboxOdds[] = lootboxes.map(lootbox => {
      const poolsForLootbox = pokemonPools.filter(pool => pool.lootbox_id === lootbox.id)
      const lootTable = {
        common: poolsForLootbox
          .filter(p => p.rarity === 'common')
          .map(transformPoolToLootItem),
        uncommon: poolsForLootbox
          .filter(p => p.rarity === 'uncommon')
          .map(transformPoolToLootItem),
        rare: poolsForLootbox
          .filter(p => p.rarity === 'rare')
          .map(transformPoolToLootItem),
        ultra_rare: poolsForLootbox
          .filter(p => p.rarity === 'ultra_rare')
          .map(transformPoolToLootItem),
        secret_rare: poolsForLootbox
          .filter(p => p.rarity === 'secret_rare')
          .map(transformPoolToLootItem),
        special_rare: poolsForLootbox
          .filter(p => p.rarity === 'special_rare')
          .map(p => ({
            ...transformPoolToLootItem(p),
            variant: p.variant || 'normal'
          })) as LootTableMap['special_rare'],
        hyper_rare: poolsForLootbox
          .filter(p => p.rarity === 'hyper_rare')
          .map(transformPoolToLootItem),
        crown_rare: poolsForLootbox
          .filter(p => p.rarity === 'crown_rare')
          .map(transformPoolToLootItem)
      } as LootTableMap

      const pokeLootBox = new PokeLootBox({
        customLootTable: lootTable,
        buff: lootbox.buff_percentage
      })

      return {
        lootboxId: lootbox.id,
        odds: pokeLootBox.getOdds()
      }
    })

    setLootboxOdds(odds)
  }

  const handleAddLootbox = async () => {
    if (!familyId) {
      toast({
        title: 'Error',
        description: 'Family ID not found',
        variant: 'destructive'
      })
      return
    }

    // Validate required fields
    if (!newLootbox.name || !newLootbox.description) {
      toast({
        title: 'Error',
        description: 'Name and description are required',
        variant: 'destructive'
      })
      return
    }

    try {
      const supabase = createClient()
      
      // Validate and normalize buff_percentage
      const buffPercentage = Math.min(Math.max(newLootbox.buff_percentage || 0, 0), 100)
      
      const lootboxData = {
        ...newLootbox,
        family_id: familyId,
        buff_percentage: buffPercentage / 100, // Convert to decimal
        cost_amount: Math.max(newLootbox.cost_amount || 1, 1), // Ensure minimum cost of 1
        is_active: newLootbox.is_active ?? true // Default to active if not specified
      }

      const { data, error } = await supabase
        .from('family_lootboxes')
        .insert([lootboxData])
        .select()
        .single()

      if (error) throw error

      // Add the new lootbox to the state
      setLootboxes([data, ...lootboxes])
      
      // Reset the form
      setIsAddingLootbox(false)
      setNewLootbox({
        rarity: 'common',
        cost_type: 'poke_ball',
        cost_amount: 1,
        buff_percentage: 0,
        is_active: true
      })

      // Show success message
      toast({
        title: 'Success',
        description: 'Lootbox added successfully'
      })

      // Recalculate odds after adding new lootbox
      calculateOdds()
    } catch (error: any) {
      console.error('Error adding lootbox:', error.message)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lootbox',
        variant: 'destructive'
      })
    }
  }

  const handleToggleLootbox = async (id: number, isActive: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('family_lootboxes')
        .update({ is_active: !isActive })
        .eq('id', id)
        .eq('family_id', familyId)

      if (error) throw error

      setLootboxes(lootboxes.map(box => 
        box.id === id ? { ...box, is_active: !isActive } : box
      ))
      toast({
        title: 'Success',
        description: `Lootbox ${isActive ? 'disabled' : 'enabled'}`
      })
    } catch (error: any) {
      console.error('Error toggling lootbox:', error.message)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lootbox',
        variant: 'destructive'
      })
    }
  }

  const renderOddsDisplay = (lootboxId: number) => {
    const oddsData = lootboxOdds.find(o => o.lootboxId === lootboxId)
    if (!oddsData) return null

    return (
      <div className="mt-4 space-y-4">
        <h4 className="font-semibold">Current Odds</h4>
        {oddsData.odds.map((boxOdds, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{boxOdds.box}</span>
              <span>{(boxOdds.chance * 100).toFixed(2)}%</span>
            </div>
            <div className="pl-4 space-y-1">
              {boxOdds.items.map((item: { item: string; globalChance: number }, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.item}</span>
                  <span>{(item.globalChance * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const handleSearchPokemon = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/pokemon/search?q=${encodeURIComponent(term)}`)
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (Array.isArray(data)) {
        setSearchResults(data)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Error searching Pokemon:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to search Pokemon',
        variant: 'destructive'
      })
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddPool = async () => {
    if (!selectedLootboxId || !newPool.pokemon_id) {
      toast({
        title: 'Error',
        description: 'Please select a lootbox and Pokemon',
        variant: 'destructive'
      })
      return
    }

    try {
      const supabase = createClient()
      
      // Get the Pokemon name from searchResults
      const selectedPokemon = searchResults.find(p => p.id === newPool.pokemon_id)
      if (!selectedPokemon) {
        throw new Error('Selected Pokemon not found in search results')
      }
      
      // Create pool data
      const poolData = {
        lootbox_id: selectedLootboxId,
        pokemon_id: newPool.pokemon_id,
        pokemon_name: selectedPokemon.name,
        rarity: newPool.rarity,
        weight: Math.max(newPool.weight || 1, 1),
        variant: newPool.rarity === 'special_rare' ? 'normal' : undefined,
        is_shiny: false
      }

      const { data: insertedPool, error: insertError } = await supabase
        .from('lootbox_pokemon_pools')
        .insert([poolData])
        .select()
        .single()

      if (insertError) throw insertError

      // Load pokemon data for the newly added pool
      const { data: pokemonData, error: pokemonError } = await supabase
        .from('pokemon')
        .select('id, name, types, sprites, stats')
        .eq('id', insertedPool.pokemon_id)
        .single()

      if (pokemonError) throw pokemonError

      // Add the new pool with pokemon data to the state
      const newPoolWithPokemon = {
        ...insertedPool,
        pokemon: pokemonData
      }

      setPokemonPools([newPoolWithPokemon, ...pokemonPools])
      setIsAddingPool(false)
      setNewPool({
        rarity: 'common',
        weight: 1
      })
      toast({
        title: 'Success',
        description: 'Pokemon added to pool successfully'
      })
    } catch (error: any) {
      console.error('Error adding Pokemon to pool:', error.message)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add Pokemon to pool',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveFromPool = async (poolId: number) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('lootbox_pokemon_pools')
        .delete()
        .eq('id', poolId)

      if (error) throw error

      setPokemonPools(pokemonPools.filter(pool => pool.id !== poolId))
      toast({
        title: 'Success',
        description: 'Pokemon removed from pool'
      })
    } catch (error: any) {
      console.error('Error removing Pokemon from pool:', error.message)
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove Pokemon from pool',
        variant: 'destructive'
      })
    }
  }

  const handleEditLootbox = async () => {
    if (!editingLootbox || !familyId) {
      toast({
        title: 'Error',
        description: 'Invalid lootbox data',
        variant: 'destructive'
      })
      return
    }

    try {
      const supabase = createClient()
      
      // Convert buff_percentage from percentage (0-100) to decimal (0-1)
      const lootboxData = {
        name: editingLootbox.name,
        description: editingLootbox.description,
        rarity: editingLootbox.rarity,
        cost_type: editingLootbox.cost_type,
        cost_amount: editingLootbox.cost_amount,
        buff_percentage: (editingLootbox.buff_percentage || 0) / 100,
        is_active: editingLootbox.is_active
      }

      const { data, error } = await supabase
        .from('family_lootboxes')
        .update(lootboxData)
        .eq('id', editingLootbox.id)
        .eq('family_id', familyId)
        .select()
        .single()

      if (error) throw error

      setLootboxes(lootboxes.map(box => 
        box.id === editingLootbox.id ? data : box
      ))
      setIsEditingLootbox(false)
      setEditingLootbox(null)
      toast({
        title: 'Success',
        description: 'Lootbox updated successfully'
      })
    } catch (error: any) {
      console.error('Error updating lootbox:', error.message)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lootbox',
        variant: 'destructive'
      })
    }
  }

  const startEditingLootbox = (lootbox: FamilyLootbox) => {
    // Convert buff_percentage from decimal (0-1) to percentage (0-100)
    setEditingLootbox({
      ...lootbox,
      buff_percentage: lootbox.buff_percentage * 100
    })
    setIsEditingLootbox(true)
  }

  const handleSyncPokemon = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/pokemon/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to sync Pokemon')
      }

      toast({
        title: 'Success',
        description: 'Pokemon sync started successfully'
      })
    } catch (error: any) {
      console.error('Error syncing Pokemon:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync Pokemon',
        variant: 'destructive'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Poké Inventory Manager</CardTitle>
          <CardDescription>Configure lootboxes and manage Pokémon rewards</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleSyncPokemon}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </Button>
          <RefreshButton onRefresh={loadData} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="lootboxes">Lootboxes</TabsTrigger>
            <TabsTrigger value="pokemon-pools">Pokémon Pools</TabsTrigger>
            <TabsTrigger value="rewards">Reward History</TabsTrigger>
            <TabsTrigger value="test">Test Lootboxes</TabsTrigger>
          </TabsList>

          <TabsContent value="lootboxes">
            <div className="mb-4">
              <Dialog open={isAddingLootbox} onOpenChange={setIsAddingLootbox}>
                <DialogTrigger asChild>
                  <Button>Add Lootbox</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Lootbox</DialogTitle>
                    <DialogDescription>
                      Create a new lootbox configuration for your family.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newLootbox.name || ''}
                        onChange={(e) => setNewLootbox({ ...newLootbox, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newLootbox.description || ''}
                        onChange={(e) => setNewLootbox({ ...newLootbox, description: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rarity">Rarity</Label>
                      <Select
                        value={newLootbox.rarity}
                        onValueChange={(value: any) => setNewLootbox({ ...newLootbox, rarity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="uncommon">Uncommon</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="ultra_rare">Ultra Rare</SelectItem>
                          <SelectItem value="secret_rare">Secret Rare</SelectItem>
                          <SelectItem value="special_rare">Special Rare</SelectItem>
                          <SelectItem value="hyper_rare">Hyper Rare</SelectItem>
                          <SelectItem value="crown_rare">Crown Rare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cost_type">Cost Type</Label>
                      <Select
                        value={newLootbox.cost_type}
                        onValueChange={(value: any) => setNewLootbox({ ...newLootbox, cost_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="poke_ball">Poké Ball</SelectItem>
                          <SelectItem value="great_ball">Great Ball</SelectItem>
                          <SelectItem value="ultra_ball">Ultra Ball</SelectItem>
                          <SelectItem value="master_ball">Master Ball</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cost_amount">Cost Amount</Label>
                      <Input
                        id="cost_amount"
                        type="number"
                        min="1"
                        value={newLootbox.cost_amount || 1}
                        onChange={(e) => setNewLootbox({ ...newLootbox, cost_amount: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="buff_percentage">Buff Percentage</Label>
                      <Input
                        id="buff_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={newLootbox.buff_percentage || 0}
                        onChange={(e) => setNewLootbox({ ...newLootbox, buff_percentage: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddLootbox}>Add Lootbox</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditingLootbox} onOpenChange={setIsEditingLootbox}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Lootbox</DialogTitle>
                    <DialogDescription>
                      Update the lootbox configuration.
                    </DialogDescription>
                  </DialogHeader>
                  {editingLootbox && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={editingLootbox.name}
                          onChange={(e) => setEditingLootbox({ ...editingLootbox, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Input
                          id="edit-description"
                          value={editingLootbox.description || ''}
                          onChange={(e) => setEditingLootbox({ ...editingLootbox, description: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-rarity">Rarity</Label>
                        <Select
                          value={editingLootbox.rarity}
                          onValueChange={(value: any) => setEditingLootbox({ ...editingLootbox, rarity: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="uncommon">Uncommon</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="ultra_rare">Ultra Rare</SelectItem>
                            <SelectItem value="secret_rare">Secret Rare</SelectItem>
                            <SelectItem value="special_rare">Special Rare</SelectItem>
                            <SelectItem value="hyper_rare">Hyper Rare</SelectItem>
                            <SelectItem value="crown_rare">Crown Rare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-cost-type">Cost Type</Label>
                        <Select
                          value={editingLootbox.cost_type}
                          onValueChange={(value: any) => setEditingLootbox({ ...editingLootbox, cost_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="poke_ball">Poké Ball</SelectItem>
                            <SelectItem value="great_ball">Great Ball</SelectItem>
                            <SelectItem value="ultra_ball">Ultra Ball</SelectItem>
                            <SelectItem value="master_ball">Master Ball</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-cost-amount">Cost Amount</Label>
                        <Input
                          id="edit-cost-amount"
                          type="number"
                          min="1"
                          value={editingLootbox.cost_amount}
                          onChange={(e) => setEditingLootbox({ ...editingLootbox, cost_amount: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-buff-percentage">Buff Percentage</Label>
                        <Input
                          id="edit-buff-percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={editingLootbox.buff_percentage}
                          onChange={(e) => setEditingLootbox({ ...editingLootbox, buff_percentage: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button onClick={handleEditLootbox}>Update Lootbox</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {lootboxes.map((lootbox) => (
                <Card key={lootbox.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{lootbox.name}</h3>
                      <p className="text-sm text-muted-foreground">{lootbox.description}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">Rarity: {lootbox.rarity}</p>
                        <p className="text-sm">Cost: {lootbox.cost_amount} {lootbox.cost_type}</p>
                        <p className="text-sm">Buff: {(lootbox.buff_percentage * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingLootbox(lootbox)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={lootbox.is_active ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleLootbox(lootbox.id, lootbox.is_active)}
                      >
                        {lootbox.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  </div>
                  {renderOddsDisplay(lootbox.id)}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pokemon-pools">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Pokémon Pools</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage the Pokémon available in each lootbox
                  </p>
                </div>
                <Dialog open={isAddingPool} onOpenChange={setIsAddingPool}>
                  <DialogTrigger asChild>
                    <Button>Add Pokémon</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Pokémon to Pool</DialogTitle>
                      <DialogDescription>
                        Add a new Pokémon to a lootbox pool.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Lootbox</Label>
                        <Select
                          value={selectedLootboxId?.toString()}
                          onValueChange={(value) => setSelectedLootboxId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lootbox" />
                          </SelectTrigger>
                          <SelectContent>
                            {lootboxes.map((box) => (
                              <SelectItem key={box.id} value={box.id.toString()}>
                                {box.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Search Pokémon</Label>
                        <Input
                          value={searchTerm}
                          onChange={(e) => handleSearchPokemon(e.target.value)}
                          placeholder="Type to search..."
                        />
                        {isSearching && (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="max-h-48 overflow-y-auto border rounded-md">
                            {searchResults.map((pokemon) => (
                              <button
                                key={pokemon.id}
                                className={cn(
                                  "w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                  newPool.pokemon_id === pokemon.id && "bg-zinc-100 dark:bg-zinc-800"
                                )}
                                onClick={() => setNewPool({
                                  ...newPool,
                                  pokemon_id: pokemon.id
                                })}
                              >
                                {pokemon.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Rarity</Label>
                        <Select
                          value={newPool.rarity}
                          onValueChange={(value: any) => setNewPool({ ...newPool, rarity: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="uncommon">Uncommon</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="ultra_rare">Ultra Rare</SelectItem>
                            <SelectItem value="secret_rare">Secret Rare</SelectItem>
                            <SelectItem value="special_rare">Special Rare</SelectItem>
                            <SelectItem value="hyper_rare">Hyper Rare</SelectItem>
                            <SelectItem value="crown_rare">Crown Rare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Weight</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newPool.weight || 1}
                          onChange={(e) => setNewPool({ ...newPool, weight: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddPool}>Add to Pool</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {lootboxes.map((lootbox) => {
                  const poolsForBox = pokemonPools.filter(pool => pool.lootbox_id === lootbox.id)
                  return (
                    <Card key={lootbox.id} className="p-4">
                      <h4 className="font-semibold mb-2">{lootbox.name}</h4>
                      {poolsForBox.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No Pokémon in this pool yet</p>
                      ) : (
                        <div className="space-y-2">
                          {poolsForBox.map((pool) => (
                            <div key={pool.id} className="flex items-center justify-between p-2 bg-zinc-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                {pool.pokemon?.sprites.front_default && (
                                  <div className="relative w-8 h-8">
                                    <Image
                                      src={pool.pokemon.sprites.front_default}
                                      alt={pool.pokemon?.name || ''}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium capitalize">{pool.pokemon?.name || `Pokemon #${pool.pokemon_id}`}</span>
                                  <div className="flex gap-1 mt-1">
                                    {pool.pokemon?.types.map(type => (
                                      <span 
                                        key={type}
                                        className="px-1.5 py-0.5 text-xs rounded capitalize"
                                        style={{ backgroundColor: getPokemonTypeColor(type) }}
                                      >
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm px-2 py-1 bg-zinc-700 rounded">
                                  {pool.rarity}
                                </span>
                                <span className="text-sm px-2 py-1 bg-zinc-700 rounded">
                                  x{pool.weight}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFromPool(pool.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            {/* Rewards History content */}
          </TabsContent>

          <TabsContent value="test">
            <PokeLootboxTest />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 