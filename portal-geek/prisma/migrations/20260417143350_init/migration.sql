-- CreateTable
CREATE TABLE "ROLES" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,

    CONSTRAINT "ROLES_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "USUARIOS" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "correo_electronico" VARCHAR(150) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "estatus" VARCHAR(20) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USUARIOS_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "COLABORADORES" (
    "id_colaborador" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_sucursal" INTEGER NOT NULL,
    "edad" INTEGER NOT NULL,
    "sexo" VARCHAR(2) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "estatus_colaborador" VARCHAR(20) NOT NULL,
    "fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "COLABORADORES_pkey" PRIMARY KEY ("id_colaborador")
);

-- CreateTable
CREATE TABLE "ASISTENCIACOLABORADOR" (
    "id_asistencia" SERIAL NOT NULL,
    "id_colaborador" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_entrada" TIMESTAMP(3),
    "hora_salida" TIMESTAMP(3),

    CONSTRAINT "ASISTENCIACOLABORADOR_pkey" PRIMARY KEY ("id_asistencia")
);

-- CreateTable
CREATE TABLE "CLIENTES" (
    "id_cliente" SERIAL NOT NULL,
    "nombre_cliente" VARCHAR(100) NOT NULL,
    "empresa" VARCHAR(100),
    "rfc" VARCHAR(13),
    "correo_electronico" VARCHAR(150) NOT NULL,
    "numero_telefono" VARCHAR(20) NOT NULL,
    "categoria" VARCHAR(30),

    CONSTRAINT "CLIENTES_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "NOTASCLIENTE" (
    "id_nota" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,
    "url_archivo" VARCHAR(500),
    "nombre_archivo" VARCHAR(255),

    CONSTRAINT "NOTASCLIENTE_pkey" PRIMARY KEY ("id_nota")
);

-- CreateTable
CREATE TABLE "ESTATUSSERVICIO" (
    "id_estatus_servicio" SERIAL NOT NULL,
    "descripcion" VARCHAR(50) NOT NULL,

    CONSTRAINT "ESTATUSSERVICIO_pkey" PRIMARY KEY ("id_estatus_servicio")
);

-- CreateTable
CREATE TABLE "SERVICIOS" (
    "id_servicio" SERIAL NOT NULL,
    "id_estatus" INTEGER NOT NULL,
    "nombre_servicio" VARCHAR(100) NOT NULL,
    "descripcion_servicio" TEXT,
    "estatus_servicio" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SERVICIOS_pkey" PRIMARY KEY ("id_servicio")
);

-- CreateTable
CREATE TABLE "MATERIALES" (
    "id_material" SERIAL NOT NULL,
    "nombre_material" VARCHAR(100) NOT NULL,
    "descripcion_material" TEXT,
    "unidad_medida" VARCHAR(30) NOT NULL,
    "ancho" DECIMAL(10,2),
    "alto" DECIMAL(10,2),
    "grosor" DECIMAL(10,2),
    "color" VARCHAR(50),
    "imagen_url" VARCHAR(500),

    CONSTRAINT "MATERIALES_pkey" PRIMARY KEY ("id_material")
);

-- CreateTable
CREATE TABLE "OPCIONESPRODUCTO" (
    "id_opcion" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "nombre_opcion" VARCHAR(100) NOT NULL,
    "afecta_precio" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OPCIONESPRODUCTO_pkey" PRIMARY KEY ("id_opcion")
);

-- CreateTable
CREATE TABLE "VALORES_OPCION" (
    "id_valor" SERIAL NOT NULL,
    "id_opcion" INTEGER NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "es_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VALORES_OPCION_pkey" PRIMARY KEY ("id_valor")
);

-- CreateTable
CREATE TABLE "MATRIZDEPRECIOS" (
    "id_precio" SERIAL NOT NULL,
    "id_opcion" INTEGER NOT NULL,
    "id_valor" INTEGER NOT NULL,
    "cantidad_minima" INTEGER NOT NULL,
    "cantidad_maxima" INTEGER,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "tiene_mayoreo" BOOLEAN NOT NULL DEFAULT false,
    "cantidad_mayoreo" INTEGER,
    "descuento_mayoreo" DECIMAL(5,2),
    "id_usuario_modifico" INTEGER NOT NULL,
    "fecha_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MATRIZDEPRECIOS_pkey" PRIMARY KEY ("id_precio")
);

-- CreateTable
CREATE TABLE "SUCURSALES" (
    "id_sucursal" SERIAL NOT NULL,
    "nombre_sucursal" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "horario_apertura" TIMESTAMP(3),
    "horario_salida" TIMESTAMP(3),
    "estatus" VARCHAR(20) NOT NULL,

    CONSTRAINT "SUCURSALES_pkey" PRIMARY KEY ("id_sucursal")
);

