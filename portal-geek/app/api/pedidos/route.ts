import type { NextRequest } from "next/server";

import { withSection } from "@/lib/auth/guards";
import { CreatePedidoSchema } from "@/lib/schemas/pedidos";
import { listPedidos, createPedido } from "@/lib/services/pedidos";
import { paginated, created } from "@/lib/utils/api";
import { handleError, ValidationError } from "@/lib/utils/errors";

// GET endpoint: lists pedidos with filters and pagination
export const GET = withSection("pedidos", "read", async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    // Pagination parameters: default page=1, pageSize=20, with limits
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

    // Multiple serviceId values are allowed
    const rawServiceIds = searchParams.getAll("serviceId");

    const serviceIds = rawServiceIds.map((id) => {
      const num = Number(id);

      // Validate that serviceId is a positive integer
      if (!Number.isInteger(num) || num <= 0) {
        throw new ValidationError(`Invalid serviceId: '${id}'`);
      }

      return num;
    });

    // Multiple status values are allowed (pedido-level)
    const estatuses = searchParams.getAll("estatus");

    // Multiple detail-level status values, scoped to the selected service
    const detalleEstatuses = searchParams.getAll("detalleEstatus");

    // Optional filters: company, client, active-only flag, fecha_estimada range
    const empresa = searchParams.get("empresa");
    const cliente = searchParams.get("cliente");
    const onlyActive = searchParams.get("onlyActive") === "true";
    const fechaEstimadaDesde = searchParams.get("fechaEstimadaDesde");
    const fechaEstimadaHasta = searchParams.get("fechaEstimadaHasta");

    // Query the database with filters and return paginated result
    const result = await listPedidos(
      page,
      pageSize,
      serviceIds,
      estatuses,
      onlyActive,
      empresa,
      cliente,
      search,
      fechaEstimadaDesde,
      fechaEstimadaHasta,
      detalleEstatuses
    );
    return paginated(result.items, result.total, page, pageSize);
  } catch (err) {
    // Centralized error handling
    return handleError(err);
  }
});

// POST endpoint: creates a new pedido
export const POST = withSection("pedidos", "write", async (req: NextRequest) => {
  try {
    // Validate request body against schema
    const body = CreatePedidoSchema.parse(await req.json());

    // Create pedido and return created response
    return created(await createPedido(body));
  } catch (err) {
    // Centralized error handling
    return handleError(err);
  }
});
