-- AlterTable
ALTER TABLE "COTIZACIONES" ADD COLUMN     "motivo_descuento" VARCHAR(255),
ADD COLUMN     "nombre_oportunidad" VARCHAR(150),
ADD COLUMN     "porcentaje_descuento" DECIMAL(4,2);

-- AlterTable
ALTER TABLE "PEDIDOS" ADD COLUMN     "nombre_oportunidad" VARCHAR(150);
