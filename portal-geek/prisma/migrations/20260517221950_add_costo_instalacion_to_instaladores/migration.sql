/*
  Warnings:

  - You are about to alter the column `descripcion` on the `MAQUINAS` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - A unique constraint covering the columns `[id_maquina]` on the table `SUCURSALESMAQUINA` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `costo_instalacion` to the `INSTALADORES` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HISTORIALESTADOSCOTIZACION" DROP CONSTRAINT "HISTORIALESTADOSCOTIZACION_id_usuario_fkey";

-- AlterTable
ALTER TABLE "FORMULA_CONSTANTES" ADD COLUMN     "valor" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "HISTORIALESTADOSCOTIZACION" ADD COLUMN     "actor_tipo" TEXT NOT NULL DEFAULT 'Direccion',
ADD COLUMN     "id_cliente" INTEGER,
ALTER COLUMN "id_usuario" DROP NOT NULL;

-- AlterTable
ALTER TABLE "INSTALADORES" ADD COLUMN     "costo_instalacion" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL,
ALTER COLUMN "correo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MAQUINAS" ALTER COLUMN "descripcion" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "PROVEEDORES" ADD COLUMN     "costo" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "SERVICIOSMAQUINA" (
    "id_servicio_maquina" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "id_maquina" INTEGER NOT NULL,

    CONSTRAINT "SERVICIOSMAQUINA_pkey" PRIMARY KEY ("id_servicio_maquina")
);

-- CreateTable
CREATE TABLE "INSTALADORSERVICIOS" (
    "id_instalador_servicio" SERIAL NOT NULL,
    "id_instalador" INTEGER NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,
    "notas" VARCHAR(500),

    CONSTRAINT "INSTALADORSERVICIOS_pkey" PRIMARY KEY ("id_instalador_servicio")
);

-- CreateIndex
CREATE UNIQUE INDEX "SERVICIOSMAQUINA_id_servicio_id_maquina_key" ON "SERVICIOSMAQUINA"("id_servicio", "id_maquina");

-- CreateIndex
CREATE UNIQUE INDEX "INSTALADORSERVICIOS_id_instalador_id_servicio_key" ON "INSTALADORSERVICIOS"("id_instalador", "id_servicio");

-- CreateIndex
CREATE UNIQUE INDEX "SUCURSALESMAQUINA_id_maquina_key" ON "SUCURSALESMAQUINA"("id_maquina");

-- AddForeignKey
ALTER TABLE "SERVICIOSMAQUINA" ADD CONSTRAINT "SERVICIOSMAQUINA_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOSMAQUINA" ADD CONSTRAINT "SERVICIOSMAQUINA_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "MAQUINAS"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INSTALADORSERVICIOS" ADD CONSTRAINT "INSTALADORSERVICIOS_id_instalador_fkey" FOREIGN KEY ("id_instalador") REFERENCES "INSTALADORES"("id_instalador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INSTALADORSERVICIOS" ADD CONSTRAINT "INSTALADORSERVICIOS_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORIALESTADOSCOTIZACION" ADD CONSTRAINT "HISTORIALESTADOSCOTIZACION_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORIALESTADOSCOTIZACION" ADD CONSTRAINT "HISTORIALESTADOSCOTIZACION_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "CLIENTES"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GASTOS" ADD CONSTRAINT "GASTOS_id_instalador_servicio_fkey" FOREIGN KEY ("id_instalador_servicio") REFERENCES "INSTALADORSERVICIOS"("id_instalador_servicio") ON DELETE SET NULL ON UPDATE CASCADE;
