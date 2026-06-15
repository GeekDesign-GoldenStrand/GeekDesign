/*
  Warnings:

  - Added the required column `apodo_servicio` to the `SERVICIOS` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SERVICIOS" ADD COLUMN "apodo_servicio" VARCHAR(100);

UPDATE "SERVICIOS"
SET "apodo_servicio" = LEFT("nombre_servicio", 100)
WHERE "apodo_servicio" IS NULL;

ALTER TABLE "SERVICIOS" ALTER COLUMN "apodo_servicio" SET NOT NULL;
