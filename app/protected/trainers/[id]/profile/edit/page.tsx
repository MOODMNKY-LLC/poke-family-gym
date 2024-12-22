import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { MemberProfileForm } from "@/app/protected/components/member-profile-form"
import { Metadata } from "next"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: member } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('id', id)
    .single()

  return {
    title: member ? `Edit ${member.display_name}'s Profile` : 'Edit Profile',
    description: 'Update your trainer profile information'
  }
}

export default async function EditMemberProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the member with role info
  const { data: member, error } = await supabase
    .from('family_members')
    .select(`
      *,
      roles (
        id,
        name,
        description
      )
    `)
    .eq('id', id)
    .single()

  if (error || !member) {
    redirect('/protected')
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground">
                Update your trainer profile information
              </p>
            </div>

            <MemberProfileForm member={member} />
          </div>
        </GlassCard>
      </div>
    </div>
  )
} 