import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  Star, 
  Trophy, 
  Users, 
  Activity, 
  Sparkles, 
  ShoppingBag,
  Medal,
  Search,
  SortAsc,
  Filter,
  Bot,
  Zap
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AddFamilyMemberDialog } from './components/add-family-member-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GymStats } from './components/gym-stats'
import { PokemonStats } from './components/pokemon-stats'
import { ActivityFeed } from './components/activity-feed'
import { getDashboardData } from './lib/get-dashboard-data'
import { PokemonClient } from 'pokenode-ts'
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// Import client components
import { AnimatedHeader } from './components/animated-header'
import { AnimatedTabContent } from './components/animated-tab-content'
import { FamilyMemberCard } from '@/components/family/member-card'
import type { DashboardData } from '@/types/dashboard'
import type { Pokemon } from 'pokenode-ts'
import type { Role } from '@/types/types'
import { PokedexTable } from './components/pokedex-table'
import { ShopItems } from './components/shop-items'
import { RankingsBoard } from './components/rankings-board'
import { FamilyMembersGrid } from './components/family-members-grid'
import { PokemonGrid } from "@/app/pokedex/components/pokemon-grid"
import { FamilyPokedexGrid } from './components/family-pokedex-grid'
import { PokeDexter } from './components/poke-dexter'
import { SynergyStats } from './components/synergy/synergy-stats'
import { StreakStats } from './components/synergy/streak-stats'

// Define PokemonWithEntry type locally since it's only used here
interface PokemonWithEntry extends Pokemon {
  entry?: {
    pokemonId: number
    nickname: string | null
    obtainedAt: string
  }
}

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/sign-in")

  const dashboardData = await getDashboardData(supabase, user.id)

  // Fetch roles from the database
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name, description')
    .order('id', { ascending: true })

  if (!roles) {
    console.error('Failed to fetch roles')
    return null
  }

  // Fetch Pokémon data for all entries
  const api = new PokemonClient()
  const pokemonDataMap = new Map<number, Pokemon>()

  // First, fetch starter Pokémon data
  if (dashboardData.members?.length > 0) {
    await Promise.all(
      dashboardData.members
        .filter(member => member.starterPokemon?.formId)
        .map(async member => {
          const formId = member.starterPokemon!.formId
          if (pokemonDataMap.has(formId)) return

          try {
            const pokemon = await api.getPokemonById(formId)
            pokemonDataMap.set(formId, pokemon)
          } catch (error) {
            console.error(`Error fetching Pokémon data for ID ${formId}:`, error)
          }
        })
    )
  }

  // Calculate gym level based on total points
  const gymLevel = Math.floor((dashboardData.gymStats?.totalPokeballs || 0) / 100) + 1
  const pointsToNextLevel = 100 - ((dashboardData.gymStats?.totalPokeballs || 0) % 100)

  // Fetch synergy data
  const { data: synergyData } = await supabase
    .from('family_synergy')
    .select('*')
    .eq('family_id', user.id)
    .order('synergy_date', { ascending: false })
    .limit(1)
    .single()

  // Fetch streak data with member names
  const { data: streakData } = await supabase
    .from('task_streaks')
    .select(`
      *,
      member:member_id (
        display_name,
        avatar_url
      )
    `)
    .eq('family_id', user.id)
    .order('current_streak', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background">
      <div className="flex-1 space-y-8 p-8 pt-6 container mx-auto max-w-7xl relative">
        {/* Subtle radial gradient overlay using pokemon colors */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pokemon-electric/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pokemon-water/[0.02] to-transparent" />
        </div>
        
        <div className="relative">
          <AnimatedHeader 
            familyName={dashboardData.familyProfile.name}
            motto={dashboardData.familyProfile.motto}
            gymLevel={gymLevel}
            pointsToNextLevel={pointsToNextLevel}
            userId={user.id}
            roles={roles}
          />

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className={cn(
              "grid w-full grid-cols-7 lg:w-[840px] mx-auto",
              "glass-effect glass-border"
            )}>
              <TabsTrigger 
                value="overview" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <Activity className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <Users className="w-4 h-4" />
                Members
              </TabsTrigger>
              <TabsTrigger 
                value="pokedex" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <Star className="w-4 h-4" />
                Pokédex
              </TabsTrigger>
              <TabsTrigger 
                value="shop" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                Shop
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <Medal className="w-4 h-4" />
                Ranks
              </TabsTrigger>
              <TabsTrigger 
                value="pokedexter" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <Bot className="w-4 h-4" />
                PokéDexter
              </TabsTrigger>
              <TabsTrigger 
                value="synergy" 
                className={cn(
                  "flex items-center gap-2",
                  "data-[state=active]:bg-primary/10",
                  "data-[state=active]:text-primary"
                )}
              >
                <Zap className="w-4 h-4" />
                Synergy
              </TabsTrigger>
            </TabsList>

            <AnimatedTabContent>
              <TabsContent value="overview" className="space-y-8">
                <GymStats stats={dashboardData.gymStats} />
                <div className="grid gap-8 md:grid-cols-2">
                  <PokemonStats stats={dashboardData.pokemonStats} />
                  <ActivityFeed 
                    initialEvents={dashboardData.recentActivity}
                    familyId={user.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="members">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-primary">
                        Family Members
                      </h2>
                      <p className="text-muted-foreground">
                        Your family's trainers and their partner Pokémon
                      </p>
                    </div>
                  </div>
                  
                  <FamilyMembersGrid 
                    members={dashboardData.members}
                    pokemonDataMap={pokemonDataMap}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pokedex">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-primary">
                        Family Pokédex
                      </h2>
                      <p className="text-muted-foreground">
                        Track and manage your family's Pokémon collection
                      </p>
                    </div>
                    <Badge variant="outline" className="text-primary">
                      {dashboardData.pokemonStats?.totalCaught || 0} / 151 Caught
                    </Badge>
                  </div>
                  <FamilyPokedexGrid familyId={user.id} />
                </div>
              </TabsContent>

              <TabsContent value="shop">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">
                      Poké Shop
                    </h2>
                    <p className="text-muted-foreground">
                      Spend your hard-earned Pokéballs on rewards and items
                    </p>
                  </div>
                  <ShopItems />
                </div>
              </TabsContent>

              <TabsContent value="leaderboard">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">
                      Family Rankings
                    </h2>
                    <p className="text-muted-foreground">
                      Track achievements and compete for top positions
                    </p>
                  </div>
                  <RankingsBoard 
                    members={dashboardData.members}
                    gymRank={dashboardData.gymStats.gymRank}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pokedexter">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">
                      PokéDexter AI Assistant
                    </h2>
                    <p className="text-muted-foreground">
                      Your personal Pokémon expert and family gym advisor
                    </p>
                  </div>
                  <PokeDexter />
                </div>
              </TabsContent>

              <TabsContent value="synergy">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-primary">
                        Family Synergy
                      </h2>
                      <p className="text-muted-foreground">
                        Track your family's collaborative achievements and streaks
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <SynergyStats synergy={synergyData} />
                    <StreakStats streaks={streakData} />
                  </div>
                </div>
              </TabsContent>

            </AnimatedTabContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
