-- Deduplicate the "Sin categoría" seed category.
--
-- The 20260527000000_add_categorias_to_materiales seed INSERT had no
-- WHERE NOT EXISTS guard, so a replayed/retried run could leave several
-- "Sin categoría" rows. Its reparenting CTE (ORDER BY id_material DESC LIMIT 1)
-- papered over that by pinning children to the latest one, leaving the rest as
-- childless orphan duplicates.
--
-- This migration collapses them onto a single canonical row (the lowest id):
-- it reparents any children of the duplicates onto the canonical row, then
-- deletes the duplicates. It is idempotent — a no-op when 0 or 1 "Sin categoría"
-- rows exist.

-- 1. Reparent children of duplicate "Sin categoría" rows onto the canonical one.
UPDATE "MATERIALES" m
SET "id_material_padre" = (
    SELECT MIN("id_material")
    FROM "MATERIALES"
    WHERE "es_categoria" = true
      AND "nombre_material" = 'Sin categoría'
)
WHERE m."id_material_padre" IN (
    SELECT "id_material"
    FROM "MATERIALES"
    WHERE "es_categoria" = true
      AND "nombre_material" = 'Sin categoría'
      AND "id_material" <> (
          SELECT MIN("id_material")
          FROM "MATERIALES"
          WHERE "es_categoria" = true
            AND "nombre_material" = 'Sin categoría'
      )
);

-- 2. Delete the now-childless duplicate "Sin categoría" rows.
DELETE FROM "MATERIALES"
WHERE "es_categoria" = true
  AND "nombre_material" = 'Sin categoría'
  AND "id_material" <> (
      SELECT MIN("id_material")
      FROM "MATERIALES"
      WHERE "es_categoria" = true
        AND "nombre_material" = 'Sin categoría'
  );
