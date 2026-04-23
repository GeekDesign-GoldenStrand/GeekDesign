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
    const result = await listPedidos(page, pageSize);
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

/* Esto es lo que teníamos antes, lo de arriba es lo que vino con la nueva rama develop
import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/services/orders";


// GET /api/pedidos?onlyActive=true&serviceId=1
export async function GET(req: NextRequest) {
  try {
    // Read query parameters from URL
    const onlyActive = req.nextUrl.searchParams.get("onlyActive") === "true";
    const serviceIdParam = req.nextUrl.searchParams.get("serviceId");
    const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : undefined;


    // Call service function with filters
    const orders = await getOrders({ onlyActive, serviceId });


    // Return JSON response
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
*/
