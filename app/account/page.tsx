import AccountForm from './account-form'
import FamilyTaskManager from '@/components/family-task-manager'
import PokeBankManager from '@/components/poke-bank-manager'
import PokeInventoryManager from '@/components/poke-inventory-manager'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/sign-in')

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full max-w-7xl p-4 sm:p-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Family Profile</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="pokebank">Poké Bank</TabsTrigger>
            <TabsTrigger value="pokeinventory">Poké Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <AccountForm user={user} />
          </TabsContent>
          <TabsContent value="tasks">
            <FamilyTaskManager />
          </TabsContent>
          <TabsContent value="pokebank">
            <PokeBankManager />
          </TabsContent>
          <TabsContent value="pokeinventory">
            <PokeInventoryManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}