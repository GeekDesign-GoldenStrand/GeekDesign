/*
  Warnings:

  - You are about to drop the `INSTALADORSERVICIOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SERVICIOPROVEEDOR` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "INSTALADORSERVICIOS" DROP CONSTRAINT "INSTALADORSERVICIOS_id_instalador_fkey";

-- DropForeignKey
ALTER TABLE "INSTALADORSERVICIOS" DROP CONSTRAINT "INSTALADORSERVICIOS_id_servicio_fkey";

-- DropForeignKey
ALTER TABLE "SERVICIOPROVEEDOR" DROP CONSTRAINT "SERVICIOPROVEEDOR_id_proveedor_fkey";

-- DropForeignKey
ALTER TABLE "SERVICIOPROVEEDOR" DROP CONSTRAINT "SERVICIOPROVEEDOR_id_servicio_fkey";

-- AlterTable
ALTER TABLE "SERVICIOS" ADD COLUMN     "id_instalador" INTEGER,
ADD COLUMN     "id_proveedor" INTEGER;

-- DropTable
DROP TABLE "INSTALADORSERVICIOS";

-- DropTable
DROP TABLE "SERVICIOPROVEEDOR";

-- AddForeignKey
ALTER TABLE "SERVICIOS" ADD CONSTRAINT "SERVICIOS_id_instalador_fkey" FOREIGN KEY ("id_instalador") REFERENCES "INSTALADORES"("id_instalador") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOS" ADD CONSTRAINT "SERVICIOS_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "PROVEEDORES"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;
