-- AlterTable PEDIDOS
ALTER TABLE "PEDIDOS" ADD COLUMN "nombre_oportunidad" VARCHAR(150);

-- AlterTable COTIZACIONES
ALTER TABLE "COTIZACIONES"
  ADD COLUMN "porcentaje_descuento" DECIMAL(5,2),
  ADD COLUMN "motivo_descuento"     VARCHAR(255),
  ADD COLUMN "nombre_oportunidad"   VARCHAR(150);
