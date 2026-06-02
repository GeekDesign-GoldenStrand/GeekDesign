"use client";

import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import ConfirmDeletionModal from "@/components/admin/organisms/ConfirmDeletionModal";
import { MaquinaCard } from "@/components/ui/maquinas/organisms/MaquinaCard";
import type { MaquinaCardProps } from "@/types";

import EditarMaquina from "./editar-maquina";
import RegistrarForm from "./registrar-form";

export interface MaquinaRaw {
  id_maquina: number;
  nombre_maquina: string;
  apodo_maquina: string;
  tipo: string;
  descripcion: string | null;
  estatus: string;
  fecha_registro: string;
  sucursales: { sucursal: { nombre_sucursal: string } }[];
  servicios?: { servicio: { nombre_servicio: string } }[];
}

export interface SucursalRaw {
  id_sucursal: number;
  nombre_sucursal: string;
}

export interface ServicioRaw {
  id_servicio: number;
  nombre_servicio: string;
}

async function deleteMaquina(id: number): Promise<void> {
  const res = await fetch(`/api/maquinas/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error deleting maquina");
}

async function getMaquinas(): Promise<MaquinaCardProps[]> {
  const res = await fetch("/api/maquinas?pageSize=100&page=1");
  if (!res.ok) throw new Error("Error fetching maquinas");

  const json = await res.json();
  const data: MaquinaRaw[] = json.data ?? [];

  return data.map((m) => ({
    id: m.id_maquina,
    model: m.nombre_maquina,
    nickname: m.apodo_maquina,
    type: m.tipo,
    store: m.sucursales.map((s) => s.sucursal.nombre_sucursal).join(", ") ?? "Sin asignar",
    description: m.descripcion ?? "",
    services: (m.servicios ?? []).map((s) => s.servicio.nombre_servicio),
    creation_date: m.fecha_registro,
    status: m.estatus,
    onDelete: () => {},
    onEdit: () => {},
    onAssignStore: () => {},
    onAssignServices: () => {},
    onChangeStatus: () => {},
  }));
}

export default function MaquinasGrid() {
  const [maquinas, setMaquinas] = useState<MaquinaCardProps[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingMaquinas, setIsLoadingMaquinas] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredMaquinas = maquinas.filter(
    (m) =>
      m.nickname.toLowerCase().includes(search.toLowerCase()) ||
      m.model.toLowerCase().includes(search.toLowerCase())
  );

  async function fetchMaquinas() {
    setIsLoadingMaquinas(true);
    setFetchError(null);
    try {
      const data = await getMaquinas();
      setMaquinas(data);
    } catch {
      setFetchError("No se pudieron cargar las máquinas. Intenta de nuevo.");
    } finally {
      setIsLoadingMaquinas(false);
    }
  }

  useEffect(() => {
    fetchMaquinas();
  }, []);

  async function handleConfirmDelete() {
    if (!selectedId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteMaquina(selectedId);
      setIsDeleteOpen(false);
      await fetchMaquinas();
    } catch {
      setDeleteError("Hubo un error al eliminar la máquina.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleCreated(newMachine: MaquinaCardProps) {
    setMaquinas((prev) => [...prev, newMachine]);
  }

  function handleEdited(updatedMachine: MaquinaCardProps) {
    setMaquinas((prev) => prev.map((m) => (m.id === updatedMachine.id ? updatedMachine : m)));
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/maquinas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: newStatus }),
      });
      if (!res.ok) return;

      const json = await res.json();
      const data: MaquinaRaw = json.data;

      setMaquinas((prev) => prev.map((m) => (m.id === id ? { ...m, status: data.estatus } : m)));
    } catch {
      setIsLoadingMaquinas(false);
    }
  }

  function openEditModal(id: number) {
    setSelectedId(id);
    setIsEditOpen(true);
  }

  const selectedMaquina = maquinas.find((m) => m.id === selectedId);

  return (
    <div className="px-8 pt-6 pb-4">
      <AdminToolbar
        search={search}
        onSearchChange={(value) => setSearch(value)}
        onAgregar={() => {
          setIsRegisterOpen(true);
        }}
      />
      {isLoadingMaquinas && <p className="text-14 font-ibm plex-sans">Cargando máquinas...</p>}
      {fetchError && !isLoadingMaquinas && (
        <div className="my-4 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={() => fetchMaquinas()}
            className="ml-4 rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}
      {!isLoadingMaquinas && !fetchError && filteredMaquinas.length === 0 && (
        <p className="my-6 text-center text-sm text-[#575757]">
          {search
            ? `No se encontraron máquinas que coincidan con "${search}".`
            : "Aún no hay máquinas registradas."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredMaquinas.map((m) => (
          <MaquinaCard
            key={m.id}
            {...m}
            onDelete={() => {
              setSelectedId(m.id);
              setIsDeleteOpen(true);
            }}
            onEdit={() => openEditModal(m.id)}
            onAssignStore={() => openEditModal(m.id)}
            onAssignServices={() => openEditModal(m.id)}
            onChangeStatus={(newStatus: string) => handleStatusChange(m.id, newStatus)}
          />
        ))}
      </div>

      <ConfirmDeletionModal
        modalTitle="Eliminar Máquina"
        deletedName={`${selectedMaquina?.nickname} (${selectedMaquina?.model})`}
        isOpen={isDeleteOpen}
        loading={deleteLoading}
        serverError={deleteError}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <RegistrarForm
        isOpen={isRegisterOpen}
        onCreated={handleCreated}
        onClose={() => setIsRegisterOpen(false)}
      />

      <EditarMaquina
        id={selectedId ?? 0}
        isOpen={isEditOpen}
        onEdit={handleEdited}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
}
