'use client'

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { PokemonClient } from 'pokenode-ts'
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSound } from "@/hooks/use-sound"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn, getPokeBallImage } from "@/lib/utils"
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Sparkles } from "@/components/ui/sparkles"
import { PinAccessDialog } from "./pin-access-dialog"
import { createClient } from "@/utils/supabase/client"
import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ArrowUpDown, Info, Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MyPacks } from './my-packs'

interface ShopTabProps {
  availableTokens: number
  userId: string
}

type PackType = {
  id: 'poke_ball' | 'great_ball' | 'ultra_ball' | 'master_ball'
  name: string
  description: string
  cost: number
  icon: string
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
  iconSize: number
  gridSpan: string
  background: ReactElement
  poolRange: {
    readonly min: number
    readonly max: number
  }
}

const PACK_TYPES: readonly PackType[] = [
  {
    id: 'poke_ball',
    name: 'Poké Ball Pack',
    description: 'Common (60%), Uncommon (40%) - 5 guaranteed slots, up to 6 Pokémon',
    cost: 1,  // Base cost from database
    icon: '/images/pokeball-light.svg',
    color: 'text-pokemon-fire',
    bgColor: 'glass-card',
    borderColor: 'border-pokemon-fire/30',
    glowColor: 'hover:shadow-pokemon-fire/30',
    iconSize: 32,
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    background: (
      <div className="absolute inset-0 glass-gradient" />
    ),
    poolRange: { min: 1, max: 151 } as const
  },
  {
    id: 'great_ball',
    name: 'Great Ball Pack',
    description: 'Uncommon (55%), Rare (45%) - 3 guaranteed slots, up to 5 Pokémon',
    cost: 3,  // 3x base cost
    icon: '/images/pokeball-great.svg',
    color: 'text-pokemon-water',
    bgColor: 'glass-card',
    borderColor: 'border-pokemon-water/30',
    glowColor: 'hover:shadow-pokemon-water/30',
    iconSize: 32,
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    background: (
      <div className="absolute inset-0 glass-gradient" />
    ),
    poolRange: { min: 152, max: 251 } as const
  },
  {
    id: 'ultra_ball',
    name: 'Ultra Ball Pack',
    description: 'Rare (50%), Ultra Rare (35%), Secret Rare (15%) - 2 guaranteed slots, up to 4 Pokémon',
    cost: 5,  // 5x base cost
    icon: '/images/pokeball-dark.svg',
    color: 'text-pokemon-electric',
    bgColor: 'glass-card',
    borderColor: 'border-pokemon-electric/30',
    glowColor: 'hover:shadow-pokemon-electric/30',
    iconSize: 32,
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    background: (
      <div className="absolute inset-0 glass-gradient" />
    ),
    poolRange: { min: 252, max: 386 } as const
  },
  {
    id: 'master_ball',
    name: 'Master Ball Pack',
    description: 'Ultra Rare+ Guaranteed! (85% Ultra Rare, 15% Crown Rare) - 1 guaranteed slot, up to 3 Pokémon',
    cost: 10,  // 10x base cost
    icon: '/images/pokeball-master.svg',
    color: 'text-pokemon-psychic',
    bgColor: 'glass-card',
    borderColor: 'border-pokemon-psychic/30',
    glowColor: 'hover:shadow-pokemon-psychic/30',
    iconSize: 32,
    gridSpan: 'col-span-1 md:col-span-2 lg:col-span-1',
    background: (
      <div className="absolute inset-0 glass-gradient" />
    ),
    poolRange: { min: 387, max: 493 } as const
  }
] as const

const floatAnimation = {
  initial: { y: 0, rotate: 0 },
  hover: { 
    y: [-2, 2, -2],
    rotate: [-5, 5, -5],
    transition: {
      y: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      },
      rotate: {
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut"
      }
    }
  }
}

const cardAnimation = {
  initial: { scale: 1, height: "auto" },
  hover: { 
    scale: 1.05,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeIn"
    }
  }
}

