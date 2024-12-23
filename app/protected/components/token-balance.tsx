'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Circle, Star, Target, Crown } from 'lucide-react'

interface TokenBalance {
  pokeBalls: number
  greatBalls: number
  ultraBalls: number
  masterBalls: number
}

interface TokenBalanceProps {
  balance: TokenBalance
  className?: string
}

const tokenTypes = [
  {
    type: 'pokeBalls',
    label: 'Poké Balls',
    icon: Circle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    value: 1,
    description: 'Basic, frequent reward for small tasks'
  },
  {
    type: 'greatBalls',
    label: 'Great Balls',
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    value: 5,
    description: 'Medium-tier for moderately challenging tasks'
  },
  {
    type: 'ultraBalls',
    label: 'Ultra Balls',
    icon: Target,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    value: 10,
    description: 'High-tier for complex or time-intensive tasks'
  },
  {
    type: 'masterBalls',
    label: 'Master Balls',
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    value: 100,
    description: 'Legendary-tier for truly exceptional achievements'
  }
] as const

export function TokenBalance({ balance, className }: TokenBalanceProps) {
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    const total = Object.entries(balance).reduce((acc, [type, count]) => {
      const tokenType = tokenTypes.find(t => t.type === type)
      return acc + (tokenType?.value || 0) * count
    }, 0)
    setTotalValue(total)
  }, [balance])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle>Token Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="wait">
              {tokenTypes.map((token, index) => {
                const Icon = token.icon
                const count = balance[token.type as keyof TokenBalance]
                return (
                  <motion.div
                    key={token.type}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg",
                      token.bgColor
                    )}
                  >
                    <div className={cn("rounded-full p-2", token.bgColor)}>
                      <Icon className={cn("h-4 w-4", token.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{token.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {token.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <motion.p 
              key={totalValue}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold"
            >
              {totalValue} PB
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 