import type { CategoriaCliente } from "@/types/cotizacion";

import { CLIENT_CATEGORY_COLORS } from "../atoms/constants";

interface ClientBadgeProps {
  categoria: CategoriaCliente;
}

export function ClientBadge({ categoria }: ClientBadgeProps) {
  const colorClass = CLIENT_CATEGORY_COLORS[categoria] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md ml-2 align-middle ${colorClass}`}
    >
      {categoria}
    </span>
  );
}
