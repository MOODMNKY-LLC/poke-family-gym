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

export function FamilyMemberForm({ familyId, roles, onSuccess }: FamilyMemberFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  // Generate a temporary ID for the avatar upload
  const tempId = crypto.randomUUID()

  const [formData, setFormData] = useState({
    display_name: '',
    full_name: '',
    avatar_url: null as string | null,
    birth_date: '',
    favorite_color: '',
    pin: '',
    confirmPin: '',
    role_id: 1 // Default to Trainer role
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
      setFormData({
        display_name: '',
        full_name: '',
        avatar_url: null,
        birth_date: '',
        favorite_color: '',
        pin: '',
        confirmPin: '',
        role_id: 1
      })
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
        {/* Rest of the form fields */}
      </div>
    </form>
  )
} 