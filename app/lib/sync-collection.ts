import { createClient } from '@/utils/supabase/client'

interface CollectionPokemon {
  pokemon_form_id: number
  obtained_at: string
  obtained_method: string
  is_starter: boolean | null
  is_favorite: boolean | null
  level: number
  nickname: string | null
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

export async function syncMemberCollection(memberId: string) {
  const result = {
    added: 0,
    dexAdded: 0,
    errors: [] as string[]
  }

  try {
    const supabase = createClient()

    // 1. Get member details
    const { data: member } = await supabase
      .from('family_members')
      .select(`
        *,
        starter_pokemon:pokemon_forms!starter_pokemon_form_id (
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

    if (!member) {
      result.errors.push('Member not found')
      return result
    }

    // 2. Get existing collection
    const { data: existingCollection } = await supabase
      .from('personal_pokemon_collections')
      .select(`
        pokemon_form_id,
        obtained_at,
        obtained_method,
        is_starter,
        is_favorite,
        level,
        nickname,
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
      .returns<CollectionPokemon[]>()

    const existingPokemonIds = new Set(existingCollection?.map(p => p.pokemon_form_id) || [])
    console.log('Existing Pokemon IDs:', Array.from(existingPokemonIds))

    // 3. Sync starter Pokémon
    if (member.starter_pokemon?.id && !existingPokemonIds.has(member.starter_pokemon.id)) {
      const { error: starterError } = await supabase
        .from('personal_pokemon_collections')
        .insert({
          member_id: memberId,
          pokemon_form_id: member.starter_pokemon.id,
          obtained_at: new Date().toISOString(),
          obtained_method: 'starter',
          is_starter: true,
          is_favorite: false,
          level: 5,
          nickname: null
        })

      if (starterError) {
        result.errors.push(`Failed to sync starter: ${starterError.message}`)
      } else {
        result.added++
        existingPokemonIds.add(member.starter_pokemon.id)
      }
    }

    console.log('Collection sync completed for member:', memberId)

    // 4. Sync lootbox rewards
    const { data: lootboxRewards } = await supabase
      .from('lootbox_rewards')
      .select('pokemon_form_id, opened_at')
      .eq('member_id', memberId)

    for (const reward of lootboxRewards || []) {
      if (!existingPokemonIds.has(reward.pokemon_form_id)) {
        const { error: rewardError } = await supabase
          .from('personal_pokemon_collections')
          .insert({
            member_id: memberId,
            pokemon_form_id: reward.pokemon_form_id,
            obtained_at: reward.opened_at,
            obtained_method: 'lootbox',
            is_starter: false,
            is_favorite: false,
            level: 5,
            nickname: null
          })

        if (rewardError) {
          result.errors.push(`Failed to sync lootbox reward: ${rewardError.message}`)
        } else {
          result.added++
          existingPokemonIds.add(reward.pokemon_form_id)
        }
      }
    }

    // 5. Sync pack rewards
    const { data: packRewards } = await supabase
      .from('pack_rewards')
      .select('pokemon_form_id, revealed_at')
      .eq('member_id', memberId)

    for (const reward of packRewards || []) {
      if (!existingPokemonIds.has(reward.pokemon_form_id)) {
        const { error: packError } = await supabase
          .from('personal_pokemon_collections')
          .insert({
            member_id: memberId,
            pokemon_form_id: reward.pokemon_form_id,
            obtained_at: reward.revealed_at,
            obtained_method: 'pack',
            is_starter: false,
            is_favorite: false,
            level: 5,
            nickname: null
          })

        if (packError) {
          result.errors.push(`Failed to sync pack reward: ${packError.message}`)
        } else {
          result.added++
          existingPokemonIds.add(reward.pokemon_form_id)
        }
      }
    }

    // 6. Sync with family Pokédex
    const { data: familyDex } = await supabase
      .from('family_pokedex')
      .select('pokemon_form_id')
      .eq('family_id', member.family_id)

    const existingDexIds = new Set(familyDex?.map(p => p.pokemon_form_id) || [])
    const newDexEntries = Array.from(existingPokemonIds).filter(id => !existingDexIds.has(id))

    if (newDexEntries.length > 0) {
      const { error: dexError } = await supabase
        .from('family_pokedex')
        .insert(
          newDexEntries.map(pokemon_form_id => ({
            family_id: member.family_id,
            pokemon_form_id,
            discovered_by: memberId,
            discovered_at: new Date().toISOString()
          }))
        )

      if (dexError) {
        result.errors.push(`Failed to sync family Pokédex: ${dexError.message}`)
      } else {
        result.dexAdded = newDexEntries.length
      }
    }

    return result
  } catch (error) {
    console.error('Error syncing collection:', error)
    result.errors.push('Unexpected error during sync')
    return result
  }
} 