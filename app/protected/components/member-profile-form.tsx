'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  EyeIcon, 
  EyeOffIcon, 
  UserCircle, 
  Trophy, 
  Heart, 
  Swords, 
  Shield, 
  Dumbbell,
  ScrollText,
  ChevronRight,
  X,
  CircleDot,
  Info,
  BarChart2,
  GitBranch,
  BookOpen,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { AvatarUpload } from '@/app/account/avatar'
import { StarterCard, type StarterPokemon } from '@/components/pokemon/starter-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { PokemonClient } from 'pokenode-ts'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface MemberProfileFormProps {
  member: {
  id: string
  display_name: string
  full_name: string
  birth_date: string | null
  favorite_color: string | null
    pin: string
    family_id: string
  avatar_url: string | null
    starter_pokemon_form_id?: number
    starter_pokemon_nickname?: string
    experience_points?: number
    trainer_class?: string
    badges_earned?: number
    starter_pokemon_friendship?: number
    starter_pokemon_nature?: string
    starter_pokemon_move_1?: string
    starter_pokemon_move_2?: string
    starter_pokemon_move_3?: string
    starter_pokemon_move_4?: string
    starter_pokemon_ribbons?: string[]
  }
}

export function MemberProfileForm({ member }: MemberProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [displayName, setDisplayName] = useState(member.display_name)
  const [fullName, setFullName] = useState(member.full_name)
  const [birthDate, setBirthDate] = useState(member.birth_date || '')
  const [favoriteColor, setFavoriteColor] = useState(member.favorite_color || '')
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url)
  
  // PIN management state
  const [isChangingPin, setIsChangingPin] = useState(false)
  const [pin, setPin] = useState(member.pin || '')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [errors, setErrors] = useState<{
    pin?: string
    confirmPin?: string
  }>({})

  // New state for Pokémon details
  const [pokemonSpecies, setPokemonSpecies] = useState<any>(null)
  const [evolutionChain, setEvolutionChain] = useState<any[]>([])
  const [isLoadingPokemon, setIsLoadingPokemon] = useState(true)
  const [pokemonData, setPokemonData] = useState<StarterPokemon | null>(null)

  // Pokémon customization state
  const [pokemonNickname, setPokemonNickname] = useState(member.starter_pokemon_nickname || '')
  const [pokemonNature, setPokemonNature] = useState(member.starter_pokemon_nature || 'hardy')
  const [pokemonMoves, setPokemonMoves] = useState<string[]>([
    member.starter_pokemon_move_1 || '',
    member.starter_pokemon_move_2 || '',
    member.starter_pokemon_move_3 || '',
    member.starter_pokemon_move_4 || ''
  ])
  const [pokemonRibbons, setPokemonRibbons] = useState<string[]>(member.starter_pokemon_ribbons || [])
  const [pokemonFriendship, setPokemonFriendship] = useState(member.starter_pokemon_friendship || 0)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getAvatarUrl = useCallback((path: string | null) => {
    if (!path) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }, [supabase])

  // Restore PIN handlers
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 6) {
      setPin(value)
      // Clear pin error when typing
      setErrors(prev => ({ ...prev, pin: undefined }))
      // Check if confirm PIN matches
      if (confirmPin && value !== confirmPin) {
        setErrors(prev => ({ ...prev, confirmPin: 'PINs do not match' }))
      } else {
        setErrors(prev => ({ ...prev, confirmPin: undefined }))
      }
    }
  }

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 6) {
      setConfirmPin(value)
      // Check if PINs match
      if (pin && value !== pin) {
        setErrors(prev => ({ ...prev, confirmPin: 'PINs do not match' }))
      } else {
        setErrors(prev => ({ ...prev, confirmPin: undefined }))
      }
    }
  }

  // Fetch Pokémon details
  useEffect(() => {
    async function fetchPokemonDetails() {
      if (!member.starter_pokemon_form_id) return

      setIsLoadingPokemon(true)
      try {
        const api = new PokemonClient()
        
        // Get species data
        const species = await api.getPokemonSpeciesById(member.starter_pokemon_form_id)
        setPokemonSpecies(species)

        // Get evolution chain
        if (species.evolution_chain?.url) {
          const evolutionChainId = species.evolution_chain.url.split('/').slice(-2, -1)[0]
          const response = await fetch(`https://pokeapi.co/api/v2/evolution-chain/${evolutionChainId}`)
          const data = await response.json()
          
          // Process evolution chain
          const processedEvolutions = await processEvolutionChain(data.chain)
          setEvolutionChain(processedEvolutions)
        }
      } catch (error) {
        console.error('Error fetching Pokémon details:', error)
        toast.error('Failed to load Pokémon details')
      } finally {
        setIsLoadingPokemon(false)
      }
    }

    fetchPokemonDetails()
  }, [member.starter_pokemon_form_id])

  useEffect(() => {
    async function fetchPokemonData() {
      if (!member.starter_pokemon_form_id) return
      
      setIsLoadingPokemon(true)
      try {
        const api = new PokemonClient()
        const pokemon = await api.getPokemonById(member.starter_pokemon_form_id)
        const species = await api.getPokemonSpeciesById(member.starter_pokemon_form_id)
        
        const starterPokemon: StarterPokemon = {
          id: pokemon.id,
          name: pokemon.name,
          spriteUrl: pokemon.sprites.other?.["official-artwork"].front_default || pokemon.sprites.front_default || '',
          types: pokemon.types.map(t => t.type.name),
          height: pokemon.height,
          weight: pokemon.weight,
          category: species.genera.find(g => g.language.name === "en")?.genus || "Unknown",
          generation: parseInt(species.generation.url.split('/').pop() || '1'),
          description: species.flavor_text_entries.find(e => e.language.name === "en")?.flavor_text.replace(/\f/g, ' ') || '',
          stats: pokemon.stats.map(s => ({
            name: s.stat.name,
            base: s.base_stat
          })),
          abilities: pokemon.abilities.map(a => a.ability.name)
        }
        
        setPokemonData(starterPokemon)
      } catch (error) {
        console.error('Error fetching Pokémon details:', error)
        toast.error('Failed to load Pokémon details')
      } finally {
        setIsLoadingPokemon(false)
      }
    }

    fetchPokemonData()
  }, [member.starter_pokemon_form_id])

  async function processEvolutionChain(chain: any) {
    const evolutions = []
    let current = chain
    const api = new PokemonClient()

    while (current) {
      const pokemonId = current.species.url.split('/').slice(-2, -1)[0]
      try {
        const pokemonData = await api.getPokemonById(Number(pokemonId))
        evolutions.push({
          id: pokemonId,
          name: current.species.name,
          sprite: pokemonData.sprites.other?.["official-artwork"].front_default,
          details: current.evolution_details[0] || {},
          pokemon: pokemonData,
        })
      } catch (error) {
        console.error(`Failed to fetch Pokemon data for ID ${pokemonId}`)
      }
      current = current.evolves_to[0]
    }
    
    return evolutions
  }

  // Handle move updates
  const handleMoveChange = (index: number, value: string) => {
    const newMoves = [...pokemonMoves]
    newMoves[index] = value
    setPokemonMoves(newMoves)
  }

  // Handle ribbon management
  const handleAddRibbon = () => {
    // TODO: Implement ribbon selection dialog
    const newRibbon = 'Contest Winner' // This would come from a dialog
    setPokemonRibbons([...pokemonRibbons, newRibbon])
  }

  const handleRemoveRibbon = (index: number) => {
    const newRibbons = pokemonRibbons.filter((_, i) => i !== index)
    setPokemonRibbons(newRibbons)
  }

  const handleStartPinChange = () => {
    setIsChangingPin(true)
    setPin('')  // Start with empty PIN
    setConfirmPin('')
    setShowPin(false)
    setShowConfirmPin(false)
    setErrors({})
  }

  const handleResetPin = () => {
    setIsChangingPin(false)
    setPin(member.pin || '')  // Reset to original PIN
    setConfirmPin('')
    setShowPin(false)
    setShowConfirmPin(false)
    setErrors({})
  }

  const handlePinUpdate = async () => {
    if (!pin || !confirmPin || pin.length !== 6 || pin !== confirmPin) {
      if (pin !== confirmPin) {
        setErrors(prev => ({ ...prev, confirmPin: 'PINs do not match' }))
      }
      if (pin.length !== 6) {
        setErrors(prev => ({ ...prev, pin: 'PIN must be exactly 6 digits' }))
      }
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ pin })
        .eq('id', member.id)

      if (updateError) {
        console.error('PIN update error:', updateError.message)
        toast.error(`Failed to update PIN: ${updateError.message}`)
        return
      }

      toast.success('PIN updated successfully')
      handleResetPin()
      router.refresh()
    } catch (error) {
      console.error('Error updating PIN:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!displayName || !fullName) {
        toast.error('Display name and full name are required')
        setIsLoading(false)
        return
      }

      // Validate PIN if changing
      if (isChangingPin) {
        if (pin !== confirmPin) {
          setErrors(prev => ({ ...prev, confirmPin: 'PINs do not match' }))
          toast.error('PINs do not match')
          setIsLoading(false)
          return
        }
        if (pin.length !== 6) {
          setErrors(prev => ({ ...prev, pin: 'PIN must be exactly 6 digits' }))
          toast.error('PIN must be exactly 6 digits')
          setIsLoading(false)
          return
        }
      }

      // Check if there are any validation errors
      if (Object.keys(errors).length > 0) {
        toast.error('Please fix validation errors before submitting')
        setIsLoading(false)
        return
      }

      // Prepare update data
      const updateData = {
        display_name: displayName,
        full_name: fullName,
        birth_date: birthDate || null,
        favorite_color: favoriteColor || null,
        avatar_url: avatarUrl,
        ...(isChangingPin && { pin }),
        // Add Pokémon customization data
        ...(member.starter_pokemon_form_id && {
          starter_pokemon_nickname: pokemonNickname,
          starter_pokemon_nature: pokemonNature,
          starter_pokemon_move_1: pokemonMoves[0],
          starter_pokemon_move_2: pokemonMoves[1],
          starter_pokemon_move_3: pokemonMoves[2],
          starter_pokemon_move_4: pokemonMoves[3],
          starter_pokemon_ribbons: pokemonRibbons,
          starter_pokemon_friendship: pokemonFriendship
        })
      }

      // Update member profile
      const { data: updatedMember, error: updateError } = await supabase
        .from('family_members')
        .update(updateData)
        .eq('id', member.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError.message)
        toast.error(`Failed to update profile: ${updateError.message}`)
        return
      }

      if (!updatedMember) {
        console.error('No member data returned after update')
        toast.error('Failed to update profile: No data returned')
        return
      }

      // If this member has a starter Pokémon and we're updating their display name,
      // update the Pokédex entry notes to reflect the new name
      if (member.starter_pokemon_form_id && displayName !== member.display_name) {
        const { error: pokedexError } = await supabase
          .from('family_pokedex')
          .update({
            notes: `${displayName}'s partner Pokémon`,
            updated_at: new Date().toISOString()
          })
          .eq('family_id', member.family_id)
          .eq('pokemon_form_id', member.starter_pokemon_form_id)

        if (pokedexError) {
          console.error('Pokédex update error:', pokedexError.message)
          // Don't throw here, as the main profile update was successful
          toast.error('Profile updated, but failed to update Pokédex entry')
        }
      }

      toast.success('Profile updated successfully')
      router.refresh()
      router.push(`/protected/trainers/${member.id}/profile`)
    } catch (error) {
      console.error('Error updating profile:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="glass-effect glass-border p-6">
        <Tabs defaultValue="trainer" className="w-full">
          <TabsList className="w-full flex justify-center mb-6 bg-muted/50 rounded-lg p-1">
            <TabsTrigger 
              value="trainer"
              className={cn(
                "flex-1 data-[state=active]:bg-background",
                "transition-colors duration-200"
              )}
            >
              <div className="flex items-center gap-2 justify-center">
                <UserCircle className="h-4 w-4" />
                <span>Trainer Profile</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="pokemon"
              className={cn(
                "flex-1 data-[state=active]:bg-background",
                "transition-colors duration-200"
              )}
            >
              <div className="flex items-center gap-2 justify-center">
                <CircleDot className="h-4 w-4" />
                <span>Partner Pokémon</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Trainer Profile Tab */}
          <TabsContent value="trainer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Avatar Column */}
              <div className="flex flex-col items-center justify-center">
          <AvatarUpload
            uid={member.id}
                  url={getAvatarUrl(avatarUrl)}
            size={150}
            onUpload={(url) => {
                    setAvatarUrl(url)
            }}
          />
        </div>

              {/* Basic Info Column */}
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
          <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
          <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
          <Input
            type="date"
                      id="birthDate"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
                    <Label htmlFor="favoriteColor">Favorite Color</Label>
                    {isMounted && (
                      <div className="flex items-center gap-2">
          <Input
                          type="color"
                          id="favoriteColor"
                          value={favoriteColor || '#000000'}
                          onChange={(e) => setFavoriteColor(e.target.value)}
                          className="h-10 w-20 p-1 cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">
                          {favoriteColor || 'No color selected'}
                        </span>
                      </div>
                    )}
        </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="pin">Security PIN</Label>
                    {!isChangingPin ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="password"
                          value="••••••"
                          disabled
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleStartPinChange}
                        >
                          Change PIN
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
            <div className="space-y-2">
                          <div className="relative">
              <Input
                              type={showPin ? "text" : "password"}
                id="pin"
                              placeholder="Enter 6-digit PIN"
                              value={pin}
                              onChange={handlePinChange}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                              className={cn(
                                "pr-10",
                                errors.pin && "border-destructive focus:ring-destructive"
                              )}
                              aria-describedby={errors.pin ? 'pin-error' : undefined}
                            />
                            {errors.pin && (
                              <p id="pin-error" className="mt-1 text-sm text-destructive">
                                {errors.pin}
                              </p>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPin(!showPin)}
                            >
                              {showPin ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </Button>
            </div>
                          <div className="relative">
              <Input
                              type={showConfirmPin ? "text" : "password"}
                id="confirmPin"
                              placeholder="Confirm PIN"
                              value={confirmPin}
                              onChange={handleConfirmPinChange}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                              className={cn(
                                "pr-10",
                                errors.confirmPin && "border-destructive focus:ring-destructive"
                              )}
                              aria-describedby={errors.confirmPin ? 'confirm-pin-error' : undefined}
                            />
                            {errors.confirmPin && (
                              <p id="confirm-pin-error" className="mt-1 text-sm text-destructive">
                                {errors.confirmPin}
                              </p>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowConfirmPin(!showConfirmPin)}
                            >
                              {showConfirmPin ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResetPin}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            onClick={handlePinUpdate}
                            disabled={
                              isLoading || 
                              !pin || 
                              !confirmPin || 
                              pin.length !== 6 || 
                              pin !== confirmPin
                            }
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                              </div>
                            ) : (
                              'Update PIN'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Trainer Stats */}
            <Card className="p-6 glass-effect glass-border">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Trainer Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Experience Points</span>
                      <span>{member.experience_points || 0} XP</span>
                    </div>
                    <Progress value={((member.experience_points || 0) % 100)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <UserCircle className="h-4 w-4" />
                      {member.trainer_class || 'Novice Trainer'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {member.badges_earned || 0} Badges
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partner Pokémon Tab */}
          <TabsContent value="pokemon">
            {member.starter_pokemon_form_id ? (
              <Tabs defaultValue="card" className="w-full">
                <TabsList className="w-full flex justify-center mb-6 bg-muted/50 rounded-lg p-1">
                  <TabsTrigger 
                    value="card"
                    className={cn(
                      "flex-1 data-[state=active]:bg-background",
                      "transition-colors duration-200"
                    )}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <CircleDot className="h-4 w-4" />
                      <span>Overview</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="evolution"
                    className={cn(
                      "flex-1 data-[state=active]:bg-background",
                      "transition-colors duration-200"
                    )}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Dumbbell className="h-4 w-4" />
                      <span>Evolution</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="info"
                    className={cn(
                      "flex-1 data-[state=active]:bg-background",
                      "transition-colors duration-200"
                    )}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <ScrollText className="h-4 w-4" />
                      <span>Details</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="moves"
                    className={cn(
                      "flex-1 data-[state=active]:bg-background",
                      "transition-colors duration-200"
                    )}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Swords className="h-4 w-4" />
                      <span>Moves</span>
                    </div>
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab - StarterCard */}
                <TabsContent value="card" className="space-y-6">
                  {pokemonData ? (
                    <StarterCard
                      pokemon={pokemonData}
                      isSelected={false}
                      onSelect={() => {}} // No-op since this is view-only
                    />
                  ) : (
                    <Card className="p-6 flex items-center justify-center glass-effect glass-border">
                      {isLoadingPokemon ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <p className="text-muted-foreground">No partner Pokémon data available</p>
                      )}
                    </Card>
                  )}
                </TabsContent>

                {/* Evolution Tab */}
                <TabsContent value="evolution" className="space-y-6">
                  {evolutionChain.length > 0 ? (
                    <Card className="p-6 glass-effect glass-border">
                      <CardHeader className="px-0 pt-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Dumbbell className="h-4 w-4" />
                          Evolution Line
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-0">
                        <div className="flex items-center justify-center">
                          {evolutionChain.map((evo, index) => (
                            <div key={evo.id} className="flex items-center">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "relative w-16 h-16 rounded-lg overflow-hidden glass-effect",
                                  evo.id === member.starter_pokemon_form_id?.toString() && 
                                  "ring-2 ring-primary ring-offset-2"
                                )}>
                                  {evo.pokemon?.sprites.front_default && (
                                    <img
                                      src={evo.pokemon.sprites.front_default}
                                      alt={evo.name}
                                      className="object-contain w-full h-full pixelated"
                                    />
                                  )}
                                </div>
                                <span className="text-sm capitalize mt-1">
                                  {evo.name}
                                </span>
                                {evo.details.min_level && (
                                  <span className="text-xs text-muted-foreground">
                                    Lv.{evo.details.min_level}
                                  </span>
                                )}
                              </div>
                              {index < evolutionChain.length - 1 && (
                                <div className="flex flex-col items-center mx-4">
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                  {evo.details.min_level && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                      Level Up
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="p-6 flex items-center justify-center glass-effect glass-border">
                      <p className="text-muted-foreground">No evolution data available</p>
                    </Card>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="info" className="space-y-6">
                  <Card className="p-6 glass-effect glass-border">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                      {/* Nickname Field */}
                      <div className="space-y-2">
                        <Label htmlFor="pokemonNickname">Nickname</Label>
                        <Input
                          id="pokemonNickname"
                          value={pokemonNickname}
                          onChange={(e) => setPokemonNickname(e.target.value)}
                          placeholder="Give your partner a nickname"
                          className="glass-effect"
                        />
                      </div>

                      {/* Nature Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="pokemonNature">Nature</Label>
                        <select
                          id="pokemonNature"
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2"
                          value={pokemonNature}
                          onChange={(e) => setPokemonNature(e.target.value)}
                        >
                          {[
                            'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
                            'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
                            'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
                            'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
                            'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
                          ].map((nature) => (
                            <option key={nature.toLowerCase()} value={nature.toLowerCase()}>
                              {nature}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Friendship Level */}
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                          <span>Friendship Level</span>
                          <span className="text-sm text-muted-foreground">
                            {pokemonFriendship}/255
                          </span>
                        </Label>
                        <Progress 
                          value={(pokemonFriendship / 255) * 100} 
                          className="h-2"
                        />
                        <Input
                          type="range"
                          min="0"
                          max="255"
                          value={pokemonFriendship}
                          onChange={(e) => setPokemonFriendship(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Moves Tab */}
                <TabsContent value="moves" className="space-y-6">
                  <Card className="p-6 glass-effect glass-border">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-base">Moves & Achievements</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                      {/* Favorite Moves */}
                      <div className="space-y-2">
                        <Label>Favorite Moves</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {pokemonMoves.map((move, index) => (
                            <Input
                              key={index}
                              placeholder={`Move ${index + 1}`}
                              value={move}
                              onChange={(e) => handleMoveChange(index, e.target.value)}
                              className="glass-effect"
                            />
                          ))}
                        </div>
      </div>

                      {/* Ribbons and Achievements */}
                      <div className="space-y-2">
                        <Label>Ribbons & Achievements</Label>
                        <div className="flex flex-wrap gap-2">
                          {pokemonRibbons.map((ribbon, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="glass-effect group"
                              onClick={() => handleRemoveRibbon(index)}
                            >
                              {ribbon}
                              <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Badge>
                          ))}
        <Button
          type="button"
          variant="outline"
                            size="sm"
                            className="glass-effect"
                            onClick={handleAddRibbon}
                          >
                            Add Ribbon
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground">No partner Pokémon selected</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            Object.keys(errors).length > 0 || 
            !displayName || 
            !fullName || 
            (isChangingPin && (!pin || !confirmPin || pin.length !== 6))
          }
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  )
} 