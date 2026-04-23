import type { NextRequest } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { CreatePedidoSchema } from "@/lib/schemas/pedidos";
import { listPedidos, createPedido } from "@/lib/services/pedidos";
import { paginated, created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export const GET = withRole(["Direccion", "Colaborador"], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const serviceId = searchParams.get("serviceId")
      ? Number(searchParams.get("serviceId"))
      : undefined;
    const onlyActive = searchParams.get("onlyActive") === "true";

    const result = await listPedidos(page, pageSize, serviceId, onlyActive);
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withRole(["Direccion", "Colaborador"], async (req: NextRequest) => {
  try {
    const body = CreatePedidoSchema.parse(await req.json());
    return created(await createPedido(body));
  } catch (err) {
    return handleError(err);
  }
});
