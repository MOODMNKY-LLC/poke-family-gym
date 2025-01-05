import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { 
  Pencil, 
  Star, 
  Award, 
  Zap, 
  Heart, 
  Swords, 
  Shield, 
  FastForward,
  Trophy,
  Sparkles,
  ScrollText,
  Activity,
  Target,
  ChevronRight,
  Plus,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { PokemonClient, EvolutionClient } from 'pokenode-ts'
import { PokemonSpriteImage } from '@/components/pokemon/pokemon-sprite-image'
import { MyPacks } from '@/app/protected/components/my-packs'
import { TeamsTab } from '@/app/protected/components/teams-tab'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Move, ChainLink } from 'pokenode-ts'
import { MoveSelector } from "@/app/protected/components/move-selector"
import { calculatePokemonLevel, checkEvolutionEligibility } from '@/lib/pokemon'
import { EvolutionRequirements } from '@/app/protected/components/evolution-requirements'
import { syncMemberCollection } from '@/app/lib/collection-sync'
import { toast } from 'sonner'
import { SyncCollectionButton } from '@/app/protected/components/sync-collection-button'
import { CollectionGrid } from '@/app/protected/components/collection-grid'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface CollectionPokemon {
  id: string
  member_id: string
  pokemon_form_id: number
  nickname: string | null
  level: number
  obtained_at: string
  is_starter: boolean | null
  is_favorite: boolean | null
  pokemon_form: {
    id: number
    name: string
    species: {
      id: number
      name: string
      generation_id: number
    }
  }
}

// Create a singleton Pokemon client
const pokeClient = new PokemonClient()
const evolutionClient = new EvolutionClient()

const POKEBALL_TYPES = [
  {
    id: 'poke_ball',
    name: 'Poké Balls',
    icon: '/images/pokeball-light.svg',
    color: 'text-[#FF5D5D]',
    balanceKey: 'pokeball_balance'
  },
  {
    id: 'great_ball',
    name: 'Great Balls',
    icon: '/images/pokeball-great.svg',
    color: 'text-[#4F94EF]',
    balanceKey: 'great_ball_balance'
  },
  {
    id: 'ultra_ball',
    name: 'Ultra Balls',
    icon: '/images/pokeball-dark.svg',
    color: 'text-[#FFD700]',
    balanceKey: 'ultra_ball_balance'
  },
  {
    id: 'master_ball',
    name: 'Master Balls',
    icon: '/images/pokeball-master.svg',
    color: 'text-[#FB4FEF]',
    balanceKey: 'master_ball_balance'
  }
] as const

// Type color mapping based on official Pokémon type colors
const TYPE_COLORS = {
  normal: { bg: "bg-[#A8A878]", text: "text-white" },
  fire: { bg: "bg-[#F08030]", text: "text-white" },
  water: { bg: "bg-[#6890F0]", text: "text-white" },
  electric: { bg: "bg-[#F8D030]", text: "text-black" },
  grass: { bg: "bg-[#78C850]", text: "text-white" },
  ice: { bg: "bg-[#98D8D8]", text: "text-black" },
  fighting: { bg: "bg-[#C03028]", text: "text-white" },
  poison: { bg: "bg-[#A040A0]", text: "text-white" },
  ground: { bg: "bg-[#E0C068]", text: "text-black" },
  flying: { bg: "bg-[#A890F0]", text: "text-white" },
  psychic: { bg: "bg-[#F85888]", text: "text-white" },
  bug: { bg: "bg-[#A8B820]", text: "text-white" },
  rock: { bg: "bg-[#B8A038]", text: "text-white" },
  ghost: { bg: "bg-[#705898]", text: "text-white" },
  dragon: { bg: "bg-[#7038F8]", text: "text-white" },
  dark: { bg: "bg-[#705848]", text: "text-white" },
  steel: { bg: "bg-[#B8B8D0]", text: "text-black" },
  fairy: { bg: "bg-[#EE99AC]", text: "text-black" }
} as const

