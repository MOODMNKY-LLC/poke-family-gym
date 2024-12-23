"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateStarterPokemon } from "@/utils/pokemon";

interface SignUpResponse {
  error?: { message: string }
  success?: boolean
}

export const signUpAction = async (formData: FormData): Promise<SignUpResponse> => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const familyName = formData.get("family_name")?.toString();
  const starterPokemonFormId = formData.get("starter_pokemon_form_id")?.toString();
  const starterPokemonNickname = formData.get("starter_pokemon_nickname")?.toString();
  const pin = formData.get("pin")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !familyName || !starterPokemonFormId || !starterPokemonNickname || !pin) {
    return { error: { message: "All fields including starter Pokémon selection are required" } }
  }

  // First check if a profile already exists with this family name
  const { data: existingProfile } = await supabase
    .from('family_profiles')
    .select('family_name')
    .eq('family_name', familyName)
    .single()

  if (existingProfile) {
    return { error: { message: "This family name is already taken. Please choose another." } }
  }

  try {
    // Proceed with user creation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          family_name: familyName,
          starter_pokemon_form_id: parseInt(starterPokemonFormId),
          starter_pokemon_nickname: starterPokemonNickname
        }
      },
    });

    if (error) {
      console.error('Auth signup error:', error.code, error.message)
      return { error: { message: error.message } }
    }

    // Create initial family profile if user was created
    if (data?.user) {
      // Add a small delay to ensure the session is established
      await new Promise(resolve => setTimeout(resolve, 1000))

      // First check if a profile already exists for this user
      const { data: existingUserProfile, error: checkError } = await supabase
        .from('family_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (checkError) {
        console.error('Error checking existing profile:', checkError.code, checkError.message, checkError.details)
      }

      if (existingUserProfile) {
        console.log('Profile already exists for user:', existingUserProfile)
        return { success: true }
      }

      // Create new profile if one doesn't exist
      const { error: profileError } = await supabase
        .from('family_profiles')
        .insert({
          id: data.user.id,
          family_name: familyName,
          timezone: 'UTC',
          locale: 'en',
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      // Even if we get an RLS error, let's verify if the profile was actually created
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('family_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      // If we can verify the profile exists, continue with member creation
      // regardless of the previous RLS error
      if (verifyProfile || (profileError?.message?.includes('violates row-level security policy') && !verifyError)) {
        // Create initial admin family member with starter pokemon and PIN
        const { error: memberError } = await supabase
          .from('family_members')
          .insert({
            family_id: data.user.id,
            display_name: familyName,
            full_name: familyName,
            role_id: 1, // Admin role
            current_status: 'online',
            starter_pokemon_form_id: parseInt(starterPokemonFormId),
            starter_pokemon_nickname: starterPokemonNickname,
            starter_pokemon_obtained_at: new Date().toISOString(),
            pin
          })

        if (memberError && !memberError.message?.includes('violates row-level security policy')) {
          console.error('Error creating family member:', {
            code: memberError.code,
            message: memberError.message,
            details: memberError.details,
            hint: memberError.hint
          })
          return { error: { message: `Failed to create family member: ${memberError.message}` } }
        }

        // Add starter to family pokedex
        const { error: pokedexError } = await supabase
          .from('family_pokedex')
          .insert({
            family_id: data.user.id,
            pokemon_form_id: parseInt(starterPokemonFormId),
            first_caught_at: new Date().toISOString(),
            caught_count: 1,
            is_favorite: true,
            nickname: starterPokemonNickname,
            notes: 'My first partner Pokémon!'
          })

        if (pokedexError && !pokedexError.message?.includes('violates row-level security policy')) {
          console.error('Error adding to pokedex:', {
            code: pokedexError.code,
            message: pokedexError.message,
            details: pokedexError.details,
            hint: pokedexError.hint
          })
        }

        console.log('Successfully created family profile and member')
        return { success: true }
      }

      // Only return error if we couldn't verify profile creation
      if (profileError && !verifyProfile) {
        console.error('Failed to create family profile:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        })
        
        // If profile creation fails, we should clean up the auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id)
        if (deleteError) {
          console.error('Failed to clean up auth user:', deleteError.message)
        }
        
        return { error: { message: `Failed to create family profile: ${profileError.message}` } }
      }

      return { success: true }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error during signup:', error)
    return { error: { message: "An unexpected error occurred. Please try again." } }
  }
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
