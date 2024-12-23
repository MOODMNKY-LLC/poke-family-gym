import { createClient } from './deps.ts'

interface WebhookPayload {
  type: 'EMAIL_CONFIRM' | 'EMAIL_CHANGE' | string
  event: string
  table: string
  record: {
    id: string
    email: string
    raw_user_meta_data: {
      family_name: string
      starter_pokemon_form_id: number
      starter_pokemon_nickname: string
      pin: string
    }
  }
}

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the webhook payload
    const payload: WebhookPayload = await req.json()

    // Only proceed if this is an email confirmation
    if (payload.type !== 'EMAIL_CONFIRM') {
      return new Response(JSON.stringify({ message: 'Not an email confirmation' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const userId = payload.record.id
    const { family_name, starter_pokemon_form_id, starter_pokemon_nickname, pin } = 
      payload.record.raw_user_meta_data

    // Create initial family profile
    const { error: profileError } = await supabaseAdmin
      .from('family_profiles')
      .insert({
        id: userId,
        family_name,
        timezone: 'UTC',
        locale: 'en',
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      throw profileError
    }

    // Create initial admin family member
    const { error: memberError } = await supabaseAdmin
      .from('family_members')
      .insert({
        family_id: userId,
        display_name: family_name,
        full_name: family_name,
        role_id: 1, // Admin role
        current_status: 'online',
        starter_pokemon_form_id,
        starter_pokemon_nickname,
        starter_pokemon_obtained_at: new Date().toISOString(),
        pin
      })

    if (memberError) {
      throw memberError
    }

    // Add starter to family pokedex
    const { error: pokedexError } = await supabaseAdmin
      .from('family_pokedex')
      .insert({
        family_id: userId,
        pokemon_form_id: starter_pokemon_form_id,
        first_caught_at: new Date().toISOString(),
        caught_count: 1,
        is_favorite: true,
        nickname: starter_pokemon_nickname,
        notes: 'My first partner Pokémon!'
      })

    if (pokedexError) {
      throw pokedexError
    }

    return new Response(
      JSON.stringify({ message: 'Successfully created family profile' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 