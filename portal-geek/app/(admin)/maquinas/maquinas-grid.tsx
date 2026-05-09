"use client";

import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import ConfirmDeletionModal from "@/components/admin/organisms/ConfirmDeletionModal"; // adjust path
import { MaquinaCard } from "@/components/ui/maquinas/organisms/MaquinaCard";

import type { MaquinaCardProps } from "@/types/MaquinaCardProps";

interface MaquinaRaw {
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
    nickname: m.apodo_maquina,
    model: m.tipo,
    store: m.sucursales.map((s) => s.sucursal.nombre_sucursal).join(", "),
    description: m.descripcion ?? "",
    services: (m.servicios ?? []).map((s) => s.servicio.nombre_servicio),
    creation_date: m.fecha_registro,
  }));
}

export default function MaquinasGrid() {
  const [maquinas, setMaquinas] = useState<MaquinaCardProps[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function fetchMaquinas() {
    const data = await getMaquinas();
    setMaquinas(data);
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

  const selectedMaquina = maquinas.find((m) => m.id === selectedId);

  return (
    <div className="px-8 pt-6 pb-4">
      <AdminToolbar search="" onSearchChange={() => {}} onAgregar={() => {}} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {maquinas.map((m) => (
          <MaquinaCard
            key={m.id}
            {...m}
            onDelete={() => {
              setSelectedId(m.id);
              setIsDeleteOpen(true);
            }}
            onEdit={() => {}}
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
    </div>
  );
}
