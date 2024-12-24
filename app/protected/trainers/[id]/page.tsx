'use client'

import { use } from 'react'
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { PinAccessDialog } from "../../components/pin-access-dialog"
import { useEffect, useState } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TrainerAccessPage({ params }: PageProps) {
  const { id } = use(params)
  const [member, setMember] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchMember() {
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
        window.location.href = '/protected'
        return
      }

      // If member is an admin, redirect directly to profile
      if (member.roles.name === 'admin') {
        window.location.href = `/protected/trainers/${member.id}/profile`
        return
      }

      setMember(member)
      setIsLoading(false)
      setShowDialog(true)
    }

    fetchMember()
  }, [id, supabase])

  if (isLoading || !member) {
    return null // or a loading spinner
  }

  return (
    <PinAccessDialog
      memberId={member.id}
      memberName={member.display_name}
      isOpen={showDialog}
      onClose={() => window.location.href = '/protected'}
    />
  )
} 