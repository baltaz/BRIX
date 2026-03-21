ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

UPDATE public.levels
SET slug = CONCAT(
  'custom-',
  LPAD("order"::TEXT, 3, '0'),
  '-',
  SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 8)
)
WHERE slug IS NULL;

ALTER TABLE public.levels
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_levels_slug ON public.levels(slug);
CREATE INDEX IF NOT EXISTS idx_levels_published_archived_order
  ON public.levels(is_published, is_archived, "order");
