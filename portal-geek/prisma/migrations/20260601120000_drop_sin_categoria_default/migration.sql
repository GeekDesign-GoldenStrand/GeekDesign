-- Drop the generated "Sin categoría" default category.
--
-- Earlier migrations (20260527000000 + 20260531180000) seeded a real category
-- row named "Sin categoría" and parked legacy root grupos/individuales under it.
-- That gave "sin categoría" two data meanings: a real parent row AND
-- id_material_padre = NULL (what the create form sends). This collapses the
-- model onto a single source of truth: "sin categoría" === id_material_padre NULL.
--
-- Forward-only fix (the prior migrations are already applied downstream, so they
-- must not be edited). It reparents every child of any "Sin categoría" category
-- back to NULL, then deletes those rows. Idempotent — a no-op when none exist.

-- 1. Detach children of the generated category/categories (back to root/null).
UPDATE "MATERIALES" m
SET "id_material_padre" = NULL
WHERE m."id_material_padre" IN (
    SELECT "id_material"
    FROM "MATERIALES"
    WHERE "es_categoria" = true
      AND "nombre_material" = 'Sin categoría'
);

-- 2. Delete the now-childless generated "Sin categoría" category rows.
DELETE FROM "MATERIALES"
WHERE "es_categoria" = true
  AND "nombre_material" = 'Sin categoría';
