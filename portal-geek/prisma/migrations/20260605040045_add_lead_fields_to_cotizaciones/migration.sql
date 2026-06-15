-- AlterTable
ALTER TABLE "COTIZACIONES" ADD COLUMN     "descripcion_solicitud" TEXT,
ADD COLUMN     "fecha_requerida" TIMESTAMP(3),
ADD COLUMN     "id_servicio" INTEGER,
ADD COLUMN     "presupuesto_aprox" DECIMAL(10,2),
ADD COLUMN     "tipo_solicitud" VARCHAR(20);

-- AddForeignKey
ALTER TABLE "COTIZACIONES" ADD CONSTRAINT "COTIZACIONES_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE SET NULL ON UPDATE CASCADE;
