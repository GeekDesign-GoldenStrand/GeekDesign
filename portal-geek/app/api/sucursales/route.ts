import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateSucursalSchema } from "@/lib/schemas/sucursales";
import { listSucursales, createSucursal } from "@/lib/services/sucursales";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// Collection route for branches.
// Dirección is the only role allowed to list and create branches.
export const GET = withRole(["Direccion"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Normalize pagination values to avoid invalid or excessive queries.
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));

    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

    // Empty strings keep the service filters optional without passing undefined everywhere.
    const search = searchParams.get("search") ?? "";

    const nombre = searchParams.get("nombre") ?? "";

    const direccion = searchParams.get("direccion") ?? "";

    // getAll allows filtering by multiple statuses at the same time.
    const estatus = searchParams.getAll("estatus");

    const result = await listSucursales(page, pageSize, {
      search,
      nombre,
      direccion,
      estatus,
    });

    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion"], async (req: NextRequest) => {
  try {
    // Validate creation data before sending it to the service layer.
    // This keeps the database protected from malformed branch records.
    const body = CreateSucursalSchema.parse(await req.json());

    return created(await createSucursal(body));
  } catch (err) {
    return handleError(err);
  }
});
