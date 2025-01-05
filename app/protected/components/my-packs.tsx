'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useSound } from '@/hooks/use-sound'
import { cn, getPokeBallImage } from '@/lib/utils'
import { Sparkles } from '@/components/ui/sparkles'

interface MyPacksProps {
  memberId: string | null
  onPackOpened?: () => void
}

interface PackInventoryItem {
  id: number
  pack_type: 'poke_ball' | 'great_ball' | 'ultra_ball' | 'master_ball'
  status: 'unopened' | 'opened'
  created_at: string
  cost_paid: number
}

const packAnimation = {
  initial: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.05,
    rotate: [-5, 5, -5],
    transition: {
      rotate: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      }
    }
  },
  opening: {
    scale: [1, 1.2, 0],
    rotate: [0, 360, 720],
    opacity: [1, 0.8, 0],
    transition: {
      duration: 1.5,
      ease: "easeInOut"
    }
  }
}

// Add pack type configurations
const PACK_STYLES = {
  poke_ball: {
    color: 'text-[#FF5D5D]',  // Bright red for Poké Ball
    borderColor: 'border-[#FF5D5D]/30',
    glowColor: 'hover:shadow-[#FF5D5D]/30',
    sparkColor: '#FF5D5D',
    icon: '/images/pokeball-light.svg'
  },
  great_ball: {
    color: 'text-[#4F94EF]',  // Bright blue for Great Ball
    borderColor: 'border-[#4F94EF]/30',
    glowColor: 'hover:shadow-[#4F94EF]/30',
    sparkColor: '#4F94EF',
    icon: '/images/pokeball-great.svg'
  },
  ultra_ball: {
    color: 'text-[#FFD700]',  // Gold for Ultra Ball
    borderColor: 'border-[#FFD700]/30',
    glowColor: 'hover:shadow-[#FFD700]/30',
    sparkColor: '#FFD700',
    icon: '/images/pokeball-dark.svg'
  },
  master_ball: {
    color: 'text-[#FB4FEF]',  // Bright magenta for Master Ball
    borderColor: 'border-[#FB4FEF]/30',
    glowColor: 'hover:shadow-[#FB4FEF]/30',
    sparkColor: '#FB4FEF',
    icon: '/images/pokeball-master.svg'
  }
} as const

export function MyPacks({ memberId, onPackOpened }: MyPacksProps) {
  const [packs, setPacks] = useState<PackInventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [openingPack, setOpeningPack] = useState<number | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Sound hooks
  const { play: playOpen, isSupported: isOpenSupported } = useSound('open')
  const { play: playRare, isSupported: isRareSupported } = useSound('rare')

  // Fetch unopened packs
  useEffect(() => {
    async function fetchPacks() {
      if (!memberId) return

      try {
        const { data, error } = await supabase
          .from('pack_inventory')
          .select('*')
          .eq('member_id', memberId)
          .eq('status', 'unopened')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPacks(data || [])
      } catch (error) {
        console.error('Error fetching packs:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your packs',
          variant: 'destructive'
        })
      }
    }

    fetchPacks()
  }, [memberId, supabase, toast])

  const openPack = async (packId: number) => {
    if (!memberId) return

    try {
      setOpeningPack(packId)
      if (isOpenSupported) playOpen()

      console.log('Opening pack:', { packId, memberId })

      const response = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, memberId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Pack opening failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || 'Failed to open pack')
      }

      const data = await response.json()
      console.log('Pack opened successfully:', data)
      
      // Play rare sound if there's a rare Pokémon
      if (data.rewards.some((r: any) => r.rarity === 'rare' || r.rarity === 'ultra_rare')) {
        if (isRareSupported) playRare()
      }

      // Remove the opened pack from the list
      setPacks(packs.filter(p => p.id !== packId))
      
      // Show rewards toast with more details
      toast({
        title: 'Pack Opened!',
        description: `You got ${data.rewards.length} new Pokémon! ${
          data.rewards.some((r: any) => r.isShiny) ? '✨ Including a shiny! ✨' : ''
        }`,
      })

      // Notify parent component
      if (onPackOpened) onPackOpened()

    } catch (error) {
      console.error('Error opening pack:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open pack',
        variant: 'destructive'
      })
    } finally {
      setOpeningPack(null)
    }
  }

  if (!memberId) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Packs</CardTitle>
        <CardDescription>
          You have {packs.length} unopened pack{packs.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {packs.map((pack) => {
              const styles = PACK_STYLES[pack.pack_type]
              return (
                <motion.div
                  key={pack.id}
                  variants={packAnimation}
                  initial="initial"
                  animate={openingPack === pack.id ? "opening" : "initial"}
                  whileHover="hover"
                  className={cn(
                    "relative aspect-square",
                    "flex items-center justify-center",
                    "rounded-xl overflow-hidden",
                    "glass-effect",
                    "cursor-pointer",
                    "group",
                    "border",
                    styles.borderColor,
                    styles.glowColor
                  )}
                  onClick={() => openPack(pack.id)}
                >
                  {/* Background glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{
                      boxShadow: [
                        `0 0 20px var(--${styles.color.replace('text-', '')})`,
                        `0 0 10px var(--${styles.color.replace('text-', '')})`,
                        `0 0 20px var(--${styles.color.replace('text-', '')})`
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Pokéball image */}
                  <div className={cn(
                    "relative p-2 rounded-full",
                    "transition-all duration-300",
                    "glass-effect glass-border",
                    "hover:shadow-lg",
                    styles.glowColor
                  )}>
                    <Image
                      src={styles.icon}
                      alt={pack.pack_type}
                      width={64}
                      height={64}
                      className={cn(
                        "w-16 h-16 transition-transform",
                        "group-hover:scale-110",
                        openingPack === pack.id && "animate-spin"
                      )}
                    />
                  </div>

                  {/* Sparkle effects */}
                  <Sparkles
                    className="absolute inset-0"
                    color={styles.sparkColor}
                    count={pack.pack_type === 'master_ball' ? 20 : 12}
                  />

                  {/* Pack type label */}
                  <div className={cn(
                    "absolute inset-x-0 bottom-0 p-2",
                    "text-center text-xs font-medium",
                    "bg-background/80 backdrop-blur-sm",
                    styles.color
                  )}>
                    {pack.pack_type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {packs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No unopened packs. Visit the shop to get more!
          </div>
        )}
      </CardContent>
    </Card>
  )
} 