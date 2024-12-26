import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "@/lib/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPokeBallImage(theme?: string | null): string {
  return theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'
}

export function getAvatarUrl(path: string | null, theme?: string): string {
  if (!path) return getPokeBallImage(theme)
  
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  
  return publicUrl || getPokeBallImage(theme)
} 