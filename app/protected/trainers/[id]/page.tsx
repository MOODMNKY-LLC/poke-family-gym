import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PinAccessForm } from "../pin-access-form"
import { GlassCard } from "@/components/ui/glass-card"
import { Metadata } from "next"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  
  const { data: member } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('id', id)
    .single()

  return {
    title: member ? `${member.display_name} - Access` : 'Trainer Access',
    description: 'Enter your PIN to access your trainer profile'
  }
}

export default async function TrainerAccessPage({ 
  params,
  searchParams 
}: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the family member details with role info
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

  // If member is an admin, redirect directly to profile
  if (member.roles.name === 'admin') {
    redirect(`/protected/trainers/${member.id}/profile`)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome, {member.display_name}!</h1>
            <p className="text-muted-foreground">
              Please enter your 6-digit PIN to access your profile
            </p>
          </div>

          <PinAccessForm 
            memberId={member.id} 
            memberName={member.display_name}
          />
        </div>
      </GlassCard>
    </div>
  )
} 