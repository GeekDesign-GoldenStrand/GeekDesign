import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateMaquinaSchema } from "@/lib/schemas/maquinas";
import { listMaquinas, createMaquina, getMaquinasOptionsBySucursal } from "@/lib/services/maquinas";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion", "Administrador"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Branch-scoped mode: returns active machines for one branch (used by service form).
    const sucursalParam = searchParams.get("sucursal");
    if (sucursalParam) {
      const idSucursal = Number(sucursalParam);
      if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
        return NextResponse.json(
          { error: "El parámetro 'sucursal' debe ser un entero positivo" },
          { status: 400 }
        );
      }
      const data = await getMaquinasOptionsBySucursal(idSucursal);
      return NextResponse.json({ data });
    }

    // Default mode: paginated list of all machines (admin module, etc).
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const result = await listMaquinas(page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion"], async (req: NextRequest) => {
  try {
    const body = CreateMaquinaSchema.parse(await req.json());
    return created(await createMaquina(body));
  } catch (err) {
    return handleError(err);
  }
});
