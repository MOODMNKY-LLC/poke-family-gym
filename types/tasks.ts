// Base interface for shared task properties
export interface BaseTask {
  title: string
  description: string
  pokeballReward: number
  pokeballType: string
  recurringType: string | null
  recurringDetails: Record<string, any>
  familyId: string
}

export interface TaskTemplate extends BaseTask {
  id: string
  estimatedTime: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Task extends BaseTask {
  id: string
  assignedTo: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed'
  completedAt: string | null
  completedBy: string | null
  createdAt: string
  updatedAt: string
}

// Type for creating a new task (omitting auto-generated fields)
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

// Type for creating a new task template (omitting auto-generated fields)
export type CreateTaskTemplateInput = Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'> 