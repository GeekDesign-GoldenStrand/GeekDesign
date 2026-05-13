/*
  Warnings:

  - A unique constraint covering the columns `[folio]` on the table `COTIZACIONES` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_proveedor,id_servicio]` on the table `PROVEEDORPRECIOS` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_proveedor,id_material]` on the table `PROVEEDORPRECIOS` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "COTIZACIONES" ADD COLUMN     "folio" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "COTIZACIONES_folio_key" ON "COTIZACIONES"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "PROVEEDORPRECIOS_id_proveedor_id_servicio_key" ON "PROVEEDORPRECIOS"("id_proveedor", "id_servicio");

-- CreateIndex
CREATE UNIQUE INDEX "PROVEEDORPRECIOS_id_proveedor_id_material_key" ON "PROVEEDORPRECIOS"("id_proveedor", "id_material");
