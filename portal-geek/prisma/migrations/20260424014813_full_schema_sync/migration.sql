/*
  Warnings:

  - You are about to drop the column `id_proveedor` on the `GASTOS` table. All the data in the column will be lost.
  - You are about to drop the column `costo_instalacion` on the `INSTALADORES` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_proveedor` on the `INSTALADORES` table. All the data in the column will be lost.
  - You are about to drop the column `servicio` on the `INSTALADORSERVICIOS` table. All the data in the column will be lost.
  - You are about to drop the column `costo` on the `PROVEEDORES` table. All the data in the column will be lost.
  - Added the required column `nombre_instalador` to the `INSTALADORES` table without a default value. This is not possible if the table is not empty.
  - Made the column `telefono` on table `INSTALADORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correo` on table `INSTALADORES` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `id_servicio` to the `INSTALADORSERVICIOS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precio` to the `INSTALADORSERVICIOS` table without a default value. This is not possible if the table is not empty.
  - Made the column `telefono` on table `PROVEEDORES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correo` on table `PROVEEDORES` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GASTOS" DROP CONSTRAINT "GASTOS_id_proveedor_fkey";

-- AlterTable
ALTER TABLE "GASTOS" DROP COLUMN "id_proveedor",
ADD COLUMN     "id_instalador_servicio" INTEGER,
ADD COLUMN     "id_proveedor_precio" INTEGER;

-- AlterTable
ALTER TABLE "INSTALADORES" DROP COLUMN "costo_instalacion",
DROP COLUMN "nombre_proveedor",
ADD COLUMN     "nombre_instalador" VARCHAR(100) NOT NULL,
ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "correo" SET NOT NULL;

-- AlterTable
ALTER TABLE "INSTALADORSERVICIOS" DROP COLUMN "servicio",
ADD COLUMN     "id_servicio" INTEGER NOT NULL,
ADD COLUMN     "notas" VARCHAR(500),
ADD COLUMN     "precio" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "PROVEEDORES" DROP COLUMN "costo",
ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "correo" SET NOT NULL;

-- CreateTable
CREATE TABLE "PROVEEDORPRECIOS" (
    "id_proveedor_precio" SERIAL NOT NULL,
    "id_proveedor" INTEGER NOT NULL,
    "id_servicio" INTEGER,
    "id_material" INTEGER,
    "precio" DECIMAL(10,2) NOT NULL,
    "notas" VARCHAR(500),

    CONSTRAINT "PROVEEDORPRECIOS_pkey" PRIMARY KEY ("id_proveedor_precio")
);

-- AddForeignKey
ALTER TABLE "PROVEEDORPRECIOS" ADD CONSTRAINT "PROVEEDORPRECIOS_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "PROVEEDORES"("id_proveedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROVEEDORPRECIOS" ADD CONSTRAINT "PROVEEDORPRECIOS_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROVEEDORPRECIOS" ADD CONSTRAINT "PROVEEDORPRECIOS_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "MATERIALES"("id_material") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INSTALADORSERVICIOS" ADD CONSTRAINT "INSTALADORSERVICIOS_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GASTOS" ADD CONSTRAINT "GASTOS_id_proveedor_precio_fkey" FOREIGN KEY ("id_proveedor_precio") REFERENCES "PROVEEDORPRECIOS"("id_proveedor_precio") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GASTOS" ADD CONSTRAINT "GASTOS_id_instalador_servicio_fkey" FOREIGN KEY ("id_instalador_servicio") REFERENCES "INSTALADORSERVICIOS"("id_instalador_servicio") ON DELETE SET NULL ON UPDATE CASCADE;
