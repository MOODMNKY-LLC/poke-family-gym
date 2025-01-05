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
  DialogFooter,
} from "@/components/ui/dialog"

interface PinSetupDialogProps {
  memberId: string
  memberName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PinSetupDialog({
  memberId,
  memberName,
  isOpen,
  onClose,
  onSuccess,
}: PinSetupDialogProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 'enter') {
      if (pin.length !== 6) {
        toast.error('Please enter a 6-digit PIN')
        return
      }
      setStep('confirm')
      return
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match')
      setConfirmPin('')
      return
    }

    try {
      setLoading(true)

      // Format PIN to match database format (exactly 6 digits)
      const formattedPin = pin.replace(/\D/g, '').padStart(6, '0')

      // Update the member's PIN
      const { error } = await supabase
        .from('family_members')
        .update({ pin: formattedPin })
        .eq('id', memberId)

      if (error) throw error

      toast.success('PIN set successfully!')
      onSuccess()
    } catch (error) {
      console.error('Failed to set PIN:', error)
      toast.error('Failed to set PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPin('')
    setConfirmPin('')
    setStep('enter')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up PIN for {memberName}</DialogTitle>
          <DialogDescription>
            {step === 'enter'
              ? 'Please enter a 6-digit PIN to secure your profile'
              : 'Please confirm your PIN'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              value={step === 'enter' ? pin : confirmPin}
              onChange={(value) => step === 'enter' ? setPin(value) : setConfirmPin(value)}
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

          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={step === 'enter' ? onClose : handleReset}
              >
                {step === 'enter' ? 'Cancel' : 'Start Over'}
              </Button>
            </div>
            <Button
              type="submit"
              disabled={loading || (step === 'enter' ? pin.length !== 6 : confirmPin.length !== 6)}
            >
              {loading ? 'Setting PIN...' : step === 'enter' ? 'Next' : 'Set PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 