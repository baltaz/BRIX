import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para operaciones de administración.
 * Usa la service role key que bypasses RLS completamente,
 * y desactiva persistSession para evitar locks de IndexedDB
 * que colgaban las escrituras cuando no hay sesión de usuario.
 */
export const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "",
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
