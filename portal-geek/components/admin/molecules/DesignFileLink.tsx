"use client";

import { Paperclip, WarningCircle } from "@phosphor-icons/react";

interface Props {
  archivos: { id: number; nombre: string }[];
  /** Tailwind classes for the anchor — desktop and mobile variants differ. */
  className?: string;
}

/**
 * Download link for a client-supplied design file.
 *
 * Security note — files land in the bucket via a browser-to-GCS presigned PUT;
 * the server never inspects the bytes. The extension and MIME type are
 * client-controlled claims, so a malicious payload is indistinguishable from a
 * legitimate .dxf/.ai at upload time. The amber badge and tooltip signal this to
 * the admin so they open the file in a sandboxed or isolated environment.
 * See: app/api/upload/disenios/route.ts — "no content scanning" accepted risk.
 */
export function DesignFileLink({ archivos, className }: Props) {
  if (archivos.length === 0) return null;

  const first = archivos[0];

  if (first.nombre === "PLACEHOLDER") return null;
  const title = `${first.nombre} · Archivo enviado por el cliente · No ha sido escaneado · Ábrelo en un entorno seguro`;

  return (
    <a
      href={`/api/admin/archivos/${first.id}`}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={title}
      className={className}
    >
      <Paperclip size={18} />

      {/* Count badge — only when the order has more than one design file */}
      {archivos.length > 1 && (
        <span className="absolute -top-0.5 -right-0.5 bg-[#8b434a] text-white text-[9px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center leading-none">
          {archivos.length}
        </span>
      )}

      {/* Amber indicator — always visible; signals unscanned client content */}
      <WarningCircle
        size={11}
        weight="fill"
        className="absolute -bottom-0.5 -right-0.5 text-amber-500"
        aria-hidden
      />
    </a>
  );
}
