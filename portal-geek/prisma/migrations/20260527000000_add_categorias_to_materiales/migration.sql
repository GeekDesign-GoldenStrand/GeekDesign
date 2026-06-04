-- 1. Nueva columna que marca filas-categoría.
ALTER TABLE "MATERIALES"
ADD COLUMN "es_categoria" BOOLEAN NOT NULL DEFAULT false;

-- 2. Sembrar una categoría "Sin categoría" para absorber los datos existentes.
INSERT INTO "MATERIALES" (
    "id_material_padre",
    "es_grupo",
    "es_categoria",
    "nombre_material",
    "descripcion_material",
    "unidad_medida",
    "ancho",
    "alto",
    "grosor",
    "color",
    "imagen_url"
)
VALUES (
    NULL,
    false,
    true,
    'Sin categoría',
    'Categoría por defecto generada durante la migración. Reasigna los materiales a su categoría real.',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);

-- 3. Reasignar todos los grupos e individuales sin padre a la nueva categoría.
--    Las variantes (filas con id_material_padre != NULL apuntando a un grupo) no se tocan.
WITH sin_categoria AS (
    SELECT "id_material"
    FROM "MATERIALES"
    WHERE "es_categoria" = true
      AND "nombre_material" = 'Sin categoría'
    ORDER BY "id_material" DESC
    LIMIT 1
)
UPDATE "MATERIALES" m
SET "id_material_padre" = (SELECT "id_material" FROM sin_categoria)
WHERE m."id_material_padre" IS NULL
  AND m."es_categoria" = false;
