CREATE TABLE IF NOT EXISTS game_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  final_score INTEGER NOT NULL DEFAULT 0,
  levels_completed INTEGER NOT NULL DEFAULT 0,
  last_level_order INTEGER,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_runs_user_id ON game_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_game_runs_score ON game_runs(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_runs_finished_at ON game_runs(finished_at DESC);

ALTER TABLE game_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game runs are viewable by everyone"
  ON game_runs FOR SELECT USING (true);

CREATE POLICY "Users can insert own game runs"
  ON game_runs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game runs"
  ON game_runs FOR UPDATE USING (auth.uid() = user_id);

DROP VIEW IF EXISTS rankings;

CREATE VIEW rankings AS
SELECT
  ROW_NUMBER() OVER (
    ORDER BY best_run.final_score DESC, best_run.levels_completed DESC, best_run.finished_at ASC, p.id
  )::INTEGER AS rank_position,
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  best_run.final_score::INTEGER AS total_score,
  best_run.levels_completed::INTEGER AS levels_completed
FROM profiles p
JOIN LATERAL (
  SELECT
    gr.final_score,
    gr.levels_completed,
    gr.finished_at
  FROM game_runs gr
  WHERE gr.user_id = p.id
  ORDER BY gr.final_score DESC, gr.levels_completed DESC, gr.finished_at ASC
  LIMIT 1
) best_run ON true;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  fallback_name TEXT;
BEGIN
  fallback_name := split_part(COALESCE(NEW.email, ''), '@', 1);

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULLIF(fallback_name, ''),
      'Jugador'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
