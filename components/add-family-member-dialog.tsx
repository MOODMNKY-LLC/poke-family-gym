import { useState } from 'react'
import { StarterSelection } from "@/components/pokemon/starter-selection"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function AddFamilyMemberDialog() {
  const [starterFormId, setStarterFormId] = useState<number | null>(null)
  const [starterNickname, setStarterNickname] = useState<string>("")

  const handleSubmit = () => {
    // Handle form submission logic
  }

  return (
    <Dialog>
      <DialogContent>
        <form>
          {/* ... existing form fields ... */}
          
          <div className="space-y-2">
            <Label>Choose Their Partner Pokémon</Label>
            <StarterSelection 
              onSelect={(formId, nickname) => {
                setStarterFormId(formId)
                setStarterNickname(nickname)
              }}
              selectedGeneration={1}
            />
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit}>Add Family Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 