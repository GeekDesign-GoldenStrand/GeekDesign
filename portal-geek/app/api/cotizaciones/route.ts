import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { listCotizaciones, createCotizacion } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// GET endpoint: lists cotizaciones with filters and pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Pagination parameters: default page=1, pageSize=13
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 13);

  // Optional filters: client, company, and multiple status values
  const cliente = searchParams.get("cliente") ?? undefined;
  const empresa = searchParams.get("empresa") ?? undefined;
  const estatus = searchParams.getAll("estatus"); // can appear multiple times
  const search = searchParams.get("search") ?? undefined;

  // Query the database with filters and return paginated result
  const { items, total } = await listCotizaciones(page, pageSize, {
    cliente,
    empresa,
    estatus: estatus.length > 0 ? estatus : undefined,
    search,
  });

  return Response.json({ data: items, total });
}

// POST endpoint: creates a new cotizacion
export const POST = withRole(["Direccion"], async (req: NextRequest) => {
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
