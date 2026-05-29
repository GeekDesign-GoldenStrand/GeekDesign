"use client";

import { useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import ConfirmDeletionModal from "@/components/admin/organisms/ConfirmDeletionModal";
import { SucursalesFilterSidebar } from "@/components/admin/organisms/SucursalesFilterSidebar";
import { EditarSucursalModal } from "@/components/ui/sucursales/organisms/EditarSucursalModal";
import { RegistrarSucursalModal } from "@/components/ui/sucursales/organisms/RegistrarSucursalModal";
import { SucursalCard } from "@/components/ui/sucursales/organisms/SucursalCard";

type RelationColaborador = {
  usuario?: {
    nombre?: string | null;
  } | null;
};

type RelationMaquina = {
  maquina?: {
    nombre_maquina: string;
  } | null;
};

type Sucursal = {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura?: string | null;
  horario_salida?: string | null;
  estatus: string;
  colaboradores?: RelationColaborador[];
  maquinas?: RelationMaquina[];
};

type Props = {
  sucursales: Sucursal[];

  search: string;
  setSearch: (value: string) => void;

  page: number;
  setPage: (page: number) => void;
  total: number;

  onDelete: (id: number) => Promise<void>;
  onChangeStatus?: (id: number, status: string) => Promise<void>;
  onRefresh: () => void;

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
  onChangeStatus,
  onRefresh,
  filterNombre,
  setFilterNombre,
  filterDireccion,
  setFilterDireccion,
  filterEstatus,
  setFilterEstatus,
}: Props) {
  const pageSize = 10;

  const [showFilter, setShowFilter] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!selectedSucursal) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await onDelete(selectedSucursal.id_sucursal);
      setIsDeleteOpen(false);
      onRefresh();
    } catch {
      setDeleteError("Hubo un error al eliminar la sucursal.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCardStatusChange(id: number, newStatus: string) {
    if (onChangeStatus) {
      await onChangeStatus(id, newStatus);
    }
  }

  return (
    <>
      <AdminHeader title="Sucursales" />

      <section className="px-8 pt-6 pb-4 space-y-4 font-ibm-plex">
        {/* Toolbar */}
        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          onAgregar={() => setIsRegisterOpen(true)}
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

        {/* Cards Grid */}
        {sucursales.length === 0 ? (
          <div className="flex justify-center py-16 text-gray-500 font-ibm-plex text-[14px]">
            No se encontraron sucursales.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sucursales.map((s) => {
              const colabNames =
                (s.colaboradores?.map((c) => c.usuario?.nombre).filter(Boolean) as string[]) ?? [];
              const maqNames =
                (s.maquinas?.map((m) => m.maquina?.nombre_maquina).filter(Boolean) as string[]) ??
                [];

              return (
                <SucursalCard
                  key={s.id_sucursal}
                  id={s.id_sucursal}
                  nombre_sucursal={s.nombre_sucursal}
                  direccion={s.direccion}
                  horario_apertura={s.horario_apertura}
                  horario_salida={s.horario_salida}
                  estatus={s.estatus}
                  colaboradores={colabNames}
                  maquinas={maqNames}
                  onEdit={() => {
                    setSelectedSucursal(s);
                    setIsEditOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedSucursal(s);
                    setIsDeleteOpen(true);
                  }}
                  onChangeStatus={(newStatus) => handleCardStatusChange(s.id_sucursal, newStatus)}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-end mt-8 mb-6 pr-4">
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
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
                  className={`w-[36px] h-[36px] rounded-[4px] font-bold text-[15px] cursor-pointer
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
              disabled={page === Math.ceil(total / pageSize) || Math.ceil(total / pageSize) === 0}
              onClick={() => setPage(page + 1)}
              className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              {">"}
            </button>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      <RegistrarSucursalModal
        isOpen={isRegisterOpen}
        onCreated={() => {
          onRefresh();
        }}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* Edit Modal */}
      <EditarSucursalModal
        isOpen={isEditOpen}
        id={selectedSucursal?.id_sucursal ?? 0}
        nombre_sucursal={selectedSucursal?.nombre_sucursal ?? ""}
        direccion={selectedSucursal?.direccion ?? ""}
        horario_apertura={selectedSucursal?.horario_apertura}
        horario_salida={selectedSucursal?.horario_salida}
        estatus={selectedSucursal?.estatus ?? "Activo"}
        onEdit={() => {
          onRefresh();
        }}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeletionModal
        modalTitle="Eliminar Sucursal"
        deletedName={selectedSucursal?.nombre_sucursal ?? ""}
        isOpen={isDeleteOpen}
        loading={deleteLoading}
        serverError={deleteError}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
