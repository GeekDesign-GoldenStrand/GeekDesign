"use client";

import { CheckCircle, WarningCircle, XCircle, Clock } from "@phosphor-icons/react";

interface QuoteStatusCountProps {
  type: "aprobado" | "modificado" | "rechazado" | "revision";
  count?: number;
  label: string;
}

const CONFIG = {
  aprobado: {
    icon: CheckCircle,
    color: "text-green-600",
  },
  modificado: {
    icon: WarningCircle,
    color: "text-orange-500",
  },
  rechazado: {
    icon: XCircle,
    color: "text-red-500",
  },
  revision: {
    icon: Clock,
    color: "text-blue-600",
  },
};

export function QuoteStatusCount({ type, count, label }: QuoteStatusCountProps) {
  const { icon: Icon, color } = CONFIG[type];

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Icon size={24} weight="bold" className={color} />
        <span className="text-[15px] font-medium text-[#575757]">{label}</span>
      </div>
      {count !== undefined && <span className={`text-[18px] font-bold ${color}`}>{count}</span>}
    </div>
  );
}
