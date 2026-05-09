import type { NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/guards";
import { PresignUploadSchema, UPLOAD_LIMITS } from "@/lib/schemas/upload";
import { presignPut } from "@/lib/services/storage";
import { buildKey, extFromFilename, extFromMime } from "@/lib/storage/keys";
import { ok } from "@/lib/utils/api";
import { ForbiddenError, handleError, ValidationError } from "@/lib/utils/errors";

// POST /api/upload — issues a one-shot presigned PUT URL for direct browser upload.
// The client must PUT the file with the same Content-Type it declared here.
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = PresignUploadSchema.parse(await req.json());
    const limits = UPLOAD_LIMITS[body.category];

    // Server-only category — never hand out a presigned PUT for it.
    if (body.category === "cotizaciones") {
      throw new ForbiddenError("La categoría de cotizaciones se genera del lado del servidor.");
    }

    if (!limits.allowedMime.includes(body.contentType)) {
      throw new ValidationError("Tipo de archivo no permitido para esta categoría.");
    }
    if (body.size > limits.maxBytes) {
      const mb = Math.round(limits.maxBytes / (1024 * 1024));
      throw new ValidationError(`El archivo excede el tamaño máximo (${mb} MB).`);
    }

    // Categories with explicit extension allow-lists trust the filename, not
    // the mime — postscript covers both .ai and .eps, and .dxf has no mime.
    let ext: string | null = null;
    if (limits.allowedExt) {
      if (!body.filename) {
        throw new ValidationError("El nombre de archivo es requerido.");
      }
      const fromName = extFromFilename(body.filename);
      if (!fromName || !limits.allowedExt.includes(fromName)) {
        throw new ValidationError("Extensión de archivo no permitida.");
      }
      ext = fromName;
    } else {
      ext = extFromMime(body.contentType);
      if (!ext) throw new ValidationError("Tipo de archivo no soportado.");
    }

    const key = buildKey(body.category, ext);
    const url = await presignPut(key, body.contentType);

    return ok({ key, url, expiresIn: 5 * 60 });
  } catch (err) {
    return handleError(err);
  }
});
