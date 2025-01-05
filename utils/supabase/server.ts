import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const cookieMethods = {
    get(name: string) {
      const cookie = cookieStore.get(name)
      return cookie?.value ?? ''
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set(name, value, options)
      } catch (error) {
        // Handle cookie errors in development
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set(name, '', { ...options, maxAge: 0 })
      } catch (error) {
        // Handle cookie errors in development
      }
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods
    }
  )
}