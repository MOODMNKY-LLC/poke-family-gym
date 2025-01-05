import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface PoolItem {
  pokemon_id: number
  pokemon_name: string
  rarity: string
  variant: string
  is_shiny: boolean
}

export async function POST(request: Request) {
  try {
    const { packId, memberId } = await request.json()
    console.log('Opening pack:', { packId, memberId })
    
    const supabase = await createClient()

    // Start a transaction
    const { data: pack, error: packError } = await supabase
      .from('pack_inventory')
      .select(`
        *,
        family_members!inner (
          family_id
        )
      `)
      .eq('id', packId)
      .eq('member_id', memberId)
      .eq('status', 'unopened')
      .single()

    if (packError || !pack) {
      console.error('Pack error:', { packError, pack })
      return NextResponse.json(
        { error: 'Pack not found or already opened' },
        { status: 404 }
      )
    }

    const familyId = pack.family_members.family_id
    console.log('Found pack:', { pack, familyId })

    // Get the lootbox configuration
    const { data: lootbox, error: lootboxError } = await supabase
      .from('family_lootboxes')
      .select('*')
      .eq('family_id', familyId)
      .eq('cost_type', pack.pack_type)
      .single()

    if (lootboxError || !lootbox) {
      console.error('Lootbox error:', { lootboxError, lootbox, familyId, packType: pack.pack_type })
      return NextResponse.json(
        { error: 'Lootbox configuration not found' },
        { status: 404 }
      )
    }

    console.log('Found lootbox:', lootbox)

    // Get the pool of possible Pokémon
    const { data: pool, error: poolError } = await supabase
      .from('lootbox_pokemon_pools')
      .select('*')
      .eq('lootbox_id', lootbox.id)

    if (poolError || !pool) {
      console.error('Pool error:', { poolError, pool, lootboxId: lootbox.id })
      return NextResponse.json(
        { error: 'Pokemon pool not found' },
        { status: 404 }
      )
    }

    console.log('Found pool:', { poolSize: pool.length, lootboxId: lootbox.id })

    // Select random Pokémon based on rarity tiers
    const rewards = []
    const { guaranteed_slots = 1, max_per_pack = 3 } = lootbox
    
    // First, fulfill guaranteed slots
    for (let i = 0; i < guaranteed_slots; i++) {
      // Filter pool by the lootbox's rarity (e.g., 'rare' for Ultra Ball)
      const tierPool = pool.filter((p: PoolItem) => p.rarity === lootbox.rarity)
      console.log('Tier pool:', { 
        targetRarity: lootbox.rarity, 
        poolSize: tierPool.length,
        sample: tierPool.slice(0, 3)
      })

      if (tierPool.length > 0) {
        const randomPokemon = tierPool[Math.floor(Math.random() * tierPool.length)]
        rewards.push({
          pokemonId: randomPokemon.pokemon_id,
          name: randomPokemon.pokemon_name,
          rarity: randomPokemon.rarity,
          variant: randomPokemon.variant || 'normal',
          isShiny: Math.random() < 0.01 // 1% chance for shiny
        })
      }
    }

    // Then add random bonus slots up to max_per_pack
    const remainingSlots = max_per_pack - guaranteed_slots
    for (let i = 0; i < remainingSlots; i++) {
      if (Math.random() < 0.5) { // 50% chance for bonus slot
        const randomPokemon = pool[Math.floor(Math.random() * pool.length)] as PoolItem
        rewards.push({
          pokemonId: randomPokemon.pokemon_id,
          name: randomPokemon.pokemon_name,
          rarity: randomPokemon.rarity,
          variant: randomPokemon.variant || 'normal',
          isShiny: Math.random() < 0.01 // 1% chance for shiny
        })
      }
    }

    console.log('Generated rewards:', rewards)

    // Mark pack as opened
    const { error: updateError } = await supabase
      .from('pack_inventory')
      .update({ 
        status: 'opened',
        opened_at: new Date().toISOString()
      })
      .eq('id', packId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pack status' },
        { status: 500 }
      )
    }

    // Add Pokémon to member's collection
    const { error: rewardError } = await supabase
      .from('member_pokemon')
      .insert(
        rewards.map(reward => ({
          member_id: memberId,
          pokemon_id: reward.pokemonId,
          variant: reward.variant,
          is_shiny: reward.isShiny,
          obtained_from: 'pack_opening',
          obtained_at: new Date().toISOString(),
          metadata: {
            pack_id: packId,
            pack_type: pack.pack_type,
            rarity: reward.rarity
          }
        }))
      )

    if (rewardError) {
      console.error('Reward error:', rewardError)
      return NextResponse.json(
        { error: 'Failed to add rewards to collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      rewards,
      openedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error opening pack:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to open pack' },
      { status: 500 }
    )
  }
} 