const purchaseAnimation = {
  initial: { scale: 1, rotate: 0, opacity: 1 },
  animate: {
    scale: [1, 1.5, 0],
    rotate: [0, 360, 720],
    opacity: [1, 0.8, 0],
    transition: {
      duration: 1.2,
      ease: "easeInOut"
    }
  }
}

// Exchange rates in terms of regular Poké Balls (more balanced)
const EXCHANGE_RATES = {
  poke_ball: 1,     // Base value (1 Poké Ball)
  great_ball: 3,    // 3x value (matches pack cost)
  ultra_ball: 5,    // 5x value (matches pack cost)
  master_ball: 10   // 10x value (matches pack cost)
} as const

type BallType = keyof typeof EXCHANGE_RATES

interface TokenBalance {
  poke_ball: number
  great_ball: number
  ultra_ball: number
  master_ball: number
}

// Calculate exchange rate between two ball types
function getExchangeRate(from: BallType, to: BallType) {
  const fromRate = EXCHANGE_RATES[from]
  const toRate = EXCHANGE_RATES[to]
  return fromRate / toRate
}

// Calculate how many target balls you get for the source balls
function calculateExchange(amount: number, from: BallType, to: BallType) {
  const rate = getExchangeRate(from, to)
  return Math.floor(amount * rate)
}

// Calculate total value of all Pokéballs
function calculateTotalValue(balance: TokenBalance): number {
  return Object.entries(balance).reduce((total, [type, count]) => {
    return total + (EXCHANGE_RATES[type as BallType] * count)
  }, 0)
}

