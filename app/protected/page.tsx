import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AddFamilyMemberDialog } from './components/add-family-member-dialog'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from 'date-fns'
import { GymStats } from './components/gym-stats'
import { PokemonStats } from './components/pokemon-stats'
import { ActivityFeed } from './components/activity-feed'
import { getDashboardData } from './lib/get-dashboard-data'
import { PokemonClient } from 'pokenode-ts'
import { getAvatarUrl } from '@/utils/get-avatar-url'
import { cn } from '@/lib/utils'

// Create a separate client component for the Pokemon card
import { PokemonPartnerCard } from '@/components/pokemon/partner-card'

// Create a client component for the member card
import { FamilyMemberCard } from '@/components/family/member-card'

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

  // Fetch Pokémon data for starter Pokémon
  const api = new PokemonClient()
  const starterPokemonData = await Promise.all(
    dashboardData.members
      .filter(member => member.starterPokemon?.formId)
      .map(async member => {
        try {
          const pokemon = await api.getPokemonById(member.starterPokemon!.formId)
          return {
            memberId: member.id,
            pokemon
          }
        } catch (error) {
          console.error('Error fetching Pokémon data:', error)
          return null
        }
      })
  )

  // Create a map for easy lookup
  const pokemonDataMap = new Map(
    starterPokemonData
      .filter((data): data is { memberId: string; pokemon: any } => data !== null)
      .map(data => [data.memberId, data.pokemon])
  )

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            Welcome to {dashboardData.familyProfile.name} Gym
          </h1>
          {dashboardData.familyProfile.motto && (
            <p className="text-muted-foreground">
              {dashboardData.familyProfile.motto}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/account">
              <Settings className="h-4 w-4 mr-2" />
              Family Settings
            </Link>
          </Button>
          <AddFamilyMemberDialog 
            familyId={user.id} 
            roles={roles}
          />
        </div>
      </div>

      {/* Gym Stats */}
      <GymStats stats={dashboardData.gymStats} />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Pokemon Stats */}
        <PokemonStats stats={dashboardData.pokemonStats} />

        {/* Activity Feed */}
        <ActivityFeed 
          initialEvents={dashboardData.recentActivity}
          familyId={user.id}
        />
      </div>

      {/* Family Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Family Members</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData.members.map((member) => {
            const starterPokemon = pokemonDataMap.get(member.id)
            
            return (
              <FamilyMemberCard
                key={member.id}
                member={member}
                starterPokemon={starterPokemon}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
