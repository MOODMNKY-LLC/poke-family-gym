'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getAvatarUrl } from "@/utils/get-avatar-url"

interface Profile {
  family_name: string
  avatar_url: string | null
}

export function HeaderAuth() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('family_profiles')
        .select('family_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (data) {
        try {
          const avatarUrl = getAvatarUrl(data.avatar_url)
          
          setProfile({
            ...data,
            avatar_url: avatarUrl
          })
        } catch (error) {
          console.error('Error getting avatar URL:', error)
        }
      }
    }

    getProfile()
  }, [supabase])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>
              {profile?.family_name?.[0].toUpperCase() || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      {/* ... rest of dropdown menu ... */}
    </DropdownMenu>
  )
} 