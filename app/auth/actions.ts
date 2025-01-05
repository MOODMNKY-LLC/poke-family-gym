import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies()
          try {
            cookieStore.set({
              name,
              value,
              ...options
            } as ResponseCookie)
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies()
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            } as ResponseCookie)
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        }
      }
    }
  )
}

// Create an admin client with the service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
) 