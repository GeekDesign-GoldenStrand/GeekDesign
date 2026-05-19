/*
  Warnings:

  - The primary key for the `FORMULA_VARIABLES` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `descripcion` on the `FORMULA_VARIABLES` table. All the data in the column will be lost.
  - You are about to drop the column `es_constante` on the `FORMULA_VARIABLES` table. All the data in the column will be lost.
  - You are about to drop the column `id_servicio` on the `FORMULA_VARIABLES` table. All the data in the column will be lost.
  - You are about to drop the column `valor_constante` on the `FORMULA_VARIABLES` table. All the data in the column will be lost.
  - You are about to alter the column `unidad` on the `FORMULA_VARIABLES` table. The data in that column could be lost. The data in that column will be cast from `VarChar(30)` to `VarChar(20)`.
  - You are about to drop the column `servicio` on the `INSTALADORSERVICIOS` table. All the data in the column will be lost.
  - You are about to alter the column `costo` on the `PROVEEDORES` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `id_formula` on the `VARIABLES_COTIZACION` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_formula,nombre_variable]` on the table `FORMULA_VARIABLES` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_instalador,id_servicio]` on the table `INSTALADORSERVICIOS` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `estatus` to the `FORMULA_VARIABLES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `etiqueta` to the `FORMULA_VARIABLES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipo_variable` to the `FORMULA_VARIABLES` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `costo_instalacion` on the `INSTALADORES` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `id_servicio` to the `INSTALADORSERVICIOS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_variable` to the `VARIABLES_COTIZACION` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FORMULA_VARIABLES" DROP CONSTRAINT "FORMULA_VARIABLES_id_servicio_fkey";

-- DropForeignKey
ALTER TABLE "VARIABLES_COTIZACION" DROP CONSTRAINT "VARIABLES_COTIZACION_id_formula_fkey";

-- AlterTable
ALTER TABLE "FORMULA_VARIABLES" DROP CONSTRAINT "FORMULA_VARIABLES_pkey",
DROP COLUMN "descripcion",
DROP COLUMN "es_constante",
DROP COLUMN "id_servicio",
DROP COLUMN "valor_constante",
ADD COLUMN     "editable_por_cliente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estatus" VARCHAR(20) NOT NULL,
ADD COLUMN     "etiqueta" VARCHAR(100) NOT NULL,
ADD COLUMN     "id_tipo_variable" INTEGER NOT NULL,
ADD COLUMN     "id_variable" SERIAL NOT NULL,
ADD COLUMN     "valor_default" DECIMAL(10,4),
ALTER COLUMN "id_formula" DROP DEFAULT,
ALTER COLUMN "unidad" SET DATA TYPE VARCHAR(20),
ADD CONSTRAINT "FORMULA_VARIABLES_pkey" PRIMARY KEY ("id_variable");
DROP SEQUENCE "FORMULA_VARIABLES_id_formula_seq";

-- AlterTable
ALTER TABLE "INSTALADORES" DROP COLUMN "costo_instalacion",
ADD COLUMN     "costo_instalacion" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "INSTALADORSERVICIOS" DROP COLUMN "servicio",
ADD COLUMN     "id_servicio" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MAQUINAS" ADD COLUMN     "costo_por_minuto" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "PROVEEDORES" ALTER COLUMN "costo" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "VARIABLES_COTIZACION" DROP COLUMN "id_formula",
ADD COLUMN     "id_variable" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "SERVICIOMAQUINA" (
    "id_servicio_maquina" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "id_maquina" INTEGER NOT NULL,

    CONSTRAINT "SERVICIOMAQUINA_pkey" PRIMARY KEY ("id_servicio_maquina")
);

-- CreateTable
CREATE TABLE "SERVICIOPROVEEDOR" (
    "id_servicio_proveedor" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "id_proveedor" INTEGER NOT NULL,

    CONSTRAINT "SERVICIOPROVEEDOR_pkey" PRIMARY KEY ("id_servicio_proveedor")
);

-- CreateTable
CREATE TABLE "FORMULAS" (
    "id_formula" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "expresion" VARCHAR(500) NOT NULL,
    "estatus" VARCHAR(20) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMP(3) NOT NULL,
    "id_usuario_creo" INTEGER NOT NULL,

    CONSTRAINT "FORMULAS_pkey" PRIMARY KEY ("id_formula")
);

-- CreateTable
CREATE TABLE "TIPOSVARIABLE" (
    "id_tipo_variable" SERIAL NOT NULL,
    "nombre_tipo" VARCHAR(50) NOT NULL,
    "unidad_default" VARCHAR(20),
    "descripcion" TEXT,
    "estatus" VARCHAR(20) NOT NULL,

    CONSTRAINT "TIPOSVARIABLE_pkey" PRIMARY KEY ("id_tipo_variable")
);

-- CreateTable
CREATE TABLE "FORMULA_CONSTANTES" (
    "id_constante" SERIAL NOT NULL,
    "id_formula" INTEGER NOT NULL,
    "nombre_constante" VARCHAR(100) NOT NULL,
    "origen" VARCHAR(20) NOT NULL,
    "id_maquina" INTEGER,
    "id_instalador" INTEGER,
    "id_proveedor" INTEGER,
    "estatus" VARCHAR(20) NOT NULL,

    CONSTRAINT "FORMULA_CONSTANTES_pkey" PRIMARY KEY ("id_constante")
);

-- CreateIndex
CREATE UNIQUE INDEX "SERVICIOMAQUINA_id_servicio_id_maquina_key" ON "SERVICIOMAQUINA"("id_servicio", "id_maquina");

-- CreateIndex
CREATE UNIQUE INDEX "SERVICIOPROVEEDOR_id_servicio_id_proveedor_key" ON "SERVICIOPROVEEDOR"("id_servicio", "id_proveedor");

-- CreateIndex
CREATE UNIQUE INDEX "TIPOSVARIABLE_nombre_tipo_key" ON "TIPOSVARIABLE"("nombre_tipo");

-- CreateIndex
CREATE UNIQUE INDEX "FORMULA_CONSTANTES_id_formula_nombre_constante_key" ON "FORMULA_CONSTANTES"("id_formula", "nombre_constante");

-- CreateIndex
CREATE UNIQUE INDEX "FORMULA_VARIABLES_id_formula_nombre_variable_key" ON "FORMULA_VARIABLES"("id_formula", "nombre_variable");

-- CreateIndex
CREATE UNIQUE INDEX "INSTALADORSERVICIOS_id_instalador_id_servicio_key" ON "INSTALADORSERVICIOS"("id_instalador", "id_servicio");

-- AddForeignKey
ALTER TABLE "INSTALADORSERVICIOS" ADD CONSTRAINT "INSTALADORSERVICIOS_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOMAQUINA" ADD CONSTRAINT "SERVICIOMAQUINA_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOMAQUINA" ADD CONSTRAINT "SERVICIOMAQUINA_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "MAQUINAS"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOPROVEEDOR" ADD CONSTRAINT "SERVICIOPROVEEDOR_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOPROVEEDOR" ADD CONSTRAINT "SERVICIOPROVEEDOR_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "PROVEEDORES"("id_proveedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULAS" ADD CONSTRAINT "FORMULAS_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULAS" ADD CONSTRAINT "FORMULAS_id_usuario_creo_fkey" FOREIGN KEY ("id_usuario_creo") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_VARIABLES" ADD CONSTRAINT "FORMULA_VARIABLES_id_formula_fkey" FOREIGN KEY ("id_formula") REFERENCES "FORMULAS"("id_formula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_VARIABLES" ADD CONSTRAINT "FORMULA_VARIABLES_id_tipo_variable_fkey" FOREIGN KEY ("id_tipo_variable") REFERENCES "TIPOSVARIABLE"("id_tipo_variable") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_CONSTANTES" ADD CONSTRAINT "FORMULA_CONSTANTES_id_formula_fkey" FOREIGN KEY ("id_formula") REFERENCES "FORMULAS"("id_formula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_CONSTANTES" ADD CONSTRAINT "FORMULA_CONSTANTES_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "MAQUINAS"("id_maquina") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_CONSTANTES" ADD CONSTRAINT "FORMULA_CONSTANTES_id_instalador_fkey" FOREIGN KEY ("id_instalador") REFERENCES "INSTALADORES"("id_instalador") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_CONSTANTES" ADD CONSTRAINT "FORMULA_CONSTANTES_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "PROVEEDORES"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VARIABLES_COTIZACION" ADD CONSTRAINT "VARIABLES_COTIZACION_id_variable_fkey" FOREIGN KEY ("id_variable") REFERENCES "FORMULA_VARIABLES"("id_variable") ON DELETE RESTRICT ON UPDATE CASCADE;
