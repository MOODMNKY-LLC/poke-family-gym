import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createClient()

    // Search in our local database using Supabase's full-text search
    const { data: results, error } = await supabase
      .from('pokemon')
      .select('id, name')
      .textSearch('name', query.toLowerCase(), {
        type: 'websearch',
        config: 'english'
      })
      .limit(10)

    if (error) throw error

    return NextResponse.json(results || [])
  } catch (error: any) {
    console.error('Pokemon search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search Pokemon' },
      { status: 500 }
    )
  }
} 