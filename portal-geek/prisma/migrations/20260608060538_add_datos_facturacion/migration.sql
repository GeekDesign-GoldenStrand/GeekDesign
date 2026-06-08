-- CreateTable
CREATE TABLE "DATOSFACTURACION" (
    "id_datos_facturacion" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "rfc" VARCHAR(13) NOT NULL,
    "razon_social" VARCHAR(254) NOT NULL,
    "tipo_persona" VARCHAR(10) NOT NULL,
    "regimen_fiscal" VARCHAR(100) NOT NULL,
    "uso_cfdi" VARCHAR(100) NOT NULL,
    "codigo_postal_fiscal" VARCHAR(5) NOT NULL,
    "correo_facturacion" VARCHAR(150),

    CONSTRAINT "DATOSFACTURACION_pkey" PRIMARY KEY ("id_datos_facturacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "DATOSFACTURACION_id_pedido_key" ON "DATOSFACTURACION"("id_pedido");

-- AddForeignKey
ALTER TABLE "DATOSFACTURACION" ADD CONSTRAINT "DATOSFACTURACION_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;
