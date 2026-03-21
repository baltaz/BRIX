import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

let currentAccessToken: string | null = null;

void supabase.auth.getSession().then(({ data: { session } }) => {
  currentAccessToken = session?.access_token ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentAccessToken = session?.access_token ?? null;
});

export function getCachedSupabaseAccessToken() {
  return currentAccessToken;
}

export function setCachedSupabaseAccessToken(token: string | null) {
  currentAccessToken = token;
}
