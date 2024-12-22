import { createClient } from '@/utils/supabase/client'

export function getAvatarUrl(path: string | null) {
  if (!path) return null
  const supabase = createClient()
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
} 