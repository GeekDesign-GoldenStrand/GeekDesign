import { prisma } from "@/lib/db/client";

export async function getIngresosMensualesPorAno(year: number) {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year + 1, 0, 1));

  let pagos;
  try {
    pagos = await prisma.pagos.findMany({
      where: {
        estatus_pago: "Pagado",
        fecha: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        fecha: true,
        monto_pago: true,
      },
    });
  } catch (error) {
    console.error("Error al obtener pagos para ingresos mensuales:", error);
    throw new Error("No se pudieron cargar las métricas en este momento.");
  }

  // Initialize all 12 months with 0
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const monthlyData = meses.map((mes, index) => ({
    name: mes,
    ingresos: 0,
    mes_num: index,
  }));

  for (const pago of pagos) {
    const monthIndex = pago.fecha.getUTCMonth();
    monthlyData[monthIndex].ingresos += Number(pago.monto_pago);
  }

  return monthlyData;
}

export interface DashboardData {
  name: string;
  ingresos: number;
  mes_num: number;
}

export type MetricasDashboardData = Record<number, DashboardData[]>;

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export async function getMetricasDashboard(): Promise<MetricasDashboardData> {
  let pagos;
  try {
    pagos = await prisma.pagos.findMany({
      where: {
        estatus_pago: "Pagado",
      },
      select: {
        fecha: true,
        monto_pago: true,
      },
    });
  } catch (error) {
    console.error("Error al obtener métricas del dashboard:", error);
    throw new Error("No se pudieron cargar las métricas en este momento.");
  }

  const rawData: Record<number, Record<number, number>> = {};

  for (const pago of pagos) {
    // using local time or UTC based on how dates are saved? Prisma returns Date objects.
    // Usually getUTCFullYear() is safer for financial data.
    const year = pago.fecha.getUTCFullYear();
    const month = pago.fecha.getUTCMonth();

    if (!rawData[year]) {
      rawData[year] = {};
    }
    if (!rawData[year][month]) {
      rawData[year][month] = 0;
    }
    rawData[year][month] += Number(pago.monto_pago);
  }

  if (Object.keys(rawData).length === 0) {
    const currentYear = new Date().getUTCFullYear();
    const currentData: DashboardData[] = [];
    for (let i = 0; i < 12; i++) {
      currentData.push({
        name: MONTHS[i],
        mes_num: i,
        ingresos: 0,
      });
    }
    return { [currentYear]: currentData };
  }

  const result: MetricasDashboardData = {};

  for (const [yearStr, monthMap] of Object.entries(rawData)) {
    const year = Number(yearStr);
    result[year] = [];
    for (let i = 0; i < 12; i++) {
      result[year].push({
        name: MONTHS[i],
        mes_num: i,
        ingresos: monthMap[i] || 0,
      });
    }
  }

  return result;
}

// ── Top clientes por ingresos ────────────────────────────────────────────────

export interface ClienteScopeStats {
  total: number;
  numPedidos: number;
}

export interface TopClienteData {
  id_cliente: number;
  nombre: string;
  empresa: string | null;
  categoria: string | null;
  // All-time totals (scope "todos los años").
  total: number;
  numPedidos: number;
  // Per-year breakdown so the client can re-rank by a single year without a round trip.
  porAno: Record<number, ClienteScopeStats>;
}

export interface TopClientesResult {
  // Full revenue-ranked list (all-time, desc). The UI slices its own Top 10 per scope.
  clientes: TopClienteData[];
  availableYears: number[];
}

export async function getTopClientes(): Promise<TopClientesResult> {
  let pagos;
  try {
    pagos = await prisma.pagos.findMany({
      where: { estatus_pago: "Pagado" },
      select: {
        fecha: true,
        monto_pago: true,
        id_pedido: true,
        pedido: {
          select: {
            id_cliente: true,
            cliente: {
              select: { nombre_cliente: true, empresa: true, categoria: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener el top de clientes:", error);
    throw new Error("No se pudieron cargar las métricas en este momento.");
  }

  interface Acc {
    id_cliente: number;
    nombre: string;
    empresa: string | null;
    categoria: string | null;
    total: number;
    pedidos: Set<number>;
    porAno: Map<number, { total: number; pedidos: Set<number> }>;
  }

  const byCliente = new Map<number, Acc>();
  const years = new Set<number>();

  for (const pago of pagos) {
    const pedido = pago.pedido;
    if (!pedido) continue; // defensive: a payment with no parent order can't be attributed
    const id = pedido.id_cliente;
    const year = pago.fecha.getUTCFullYear();
    const monto = Number(pago.monto_pago);
    years.add(year);

    let acc = byCliente.get(id);
    if (!acc) {
      acc = {
        id_cliente: id,
        nombre: pedido.cliente?.nombre_cliente ?? "Cliente desconocido",
        empresa: pedido.cliente?.empresa ?? null,
        categoria: pedido.cliente?.categoria ?? null,
        total: 0,
        pedidos: new Set<number>(),
        porAno: new Map(),
      };
      byCliente.set(id, acc);
    }

    acc.total += monto;
    acc.pedidos.add(pago.id_pedido);

    let yearStats = acc.porAno.get(year);
    if (!yearStats) {
      yearStats = { total: 0, pedidos: new Set<number>() };
      acc.porAno.set(year, yearStats);
    }
    yearStats.total += monto;
    yearStats.pedidos.add(pago.id_pedido);
  }

  const clientes: TopClienteData[] = Array.from(byCliente.values())
    .map((c) => {
      const porAno: Record<number, ClienteScopeStats> = {};
      for (const [year, stats] of c.porAno) {
        porAno[year] = { total: stats.total, numPedidos: stats.pedidos.size };
      }
      return {
        id_cliente: c.id_cliente,
        nombre: c.nombre,
        empresa: c.empresa,
        categoria: c.categoria,
        total: c.total,
        numPedidos: c.pedidos.size,
        porAno,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    clientes,
    availableYears: Array.from(years).sort((a, b) => b - a),
  };
}
