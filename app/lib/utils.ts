export function getAvatarUrl(url: string | undefined | null): string {
  if (!url) return '/images/pokeball-light.svg'
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`
} 