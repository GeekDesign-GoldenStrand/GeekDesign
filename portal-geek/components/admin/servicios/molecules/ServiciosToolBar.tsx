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
        <Link href="/servicios/nuevo">
          <button className="bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-10 px-5 rounded-full font-medium text-sm transition-all">
            Registrar Nuevo Servicio
          </button>
        </Link>
      </div>

      <button
        type="button"
        onClick={onFilterClick}
        className="bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-10 px-5 rounded-full font-medium text-sm flex items-center gap-2 transition-all"
      >
        <Icon LibIcon={FunnelIcon} size={16} weight="bold" />
      </button>
    </div>
  );
}
