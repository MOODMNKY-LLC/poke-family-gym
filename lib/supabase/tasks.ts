import { createClient } from '@/lib/supabase/client'
import { Task, TaskTemplate, CreateTaskInput, CreateTaskTemplateInput } from '@/types/tasks'

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/([-_][a-z])/g, group =>
          group.toUpperCase().replace('-', '').replace('_', '')
        )]: toCamelCase(obj[key])
      }),
      {}
    )
  }
  return obj
}

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)]: toSnakeCase(obj[key])
      }),
      {}
    )
  }
  return obj
}

export const TasksAPI = {
  // Get all tasks for the family
  async getFamilyTasks(): Promise<Task[]> {
    try {
      const supabase = createClient()

      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No authenticated user found')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return toCamelCase(data) || []
    } catch (error) {
      console.error('Error fetching family tasks:', error)
      throw error
    }
  },

  // Get all task templates for the family
  async getFamilyTaskTemplates(): Promise<TaskTemplate[]> {
    try {
      const supabase = createClient()

      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No authenticated user found')

      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('family_id', user.id)
        .order('title')

      if (error) throw error
      return toCamelCase(data) || []
    } catch (error) {
      console.error('Error fetching task templates:', error)
      throw error
    }
  },

  // Create a new task
  async createTask(task: CreateTaskInput): Promise<Task> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('tasks')
        .insert([toSnakeCase(task)])
        .select()
        .single()

      if (error) throw error
      return toCamelCase(data)
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  // Create a new task template
  async createTaskTemplate(template: CreateTaskTemplateInput): Promise<TaskTemplate> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('task_templates')
        .insert([toSnakeCase(template)])
        .select()
        .single()

      if (error) throw error
      return toCamelCase(data)
    } catch (error) {
      console.error('Error creating task template:', error)
      throw error
    }
  },

  // Update a task
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('tasks')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return toCamelCase(data)
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  // Update a task template
  async updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('task_templates')
        .update(toSnakeCase(updates))
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return toCamelCase(data)
    } catch (error) {
      console.error('Error updating task template:', error)
      throw error
    }
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  },

  // Delete a task template
  async deleteTaskTemplate(id: string): Promise<void> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting task template:', error)
      throw error
    }
  }
} 