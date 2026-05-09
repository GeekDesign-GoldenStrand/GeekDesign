"use client";

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
  onDelete,
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

      <section className="max-w-[1350px] mx-auto pt-5 space-y-4">
        {/* Toolbar */}
        <div className="relative">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            onAgregar={() => console.error("Agregar sucursal")}
            onFiltrar={() => setShowFilter((prev) => !prev)}
          />

          {/* Dropdown filtros */}
          {showFilter && (
            <div ref={filterRef} className="absolute right-0 mt-2 z-50">
              <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ff7f7f] text-black">
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

        {/* Tabla */}
        <SucursalesTable sucursales={sucursales} onDelete={onDelete} />

        {/* Paginación */}
        <div className="flex justify-center items-center gap-4 mt-4 text-black">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="border px-4 py-2 rounded disabled:opacity-40"
          >
            ← Anterior
          </button>

          <span>
            Página {page} de {Math.ceil(total / pageSize)}
          </span>

          <button
            disabled={page === Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
            className="border px-4 py-2 rounded disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </section>
    </>
  );
}
