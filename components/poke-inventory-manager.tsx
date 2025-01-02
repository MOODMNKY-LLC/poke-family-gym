'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshButton } from '@/components/refresh-button'

export default function PokeInventoryManager() {
  const [inventory, setInventory] = useState<any[]>([])

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading inventory:', error)
      return
    }

    setInventory(data || [])
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Poké Inventory Manager</CardTitle>
          <CardDescription>Configure rewards for tasks and activities</CardDescription>
        </div>
        <RefreshButton onRefresh={loadInventory} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reward Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.ball_type?.replace('_', ' ') || 'Not set'}</TableCell>
                <TableCell>{item.reward_amount || 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Add actions here */}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 