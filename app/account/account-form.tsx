'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import { AvatarUpload } from './avatar'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getAvatarUrl } from '@/utils/get-avatar-url'

interface FamilyProfile {
  family_name: string
  family_motto: string | null
  avatar_url: string | null
  starter_pokemon?: {
    id: number
    name: string
    pokemon_species: {
      name: string
    }
  }
  starter_pokemon_nickname?: string
}

interface DatabaseError {
  code: string
  message: string
  details?: string
}

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [familyName, setFamilyName] = useState('')
  const [familyMotto, setFamilyMotto] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<FamilyProfile | null>(null)

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('No user ID found')
      }

      const { data } = await supabase
        .from('family_profiles')
        .select(`
          family_name, 
          family_motto, 
          avatar_url,
          family_members!inner (
            starter_pokemon_form_id,
            starter_pokemon_nickname,
            starter_pokemon:pokemon_forms!starter_pokemon_form_id (
              id,
              name,
              pokemon_species (
                name
              )
            )
          )
        `)
        .eq('id', user.id)
        .single()

      if (data) {
        setFamilyName(data.family_name)
        setFamilyMotto(data.family_motto)
        setAvatarUrl(data.avatar_url)
        setProfile(data)
      }
    } catch (error) {
      const dbError = error as DatabaseError
      const errorMessage = dbError.message || 'Error loading family profile'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        stack: (error as Error).stack
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({
    family_name,
    family_motto,
    avatar_url,
  }: Partial<FamilyProfile>) {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('No user ID found')
      }

      if (!family_name || family_name.length < 2) {
        throw new Error('Family name must be at least 2 characters long')
      }

      const { error } = await supabase
        .from('family_profiles')
        .upsert({
          id: user.id,
          family_name,
          family_motto,
          avatar_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (error) throw error
      
      toast.success('Family profile updated successfully!')
      await getProfile() // Refresh the profile data
    } catch (error) {
      const dbError = error as DatabaseError
      const errorMessage = dbError.message || 'Error updating profile'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="w-full max-w-xl mx-auto p-8">
      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          {user?.id && (
            <AvatarUpload
              uid={user.id}
              url={avatar_url ? getAvatarUrl(avatar_url) : null}
              size={150}
              onUpload={(url) => {
                setAvatarUrl(url)
                updateProfile({ 
                  family_name: familyName, 
                  family_motto: familyMotto, 
                  avatar_url: url 
                })
              }}
            />
          )}
          <h2 className="text-2xl font-bold">Family Profile Settings</h2>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input id="email" type="text" value={user?.email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyName">
              Family Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="familyName"
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="The Ketchum Family"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyMotto">Family Motto</Label>
            <Textarea
              id="familyMotto"
              value={familyMotto || ''}
              onChange={(e) => setFamilyMotto(e.target.value)}
              placeholder="Gotta catch 'em all!"
              className="min-h-[100px]"
            />
          </div>

          {profile?.starter_pokemon && (
            <div className="space-y-2">
              <Label>Partner Pokémon</Label>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <img 
                    src={`/pokemon/${profile.starter_pokemon.pokemon_species.name}.png`}
                    alt={profile.starter_pokemon.name}
                    className="w-16 h-16"
                  />
                  <div>
                    <p className="font-medium">{profile.starter_pokemon_nickname}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {profile.starter_pokemon.pokemon_species.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => updateProfile({ 
                family_name: familyName, 
                family_motto: familyMotto, 
                avatar_url 
              })}
              disabled={loading || !familyName || familyName.length < 2}
            >
              {loading ? 'Loading ...' : 'Update Family Profile'}
            </Button>

            <form action="/auth/signout" method="post">
              <Button variant="outline" className="w-full" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}