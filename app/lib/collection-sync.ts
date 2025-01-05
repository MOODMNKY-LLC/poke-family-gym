import { SupabaseClient } from '@supabase/supabase-js'
import { PokemonClient } from 'pokenode-ts'

const pokeClient = new PokemonClient()

interface SyncResult {
  added: number
  updated: number
  errors: string[]
  dexAdded: number
}

interface PokemonSpecies {
  id: number
}

interface PokemonForm {
  id: number
  name: string
  species: PokemonSpecies
}

interface FamilyMember {
  id: string
  family_id: string
  starter_pokemon_form_id: number | null
  starter_pokemon?: PokemonForm | null
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
    console.log('Starting sync collection for member:', memberId)
    
    // 1. Get member's family ID and starter Pokémon
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select(`
        id, 
        family_id, 
        starter_pokemon_form_id,
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
      .single<FamilyMember>()

    if (memberError) {
      console.error('Error fetching member:', memberError)
      throw new Error(`Member fetch failed: ${memberError.message}`)
    }

    if (!member) {
      throw new Error('Member not found')
    }

    console.log('Found member:', {
      id: member.id,
      familyId: member.family_id,
      starterPokemonFormId: member.starter_pokemon_form_id,
      starterPokemon: member.starter_pokemon
    })

    // 2. Get existing collection
    const { data: existingCollection, error: collectionError } = await supabase
      .from('personal_pokemon_collections')
      .select(`
        id,
        pokemon_form_id,
        obtained_at,
        obtained_from,
        is_starter,
        is_favorite,
        level,
        nickname,
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
      .eq('member_id', memberId)

    if (collectionError) {
      console.error('Error fetching existing collection:', collectionError)
      throw new Error(`Collection fetch failed: ${collectionError.message}`)
    }

    const existingPokemonIds = new Set(existingCollection?.map(p => p.pokemon_form_id) || [])
    console.log('Existing collection:', {
      count: existingCollection?.length || 0,
      pokemonIds: Array.from(existingPokemonIds)
    })

    // 3. Sync starter Pokémon
    if (member.starter_pokemon?.id && !existingPokemonIds.has(member.starter_pokemon.id)) {
      console.log('Adding starter Pokémon:', {
        formId: member.starter_pokemon.id,
        name: member.starter_pokemon.name
      })

      const { error: starterError } = await supabase
        .from('personal_pokemon_collections')
        .insert({
          member_id: memberId,
          pokemon_form_id: member.starter_pokemon.id,
          obtained_at: new Date().toISOString(),
          obtained_from: 'starter',
          is_starter: true,
          is_favorite: false,
          level: 5,
          nickname: null
        })

      if (starterError) {
        console.error('Error adding starter Pokémon:', starterError)
        result.errors.push(`Failed to sync starter: ${starterError.message}`)
      } else {
        result.added++
        existingPokemonIds.add(member.starter_pokemon.id)
        console.log('Successfully added starter Pokémon')
      }
    } else {
      console.log('Starter Pokémon already in collection or not set')
    }

    // 4. Sync lootbox rewards
    const { data: lootboxRewards, error: lootboxError } = await supabase
      .from('lootbox_rewards')
      .select('pokemon_form_id, opened_at')
      .eq('member_id', memberId)

    if (lootboxError) {
      console.error('Error fetching lootbox rewards:', lootboxError)
      result.errors.push(`Failed to fetch lootbox rewards: ${lootboxError.message}`)
    } else {
      console.log('Found lootbox rewards:', lootboxRewards?.length || 0)
    }

    for (const reward of lootboxRewards || []) {
      if (!existingPokemonIds.has(reward.pokemon_form_id)) {
        console.log('Adding lootbox reward:', reward)

        const { error: rewardError } = await supabase
          .from('personal_pokemon_collections')
          .insert({
            member_id: memberId,
            pokemon_form_id: reward.pokemon_form_id,
            obtained_at: reward.opened_at,
            obtained_from: 'lootbox',
            is_starter: false,
            is_favorite: false,
            level: 5,
            nickname: null
          })

        if (rewardError) {
          console.error('Error adding lootbox reward:', rewardError)
          result.errors.push(`Failed to sync lootbox reward: ${rewardError.message}`)
        } else {
          result.added++
          existingPokemonIds.add(reward.pokemon_form_id)
          console.log('Successfully added lootbox reward')
        }
      }
    }

    // 5. Sync pack rewards
    const { data: packRewards, error: packError } = await supabase
      .from('pack_rewards')
      .select('pokemon_form_id, revealed_at')
      .eq('member_id', memberId)

    if (packError) {
      console.error('Error fetching pack rewards:', packError)
      result.errors.push(`Failed to fetch pack rewards: ${packError.message}`)
    } else {
      console.log('Found pack rewards:', packRewards?.length || 0)
    }

    for (const reward of packRewards || []) {
      if (!existingPokemonIds.has(reward.pokemon_form_id)) {
        console.log('Adding pack reward:', reward)

        const { error: rewardError } = await supabase
          .from('personal_pokemon_collections')
          .insert({
            member_id: memberId,
            pokemon_form_id: reward.pokemon_form_id,
            obtained_at: reward.revealed_at,
            obtained_from: 'pack',
            is_starter: false,
            is_favorite: false,
            level: 5,
            nickname: null
          })

        if (rewardError) {
          console.error('Error adding pack reward:', rewardError)
          result.errors.push(`Failed to sync pack reward: ${rewardError.message}`)
        } else {
          result.added++
          existingPokemonIds.add(reward.pokemon_form_id)
          console.log('Successfully added pack reward')
        }
      }
    }

    // 6. Sync with family Pokédex
    const { data: familyDex, error: dexError } = await supabase
      .from('family_pokedex')
      .select('pokemon_form_id')
      .eq('family_id', member.family_id)

    if (dexError) {
      console.error('Error fetching family Pokédex:', dexError)
      result.errors.push(`Failed to fetch family Pokédex: ${dexError.message}`)
    }

    const existingDexIds = new Set(familyDex?.map(p => p.pokemon_form_id) || [])
    const newDexEntries = Array.from(existingPokemonIds).filter(id => !existingDexIds.has(id))

    console.log('Family Pokédex sync:', {
      existingEntries: existingDexIds.size,
      newEntries: newDexEntries.length
    })

    if (newDexEntries.length > 0) {
      const { error: dexInsertError } = await supabase
        .from('family_pokedex')
        .insert(
          newDexEntries.map(pokemon_form_id => ({
            family_id: member.family_id,
            pokemon_form_id,
            discovered_by: memberId,
            discovered_at: new Date().toISOString()
          }))
        )

      if (dexInsertError) {
        console.error('Error updating family Pokédex:', dexInsertError)
        result.errors.push(`Failed to sync family Pokédex: ${dexInsertError.message}`)
      } else {
        result.dexAdded = newDexEntries.length
        console.log('Successfully added new Pokédex entries:', result.dexAdded)
      }
    }

    console.log('Sync completed with result:', result)
    return result

  } catch (error) {
    console.error('Sync failed:', error)
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
  pokemonFormId: number,
  familyId: string,
  supabase: SupabaseClient
) {
  // 1. Add to personal collection
  const { error: collectionError } = await supabase
    .from('personal_pokemon_collections')
    .insert({
      member_id: memberId,
      pokemon_form_id: pokemonFormId,
      obtained_at: new Date().toISOString(),
      obtained_from: 'pack',
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
    .eq('pokemon_form_id', pokemonFormId)
    .single()

  if (!existingDex) {
    const { error: dexError } = await supabase
      .from('family_pokedex')
      .insert({
        family_id: familyId,
        pokemon_form_id: pokemonFormId,
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
  pokemonFormId: number,
  familyId: string,
  supabase: SupabaseClient
) {
  // 1. Add to personal collection
  const { error: collectionError } = await supabase
    .from('personal_pokemon_collections')
    .insert({
      member_id: memberId,
      pokemon_form_id: pokemonFormId,
      obtained_at: new Date().toISOString(),
      obtained_from: 'lootbox',
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
    .eq('pokemon_form_id', pokemonFormId)
    .single()

  if (!existingDex) {
    const { error: dexError } = await supabase
      .from('family_pokedex')
      .insert({
        family_id: familyId,
        pokemon_form_id: pokemonFormId,
        discovered_by: memberId,
        discovered_at: new Date().toISOString()
      })

    if (dexError) {
      console.error('Failed to update family Pokédex:', dexError)
    }
  }
} 