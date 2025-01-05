'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { EvolutionRequirement } from '@/lib/pokemon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sparkles, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface EvolutionRequirementsProps {
  memberId: string
  requirement: EvolutionRequirement
  onEvolutionComplete?: () => void
}

export function EvolutionRequirements({ 
  memberId, 
  requirement,
  onEvolutionComplete 
}: EvolutionRequirementsProps) {
  const [isEvolving, setIsEvolving] = useState(false)
  const supabase = createClient()

  async function handleEvolution() {
    if (!requirement.canEvolve) return
    
    try {
      setIsEvolving(true)
      
      // Update the member's starter Pokémon
      const { error } = await supabase
        .from('family_members')
        .update({
          starter_pokemon_form_id: requirement.evolvesTo,
          // Reset moves since the Pokémon evolved
          starter_pokemon_move_1: null,
          starter_pokemon_move_2: null,
          starter_pokemon_move_3: null,
          starter_pokemon_move_4: null,
        })
        .eq('id', memberId)

      if (error) throw error

      // Log the evolution event
      await supabase
        .from('activity_events')
        .insert({
          member_id: memberId,
          type: 'pokemon_evolution',
          details: {
            from: requirement.currentPokemon,
            to: requirement.evolvesTo
          }
        })

      toast.success('Your Pokémon evolved!', {
        description: `${requirement.currentPokemon} evolved into ${requirement.evolvesTo}!`
      })

      onEvolutionComplete?.()
    } catch (error) {
      console.error('Evolution failed:', error)
      toast.error('Evolution failed', {
        description: 'There was an error evolving your Pokémon. Please try again.'
      })
    } finally {
      setIsEvolving(false)
    }
  }

  return (
    <Card className={requirement.canEvolve ? 'border-yellow-400/50' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {requirement.canEvolve ? (
            <Sparkles className="w-5 h-5 text-yellow-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          )}
          Evolution Available
        </CardTitle>
        <CardDescription>
          {requirement.currentPokemon} → {requirement.evolvesTo}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Evolution Type */}
          <div>
            <p className="text-sm font-medium mb-2">Evolution Method</p>
            <Badge variant="secondary" className="capitalize">
              {requirement.type.replace('-', ' ')}
            </Badge>
          </div>

          {/* Requirements List */}
          {requirement.missingRequirements.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Missing Requirements</p>
              <ul className="space-y-2">
                {requirement.missingRequirements.map((req: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full"
          disabled={!requirement.canEvolve || isEvolving}
          onClick={handleEvolution}
        >
          {isEvolving ? 'Evolving...' : 'Evolve Now'}
        </Button>
      </CardFooter>
    </Card>
  )
} 