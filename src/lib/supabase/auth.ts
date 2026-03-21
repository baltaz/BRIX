import { setCachedSupabaseAccessToken, supabase } from "./client";

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  setCachedSupabaseAccessToken(data.session?.access_token ?? null);
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const fallbackName = email.split("@")[0] || "Jugador";
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo ?? `${window.location.origin}/`,
      shouldCreateUser: true,
      data: { display_name: fallbackName },
    },
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  setCachedSupabaseAccessToken(null);
  // scope: 'local' limpia la sesión local y dispara SIGNED_OUT sin hacer llamada a red
  // Esto evita que el botón "Salir" quede colgado si Supabase es lento
  await supabase.auth.signOut({ scope: "local" });
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthStateChange(callback: (user: { id: string } | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
