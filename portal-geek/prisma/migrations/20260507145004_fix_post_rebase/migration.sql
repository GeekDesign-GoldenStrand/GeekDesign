/*
  Warnings:

  - You are about to drop the column `nombre_proveedor` on the `INSTALADORES` table. All the data in the column will be lost.
  - Added the required column `nombre_instalador` to the `INSTALADORES` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "INSTALADORES" DROP COLUMN IF EXISTS"nombre_proveedor",
ADD COLUMN  IF NOT EXISTS "nombre_instalador" VARCHAR(100) NOT NULL DEFAULT '';
