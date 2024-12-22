interface FamilyMember {
  id: string
  family_id: string
  display_name: string
  full_name: string
  role_id: number
  starter_pokemon_form_id: number | null
  starter_pokemon_nickname: string | null
  starter_pokemon_obtained_at: string | null
  // ... other fields
}

interface StarterPokemon {
  id: number
  name: string
  spriteUrl: string
  generation: number
} 