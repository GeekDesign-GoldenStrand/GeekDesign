-- CreateTable
CREATE TABLE "SERVICIOMATERIAL" (
    "id_servicio_material" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "id_proveedor_precio" INTEGER,

    CONSTRAINT "SERVICIOMATERIAL_pkey" PRIMARY KEY ("id_servicio_material")
);

-- CreateIndex
CREATE UNIQUE INDEX "SERVICIOMATERIAL_id_servicio_id_material_key" ON "SERVICIOMATERIAL"("id_servicio", "id_material");

-- AddForeignKey
ALTER TABLE "SERVICIOMATERIAL" ADD CONSTRAINT "SERVICIOMATERIAL_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOMATERIAL" ADD CONSTRAINT "SERVICIOMATERIAL_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "MATERIALES"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOMATERIAL" ADD CONSTRAINT "SERVICIOMATERIAL_id_proveedor_precio_fkey" FOREIGN KEY ("id_proveedor_precio") REFERENCES "PROVEEDORPRECIOS"("id_proveedor_precio") ON DELETE SET NULL ON UPDATE CASCADE;
