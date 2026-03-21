-- Eliminar tabla scores (no se usa, el ranking utiliza game_runs)
DROP TABLE IF EXISTS scores;

-- Eliminar columnas innecesarias de levels
ALTER TABLE levels DROP COLUMN IF EXISTS slug;
ALTER TABLE levels DROP COLUMN IF EXISTS is_archived;

-- Eliminar indices obsoletos
DROP INDEX IF EXISTS idx_levels_slug;
DROP INDEX IF EXISTS idx_levels_published_archived_order;

-- Eliminar policies que referencian is_archived
DROP POLICY IF EXISTS "Published levels are viewable by everyone" ON levels;

-- Recrear policy simplificada
CREATE POLICY "Published levels are viewable by everyone"
  ON levels FOR SELECT
  USING (is_published = true);