-- CreateTable
CREATE TABLE "MAQUINAS" (
    "id_maquina" SERIAL NOT NULL,
    "nombre_maquina" VARCHAR(100) NOT NULL,
    "apodo_maquina" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "estatus" VARCHAR(30) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MAQUINAS_pkey" PRIMARY KEY ("id_maquina")
);

-- CreateTable
CREATE TABLE "SUCURSALESMAQUINA" (
    "id_sucursal_maquina" SERIAL NOT NULL,
    "id_maquina" INTEGER NOT NULL,
    "id_sucursal" INTEGER NOT NULL,

    CONSTRAINT "SUCURSALESMAQUINA_pkey" PRIMARY KEY ("id_sucursal_maquina")
);

-- CreateTable
CREATE TABLE "PROVEEDORES" (
    "id_proveedor" SERIAL NOT NULL,
    "nombre_proveedor" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(150),
    "descripcion_proveedor" TEXT,
    "costo" DOUBLE PRECISION,
    "ubicacion" VARCHAR(255),
    "estatus" VARCHAR(20) NOT NULL,

    CONSTRAINT "PROVEEDORES_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateTable
CREATE TABLE "INSTALADORES" (
    "id_instalador" SERIAL NOT NULL,
    "nombre_proveedor" VARCHAR(100) NOT NULL,
    "apodo" VARCHAR(100),
    "tipo" VARCHAR(50) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(150),
    "costo_instalacion" VARCHAR(100) NOT NULL,
    "notas" VARCHAR(500),
    "ubicacion" VARCHAR(255),
    "estatus" VARCHAR(20) NOT NULL,

    CONSTRAINT "INSTALADORES_pkey" PRIMARY KEY ("id_instalador")
);

-- CreateTable
CREATE TABLE "INSTALADORSERVICIOS" (
    "id_instalador_servicio" SERIAL NOT NULL,
    "id_instalador" INTEGER NOT NULL,
    "servicio" VARCHAR(100) NOT NULL,

    CONSTRAINT "INSTALADORSERVICIOS_pkey" PRIMARY KEY ("id_instalador_servicio")
);

-- CreateTable
CREATE TABLE "ESTATUSPEDIDOS" (
    "id_estatus" SERIAL NOT NULL,
    "descripcion" VARCHAR(50) NOT NULL,

    CONSTRAINT "ESTATUSPEDIDOS_pkey" PRIMARY KEY ("id_estatus")
);

-- CreateTable
CREATE TABLE "PEDIDOS" (
    "id_pedido" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_estatus" INTEGER NOT NULL,
    "id_sucursal" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "fecha_estimada" TIMESTAMP(3),
    "factura" BOOLEAN NOT NULL DEFAULT false,
    "facturado" BOOLEAN NOT NULL DEFAULT false,
    "numero_factura" VARCHAR(100),
    "notas" TEXT,

    CONSTRAINT "PEDIDOS_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "ARCHIVOSDISENIO" (
    "id_archivo" SERIAL NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "url_archivo" VARCHAR(500) NOT NULL,
    "formato" VARCHAR(20) NOT NULL,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ARCHIVOSDISENIO_pkey" PRIMARY KEY ("id_archivo")
);

-- CreateTable
CREATE TABLE "DETALLEPEDIDO" (
    "id_detalle" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "id_archivo" INTEGER NOT NULL,
    "opciones_seleccionadas" JSONB NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "ancho_cm" DECIMAL(10,2),
    "alto_cm" DECIMAL(10,2),
    "grosor_cm" DECIMAL(10,2),
    "color" VARCHAR(50),
    "responsable_recoleccion" VARCHAR(100) NOT NULL,
    "notas" TEXT,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DETALLEPEDIDO_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "PEDIDOMAQUINA" (
    "id_pedido_maquina" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_maquina" INTEGER NOT NULL,
    "id_material" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_asigno" INTEGER NOT NULL,

    CONSTRAINT "PEDIDOMAQUINA_pkey" PRIMARY KEY ("id_pedido_maquina")
);

-- CreateTable
CREATE TABLE "HISTORIALESTADOSPEDIDOS" (
    "id_historial" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_estado_anterior" INTEGER,
    "id_estado_nuevo" INTEGER NOT NULL,
    "id_estatus_pedido" TEXT,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HISTORIALESTADOSPEDIDOS_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "ESTATUSCOTIZACION" (
    "id_estatus" SERIAL NOT NULL,
    "descripcion" VARCHAR(50) NOT NULL,

    CONSTRAINT "ESTATUSCOTIZACION_pkey" PRIMARY KEY ("id_estatus")
);

-- CreateTable
CREATE TABLE "COTIZACIONES" (
    "id_cotizacion" SERIAL NOT NULL,
    "id_pedido" INTEGER,
    "id_cliente" INTEGER NOT NULL,
    "id_estatus_cotizacion" INTEGER NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "empresa_cliente" VARCHAR(100),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "fecha_validacion" TIMESTAMP(3),
    "fecha_aprobacion" TIMESTAMP(3),
    "pdf_url" VARCHAR(500),
    "notas" TEXT,

    CONSTRAINT "COTIZACIONES_pkey" PRIMARY KEY ("id_cotizacion")
);

-- CreateTable
CREATE TABLE "HISTORIALESTADOSCOTIZACION" (
    "id_historial" SERIAL NOT NULL,
    "id_cotizacion" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_estado_anterior" INTEGER,
    "id_estado_nuevo" INTEGER NOT NULL,
    "id_estatus_servicio" TEXT,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HISTORIALESTADOSCOTIZACION_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "FORMULA_VARIABLES" (
    "id_formula" SERIAL NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "nombre_variable" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "unidad" VARCHAR(30),
    "es_constante" BOOLEAN NOT NULL DEFAULT false,
    "valor_constante" DECIMAL(10,4),

    CONSTRAINT "FORMULA_VARIABLES_pkey" PRIMARY KEY ("id_formula")
);

-- CreateTable
CREATE TABLE "VARIABLES_COTIZACION" (
    "id_valor" SERIAL NOT NULL,
    "id_cotizacion" INTEGER NOT NULL,
    "id_detalle" INTEGER,
    "id_formula" INTEGER NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "id_usuario_asigno" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VARIABLES_COTIZACION_pkey" PRIMARY KEY ("id_valor")
);

-- CreateTable
CREATE TABLE "PAGOS" (
    "id_pago" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_pago" DECIMAL(10,2) NOT NULL,
    "metodo_pago" VARCHAR(30) NOT NULL,
    "referencia_mercadopago" VARCHAR(255),
    "estatus_pago" VARCHAR(20) NOT NULL,

    CONSTRAINT "PAGOS_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "GASTOS" (
    "id_costo" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "tipo_costo" INTEGER NOT NULL,
    "id_proveedor" INTEGER,
    "monto" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GASTOS_pkey" PRIMARY KEY ("id_costo")
);

-- CreateIndex
CREATE UNIQUE INDEX "ROLES_nombre_rol_key" ON "ROLES"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_correo_electronico_key" ON "USUARIOS"("correo_electronico");

-- CreateIndex
CREATE UNIQUE INDEX "COLABORADORES_id_usuario_key" ON "COLABORADORES"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "ESTATUSPEDIDOS_descripcion_key" ON "ESTATUSPEDIDOS"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "ESTATUSCOTIZACION_descripcion_key" ON "ESTATUSCOTIZACION"("descripcion");

-- AddForeignKey
ALTER TABLE "USUARIOS" ADD CONSTRAINT "USUARIOS_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COLABORADORES" ADD CONSTRAINT "COLABORADORES_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COLABORADORES" ADD CONSTRAINT "COLABORADORES_id_sucursal_fkey" FOREIGN KEY ("id_sucursal") REFERENCES "SUCURSALES"("id_sucursal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASISTENCIACOLABORADOR" ADD CONSTRAINT "ASISTENCIACOLABORADOR_id_colaborador_fkey" FOREIGN KEY ("id_colaborador") REFERENCES "COLABORADORES"("id_colaborador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOTASCLIENTE" ADD CONSTRAINT "NOTASCLIENTE_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "CLIENTES"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOTASCLIENTE" ADD CONSTRAINT "NOTASCLIENTE_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICIOS" ADD CONSTRAINT "SERVICIOS_id_estatus_fkey" FOREIGN KEY ("id_estatus") REFERENCES "ESTATUSSERVICIO"("id_estatus_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPCIONESPRODUCTO" ADD CONSTRAINT "OPCIONESPRODUCTO_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPCIONESPRODUCTO" ADD CONSTRAINT "OPCIONESPRODUCTO_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "MATERIALES"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VALORES_OPCION" ADD CONSTRAINT "VALORES_OPCION_id_opcion_fkey" FOREIGN KEY ("id_opcion") REFERENCES "OPCIONESPRODUCTO"("id_opcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MATRIZDEPRECIOS" ADD CONSTRAINT "MATRIZDEPRECIOS_id_opcion_fkey" FOREIGN KEY ("id_opcion") REFERENCES "OPCIONESPRODUCTO"("id_opcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MATRIZDEPRECIOS" ADD CONSTRAINT "MATRIZDEPRECIOS_id_valor_fkey" FOREIGN KEY ("id_valor") REFERENCES "VALORES_OPCION"("id_valor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MATRIZDEPRECIOS" ADD CONSTRAINT "MATRIZDEPRECIOS_id_usuario_modifico_fkey" FOREIGN KEY ("id_usuario_modifico") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SUCURSALESMAQUINA" ADD CONSTRAINT "SUCURSALESMAQUINA_id_sucursal_fkey" FOREIGN KEY ("id_sucursal") REFERENCES "SUCURSALES"("id_sucursal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SUCURSALESMAQUINA" ADD CONSTRAINT "SUCURSALESMAQUINA_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "MAQUINAS"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INSTALADORSERVICIOS" ADD CONSTRAINT "INSTALADORSERVICIOS_id_instalador_fkey" FOREIGN KEY ("id_instalador") REFERENCES "INSTALADORES"("id_instalador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOS" ADD CONSTRAINT "PEDIDOS_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "CLIENTES"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOS" ADD CONSTRAINT "PEDIDOS_id_estatus_fkey" FOREIGN KEY ("id_estatus") REFERENCES "ESTATUSPEDIDOS"("id_estatus") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOS" ADD CONSTRAINT "PEDIDOS_id_sucursal_fkey" FOREIGN KEY ("id_sucursal") REFERENCES "SUCURSALES"("id_sucursal") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DETALLEPEDIDO" ADD CONSTRAINT "DETALLEPEDIDO_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DETALLEPEDIDO" ADD CONSTRAINT "DETALLEPEDIDO_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DETALLEPEDIDO" ADD CONSTRAINT "DETALLEPEDIDO_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "MATERIALES"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DETALLEPEDIDO" ADD CONSTRAINT "DETALLEPEDIDO_id_archivo_fkey" FOREIGN KEY ("id_archivo") REFERENCES "ARCHIVOSDISENIO"("id_archivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOMAQUINA" ADD CONSTRAINT "PEDIDOMAQUINA_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOMAQUINA" ADD CONSTRAINT "PEDIDOMAQUINA_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "MAQUINAS"("id_maquina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOMAQUINA" ADD CONSTRAINT "PEDIDOMAQUINA_id_material_fkey" FOREIGN KEY ("id_material") REFERENCES "MATERIALES"("id_material") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PEDIDOMAQUINA" ADD CONSTRAINT "PEDIDOMAQUINA_id_usuario_asigno_fkey" FOREIGN KEY ("id_usuario_asigno") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORIALESTADOSPEDIDOS" ADD CONSTRAINT "HISTORIALESTADOSPEDIDOS_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORIALESTADOSPEDIDOS" ADD CONSTRAINT "HISTORIALESTADOSPEDIDOS_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COTIZACIONES" ADD CONSTRAINT "COTIZACIONES_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COTIZACIONES" ADD CONSTRAINT "COTIZACIONES_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "CLIENTES"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COTIZACIONES" ADD CONSTRAINT "COTIZACIONES_id_estatus_cotizacion_fkey" FOREIGN KEY ("id_estatus_cotizacion") REFERENCES "ESTATUSCOTIZACION"("id_estatus") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORIALESTADOSCOTIZACION" ADD CONSTRAINT "HISTORIALESTADOSCOTIZACION_id_cotizacion_fkey" FOREIGN KEY ("id_cotizacion") REFERENCES "COTIZACIONES"("id_cotizacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORIALESTADOSCOTIZACION" ADD CONSTRAINT "HISTORIALESTADOSCOTIZACION_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FORMULA_VARIABLES" ADD CONSTRAINT "FORMULA_VARIABLES_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "SERVICIOS"("id_servicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VARIABLES_COTIZACION" ADD CONSTRAINT "VARIABLES_COTIZACION_id_cotizacion_fkey" FOREIGN KEY ("id_cotizacion") REFERENCES "COTIZACIONES"("id_cotizacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VARIABLES_COTIZACION" ADD CONSTRAINT "VARIABLES_COTIZACION_id_detalle_fkey" FOREIGN KEY ("id_detalle") REFERENCES "DETALLEPEDIDO"("id_detalle") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VARIABLES_COTIZACION" ADD CONSTRAINT "VARIABLES_COTIZACION_id_formula_fkey" FOREIGN KEY ("id_formula") REFERENCES "FORMULA_VARIABLES"("id_formula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VARIABLES_COTIZACION" ADD CONSTRAINT "VARIABLES_COTIZACION_id_usuario_asigno_fkey" FOREIGN KEY ("id_usuario_asigno") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PAGOS" ADD CONSTRAINT "PAGOS_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GASTOS" ADD CONSTRAINT "GASTOS_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PEDIDOS"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GASTOS" ADD CONSTRAINT "GASTOS_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "PROVEEDORES"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;
