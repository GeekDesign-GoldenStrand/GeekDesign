/*
  Warnings:

  - Made the column `telefono` on table `INSTALADORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correo` on table `INSTALADORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefono` on table `PROVEEDORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correo` on table `PROVEEDORES` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values
UPDATE "INSTALADORES" SET "telefono" = '0000000000' WHERE "telefono" IS NULL;
UPDATE "INSTALADORES" SET "correo" = 'sin_correo@geekdesign.com' WHERE "correo" IS NULL;
UPDATE "PROVEEDORES" SET "telefono" = '0000000000' WHERE "telefono" IS NULL;
UPDATE "PROVEEDORES" SET "correo" = 'sin_correo@geekdesign.com' WHERE "correo" IS NULL;

-- AlterTable
ALTER TABLE "INSTALADORES" ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "correo" SET NOT NULL;

-- AlterTable
ALTER TABLE "PROVEEDORES" ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "correo" SET NOT NULL;
