import type { NextRequest } from "next/server";

import { CalcularPrecioSchema, ServicioIdParams } from "@/lib/schemas/servicios";
import { calcularPrecioServicio } from "@/lib/services/formula-pricing";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// Public storefront endpoint: cliente sees the price update as they edit
// material / variables / quantity. No auth — the servicio's active formula
// gates access, not a session.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    const body = CalcularPrecioSchema.parse(await req.json());
    const precioUnitario = await calcularPrecioServicio({
      id_servicio: id,
      id_material: body.id_material,
      variables: body.variables,
    });
    return ok({ precioUnitario });
  } catch (err) {
    return handleError(err);
  }
}
