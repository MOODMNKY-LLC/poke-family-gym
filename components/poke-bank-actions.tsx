'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { PokeAPI } from '@/lib/pokeapi/client'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PokeBallActionsProps {
  memberId: string
  familyId: string
}

export function PokeBallActions({ memberId, familyId }: PokeBallActionsProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleAddPokeballs = async (type: 'pokeball' | 'great_ball' | 'ultra_ball' | 'master_ball') => {
    try {
      setIsLoading(true)
      const numAmount = parseInt(amount)
      
      if (isNaN(numAmount)) {
        console.error('Invalid amount')
        return
      }

      // Insert transaction record
      const { error: transactionError } = await supabase
        .from('pokeball_transactions')
        .insert({
          family_id: familyId,
          member_id: memberId,
          amount: numAmount,
          pokeball_type: type
        })

      if (transactionError) throw transactionError

      // Clear input and refresh
      setAmount('')
      router.refresh()
    } catch (error) {
      console.error('Error adding Pokéballs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-20"
        placeholder="Amount"
        min="0"
      />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddPokeballs('pokeball')}
                disabled={isLoading}
                className="w-10 h-10 p-0"
              >
                <Image
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                  alt="Poké Ball"
                  width={24}
                  height={24}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Poké Balls</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddPokeballs('great_ball')}
                disabled={isLoading}
                className="w-10 h-10 p-0"
              >
                <Image
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png"
                  alt="Great Ball"
                  width={24}
                  height={24}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Great Balls</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddPokeballs('ultra_ball')}
                disabled={isLoading}
                className="w-10 h-10 p-0"
              >
                <Image
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png"
                  alt="Ultra Ball"
                  width={24}
                  height={24}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Ultra Balls</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddPokeballs('master_ball')}
                disabled={isLoading}
                className="w-10 h-10 p-0"
              >
                <Image
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
                  alt="Master Ball"
                  width={24}
                  height={24}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Master Balls</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
} 