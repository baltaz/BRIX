-- Permitir que game_runs acepte runs de guests (sin cuenta de usuario)

-- 1. Hacer user_id nullable (guests no tienen cuenta)
ALTER TABLE game_runs ALTER COLUMN user_id DROP NOT NULL;

-- 2. Agregar columna para el nombre del guest
ALTER TABLE game_runs ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- 3. Actualizar política de INSERT: permitir inserts anónimos (guests) y autenticados
DROP POLICY IF EXISTS "Users can insert own game runs" ON game_runs;

CREATE POLICY "Anyone can insert game runs"
  ON game_runs FOR INSERT
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

-- 4. Actualizar la vista de rankings para incluir guests
DROP VIEW IF EXISTS rankings;

-- Nota: DISTINCT ON con ORDER BY dentro de un UNION ALL requiere subquery
-- para cumplir con la restricción de PostgreSQL sobre ORDER BY en miembros de UNION
CREATE VIEW rankings AS
WITH all_entries AS (
  SELECT * FROM (
    -- Usuarios autenticados: solo su mejor run (DISTINCT ON necesita subquery aquí)
    SELECT DISTINCT ON (gr.user_id)
      gr.user_id,
      COALESCE(p.display_name, 'Jugador') AS display_name,
      p.avatar_url,
      gr.final_score,
      gr.levels_completed,
      gr.finished_at
    FROM game_runs gr
    JOIN profiles p ON p.id = gr.user_id
    WHERE gr.user_id IS NOT NULL
    ORDER BY gr.user_id, gr.final_score DESC, gr.levels_completed DESC, gr.finished_at ASC
  ) auth_runs

  UNION ALL

  -- Guests: cada run por separado (no hay cuenta que agrupar)
  SELECT
    NULL            AS user_id,
    COALESCE(gr.guest_name, 'Anónimo') AS display_name,
    NULL            AS avatar_url,
    gr.final_score,
    gr.levels_completed,
    gr.finished_at
  FROM game_runs gr
  WHERE gr.user_id IS NULL
    AND gr.final_score > 0
)
SELECT
  ROW_NUMBER() OVER (
    ORDER BY final_score DESC, levels_completed DESC, finished_at ASC
  )::INTEGER AS rank_position,
  user_id,
  display_name,
  avatar_url,
  final_score::INTEGER  AS total_score,
  levels_completed::INTEGER AS levels_completed
FROM all_entries;
