import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { syncMemberCollection } from '@/app/lib/collection-sync'

export async function POST(request: Request) {
  try {
    const { memberId } = await request.json()
    
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const result = await syncMemberCollection(memberId, supabase)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync collection' },
      { status: 500 }
    )
  }
} 