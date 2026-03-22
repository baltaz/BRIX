import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import App from "./App";
import "./index.css";

// StrictMode removido intencionalmente: el doble-mount en desarrollo causa
// que el lock de auth de Supabase sea robado entre renders concurrentes,
// abortando las queries de niveles y rankings con AbortError.
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
