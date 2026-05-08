import { z } from "zod";

import { withRoleParams } from "@/lib/auth/guards";
import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { changeQuotationStatus, QUOTATION_STATUS } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ChangeQuotationStatusSchema = z.object({
  estatus: z.enum([
    QUOTATION_STATUS.PENDIENTE,
    QUOTATION_STATUS.VALIDADA,
    QUOTATION_STATUS.RECHAZADA,
    QUOTATION_STATUS.APROBADA,
    QUOTATION_STATUS.CANCELADA,
  ]),
});

export const PATCH = withRoleParams<Params>(["Direccion"], async (req, ctx, session) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);

    const body = ChangeQuotationStatusSchema.parse(await req.json());

    const cotizacion = await changeQuotationStatus(id, body.estatus, session.id);

    return ok(cotizacion);
  } catch (err) {
    return handleError(err);
  }
});
