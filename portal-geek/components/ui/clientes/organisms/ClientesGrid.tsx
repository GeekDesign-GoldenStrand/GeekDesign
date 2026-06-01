"use client";

import type { Clientes } from "@prisma/client";

import { PaginacionNumerada } from "@/components/ui/terceros/molecules/PaginacionNumerada";

import type { ClientCategory } from "../molecules/CategoryDropdown";

import { ClienteCard } from "./ClienteCard";

interface ClientesGridProps {
  items: Clientes[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onUpdateCategory?: (id: number, category: ClientCategory | null) => void;
}

// Card-based replacement for the old ClientesTable. Matches the
// Colaboradores / Terceros pages (grid of EntityCard tiles + the shared
// PaginacionNumerada) so all three admin entity grids look alike.
export function ClientesGrid({
  items,
  loading,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onUpdateCategory,
}: ClientesGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e42200]"></div>
        <span className="ml-4 text-[#8e908f] font-medium font-ibm-plex">Cargando clientes...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[15px] border border-dashed border-[#b9b8b8]">
        <h3 className="text-[20px] font-bold text-[#1e1e1e] font-ibm-plex">
          Sin clientes registrados
        </h3>
        <p className="text-[#8e908f] font-medium font-ibm-plex">
          No se encontraron clientes que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((cliente) => (
          <ClienteCard
            key={cliente.id_cliente}
            cliente={cliente}
            onUpdateCategory={onUpdateCategory}
          />
        ))}
      </div>

      <PaginacionNumerada
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => onPageChange?.(p)}
      />
    </div>
  );
}
