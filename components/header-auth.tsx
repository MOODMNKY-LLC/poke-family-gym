'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Settings, LogOut, LayoutDashboard, Star, ShoppingBag, Trophy, Swords } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getAvatarUrl } from "@/utils/get-avatar-url"
import { useRouter } from 'next/navigation'
import AvatarCircles from "@/components/ui/avatar-circles"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { User } from '@supabase/supabase-js'

interface FamilyProfile {
  family_name: string
  avatar_url: string | null
}

interface Role {
  name: string
}

interface MemberData {
  display_name: string
  family_profiles: FamilyProfile
  roles: Role
  avatar_url: string | null
}

interface Profile {
  family_name: string
  avatar_url: string | null
  display_name: string
  role_name: string
}

export const HeaderAuth = () => {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const { theme, systemTheme } = useTheme()

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        setIsAuthenticated(true)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      }
    })

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Fetch profile data when user changes
  useEffect(() => {
    async function getProfile() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // First, check if the user exists in family_members
        const { data: memberExists, error: checkError } = await supabase
          .from('family_members')
          .select('id')
          .eq('id', user.id)
          .single()

        if (checkError) {
          if (checkError.code === 'PGRST116') {
            // No profile found - this is expected for new users
            console.log('No profile found for user, they may need to create one')
            setIsLoading(false)
            return
          }
          // Other errors should be logged
          console.error('Error checking member existence:', checkError.message)
          setIsLoading(false)
          return
        }

        // Now fetch the full profile data with family profile
        const { data, error: profileError } = await supabase
          .from('family_members')
          .select(`
            display_name,
            family_id,
            family_profiles!inner (
              family_name,
              avatar_url
            ),
            roles (
              name
            )
          `)
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError.message)
          setIsLoading(false)
          return
        }

        if (!data) {
          console.log('No profile data found for user')
          setIsLoading(false)
          return
        }

        const memberData = data as unknown as MemberData
        let avatarUrl = null

        // Get the avatar URL if it exists
        if (memberData.family_profiles?.avatar_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(memberData.family_profiles.avatar_url)
          avatarUrl = publicUrl
        }

        setProfile({
          family_name: memberData.family_profiles?.family_name || 'My Family Gym',
          avatar_url: avatarUrl,
          display_name: memberData.display_name || 'Trainer',
          role_name: memberData.roles?.name || 'Member'
        })
        setIsLoading(false)
      } catch (error) {
        if (error instanceof Error) {
          console.error('Unexpected error:', error.message)
        } else {
          console.error('Unknown error occurred:', error)
        }
        setIsLoading(false)
      }
    }

    getProfile()
  }, [supabase, user])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear any client-side data
      router.push('/')
      router.refresh()

      // Show success message (optional)
      console.log('Successfully signed out')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Get the appropriate pokeball image based on theme
  const getPokeballImage = () => {
    if (!mounted) return '/images/pokeball-light.svg' // Default for SSR
    
    const currentTheme = theme === 'system' ? systemTheme : theme
    return currentTheme === 'dark' ? '/images/pokeball-dark.svg' : '/images/pokeball-light.svg'
  }

  // Debug log to check avatar URL
  useEffect(() => {
    if (profile?.avatar_url) {
      console.log('Avatar URL:', profile.avatar_url)
    }
  }, [profile?.avatar_url])

  // Prepare avatar data for AvatarCircles
  const avatarData = [{
    imageUrl: profile?.avatar_url || getPokeballImage(),
    profileUrl: '/account'
  }]

  // Loading state
  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
    )
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    )
  }

  // Authenticated state
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <AvatarCircles 
            avatarUrls={avatarData}
            className="hover:opacity-80 transition"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-1.5">
              <p className="text-sm font-medium leading-none">{profile?.display_name || 'Trainer'}</p>
              <p className="text-xs text-muted-foreground">{profile?.family_name || 'My Family Gym'}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {profile?.role_name || 'Member'}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/protected" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/shop" className="cursor-pointer">
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Shop</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/tasks" className="cursor-pointer">
              <Trophy className="mr-2 h-4 w-4" />
              <span>Tasks</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/protected/trainers" className="cursor-pointer">
              <Swords className="mr-2 h-4 w-4" />
              <span>Battle</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
