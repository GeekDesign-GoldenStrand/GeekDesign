"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { UserCard } from "@/components/admin/organisms/UserCard";
import {
  AgregarColaboradorModal,
  ConfirmarEliminarColaboradorModal,
  EditarColaboradorModal,
  type ColaboradorApiRow,
} from "@/components/ui/colaboradores";

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface ColaboradorRow {
  id_usuario: number;
  nombre_completo: string;
  correo_electronico: string | null;
  edad: number | null;
  sexo: string | null;
  sucursal: string | null;
  telefono: string | null;
  fecha_modificacion: string | null;
  estatus: string;
  estatus_colaborador: string;
  id_rol: number;
  rol: { id_rol: number; nombre_rol: string };
}

function mapApiRow(item: ColaboradorApiRow): ColaboradorRow {
  return {
    id_usuario: item.id_usuario,
    nombre_completo: item.nombre_completo,
    correo_electronico: item.correo_electronico,
    estatus: item.estatus,
    estatus_colaborador: item.colaborador?.estatus_colaborador ?? "Activo",
    id_rol: item.id_rol,
    rol: item.rol,
    edad: item.colaborador?.edad ?? null,
    sexo: item.colaborador?.sexo ?? null,
    sucursal: item.colaborador?.sucursal?.nombre_sucursal ?? null,
    telefono: item.colaborador?.telefono ?? null,
    fecha_modificacion: item.colaborador?.fecha_modificacion
      ? new Date(item.colaborador.fecha_modificacion).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : null,
  };
}

export function ColaboradoresView() {
  const [colaboradores, setColaboradores] = useState<ColaboradorRow[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Delete state
  const [deletingColaborador, setDeletingColaborador] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editApiRow, setEditApiRow] = useState<ColaboradorApiRow | null>(null);
  const [editLoadingData, setEditLoadingData] = useState(false);
  const [editFetchError, setEditFetchError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [colabRes, rolesRes, sucursalesRes] = await Promise.all([
        fetch("/api/colaboradores?page=1&pageSize=100"),
        fetch("/api/roles"),
        fetch("/api/sucursales?page=1&pageSize=100"),
      ]);

      if (!colabRes.ok || !rolesRes.ok || !sucursalesRes.ok) {
        throw new Error("Error al cargar los datos");
      }

      const [colabJson, rolesJson, sucursalesJson] = await Promise.all([
        colabRes.json(),
        rolesRes.json(),
        sucursalesRes.json(),
      ]);

      setColaboradores(((colabJson.data ?? []) as ColaboradorApiRow[]).map(mapApiRow));
      setRoles((rolesJson.data ?? []) as Rol[]);
      setSucursales((sucursalesJson.data ?? []) as Sucursal[]);
    } catch {
      setError("No se pudieron cargar los colaboradores. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(userId: number, newStatus: string) {
    setSavingStatus(userId);
    setStatusError(null);
    try {
      const res = await fetch(`/api/colaboradores/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus_colaborador: newStatus }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setStatusError(json?.error ?? "Error al actualizar el estatus");
        return;
      }
      setColaboradores((prev) =>
        prev.map((u) => (u.id_usuario === userId ? { ...u, estatus_colaborador: newStatus } : u))
      );
    } catch {
      setStatusError("No se pudo conectar con el servidor");
    } finally {
      setSavingStatus(null);
    }
  }

  function handleCreated(apiRow: ColaboradorApiRow) {
    setColaboradores((prev) => [mapApiRow(apiRow), ...prev]);
  }

  async function openEditModal(userId: number) {
    setEditingId(userId);
    setEditApiRow(null);
    setEditFetchError(null);
    setEditError(null);
    setEditModalOpen(true);
    setEditLoadingData(true);
    try {
      const res = await fetch(`/api/colaboradores/${userId}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setEditFetchError((json as { error?: string })?.error ?? `Error ${res.status}`);
        return;
      }
      setEditApiRow((json as { data: ColaboradorApiRow }).data);
    } catch {
      setEditFetchError("Error al cargar los datos del colaborador");
    } finally {
      setEditLoadingData(false);
    }
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditingId(null);
    setEditApiRow(null);
    setEditFetchError(null);
    setEditError(null);
  }

  async function handleEditSubmit(payload: {
    nombre_completo: string;
    correo_electronico: string;
    edad: number;
    sexo: string;
    telefono: string;
    id_rol: number;
    id_sucursal: number;
  }) {
    if (!editingId) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/colaboradores/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setEditError((json as { error?: string })?.error ?? `Error ${res.status}`);
        return;
      }
      setColaboradores((prev) =>
        prev.map((c) =>
          c.id_usuario === editingId
            ? mapApiRow((json as { data: ColaboradorApiRow }).data)
            : c
        )
      );
      closeEditModal();
    } catch {
      setEditError("Error de red. Intenta de nuevo.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingColaborador) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/colaboradores/${deletingColaborador.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setDeleteError((json as { error?: string })?.error ?? `Error ${res.status}`);
        return;
      }
      setColaboradores((prev) => prev.filter((c) => c.id_usuario !== deletingColaborador.id));
      setDeletingColaborador(null);
    } catch {
      setDeleteError("No se pudo conectar con el servidor");
    } finally {
      setDeleteLoading(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? colaboradores.filter(
        (u) =>
          u.nombre_completo.toLowerCase().includes(q) ||
          (u.correo_electronico?.toLowerCase().includes(q) ?? false)
      )
    : colaboradores;

  return (
    <div>
      <AdminHeader title="Colaboradores" />

      <div className="px-8 pt-6 pb-4">
        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          onAgregar={() => setModalOpen(true)}
          onFiltrar={() => {}}
        />
        {statusError && (
          <p role="alert" className="mt-3 text-[14px] text-[#df2646]">
            {statusError}
          </p>
        )}
      </div>

      {loading && (
        <p className="px-8 text-[#8e908f] text-[16px] font-ibm-plex">Cargando...</p>
      )}

      {error && !loading && (
        <div className="px-8 flex flex-col gap-3">
          <p className="text-[#e42200] text-[16px] font-ibm-plex">{error}</p>
          <button
            onClick={fetchData}
            className="self-start px-4 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[6px] hover:bg-[#f5f5f5] transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-4 gap-5 px-8 pb-10">
          {filtered.map((u) => (
            <UserCard
              key={u.id_usuario}
              user={{ ...u, estatus: u.estatus_colaborador }}
              onStatusChange={handleStatusChange}
              savingStatus={savingStatus === u.id_usuario}
              onEdit={openEditModal}
              onDelete={(id) => { setDeletingColaborador({ id, name: u.nombre_completo }); setDeleteError(null); }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-4 py-16 text-center font-ibm-plex text-[#888]">
              {q ? "Sin resultados para esa búsqueda." : "No hay colaboradores registrados."}
            </p>
          )}
        </div>
      )}

      <AgregarColaboradorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        roles={roles}
        sucursales={sucursales}
      />

      <ConfirmarEliminarColaboradorModal
        isOpen={deletingColaborador !== null}
        colaboradorName={deletingColaborador?.name ?? ""}
        loading={deleteLoading}
        serverError={deleteError}
        onClose={() => setDeletingColaborador(null)}
        onConfirm={handleDeleteConfirm}
      />

      <EditarColaboradorModal
        isOpen={editModalOpen}
        apiRow={editApiRow}
        loadingData={editLoadingData}
        fetchError={editFetchError}
        editLoading={editLoading}
        editError={editError}
        roles={roles}
        sucursales={sucursales}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
