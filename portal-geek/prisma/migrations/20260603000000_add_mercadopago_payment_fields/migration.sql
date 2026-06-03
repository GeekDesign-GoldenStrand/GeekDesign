-- ST-17 (Mercado Pago): anticipo fijado por Dirección + idempotencia del webhook.

-- AlterTable: anticipo fijo por pedido (NULL = aún sin definir).
ALTER TABLE "PEDIDOS" ADD COLUMN "monto_anticipo" DECIMAL(10,2);

-- CreateIndex: la referencia de Mercado Pago (payment id) debe ser única para
-- garantizar la idempotencia del webhook (D6). Las filas existentes son NULL,
-- por lo que el índice único parcial de Postgres lo permite sin conflicto.
CREATE UNIQUE INDEX "PAGOS_referencia_mercadopago_key" ON "PAGOS"("referencia_mercadopago");
