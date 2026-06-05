import { withSectionParams } from "@/lib/auth/guards";
import {
  UpdateDetalleVariablesParams,
  UpdateDetalleVariablesSchema,
} from "@/lib/schemas/cotizaciones";
import { updateDetalleVariables } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string; id_detalle: string };

// Admin edits the FormulaVariable values for one line item; server recomputes
// precio_unitario via calcularPrecioServicio and updates Cotizaciones.monto_total
// in the same transaction. Mirrors the auth + Pendiente-only gates of PUT
// /api/cotizaciones/[id] so the two write paths stay aligned.
export const PATCH = withSectionParams<Params>(
  "cotizaciones",
  "write",
  async (req, ctx, session) => {
    try {
      const { id, id_detalle } = UpdateDetalleVariablesParams.parse(await ctx.params);
      const body = UpdateDetalleVariablesSchema.parse(await req.json());
      const result = await updateDetalleVariables(id, id_detalle, body, session.id);
      return ok(result);
    } catch (err) {
      return handleError(err);
    }
  }
);
