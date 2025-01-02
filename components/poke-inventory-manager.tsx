import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TaskTemplateActions } from './task-template-actions'
import { RefreshButton } from './refresh-button'

interface TaskTemplate {
  id: string
  title: string
  description: string | null
  pokeball_reward: number
  pokeball_type: string
  estimated_time: string | null
  recurring_type: string | null
}

export default async function PokeInventoryManager() {
  const supabase = await createClient()

  const { data: taskTemplates } = await supabase
    .from('task_templates')
    .select('*')
    .order('title')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Poké Inventory Manager</CardTitle>
          <CardDescription>Configure rewards for tasks and activities</CardDescription>
        </div>
        <RefreshButton />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Estimated Time</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Reward Type</TableHead>
              <TableHead>Reward Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskTemplates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.title}</TableCell>
                <TableCell>{template.description}</TableCell>
                <TableCell>{template.estimated_time}</TableCell>
                <TableCell>{template.recurring_type}</TableCell>
                <TableCell colSpan={3}>
                  <TaskTemplateActions template={template} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 