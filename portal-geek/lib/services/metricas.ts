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

export interface MaquinaMetric {
  id_maquina: number;
  nombre_maquina: string;
  apodo_maquina: string;
  veces_usada: number;
}

export type MetricasMaquinasData = Record<number, Record<number, MaquinaMetric[]>>;

export async function getMetricasMaquinas(): Promise<MetricasMaquinasData> {
  let detalles;
  try {
    detalles = await prisma.detallePedido.findMany({
      where: {
        estatus: {
          descripcion: { in: ["Entregado", "Finalizado"] },
        },
      },
      include: {
        pedido: {
          include: {
            pedidoMaquinas: {
              include: {
                maquina: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener métricas de máquinas:", error);
    throw new Error("No se pudieron cargar las métricas de máquinas en este momento.");
  }

  const rawData: Record<number, Record<number, Record<number, MaquinaMetric>>> = {};

  for (const detalle of detalles) {
    const dateToUse =
      detalle.fecha_modificacion || detalle.pedido.fecha_fin || detalle.pedido.fecha_creacion;
    const year = dateToUse.getUTCFullYear();
    const month = dateToUse.getUTCMonth();

    if (!rawData[year]) rawData[year] = {};
    if (!rawData[year][month]) rawData[year][month] = {};

    const maquinasAsignadas = detalle.pedido.pedidoMaquinas.filter(
      (pm) => pm.id_material === detalle.id_material
    );

    for (const pm of maquinasAsignadas) {
      const maqId = pm.id_maquina;
      if (!rawData[year][month][maqId]) {
        rawData[year][month][maqId] = {
          id_maquina: maqId,
          nombre_maquina: pm.maquina.nombre_maquina,
          apodo_maquina: pm.maquina.apodo_maquina,
          veces_usada: 0,
        };
      }
      rawData[year][month][maqId].veces_usada += 1;
    }
  }

  const result: MetricasMaquinasData = {};
  for (const yearStr of Object.keys(rawData)) {
    const year = Number(yearStr);
    result[year] = {};
    for (let i = 0; i < 12; i++) {
      const maquinasDict = rawData[year][i] || {};
      result[year][i] = Object.values(maquinasDict).sort((a, b) => b.veces_usada - a.veces_usada);
    }
  }

  if (Object.keys(result).length === 0) {
    const currentYear = new Date().getUTCFullYear();
    result[currentYear] = {};
    for (let i = 0; i < 12; i++) {
      result[currentYear][i] = [];
    }
  }

  return result;
}
