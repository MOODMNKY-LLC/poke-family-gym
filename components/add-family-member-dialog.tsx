'use client'

import { useState } from 'react'
import { StarterSelection } from "@/components/pokemon/starter-selection"
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCircle, CircleDot } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function AddFamilyMemberDialog() {
  const [starterFormId, setStarterFormId] = useState<number | null>(null)
  const [starterNickname, setStarterNickname] = useState<string>("")
  const [currentTab, setCurrentTab] = useState("info")

  const handleSubmit = () => {
    // Handle form submission logic
  }

  return (
    <Dialog>
      <DialogContent className="sm:max-w-[600px] p-0">
        <VisuallyHidden>
          <DialogTitle>Add Family Member</DialogTitle>
        </VisuallyHidden>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="p-6 pb-2">
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

          <form className="space-y-6">
            <TabsContent value="info" className="p-6 pt-2">
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      placeholder="How they'll appear in the app"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      placeholder="Their actual name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pin">Security PIN</Label>
                    <Input
                      id="pin"
                      name="pin"
                      type="password"
                      placeholder="6-digit PIN"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      They'll use this PIN to log in
                    </p>
                  </div>
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
                      setStarterFormId(formId)
                      setStarterNickname(nickname)
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
                    type="button"
                    onClick={handleSubmit}
                    disabled={!starterFormId || !starterNickname}
                  >
                    Add Family Member
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