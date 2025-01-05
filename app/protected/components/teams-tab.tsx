'use client'

import { useState } from 'react'
import { TeamBuilder } from './team-builder'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface TeamsTabProps {
  memberId: string
  collection: any[] // Pokemon from personal collection
}

export function TeamsTab({ memberId, collection }: TeamsTabProps) {
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)

  // Function to handle saving a new team
  function handleSaveTeam(team: any) {
    // TODO: Implement team saving logic
    console.log('Saving team:', team)
    setIsCreatingTeam(false)
  }

  return (
    <div className="space-y-6">
      {isCreatingTeam ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Create New Team</h2>
            <Button variant="ghost" onClick={() => setIsCreatingTeam(false)}>
              Cancel
            </Button>
          </div>
          <TeamBuilder
            memberId={memberId}
            collection={collection}
            onSave={handleSaveTeam}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Teams</h2>
            <Button onClick={() => setIsCreatingTeam(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
          
          {/* Placeholder for teams list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-6">
              <p className="text-muted-foreground text-center">
                No teams created yet. Click the button above to create your first team!
              </p>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
} 