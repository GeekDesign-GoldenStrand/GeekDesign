-- AlterTable
ALTER TABLE "PEDIDOS" ADD COLUMN     "id_estado_factura" INTEGER;

-- CreateTable
CREATE TABLE "EstadoFacturaPedido" (
    "id_estado_factura" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "EstadoFacturaPedido_pkey" PRIMARY KEY ("id_estado_factura")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstadoFacturaPedido_descripcion_key" ON "EstadoFacturaPedido"("descripcion");

-- AddForeignKey
ALTER TABLE "PEDIDOS" ADD CONSTRAINT "PEDIDOS_id_estado_factura_fkey" FOREIGN KEY ("id_estado_factura") REFERENCES "EstadoFacturaPedido"("id_estado_factura") ON DELETE SET NULL ON UPDATE CASCADE;
