import { NextResponse } from 'next/server'
import { pokeSyncService } from '@/lib/services/poke-sync.service'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Create server client
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get member role using server client
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('name')
      .eq('id', member.role_id)
      .single()

    if (roleError || !role || !['admin', 'parent'].includes(role.name)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Start sync process for all Pokemon
    await pokeSyncService.syncAllPokemon()

    return NextResponse.json({ 
      message: 'Pokemon sync started successfully' 
    })
  } catch (error: any) {
    console.error('Error syncing Pokemon:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync Pokemon' },
      { status: 500 }
    )
  }
} 