import { createClient } from "@/utils/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Settings, Plus, Swords, CalendarDays } from "lucide-react"
import { PokeBall } from "@/components/icons/pokeball"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AddFamilyMemberDialog } from './components/add-family-member-dialog'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from 'date-fns'
import { JsonObject } from 'type-fest'

// Define interfaces for our data structures
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
  created_at: string
  role_id: number
  roles: Role // This is a single role object, not an array
}

interface FamilyProfile {
  id: string
  family_name: string
  family_motto: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  theme_color: string | null
  timezone: string
  locale: string
  settings: JsonObject | null
}

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/sign-in")

  // Fetch roles first
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .order('id', { ascending: true }) as { data: Role[] | null, error: any }

  if (rolesError) {
    console.error('Error fetching roles:', rolesError)
    return null
  }

  // Fetch family profile with all fields
  const { data: familyProfile, error: profileError } = await supabase
    .from('family_profiles')
    .select(`
      id,
      family_name,
      family_motto,
      avatar_url,
      created_at,
      updated_at,
      theme_color,
      timezone,
      locale,
      settings
    `)
    .eq('id', user.id)
    .single() as { data: FamilyProfile | null, error: any }

  if (profileError || !familyProfile) {
    console.error('Error fetching family profile:', profileError)
    return redirect("/sign-in")  // Redirect to sign-in if no profile exists
  }

  // Get the public URL for the family profile avatar
  let familyAvatarUrl = null
  if (familyProfile.avatar_url) {
    const { data } = supabase.storage.from('avatars').getPublicUrl(familyProfile.avatar_url)
    familyAvatarUrl = data.publicUrl
  }

  // Fetch family members with role info
  const { data: familyMembers, error: membersError } = await supabase
    .from('family_members')
    .select(`
      id,
      display_name,
      full_name,
      birth_date,
      favorite_color,
      current_status,
      avatar_url,
      created_at,
      role_id,
      roles:role_id (
        id,
        name,
        description
      )
    `)
    .eq('family_id', user.id)
    .order('created_at', { ascending: true }) as { data: FamilyMember[] | null, error: any }

  if (membersError) {
    console.error('Error fetching family members:', membersError)
    return null
  }

  // Get public URLs for all family member avatars
  const membersWithAvatars = familyMembers?.map(member => ({
    ...member,
    avatar_url: member.avatar_url ? 
      supabase.storage.from('avatars').getPublicUrl(member.avatar_url).data.publicUrl : 
      null
  }))

  // Get member counts by role
  const membersByRole = familyMembers?.reduce((acc, member) => {
    const roleName = member.roles?.name
    if (roleName) {
      acc[roleName] = (acc[roleName] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            Welcome, {familyProfile.family_name}
          </h1>
          {familyProfile.family_motto && (
            <p className="text-muted-foreground">
              {familyProfile.family_motto}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/account">
              <Settings className="h-4 w-4 mr-2" />
              Family Settings
            </Link>
          </Button>
          <AddFamilyMemberDialog 
            familyId={user.id} 
            roles={roles || []} 
          />
        </div>
      </div>

      {/* Family Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{familyMembers?.length || 0}</div>
          </CardContent>
        </Card>

        {Object.entries(membersByRole || {}).map(([role, count]) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {role}s
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Family Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Family Members</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {membersWithAvatars?.map((member) => (
            <Link 
              key={member.id}
              href={`/protected/trainers/${member.id}`}
              className="block group"
            >
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.display_name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{member.display_name}</CardTitle>
                      <CardDescription className="capitalize">
                        {member.roles.name} Trainer
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="capitalize font-medium">{member.current_status}</dd>
                    </div>
                    {member.birth_date && (
                      <div>
                        <dt className="text-muted-foreground">Birth Date</dt>
                        <dd className="font-medium">
                          {new Date(member.birth_date).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {member.favorite_color && (
                      <div>
                        <dt className="text-muted-foreground">Favorite Color</dt>
                        <dd className="font-medium capitalize">{member.favorite_color}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Member Since</dt>
                      <dd className="font-medium">
                        {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
