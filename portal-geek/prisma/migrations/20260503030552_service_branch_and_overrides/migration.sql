/*
  Warnings:

  - You are about to drop the column `id_maquina` on the `FORMULA_CONSTANTES` table. All the data in the column will be lost.
  - You are about to drop the column `costo_por_minuto` on the `MAQUINAS` table. All the data in the column will be lost.
  - Added the required column `id_sucursal` to the `SERVICIOS` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FORMULA_CONSTANTES" DROP CONSTRAINT "FORMULA_CONSTANTES_id_maquina_fkey";

-- AlterTable
ALTER TABLE "FORMULA_CONSTANTES" DROP COLUMN "id_maquina";

-- AlterTable
ALTER TABLE "MAQUINAS" DROP COLUMN "costo_por_minuto";

-- AlterTable
ALTER TABLE "SERVICIOS" ADD COLUMN     "costo_instalador_override" DECIMAL(10,2),
ADD COLUMN     "costo_proveedor_override" DECIMAL(10,2),
ADD COLUMN     "id_sucursal" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SERVICIOS" ADD CONSTRAINT "SERVICIOS_id_sucursal_fkey" FOREIGN KEY ("id_sucursal") REFERENCES "SUCURSALES"("id_sucursal") ON DELETE RESTRICT ON UPDATE CASCADE;
