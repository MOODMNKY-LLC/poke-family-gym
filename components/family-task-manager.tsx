'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { toast } from "../components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "../components/ui/dialog"
import { ScrollArea } from "../components/ui/scroll-area"
import { pokeballs, Pokeball } from '@/types/pokemon'
import { Task, TaskTemplate, CreateTaskInput, CreateTaskTemplateInput } from '@/types/tasks'
import { FamilyMember } from '@/types/family'
import { TasksAPI } from '../lib/supabase/tasks'
import { FamilyMembersAPI } from '../lib/supabase/family-members'
import { createClient } from '../lib/supabase/client'
import { PokeAPI } from '../lib/pokeapi/client'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function FamilyTaskManager() {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [selectedPokeball, setSelectedPokeball] = useState<Pokeball | null>(null)
  const [customPokeballValues, setCustomPokeballValues] = useState<{ [key: string]: number }>({})
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [dateDue, setDateDue] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [pokeballs, setPokeballs] = useState<Pokeball[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [templates, members, pokeballData, tasksData] = await Promise.all([
          TasksAPI.getFamilyTaskTemplates(),
          FamilyMembersAPI.getFamilyMembers(),
          PokeAPI.getPokeballs(),
          TasksAPI.getFamilyTasks()
        ])
        
        // Transform PokeAPI data to match our Pokeball interface
        const transformedPokeballs: Pokeball[] = pokeballData.map(ball => ({
          name: ball.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          baseValue: Math.ceil(ball.cost / 200), // Convert cost to our value system
          rarity: ball.name === 'master-ball' ? 'ultra_rare' : 
                 ball.name === 'ultra-ball' ? 'rare' :
                 ball.name === 'great-ball' ? 'uncommon' : 'common',
          quantity: ball.name === 'master-ball' ? 5 :
                   ball.name === 'ultra-ball' ? 15 :
                   ball.name === 'great-ball' ? 30 : 50,
          image: ball.sprites.default
        }))
        
        setTaskTemplates(templates)
        setFamilyMembers(members)
        setPokeballs(transformedPokeballs)
        setTasks(tasksData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Failed to load task data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handlePokeballSelect = (pokeball: Pokeball) => {
    console.log('Selecting pokeball:', pokeball)
    setSelectedPokeball(pokeball)
  }

  const handleCustomPokeballValue = (pokeballName: string, value: string) => {
    const numericValue = parseInt(value) || 0
    setCustomPokeballValues({
      ...customPokeballValues,
      [pokeballName]: numericValue,
    })
  }

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', {
      taskTitle,
      taskDescription,
      selectedPokeball,
      selectedMember,
      dateDue,
      estimatedTime
    })

    if (!taskTitle || !taskDescription || !selectedPokeball || !selectedMember || !dateDue || !estimatedTime) {
      console.log('Validation failed:', {
        taskTitle: !taskTitle,
        taskDescription: !taskDescription,
        selectedPokeball: !selectedPokeball,
        selectedMember: !selectedMember,
        dateDue: !dateDue,
        estimatedTime: !estimatedTime
      })
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found')

      const taskValue = customPokeballValues[selectedPokeball.name] || selectedPokeball.baseValue
      const assignedMember = familyMembers.find(m => m.id === selectedMember)
      if (!assignedMember) throw new Error('Selected member not found')

      const newTask: CreateTaskInput = {
        title: taskTitle,
        description: taskDescription,
        pokeballReward: taskValue,
        pokeballType: selectedPokeball.name.toLowerCase().replace(' ', '_'),
        assignedTo: selectedMember,
        dueDate: new Date(dateDue).toISOString(),
        status: 'pending',
        recurringType: null,
        recurringDetails: {},
        familyId: user.id,
        completedAt: null,
        completedBy: null
      }

      const createdTask = await TasksAPI.createTask(newTask)
      setTasks(currentTasks => [...currentTasks, createdTask])
      setIsAssignDialogOpen(false)

      toast({
        title: "Success",
        description: `Task "${taskTitle}" assigned to ${assignedMember.displayName} with ${selectedPokeball.name} (${taskValue} Poké Balls)`,
      })

      resetForm()
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    }
  }

  const handleSaveTemplate = async () => {
    if (!taskTitle || !taskDescription || !selectedPokeball || !estimatedTime) {
      toast({
        title: "Error",
        description: "Please fill in task title, description, Pokéball, and estimated time",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found')

      const taskValue = customPokeballValues[selectedPokeball.name] || selectedPokeball.baseValue

      const newTemplate: CreateTaskTemplateInput = {
        title: taskTitle,
        description: taskDescription,
        pokeballReward: taskValue,
        pokeballType: selectedPokeball.name.toLowerCase().replace(' ', '_'),
        estimatedTime: estimatedTime,
        recurringType: null,
        recurringDetails: {},
        familyId: user.id,
        createdBy: user.id
      }

      const createdTemplate = await TasksAPI.createTaskTemplate(newTemplate)
      setTaskTemplates(currentTemplates => [...currentTemplates, createdTemplate])
      setIsTemplateDialogOpen(false)
      
      toast({
        title: "Success",
        description: `Task template "${taskTitle}" has been saved`,
      })

      toast({
        title: "Tip",
        description: "You can now assign this task or continue editing",
      })
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      })
    }
  }

  const handleLoadTemplate = (template: TaskTemplate) => {
    setTaskTitle(template.title)
    setTaskDescription(template.description || '')
    const pokeball = template.pokeballType ? 
      pokeballs.find(p => p.name.toLowerCase().replace(' ', '_') === template.pokeballType) :
      pokeballs.find(p => p.baseValue === template.pokeballReward)
    
    if (pokeball) {
      setSelectedPokeball(pokeball)
      if (template.pokeballReward !== pokeball.baseValue) {
        setCustomPokeballValues({
          ...customPokeballValues,
          [pokeball.name]: template.pokeballReward,
        })
      }
    }
    setEstimatedTime(template.estimatedTime || '')
    setSelectedTemplate(template)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await TasksAPI.deleteTaskTemplate(templateId)
      setTaskTemplates(taskTemplates.filter(t => t.id !== templateId))
      toast({
        title: "Template Deleted",
        description: "The task template has been deleted",
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template)
  }

  const handleUpdateTemplate = async (updatedTemplate: TaskTemplate) => {
    try {
      const updated = await TasksAPI.updateTaskTemplate(updatedTemplate.id, updatedTemplate)
      setTaskTemplates(taskTemplates.map(t => t.id === updated.id ? updated : t))
      setEditingTemplate(null)
      toast({
        title: "Template Updated",
        description: `Task template "${updated.title}" has been updated`,
      })
    } catch (error) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setTaskTitle('')
    setTaskDescription('')
    setSelectedPokeball(null)
    setCustomPokeballValues({})
    setSelectedMember('')
    setSelectedTemplate(null)
    setDateDue('')
    setEstimatedTime('')
  }

  const handleAvatarUpload = async (memberId: string, file: File) => {
    try {
      const publicUrl = await FamilyMembersAPI.updateMemberAvatar(memberId, file)
      // Update the member's avatar in the local state
      setFamilyMembers(members => members.map(m => 
        m.id === memberId ? { ...m, avatar_url: publicUrl } : m
      ))
      toast({
        title: "Avatar Updated",
        description: "Profile picture has been updated successfully",
      })
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updated = await TasksAPI.updateTask(taskId, updates)
      setTasks(tasks => tasks.map(t => t.id === updated.id ? updated : t))
      setEditingTask(null)
      toast({
        title: "Task Updated",
        description: "The task has been updated successfully",
      })
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Family Task Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assign" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assign">Assign Task</TabsTrigger>
            <TabsTrigger value="templates">Task Templates</TabsTrigger>
            <TabsTrigger value="members">Family Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="assign">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateSelect">Load Template</Label>
                <Select onValueChange={(templateId) => {
                  const template = taskTemplates.find(t => t.id === templateId)
                  if (template) handleLoadTemplate(template)
                }}>
                  <SelectTrigger id="templateSelect">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTemplates.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        <span className="text-muted-foreground">No templates saved yet. Create one below!</span>
                      </SelectItem>
                    ) : (
                      taskTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskDescription">Task Description</Label>
                <Textarea
                  id="taskDescription"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Select Poké Ball Reward</Label>
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {pokeballs.map((pokeball: Pokeball, index: number) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card 
                            className={`cursor-pointer transition-all w-[160px] mx-auto ${
                              selectedPokeball?.name === pokeball.name 
                                ? 'ring-2 ring-primary shadow-lg transform scale-105' 
                                : 'hover:ring-1 hover:ring-primary/50'
                            }`} 
                            onClick={() => handlePokeballSelect(pokeball)}
                          >
                            <CardContent className="flex flex-col items-center justify-center p-4 space-y-3">
                              <img src={pokeball.image} alt={pokeball.name} className="w-12 h-12" />
                              <h3 className="text-base font-medium text-center leading-tight">{pokeball.name}</h3>
                              <div className="text-sm text-gray-500 text-center leading-tight">
                                <p>Rarity: {pokeball.rarity}</p>
                              </div>
                              <div className="w-full">
                                <Input
                                  type="number"
                                  className="w-full h-7 text-sm px-2"
                                  placeholder={`Min: ${pokeball.baseValue}`}
                                  value={customPokeballValues[pokeball.name] || ''}
                                  onChange={(e) => handleCustomPokeballValue(pokeball.name, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  min={pokeball.baseValue}
                                />
                              </div>
                              {selectedPokeball?.name === pokeball.name && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignTo">Assign To</Label>
                <Select onValueChange={handleMemberSelect} value={selectedMember}>
                  <SelectTrigger id="assignTo">
                    <SelectValue placeholder="Select a family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateDue">Date Due</Label>
                <Input
                  id="dateDue"
                  type="date"
                  value={dateDue}
                  onChange={(e) => setDateDue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Time</Label>
                <Input
                  id="estimatedTime"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g., 30 minutes, 1 hour"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" className="flex-1">Assign Task</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Task Assignment</DialogTitle>
                      <DialogDescription>
                        Please review the task details before confirming.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Title: {taskTitle}</p>
                          <p>Assigned to: {familyMembers.find(m => m.id === selectedMember)?.displayName}</p>
                          <p>Due Date: {dateDue}</p>
                          <p>Reward: {selectedPokeball ? `${selectedPokeball.name} (${customPokeballValues[selectedPokeball.name] || selectedPokeball.baseValue} Poké Balls)` : 'No reward selected'}</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={(e) => {
                            e.preventDefault()
                            handleSubmit(e as unknown as React.FormEvent)
                          }}
                        >
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">Save as Template</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Task Template</DialogTitle>
                      <DialogDescription>
                        Save this task as a reusable template for future assignments.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Title: {taskTitle}</p>
                          <p>Estimated Time: {estimatedTime}</p>
                          <p>Reward: {selectedPokeball ? `${selectedPokeball.name} (${customPokeballValues[selectedPokeball.name] || selectedPokeball.baseValue} Poké Balls)` : 'No reward selected'}</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate}>
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="templates">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Poké Balls</TableHead>
                    <TableHead>Est. Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.title}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const templatePokeball = template.pokeballType ? 
                              pokeballs.find(p => p.name.toLowerCase().replace(' ', '_') === template.pokeballType) || pokeballs[0] :
                              pokeballs.find(p => p.baseValue === template.pokeballReward) || pokeballs[0]
                            
                            return (
                              <img 
                                src={templatePokeball.image} 
                                alt={templatePokeball.name}
                                className="w-6 h-6"
                                title={`${templatePokeball.name} (${template.pokeballReward} Poké Balls)`}
                              />
                            )
                          })()}
                          <span>{template.pokeballReward} Poké Balls</span>
                        </div>
                      </TableCell>
                      <TableCell>{template.estimatedTime}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>Edit</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Template</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                e.preventDefault()
                                if (editingTemplate) handleUpdateTemplate(editingTemplate)
                              }} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="editTitle">Title</Label>
                                  <Input
                                    id="editTitle"
                                    value={editingTemplate?.title || ''}
                                    onChange={(e) => setEditingTemplate((prev: TaskTemplate | null) => prev ? {...prev, title: e.target.value} : null)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editDescription">Description</Label>
                                  <Textarea
                                    id="editDescription"
                                    value={editingTemplate?.description || ''}
                                    onChange={(e) => setEditingTemplate((prev: TaskTemplate | null) => prev ? {...prev, description: e.target.value} : null)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editPokeballReward">Poké Ball Reward</Label>
                                  <Input
                                    id="editPokeballReward"
                                    type="number"
                                    value={editingTemplate?.pokeballReward || 0}
                                    onChange={(e) => setEditingTemplate((prev: TaskTemplate | null) => prev ? {...prev, pokeballReward: parseInt(e.target.value) || 0} : null)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="editEstimatedTime">Estimated Time</Label>
                                  <Input
                                    id="editEstimatedTime"
                                    value={editingTemplate?.estimatedTime || ''}
                                    onChange={(e) => setEditingTemplate((prev: TaskTemplate | null) => prev ? {...prev, estimatedTime: e.target.value} : null)}
                                    placeholder="e.g., 30 minutes, 1 hour"
                                    required
                                  />
                                </div>
                                <Button type="submit">Update Template</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="members">
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              {familyMembers.map((member) => {
                const memberTasks = tasks.filter(task => task.assignedTo === member.id)
                return (
                  <Card key={member.id} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.avatarUrl || undefined} alt={member.displayName} />
                              <AvatarFallback>
                                {member.displayName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <label 
                              htmlFor={`avatar-${member.id}`}
                              className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3 h-3 text-white"
                              >
                                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                              </svg>
                              <Input
                                type="file"
                                id={`avatar-${member.id}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleAvatarUpload(member.id, file)
                                }}
                              />
                            </label>
                          </div>
                          <div>
                            <CardTitle className="text-xl">{member.displayName}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {memberTasks.filter(t => t.status === 'completed').length} completed, 
                              {memberTasks.filter(t => t.status === 'pending').length} pending
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {memberTasks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reward</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memberTasks.map((task) => {
                              const taskPokeball = pokeballs.find(p => p.baseValue === task.pokeballReward)
                              return (
                                <TableRow key={task.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{task.title}</p>
                                      <p className="text-sm text-muted-foreground">{task.description}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={task.status}
                                      onValueChange={(value) => handleUpdateTask(task.id, { status: value as Task['status'] })}
                                    >
                                      <SelectTrigger className="w-[130px]">
                                        <SelectValue>
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {task.status.replace('_', ' ')}
                                          </span>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      {(() => {
                                        // Find the matching pokeball based on the stored type
                                        const taskPokeball = task.pokeballType ? 
                                          pokeballs.find(p => p.name.toLowerCase().replace(' ', '_') === task.pokeballType) || pokeballs[0] :
                                          // Fallback for tasks without stored type (legacy support)
                                          pokeballs.find(p => p.baseValue === task.pokeballReward) || pokeballs[0]

                                        return (
                                          <img 
                                            src={taskPokeball.image} 
                                            alt={taskPokeball.name}
                                            className="w-6 h-6"
                                            title={`${taskPokeball.name} (${task.pokeballReward} Poké Balls)`}
                                          />
                                        )
                                      })()}
                                      <span>{task.pokeballReward} Poké Balls</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setEditingTask(task)}
                                          >
                                            Edit
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Edit Task</DialogTitle>
                                          </DialogHeader>
                                          <form onSubmit={(e) => {
                                            e.preventDefault()
                                            if (editingTask) {
                                              handleUpdateTask(editingTask.id, {
                                                title: editingTask.title,
                                                description: editingTask.description,
                                                dueDate: editingTask.dueDate,
                                                pokeballReward: editingTask.pokeballReward
                                              })
                                            }
                                          }} className="space-y-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="editTaskTitle">Title</Label>
                                              <Input
                                                id="editTaskTitle"
                                                value={editingTask?.title || ''}
                                                onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                                                required
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="editTaskDescription">Description</Label>
                                              <Textarea
                                                id="editTaskDescription"
                                                value={editingTask?.description || ''}
                                                onChange={(e) => setEditingTask(prev => prev ? {...prev, description: e.target.value} : null)}
                                                required
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="editTaskDueDate">Due Date</Label>
                                              <Input
                                                id="editTaskDueDate"
                                                type="date"
                                                value={editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditingTask(prev => prev ? {...prev, dueDate: e.target.value} : null)}
                                                required
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="editTaskReward">Poké Ball Reward</Label>
                                              <Input
                                                id="editTaskReward"
                                                type="number"
                                                value={editingTask?.pokeballReward || 0}
                                                onChange={(e) => setEditingTask(prev => prev ? {...prev, pokeballReward: parseInt(e.target.value) || 0} : null)}
                                                required
                                              />
                                            </div>
                                            <Button type="submit">Update Task</Button>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this task?')) {
                                            TasksAPI.deleteTask(task.id)
                                              .then(() => {
                                                setTasks(tasks => tasks.filter(t => t.id !== task.id))
                                                toast({
                                                  title: "Task Deleted",
                                                  description: "The task has been deleted successfully",
                                                })
                                              })
                                              .catch((error) => {
                                                console.error('Error deleting task:', error)
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to delete task",
                                                  variant: "destructive",
                                                })
                                              })
                                          }
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No tasks assigned yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

