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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DeleteFamilyDialogProps {
  familyId: string
  familyName: string
}

export function DeleteFamilyDialog({ familyId, familyName }: DeleteFamilyDialogProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    if (confirmation.toLowerCase() !== familyName.toLowerCase()) {
      toast.error('Family name does not match')
      return
    }

    try {
      setLoading(true)

      // Sign out first to clear the session
      await supabase.auth.signOut()

      // Delete the family profile (this will cascade to all related data)
      const { error } = await supabase
        .from('family_profiles')
        .delete()
        .eq('id', familyId)

      if (error) throw error

      toast.success('Your family account has been deleted')
      setOpen(false)
      
      // Redirect to the home page
      router.push('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error deleting family')
      console.error('Error details:', error)
    } finally {
      setLoading(false)
    }
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
          Delete Family Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Family Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-destructive">
                Warning: This action cannot be undone!
              </p>
              <p>
                This will permanently delete your entire family account including:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>All family member profiles</li>
                <li>Your family Pokédex</li>
                <li>All achievements and progress</li>
                <li>All uploaded avatars and media</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm">
                Type <span className="font-semibold">{familyName}</span> to confirm:
              </Label>
              <Input
                id="confirm"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={familyName}
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading || confirmation.toLowerCase() !== familyName.toLowerCase()}
          >
            {loading ? 'Deleting...' : 'Delete Family Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 