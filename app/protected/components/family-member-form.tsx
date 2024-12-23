'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { AvatarUpload } from '@/app/account/avatar'
import { getAvatarUrl } from '@/utils/get-avatar-url'

interface Role {
  id: number
  name: string
  description: string | null
}

interface FamilyMemberFormProps {
  familyId: string
  roles: Role[]
  onSuccess?: () => void
}

interface FamilyMemberFormData {
  display_name: string
  full_name: string
  birth_date: string
  favorite_color: string
  avatar_url: string | null
  pin: string
  confirmPin: string
  role_id: number | null
  personal_motto: string
}

const initialFormData: FamilyMemberFormData = {
  display_name: '',
  full_name: '',
  birth_date: '',
  favorite_color: '',
  avatar_url: null,
  pin: '',
  confirmPin: '',
  role_id: null,
  personal_motto: ''
}

export function FamilyMemberForm({ familyId, roles, onSuccess }: FamilyMemberFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  // Generate a temporary ID for the avatar upload
  const tempId = crypto.randomUUID()

  const [formData, setFormData] = useState(initialFormData)

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

      const { error } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          display_name: formData.display_name,
          full_name: formData.full_name,
          birth_date: formData.birth_date || null,
          favorite_color: formData.favorite_color || null,
          avatar_url: formData.avatar_url,
          pin: formData.pin || null,
          role_id: formData.role_id,
          current_status: 'active'
        })

      if (error) throw error

      toast.success('Family member added successfully!')
      onSuccess?.()
      
      // Reset form
      setFormData(initialFormData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error adding family member')
      console.error('Error details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-center">
          <AvatarUpload
            uid={tempId}
            url={formData.avatar_url ? getAvatarUrl(formData.avatar_url) : null}
            size={100}
            onUpload={(url) => setFormData(prev => ({ 
              ...prev, 
              avatar_url: url 
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="favoriteColor">Favorite Color</Label>
          <Input
            type="color"
            id="favoriteColor"
            value={formData.favorite_color || '#000000'}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              favorite_color: e.target.value 
            }))}
            className="h-10 w-20 p-1 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="personalMotto">Personal Motto</Label>
          <Input
            id="personalMotto"
            value={formData.personal_motto}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              personal_motto: e.target.value 
            }))}
            placeholder="Enter your personal motto..."
          />
        </div>
      </div>
    </form>
  )
} 