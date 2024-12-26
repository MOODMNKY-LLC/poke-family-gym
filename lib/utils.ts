import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "./supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPokeBallImage(theme?: string | null): string {
  return theme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'
}

export function getAvatarUrl(path: string | null, theme?: string): string {
  if (!path) return getPokeBallImage(theme)
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path
  
  // If it's a relative path starting with '/', assume it's from the public directory
  if (path.startsWith('/')) return path
  
  const supabase = createClient()
  
  // Remove any leading 'avatars/' from the path as the bucket name is already 'avatars'
  const cleanPath = path.replace(/^avatars\//, '')
  
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(cleanPath)

  return publicUrl || getPokeBallImage(theme)
}
