-- ST-23 schema changes
--
-- D3: dimensions/options now live in VariablesCotizacion (linked by id_detalle).
-- D8: correo_electronico @unique enables atomic upsert when cliente submits a quote.
-- Folio sequence: monotonic counter; service layer formats as "GD-{YYYY}-{N:05}".

-- AlterTable
ALTER TABLE "DETALLEPEDIDO" DROP COLUMN "alto_cm",
DROP COLUMN "ancho_cm",
DROP COLUMN "color",
DROP COLUMN "grosor_cm",
DROP COLUMN "opciones_seleccionadas";

-- CreateIndex
CREATE UNIQUE INDEX "CLIENTES_correo_electronico_key" ON "CLIENTES"("correo_electronico");

-- Folio sequence for cotizaciones (atomic, gap-tolerant). Reset on prisma migrate reset.
CREATE SEQUENCE IF NOT EXISTS folio_seq START WITH 1 INCREMENT BY 1;
