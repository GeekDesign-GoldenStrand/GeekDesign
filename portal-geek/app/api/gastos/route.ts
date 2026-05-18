import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreateGastoSchema } from "@/lib/schemas/gastos";
import { listGastosByPedido, createGasto } from "@/lib/services/gastos";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// GET /api/gastos?pedidoId=1
export const GET = withRole(
  ["Direccion", "Administrador", "Finanzas"],
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const pedidoId = Number(searchParams.get("pedidoId") ?? 0);
      const page = Math.max(1, Number(searchParams.get("page") ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 50)));
      const result = await listGastosByPedido(pedidoId, page, pageSize);
      return paginated(result.items, result.total, page, pageSize);
    } catch (err) {
      return handleError(err);
    }
  }
);

export const POST = withRole(
  ["Direccion", "Administrador", "Finanzas"],
  async (req: NextRequest) => {
    try {
      const body = CreateGastoSchema.parse(await req.json());
      return created(await createGasto(body));
    } catch (err) {
      return handleError(err);
    }
  }
);
