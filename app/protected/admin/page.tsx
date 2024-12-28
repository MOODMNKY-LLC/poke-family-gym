import { Metadata } from 'next'
import { PokeDexterControl } from '../components/poke-dexter-control'

export const metadata: Metadata = {
  title: 'PokéDexter Control Panel - PokéGym Admin',
  description: 'Manage your PokéDexter chatflows and configurations'
}

export default function AdminPage() {
  return (
    <div className="container mx-auto py-6">
      <PokeDexterControl />
    </div>
  )
} 