/*
  Warnings:

  - Added the required column `fecha_modificacion` to the `SERVICIOS` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SERVICIOS" ADD COLUMN     "fecha_modificacion" TIMESTAMP(3) NOT NULL;
