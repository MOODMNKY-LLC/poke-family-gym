import { createClient } from "@/utils/supabase/client"

export async function validateStarterPokemon({ formId, nickname }: { 
  formId: number, 
  nickname: string 
}) {
  const supabase = createClient()
  
  // Verify the Pokémon is a valid starter
  const { data: starter, error } = await supabase
    .from('starter_pokemon_config')
    .select(`
      pokemon_form_id,
      generation_id,
      pokemon_forms!inner (
        id,
        name,
        species_id
      )
    `)
    .eq('pokemon_form_id', formId)
    .eq('is_active', true)
    .single()

  if (error || !starter) {
    throw new Error('Invalid starter Pokémon selection')
  }

  // Validate nickname
  if (nickname.length > 12 || nickname.length < 1) {
    throw new Error('Nickname must be between 1 and 12 characters')
  }

  return true
} 