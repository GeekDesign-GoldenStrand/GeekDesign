/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import type { Roles } from "@prisma/client";
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

  // ── Variable Types for Formulas Engine ───────────────────────────────────────────────────────────
  const tiposVariable = [
    { nombre_tipo: "Dimensión", unidad_default: "cm", estatus: "Activo" },
    { nombre_tipo: "Cantidad", unidad_default: "pz", estatus: "Activo" },
    { nombre_tipo: "Costo adicional", unidad_default: "$", estatus: "Activo" },
    { nombre_tipo: "Costo de material", unidad_default: "$", estatus: "Activo" },
    { nombre_tipo: "Descuento", unidad_default: "%", estatus: "Activo" },
    { nombre_tipo: "Tiempo", unidad_default: "min", estatus: "Activo" },
  ];

  for (const tipo of tiposVariable) {
    await prisma.tiposVariable.upsert({
      where: { nombre_tipo: tipo.nombre_tipo },
      update: {},
      create: tipo,
    });
  }

  console.log("✔ Tipos de variable base creados");

  // ── Sucursales (needed before Colaboradores) ───────────────────────────────
  const sucursalesData = [
    {
      id_sucursal: 1,

      nombre_sucursal: "Sucursal Principal",
      direccion: "Monterrey, NL",
      estatus: "Activo",
    },
    {
      id_sucursal: 2,
      nombre_sucursal: "Sucursal San Pedro",
      direccion: "San Pedro Garza García, NL",
      estatus: "Activo",
    },
    {
      id_sucursal: 3,
      nombre_sucursal: "Sucursal Querétaro",
      direccion: "Querétaro, QRO",
      estatus: "Activo",
    },
  ];

  const sucursales = await Promise.all(
    sucursalesData.map((data) =>
      prisma.sucursales.upsert({
        where: { id_sucursal: data.id_sucursal },
        update: {},
        create: data,
      })
    )
  );
  const sucursal = sucursales[0];

  console.log(`Seeded ${sucursales.length} sucursales`);

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminRole = roles.find((r: Roles) => r.nombre_rol === "Administrador")!;
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
  const pwd = process.env.SEED_DIRECCION_PASSWORD;

  if (!pwd && process.env.NODE_ENV === "production") {
    throw new Error("SEED_DIRECCION_PASSWORD requerido en producción");
  }

  const direccionPasswordHash = await bcrypt.hash(pwd ?? "direccion123", 12);

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

  // ── Colaboradores demo ─────────────────────────────────────────────────────
  const colaboradorRole = roles.find((r) => r.nombre_rol === "Colaborador")!;
  const colaboradorPasswordHash = await bcrypt.hash(
    process.env.SEED_COLABORADOR_PASSWORD ?? "colaborador123",
    12
  );

  const colaboradoresData = [
    {
      nombre_completo: "María López Hernández",
      correo_electronico: "maria.lopez@geekdesign.mx",
      id_sucursal: 1,
      edad: 27,
      sexo: "F",
      telefono: "8111112233",
    },
    {
      nombre_completo: "Juan Carlos Pérez",
      correo_electronico: "juan.perez@geekdesign.mx",
      id_sucursal: 1,
      edad: 34,
      sexo: "M",
      telefono: "8112223344",
    },
    {
      nombre_completo: "Ana Patricia Reyes",
      correo_electronico: "ana.reyes@geekdesign.mx",
      id_sucursal: 2,
      edad: 31,
      sexo: "F",
      telefono: "8113334455",
    },
    {
      nombre_completo: "Diego Salinas Treviño",
      correo_electronico: "diego.salinas@geekdesign.mx",
      id_sucursal: 2,
      edad: 24,
      sexo: "M",
      telefono: "8114445566",
    },
    {
      nombre_completo: "Sofía Gutiérrez Mora",
      correo_electronico: "sofia.gutierrez@geekdesign.mx",
      id_sucursal: 3,
      edad: 29,
      sexo: "F",
      telefono: "4421112233",
    },
    {
      nombre_completo: "Roberto Mendoza Cruz",
      correo_electronico: "roberto.mendoza@geekdesign.mx",
      id_sucursal: 3,
      edad: 42,
      sexo: "M",
      telefono: "4422223344",
    },
  ];

  for (const data of colaboradoresData) {
    const usuario = await prisma.usuarios.upsert({
      where: { correo_electronico: data.correo_electronico },
      update: {},
      create: {
        nombre_completo: data.nombre_completo,
        correo_electronico: data.correo_electronico,
        contrasena_hash: colaboradorPasswordHash,
        id_rol: colaboradorRole.id_rol,
        estatus: "Activo",
      },
    });

    await prisma.colaboradores.upsert({
      where: { id_usuario: usuario.id_usuario },
      update: {},
      create: {
        id_usuario: usuario.id_usuario,
        id_sucursal: data.id_sucursal,
        edad: data.edad,
        sexo: data.sexo,
        telefono: data.telefono,
        estatus_colaborador: "Activo",
      },
    });
  }

  console.log(`Seeded ${colaboradoresData.length} colaboradores demo`);

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
  const servicioCorte = await prisma.servicios.upsert({
    where: { id_servicio: 1 },
    update: {},
    create: {
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      id_sucursal: sucursal.id_sucursal,
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
      id_servicio: servicioCorte.id_servicio,
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
  const orderStatuses = ["Pendiente", "En producción", "Finalizado", "Entregado", "Cancelado"];

  for (const descripcion of orderStatuses) {
    await prisma.estatusPedidos.upsert({
      where: { descripcion },
      update: {},
      create: { descripcion },
    });
  }

  console.log(`Seeded ${orderStatuses.length} order statuses`);

  // ── Invoice statuses ─────────────────────────────────────────
  const invoiceStatuses = [
    "Cotizacion",
    "Pagado",
    "En_cola",
    "Aprobacion_diseno",
    "En_produccion",
    "Entregado",
    "Facturado",
  ];

  for (const descripcion of invoiceStatuses) {
    await prisma.estadoFacturaPedido.upsert({
      where: { descripcion },
      update: {},
      create: { descripcion },
    });
  }

  // ── Quotation statuses ─────────────────────────────────────────────────────
  const quotationStatuses = ["Pendiente", "Validada", "Rechazada", "Aprobada", "Cancelada"];

  for (const descripcion of quotationStatuses) {
    await prisma.estatusCotizacion.upsert({
      where: { descripcion },
      update: {},
      create: { descripcion },
    });
  }

  console.log(`Seeded ${quotationStatuses.length} quotation statuses`);

  // ── Instaladores ───────────────────────────────────────────────────────────
  const instaladoresData = [
    {
      id_instalador: 1,
      nombre_instalador: "Carlos Ramírez",
      apodo: "El Rápido",
      tipo: "Instalador",
      telefono: "8113456789",
      correo: "carlos.ramirez@instalaciones.mx",
      costo_instalacion: 350.0,
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
      costo_instalacion: 500.0,
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
      costo_instalacion: 280.0,
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
      costo_instalacion: 200.0,
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

  // ── ProveedorPrecios ───────────────────────────────────────────────────────
  await prisma.proveedorPrecios.upsert({
    where: { id_proveedor_id_material: { id_proveedor: 1, id_material: material.id_material } },
    update: {},
    create: { id_proveedor: 1, id_material: material.id_material, precio: 200 },
  });

  console.log("Seeded ProveedorPrecios: Maderas del Norte SA → MDF 3mm @ $200");

  // ── Demo Cotizaciones ──────────────────────────────────────────────────────
  const cotizacionStatuses = await prisma.estatusCotizacion.findMany();
  const clienteDemo = await prisma.clientes.findUnique({ where: { id_cliente: 1 } });

  if (clienteDemo && cotizacionStatuses.length > 0) {
    const statusMap: Record<string, number> = {};
    cotizacionStatuses.forEach((s) => (statusMap[s.descripcion] = s.id_estatus));

    const demoCotizaciones = [
      {
        id_pedido: 1,
        monto_total: 1500,
        notas: "Cotización pendiente para corte láser",
        fecha_creacion: new Date("2026-04-13"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Pendiente"],
      },
      {
        id_pedido: 2,
        monto_total: 2500,
        notas: "Cotización aprobada para grabado",
        fecha_creacion: new Date("2026-04-15"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Validada"],
      },
      {
        id_pedido: 3,
        monto_total: 1800,
        notas: "Cliente rechazó la propuesta",
        fecha_creacion: new Date("2026-04-17"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Rechazada"],
      },
      {
        id_pedido: 4,
        monto_total: 2200,
        notas: "Cotización validada por cambios de requerimiento",
        fecha_creacion: new Date("2026-04-20"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Aprobada"],
      },
      {
        id_pedido: 5,
        monto_total: 3000,
        notas: "Cotización cancelada",
        fecha_creacion: new Date("2026-06-20"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Cancelada"],
      },
    ];

    // ── Invoice status map ─────────────────────────────────────────
    const invoiceStatusRows = await prisma.estadoFacturaPedido.findMany();

    const invoiceStatusMap: Record<string, number> = {};

    invoiceStatusRows.forEach((s) => {
      invoiceStatusMap[s.descripcion] = s.id_estado_factura;
    });

    // ── Demo Pedidos ───────────────────────────────────────────────
    const demoPedidos = [
      {
        status: "Pendiente",
        estado_factura: "Cotizacion",
        fecha_creacion: new Date("2026-04-13"),
        fecha_estimada: new Date("2026-04-18"),
        notas: "Pedido demo pendiente",
      },

      {
        status: "En producción",
        estado_factura: "Pagado",
        fecha_creacion: new Date("2026-04-15"),
        fecha_estimada: new Date("2026-04-22"),
        notas: "Pedido demo en producción",
      },

      {
        status: "Finalizado",
        estado_factura: "Aprobacion_diseno",
        fecha_creacion: new Date("2026-04-17"),
        fecha_estimada: new Date("2026-04-24"),
        notas: "Pedido demo finalizado",
      },

      {
        status: "Entregado",
        estado_factura: "Entregado",
        fecha_creacion: new Date("2026-04-20"),
        fecha_estimada: new Date("2026-04-27"),
        notas: "Pedido demo entregado",
      },

      {
        status: "Cancelado",
        estado_factura: "Facturado",
        fecha_creacion: new Date("2026-04-25"),
        fecha_estimada: new Date("2026-05-01"),
        notas: "Pedido demo cancelado",
      },
    ];

    for (const pedido of demoPedidos) {
      await prisma.pedidos.create({
        data: {
          cliente: {
            connect: {
              id_cliente: 1,
            },
          },

          estatus: {
            connect: {
              descripcion: pedido.status,
            },
          },

          estado_factura: {
            connect: {
              id_estado_factura: invoiceStatusMap[pedido.estado_factura],
            },
          },

          sucursal: {
            connect: {
              id_sucursal: 1,
            },
          },

          fecha_creacion: pedido.fecha_creacion,
          fecha_estimada: pedido.fecha_estimada,
          notas: pedido.notas,
        },
      });
    }

    await prisma.cotizaciones.createMany({ data: demoCotizaciones });
    console.log(`Seeded ${demoCotizaciones.length} demo cotizaciones`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
