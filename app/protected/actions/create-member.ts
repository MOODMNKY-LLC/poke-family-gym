'use server'

import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMember(formData: FormData) {
  const supabase = await createClient()

  const displayName = formData.get('displayName') as string
  const birthDate = formData.get('birthDate') as string
  const favoriteColor = formData.get('favoriteColor') as string
  const starterPokemonId = parseInt(formData.get('starterPokemonId') as string)
  const starterPokemonNickname = formData.get('starterPokemonNickname') as string || null

  console.log('Creating member with data:', {
    displayName,
    birthDate,
    favoriteColor,
    starterPokemonId,
    starterPokemonNickname
  })

  // Get the user's family ID
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('id', user?.id)
    .single()

  console.log('User family ID:', member?.family_id)

  // Create the new member
  const { data: newMember, error } = await supabase
    .from('family_members')
    .insert({
      display_name: displayName,
      birth_date: birthDate,
      favorite_color: favoriteColor,
      family_id: member?.family_id,
      starter_pokemon_form_id: starterPokemonId,
      starter_pokemon_nickname: starterPokemonNickname,
      starter_pokemon_obtained_at: new Date().toISOString()
    })
    .select()
    .single()

  console.log('New member created:', newMember)
  console.log('Creation error:', error)

  if (error) {
    throw new Error('Failed to create family member')
  }

  revalidatePath('/protected')
  return newMember
} 