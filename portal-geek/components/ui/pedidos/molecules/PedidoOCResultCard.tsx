import { FilePdf } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import type { OrdenGenerada } from "@/types/pedido";

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadBase64Pdf(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  triggerBlobDownload(new Blob([bytes], { type: "application/pdf" }), filename);
}

interface Props {
  ordenes: OrdenGenerada[];
}

export function PedidoOCResultCard({ ordenes }: Props) {
  if (ordenes.length === 0) return null;

  return (
    <SectionCard title="Órdenes generadas" icon={<FilePdf size={15} />} className="mb-4">
      <ul className="space-y-2">
        {ordenes.map((o, i) => (
          <li key={i} className="flex items-center justify-between text-[13px]">
            <span className="text-gray-700">
              {o.nombre} <span className="text-gray-400">({o.tipo})</span>
            </span>
            <button
              type="button"
              onClick={() => downloadBase64Pdf(o.pdf_base64, `OC-${o.nombre}.pdf`)}
              className="text-[#e42200] underline text-[12px] hover:text-[#b31a00]"
            >
              Descargar PDF
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
