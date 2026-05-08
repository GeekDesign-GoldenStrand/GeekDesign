/*
  Warnings:

  - You are about to drop the `EstadoFacturaPedido` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PEDIDOS" DROP CONSTRAINT "PEDIDOS_id_estado_factura_fkey";

-- DropTable
DROP TABLE "EstadoFacturaPedido";

-- CreateTable
CREATE TABLE "ESTADOFACTURAPEDIDO" (
    "id_estado_factura" SERIAL NOT NULL,
    "descripcion" VARCHAR(50) NOT NULL,

    CONSTRAINT "ESTADOFACTURAPEDIDO_pkey" PRIMARY KEY ("id_estado_factura")
);

-- CreateIndex
CREATE UNIQUE INDEX "ESTADOFACTURAPEDIDO_descripcion_key" ON "ESTADOFACTURAPEDIDO"("descripcion");

-- AddForeignKey
ALTER TABLE "PEDIDOS" ADD CONSTRAINT "PEDIDOS_id_estado_factura_fkey" FOREIGN KEY ("id_estado_factura") REFERENCES "ESTADOFACTURAPEDIDO"("id_estado_factura") ON DELETE SET NULL ON UPDATE CASCADE;
