"use client";

import Link from "next/link";

import { PlusIcon } from "@/components/ui/atoms/icons";

type ServiciosToolbarProps = {
  activosCount: number;
};

export function ServiciosToolbar({ activosCount }: ServiciosToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 font-ibm-plex">
      <div className="flex flex-wrap items-center gap-3 w-full justify-between sm:justify-start">
        <div className="bg-[#fce4e4] text-[#e42200] px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
          Activos: {activosCount}
        </div>
        <Link
          href="/servicios/nuevoServicio"
          className="bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-10 px-5 rounded-full font-medium text-sm transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap w-full sm:w-auto"
        >
          <PlusIcon size={16} />
          Registrar Nuevo Servicio
        </Link>
      </div>
    </div>
  );
}
