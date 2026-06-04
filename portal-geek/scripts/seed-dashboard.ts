import "dotenv/config";
import { prisma } from "../lib/db/client";

async function main() {
  console.warn("Seeding dashboard data...");

  // 1. Asegurar que haya un cliente
  let cliente = await prisma.clientes.findFirst({
    where: { correo_electronico: "dummy@dashboard.com" },
  });
  if (!cliente) {
    cliente = await prisma.clientes.create({
      data: {
        nombre_cliente: "Cliente Dashboard Dummy",
        correo_electronico: "dummy@dashboard.com",
        numero_telefono: "1234567890",
      },
    });
  }

  // 2. Asegurar que haya un estatus
  let estatus = await prisma.estatusPedidos.findFirst();
  if (!estatus) {
    estatus = await prisma.estatusPedidos.create({
      data: {
        descripcion: "Nuevo",
      },
    });
  }

  // 3. Generar pagos para 2024, 2025 y 2026
  let count = 0;
  for (const year of [2024, 2025, 2026]) {
    for (let month = 0; month < 12; month++) {
      // De 2 a 5 pagos por mes para darle variabilidad
      const pagosMes = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < pagosMes; i++) {
        // Montos entre 5,000 y 45,000
        const monto = 5000 + Math.floor(Math.random() * 40000);

        const fecha = new Date(Date.UTC(year, month, 10 + i));

        const pedido = await prisma.pedidos.create({
          data: {
            id_cliente: cliente.id_cliente,
            id_estatus: estatus.id_estatus,
            fecha_creacion: fecha,
            factura: false,
            facturado: false,
          },
        });

        await prisma.pagos.create({
          data: {
            id_pedido: pedido.id_pedido,
            fecha: fecha,
            monto_pago: monto,
            metodo_pago: "transferencia",
            estatus_pago: "Pagado",
          },
        });
        count++;
      }
    }
  }

  console.warn(`Seed completed. Inserted ${count} orders and payments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
