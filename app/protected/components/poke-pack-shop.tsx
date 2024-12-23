'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Package, Sparkles, Zap, Crown } from 'lucide-react'
import { useToast } from "@/app/hooks/use-toast"

interface PackType {
  id: string
  name: string
  description: string
  cost: number
  icon: any
  color: string
  bgColor: string
  odds: {
    common: number
    uncommon: number
    rare: number
    ultraRare: number
    legendary: number
  }
}

interface PokePackShopProps {
  availableTokens: number
  onPurchase: (packId: string) => Promise<void>
}

const packTypes: PackType[] = [
  {
    id: 'standard',
    name: 'Standard Pack',
    description: 'Common (50%), Uncommon (30%), Rare (20%)',
    cost: 5,
    icon: Package,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    odds: {
      common: 50,
      uncommon: 30,
      rare: 20,
      ultraRare: 0,
      legendary: 0
    }
  },
  {
    id: 'great',
    name: 'Great Pack',
    description: 'Uncommon (50%), Rare (40%), Ultra-Rare (10%)',
    cost: 20,
    icon: Sparkles,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    odds: {
      common: 0,
      uncommon: 50,
      rare: 40,
      ultraRare: 10,
      legendary: 0
    }
  },
  {
    id: 'ultra',
    name: 'Ultra Pack',
    description: 'Rare (50%), Ultra-Rare (40%), Legendary (10%)',
    cost: 50,
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    odds: {
      common: 0,
      uncommon: 0,
      rare: 50,
      ultraRare: 40,
      legendary: 10
    }
  },
  {
    id: 'master',
    name: 'Master Pack',
    description: 'Guaranteed Legendary or Ultra-Rare',
    cost: 200,
    icon: Crown,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    odds: {
      common: 0,
      uncommon: 0,
      rare: 0,
      ultraRare: 50,
      legendary: 50
    }
  }
]

export function PokePackShop({ availableTokens, onPurchase }: PokePackShopProps) {
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePurchase = async (pack: PackType) => {
    if (availableTokens < pack.cost) {
      toast({
        title: "Insufficient tokens",
        description: `You need ${pack.cost} tokens to purchase this pack.`,
        variant: "destructive"
      })
      return
    }

    try {
      setIsPurchasing(pack.id)
      await onPurchase(pack.id)
      toast({
        title: "Pack purchased!",
        description: `Successfully purchased ${pack.name}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase pack. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPurchasing(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>PokéPack Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="wait">
              {packTypes.map((pack, index) => {
                const Icon = pack.icon
                const isAffordable = availableTokens >= pack.cost
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "relative p-6 rounded-lg border",
                      pack.bgColor,
                      !isAffordable && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn("rounded-full p-2", pack.bgColor)}>
                        <Icon className={cn("h-6 w-6", pack.color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{pack.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pack.cost} tokens
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mb-4">{pack.description}</p>
                    <Button
                      onClick={() => handlePurchase(pack)}
                      disabled={!isAffordable || isPurchasing !== null}
                      className="w-full"
                      variant={isAffordable ? "default" : "secondary"}
                    >
                      {isPurchasing === pack.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        "Purchase Pack"
                      )}
                    </Button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 