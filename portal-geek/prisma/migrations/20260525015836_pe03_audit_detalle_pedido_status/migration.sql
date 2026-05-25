-- AlterTable
ALTER TABLE "DETALLEPEDIDO" ADD COLUMN     "fecha_modificacion" TIMESTAMP(3),
ADD COLUMN     "id_usuario_modificacion" INTEGER;

-- AddForeignKey
ALTER TABLE "DETALLEPEDIDO" ADD CONSTRAINT "DETALLEPEDIDO_id_usuario_modificacion_fkey" FOREIGN KEY ("id_usuario_modificacion") REFERENCES "USUARIOS"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
