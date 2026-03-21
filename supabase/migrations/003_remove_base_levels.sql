DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'levels'
      AND column_name = 'is_base'
  ) THEN
    DELETE FROM public.levels
    WHERE is_base = true;

    ALTER TABLE public.levels
      DROP COLUMN is_base;
  END IF;
END $$;