export function ShopTab({ availableTokens, userId }: ShopTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null)
  const [potentialRewards, setPotentialRewards] = useState<Record<string, any[]>>({})
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string, name: string }>>([])
  const [exchangeFrom, setExchangeFrom] = useState<string>('poke_ball')
  const [exchangeTo, setExchangeTo] = useState<string>('poke_ball')
  const [exchangeAmount, setExchangeAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  // Sound hooks with error handling
  const { play: playHover, isSupported: isHoverSupported } = useSound('hover')
  const { play: playPurchase, isSupported: isPurchaseSupported } = useSound('purchase')
  const { play: playOpen, isSupported: isOpenSupported } = useSound('open')
  const { play: playRare, isSupported: isRareSupported } = useSound('rare')

  // Play sound if supported
  const playSound = (sound: () => void, isSupported: boolean) => {
    if (isSupported) sound()
  }

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")

  // Fetch potential rewards from PokeAPI
  useEffect(() => {
    const fetchPotentialRewards = async () => {
      const api = new PokemonClient()
      const rewards: Record<string, any[]> = {}

      for (const pack of PACK_TYPES) {
        try {
          const pokemonList = await Promise.all(
            Array.from({ length: 3 }, async () => {
              const id = Math.floor(Math.random() * (pack.poolRange.max - pack.poolRange.min + 1)) + pack.poolRange.min
              return await api.getPokemonById(id)
            })
          )
          rewards[pack.id] = pokemonList
        } catch (error) {
          console.error(`Error fetching rewards for ${pack.id}:`, error)
        }
      }

      setPotentialRewards(rewards)
    }

    fetchPotentialRewards()
  }, [])

  useEffect(() => {
    // Fetch family members
    const fetchFamilyMembers = async () => {
      try {
        const supabase = createClient()
        console.log('Fetching family members for family ID:', userId)
        
        const { data, error } = await supabase
          .from('family_members')
          .select(`
            id,
            display_name
          `)
          .eq('family_id', userId)

        if (error) {
          console.error('Supabase error:', error.message, error.details, error.hint)
          throw error
        }

        console.log('Fetched family members:', data)
        // Transform the data to match the expected format
        const transformedData = (data || []).map(member => ({
          id: member.id,
          name: member.display_name
        }))
        setFamilyMembers(transformedData)
      } catch (error) {
        console.error('Error fetching family members:', {
          error,
          userId,
          timestamp: new Date().toISOString()
        })
      }
    }

    if (userId) {
      fetchFamilyMembers()
    }
  }, [userId])

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId)
    setIsPinDialogOpen(true)
  }

  const handlePinSuccess = (memberId: string) => {
    setSelectedMember(memberId)
    setIsPinDialogOpen(false)
    handlePurchase(purchasingPack!)
  }

  const handlePurchase = async (packId: string) => {
    if (!selectedMember) {
      toast({
        title: "Select a member",
        description: "Please select a family member first",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      setPurchasingPack(packId)

      const response = await fetch('/api/shop/purchase-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          packId,
          userId: selectedMember
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to purchase pack')
      }

      const data = await response.json()
      console.log('Purchase successful:', data)

      // Play purchase sound if supported
      if (isPurchaseSupported) playPurchase()

      toast({
        title: "Success",
        description: "Pack purchased successfully!",
      })
      router.refresh()

    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Failed to purchase pack",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setPurchasingPack(null)
    }
  }

  const PackIcon = ({ pack, isPurchasing }: { pack: PackType, isPurchasing: boolean }) => (
    <motion.div
      variants={floatAnimation}
      initial="initial"
      animate={isPurchasing ? "animate" : "hover"}
      className={cn(
        "relative p-2 rounded-full",
        "transition-all duration-300",
        "glass-effect glass-border",
        "hover:shadow-lg",
        pack.glowColor
      )}
      onHoverStart={() => playSound(playHover, isHoverSupported)}
    >
      <Image
        src={pack.icon}
        alt={pack.name}
        width={pack.iconSize * 1.5}
        height={pack.iconSize * 1.5}
        className={cn(
          "w-12 h-12",
          isPurchasing && "animate-spin"
        )}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            `0 0 20px var(--${pack.color.replace('text-', '')})`,
            `0 0 10px var(--${pack.color.replace('text-', '')})`,
            `0 0 20px var(--${pack.color.replace('text-', '')})`
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {pack.id !== 'poke_ball' && (
        <Sparkles
          className="absolute inset-0"
          color={`var(--${pack.color.replace('text-', '')})`}
          count={pack.id === 'master_ball' ? 20 : 12}
        />
      )}
    </motion.div>
  )

  // Add state for detailed balance
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    poke_ball: 0,
    great_ball: 0,
    ultra_ball: 0,
    master_ball: 0
  })

  const fetchBalance = async (memberId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          pokeball_balance,
          great_ball_balance,
          ultra_ball_balance,
          master_ball_balance
        `)
        .eq('id', memberId)
        .single()

      if (error) throw error

      if (data) {
        setTokenBalance({
          poke_ball: data.pokeball_balance || 0,
          great_ball: data.great_ball_balance || 0,
          ultra_ball: data.ultra_ball_balance || 0,
          master_ball: data.master_ball_balance || 0
        })
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  useEffect(() => {
    if (selectedMember) {
      fetchBalance(selectedMember)
    }
  }, [selectedMember])

  const handleExchange = async (memberId: string) => {
    try {
      if (!memberId) {
        toast({
          title: "No member selected",
          description: "Please select a family member first",
          variant: "destructive"
        })
        return
      }

      const amount = parseInt(exchangeAmount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid number greater than 0",
          variant: "destructive"
        })
        return
      }

      setIsLoading(true)
      const supabase = createClient()

      // Get member data
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('id, family_id, display_name')
        .eq('id', memberId)
        .single()

      if (memberError) throw new Error(`Failed to fetch member data: ${memberError.message}`)
      if (!member) throw new Error('Member not found')

      // Calculate target amount
      const targetAmount = calculateExchange(amount, exchangeFrom as BallType, exchangeTo as BallType)

      if (targetAmount <= 0) {
        toast({
          title: "Invalid exchange",
          description: "The exchange would result in 0 balls. Try a larger amount.",
          variant: "destructive"
        })
        return
      }

      // Create withdrawal transaction
      const { error: withdrawError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: memberId,
          family_id: member.family_id,
          ball_type: exchangeFrom,
          amount: -amount,
          reason: `Exchanged to ${targetAmount} ${exchangeTo.replace('_', ' ')}(s)`,
          details: {
            exchange_type: 'withdrawal',
            target_type: exchangeTo,
            target_amount: targetAmount
          }
        })

      if (withdrawError) throw new Error(`Failed to process withdrawal: ${withdrawError.message}`)

      // Create deposit transaction
      const { error: depositError } = await supabase
        .from('pokeball_transactions')
        .insert({
          member_id: memberId,
          family_id: member.family_id,
          ball_type: exchangeTo,
          amount: targetAmount,
          reason: `Exchanged from ${amount} ${exchangeFrom.replace('_', ' ')}(s)`,
          details: {
            exchange_type: 'deposit',
            source_type: exchangeFrom,
            source_amount: amount
          }
        })

      if (depositError) throw new Error(`Failed to process deposit: ${depositError.message}`)

      toast({
        title: "Exchange successful!",
        description: `Exchanged ${amount} ${exchangeFrom.replace('_', ' ')}(s) for ${targetAmount} ${exchangeTo.replace('_', ' ')}(s)`,
      })

      setExchangeAmount('')
      // Refresh balances
      if (selectedMember) {
        fetchBalance(selectedMember)
      }

    } catch (error: any) {
      console.error('Exchange error:', error)
      toast({
        title: "Exchange failed",
        description: error.message || "An unexpected error occurred during the exchange",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            Poké Shop
          </h2>
          <p className="text-muted-foreground">
            {selectedMember ? (
              `Available Pokéballs: ${tokenBalance.poke_ball}`
            ) : (
              "Select a family member to view available Pokéballs"
            )}
          </p>
        </div>
      </div>

      {/* My Packs Section */}
      {selectedMember && (
        <MyPacks 
          memberId={selectedMember} 
          onPackOpened={() => {
            // Refresh balances after opening a pack
            if (selectedMember) {
              fetchBalance(selectedMember)
            }
          }} 
        />
      )}

      {/* Pack Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Packs</h3>
        <BentoGrid className={cn(
          "auto-rows-[16rem] gap-4 lg:gap-6",
          isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-4"
        )}>
          <AnimatePresence>
            {PACK_TYPES.map((pack) => {
              const isAffordable = selectedMember ? tokenBalance.poke_ball >= pack.cost : false
              const isPurchasing = purchasingPack === pack.id
              const isExpanded = expandedCard === pack.id
              
              return (
                <motion.div
                  key={pack.id}
                  variants={cardAnimation}
                  initial="initial"
                  animate={isExpanded ? "hover" : "initial"}
                  whileHover={isAffordable ? "hover" : undefined}
                  whileTap={isAffordable ? "tap" : undefined}
                  className={pack.gridSpan}
                  onHoverStart={() => {
                    setExpandedCard(pack.id)
                    playSound(playHover, isHoverSupported)
                  }}
                  onHoverEnd={() => setExpandedCard(null)}
                >
                  <BentoCard
                    name={pack.name}
                    className={cn(
                      "h-full transition-all",
                      !isAffordable && "opacity-75 hover:opacity-85 saturate-50",
                      pack.borderColor,
                      "hover:shadow-xl",
                      pack.glowColor,
                      pack.bgColor,
                      pack.color,
                      "group"
                    )}
                    background={pack.background}
                    Icon={() => <PackIcon pack={pack} isPurchasing={isPurchasing} />}
                    description={
                      <div className="flex flex-col h-full justify-between">
                        <div className="space-y-2">
                          <p className="text-card-foreground/90 text-sm leading-relaxed">
                            {pack.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "font-medium px-2.5 py-0.5",
                                pack.color,
                                "glass-effect"
                              )}
                            >
                              {pack.cost} 🎯
                            </Badge>
                          </div>
                        </div>

                        {isExpanded && potentialRewards[pack.id] && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-border/30" />
                                <span className="text-xs font-medium text-card-foreground/80">
                                  Potential Rewards
                                </span>
                                <div className="h-px flex-1 bg-border/30" />
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {potentialRewards[pack.id].map((pokemon, idx) => (
                                  <div 
                                    key={idx} 
                                    className={cn(
                                      "group/pokemon relative",
                                      "flex flex-col items-center",
                                      "p-1 rounded-lg",
                                      "glass-effect glass-border",
                                      "transition-all duration-200",
                                      "hover:scale-110 hover:-translate-y-0.5",
                                      "hover:bg-accent/50"
                                    )}
                                  >
                                    <div className="relative w-8 h-8">
                                      <Image
                                        src={pokemon.sprites.front_default}
                                        alt={pokemon.name}
                                        fill
                                        sizes="(max-width: 640px) 32px,
                                               (max-width: 1024px) 32px,
                                               32px"
                                        className="pixelated object-contain"
                                      />
                                    </div>
                                    <motion.div
                                      initial={false}
                                      animate={{ opacity: isExpanded ? 1 : 0 }}
                                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max"
                                    >
                                      <div className={cn(
                                        "text-[10px] capitalize px-1.5 py-0.5 rounded-md",
                                        "bg-background/80 backdrop-blur-sm",
                                        "text-card-foreground/90",
                                        "opacity-0 group-hover/pokemon:opacity-100",
                                        "transition-opacity duration-200",
                                        "whitespace-nowrap"
                                      )}>
                                        {pokemon.name}
                                      </div>
                                    </motion.div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    }
                    onClick={() => isAffordable && handlePurchase(pack.id)}
                    cta={
                      <div className={cn(
                        "flex items-center justify-between mt-2",
                        "text-sm font-medium",
                        "text-card-foreground/70 group-hover:text-card-foreground/90",
                        "transition-colors"
                      )}>
                        <span>
                          {isPurchasing ? "Opening..." : "Purchase Pack"}
                        </span>
                        <motion.span
                          animate={{ x: isPurchasing ? 10 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          →
                        </motion.span>
                      </div>
                    }
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </BentoGrid>
      </div>

      {/* Exchange Section */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Poké Bank</CardTitle>
              <CardDescription>Select a family member to manage Pokéballs</CardDescription>
            </div>
            <div className="flex gap-2">
              {familyMembers.map(member => (
                <Button
                  key={member.id}
                  variant={selectedMember === member.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMemberSelect(member.id)}
                >
                  {member.name}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        {selectedMember && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(tokenBalance).map(([type, count]) => {
                const pack = PACK_TYPES.find(p => p.id === type)
                if (!pack) return null
                return (
                  <div key={type} className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    "bg-background/50",
                    "transition-colors duration-200"
                  )}>
                    <div className={cn(
                      "relative p-2 rounded-full",
                      "glass-effect glass-border",
                      pack.glowColor
                    )}>
                      <Image
                        src={pack.icon}
                        alt={type.replace('_', ' ')}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm font-medium", pack.color)}>
                          {count}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ×{EXCHANGE_RATES[type as BallType]}
                        </p>
                      </div>
                      {type !== 'poke_ball' && (
                        <div className="flex gap-1 mt-1">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Convert"
                            className="h-6 text-xs"
                            value={exchangeFrom === type ? exchangeAmount : ''}
                            onChange={(e) => {
                              setExchangeFrom(type)
                              setExchangeTo('poke_ball')
                              setExchangeAmount(e.target.value)
                            }}
                          />
                          <Button 
                            size="icon"
                            variant="ghost"
                            className={cn("h-6 w-6 p-0", pack.color)}
                            onClick={() => {
                              if (exchangeAmount && exchangeFrom === type) {
                                handleExchange(selectedMember)
                              }
                            }}
                            disabled={!exchangeAmount || exchangeFrom !== type || isLoading}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-lg font-semibold">
              <span className="text-muted-foreground">Total Value:</span>
              <div className="flex items-center gap-1">
                {calculateTotalValue(tokenBalance)}
                <Image
                  src="/images/pokeball-light.svg"
                  alt="PB"
                  width={16}
                  height={16}
                  className="opacity-90"
                />
                <span>PB</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <PinAccessDialog
        memberId={selectedMember || ''}
        memberName={familyMembers.find(member => member.id === selectedMember)?.name || ''}
        isOpen={isPinDialogOpen}
        onClose={() => setIsPinDialogOpen(false)}
        onSuccess={handlePinSuccess}
      />
    </div>
  )
} 