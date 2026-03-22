-- Renombra las piezas de tipo 3 a tipo 1 en la grilla de todos los niveles.
-- Esto alinea los niveles existentes con el nuevo esquema de colores donde
-- el bloque verde (anteriormente tipo 3) pasa a ser el tipo 1.
UPDATE levels
SET grid = (
  SELECT jsonb_agg(
    (
      SELECT jsonb_agg(
        CASE WHEN cell::text::int = 3 THEN 1 ELSE cell::text::int END
      )
      FROM jsonb_array_elements(row_element) AS cell
    )
  )
  FROM jsonb_array_elements(grid) AS row_element
)
WHERE grid IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(grid) AS row_element,
         jsonb_array_elements(row_element) AS cell
    WHERE cell::text::int = 3
  );
