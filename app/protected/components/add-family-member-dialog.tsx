'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AvatarUpload } from "@/app/account/avatar"
import { getAvatarUrl } from "@/utils/get-avatar-url"
import { Role } from '@/types/types' // Update the path to the correct file

interface AddFamilyMemberDialogProps {
  familyId: string
  roles: Role[]
  onSuccess?: () => void
}

export function AddFamilyMemberDialog({ familyId, roles, onSuccess }: AddFamilyMemberDialogProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    full_name: '',
    avatar_url: null as string | null,
    pin: '',
    confirmPin: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      if (!formData.display_name || formData.display_name.length < 2) {
        throw new Error('Display name must be at least 2 characters long')
      }

      if (!formData.full_name || formData.full_name.length < 2) {
        throw new Error('Full name must be at least 2 characters long')
      }

      if (formData.pin && formData.pin.length !== 6) {
        throw new Error('PIN must be 6 digits')
      }

      if (formData.pin !== formData.confirmPin) {
        throw new Error('PINs do not match')
      }

      // Generate a unique ID for the new member
      const memberId = crypto.randomUUID()

      const { error } = await supabase
        .from('family_members')
        .insert({
          id: memberId,
          family_id: familyId,
          display_name: formData.display_name,
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          pin: formData.pin || null,
          role_id: 2, // Default to child role
          current_status: 'active'
        })

      if (error) throw error

      toast.success('Family member added successfully!')
      setOpen(false)
      onSuccess?.()
      
      // Reset form
      setFormData({
        display_name: '',
        full_name: '',
        avatar_url: null,
        pin: '',
        confirmPin: ''
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error adding family member')
      console.error('Error details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Family Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
            <DialogDescription>
              Add a new member to your family. They will be added as a child by default.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <AvatarUpload
                uid={crypto.randomUUID()} // Generate a temporary ID for the avatar
                url={formData.avatar_url ? getAvatarUrl(formData.avatar_url) : null}
                size={100}
                onUpload={(url) => {
                  setFormData(prev => ({
                    ...prev,
                    avatar_url: url
                  }))
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display_name">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  display_name: e.target.value
                }))}
                placeholder="Ash"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  full_name: e.target.value
                }))}
                placeholder="Ash Ketchum"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pin">
                PIN
                <span className="ml-1 text-xs text-muted-foreground">
                  (6 digits)
                </span>
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData(prev => ({
                    ...prev,
                    pin: value
                  }))
                }}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPin">
                Confirm PIN
                <span className="ml-1 text-xs text-muted-foreground">
                  (6 digits)
                </span>
              </Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={formData.confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData(prev => ({
                    ...prev,
                    confirmPin: value
                  }))
                }}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 