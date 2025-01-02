'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

interface TaskTemplate {
  id: string
  title: string
  description: string | null
  pokeball_reward: number
  pokeball_type: string
  estimated_time: string | null
  recurring_type: string | null
}

interface TaskTemplateActionsProps {
  template: TaskTemplate
}

export function TaskTemplateActions({ template }: TaskTemplateActionsProps) {
  const [ballType, setBallType] = useState(template.pokeball_type)
  const [reward, setReward] = useState(template.pokeball_reward)
  const supabase = createClient()

  async function updateTaskTemplate() {
    const { error } = await supabase
      .from('task_templates')
      .update({
        pokeball_type: ballType,
        pokeball_reward: reward
      })
      .eq('id', template.id)

    if (error) {
      console.error('Error updating task template:', error)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Select value={ballType} onValueChange={setBallType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select ball type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="poke_ball">Poké Ball</SelectItem>
          <SelectItem value="great_ball">Great Ball</SelectItem>
          <SelectItem value="ultra_ball">Ultra Ball</SelectItem>
          <SelectItem value="master_ball">Master Ball</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        value={reward}
        onChange={(e) => setReward(parseInt(e.target.value) || 0)}
        className="w-24"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={updateTaskTemplate}
      >
        Update Reward
      </Button>
    </div>
  )
} 