import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateSucursalSchema } from "@/lib/schemas/sucursales";
import {listSucursales,createSucursal,getSucursalesOptions} from "@/lib/services/sucursales";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion", "Administrador"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // Options mode: minimal payload for dropdowns. Active branches only.
    if (mode === "options") {
      const data = await getSucursalesOptions();
      return NextResponse.json({ data });
    }

    // Default mode: paginated full list (used by /admin/sucursales when implemented).
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listSucursales(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion"], async (req: NextRequest) => {
  try {
    const body = CreateSucursalSchema.parse(await req.json());
    return created(await createSucursal(body));
  } catch (err) {
    return handleError(err);
  }
});