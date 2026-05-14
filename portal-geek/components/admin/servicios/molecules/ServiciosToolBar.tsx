"use client";

import { FunnelIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { Icon } from "../atoms/Icon";

type ServiciosToolbarProps = {
  activosCount: number;
  onFilterClick?: () => void;
};

export function ServiciosToolbar({ activosCount, onFilterClick }: ServiciosToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-[#fce4e4] text-[#e42200] px-4 py-2 rounded-full text-sm font-semibold">
          Activos: {activosCount}
        </div>
        <Link
          href="/servicios/nuevoServicio"
          className="bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-10 px-5 rounded-full font-medium text-sm transition-all inline-flex items-center"
        >
          Registrar Nuevo Servicio
        </Link>
      </div>

      <button aria-label="Filtrar servicios" className="...">
        <Icon LibIcon={FunnelIcon} />
      </button>
    </div>
  );
}
