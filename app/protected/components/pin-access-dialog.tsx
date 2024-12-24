'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PinAccessDialogProps {
  memberId: string
  memberName: string
  isOpen: boolean
  onClose: () => void
}

export function PinAccessDialog({ 
  memberId, 
  memberName, 
  isOpen, 
  onClose,
}: PinAccessDialogProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
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

      // PIN is correct
      toast.success('Access granted!')
      
      // Navigate to profile page
      window.location.href = `/protected/trainers/${memberId}/profile`
    } catch (error: any) {
      toast.error('Invalid PIN. Please try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome, {memberName}!</DialogTitle>
          <DialogDescription>
            Please enter your 6-digit PIN to access your profile
          </DialogDescription>
        </DialogHeader>
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

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || pin.length !== 6}
            >
              {loading ? 'Verifying...' : 'Access Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 