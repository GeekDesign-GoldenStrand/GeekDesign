import type { EstatusCotizacion } from "@/types/cotizacion";

import { STATUS_COLORS } from "../atoms/constants";

interface StatusBadgeProps {
  estatus: EstatusCotizacion;
  size?: "sm" | "md";
}

export function StatusBadge({ estatus, size = "md" }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[estatus] ?? "bg-gray-100 text-gray-600";
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${colorClass} ${sizeClass}`}
    >
      {estatus}
    </span>
  );
}
