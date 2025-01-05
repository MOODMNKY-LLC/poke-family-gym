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
import { PinSetupDialog } from './pin-setup-dialog'

interface PinAccessDialogProps {
  memberId: string
  memberName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (memberId: string) => void
}

export function PinAccessDialog({ 
  memberId, 
  memberName, 
  isOpen, 
  onClose,
  onSuccess,
}: PinAccessDialogProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      console.log('Attempting PIN verification:', {
        memberId,
        pinLength: pin.length,
        timestamp: new Date().toISOString()
      })

      // Format PIN to match database format (exactly 6 digits)
      const formattedPin = pin.replace(/\D/g, '').padStart(6, '0')
      
      // Validate PIN format matches database constraint (^[0-9]{6}$)
      if (!formattedPin.match(/^[0-9]{6}$/)) {
        console.log('Invalid PIN format:', {
          formattedPinLength: formattedPin.length,
          matchesPattern: !!formattedPin.match(/^[0-9]{6}$/)
        })
        throw new Error('Invalid PIN format')
      }

      // First, fetch the member's data
      const { data, error } = await supabase
        .from('family_members')
        .select('id, display_name, pin')
        .eq('id', memberId)
        .single()

      if (error) {
        console.error('Supabase query error:', error)
        throw new Error('Failed to verify PIN')
      }

      if (!data || !data.pin) {
        console.log('No PIN set, showing setup dialog')
        setShowSetup(true)
        return
      }

      // Clean and normalize PINs for comparison
      const storedPin = data.pin.trim()
      const cleanStoredPin = storedPin.replace(/\s+/g, '')
      const cleanFormattedPin = formattedPin.replace(/\s+/g, '')

      console.log('PIN Comparison Debug:', {
        storedPinLength: data.pin.length,
        trimmedStoredPinLength: storedPin.length,
        cleanStoredPinLength: cleanStoredPin.length,
        formattedPinLength: formattedPin.length,
        cleanFormattedPinLength: cleanFormattedPin.length,
        storedPinChars: Array.from<string>(data.pin).map(c => c.charCodeAt(0)),
        cleanStoredPinChars: Array.from<string>(cleanStoredPin).map(c => c.charCodeAt(0)),
        formattedPinChars: Array.from<string>(formattedPin).map(c => c.charCodeAt(0))
      })

      // Try multiple comparison methods
      const matches = {
        exact: data.pin === formattedPin,
        trimmed: storedPin === formattedPin,
        clean: cleanStoredPin === cleanFormattedPin,
        normalized: cleanStoredPin === cleanFormattedPin.padEnd(6, ' '),
        chars: Array.from(cleanStoredPin).every((char, i) => char === cleanFormattedPin[i])
      }

      console.log('PIN comparison results:', matches)

      // Accept any valid match method
      if (Object.values(matches).some(match => match === true)) {
        console.log('PIN verified successfully')
        toast.success('Access granted!')
        onSuccess(memberId)
        return
      }

      console.log('PIN verification failed:', {
        storedPin: '[REDACTED]',
        formattedPin: '[REDACTED]',
        matches
      })
      throw new Error('Invalid PIN')

    } catch (error) {
      console.error('PIN verification failed:', error)
      toast.error(error instanceof Error ? error.message : 'Invalid PIN. Please try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupSuccess = () => {
    setShowSetup(false)
    onSuccess(memberId)
  }

  if (showSetup) {
    return (
      <PinSetupDialog
        memberId={memberId}
        memberName={memberName}
        isOpen={true}
        onClose={() => {
          setShowSetup(false)
          onClose()
        }}
        onSuccess={handleSetupSuccess}
      />
    )
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