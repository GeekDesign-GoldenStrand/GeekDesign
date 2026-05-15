"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
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
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    }

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  return (
    <>
      <AdminHeader title="Sucursales" />

      <section className="max-w-[1350px] mx-auto px-4 sm:px-8 pt-5 space-y-4 font-ibm-plex">
        {/* Toolbar */}
        <div className="relative">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            onAgregar={() => router.push("/sucursales/registrar")}
            onFiltrar={() => setShowFilter((prev) => !prev)}
          />

          {/* Dropdown filtros */}
          {showFilter && (
            <div ref={filterRef} className="absolute right-0 mt-2 z-50">
              <div className="bg-white p-6 rounded-[14px] w-[calc(100vw-2rem)] sm:w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ff7f7f] text-black">
                <h2 className="text-[24px] font-semibold mb-4 text-[#1e1e1e]">Filtros</h2>

                {/* Nombre */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">Nombre sucursal</p>
                  <input
                    value={filterNombre}
                    onChange={(e) => setFilterNombre(e.target.value)}
                    className="w-full border border-[#b9b8b8] rounded-[6px] p-2"
                  />
                </div>

                {/* Dirección */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">Dirección</p>
                  <input
                    value={filterDireccion}
                    onChange={(e) => setFilterDireccion(e.target.value)}
                    className="w-full border border-[#b9b8b8] rounded-[6px] p-2"
                  />
                </div>

                {/* Estatus */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus</p>

                  <div className="space-y-2">
                    {["Activo", "Inactivo"].map((status) => (
                      <label key={status} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={filterEstatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterEstatus([...filterEstatus, status]);
                            } else {
                              setFilterEstatus(filterEstatus.filter((s) => s !== status));
                            }
                          }}
                          className="accent-[#ff7f7f]"
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setFilterNombre("");
                      setFilterDireccion("");
                      setFilterEstatus([]);
                    }}
                    className="h-7 px-3 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                  >
                    Restablecer
                  </button>

                  <button
                    onClick={() => setShowFilter(false)}
                    className="h-7 px-6 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

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
