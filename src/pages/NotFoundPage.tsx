import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-black">Pantalla no encontrada</h1>
      <p className="text-white/50">La ruta que intentaste abrir no existe.</p>
      <Link
        to="/"
        className="rounded-xl bg-purple-600 px-5 py-3 font-bold transition-colors hover:bg-purple-500"
      >
        Volver al menú
      </Link>
    </main>
  );
}
