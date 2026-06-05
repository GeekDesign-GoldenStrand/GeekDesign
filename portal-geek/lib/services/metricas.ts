import { prisma } from "@/lib/db/client";

// Revenue is net: a "Pagado" payment adds, a "Reembolsado" refund subtracts.
const REVENUE_ESTATUS = ["Pagado", "Reembolsado"];

function montoNeto(pago: { estatus_pago: string; monto_pago: unknown }): number {
  const sign = pago.estatus_pago === "Reembolsado" ? -1 : 1;
  return sign * Number(pago.monto_pago);
}

export async function getIngresosMensualesPorAno(year: number) {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year + 1, 0, 1));

  let pagos;
  try {
    pagos = await prisma.pagos.findMany({
      where: {
        estatus_pago: { in: REVENUE_ESTATUS },
        fecha: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        fecha: true,
        monto_pago: true,
        estatus_pago: true,
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
    monthlyData[monthIndex].ingresos += montoNeto(pago);
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
        estatus_pago: { in: REVENUE_ESTATUS },
      },
      select: {
        fecha: true,
        monto_pago: true,
        estatus_pago: true,
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
    rawData[year][month] += montoNeto(pago);
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
      where: { estatus_pago: { in: REVENUE_ESTATUS } },
      select: {
        fecha: true,
        monto_pago: true,
        estatus_pago: true,
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
    const monto = montoNeto(pago);
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

// ── Ingresos por máquina ─────────────────────────────────────────────────────

export interface MaquinaScopeStats {
  total: number;
  numPedidos: number;
}

export interface IngresosMaquinaData {
  id_maquina: number;
  nombre: string;
  apodo: string | null;
  tipo: string | null;
  // All-time net income attributed to the machine.
  total: number;
  numPedidos: number;
  porAno: Record<number, MaquinaScopeStats>;
  // Monthly breakdown keyed `${year}-${month}` with month 0-11.
  porMes: Record<string, MaquinaScopeStats>;
}

export interface IngresosMaquinasResult {
  maquinas: IngresosMaquinaData[];
  availableYears: number[];
}

/**
 * Net income "generated" by each machine. Attribution = full: every machine
 * that participated in an order counts that order's full net income. Machines
 * are linked through the order's services (DetallePedido → Servicio →
 * ServicioMaquina), and de-duplicated so each order is counted once per machine.
 */
export async function getIngresosPorMaquina(): Promise<IngresosMaquinasResult> {
  let pagos;
  try {
    pagos = await prisma.pagos.findMany({
      where: { estatus_pago: { in: REVENUE_ESTATUS } },
      select: {
        fecha: true,
        monto_pago: true,
        estatus_pago: true,
        id_pedido: true,
        pedido: {
          select: {
            detalles: {
              select: {
                servicio: {
                  select: {
                    maquinas: {
                      select: {
                        id_maquina: true,
                        maquina: {
                          select: { nombre_maquina: true, apodo_maquina: true, tipo: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener ingresos por máquina:", error);
    throw new Error("No se pudieron cargar las métricas en este momento.");
  }

  interface Acc {
    id_maquina: number;
    nombre: string;
    apodo: string | null;
    tipo: string | null;
    total: number;
    pedidos: Set<number>;
    porAno: Map<number, { total: number; pedidos: Set<number> }>;
    porMes: Map<string, { total: number; pedidos: Set<number> }>;
  }

  const byMaquina = new Map<number, Acc>();
  const years = new Set<number>();

  for (const pago of pagos) {
    const pedido = pago.pedido;
    if (!pedido) continue;

    const year = pago.fecha.getUTCFullYear();
    const month = pago.fecha.getUTCMonth();
    const monthKey = `${year}-${month}`;
    const monto = montoNeto(pago);

    // Distinct machines that produced this order, gathered across its service
    // line items (the same machine reached via several services counts once).
    const maquinasDelPedido = new Map<
      number,
      { nombre_maquina: string; apodo_maquina: string | null; tipo: string | null }
    >();
    for (const detalle of pedido.detalles) {
      for (const sm of detalle.servicio.maquinas) {
        if (!maquinasDelPedido.has(sm.id_maquina)) {
          maquinasDelPedido.set(sm.id_maquina, sm.maquina);
        }
      }
    }
    if (maquinasDelPedido.size === 0) continue;

    years.add(year);

    for (const [idMaquina, maq] of maquinasDelPedido) {
      let acc = byMaquina.get(idMaquina);
      if (!acc) {
        acc = {
          id_maquina: idMaquina,
          nombre: maq.nombre_maquina,
          apodo: maq.apodo_maquina,
          tipo: maq.tipo,
          total: 0,
          pedidos: new Set<number>(),
          porAno: new Map(),
          porMes: new Map(),
        };
        byMaquina.set(idMaquina, acc);
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

      let monthStats = acc.porMes.get(monthKey);
      if (!monthStats) {
        monthStats = { total: 0, pedidos: new Set<number>() };
        acc.porMes.set(monthKey, monthStats);
      }
      monthStats.total += monto;
      monthStats.pedidos.add(pago.id_pedido);
    }
  }

  const maquinas: IngresosMaquinaData[] = Array.from(byMaquina.values())
    .map((m) => {
      const porAno: Record<number, MaquinaScopeStats> = {};
      for (const [year, stats] of m.porAno) {
        porAno[year] = { total: stats.total, numPedidos: stats.pedidos.size };
      }
      const porMes: Record<string, MaquinaScopeStats> = {};
      for (const [key, stats] of m.porMes) {
        porMes[key] = { total: stats.total, numPedidos: stats.pedidos.size };
      }
      return {
        id_maquina: m.id_maquina,
        nombre: m.nombre,
        apodo: m.apodo,
        tipo: m.tipo,
        total: m.total,
        numPedidos: m.pedidos.size,
        porAno,
        porMes,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    maquinas,
    availableYears: Array.from(years).sort((a, b) => b - a),
  };
}
