import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando simulación de datos...');

  // 1. Obtener datos base existentes
  const cliente = await prisma.clientes.findFirst();
  const sucursal = await prisma.sucursales.findFirst();
  const estatusPedido = await prisma.estatusPedidos.findFirst({ where: { descripcion: 'Pendiente' } });
  const estatusCotizacion = await prisma.estatusCotizacion.findFirst({ where: { descripcion: 'Validada' } });
  
  const servicios = await prisma.servicios.findMany({ take: 3 });
  const materiales = await prisma.materiales.findMany({ take: 3 });

  if (!cliente || !sucursal || !estatusPedido || !estatusCotizacion || servicios.length === 0 || materiales.length === 0) {
    console.error('Faltan datos en los catálogos base para crear la simulación.');
    process.exit(1);
  }

  // 2. Crear un Archivo de Diseño ficticio
  const archivo = await prisma.archivosDisenio.create({
    data: {
      nombre_archivo: 'diseno_mockup.pdf',
      url_archivo: 'https://example.com/diseno.pdf',
      formato: 'pdf'
    }
  });

  // 3. Crear el Pedido (Draft)
  const pedido = await prisma.pedidos.create({
    data: {
      id_cliente: cliente.id_cliente,
      id_sucursal: sucursal.id_sucursal,
      id_estatus: estatusPedido.id_estatus,
      notas: 'Pedido simulado con múltiples servicios para visualizar la Orden de Trabajo.',
    }
  });

  // 4. Agregar Detalles al Pedido (Servicios variados)
  const detallesData = [
    {
      id_pedido: pedido.id_pedido,
      id_servicio: servicios[0].id_servicio,
      id_material: materiales[0].id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { corte: 'Láser', acabado: 'Pulido' },
      cantidad: 50,
      responsable_recoleccion: 'Cliente',
      precio_unitario: 120.50,
      subtotal: 6025.00
    },
    {
      id_pedido: pedido.id_pedido,
      id_servicio: servicios[1]?.id_servicio || servicios[0].id_servicio,
      id_material: materiales[1]?.id_material || materiales[0].id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { color: 'Rojo' },
      cantidad: 15,
      responsable_recoleccion: 'Mensajería',
      precio_unitario: 350.00,
      subtotal: 5250.00
    },
    {
      id_pedido: pedido.id_pedido,
      id_servicio: servicios[2]?.id_servicio || servicios[0].id_servicio,
      id_material: materiales[2]?.id_material || materiales[0].id_material,
      id_archivo: archivo.id_archivo,
      opciones_seleccionadas: { extra: 'Urgente' },
      cantidad: 1,
      responsable_recoleccion: 'Cliente',
      precio_unitario: 1500.00,
      subtotal: 1500.00
    }
  ];

  await prisma.detallePedido.createMany({
    data: detallesData
  });

  // 5. Crear la Cotización vinculada
  const montoTotal = detallesData.reduce((acc, curr) => acc + curr.subtotal, 0);

  const cotizacion = await prisma.cotizaciones.create({
    data: {
      id_cliente: cliente.id_cliente,
      id_pedido: pedido.id_pedido,
      id_estatus_cotizacion: estatusCotizacion.id_estatus,
      monto_total: montoTotal,
      folio: `OT-SIM-${Math.floor(Math.random() * 1000)}`,
      notas: 'Cotización para simulación completa de Orden de Trabajo.',
    }
  });

  console.log('Simulación creada exitosamente.');
  console.log(`\n¡Listo! Ahora puedes visitar la siguiente URL para ver el PDF completo:`);
  console.log(`http://localhost:3000/api/cotizaciones/${cotizacion.id_cotizacion}/work-order\n`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
