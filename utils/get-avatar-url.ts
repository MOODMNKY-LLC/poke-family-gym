import { createClient } from '@/utils/supabase/client'

export function getAvatarUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  
  const supabase = createClient()
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
} 