'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PokemonSpriteImageProps {
  src: string
  alt: string
  className?: string
}

export function PokemonSpriteImage({ src, alt, className }: PokemonSpriteImageProps) {
  const [error, setError] = useState(false)

  return (
    <div className={cn("relative w-16 h-16", className)}>
      <Image 
        src={error ? '/fallback-pokemon.png' : src}
        alt={alt}
        width={64}
        height={64}
        className="object-contain"
        onError={() => setError(true)}
        priority
      />
    </div>
  )
} 