import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "./supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type PokeBallType = 'poke_ball' | 'great_ball' | 'ultra_ball' | 'master_ball'

export function getPokeBallImage(type: PokeBallType | string): string {
  // Map of Pokéball types to their image paths
  const pokeBallImages = {
    poke_ball: '/images/pokeball-light.svg',
    great_ball: '/images/pokeball-great.svg',
    ultra_ball: '/images/pokeball-dark.svg',
    master_ball: '/images/pokeball-master.svg'
  } as const

  // Return the specific ball image or default to Poké Ball
  return pokeBallImages[type as PokeBallType] || pokeBallImages.poke_ball
}

export function getAvatarUrl(path: string | null, theme?: string): string {
  if (!path) return getPokeBallImage('poke_ball')
  
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

  return publicUrl || getPokeBallImage('poke_ball')
} 