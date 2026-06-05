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
