'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface PinAccessFormProps {
  memberId: string
  memberName: string
}

export function PinAccessForm({ memberId, memberName }: PinAccessFormProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      // Verify the PIN
      const { data, error } = await supabase
        .from('family_members')
        .select('id')
        .eq('id', memberId)
        .eq('pin', pin)
        .single()

      if (error || !data) {
        throw new Error('Invalid PIN')
      }

      // PIN is correct, redirect to member's profile
      toast.success('Access granted!')
      router.push(`/protected/trainers/${memberId}/profile`)
    } catch (error: any) {
      toast.error('Invalid PIN. Please try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <InputOTP
          value={pin}
          onChange={(value) => setPin(value)}
          maxLength={6}
          containerClassName="group flex items-center has-[:disabled]:opacity-50"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className="w-10 h-12 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || pin.length !== 6}
      >
        {loading ? 'Verifying...' : 'Access Profile'}
      </Button>
    </form>
  )
} 