import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import Link from "next/link"
import { PokemonClient } from 'pokenode-ts'
import { PokemonSpriteImage } from '@/components/pokemon/pokemon-sprite-image'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Create a singleton Pokemon client
const pokeClient = new PokemonClient()

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
        species_id,
        pokemon_species (
          name,
          id
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

  // Fetch additional Pokemon data from PokeAPI if we have a starter
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

  // Get the sprite URL with fallback
  const spriteUrl = pokemonDetails?.sprites?.front_default || 
                   pokemonDetails?.sprites?.front_shiny ||
                   `/fallback-pokemon.png`

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

          {member.starter_pokemon && pokemonDetails && (
            <div className="mt-6 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Partner Pokémon</h2>
              <div className="flex items-center gap-4">
                <PokemonSpriteImage 
                  src={spriteUrl}
                  alt={member.starter_pokemon.pokemon_species.name || 'Pokemon'}
                />
                <div>
                  <p className="font-medium">
                    {member.starter_pokemon_nickname || 'Unnamed Partner'}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.starter_pokemon.pokemon_species.name}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {pokemonDetails.types.map((type) => (
                      <span 
                        key={type.type.name}
                        className={`px-2 py-1 rounded text-xs pokemon-type-${type.type.name}`}
                      >
                        {type.type.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
} 