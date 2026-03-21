import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { setCachedSupabaseAccessToken, supabase } from "@/lib/supabase/client";
import { fetchOwnProfile, upsertOwnProfile } from "@/lib/supabase/queries";

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string | null;
  isAnonymous: boolean;
  isAdmin: boolean;
}

type SessionUser = {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

/**
 * Determina si hay que mostrar un loading inicial antes de que la auth resuelva.
 * - Si hay un `?code=` en la URL (magic link / OAuth callback): loading=true para
 *   esperar que el SDK intercambie el código sin mostrar el form de login.
 * - Si hay una sesión guardada en localStorage (token no expirado): loading=true
 *   para validarla en background.
 * - En cualquier otro caso: loading=false → el login aparece instantáneamente.
 */
function detectInitialLoading(): boolean {
  // Magic link / OAuth callback trae un ?code= en la URL
  if (new URLSearchParams(window.location.search).has("code")) return true;

  try {
    const url = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
    const projectRef = url.match(/\/\/([^.]+)\./)?.[1];
    if (!projectRef) return false;
    const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { expires_at?: number };
    if (!parsed.expires_at) return true;
    return parsed.expires_at * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(detectInitialLoading);

  useEffect(() => {
    let mounted = true;

    async function resolveUser(sessionUser: SessionUser) {
      // Sync profile (best effort, no throw)
      try {
        await upsertOwnProfile({
          id: sessionUser.id,
          displayName: getDisplayName(sessionUser) ?? "Jugador",
          avatarUrl: getAvatarUrl(sessionUser),
        });
      } catch { /* ignorar */ }

      const profile = await fetchOwnProfile(sessionUser.id).catch(() => null);
      if (!mounted) return;

      setUser({
        id: sessionUser.id,
        email: sessionUser.email,
        displayName:
          profile?.display_name ?? getDisplayName(sessionUser) ?? "Jugador",
        avatarUrl:
          profile?.avatar_url ?? getAvatarUrl(sessionUser) ?? null,
        isAnonymous: sessionUser.is_anonymous ?? false,
        isAdmin: profile?.is_admin ?? false,
      });
    }

    // Timeout de seguridad: máximo 8s esperando auth
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          setCachedSupabaseAccessToken(session.access_token ?? null);
          try { await resolveUser(session.user); } catch { /* ignorar */ }
        }
      } catch { /* getSession falló */ }
      if (mounted) {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    }

    void initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        try {
          if (session?.user) {
            setCachedSupabaseAccessToken(session.access_token ?? null);
            try { await resolveUser(session.user); } catch { /* ignorar */ }
          } else {
            setCachedSupabaseAccessToken(null);
            if (mounted) setUser(null);
          }
        } catch { /* ignorar */ }
        if (mounted) {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getDisplayName(u: SessionUser): string | undefined {
  return (
    u.user_metadata?.display_name ??
    u.user_metadata?.full_name ??
    u.user_metadata?.name ??
    u.email?.split("@")[0]
  );
}

function getAvatarUrl(u: SessionUser): string | null {
  return u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null;
}
