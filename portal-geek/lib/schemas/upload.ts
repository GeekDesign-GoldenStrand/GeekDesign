import { z } from "zod";

import { STORAGE_CATEGORIES } from "@/lib/storage/keys";

// Per-category upload limits. Allowed extensions are enforced against the
// filename for design files (.ai/.eps share a mime; .dxf has none). For other
// categories, allowedMime is the gate.
type Limits = {
  maxBytes: number;
  allowedMime: readonly string[];
  // Only required for categories that use filename-based extension validation.
  allowedExt?: readonly string[];
};

export const UPLOAD_LIMITS: Record<(typeof STORAGE_CATEGORIES)[number], Limits> = {
  materiales: {
    maxBytes: 10 * 1024 * 1024,
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  servicios: {
    maxBytes: 10 * 1024 * 1024,
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  // Client design files attached to a pedido detail (ArchivosDisenio).
  // SRS line 547: .svg .ai .eps .dxf .pdf
  disenios: {
    maxBytes: 25 * 1024 * 1024,
    allowedMime: [
      "image/svg+xml",
      "application/postscript",
      "application/pdf",
      "application/octet-stream", // .dxf rarely carries a real mime
      "image/vnd.dxf",
    ],
    allowedExt: ["svg", "ai", "eps", "dxf", "pdf"],
  },
  // File attachments on NotasCliente.
  notas: {
    maxBytes: 10 * 1024 * 1024,
    allowedMime: ["image/jpeg", "image/png", "application/pdf"],
  },
  // Server-generated PDFs only — exposed here so the upload flow validates
  // category names consistently. Browser uploads to this category are blocked
  // at the route level (server-only writes).
  cotizaciones: {
    maxBytes: 10 * 1024 * 1024,
    allowedMime: ["application/pdf"],
  },
};

export const PresignUploadSchema = z.object({
  category: z.enum(STORAGE_CATEGORIES, { message: "Categoría no válida." }),
  contentType: z.string().min(1, "El tipo de contenido es requerido."),
  // Original filename. Required for `disenios` so we can disambiguate
  // application/postscript and accept extension-only formats like .dxf.
  filename: z.string().min(1).max(255).optional(),
  size: z
    .number({ message: "El tamaño es requerido." })
    .int("El tamaño debe ser entero.")
    .positive("El tamaño debe ser mayor a 0."),
});

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;
