import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { TeamBuilder } from "@/app/protected/components/team-builder"
import { Metadata } from "next"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: member } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('id', id)
    .single()

  return {
    title: member ? `${member.display_name} - Team Builder` : 'Team Builder',
    description: 'Build and manage your competitive Pokémon teams'
  }
}

export default async function TeamBuilderPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch member details
  const { data: member, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !member) {
    redirect('/protected')
  }

  // Fetch personal collection
  const { data: collection } = await supabase
    .from('personal_pokemon_collections')
    .select(`
      *,
      pokemon:pokemon_id (
        id,
        name,
        types,
        stats,
        sprites
      )
    `)
    .eq('member_id', id)
    .order('obtained_at', { ascending: false })

  // Function to save team
  async function saveTeam(team: any) {
    'use server'
    
    const supabase = await createClient()

    // Create new team
    const { data: newTeam, error: teamError } = await supabase
      .from('pokemon_teams')
      .insert({
        member_id: id,
        name: team.name,
        team_format: team.format,
        team_style: team.members.map((m: any) => m.role).join(',')
      })
      .select()
      .single()

    if (teamError || !newTeam) {
      throw new Error('Failed to create team')
    }

    // Add team members
    const teamMembers = team.members.map((member: any) => ({
      team_id: newTeam.id,
      collection_id: member.id,
      slot_number: member.slot,
      team_role: member.role
    }))

    const { error: membersError } = await supabase
      .from('pokemon_team_members')
      .insert(teamMembers)

    if (membersError) {
      throw new Error('Failed to add team members')
    }

    redirect(`/protected/trainers/${id}/profile?tab=teams`)
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Team Builder</h1>
        <TeamBuilder 
          memberId={member.id} 
          collection={collection || []} 
          onSave={saveTeam}
        />
      </div>
    </div>
  )
} 