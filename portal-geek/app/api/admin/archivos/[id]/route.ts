import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { presignGet } from "@/lib/services/storage";
import { handleError, NotFoundError } from "@/lib/utils/errors";

// Generates a short-lived signed GET URL for a design file and redirects
// the browser to it. Requires Direccion role — design files are client assets
// that should not be publicly accessible.
export const GET = withRoleParams<{ id: string }>(
  ["Direccion"],
  async (_req: NextRequest, ctx, _session) => {
    try {
      const { id } = await ctx.params;
      const archivoId = Number(id);
      if (!Number.isInteger(archivoId) || archivoId < 1) {
        throw new NotFoundError("Archivo no encontrado");
      }

      const archivo = await prisma.archivosDisenio.findUnique({
        where: { id_archivo: archivoId },
      });

      if (!archivo || archivo.url_archivo === "__PLACEHOLDER__") {
        throw new NotFoundError("Archivo no encontrado");
      }

      // url_archivo holds the GCS object key (e.g. "disenios/2026/05/uuid.png").
      // Pass the original filename so the browser saves the file with its real
      // name. Critical for .ai/.eps (application/postscript) and .dxf
      // (application/octet-stream) — without it the browser would use the UUID key.
      const signedUrl = await presignGet(archivo.url_archivo, undefined, archivo.nombre_archivo);
      return NextResponse.redirect(signedUrl);
    } catch (err) {
      return handleError(err);
    }
  }
);
