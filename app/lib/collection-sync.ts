import { SupabaseClient } from '@supabase/supabase-js'
import { PokemonClient } from 'pokenode-ts'

const pokeClient = new PokemonClient()

interface SyncResult {
  added: number
  updated: number
  errors: string[]
  dexAdded: number
}

export async function syncMemberCollection(
  memberId: string,
  supabase: SupabaseClient
): Promise<SyncResult> {
  const result: SyncResult = {
    added: 0,
    updated: 0,
    errors: [],
    dexAdded: 0
  }

  try {
    // 1. Get member's family ID
    const { data: member } = await supabase
      .from('family_members')
      .select('id, family_id, starter_pokemon_form_id')
      .eq('id', memberId)
      .single()

    if (!member) {
      throw new Error('Member not found')
    }

    // 2. Get existing collection
    const { data: existingCollection } = await supabase
      .from('personal_pokemon_collections')
      .select('pokemon_id')
      .eq('member_id', memberId)

    const existingPokemonIds = new Set(existingCollection?.map(p => p.pokemon_id) || [])

    // 3. Sync starter Pokémon
    if (member.starter_pokemon_form_id && !existingPokemonIds.has(member.starter_pokemon_form_id)) {
      const { error: starterError } = await supabase
        .from('personal_pokemon_collections')
        .insert({
          member_id: memberId,
          pokemon_id: member.starter_pokemon_form_id,
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
        existingPokemonIds.add(member.starter_pokemon_form_id)
      }
    }

    // 4. Sync lootbox rewards
    const { data: lootboxRewards } = await supabase
      .from('lootbox_rewards')
      .select('pokemon_id, opened_at')
      .eq('member_id', memberId)

    for (const reward of lootboxRewards || []) {
      if (!existingPokemonIds.has(reward.pokemon_id)) {
        const { error: rewardError } = await supabase
          .from('personal_pokemon_collections')
          .insert({
            member_id: memberId,
            pokemon_id: reward.pokemon_id,
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
          existingPokemonIds.add(reward.pokemon_id)
        }
      }
    }

    // 5. Sync pack rewards
    const { data: packRewards } = await supabase
      .from('pack_rewards')
      .select('pokemon_id, revealed_at')
      .eq('member_id', memberId)

    for (const reward of packRewards || []) {
      if (!existingPokemonIds.has(reward.pokemon_id)) {
        const { error: packError } = await supabase
          .from('personal_pokemon_collections')
          .insert({
            member_id: memberId,
            pokemon_id: reward.pokemon_id,
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
          existingPokemonIds.add(reward.pokemon_id)
        }
      }
    }

    // 6. Sync with family Pokédex
    const { data: familyDex } = await supabase
      .from('family_pokedex')
      .select('pokemon_id')
      .eq('family_id', member.family_id)

    const existingDexIds = new Set(familyDex?.map(p => p.pokemon_id) || [])
    const newDexEntries = Array.from(existingPokemonIds).filter(id => !existingDexIds.has(id))

    if (newDexEntries.length > 0) {
      const { error: dexError } = await supabase
        .from('family_pokedex')
        .insert(
          newDexEntries.map(pokemon_id => ({
            family_id: member.family_id,
            pokemon_id,
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

    // 7. Create activity events for new additions
    if (result.added > 0 || result.dexAdded > 0) {
      await supabase
        .from('activity_events')
        .insert({
          member_id: memberId,
          type: 'collection_sync',
          details: {
            pokemon_added: result.added,
            dex_entries_added: result.dexAdded
          }
        })
    }

    return result

  } catch (error) {
    if (error instanceof Error) {
      result.errors.push(`Sync failed: ${error.message}`)
    } else {
      result.errors.push('Sync failed: Unknown error occurred')
    }
    return result
  }
}

// Function to sync collection when a new pack is opened
export async function syncPackReward(
  memberId: string,
  pokemonId: number,
  familyId: string,
  supabase: SupabaseClient
) {
  // 1. Add to personal collection
  const { error: collectionError } = await supabase
    .from('personal_pokemon_collections')
    .insert({
      member_id: memberId,
      pokemon_id: pokemonId,
      obtained_at: new Date().toISOString(),
      obtained_method: 'pack',
      is_starter: false,
      is_favorite: false,
      level: 5,
      nickname: null
    })

  if (collectionError) {
    console.error('Failed to add pack reward to collection:', collectionError)
    return
  }

  // 2. Check and update family Pokédex
  const { data: existingDex } = await supabase
    .from('family_pokedex')
    .select('id')
    .eq('family_id', familyId)
    .eq('pokemon_id', pokemonId)
    .single()

  if (!existingDex) {
    const { error: dexError } = await supabase
      .from('family_pokedex')
      .insert({
        family_id: familyId,
        pokemon_id: pokemonId,
        discovered_by: memberId,
        discovered_at: new Date().toISOString()
      })

    if (dexError) {
      console.error('Failed to update family Pokédex:', dexError)
    }
  }
}

// Function to sync collection when a lootbox is opened
export async function syncLootboxReward(
  memberId: string,
  pokemonId: number,
  familyId: string,
  supabase: SupabaseClient
) {
  // 1. Add to personal collection
  const { error: collectionError } = await supabase
    .from('personal_pokemon_collections')
    .insert({
      member_id: memberId,
      pokemon_id: pokemonId,
      obtained_at: new Date().toISOString(),
      obtained_method: 'lootbox',
      is_starter: false,
      is_favorite: false,
      level: 5,
      nickname: null
    })

  if (collectionError) {
    console.error('Failed to add lootbox reward to collection:', collectionError)
    return
  }

  // 2. Check and update family Pokédex
  const { data: existingDex } = await supabase
    .from('family_pokedex')
    .select('id')
    .eq('family_id', familyId)
    .eq('pokemon_id', pokemonId)
    .single()

  if (!existingDex) {
    const { error: dexError } = await supabase
      .from('family_pokedex')
      .insert({
        family_id: familyId,
        pokemon_id: pokemonId,
        discovered_by: memberId,
        discovered_at: new Date().toISOString()
      })

    if (dexError) {
      console.error('Failed to update family Pokédex:', dexError)
    }
  }
} 