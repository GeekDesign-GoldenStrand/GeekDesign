"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { SucursalesFilterSidebar } from "@/components/admin/organisms/SucursalesFilterSidebar";
import { SucursalesTable } from "@/components/admin/organisms/SucursalesTable";

type Sucursal = {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  estatus: string;
};

type Props = {
  sucursales: Sucursal[];

  search: string;
  setSearch: (value: string) => void;

  page: number;
  setPage: (page: number) => void;
  total: number;

  onDelete: (id: number) => void;

  // filtros
  filterNombre: string;
  setFilterNombre: (value: string) => void;

  filterDireccion: string;
  setFilterDireccion: (value: string) => void;

  filterEstatus: string[];
  setFilterEstatus: (value: string[]) => void;
};

export function SucursalesTemplate({
  sucursales,
  search,
  setSearch,
  page,
  setPage,
  total,
  filterNombre,
  setFilterNombre,
  filterDireccion,
  setFilterDireccion,
  filterEstatus,
  setFilterEstatus,
}: Props) {
  const pageSize = 10;

  const [showFilter, setShowFilter] = useState(false);
  const router = useRouter();

  return (
    <>
      <AdminHeader title="Sucursales" />

      <section className="max-w-[1350px] mx-auto px-4 sm:px-8 pt-5 space-y-4 font-ibm-plex">
        {/* Toolbar */}
        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          onAgregar={() => router.push("/sucursales/registrar")}
          onFiltrar={() => setShowFilter(true)}
        />

        <SucursalesFilterSidebar
          open={showFilter}
          onClose={() => setShowFilter(false)}
          filterNombre={filterNombre}
          setFilterNombre={setFilterNombre}
          filterDireccion={filterDireccion}
          setFilterDireccion={setFilterDireccion}
          filterEstatus={filterEstatus}
          setFilterEstatus={setFilterEstatus}
        />

        {/* Table */}
        <SucursalesTable sucursales={sucursales} />

        {/* Pagination */}
        <div className="flex justify-end mt-8 mb-6 pr-4">
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40"
            >
              {"<"}
            </button>

            {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = pageNumber === page;

              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`w-[36px] h-[36px] rounded-[4px] font-bold text-[15px]
                  ${
                    isActive
                      ? "bg-[#e42200] text-white"
                      : "bg-gray-100 text-[#1e1e1e] hover:bg-gray-200"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              disabled={page === Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
              className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40"
            >
              {">"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
