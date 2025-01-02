'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { PokeAPI } from '@/lib/pokeapi/client'
import Image from 'next/image'
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PokeBallActionsProps {
  memberId: string
  familyId: string
  onSuccess?: () => Promise<void>
}

export function PokeBallActions({ memberId, familyId, onSuccess }: PokeBallActionsProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddPokeballs = async (type: 'pokeball' | 'great_ball' | 'ultra_ball' | 'master_ball') => {
    try {
      setIsLoading(true)
      const numAmount = parseInt(amount)
      
      // Validate amount
      if (isNaN(numAmount) || numAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid number greater than 0",
          variant: "destructive"
        })
        return
      }

      // Validate member and family IDs
      if (!memberId || !familyId) {
        toast({
          title: "Invalid member or family",
          description: "Member or family information is missing",
          variant: "destructive"
        })
        return
      }

      // Convert type to match database schema
      const ballType = type === 'pokeball' ? 'poke_ball' : type

      // Create Supabase client
      const supabase = createClient()

      // First, check if the member exists and belongs to the family
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('id, display_name')
        .eq('id', memberId)
        .eq('family_id', familyId)
        .single()

      if (memberError || !memberData) {
        throw new Error('Member not found or does not belong to the family')
      }

      // Prepare transaction data
      const transactionData = {
        family_id: familyId,
        member_id: memberId,
        amount: numAmount,
        ball_type: ballType,
        reason: 'Manual addition by admin',
        details: {
          source: 'admin_action',
          timestamp: new Date().toISOString(),
          member_name: memberData.display_name
        }
      }

      // Insert transaction record
      const { data, error: transactionError } = await supabase
        .from('pokeball_transactions')
        .insert([transactionData])
        .select('*, member:member_id(display_name)')
        .single()

      if (transactionError) {
        console.error('Transaction Error Details:', {
          error: transactionError,
          code: transactionError.code,
          message: transactionError.message,
          details: transactionError.details,
          hint: transactionError.hint,
          data: transactionData
        })
        throw transactionError
      }

      // Show success message
      toast({
        title: "Success!",
        description: `Added ${numAmount} ${ballType.replace('_', ' ')}(s) to ${memberData.display_name}'s account`,
      })

      // Clear input and refresh
      setAmount('')
      if (onSuccess) await onSuccess()
      router.refresh()
    } catch (error: any) {
      console.error('Error adding Pokéballs:', {
        error,
        errorMessage: error?.message,
        errorDetails: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      
      // Show error toast with specific message if available
      toast({
        title: "Error adding Pokéballs",
        description: error?.message || error?.details || "Failed to add Pokéballs. Please try again.",
        variant: "destructive"
      })
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
        min="1"
        required
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