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
    // Create the user first
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/sign-up/congratulations`,
        data: {
          family_name: familyName,
          starter_pokemon_form_id: parseInt(starterPokemonFormId),
          starter_pokemon_nickname: starterPokemonNickname,
          pin
        }
      },
    })

    if (error) {
      console.error(error.code + " " + error.message)
      return { error: { message: error.message } }
    }

    // If we're in development, create the profile immediately
    // In production, this will be handled by a webhook after email verification
    if (process.env.NODE_ENV === 'development' && data?.user) {
      await createFamilyProfile(data.user.id, {
        familyName,
        starterPokemonFormId: parseInt(starterPokemonFormId),
        starterPokemonNickname,
        pin
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error during sign up:', error)
    return { error: { message: 'An unexpected error occurred during sign up.' } }
  }
}

interface CreateFamilyProfileParams {
  familyName: string
  starterPokemonFormId: number
  starterPokemonNickname: string
  pin: string
}

export async function createFamilyProfile(userId: string, params: CreateFamilyProfileParams) {
  const supabase = await createClient()
  const { familyName, starterPokemonFormId, starterPokemonNickname, pin } = params

  // Create initial family profile
  const { error: profileError } = await supabase
    .from('family_profiles')
    .insert({
      id: userId,
      family_name: familyName,
      timezone: 'UTC',
      locale: 'en',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('Failed to create family profile:', profileError)
    throw new Error("Failed to create family profile. Please try again.")
  }

  // Create initial admin family member
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: userId,
      display_name: familyName,
      full_name: familyName,
      role_id: 1, // Admin role
      current_status: 'online',
      starter_pokemon_form_id: starterPokemonFormId,
      starter_pokemon_nickname: starterPokemonNickname,
      starter_pokemon_obtained_at: new Date().toISOString(),
      pin
    })

  if (memberError) {
    console.error('Error creating family member:', memberError)
    throw new Error("Failed to create family member. Please try again.")
  }

  // Add starter to family pokedex
  const { error: pokedexError } = await supabase
    .from('family_pokedex')
    .insert({
      family_id: userId,
      pokemon_form_id: starterPokemonFormId,
      first_caught_at: new Date().toISOString(),
      caught_count: 1,
      is_favorite: true,
      nickname: starterPokemonNickname,
      notes: 'My first partner Pokémon!'
    })

  if (pokedexError) {
    console.error('Error adding to pokedex:', pokedexError)
    throw new Error("Failed to add starter Pokémon to Pokédex. Please try again.")
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
