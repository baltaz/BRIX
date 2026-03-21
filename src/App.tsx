import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LevelsPage from "./pages/LevelsPage";
import GamePage from "./pages/GamePage";
import RankingPage from "./pages/RankingPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/levels" element={<LevelsPage />} />
      <Route path="/game/:levelId" element={<GamePage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