// Add interface for move data
interface MoveData {
  name: string
  level: number
}

// Add color mapping for stats
const statColors = {
  hp: "bg-red-400",
  attack: "bg-orange-400",
  defense: "bg-blue-400",
  "special-attack": "bg-purple-400",
  "special-defense": "bg-green-400",
  speed: "bg-pink-400",
} as const

// Add StatBar component
function StatBar({ value, color }: { value: number, color: string }) {
  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
      {/* Base stat bar (0-100) */}
      <div
        className={cn(
          "h-full transition-all duration-500",
          color
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
      
      {/* Bonus stat bar (100-110) */}
      {value > 100 && (
        <div
          className={cn(
            "h-full transition-all duration-500 absolute right-0",
            color,
            "opacity-40" // Make bonus stats slightly transparent
          )}
          style={{ width: `${Math.min(value - 100, 10)}%` }}
        />
      )}
      
      {/* 100 mark divider */}
      <div className="absolute right-[9.09%] top-0 h-full w-0.5 bg-background/50" />
    </div>
  )
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  
  const { data: member } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('id', id)
    .single()

  return {
    title: member ? `${member.display_name} - Profile` : 'Trainer Profile',
    description: 'View and manage your trainer profile'
  }
}

export default async function TrainerProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/sign-in')
  }

  // Fetch member details with expanded data
  const { data: member, error } = await supabase
    .from('family_members')
    .select(`
      *,
      roles (name, description),
      starter_pokemon: pokemon_forms!starter_pokemon_form_id (
        id, name, species_id,
        pokemon_species (name, id)
      ),
      family_profiles!inner (
        family_name,
        family_motto
      )
    `)
    .eq('id', id)
    .single()

  if (error || !member) {
    redirect('/protected')
  }

  // Fetch personal collection
  const { data: collection, error: collectionError } = await supabase
    .from('personal_pokemon_collections')
    .select(`
      id,
      member_id,
      pokemon_form_id,
      nickname,
      level,
      obtained_at,
      is_starter,
      is_favorite,
      pokemon_form:pokemon_forms!personal_pokemon_collections_pokemon_form_id_fkey (
        id,
        name,
        species:pokemon_species (
          id,
          name,
          generation_id
        )
      )
    `)
    .eq('member_id', id)
    .returns<CollectionPokemon[]>()

  // Debug logging
  console.log('Member ID:', id)
  console.log('Collection query:', {
    data: collection,
    error: collectionError,
    memberHasStarter: member.starter_pokemon_form_id !== null,
    starterPokemon: member.starter_pokemon
  })

  // Fetch teams
  const { data: teams } = await supabase
    .from('pokemon_teams')
    .select(`
      *,
      team_members:pokemon_team_members (
        slot_number,
        collection_pokemon:collection_id (
          id,
          nickname,
          level,
          pokemon:pokemon_id (
            id,
            name,
            types,
            sprites
          )
        )
      )
    `)
    .eq('member_id', id)
    .order('created_at', { ascending: false })

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('activity_events')
    .select('*')
    .eq('member_id', id)
    .order('timestamp', { ascending: false })
    .limit(5)

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from('pokeball_transactions')
    .select('*')
    .eq('member_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get family synergy data
  const { data: synergy } = await supabase
    .from('family_synergy')
    .select('*')
    .eq('family_id', member.family_id)
    .gte('synergy_date', new Date().toISOString().split('T')[0])
    .single()

  // Fetch active tasks
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', id)
    .in('status', ['pending', 'in_progress'])
    .order('due_date', { ascending: true })
    .limit(5)

  // Get avatar URL
  let avatarUrl = null
  if (member.avatar_url) {
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(member.avatar_url)
    avatarUrl = data.publicUrl
  }

  // Fetch Pokémon details using PokeAPI
  let pokemonDetails = null
  if (member.starter_pokemon?.pokemon_species?.id) {
    try {
      pokemonDetails = await pokeClient.getPokemonById(
        member.starter_pokemon.pokemon_species.id
      )
    } catch (error) {
      console.error('Error fetching Pokemon details:', error)
    }
  }

  // Get sprite URL with fallbacks
  const spriteUrl = pokemonDetails?.sprites?.front_default || 
                   pokemonDetails?.sprites?.front_shiny ||
                   '/placeholder-pokemon.png'

  // Calculate level and experience progress
  const level = Math.floor(Math.sqrt(member.experience_points || 0) / 10) + 1
  const nextLevelExp = Math.pow((level + 1) * 10, 2)
  const expProgress = ((member.experience_points || 0) / nextLevelExp) * 100

  // Fetch evolution chain data
  let evolutionChainData = null
  if (member.starter_pokemon?.pokemon_species?.id) {
    try {
      const speciesData = await pokeClient.getPokemonSpeciesById(
        member.starter_pokemon.pokemon_species.id
      )
      if (speciesData.evolution_chain?.url) {
        const chainId = speciesData.evolution_chain.url.split('/').filter(Boolean).pop()
        const evolutionData = await evolutionClient.getEvolutionChainById(parseInt(chainId!))
        evolutionChainData = evolutionData
      }
    } catch (error) {
      console.error('Error fetching evolution chain:', error)
    }
  }

  // Fetch available moves
  let availableMoves: MoveData[] = []
  if (pokemonDetails?.moves) {
    availableMoves = pokemonDetails.moves
      .filter(move => move.version_group_details.some(
        detail => detail.move_learn_method.name === "level-up"
      ))
      .map(move => ({
        name: move.move.name,
        level: Math.min(...move.version_group_details
          .filter(detail => detail.move_learn_method.name === "level-up")
          .map(detail => detail.level_learned_at)
        )
      }))
      .sort((a, b) => a.level - b.level)
  }

  // Function to render evolution chain
  function renderEvolutionChain(chain: ChainLink) {
    const species = chain.species.name
    const evolvesTo = chain.evolves_to

    return (
      <div className="flex flex-col items-center">
        <div className="p-2 rounded-lg bg-muted/50">
          <span className="capitalize">{species}</span>
        </div>
        {evolvesTo.length > 0 && (
          <>
            <div className="h-6 w-px bg-border my-2" />
            <div className="flex gap-8">
              {evolvesTo.map((evolution, index) => (
                <div key={index}>
                  {renderEvolutionChain(evolution)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Function to handle move updates
  async function updateMove(slot: number, moveName: string) {
    const moveField = `starter_pokemon_move_${slot}`
    const { error } = await supabase
      .from('family_members')
      .update({ [moveField]: moveName })
      .eq('id', member.id)

    if (error) {
      console.error('Error updating move:', error)
    }
  }

  // Calculate Pokémon's current level based on member's experience
  const pokemonLevel = calculatePokemonLevel(member.experience_points || 0)
  
  // Check evolution eligibility
  let evolutionRequirement = null
  if (evolutionChainData && member.starter_pokemon?.pokemon_species?.name) {
    evolutionRequirement = checkEvolutionEligibility(
      evolutionChainData.chain,
      member.starter_pokemon.pokemon_species.name,
      pokemonLevel,
      member.starter_pokemon_friendship || 0
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <GlassCard className="p-8">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>
                {member.display_name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div>
              <h1 className="text-2xl font-bold">{member.display_name}</h1>
              <p className="text-muted-foreground capitalize">
                    {member.trainer_class || 'Novice Trainer'}
              </p>
                  {member.personal_motto && (
                    <p className="text-sm italic mt-1">"{member.personal_motto}"</p>
                  )}
          </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/protected/trainers/${member.id}/profile/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>

              {/* Trainer Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Level {level}</span>
                  <span className="text-sm text-muted-foreground">
                    {member.experience_points || 0} / {nextLevelExp} XP
                  </span>
                </div>
                <Progress value={expProgress} className="h-2" />
              </div>

              {/* Badges and Achievements */}
              <div className="flex gap-2 mt-4">
                {member.badges_earned > 0 && (
                  <Badge variant="secondary">
                    <Award className="w-4 h-4 mr-1" />
                    {member.badges_earned} Badges
                  </Badge>
                )}
                {synergy?.bonus_awarded && (
                  <Badge variant="secondary">
                    <Zap className="w-4 h-4 mr-1" />
                    Family Synergy
                  </Badge>
                )}
                {(member.starter_pokemon_ribbons || []).map((ribbon: string) => (
                  <Badge key={ribbon} variant="outline">
                    <Star className="w-4 h-4 mr-1" />
                    {ribbon}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Pokéball Balances */}
          <div className="grid grid-cols-4 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
            {POKEBALL_TYPES.map((ball) => (
              <div key={ball.id} className="text-center">
                <div className="relative mx-auto w-8 h-8 mb-2">
                  <Image
                    src={ball.icon}
                    alt={ball.name}
                    width={32}
                    height={32}
                    className="transition-transform hover:scale-110"
                  />
                </div>
                <div className={cn("font-medium", ball.color)}>
                  {member[ball.balanceKey as keyof typeof member] || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ball.name}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <Tabs defaultValue="partner" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partner">Partner</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="packs">Packs</TabsTrigger>
          </TabsList>

          <TabsContent value="partner">
            {member.starter_pokemon && pokemonDetails ? (
              <GlassCard className="p-8">
                <div className="space-y-8">
                  {/* Top Section: Split into two columns */}
                  <div className="grid grid-cols-[400px,1fr] gap-6">
                    {/* Left Column - Pokemon Card */}
                    <div className="relative w-full h-[400px]">
                      <div className="w-full h-full relative rounded-lg overflow-hidden glass-effect glass-border bg-gradient-to-br from-accent/50 to-background">
                        {/* Header with types and number */}
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 z-10">
                          {/* Partner Badge */}
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            <Heart className="w-3 h-3 mr-1" fill="currentColor" />
                            Partner
                          </Badge>

                          {/* Types and Number */}
                          <div className="text-right space-y-2">
                            <div className="flex gap-1.5 justify-end">
                              {pokemonDetails.types.map((type) => {
                                const typeColor = TYPE_COLORS[type.type.name as keyof typeof TYPE_COLORS] || { bg: "bg-gray-500", text: "text-white" }
                                return (
                                  <Badge 
                        key={type.type.name}
                                    className={cn(
                                      "capitalize",
                                      typeColor.bg,
                                      typeColor.text
                                    )}
                      >
                        {type.type.name}
                                  </Badge>
                                )
                              })}
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              #{pokemonDetails.id.toString().padStart(3, '0')} - Partner Pokémon
                            </span>
                          </div>
                        </div>

                        {/* Pokemon Image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse" />
                            <PokemonSpriteImage 
                              src={pokemonDetails.sprites.other?.["official-artwork"].front_default || spriteUrl}
                              alt={member.starter_pokemon.pokemon_species.name}
                              className="w-auto h-auto max-w-[300%] max-h-[300%] object-contain transform -translate-y-8 relative z-10"
                            />
                          </div>
                        </div>

                        {/* Bottom Info Container */}
                        <div className="absolute bottom-4 left-4 right-4 space-y-2 z-10">
                          {/* Abilities */}
                          <div className="flex gap-2 mb-4">
                            {pokemonDetails.abilities.map((ability) => (
                              <div key={ability.ability.name} 
                                className="flex-1 flex items-center gap-2 p-2 rounded-lg glass-effect glass-border bg-background/80 backdrop-blur-sm"
                              >
                                {ability.is_hidden ? (
                                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
                                    Hidden
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                                    Normal
                                  </Badge>
                                )}
                                <span className="capitalize text-sm">{ability.ability.name.replace('-', ' ')}</span>
                              </div>
                            ))}
                          </div>

                          {/* Progress Bars Container */}
                          <div className="space-y-2">
                            {/* Experience Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Experience</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${((member.starter_pokemon_experience || 0) % 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono w-12 text-right flex-shrink-0">
                                {member.starter_pokemon_experience || 0}
                              </span>
                            </div>

                            {/* Friendship Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Friendship</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="h-full bg-pink-500 transition-all"
                                  style={{ width: `${(member.starter_pokemon_friendship || 0) / 255 * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono w-12 text-right flex-shrink-0">
                                {member.starter_pokemon_friendship || 0}/255
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Pokemon Details */}
                    <div className="space-y-6">
                      {/* Name and Actions */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-3xl font-bold">
                            {member.starter_pokemon_nickname || member.starter_pokemon.pokemon_species.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Level {pokemonLevel}
                            </Badge>
                            {member.starter_pokemon_friendship >= 200 && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                <Heart className="w-3 h-3 mr-1" fill="currentColor" />
                                Best Friend
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>

                      {/* Nature Selection */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1.5">Nature</p>
                        <Select defaultValue={member.starter_pokemon_nature || undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select nature" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Adamant", "Bashful", "Bold", "Brave", "Calm"].map(nature => (
                              <SelectItem key={nature} value={nature.toLowerCase()}>
                                {nature}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Stats and Moves Grid */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Left Column: Stats */}
                        <div className="space-y-4">
                          {/* Base Stats */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-primary" />
                              <h3 className="font-semibold">Base Stats</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {pokemonDetails.stats.map((stat) => {
                                const statPercentage = (stat.base_stat / 110) * 100
                                return (
                                  <div key={stat.stat.name} className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground capitalize">
                                        {stat.stat.name.replace('-', ' ')}
                                      </span>
                                      <span className="text-sm font-medium">
                                        {stat.base_stat}
                      </span>
                                    </div>
                                    <StatBar 
                                      value={statPercentage} 
                                      color={statColors[stat.stat.name as keyof typeof statColors] || "bg-neutral-400"} 
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Moves */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Swords className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold">Moves</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map((slot) => (
                              <MoveSelector
                                key={slot}
                                slot={slot}
                                memberId={member.id}
                                currentMove={member[`starter_pokemon_move_${slot}` as keyof typeof member] as string}
                                availableMoves={availableMoves}
                              />
                    ))}
                  </div>
                </div>
              </div>
            </div>
                  </div>

                  {/* Middle Section: Evolution Line */}
                  {evolutionChainData && (
                    <div>
                      <Separator className="mb-8" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FastForward className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">Evolution Line</h3>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {/* Evolution Chain Display */}
                          <div className="flex items-center justify-between w-full">
                            {/* First Evolution */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className={cn(
                                "relative w-32 h-32 rounded-lg overflow-hidden glass-effect glass-border transition-all duration-300",
                                evolutionChainData.chain.species.name === member.starter_pokemon?.pokemon_species.name && 
                                "ring-2 ring-primary ring-offset-2"
                              )}>
                                <div className="absolute inset-0">
                                  <div className="w-full h-full flex items-center justify-center p-2">
                                    <PokemonSpriteImage
                                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolutionChainData.chain.species.url.split('/').slice(-2, -1)[0]}.png`}
                                      alt={evolutionChainData.chain.species.name}
                                      className="max-w-full max-h-full w-auto h-auto object-contain pixelated"
                                    />
                                  </div>
                                </div>
                              </div>
                              <span className="mt-2 text-sm font-medium capitalize">
                                {evolutionChainData.chain.species.name}
                              </span>
                            </div>

                            {/* Evolution Arrow */}
                            {evolutionChainData.chain.evolves_to[0] && (
                              <div className="flex-shrink-0 mx-4">
                                <ChevronRight className="w-6 h-6 text-primary/50" />
                              </div>
                            )}

                            {/* Second Evolution */}
                            {evolutionChainData.chain.evolves_to[0] && (
                              <div className="flex-1 flex flex-col items-center">
                                <div className={cn(
                                  "relative w-32 h-32 rounded-lg overflow-hidden glass-effect glass-border transition-all duration-300",
                                  evolutionChainData.chain.evolves_to[0].species.name === member.starter_pokemon?.pokemon_species.name && 
                                  "ring-2 ring-primary ring-offset-2"
                                )}>
                                  <div className="absolute inset-0">
                                    <div className="w-full h-full flex items-center justify-center p-2">
                                      <PokemonSpriteImage
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolutionChainData.chain.evolves_to[0].species.url.split('/').slice(-2, -1)[0]}.png`}
                                        alt={evolutionChainData.chain.evolves_to[0].species.name}
                                        className="max-w-full max-h-full w-auto h-auto object-contain pixelated"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <span className="mt-2 text-sm font-medium capitalize">
                                  {evolutionChainData.chain.evolves_to[0].species.name}
                                </span>
                                {evolutionChainData.chain.evolves_to[0].evolution_details[0]?.min_level && (
                                  <span className="text-xs text-primary/90 mt-1">
                                    Level {evolutionChainData.chain.evolves_to[0].evolution_details[0].min_level}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Evolution Arrow */}
                            {evolutionChainData.chain.evolves_to[0]?.evolves_to[0] && (
                              <div className="flex-shrink-0 mx-4">
                                <ChevronRight className="w-6 h-6 text-primary/50" />
                              </div>
                            )}

                            {/* Third Evolution */}
                            {evolutionChainData.chain.evolves_to[0]?.evolves_to[0] && (
                              <div className="flex-1 flex flex-col items-center">
                                <div className={cn(
                                  "relative w-32 h-32 rounded-lg overflow-hidden glass-effect glass-border transition-all duration-300",
                                  evolutionChainData.chain.evolves_to[0].evolves_to[0].species.name === member.starter_pokemon?.pokemon_species.name && 
                                  "ring-2 ring-primary ring-offset-2"
                                )}>
                                  <div className="absolute inset-0">
                                    <div className="w-full h-full flex items-center justify-center p-2">
                                      <PokemonSpriteImage
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolutionChainData.chain.evolves_to[0].evolves_to[0].species.url.split('/').slice(-2, -1)[0]}.png`}
                                        alt={evolutionChainData.chain.evolves_to[0].evolves_to[0].species.name}
                                        className="max-w-full max-h-full w-auto h-auto object-contain pixelated"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <span className="mt-2 text-sm font-medium capitalize">
                                  {evolutionChainData.chain.evolves_to[0].evolves_to[0].species.name}
                                </span>
                                {evolutionChainData.chain.evolves_to[0].evolves_to[0].evolution_details[0]?.min_level && (
                                  <span className="text-xs text-primary/90 mt-1">
                                    Level {evolutionChainData.chain.evolves_to[0].evolves_to[0].evolution_details[0].min_level}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Evolution Requirements */}
                        {evolutionRequirement && (
                          <div className="mt-4 p-3 rounded-lg glass-effect glass-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="font-medium">Evolution Available!</span>
                              </div>
                              {evolutionRequirement.missingRequirements.length === 0 && (
                                <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Evolve
                                </Button>
                              )}
                            </div>
                            {evolutionRequirement.missingRequirements.length > 0 && (
                              <div className="text-sm text-muted-foreground mt-2 ml-6">
                                Requirements: {evolutionRequirement.missingRequirements.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ribbons Section */}
                  {member.starter_pokemon_ribbons && member.starter_pokemon_ribbons.length > 0 && (
                    <div>
                      <Separator className="mb-8" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">Ribbons</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {member.starter_pokemon_ribbons.map((ribbon: string) => (
                            <div key={ribbon} 
                              className="flex items-center gap-2 p-2 rounded-lg glass-effect glass-border"
                            >
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="capitalize">{ribbon.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6 text-center">
                <p className="text-muted-foreground">No partner Pokémon selected yet</p>
              </GlassCard>
            )}
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab memberId={id} collection={collection || []} />
          </TabsContent>

          <TabsContent value="collection">
            <GlassCard className="p-6">
              <CollectionGrid collection={collection || []} memberId={id} />
        </GlassCard>
          </TabsContent>

          <TabsContent value="packs">
            <MyPacks memberId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 