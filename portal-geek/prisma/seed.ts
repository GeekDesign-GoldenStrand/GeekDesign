/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Dev-only default password for the seeded admin.
// In production / CI set SEED_ADMIN_PASSWORD to override.
const ADMIN_DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

async function main() {
  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.roles.upsert({
      where: { nombre_rol: "Direccion" },
      update: {},
      create: { nombre_rol: "Direccion" },
    }),
    prisma.roles.upsert({
      where: { nombre_rol: "Administrador" },
      update: {},
      create: { nombre_rol: "Administrador" },
    }),
    prisma.roles.upsert({
      where: { nombre_rol: "Colaborador" },
      update: {},
      create: { nombre_rol: "Colaborador" },
    }),
    prisma.roles.upsert({
      where: { nombre_rol: "Finanzas" },
      update: {},
      create: { nombre_rol: "Finanzas" },
    }),
  ]);

  console.log(`Seeded ${roles.length} roles`);

  // ── Sucursal (needed before Colaboradores) ─────────────────────────────────
  const sucursal = await prisma.sucursales.upsert({
    where: { id_sucursal: 1 },
    update: {},
    create: {
      nombre_sucursal: "Sucursal Principal",
      direccion: "Monterrey, NL",
      estatus: "Activo",
    },
  });

  console.log(`Seeded branch "${sucursal.nombre_sucursal}"`);

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminRole = roles.find((r) => r.nombre_rol === "Administrador")!;
  const adminPasswordHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 12);
  const adminUser = await prisma.usuarios.upsert({
    where: { correo_electronico: "admin@geekdesign.mx" },
    update: { contrasena_hash: adminPasswordHash },
    create: {
      nombre_completo: "Admin GeekDesign",
      correo_electronico: "admin@geekdesign.mx",
      contrasena_hash: adminPasswordHash,
      id_rol: adminRole.id_rol,
      estatus: "Activo",
    },
  });

  console.log(`Seeded admin user: ${adminUser.correo_electronico}`);

  // ── Admin as Colaborador ───────────────────────────────────────────────────
  await prisma.colaboradores.upsert({
    where: { id_usuario: adminUser.id_usuario },
    update: {},
    create: {
      id_usuario: adminUser.id_usuario,
      id_sucursal: sucursal.id_sucursal,
      edad: 30,
      sexo: "M",
      telefono: "8110000000",
      estatus_colaborador: "Activo",
    },
  });

  // ── Dirección user ──────────────────────────────────────────────────────────
  const direccionRole = roles.find((r) => r.nombre_rol === "Direccion")!;
  const direccionPasswordHash = await bcrypt.hash(
    process.env.SEED_DIRECCION_PASSWORD ?? "direccion123",
    12
  );

  const direccionUser = await prisma.usuarios.upsert({
    where: { correo_electronico: "direccion@geekdesign.mx" },
    update: { contrasena_hash: direccionPasswordHash },
    create: {
      nombre_completo: "Usuario Dirección",
      correo_electronico: "direccion@geekdesign.mx",
      contrasena_hash: direccionPasswordHash,
      id_rol: direccionRole.id_rol,
      estatus: "Activo",
    },
  });

  console.log(`Seeded Dirección user: ${direccionUser.correo_electronico}`);

  console.log("Seeded admin colaborador");

  // ── Machine ────────────────────────────────────────────────────────────────
  const maquina = await prisma.maquinas.upsert({
    where: { id_maquina: 1 },
    update: {},
    create: {
      nombre_maquina: "Láser CO2 100W",
      apodo_maquina: "Láser Grande",
      tipo: "Láser CO2",
      estatus: "Activa",
    },
  });

  await prisma.sucursalesMaquina.upsert({
    where: { id_sucursal_maquina: 1 },
    update: {},
    create: { id_sucursal: sucursal.id_sucursal, id_maquina: maquina.id_maquina },
  });

  console.log(
    `Seeded branch "${sucursal.nombre_sucursal}" with machine "${maquina.nombre_maquina}"`
  );

  // ── EstatusServicio ────────────────────────────────────────────────────────
  const estatusServicioActivo = await prisma.estatusServicio.upsert({
    where: { id_estatus_servicio: 1 },
    update: {},
    create: { descripcion: "Activo" },
  });

  // ── Service + Product + Material + Pricing ─────────────────────────────────
  const servicio = await prisma.servicios.upsert({
    where: { id_servicio: 1 },
    update: {},
    create: {
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      nombre_servicio: "Corte Láser",
      descripcion_servicio: "Corte con láser CO2",
      estatus_servicio: true,
    },
  });

  const material = await prisma.materiales.upsert({
    where: { id_material: 1 },
    update: {},
    create: {
      nombre_material: "MDF 3mm",
      descripcion_material: "MDF de 3mm de espesor",
      unidad_medida: "hoja",
      grosor: 3.0,
    },
  });

  const opcion = await prisma.opcionesProducto.upsert({
    where: { id_opcion: 1 },
    update: {},
    create: {
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      nombre_opcion: "Tamaño",
      afecta_precio: true,
    },
  });

  const valorChico = await prisma.valoresOpcion.upsert({
    where: { id_valor: 1 },
    update: {},
    create: { id_opcion: opcion.id_opcion, valor: "chico", es_default: true },
  });

  const valorGrande = await prisma.valoresOpcion.upsert({
    where: { id_valor: 2 },
    update: {},
    create: { id_opcion: opcion.id_opcion, valor: "grande", es_default: false },
  });

  // Price matrix: chico 1-9 = $25, 10+ = $20; grande 1-9 = $45, 10+ = $35
  await Promise.all([
    prisma.matrizDePrecios.upsert({
      where: { id_precio: 1 },
      update: {},
      create: {
        id_opcion: opcion.id_opcion,
        id_valor: valorChico.id_valor,
        cantidad_minima: 1,
        cantidad_maxima: 9,
        precio_unitario: 25.0,
        tiene_mayoreo: false,
        id_usuario_modifico: adminUser.id_usuario,
      },
    }),
    prisma.matrizDePrecios.upsert({
      where: { id_precio: 2 },
      update: {},
      create: {
        id_opcion: opcion.id_opcion,
        id_valor: valorChico.id_valor,
        cantidad_minima: 10,
        cantidad_maxima: 99999,
        precio_unitario: 20.0,
        tiene_mayoreo: true,
        cantidad_mayoreo: 10,
        descuento_mayoreo: 20.0,
        id_usuario_modifico: adminUser.id_usuario,
      },
    }),
    prisma.matrizDePrecios.upsert({
      where: { id_precio: 3 },
      update: {},
      create: {
        id_opcion: opcion.id_opcion,
        id_valor: valorGrande.id_valor,
        cantidad_minima: 1,
        cantidad_maxima: 9,
        precio_unitario: 45.0,
        tiene_mayoreo: false,
        id_usuario_modifico: adminUser.id_usuario,
      },
    }),
    prisma.matrizDePrecios.upsert({
      where: { id_precio: 4 },
      update: {},
      create: {
        id_opcion: opcion.id_opcion,
        id_valor: valorGrande.id_valor,
        cantidad_minima: 10,
        cantidad_maxima: 99999,
        precio_unitario: 35.0,
        tiene_mayoreo: true,
        cantidad_mayoreo: 10,
        descuento_mayoreo: 22.0,
        id_usuario_modifico: adminUser.id_usuario,
      },
    }),
  ]);

  console.log(`Seeded option "${opcion.nombre_opcion}" with pricing matrix`);

  // ── Order statuses ─────────────────────────────────────────────────────────
  const orderStatuses = [
    "Cotizacion",
    "Pagado",
    "En_cola",
    "Aprobacion_diseno",
    "En_produccion",
    "Entregado",
    "Facturado",
  ];
  for (const descripcion of orderStatuses) {
    await prisma.estatusPedidos.upsert({
      where: { descripcion },
      update: {},
      create: { descripcion },
    });
  }
  console.log(`Seeded ${orderStatuses.length} order statuses`);

  // ── Quotation statuses ─────────────────────────────────────────────────────
  const quotationStatuses = ["En_revision", "Validada", "Aprobada", "Rechazada"];
  for (const descripcion of quotationStatuses) {
    await prisma.estatusCotizacion.upsert({
      where: { descripcion },
      update: {},
      create: { descripcion },
    });
  }
  console.log(`Seeded ${quotationStatuses.length} quotation statuses`);

  // ── Test client ────────────────────────────────────────────────────────────
  await prisma.clientes.upsert({
    where: { id_cliente: 1 },
    update: {},
    create: {
      nombre_cliente: "Cliente Demo",
      correo_electronico: "cliente@example.mx",
      numero_telefono: "8110000000",
    },
  });
  console.log("Seeded test client");

  // ── Proveedores ────────────────────────────────────────────────────────────
  const proveedoresData = [
    {
      id_proveedor: 1,
      nombre_proveedor: "Maderas del Norte SA",
      tipo: "Proveedor de material",
      telefono: "8112345678",
      correo: "ventas@maderasnorte.mx",
      descripcion_proveedor: "Proveedor de MDF, triplay y madera sólida.",
      ubicacion: "Monterrey, Nuevo León",
      estatus: "Activo",
    },
    {
      id_proveedor: 2,
      nombre_proveedor: "Acrilatos Querétaro",
      tipo: "Proveedor de material",
      telefono: "4421234567",
      correo: "contacto@acrilatosqro.mx",
      descripcion_proveedor: "Acrílicos de colores, transparentes y espejados.",
      ubicacion: "Querétaro, Querétaro",
      estatus: "Activo",
    },
    {
      id_proveedor: 3,
      nombre_proveedor: "Vinilos Express",
      tipo: "Proveedor de material",
      telefono: "5598765432",
      correo: "pedidos@vinilosexpress.mx",
      descripcion_proveedor: "Viniles de corte, impresión y laminado.",
      ubicacion: "Ciudad de México, CDMX",
      estatus: "Activo",
    },
    {
      id_proveedor: 4,
      nombre_proveedor: "Grabados Industriales MX",
      tipo: "Proveedor de servicio",
      telefono: "8187654321",
      correo: "info@grabadosindustriales.mx",
      descripcion_proveedor: "Servicio externo de grabado en metal y vidrio.",
      ubicacion: "San Pedro Garza García, Nuevo León",
      estatus: "Activo",
    },
    {
      id_proveedor: 5,
      nombre_proveedor: "Foil & Print CDMX",
      tipo: "Proveedor de servicio",
      telefono: "5512349876",
      correo: "hola@foilprint.mx",
      descripcion_proveedor: null,
      ubicacion: "Naucalpan, Estado de México",
      estatus: "Inactivo",
    },
  ];

  for (const data of proveedoresData) {
    await prisma.proveedores.upsert({
      where: { id_proveedor: data.id_proveedor },
      update: {},
      create: data,
    });
  }

  console.log(`Seeded ${proveedoresData.length} proveedores`);

  // ── Instaladores ───────────────────────────────────────────────────────────
  const instaladoresData = [
    {
      id_instalador: 1,
      nombre_instalador: "Carlos Ramírez",
      apodo: "El Rápido",
      tipo: "Instalador",
      telefono: "8113456789",
      correo: "carlos.ramirez@instalaciones.mx",
      notas: "Especialista en viniles y rotulación.",
      ubicacion: "Monterrey, Nuevo León",
      estatus: "Activo",
    },
    {
      id_instalador: 2,
      nombre_instalador: "Grupo Instalaciones NL",
      apodo: null,
      tipo: "Contratista",
      telefono: "8129876543",
      correo: "contacto@grupoinstala.mx",
      notas: "Cuadrilla de 4 personas. Trabajan fines de semana.",
      ubicacion: "San Nicolás de los Garza, Nuevo León",
      estatus: "Activo",
    },
    {
      id_instalador: 3,
      nombre_instalador: "Luis Mendoza",
      apodo: "Lucho",
      tipo: "Instalador",
      telefono: "4423219876",
      correo: "luis.mendoza@correo.mx",
      notas: null,
      ubicacion: "Querétaro, Querétaro",
      estatus: "Activo",
    },
    {
      id_instalador: 4,
      nombre_instalador: "Patricia Solís",
      apodo: "Paty",
      tipo: "Instalador",
      telefono: "5551234567",
      correo: "paty.solis@instala.mx",
      notas: "Instalación de lonas y toldos.",
      ubicacion: "Ciudad de México, CDMX",
      estatus: "Inactivo",
    },
  ];

  for (const data of instaladoresData) {
    await prisma.instaladores.upsert({
      where: { id_instalador: data.id_instalador },
      update: {},
      create: data,
    });
  }

  console.log(`Seeded ${instaladoresData.length} instaladores`);

  // ── Extra clients (for pedido variety) ────────────────────────────────────
  const clienteEmpresa = await prisma.clientes.upsert({
    where: { id_cliente: 2 },
    update: {},
    create: {
      nombre_cliente: "Ana Torres",
      empresa: "Señalética Industrial SA",
      rfc: "TORA800101XX0",
      correo_electronico: "ana@senaletica.mx",
      numero_telefono: "8114567890",
      categoria: "Gold",
    },
  });

  const clienteSimple = await prisma.clientes.upsert({
    where: { id_cliente: 3 },
    update: {},
    create: {
      nombre_cliente: "Roberto Vega",
      correo_electronico: "roberto.vega@gmail.com",
      numero_telefono: "4429876543",
    },
  });

  console.log(
    `Seeded extra clients: "${clienteEmpresa.nombre_cliente}", "${clienteSimple.nombre_cliente}"`
  );

  // ── Archivo de diseño ──────────────────────────────────────────────────────
  const archivo = await prisma.archivosDisenio.upsert({
    where: { id_archivo: 1 },
    update: {},
    create: {
      nombre_archivo: "logo-demo.pdf",
      url_archivo: "https://storage.geekdesign.mx/archivos/logo-demo.pdf",
      formato: "pdf",
    },
  });

  console.log(`Seeded archivo "${archivo.nombre_archivo}"`);

  // ── Retrieve estatus IDs ───────────────────────────────────────────────────
  const estatusMap = Object.fromEntries(
    (await prisma.estatusPedidos.findMany()).map((e) => [e.descripcion, e.id_estatus])
  );

  // ── Pedidos ────────────────────────────────────────────────────────────────
  // 1. Cotizacion — fresh quote, no payment yet
  const pedidoCotizacion = await prisma.pedidos.upsert({
    where: { id_pedido: 1 },
    update: {},
    create: {
      id_cliente: clienteSimple.id_cliente,
      id_estatus: estatusMap["Cotizacion"],
      factura: false,
      notas: "Cliente solicita muestra antes de confirmar.",
    },
  });

  await prisma.detallePedido.upsert({
    where: { id_detalle: 1 },
    update: {},
    create: {
      id_pedido: pedidoCotizacion.id_pedido,
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { Tamaño: "chico" },
      cantidad: 5,
      ancho_cm: 15,
      alto_cm: 10,
      color: "Negro",
      responsable_recoleccion: "Roberto Vega",
      precio_unitario: 25.0,
      subtotal: 125.0,
    },
  });

  await prisma.historialEstadosPedidos.upsert({
    where: { id_historial: 1 },
    update: {},
    create: {
      id_pedido: pedidoCotizacion.id_pedido,
      id_usuario: adminUser.id_usuario,
      id_estado_anterior: null,
      id_estado_nuevo: estatusMap["Cotizacion"],
    },
  });

  // 2. Pagado — client paid, waiting for production queue
  const pedidoPagado = await prisma.pedidos.upsert({
    where: { id_pedido: 2 },
    update: {},
    create: {
      id_cliente: clienteEmpresa.id_cliente,
      id_estatus: estatusMap["Pagado"],
      id_sucursal: sucursal.id_sucursal,
      fecha_estimada: new Date("2026-05-20"),
      factura: true,
      facturado: false,
      notas: "Requiere factura para empresa.",
    },
  });

  await prisma.detallePedido.upsert({
    where: { id_detalle: 2 },
    update: {},
    create: {
      id_pedido: pedidoPagado.id_pedido,
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { Tamaño: "grande" },
      cantidad: 20,
      ancho_cm: 60,
      alto_cm: 40,
      color: "Rojo",
      responsable_recoleccion: "Ana Torres",
      precio_unitario: 35.0,
      subtotal: 700.0,
    },
  });

  await prisma.pagos.upsert({
    where: { id_pago: 1 },
    update: {},
    create: {
      id_pedido: pedidoPagado.id_pedido,
      monto_pago: 700.0,
      metodo_pago: "transferencia",
      estatus_pago: "Pagado",
    },
  });

  await prisma.historialEstadosPedidos.upsert({
    where: { id_historial: 2 },
    update: {},
    create: {
      id_pedido: pedidoPagado.id_pedido,
      id_usuario: adminUser.id_usuario,
      id_estado_anterior: null,
      id_estado_nuevo: estatusMap["Cotizacion"],
    },
  });

  await prisma.historialEstadosPedidos.upsert({
    where: { id_historial: 3 },
    update: {},
    create: {
      id_pedido: pedidoPagado.id_pedido,
      id_usuario: adminUser.id_usuario,
      id_estado_anterior: estatusMap["Cotizacion"],
      id_estado_nuevo: estatusMap["Pagado"],
    },
  });

  // 3. En producción — two-item order mid-production
  const pedidoEnProduccion = await prisma.pedidos.upsert({
    where: { id_pedido: 3 },
    update: {},
    create: {
      id_cliente: clienteEmpresa.id_cliente,
      id_estatus: estatusMap["En_produccion"],
      id_sucursal: sucursal.id_sucursal,
      fecha_estimada: new Date("2026-05-15"),
      factura: false,
    },
  });

  await prisma.detallePedido.upsert({
    where: { id_detalle: 3 },
    update: {},
    create: {
      id_pedido: pedidoEnProduccion.id_pedido,
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { Tamaño: "chico" },
      cantidad: 10,
      ancho_cm: 20,
      alto_cm: 15,
      color: "Azul",
      responsable_recoleccion: "Admin GeekDesign",
      precio_unitario: 20.0,
      subtotal: 200.0,
    },
  });

  await prisma.detallePedido.upsert({
    where: { id_detalle: 4 },
    update: {},
    create: {
      id_pedido: pedidoEnProduccion.id_pedido,
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { Tamaño: "grande" },
      cantidad: 3,
      ancho_cm: 80,
      alto_cm: 60,
      color: "Blanco",
      responsable_recoleccion: "Admin GeekDesign",
      precio_unitario: 45.0,
      subtotal: 135.0,
    },
  });

  await prisma.pagos.upsert({
    where: { id_pago: 2 },
    update: {},
    create: {
      id_pedido: pedidoEnProduccion.id_pedido,
      monto_pago: 335.0,
      metodo_pago: "efectivo",
      estatus_pago: "Pagado",
    },
  });

  for (const [idx, [anterior, nuevo]] of (
    [
      [null, "Cotizacion"],
      ["Cotizacion", "Pagado"],
      ["Pagado", "En_cola"],
      ["En_cola", "Aprobacion_diseno"],
      ["Aprobacion_diseno", "En_produccion"],
    ] as [string | null, string][]
  ).entries()) {
    await prisma.historialEstadosPedidos.upsert({
      where: { id_historial: 4 + idx },
      update: {},
      create: {
        id_pedido: pedidoEnProduccion.id_pedido,
        id_usuario: adminUser.id_usuario,
        id_estado_anterior: anterior ? estatusMap[anterior] : null,
        id_estado_nuevo: estatusMap[nuevo],
      },
    });
  }

  // 4. Entregado — completed and invoiced
  const pedidoEntregado = await prisma.pedidos.upsert({
    where: { id_pedido: 4 },
    update: {},
    create: {
      id_cliente: clienteSimple.id_cliente,
      id_estatus: estatusMap["Entregado"],
      id_sucursal: sucursal.id_sucursal,
      fecha_estimada: new Date("2026-04-30"),
      fecha_fin: new Date("2026-04-29"),
      factura: false,
    },
  });

  await prisma.detallePedido.upsert({
    where: { id_detalle: 5 },
    update: {},
    create: {
      id_pedido: pedidoEntregado.id_pedido,
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { Tamaño: "grande" },
      cantidad: 2,
      ancho_cm: 50,
      alto_cm: 30,
      responsable_recoleccion: "Roberto Vega",
      precio_unitario: 45.0,
      subtotal: 90.0,
    },
  });

  await prisma.pagos.upsert({
    where: { id_pago: 3 },
    update: {},
    create: {
      id_pedido: pedidoEntregado.id_pedido,
      monto_pago: 90.0,
      metodo_pago: "Mercado Pago",
      estatus_pago: "Pagado",
      referencia_mercadopago: "MP-2026-00042",
    },
  });

  for (const [idx, [anterior, nuevo]] of (
    [
      [null, "Cotizacion"],
      ["Cotizacion", "Pagado"],
      ["Pagado", "En_cola"],
      ["En_cola", "En_produccion"],
      ["En_produccion", "Entregado"],
    ] as [string | null, string][]
  ).entries()) {
    await prisma.historialEstadosPedidos.upsert({
      where: { id_historial: 9 + idx },
      update: {},
      create: {
        id_pedido: pedidoEntregado.id_pedido,
        id_usuario: adminUser.id_usuario,
        id_estado_anterior: anterior ? estatusMap[anterior] : null,
        id_estado_nuevo: estatusMap[nuevo],
      },
    });
  }

  // 5. Aprobacion_diseno — design pending approval
  const pedidoDiseño = await prisma.pedidos.upsert({
    where: { id_pedido: 5 },
    update: {},
    create: {
      id_cliente: clienteEmpresa.id_cliente,
      id_estatus: estatusMap["Aprobacion_diseno"],
      id_sucursal: sucursal.id_sucursal,
      fecha_estimada: new Date("2026-05-18"),
      factura: true,
      facturado: false,
      notas: "Diseño enviado al cliente el 04/05. Esperando confirmación.",
    },
  });

  await prisma.detallePedido.upsert({
    where: { id_detalle: 6 },
    update: {},
    create: {
      id_pedido: pedidoDiseño.id_pedido,
      id_servicio: servicio.id_servicio,
      id_material: material.id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { Tamaño: "grande" },
      cantidad: 50,
      ancho_cm: 30,
      alto_cm: 20,
      color: "Verde",
      responsable_recoleccion: "Ana Torres",
      precio_unitario: 35.0,
      subtotal: 1750.0,
    },
  });

  await prisma.pagos.upsert({
    where: { id_pago: 4 },
    update: {},
    create: {
      id_pedido: pedidoDiseño.id_pedido,
      monto_pago: 875.0,
      metodo_pago: "transferencia",
      estatus_pago: "Pagado",
    },
  });

  for (const [idx, [anterior, nuevo]] of (
    [
      [null, "Cotizacion"],
      ["Cotizacion", "Pagado"],
      ["Pagado", "Aprobacion_diseno"],
    ] as [string | null, string][]
  ).entries()) {
    await prisma.historialEstadosPedidos.upsert({
      where: { id_historial: 14 + idx },
      update: {},
      create: {
        id_pedido: pedidoDiseño.id_pedido,
        id_usuario: adminUser.id_usuario,
        id_estado_anterior: anterior ? estatusMap[anterior] : null,
        id_estado_nuevo: estatusMap[nuevo],
      },
    });
  }

  console.log(
    `Seeded 5 pedidos: #${pedidoCotizacion.id_pedido} Cotizacion, ` +
      `#${pedidoPagado.id_pedido} Pagado, ` +
      `#${pedidoEnProduccion.id_pedido} En_produccion, ` +
      `#${pedidoEntregado.id_pedido} Entregado, ` +
      `#${pedidoDiseño.id_pedido} Aprobacion_diseno`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
