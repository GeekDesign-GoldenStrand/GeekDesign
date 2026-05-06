import { NextResponse } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { changeQuotationStatus, QUOTATION_STATUS } from "@/lib/services/cotizaciones";
import { handleError } from "@/lib/utils/errors";

export const PATCH = withRoleParams<{ id: string }>(
  ["Direccion", "Administrador"],
  async (req, ctx, session) => {
    try {
      // Renaming 'id' to 'quotationId' for semantic clarity
      const { id: quotationId } = CotizacionIdParams.parse(await ctx.params);

      const body = await req.json();
      const newStatus = body.estatus;

      // Validate against centralized QUOTATION_STATUS catalog.
      // This prevents "magic strings" and ensures consistency if the catalog changes.
      if (!Object.values(QUOTATION_STATUS).includes(newStatus)) {
        return handleError(new Error("Invalid quotation status"));
      }

      // Delegate to service function that handles transaction + history logging.
      // Keeping this logic in the service avoids duplication across multiple routes.
      const updated = await changeQuotationStatus(quotationId, newStatus, session.id);

      return NextResponse.json(updated);
    } catch (err) {
      return handleError(err);
    }
  }
);
