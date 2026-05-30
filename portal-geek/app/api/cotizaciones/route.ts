import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withSection } from "@/lib/auth/guards";
import { CreateCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { listCotizaciones, createCotizacion } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// Helper para respuesta paginada
export function paginated<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    data: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// GET endpoint: lists cotizaciones with filters and pagination
export const GET = withSection("cotizaciones", "read", async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  // Pagination parameters: default page=1, pageSize=13. Cap at 100 to prevent
  // unbounded result-set memory blow-ups (D1: a hostile pageSize=1_000_000
  // would otherwise materialize the full cotizaciones × detalles graph).
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 13)));

  // Optional filters: client, company, multiple status values, and fecha_fin range
  const cliente = searchParams.get("cliente") ?? undefined;
  const empresa = searchParams.get("empresa") ?? undefined;
  const estatus = searchParams.getAll("estatus"); // can appear multiple times
  const search = searchParams.get("search") ?? undefined;
  const fechaFinDesde = searchParams.get("fechaFinDesde") ?? undefined;
  const fechaFinHasta = searchParams.get("fechaFinHasta") ?? undefined;

  try {
    const { items, total } = await listCotizaciones(page, pageSize, {
      cliente,
      empresa,
      estatus: estatus.length > 0 ? estatus : undefined,
      search,
      fechaFinDesde,
      fechaFinHasta,
    });

    return NextResponse.json(paginated(items, total, page, pageSize));
  } catch (err) {
    return handleError(err);
  }
});

// POST endpoint: creates a new cotizacion
export const POST = withSection("cotizaciones", "write", async (req: NextRequest) => {
  try {
    // Validate request body against schema
    const body = CreateCotizacionSchema.parse(await req.json());

    // Create cotizacion and return created response
    return created(await createCotizacion(body));
  } catch (err) {
    // Centralized error handling
    return handleError(err);
  }
});
