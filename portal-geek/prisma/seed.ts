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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
