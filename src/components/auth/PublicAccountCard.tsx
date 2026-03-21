import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle, signInWithMagicLink, signOut } from "@/lib/supabase/auth";
import { UserAvatar } from "./UserAvatar";

export function PublicAccountCard() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "magic" | "logout" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setBusy("google");
    setError(null);
    setMessage(null);
    try {
      await signInWithGoogle();
    } catch (loginError) {
      const msg = loginError instanceof Error ? loginError.message : "";
      if (msg.includes("provider") || msg.includes("Unsupported")) {
        setError("Google no está habilitado en este proyecto. Usá el magic link por ahora.");
      } else {
        setError(msg || "No se pudo iniciar sesión con Google.");
      }
      setBusy(null);
    }
  }

  async function handleMagicLink(event: FormEvent) {
    event.preventDefault();
    setBusy("magic");
    setError(null);
    setMessage(null);
    try {
      await signInWithMagicLink(email);
      setMessage("Te enviamos un magic link para entrar al juego.");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo enviar el magic link.");
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    setBusy("logout");
    setError(null);
    setMessage(null);
    try {
      await signOut();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "No se pudo cerrar sesión.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  if (user && !user.isAnonymous) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size={72} />
        <p className="font-bold text-lg leading-tight">{user.displayName}</p>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={busy === "logout"}
          className="mt-1 text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
        >
          {busy === "logout" ? "Saliendo..." : "Cerrar sesión"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-purple-300/60">Cuenta</p>
      <h2 className="mt-2 text-xl font-bold">Guardar tu progreso global</h2>
      <p className="mt-2 text-sm text-white/50">
        Entrá con Google o con magic link. La sesión queda persistida y tus mejores runs aparecen en el ranking global.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <button type="button" onClick={() => void handleGoogleLogin()} disabled={busy !== null} className="rounded-xl bg-white px-4 py-3 font-bold text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50">
          {busy === "google" ? "Conectando..." : "Entrar con Google"}
        </button>

        <form onSubmit={(event) => void handleMagicLink(event)} className="flex flex-col gap-3">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-purple-500 focus:outline-none" required />
          <button type="submit" disabled={busy !== null} className="rounded-xl bg-purple-600 px-4 py-3 font-bold transition-colors hover:bg-purple-500 disabled:opacity-50">
            {busy === "magic" ? "Enviando..." : "Entrar con magic link"}
          </button>
        </form>
      </div>

      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
