import type { NextRequest } from "next/server";

import { PresignUploadSchema, UPLOAD_LIMITS } from "@/lib/schemas/upload";
import { DEFAULT_TTL_SECONDS, presignPut } from "@/lib/services/storage";
import { buildKey, extFromFilename, extFromMime } from "@/lib/storage/keys";
import { ok } from "@/lib/utils/api";
import { handleError, RateLimitError, ValidationError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

// Public endpoint — no auth required. Rate-limited by IP to cap anonymous abuse.
// Only issues presigned PUTs for the "disenios" category.
// The browser still uploads directly to GCS; the server never touches the bytes.
const RATE_LIMIT = { maxAttempts: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
    const { allowed } = checkRateLimit(`upload-disenios:${ip}`, RATE_LIMIT);
    if (!allowed) throw new RateLimitError();

    // Parse body but force category to "disenios" regardless of what the client sends.
    const raw = PresignUploadSchema.parse(await req.json());
    const body = { ...raw, category: "disenios" as const };

    const limits = UPLOAD_LIMITS.disenios;
    const contentType = body.contentType.split(";")[0].trim().toLowerCase();

    if (body.size > limits.maxBytes) {
      const mb = Math.round(limits.maxBytes / (1024 * 1024));
      throw new ValidationError(`El archivo excede el tamaño máximo (${mb} MB).`);
    }

    // disenios uses filename-based extension validation (.ai/.eps share a mime; .dxf has none)
    if (!body.filename) {
      throw new ValidationError("El nombre de archivo es requerido.");
    }
    const ext = extFromFilename(body.filename) ?? extFromMime(contentType);
    if (!ext || !limits.allowedExt!.includes(ext)) {
      throw new ValidationError(
        `Extensión no permitida. Formatos aceptados: ${limits.allowedExt!.join(", ")}.`
      );
    }

    const key = buildKey("disenios", ext);
    const url = await presignPut(key, contentType);

    return ok({ key, url, expiresIn: DEFAULT_TTL_SECONDS });
  } catch (err) {
    return handleError(err);
  }
}
