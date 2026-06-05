import { NextResponse } from "next/server";

import { withSectionParams } from "@/lib/auth/guards";
import { CotizacionIdParams, UpdateCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { getCotizacion, updateCotizacion, deleteCotizacion } from "@/lib/services/cotizaciones";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withSectionParams<Params>("cotizaciones", "read", async (_req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const quotation = await getCotizacion(id);
    if (!quotation) {
      return NextResponse.json({ data: null, error: "Folio no encontrado" }, { status: 404 });
    }
    return ok(quotation);
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>("cotizaciones", "write", async (req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = UpdateCotizacionSchema.parse(await req.json());
    return ok(await updateCotizacion(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withSectionParams<Params>("cotizaciones", "write", async (_req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    await deleteCotizacion(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
