import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreatePagoSchema } from "@/lib/schemas/pagos";
import { listPagosByPedido, createPago } from "@/lib/services/pagos";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

// GET /api/pagos?pedidoId=1
export const GET = withRole([...ALL_ADMIN], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const pedidoId = Number(searchParams.get("pedidoId") ?? 0);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 50)));
    const result = await listPagosByPedido(pedidoId, page, pageSize);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole([...ALL_ADMIN], async (req: NextRequest) => {
  try {
    const body = CreatePagoSchema.parse(await req.json());
    return created(await createPago(body));
  } catch (err) {
    return handleError(err);
  }
});
