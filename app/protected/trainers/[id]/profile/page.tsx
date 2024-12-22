import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import Link from "next/link"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

export default async function TrainerProfilePage({ 
  params,
  searchParams 
}: PageProps) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()

  // Fetch the family member details with role info
  const { data: member, error } = await supabase
    .from('family_members')
    .select(`
      *,
      roles (
        name,
        description
      ),
      starter_pokemon: pokemon_forms!starter_pokemon_form_id (
        id,
        name,
        pokemon_species (
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !member) {
    redirect('/protected')
  }

  // Get the public URL for the avatar
  let avatarUrl = null
  if (member.avatar_url) {
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(member.avatar_url)
    avatarUrl = data.publicUrl
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <GlassCard className="p-8">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>
                {member.display_name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{member.display_name}</h1>
              <p className="text-muted-foreground capitalize">
                {member.roles.name} Trainer
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button asChild variant="outline" size="sm">
              <Link href={`/protected/trainers/${member.id}/profile/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>

          {member.starter_pokemon && (
            <div className="mt-6 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Partner Pokémon</h2>
              <div className="flex items-center gap-4">
                <img 
                  src={`/pokemon/${member.starter_pokemon.pokemon_species.name}.png`}
                  alt={member.starter_pokemon.name}
                  className="w-16 h-16"
                />
                <div>
                  <p className="font-medium">{member.starter_pokemon_nickname}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.starter_pokemon.pokemon_species.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
} 