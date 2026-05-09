/*
  Warnings:

  - Made the column `telefono` on table `INSTALADORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correo` on table `INSTALADORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefono` on table `PROVEEDORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correo` on table `PROVEEDORES` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values
-- Validate existing data before enforcing NOT NULL to avoid contaminating records with dummy placeholders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "INSTALADORES" WHERE "telefono" IS NULL) THEN
    RAISE EXCEPTION 'Migration aborted: INSTALADORES.telefono contains NULL values. Backfill with real data before applying NOT NULL.';
  END IF;
  IF EXISTS (SELECT 1 FROM "INSTALADORES" WHERE "correo" IS NULL) THEN
    RAISE EXCEPTION 'Migration aborted: INSTALADORES.correo contains NULL values. Backfill with real data before applying NOT NULL.';
  END IF;
  IF EXISTS (SELECT 1 FROM "PROVEEDORES" WHERE "telefono" IS NULL) THEN
    RAISE EXCEPTION 'Migration aborted: PROVEEDORES.telefono contains NULL values. Backfill with real data before applying NOT NULL.';
  END IF;
  IF EXISTS (SELECT 1 FROM "PROVEEDORES" WHERE "correo" IS NULL) THEN
    RAISE EXCEPTION 'Migration aborted: PROVEEDORES.correo contains NULL values. Backfill with real data before applying NOT NULL.';
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "INSTALADORES" ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "correo" SET NOT NULL;

-- AlterTable
ALTER TABLE "PROVEEDORES" ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "correo" SET NOT NULL;
