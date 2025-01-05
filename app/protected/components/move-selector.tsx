'use client'

import { createClient } from "@/utils/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MoveSelectorProps {
  slot: number
  memberId: string
  currentMove?: string | null
  availableMoves: Array<{
    name: string
    level: number
  }>
}

export function MoveSelector({ slot, memberId, currentMove, availableMoves }: MoveSelectorProps) {
  const supabase = createClient()

  async function updateMove(moveName: string) {
    const moveField = `starter_pokemon_move_${slot}`
    const { error } = await supabase
      .from('family_members')
      .update({ [moveField]: moveName })
      .eq('id', memberId)

    if (error) {
      console.error('Error updating move:', error)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Move {slot}
      </label>
      <Select
        defaultValue={currentMove || ''}
        onValueChange={updateMove}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a move" />
        </SelectTrigger>
        <SelectContent>
          {availableMoves.map((move) => (
            <SelectItem 
              key={move.name} 
              value={move.name}
              className="capitalize"
            >
              {move.name.replace('-', ' ')} (Lv. {move.level})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 