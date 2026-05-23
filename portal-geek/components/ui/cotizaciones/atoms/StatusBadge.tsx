import React from "react";

import type { EstatusCotizacion } from "@/lib/utils/cotizacion";

import { STATUS_COLORS } from "@/lib/utils/cotizacion";

interface StatusBadgeProps {
  estatus: EstatusCotizacion;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estatus, size = "md" }) => {
  const colorClass = STATUS_COLORS[estatus] ?? "bg-gray-100 text-gray-600";
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${colorClass} ${sizeClass}`}
    >
      {estatus}
    </span>
  );
};
