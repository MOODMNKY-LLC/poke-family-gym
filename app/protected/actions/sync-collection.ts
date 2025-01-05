'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function syncCollection(memberId: string) {
  if (!memberId) {
    console.error('No member ID provided')
    return { error: 'Member ID is required' }
  }

  console.log('Starting sync collection for member:', memberId)
  
  // Create a Supabase client with the service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // 1. Get member's starter Pokémon and check if it's in collection
    console.log('Fetching member data...')
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select(`
        id,
        starter_pokemon_form_id,
        starter_pokemon:pokemon_forms (
          id,
          name,
          species:pokemon_species (
            id,
            name,
            generation_id
          )
        )
      `)
      .eq('id', memberId)
      .single()

    if (memberError) {
      console.error('Failed to fetch member:', memberError)
      return { error: 'Failed to fetch member data' }
    }

    if (!member?.starter_pokemon_form_id) {
      console.log('No starter found for member:', memberId)
      return { error: 'No starter Pokémon found' }
    }

    console.log('Found member with starter:', member.starter_pokemon_form_id)

    // 2. Get existing collection entries
    const { data: existingEntries, error: existingError } = await supabase
      .from('personal_pokemon_collections')
      .select(`
        id,
        pokemon_id,
        pokemon_form:pokemon_forms (
          id,
          name,
          species:pokemon_species (
            id,
            name,
            generation_id
          )
        )
      `)
      .eq('member_id', memberId)

    if (existingError) {
      console.error('Failed to fetch existing collection:', existingError)
      return { error: 'Failed to fetch existing collection' }
    }

    const existingIds = new Set(existingEntries?.map(e => e.pokemon_id) || [])
    console.log('Existing Pokemon IDs:', Array.from(existingIds))

    // 3. Find missing Pokémon (just starter for now since pack_rewards table doesn't exist yet)
    const missingIds = [member.starter_pokemon_form_id].filter(id => !existingIds.has(id))
    console.log('Missing Pokemon IDs:', missingIds)

    if (missingIds.length === 0) {
      console.log('Collection is up to date for member:', memberId)
      return { message: 'Collection is already up to date' }
    }

    // 4. Add missing Pokémon to collection
    console.log('Adding missing Pokemon to collection...')
    const { data: insertData, error: insertError } = await supabase
      .from('personal_pokemon_collections')
      .insert(
        missingIds.map(pokemonId => ({
          member_id: memberId,
          pokemon_id: pokemonId,
          obtained_at: new Date().toISOString(),
          obtained_from: pokemonId === member.starter_pokemon_form_id ? 'starter_selection' : 'reward_sync',
          is_starter: pokemonId === member.starter_pokemon_form_id
        }))
      )
      .select(`
        id,
        pokemon_id,
        pokemon_form:pokemon_forms (
          id,
          name,
          species:pokemon_species (
            id,
            name,
            generation_id
          )
        )
      `)

    if (insertError) {
      console.error('Failed to insert Pokemon:', insertError)
      return { error: 'Failed to sync collection' }
    }

    console.log('Successfully added Pokemon:', insertData)

    // 5. Revalidate the profile page to show updated collection
    console.log('Revalidating path...')
    revalidatePath(`/protected/trainers/${memberId}/profile`)

    return { 
      message: `Successfully added ${missingIds.length} Pokémon to collection`,
      added: missingIds.length,
      pokemon: insertData
    }
  } catch (error) {
    console.error('Unexpected error during sync:', error)
    return { error: 'An unexpected error occurred while syncing collection' }
  }
} 