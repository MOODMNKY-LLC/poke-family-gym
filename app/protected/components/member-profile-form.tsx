'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AvatarUpload } from '@/app/account/avatar'

interface Role {
  id: number
  name: string
  description: string | null
}

interface FamilyMember {
  id: string
  display_name: string
  full_name: string
  birth_date: string | null
  favorite_color: string | null
  current_status: string
  avatar_url: string | null
  pin: string | null
  role_id: number
  roles: Role
}

interface MemberProfileFormProps {
  member: FamilyMember
}

export function MemberProfileForm({ member }: MemberProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    display_name: member.display_name,
    full_name: member.full_name,
    birth_date: member.birth_date || '',
    favorite_color: member.favorite_color || '',
    avatar_url: member.avatar_url,
    pin: member.pin || '',
    confirmPin: member.pin || ''
  })

  const getAvatarUrl = useCallback((path: string | null) => {
    if (!path) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      if (!formData.display_name || formData.display_name.length < 2) {
        throw new Error('Display name must be at least 2 characters long')
      }

      if (member.roles.name !== 'admin') {
        if (!formData.pin || !/^\d{6}$/.test(formData.pin)) {
          throw new Error('PIN must be exactly 6 digits')
        }
        if (formData.pin !== formData.confirmPin) {
          throw new Error('PINs do not match')
        }
      }

      const { error } = await supabase
        .from('family_members')
        .update({
          display_name: formData.display_name,
          full_name: formData.full_name,
          birth_date: formData.birth_date || null,
          favorite_color: formData.favorite_color || null,
          avatar_url: formData.avatar_url,
          pin: formData.pin || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      router.refresh()
      router.push(`/protected/trainers/${member.id}/profile`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <AvatarUpload
            uid={member.id}
            url={getAvatarUrl(formData.avatar_url)}
            size={150}
            onUpload={(url) => {
              setFormData(prev => ({
                ...prev,
                avatar_url: url
              }))
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              display_name: e.target.value 
            }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              full_name: e.target.value 
            }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Birth Date</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              birth_date: e.target.value 
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="favorite_color">Favorite Color</Label>
          <Input
            id="favorite_color"
            value={formData.favorite_color}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              favorite_color: e.target.value 
            }))}
          />
        </div>

        {member.roles.name !== 'admin' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="pin">
                Security PIN
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

            <div className="space-y-2">
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
          </>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
} 