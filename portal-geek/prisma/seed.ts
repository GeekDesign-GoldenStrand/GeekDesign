/* eslint-disable no-console */
import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import type { Roles } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

// Same TLS posture as lib/db/client.ts — connect plaintext; rely on the Unix
// socket (App Engine) or Cloud SQL Auth Proxy (dev) to handle Cloud SQL TLS.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const adapter = new PrismaPg(pool);
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

  // ── SISTEMA user (audit trail for system-initiated writes) ────────────────
  // Used as id_usuario_asigno on VariablesCotizacion when a Cliente (no session)
  // submits a quote via the public storefront endpoint. Login disabled.
  const sistemaPasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const sistemaUser = await prisma.usuarios.upsert({
    where: { correo_electronico: "sistema@geekdesign.mx" },
    update: {},
    create: {
      nombre_completo: "Sistema",
      correo_electronico: "sistema@geekdesign.mx",
      contrasena_hash: sistemaPasswordHash,
      id_rol: colaboradorRoleForSistema(roles).id_rol,
      estatus: "Inactivo",
    },
  });
  console.log(`Seeded SISTEMA user: ${sistemaUser.correo_electronico}`);

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
    update: {
      imagen_url: JSON.stringify([
        "/images/laser_cut_wood.png",
        "/images/laser_cut_acrylic.png",
        "/images/laser_cut_sign.png",
      ]),
    },
    create: {
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      id_sucursal: sucursal.id_sucursal,
      nombre_servicio: "Corte Láser",
      descripcion_servicio: "Corte con láser CO2",
      estatus_servicio: true,
      imagen_url: JSON.stringify([
        "/images/laser_cut_wood.png",
        "/images/laser_cut_acrylic.png",
        "/images/laser_cut_sign.png",
      ]),
    },
  });

  const servicioGrabado = await prisma.servicios.upsert({
    where: { id_servicio: 2 },
    update: {},
    create: {
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      id_sucursal: sucursal.id_sucursal,
      nombre_servicio: "Grabado Láser",
      descripcion_servicio: "Grabado láser sobre madera, acrílico o metal",
      estatus_servicio: true,
    },
  });

  const servicioBordado = await prisma.servicios.upsert({
    where: { id_servicio: 3 },
    update: {
      imagen_url: JSON.stringify([
        "/images/embroidery_close.png",
        "/images/embroidery_hoop.png",
        "/images/embroidery_finished.png",
      ]),
    },
    create: {
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      id_sucursal: sucursal.id_sucursal,
      nombre_servicio: "Bordado",
      descripcion_servicio: "Bordado personalizado en textiles",
      estatus_servicio: true,
      imagen_url: JSON.stringify([
        "/images/embroidery_close.png",
        "/images/embroidery_hoop.png",
        "/images/embroidery_finished.png",
      ]),
    },
  });

  const servicioRotulacion = await prisma.servicios.upsert({
    where: { id_servicio: 4 },
    update: {},
    create: {
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      id_sucursal: sucursal.id_sucursal,
      nombre_servicio: "Rotulación de vinil",
      descripcion_servicio: "Rotulación y aplicación de vinil decorativo o publicitario",
      estatus_servicio: true,
    },
  });

  console.log("Seeded demo services: Corte Láser, Grabado Láser, Bordado, Rotulación de vinil");

  const material = await prisma.materiales.upsert({
    where: { id_material: 1 },
    update: {},
    create: {
      id_material: 1,
      nombre_material: "MDF 3mm",
      descripcion_material: "MDF de 3mm de espesor",
      unidad_medida: "hoja",
      grosor: 3.0,
    },
  });

  const materialAcrilico = await prisma.materiales.upsert({
    where: { id_material: 2 },
    update: {},
    create: {
      id_material: 2,
      nombre_material: "Acrílico transparente 3mm",
      descripcion_material: "Acrílico transparente para corte y grabado láser",
      unidad_medida: "hoja",
      grosor: 3.0,
    },
  });

  const materialTela = await prisma.materiales.upsert({
    where: { id_material: 3 },
    update: {},
    create: {
      id_material: 3,
      nombre_material: "Tela algodón",
      descripcion_material: "Tela base para bordado personalizado",
      unidad_medida: "pieza",
    },
  });

  const materialVinil = await prisma.materiales.upsert({
    where: { id_material: 4 },
    update: {},
    create: {
      id_material: 4,
      nombre_material: "Vinil adhesivo",
      descripcion_material: "Vinil para rotulación y señalética",
      unidad_medida: "metro",
    },
  });

  console.log("Seeded demo materials for PE-03");

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

  const orderStatusRows = await prisma.estatusPedidos.findMany();

  const orderStatusMap: Record<string, number> = {};

  orderStatusRows.forEach((s) => {
    orderStatusMap[s.descripcion] = s.id_estatus;
  });

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

  // ── More demo clients ──────────────────────────────────────────────────────
  const demoClientsData = [
    {
      id_cliente: 2,
      nombre_cliente: "Grupo Empresarial NL",
      empresa: "Grupo Empresarial NL SA de CV",
      correo_electronico: "contacto@gruponl.mx",
      numero_telefono: "8121100001",
      categoria: "Gold",
    },
    {
      id_cliente: 3,
      nombre_cliente: "Laura Rodríguez Vega",
      correo_electronico: "laura.rodriguez@example.mx",
      numero_telefono: "4421100002",
      categoria: "Silver",
    },
    {
      id_cliente: 4,
      nombre_cliente: "Publicidad Del Valle",
      empresa: "Publicidad Del Valle SA de CV",
      correo_electronico: "info@pubdelvalle.mx",
      numero_telefono: "5591100003",
    },
  ];

  for (const c of demoClientsData) {
    await prisma.clientes.upsert({ where: { id_cliente: c.id_cliente }, update: {}, create: c });
  }

  console.log(`Seeded ${demoClientsData.length} more demo clients`);

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

  const proveedorPrecioMDF = await prisma.proveedorPrecios.findUnique({
    where: { id_proveedor_id_material: { id_proveedor: 1, id_material: material.id_material } },
  });

  // ── ServicioMaterial relations for demo PE-03 services ──
  async function upsertServicioMaterial({
    id_servicio,
    id_material,
    id_proveedor_precio,
  }: {
    id_servicio: number;
    id_material: number;
    id_proveedor_precio?: number;
  }) {
    return prisma.servicioMaterial.upsert({
      where: {
        id_servicio_id_material: {
          id_servicio,
          id_material,
        },
      },
      update: {
        ...(id_proveedor_precio !== undefined ? { id_proveedor_precio } : {}),
      },
      create: {
        id_servicio,
        id_material,
        ...(id_proveedor_precio !== undefined ? { id_proveedor_precio } : {}),
      },
    });
  }

  // ── ServicioMaterial: link Corte Láser to MDF 3mm at MDF supplier price ──
  if (proveedorPrecioMDF) {
    await upsertServicioMaterial({
      id_servicio: servicioCorte.id_servicio,
      id_material: material.id_material,
      id_proveedor_precio: proveedorPrecioMDF.id_proveedor_precio,
    });

    console.log("Seeded ServicioMaterial: Corte Láser ↔ MDF 3mm");
  }

  await upsertServicioMaterial({
    id_servicio: servicioGrabado.id_servicio,
    id_material: material.id_material,
  });

  await upsertServicioMaterial({
    id_servicio: servicioGrabado.id_servicio,
    id_material: materialAcrilico.id_material,
  });

  await upsertServicioMaterial({
    id_servicio: servicioBordado.id_servicio,
    id_material: materialTela.id_material,
  });

  await upsertServicioMaterial({
    id_servicio: servicioRotulacion.id_servicio,
    id_material: materialVinil.id_material,
  });

  console.log("Seeded ServicioMaterial relations for demo PE-03 services");

  // ── Active Formula on Corte Láser ──────────────────────────────────────────
  // Reuses the Dimensión tipoVariable for ancho/alto, a manual constante
  // costo_laser, and the implicit precio_material from the selected material.
  // Expression: cm² × $/cm² + $ material → unit price.
  const tipoDimension = await prisma.tiposVariable.findUnique({
    where: { nombre_tipo: "Dimensión" },
  });
  if (tipoDimension) {
    const existingFormula = await prisma.formulas.findFirst({
      where: { id_servicio: servicioCorte.id_servicio, estatus: "Activa" },
    });
    if (!existingFormula) {
      const formula = await prisma.formulas.create({
        data: {
          id_servicio: servicioCorte.id_servicio,
          expresion: "ancho * alto * costo_laser + precio_material",
          estatus: "Activa",
          id_usuario_creo: adminUser.id_usuario,
        },
      });
      await prisma.formulaVariables.createMany({
        data: [
          {
            id_formula: formula.id_formula,
            id_tipo_variable: tipoDimension.id_tipo_variable,
            nombre_variable: "ancho",
            etiqueta: "Ancho (cm)",
            valor_default: 50,
            editable_por_cliente: true,
            unidad: "cm",
            estatus: "Activo",
          },
          {
            id_formula: formula.id_formula,
            id_tipo_variable: tipoDimension.id_tipo_variable,
            nombre_variable: "alto",
            etiqueta: "Alto (cm)",
            valor_default: 30,
            editable_por_cliente: true,
            unidad: "cm",
            estatus: "Activo",
          },
        ],
      });
      await prisma.formulaConstantes.create({
        data: {
          id_formula: formula.id_formula,
          nombre_constante: "costo_laser",
          origen: "manual",
          valor: 2.5,
          estatus: "Activo",
        },
      });
      console.log("Seeded Formula on Corte Láser: ancho × alto × costo_laser + precio_material");
    }
  }

  // ── Placeholder ArchivosDisenio (used until ST-06 ships file upload) ──────
  await prisma.archivosDisenio.upsert({
    where: { id_archivo: 1 },
    update: {},
    create: {
      nombre_archivo: "__PLACEHOLDER__",
      url_archivo: "https://placeholder.invalid/no-design-yet",
      formato: "n/a",
    },
  });
  console.log("Seeded placeholder ArchivosDisenio (id=1)");

  // ── Demo Cotizaciones ──────────────────────────────────────────────────────
  const cotizacionStatuses = await prisma.estatusCotizacion.findMany();
  const clienteDemo = await prisma.clientes.findUnique({ where: { id_cliente: 1 } });

  if (clienteDemo && cotizacionStatuses.length > 0) {
    const statusMap: Record<string, number> = {};
    cotizacionStatuses.forEach((s) => (statusMap[s.descripcion] = s.id_estatus));

    // id_cliente values mirror demoPedidos[i].id_cliente for referential consistency
    const demoCotizaciones = [
      {
        id_pedido: 1,
        folio: "COT-001",
        monto_total: 1500,
        nombre_oportunidad: "Señalética interior oficinas",
        notas: "Cotización pendiente para señalética interior",
        fecha_creacion: new Date("2026-04-13"),
        id_cliente: 2,
        id_estatus_cotizacion: statusMap["Pendiente"],
      },
      {
        id_pedido: 2,
        folio: "COT-002",
        monto_total: 2500,
        nombre_oportunidad: "Corte y grabado trofeos",
        notas: "Cotización aprobada para corte y grabado trofeos",
        fecha_creacion: new Date("2026-04-15"),
        id_cliente: 3,
        id_estatus_cotizacion: statusMap["Validada"],
      },
      {
        id_pedido: 3,
        folio: "COT-003",
        monto_total: 1800,
        nombre_oportunidad: "Grabado placas conmemorativas",
        notas: "Cliente rechazó la propuesta de placas",
        fecha_creacion: new Date("2026-04-17"),
        id_cliente: 4,
        id_estatus_cotizacion: statusMap["Rechazada"],
      },
      {
        id_pedido: 4,
        folio: "COT-004",
        monto_total: 2200,
        nombre_oportunidad: "Rotulación flota vehicular",
        notas: "Cotización aprobada para rotulación flota vehicular",
        fecha_creacion: new Date("2026-04-20"),
        id_cliente: 2,
        id_estatus_cotizacion: statusMap["Aprobada"],
      },
      {
        id_pedido: 5,
        folio: "COT-005",
        monto_total: 3000,
        nombre_oportunidad: "Bordado uniformes corporativos",
        notas: "Cotización cancelada — cambio de presupuesto",
        fecha_creacion: new Date("2026-06-20"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Cancelada"],
      },
      {
        id_pedido: 6,
        folio: "COT-006",
        monto_total: 4500,
        nombre_oportunidad: "Corte láser piezas madera",
        notas: "Cotización pendiente para corte láser piezas madera",
        fecha_creacion: new Date("2026-04-22"),
        id_cliente: 3,
        id_estatus_cotizacion: statusMap["Pendiente"],
      },
      {
        id_pedido: 7,
        folio: "COT-007",
        monto_total: 890,
        nombre_oportunidad: "Bordado gorras evento",
        notas: "Cotización pendiente para bordado gorras evento",
        fecha_creacion: new Date("2026-04-23"),
        id_cliente: 4,
        id_estatus_cotizacion: statusMap["Pendiente"],
      },
      {
        id_pedido: 8,
        folio: "COT-008",
        monto_total: 3200,
        nombre_oportunidad: "Señalética exterior",
        notas: "Cotización pendiente para señalética exterior",
        fecha_creacion: new Date("2026-04-24"),
        id_cliente: clienteDemo.id_cliente,
        id_estatus_cotizacion: statusMap["Pendiente"],
      },
      {
        id_pedido: 9,
        folio: "COT-009",
        monto_total: 5400,
        nombre_oportunidad: "Campañas 2024",
        notas: "Cotización aprobada 2024",
        fecha_creacion: new Date("2024-05-10"),
        id_cliente: 2,
        id_estatus_cotizacion: statusMap["Aprobada"],
      },
      {
        id_pedido: 10,
        folio: "COT-010",
        monto_total: 8200,
        nombre_oportunidad: "Campañas 2025 Q1",
        notas: "Cotización aprobada 2025",
        fecha_creacion: new Date("2025-02-15"),
        id_cliente: 3,
        id_estatus_cotizacion: statusMap["Aprobada"],
      },
      {
        id_pedido: 11,
        folio: "COT-011",
        monto_total: 4500,
        nombre_oportunidad: "Campañas 2025 Q3",
        notas: "Cotización pendiente 2025",
        fecha_creacion: new Date("2025-08-20"),
        id_cliente: 4,
        id_estatus_cotizacion: statusMap["Pendiente"],
      },
      {
        id_pedido: 12,
        folio: "COT-012",
        monto_total: 9100,
        nombre_oportunidad: "Proyecto de fin de año",
        notas: "Cotización entregada",
        fecha_creacion: new Date("2025-11-05"),
        id_cliente: 1,
        id_estatus_cotizacion: statusMap["Validada"],
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
        id_cliente: 2,
        status: "Pendiente",
        estado_factura: "Cotizacion",
        fecha_creacion: new Date("2026-04-13"),
        fecha_estimada: new Date("2026-04-18"),
        notas: "Pedido demo pendiente",
        nombre_oportunidad: "Señalética interior oficinas",
      },

      {
        id_cliente: 3,
        status: "En producción",
        estado_factura: "Pagado",
        fecha_creacion: new Date("2026-04-15"),
        fecha_estimada: new Date("2026-04-22"),
        notas: "Pedido demo en producción",
        nombre_oportunidad: "Corte y grabado trofeos",
      },

      {
        id_cliente: 4,
        status: "Finalizado",
        estado_factura: "Aprobacion_diseno",
        fecha_creacion: new Date("2026-04-17"),
        fecha_estimada: new Date("2026-04-24"),
        notas: "Pedido demo finalizado",
        nombre_oportunidad: "Grabado placas conmemorativas",
      },

      {
        id_cliente: 2,
        status: "Entregado",
        estado_factura: "Entregado",
        fecha_creacion: new Date("2026-04-20"),
        fecha_estimada: new Date("2026-04-27"),
        notas: "Pedido demo entregado",
        nombre_oportunidad: "Rotulación flota vehicular",
      },

      {
        id_cliente: 1,
        status: "Cancelado",
        estado_factura: "Facturado",
        fecha_creacion: new Date("2026-04-25"),
        fecha_estimada: new Date("2026-05-01"),
        notas: "Pedido demo cancelado",
        nombre_oportunidad: "Bordado uniformes corporativos",
      },

      {
        id_cliente: 3,
        status: "Pendiente",
        estado_factura: "Cotizacion",
        fecha_creacion: new Date("2026-04-22"),
        fecha_estimada: new Date("2026-04-27"),
        notas: "Pedido demo pendiente 6",
        nombre_oportunidad: "Corte láser piezas madera",
      },

      {
        id_cliente: 4,
        status: "Pendiente",
        estado_factura: "Cotizacion",
        fecha_creacion: new Date("2026-04-23"),
        fecha_estimada: new Date("2026-04-28"),
        notas: "Pedido demo pendiente 7",
        nombre_oportunidad: "Bordado gorras evento",
      },

      {
        id_cliente: 1,
        status: "Pendiente",
        estado_factura: "Cotizacion",
        fecha_creacion: new Date("2026-04-24"),
        fecha_estimada: new Date("2026-04-29"),
        notas: "Pedido demo pendiente 8",
        nombre_oportunidad: "Señalética exterior",
      },
      {
        id_cliente: 2,
        status: "Finalizado",
        estado_factura: "Facturado",
        fecha_creacion: new Date("2024-05-10"),
        fecha_estimada: new Date("2024-05-20"),
        notas: "Pedido demo 2024",
        nombre_oportunidad: "Campañas 2024",
      },
      {
        id_cliente: 3,
        status: "Entregado",
        estado_factura: "Facturado",
        fecha_creacion: new Date("2025-02-15"),
        fecha_estimada: new Date("2025-02-28"),
        notas: "Pedido demo 2025 Q1",
        nombre_oportunidad: "Campañas 2025 Q1",
      },
      {
        id_cliente: 4,
        status: "Pendiente",
        estado_factura: "Cotizacion",
        fecha_creacion: new Date("2025-08-20"),
        fecha_estimada: new Date("2025-08-30"),
        notas: "Pedido demo 2025 Q3",
        nombre_oportunidad: "Campañas 2025 Q3",
      },
      {
        id_cliente: 1,
        status: "En producción",
        estado_factura: "En_cola",
        fecha_creacion: new Date("2025-11-05"),
        fecha_estimada: new Date("2025-11-15"),
        notas: "Pedido demo 2025 fin de año",
        nombre_oportunidad: "Proyecto de fin de año",
      },
    ];

    // Idempotency guard: demo cotizaciones use fixed folios (COT-001…) which
    // are @unique, and pedidos use autoincrement IDs. Re-running the seed would
    // collide on `folio` and accumulate duplicate pedidos, so only seed the
    // demo orders/quotations when their folios are not already present.
    const existingDemoCotizaciones = await prisma.cotizaciones.count({
      where: { folio: { in: demoCotizaciones.map((c) => c.folio) } },
    });

    if (existingDemoCotizaciones > 0) {
      console.log("Demo cotizaciones already seeded, skipping");
    } else {
      // Capture the actual autoincrement IDs instead of assuming 1..N.
      const createdPedidoIds: number[] = [];
      for (const pedido of demoPedidos) {
        const created = await prisma.pedidos.create({
          data: {
            cliente: {
              connect: {
                id_cliente: pedido.id_cliente,
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
            nombre_oportunidad: pedido.nombre_oportunidad,
          },
        });
        createdPedidoIds.push(created.id_pedido);
      }

      const cotizacionesData = demoCotizaciones.map((cotizacion, index) => ({
        ...cotizacion,
        id_pedido: createdPedidoIds[index],
      }));

      await prisma.cotizaciones.createMany({ data: cotizacionesData });
      console.log(`Seeded ${cotizacionesData.length} demo cotizaciones`);
    }
  }

  // ── Demo DetallePedido ────────────────────────────────────────────────────
  // Runs outside the cotizaciones idempotency guard so that re-running the
  // seed on a DB that already has COT-001…COT-008 still populates detalles.
  // Resolves pedido IDs from the cotizacion folios rather than assuming 1..8.
  {
    const demoCotizFolios = [
      "COT-001",
      "COT-002",
      "COT-003",
      "COT-004",
      "COT-005",
      "COT-006",
      "COT-007",
      "COT-008",
      "COT-009",
      "COT-010",
      "COT-011",
      "COT-012",
    ];

    const demoCotizRows = await prisma.cotizaciones.findMany({
      where: { folio: { in: demoCotizFolios } },
      select: { folio: true, id_pedido: true },
      orderBy: { folio: "asc" }, // COT-001 → index 0, COT-008 → index 7
    });

    if (demoCotizRows.length === 12 && demoCotizRows.every((c) => c.id_pedido !== null)) {
      const pids = demoCotizRows.map((c) => c.id_pedido!);

      const existingDetallesCount = await prisma.detallePedido.count({
        where: { id_pedido: { in: pids } },
      });

      if (existingDetallesCount === 0) {
        // Re-fetch the status map in case we're outside the block that built it
        const statusRowsLocal = await prisma.estatusPedidos.findMany();
        const smLocal: Record<string, number> = {};
        statusRowsLocal.forEach((s) => {
          smLocal[s.descripcion] = s.id_estatus;
        });

        const detallesDemo = [
          // Pedido COT-001 (Pendiente): Corte Láser + Grabado Láser
          {
            id_pedido: pids[0],
            id_servicio: servicioCorte.id_servicio,
            id_material: material.id_material,
            id_archivo: 1,
            cantidad: 5,
            responsable_recoleccion: "Grupo Empresarial NL",
            precio_unitario: 25.0,
            subtotal: 125.0,
          },
          {
            id_pedido: pids[0],
            id_servicio: servicioGrabado.id_servicio,
            id_material: materialAcrilico.id_material,
            id_archivo: 1,
            cantidad: 3,
            responsable_recoleccion: "Grupo Empresarial NL",
            precio_unitario: 30.0,
            subtotal: 90.0,
          },

          // Pedido COT-002 (En producción): Corte Láser + Bordado
          {
            id_pedido: pids[1],
            id_servicio: servicioCorte.id_servicio,
            id_material: material.id_material,
            id_archivo: 1,
            id_estatus: smLocal["En producción"],
            cantidad: 10,
            responsable_recoleccion: "Laura Rodríguez Vega",
            precio_unitario: 20.0,
            subtotal: 200.0,
          },
          {
            id_pedido: pids[1],
            id_servicio: servicioBordado.id_servicio,
            id_material: materialTela.id_material,
            id_archivo: 1,
            cantidad: 6,
            responsable_recoleccion: "Laura Rodríguez Vega",
            precio_unitario: 45.0,
            subtotal: 270.0,
          },

          // Pedido COT-003 (Finalizado): Grabado Láser acrílico
          {
            id_pedido: pids[2],
            id_servicio: servicioGrabado.id_servicio,
            id_material: materialAcrilico.id_material,
            id_archivo: 1,
            id_estatus: smLocal["Finalizado"],
            cantidad: 4,
            responsable_recoleccion: "Publicidad Del Valle",
            precio_unitario: 55.0,
            subtotal: 220.0,
          },

          // Pedido COT-004 (Entregado): Rotulación de vinil + Bordado
          {
            id_pedido: pids[3],
            id_servicio: servicioRotulacion.id_servicio,
            id_material: materialVinil.id_material,
            id_archivo: 1,
            id_estatus: smLocal["Entregado"],
            cantidad: 8,
            responsable_recoleccion: "Grupo Empresarial NL",
            precio_unitario: 80.0,
            subtotal: 640.0,
          },
          {
            id_pedido: pids[3],
            id_servicio: servicioBordado.id_servicio,
            id_material: materialTela.id_material,
            id_archivo: 1,
            id_estatus: smLocal["Entregado"],
            cantidad: 12,
            responsable_recoleccion: "Grupo Empresarial NL",
            precio_unitario: 45.0,
            subtotal: 540.0,
          },

          // Pedido COT-005 (Cancelado): Corte Láser
          {
            id_pedido: pids[4],
            id_servicio: servicioCorte.id_servicio,
            id_material: material.id_material,
            id_archivo: 1,
            id_estatus: smLocal["Cancelado"],
            cantidad: 2,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 25.0,
            subtotal: 50.0,
          },

          // Pedido COT-006 (Pendiente): Corte Láser + Rotulación de vinil
          {
            id_pedido: pids[5],
            id_servicio: servicioCorte.id_servicio,
            id_material: material.id_material,
            id_archivo: 1,
            cantidad: 7,
            responsable_recoleccion: "Laura Rodríguez Vega",
            precio_unitario: 25.0,
            subtotal: 175.0,
          },
          {
            id_pedido: pids[5],
            id_servicio: servicioRotulacion.id_servicio,
            id_material: materialVinil.id_material,
            id_archivo: 1,
            cantidad: 3,
            responsable_recoleccion: "Laura Rodríguez Vega",
            precio_unitario: 80.0,
            subtotal: 240.0,
          },

          // Pedido COT-007 (Pendiente): Bordado gorras
          {
            id_pedido: pids[6],
            id_servicio: servicioBordado.id_servicio,
            id_material: materialTela.id_material,
            id_archivo: 1,
            cantidad: 20,
            responsable_recoleccion: "Publicidad Del Valle",
            precio_unitario: 40.0,
            subtotal: 800.0,
          },

          // Pedido COT-008 (Pendiente): Grabado Láser + Rotulación de vinil
          {
            id_pedido: pids[7],
            id_servicio: servicioGrabado.id_servicio,
            id_material: material.id_material,
            id_archivo: 1,
            cantidad: 2,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 30.0,
            subtotal: 60.0,
          },
          {
            id_pedido: pids[7],
            id_servicio: servicioRotulacion.id_servicio,
            id_material: materialVinil.id_material,
            id_archivo: 1,
            cantidad: 5,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 80.0,
            subtotal: 400.0,
          },
          // Pedido COT-009 (Finalizado)
          {
            id_pedido: pids[8],
            id_servicio: 1,
            id_material: 1,
            id_archivo: 1,
            id_estatus: smLocal["Finalizado"],
            cantidad: 15,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 360.0,
            subtotal: 5400.0,
          },
          // Pedido COT-010 (Entregado)
          {
            id_pedido: pids[9],
            id_servicio: 3,
            id_material: 3,
            id_archivo: 1,
            id_estatus: smLocal["Entregado"],
            cantidad: 200,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 41.0,
            subtotal: 8200.0,
          },
          // Pedido COT-011 (Pendiente)
          {
            id_pedido: pids[10],
            id_servicio: 4,
            id_material: 4,
            id_archivo: 1,
            cantidad: 50,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 90.0,
            subtotal: 4500.0,
          },
          // Pedido COT-012 (En producción)
          {
            id_pedido: pids[11],
            id_servicio: 2,
            id_material: 2,
            id_archivo: 1,
            id_estatus: smLocal["En producción"],
            cantidad: 100,
            responsable_recoleccion: "Cliente Demo",
            precio_unitario: 91.0,
            subtotal: 9100.0,
          },
        ];
        console.log(`Seeded ${detallesDemo.length} demo detalles de pedido`);

        // Seed some Pagos so the dashboard charts show revenue
        const pagosDemo = [
          // 2024
          {
            id_pedido: pids[8], // COT-009
            fecha: new Date("2024-05-15"),
            monto_pago: 5400.0,
            metodo_pago: "transferencia",
            estatus_pago: "Pagado",
          },
          // 2025 Q1
          {
            id_pedido: pids[9], // COT-010
            fecha: new Date("2025-02-20"),
            monto_pago: 8200.0,
            metodo_pago: "efectivo",
            estatus_pago: "Pagado",
          },
          // 2025 Q3
          {
            id_pedido: pids[10], // COT-011
            fecha: new Date("2025-08-25"),
            monto_pago: 4500.0,
            metodo_pago: "transferencia",
            estatus_pago: "Pagado",
          },
          // 2025 Fin de año
          {
            id_pedido: pids[11], // COT-012
            fecha: new Date("2025-11-10"),
            monto_pago: 9100.0,
            metodo_pago: "Mercado Pago",
            estatus_pago: "Pagado",
          },
          // Current year 2026 (COT-002 and COT-004)
          {
            id_pedido: pids[1], // COT-002
            fecha: new Date("2026-04-18"),
            monto_pago: 2500.0,
            metodo_pago: "efectivo",
            estatus_pago: "Pagado",
          },
          {
            id_pedido: pids[3], // COT-004
            fecha: new Date("2026-04-22"),
            monto_pago: 2200.0,
            metodo_pago: "transferencia",
            estatus_pago: "Pagado",
          },
        ];

        await prisma.pagos.createMany({ data: pagosDemo });
        console.log(`Seeded ${pagosDemo.length} demo pagos`);
      } else {
        console.log("Demo detalles already seeded, skipping");
      }

      const existingPedidoMaquinasCount = await prisma.pedidoMaquina.count({
        where: {
          id_pedido: {
            in: pids,
          },
        },
      });

      if (existingPedidoMaquinasCount === 0) {
        await prisma.pedidoMaquina.createMany({
          data: [
            {
              id_pedido: pids[0],
              id_maquina: maquina.id_maquina,
              id_material: material.id_material,
              id_usuario_asigno: adminUser.id_usuario,
              fecha_asignacion: new Date("2026-04-13"),
            },
            {
              id_pedido: pids[1],
              id_maquina: maquina.id_maquina,
              id_material: material.id_material,
              id_usuario_asigno: adminUser.id_usuario,
              fecha_asignacion: new Date("2026-04-15"),
            },
            {
              id_pedido: pids[5],
              id_maquina: maquina.id_maquina,
              id_material: material.id_material,
              id_usuario_asigno: adminUser.id_usuario,
              fecha_asignacion: new Date("2026-04-22"),
            },
            {
              id_pedido: pids[7],
              id_maquina: maquina.id_maquina,
              id_material: material.id_material,
              id_usuario_asigno: adminUser.id_usuario,
              fecha_asignacion: new Date("2026-04-24"),
            },
          ],
        });

        console.log("Seeded demo PedidoMaquina assignments");
      } else {
        console.log("Demo PedidoMaquina assignments already seeded, skipping");
      }
    }
  }

  // ── PE-01: Orden de Compra Interna — seed data ──────────────────────────────
  //
  // Provides a realistic Pedido (id=9) with two DetallePedido that exercise
  // both tercero paths recognised by getOrderThirdParties:
  //
  //   Detalle 1 → Servicio 1 (Corte Láser)
  //               ProveedorPrecios(id_proveedor=6, id_servicio=1) @ $2.10
  //               → proveedorMap[6] = Mi Marca Vende SS de CV
  //
  //   Detalle 2 → Servicio 5 (Instalación de Señalética)
  //               InstaladorServicios(id_instalador=5, id_servicio=5) @ $320
  //               → instaladorMap[5] = Rotulaciones Flores
  //
  // POST /api/pedidos/9/orden-compra-interna produces the multi-PDF response.
  // Remove one of the two detalles from the DB to test the single-PDF path.

  // 1. Proveedor ─────────────────────────────────────────────────────────────
  const proveedorMiMarca = await prisma.proveedores.upsert({
    where: { id_proveedor: 6 },
    update: {},
    create: {
      id_proveedor: 6,
      nombre_proveedor: "Mi Marca Vende SS de CV",
      apodo: "Mi Marca Vende",
      tipo: "Proveedor de servicio",
      telefono: "442 128 2467",
      correo: "ideas@mimarcavende.com",
      descripcion_proveedor: "Servicios de grabado y personalización de productos.",
      ubicacion: "Querétaro, Querétaro",
      estatus: "Activo",
    },
  });

  // 2. Instalador ────────────────────────────────────────────────────────────
  const instaladorPE01 = await prisma.instaladores.upsert({
    where: { id_instalador: 5 },
    update: {},
    create: {
      id_instalador: 5,
      nombre_instalador: "Rotulaciones Flores",
      apodo: "Flores",
      tipo: "Instalador",
      telefono: "442 897 6543",
      correo: "contacto@rotulacionesflores.mx",
      costo_instalacion: 320.0,
      notas: "Especialista en instalación de señalética y rotulación exterior.",
      ubicacion: "Querétaro, Querétaro",
      estatus: "Activo",
    },
  });

  // 5. Servicio "Instalación de Señalética" at id=5.
  //    id=2 is already owned by "Grabado Láser" (seeded above), so PE-01 uses
  //    the next available ID. InstaladorServicios for Rotulaciones Flores links
  //    to this service, and the direct id_proveedor FK points to Mi Marca Vende.
  const servicioSenaletica = await prisma.servicios.upsert({
    where: { id_servicio: 5 },
    update: {},
    create: {
      id_servicio: 5,
      id_estatus: estatusServicioActivo.id_estatus_servicio,
      id_sucursal: sucursal.id_sucursal,
      nombre_servicio: "Instalación de Señalética",
      descripcion_servicio: "Instalación de señalética interior y exterior.",
      estatus_servicio: true,
      id_proveedor: proveedorMiMarca.id_proveedor,
    },
  });

  // 3. ProveedorPrecios: Mi Marca Vende → Corte Láser @ $2.10 (path B)
  await prisma.proveedorPrecios.upsert({
    where: {
      id_proveedor_id_servicio: {
        id_proveedor: proveedorMiMarca.id_proveedor,
        id_servicio: servicioCorte.id_servicio,
      },
    },
    update: {},
    create: {
      id_proveedor: proveedorMiMarca.id_proveedor,
      id_servicio: servicioCorte.id_servicio,
      precio: 2.1,
      notas: "Precio por cm² de personalización",
    },
  });

  // 4. InstaladorServicios: Rotulaciones Flores → Instalación de Señalética @ $320 (path B)
  await prisma.instaladorServicios.upsert({
    where: {
      id_instalador_id_servicio: {
        id_instalador: instaladorPE01.id_instalador,
        id_servicio: servicioSenaletica.id_servicio,
      },
    },
    update: {},
    create: {
      id_instalador: instaladorPE01.id_instalador,
      id_servicio: servicioSenaletica.id_servicio,
      costo: 320.0,
      notas: "Costo fijo de instalación por servicio",
    },
  });

  console.log(
    "Seeded PE-01: Mi Marca Vende (proveedor), Rotulaciones Flores (instalador), " +
      "Instalación de Señalética (servicio id=5), ProveedorPrecios @ $2.10, InstaladorServicios @ $320"
  );

  // 6. Pedido id=9 with two DetallePedido ────────────────────────────────────
  // Upsert with an explicit PK forces PedidosUncheckedCreateInput — use raw FK
  // integers instead of relation-connect syntax.
  const pe01StatusPendiente = await prisma.estatusPedidos.findUniqueOrThrow({
    where: { descripcion: "Pendiente" },
  });
  const pe01EstadoCotizacion = await prisma.estadoFacturaPedido.findUniqueOrThrow({
    where: { descripcion: "Cotizacion" },
  });

  const pedidoPE01 = await prisma.pedidos.upsert({
    where: { id_pedido: 9 },
    update: {},
    create: {
      id_pedido: 9,
      id_cliente: 1,
      id_sucursal: sucursal.id_sucursal,
      id_estatus: pe01StatusPendiente.id_estatus,
      id_estado_factura: pe01EstadoCotizacion.id_estado_factura,
      notas: "PE-01: Pedido de prueba para generación de Orden de Compra Interna",
      fecha_creacion: new Date("2026-05-22"),
    },
  });

  // Detalles — idempotent via per-pedido count so re-running the seed does not
  // create duplicate rows. Explicit IDs are intentionally avoided here because
  // the DetallePedido backfill below uses auto-increment and would collide if
  // those IDs were already taken.
  const pe01DetalleCount = await prisma.detallePedido.count({
    where: { id_pedido: pedidoPE01.id_pedido },
  });
  if (pe01DetalleCount === 0) {
    // Detalle 1 — Corte Láser × 5
    // Grouped under proveedorMap[6] via ProveedorPrecios(id_servicio=1), path B.
    await prisma.detallePedido.create({
      data: {
        id_pedido: pedidoPE01.id_pedido,
        id_servicio: servicioCorte.id_servicio,
        id_material: material.id_material,
        id_archivo: 1,
        cantidad: 5,
        responsable_recoleccion: "Cliente Demo",
        precio_unitario: 25.0,
        subtotal: 125.0,
      },
    });
    // Detalle 2 — Instalación de Señalética × 2
    // Grouped under instaladorMap[5] via InstaladorServicios(id_servicio=5), path B.
    await prisma.detallePedido.create({
      data: {
        id_pedido: pedidoPE01.id_pedido,
        id_servicio: servicioSenaletica.id_servicio,
        id_material: material.id_material,
        id_archivo: 1,
        cantidad: 2,
        responsable_recoleccion: "Cliente Demo",
        precio_unitario: 320.0,
        subtotal: 640.0,
      },
    });
  }

  console.log(
    `Seeded PE-01 Pedido id=${pedidoPE01.id_pedido} with 2 detalles ` +
      "(Corte Láser → Mi Marca Vende | Instalación de Señalética → Rotulaciones Flores)"
  );

  // ── Backfill DetallePedido for existing pedidos (PE-03 / PE-05) ────────────
  // Demo pedidos are seeded as headers only. Without line items the
  // "Semáforo de servicios" (PE-03) renders empty and the order detail modal
  // (PE-05) shows zero products. Seed a few detalles per pedido, spread across
  // servicios and statuses so the semaphore is populated.
  // Idempotent: only backfills pedidos that have NO detalles yet, so
  // re-running the seed skips already-filled pedidos (including PE-01 above).
  const pedidosWithoutDetalles = await prisma.pedidos.findMany({
    where: { detalles: { none: {} } },
    orderBy: { id_pedido: "asc" },
  });

  if (pedidosWithoutDetalles.length === 0) {
    console.log("All pedidos already have detalles, skipping detalle backfill");
  } else {
    const orderStatusRowsForDetalle = await prisma.estatusPedidos.findMany();

    const statusByName: Record<string, number> = {};
    orderStatusRowsForDetalle.forEach((s) => (statusByName[s.descripcion] = s.id_estatus));

    const statusCycle = ["Pendiente", "En producción", "Finalizado", "Entregado", "Cancelado"];
    const servicioCycle = [
      servicioCorte.id_servicio,
      servicioGrabado.id_servicio,
      servicioBordado.id_servicio,
      servicioRotulacion.id_servicio,
    ];

    const materialCycle = [
      material.id_material,
      materialAcrilico.id_material,
      materialTela.id_material,
      materialVinil.id_material,
    ];

    let detallesCreated = 0;

    for (const [pedidoIndex, pedido] of pedidosWithoutDetalles.entries()) {
      const lineCount = 2 + (pedidoIndex % 2); // 2 or 3 line items per pedido

      for (let line = 0; line < lineCount; line++) {
        const idx = pedidoIndex + line;
        const cantidad = 1 + (idx % 5);
        const precioUnitario = 250 + (idx % 4) * 125;

        await prisma.detallePedido.create({
          data: {
            id_pedido: pedido.id_pedido,
            id_servicio: servicioCycle[idx % servicioCycle.length],
            id_material: materialCycle[idx % materialCycle.length],
            id_archivo: 1, // placeholder design (seeded above)
            id_estatus: statusByName[statusCycle[idx % statusCycle.length]] ?? null,
            cantidad,
            responsable_recoleccion: "Demo Recolector",
            notas: "Detalle demo",
            precio_unitario: precioUnitario,
            subtotal: precioUnitario * cantidad,
          },
        });

        detallesCreated++;
      }
    }

    console.log(`Seeded ${detallesCreated} demo DetallePedido rows`);
  }

  // ── Backfill PedidoMaquina for MET-07 ──────────────────────────────────────
  const countPM = await prisma.pedidoMaquina.count();
  if (countPM === 0) {
    const allDetalles = await prisma.detallePedido.findMany();
    const allMaquinas = await prisma.maquinas.findMany();
    const adminUserL = await prisma.usuarios.findFirst();

    if (allMaquinas.length > 0 && adminUserL) {
      const pmsToCreate = allDetalles.map((d, index) => ({
        id_pedido: d.id_pedido,
        id_maquina: allMaquinas[index % allMaquinas.length].id_maquina,
        id_material: d.id_material,
        id_usuario_asigno: adminUserL.id_usuario,
      }));
      await prisma.pedidoMaquina.createMany({ data: pmsToCreate });
      console.log(`Seeded ${pmsToCreate.length} demo PedidoMaquina rows for MET-07`);
    }
  }

  await resyncSequences();
}

// Seeding with explicit primary keys (id_*: 1, 2, ...) does NOT advance
// Postgres' autoincrement sequences, so the next sequence-driven INSERT
// collides with a seeded row (P2002 on the PK). Realign every owned
// sequence to MAX(id) of its column so subsequent creates pick fresh IDs.
async function resyncSequences(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
      maxid BIGINT;
    BEGIN
      FOR r IN
        SELECT
          quote_ident(sn.nspname) || '.' || quote_ident(s.relname) AS seqfqn,
          t.relname AS tablename,
          a.attname AS colname
        FROM pg_class s
        JOIN pg_namespace sn ON sn.oid = s.relnamespace
        JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
        JOIN pg_class t ON t.oid = d.refobjid
        JOIN pg_namespace tn ON tn.oid = t.relnamespace AND tn.nspname = 'public'
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
        WHERE s.relkind = 'S' AND t.relkind = 'r'
      LOOP
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.colname, r.tablename) INTO maxid;
        EXECUTE format('SELECT setval(%L, %s, %L)', r.seqfqn, GREATEST(maxid, 1), maxid > 0);
      END LOOP;
    END $$;
  `);
  console.log("Resynced autoincrement sequences");
}

function colaboradorRoleForSistema(roles: Roles[]): Roles {
  const r = roles.find((x) => x.nombre_rol === "Colaborador");
  if (!r) throw new Error("Rol Colaborador no existe — seed roles primero");
  return r;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
