'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarterSelection } from "@/components/pokemon/starter-selection"
import { toast } from "sonner"
import { AvatarUpload } from "@/app/account/avatar"
import { getAvatarUrl } from "@/utils/get-avatar-url"
import { Role } from '@/types/types'
import { UserCircle, CircleDot } from "lucide-react"

interface AddFamilyMemberDialogProps {
  familyId: string
  roles: Role[]
  onSuccess?: () => void
}

export function AddFamilyMemberDialog({ familyId, roles, onSuccess }: AddFamilyMemberDialogProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("info")
  const [errors, setErrors] = useState<{
    display_name?: string
    full_name?: string
    pin?: string
    confirmPin?: string
  }>({})
  const [formData, setFormData] = useState({
    display_name: '',
    full_name: '',
    avatar_url: null as string | null,
    pin: '',
    confirmPin: '',
    role_id: '2', // Default to child role
    starter_pokemon_form_id: null as number | null,
    starter_pokemon_nickname: ''
  })

  // Validate form fields and update error state
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    switch (name) {
      case 'display_name':
        if (!value || value.length < 2) {
          newErrors.display_name = 'Display name must be at least 2 characters long'
        } else {
          delete newErrors.display_name
        }
        break
      case 'full_name':
        if (!value || value.length < 2) {
          newErrors.full_name = 'Full name must be at least 2 characters long'
        } else {
          delete newErrors.full_name
        }
        break
      case 'pin':
        if (formData.role_id !== '1') {
          if (!value || value.length !== 6) {
            newErrors.pin = 'PIN must be 6 digits'
          } else {
            delete newErrors.pin
          }
          // Also validate confirmPin when pin changes
          if (value !== formData.confirmPin) {
            newErrors.confirmPin = 'PINs do not match'
          } else {
            delete newErrors.confirmPin
          }
        }
        break
      case 'confirmPin':
        if (formData.role_id !== '1') {
          if (value !== formData.pin) {
            newErrors.confirmPin = 'PINs do not match'
          } else {
            delete newErrors.confirmPin
          }
        }
        break
    }

    setErrors(newErrors)
  }

  // Handle input changes with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let processedValue = value

    // Special handling for PIN fields
    if (name === 'pin' || name === 'confirmPin') {
      processedValue = value.replace(/\D/g, '')
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))

    validateField(name, processedValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validate all fields before submission
      validateField('display_name', formData.display_name)
      validateField('full_name', formData.full_name)
      if (formData.role_id !== '1') {
        validateField('pin', formData.pin)
        validateField('confirmPin', formData.confirmPin)
      }

      // Check if there are any errors
      if (Object.keys(errors).length > 0) {
        return // Don't proceed if there are validation errors
      }

      setLoading(true)

      // Generate a unique ID for the new member
      const memberId = crypto.randomUUID()

      const { error } = await supabase
        .from('family_members')
        .insert({
          id: memberId,
          family_id: familyId,
          display_name: formData.display_name,
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          pin: formData.role_id !== '1' ? formData.pin : null,
          role_id: parseInt(formData.role_id),
          current_status: 'active',
          starter_pokemon_form_id: formData.starter_pokemon_form_id,
          starter_pokemon_nickname: formData.starter_pokemon_nickname
        })

      if (error) throw error

      // If a starter was selected, add it to the family Pokédex
      if (formData.starter_pokemon_form_id) {
        const { error: pokedexError } = await supabase
          .from('family_pokedex')
          .insert({
            family_id: familyId,
            pokemon_form_id: formData.starter_pokemon_form_id,
            first_caught_at: new Date().toISOString(),
            caught_count: 1,
            is_favorite: true,
            nickname: formData.starter_pokemon_nickname,
            notes: `${formData.display_name}'s partner Pokémon`
          })

        if (pokedexError) throw pokedexError
      }

      toast.success('Family member added successfully!')
      setOpen(false)
      onSuccess?.()
      
      // Reset form and tab
      setFormData({
        display_name: '',
        full_name: '',
        avatar_url: null,
        pin: '',
        confirmPin: '',
        role_id: '2',
        starter_pokemon_form_id: null,
        starter_pokemon_nickname: ''
      })
      setErrors({})
      setCurrentTab("info")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error adding family member')
      console.error('Error details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Family Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="p-6 pb-2">
            <DialogHeader className="pb-4">
              <DialogTitle>Add Family Member</DialogTitle>
              <DialogDescription>
                Add a new member to your family. They will be added as a child by default.
              </DialogDescription>
            </DialogHeader>

            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="pokemon" className="flex items-center gap-2">
                <CircleDot className="w-4 h-4" />
                Partner Pokémon
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit}>
            <TabsContent value="info" className="p-6 pt-2">
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <AvatarUpload
                    uid={crypto.randomUUID()}
                    url={formData.avatar_url ? getAvatarUrl(formData.avatar_url) : null}
                    size={100}
                    onUpload={(url) => {
                      setFormData(prev => ({
                        ...prev,
                        avatar_url: url
                      }))
                    }}
                  />
                </div>

                {/* Basic Information */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">
                      Display Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      placeholder="Ash"
                      aria-describedby="display_name_error"
                      className={errors.display_name ? "border-red-500" : ""}
                    />
                    {errors.display_name && (
                      <p id="display_name_error" className="text-sm text-red-500">
                        {errors.display_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Ash Ketchum"
                      aria-describedby="full_name_error"
                      className={errors.full_name ? "border-red-500" : ""}
                    />
                    {errors.full_name && (
                      <p id="full_name_error" className="text-sm text-red-500">
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role_id}
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          role_id: value,
                          ...(value === '1' && { pin: '', confirmPin: '' })
                        }))
                        if (value === '1') {
                          setErrors(prev => {
                            const { pin, confirmPin, ...rest } = prev
                            return rest
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PIN Fields (only for non-admin roles) */}
                  {formData.role_id !== '1' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="pin">
                          PIN <span className="ml-1 text-xs text-muted-foreground">(6 digits)</span>
                        </Label>
                        <Input
                          id="pin"
                          name="pin"
                          type="password"
                          inputMode="numeric"
                          pattern="\d{6}"
                          maxLength={6}
                          value={formData.pin}
                          onChange={handleInputChange}
                          className={`font-mono ${errors.pin ? "border-red-500" : ""}`}
                          aria-describedby="pin_error"
                        />
                        {errors.pin && (
                          <p id="pin_error" className="text-sm text-red-500">
                            {errors.pin}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPin">
                          Confirm PIN <span className="ml-1 text-xs text-muted-foreground">(6 digits)</span>
                        </Label>
                        <Input
                          id="confirmPin"
                          name="confirmPin"
                          type="password"
                          inputMode="numeric"
                          pattern="\d{6}"
                          maxLength={6}
                          value={formData.confirmPin}
                          onChange={handleInputChange}
                          className={`font-mono ${errors.confirmPin ? "border-red-500" : ""}`}
                          aria-describedby="confirm_pin_error"
                        />
                        {errors.confirmPin && (
                          <p id="confirm_pin_error" className="text-sm text-red-500">
                            {errors.confirmPin}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setCurrentTab("pokemon")}
                  >
                    Next: Choose Partner
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pokemon" className="p-6 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose Their Partner Pokémon</Label>
                  <StarterSelection 
                    onSelect={(formId, nickname) => {
                      setFormData(prev => ({
                        ...prev,
                        starter_pokemon_form_id: formId,
                        starter_pokemon_nickname: nickname
                      }))
                    }}
                    selectedGeneration={1}
                  />
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentTab("info")}
                  >
                    Back to Info
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading || Object.keys(errors).length > 0 || !formData.display_name || !formData.full_name}
                  >
                    {loading ? 'Adding...' : 'Add Member'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 