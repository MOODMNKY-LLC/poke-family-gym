'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import type { PostgrestError } from "@supabase/supabase-js"

interface DeleteMemberDialogProps {
  memberId: string
  memberName: string
  isAdmin?: boolean
  onSuccess?: () => void
}

interface MemberWithRole {
  id: string
  role_id: number
  family_id: string
  roles: {
    name: string
  }[]
}

function formatError(error: unknown) {
  try {
    // Handle PostgrestError
    if (error && typeof error === 'object' && 'code' in error) {
      const pgError = error as PostgrestError
      return {
        type: 'PostgrestError',
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint
      }
    }

    // Handle standard Error
    if (error instanceof Error) {
      return {
        type: 'Error',
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      }
    }

    // Handle other objects
    if (error && typeof error === 'object') {
      return {
        type: 'Object',
        ...error
      }
    }

    // Handle primitives
    return {
      type: typeof error,
      value: String(error)
    }
  } catch (e) {
    return {
      type: 'UnknownError',
      message: 'Failed to format error',
      originalError: String(error),
      formattingError: e instanceof Error ? e.message : String(e)
    }
  }
}

function logError(context: string, error: unknown, metadata: Record<string, unknown> = {}) {
  const errorDetails = formatError(error)
  const logData = {
    context,
    error: errorDetails,
    metadata,
    timestamp: new Date().toISOString()
  }

  // Log as string to ensure all properties are visible
  console.error('Error occurred:', JSON.stringify(logData, null, 2))
  return errorDetails
}

export function DeleteMemberDialog({ memberId, memberName, isAdmin, onSuccess }: DeleteMemberDialogProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    if (!memberId) {
      toast.error('No member ID provided')
      return
    }

    // Don't allow direct deletion of admin accounts
    if (isAdmin) {
      toast.error('Admin accounts cannot be deleted directly. Please delete the family profile instead.')
      return
    }

    try {
      setLoading(true)

      // First verify the member exists and get their role
      const { data: member, error: checkError } = await supabase
        .from('family_members')
        .select(`
          id,
          role_id,
          family_id,
          roles!inner (
            name
          )
        `)
        .eq('id', memberId)
        .single()

      if (checkError) {
        logError('Member verification failed', checkError, { memberId, memberName })
        throw new Error(`Failed to verify member: ${checkError.message}`)
      }

      if (!member) {
        throw new Error('Member not found')
      }

      const memberWithRole = member as MemberWithRole
      // Safety check - don't delete admins
      if (memberWithRole.roles[0]?.name === 'admin') {
        throw new Error('Cannot delete admin accounts directly')
      }

      // Delete the family member
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('family_id', memberWithRole.family_id)

      if (deleteError) {
        const error = logError('Member deletion failed', deleteError, { 
          memberId, 
          memberName,
          familyId: memberWithRole.family_id,
          roleId: memberWithRole.role_id,
          roleName: memberWithRole.roles[0]?.name
        })

        // Handle specific error cases
        if (error.code === '42501') {
          throw new Error('You must be a family admin to delete members')
        }
        if (error.code === '23503') {
          throw new Error('Cannot delete member: They have associated data that must be deleted first')
        }
        if (error.code === '42P01') {
          throw new Error('System error: Database configuration issue')
        }
        throw new Error(deleteError.message || 'Failed to delete member')
      }

      toast.success(`${memberName} has been removed from the family`)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      logError('Member deletion operation failed', error, { memberId, memberName })
      toast.error(error instanceof Error ? error.message : 'Failed to delete family member')
    } finally {
      setLoading(false)
    }
  }

  // Don't show the delete button for admin accounts
  if (isAdmin) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Profile
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground space-y-2">
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-semibold">{memberName}&apos;s</span> profile
            and remove all their data from the family.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 