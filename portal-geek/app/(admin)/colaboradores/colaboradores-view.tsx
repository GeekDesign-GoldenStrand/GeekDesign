"use client";

import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { UserCard } from "@/components/admin/organisms/UserCard";
import {
  AgregarColaboradorModal,
  AsignarSucursalModal,
  ConfirmarEliminarColaboradorModal,
  EditarColaboradorModal,
  type ColaboradorApiRow,
} from "@/components/ui/colaboradores";
import { FiltrarColaboradoresPanel } from "@/components/ui/colaboradores/molecules/FiltrarColaboradoresPanel";
import { PaginacionControles } from "@/components/ui/materiales/molecules/PaginacionControles";

const PAGE_SIZE = 20;

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
  id_sucursal: number | null;
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
    id_sucursal: item.colaborador?.sucursal?.id_sucursal ?? null,
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterEstatus, setFilterEstatus] = useState("");
  const [filterRoles, setFilterRoles] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Delete state
  const [deletingColaborador, setDeletingColaborador] = useState<{
    id: number;
    name: string;
  } | null>(null);
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

  // Assign sucursal state
  const [asignandoColaborador, setAsignandoColaborador] = useState<{
    id: number;
    nombre: string;
    id_sucursal: number | null;
  } | null>(null);
  const [asignarLoading, setAsignarLoading] = useState(false);
  const [asignarError, setAsignarError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    Promise.all([
      fetch(`/api/colaboradores?${params}`),
      fetch("/api/roles"),
      fetch("/api/sucursales?page=1&pageSize=100"),
    ])
      .then(async ([colabRes, rolesRes, sucursalesRes]) => {
        if (!colabRes.ok || !rolesRes.ok || !sucursalesRes.ok) throw new Error();
        const [colabJson, rolesJson, sucursalesJson] = await Promise.all([
          colabRes.json(),
          rolesRes.json(),
          sucursalesRes.json(),
        ]);
        if (cancelled) return;
        setColaboradores(((colabJson.data ?? []) as ColaboradorApiRow[]).map(mapApiRow));
        setTotalPages(Math.max(1, Math.ceil((colabJson.total ?? 0) / PAGE_SIZE)));
        setRoles((rolesJson.data ?? []) as Rol[]);
        setSucursales((sucursalesJson.data ?? []) as Sucursal[]);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los colaboradores. Intenta de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, retryAttempt]);

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
          c.id_usuario === editingId ? mapApiRow((json as { data: ColaboradorApiRow }).data) : c
        )
      );
      closeEditModal();
    } catch {
      setEditError("Error de red. Intenta de nuevo.");
    } finally {
      setEditLoading(false);
    }
  }

  function openAsignarSucursal(userId: number) {
    const row = colaboradores.find((c) => c.id_usuario === userId);
    if (!row) return;
    setAsignarError(null);
    setAsignandoColaborador({
      id: row.id_usuario,
      nombre: row.nombre_completo,
      id_sucursal: row.id_sucursal,
    });
  }

  async function handleAsignarSucursal(idSucursal: number) {
    if (!asignandoColaborador) return;
    setAsignarLoading(true);
    setAsignarError(null);
    try {
      const res = await fetch(`/api/colaboradores/${asignandoColaborador.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_sucursal: idSucursal }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setAsignarError((json as { error?: string })?.error ?? `Error ${res.status}`);
        return;
      }
      const updated = (json as { data: ColaboradorApiRow }).data;
      setColaboradores((prev) =>
        prev.map((c) => (c.id_usuario === asignandoColaborador.id ? mapApiRow(updated) : c))
      );
      setAsignandoColaborador(null);
    } catch {
      setAsignarError("No se pudo conectar con el servidor");
    } finally {
      setAsignarLoading(false);
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

  useEffect(() => {
    setPage(1);
  }, [search, filterEstatus, filterRoles]);

  function handleRolToggle(id: number) {
    setFilterRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function handleLimpiarFiltros() {
    setFilterEstatus("");
    setFilterRoles([]);
  }

  const q = search.trim().toLowerCase();
  const filtered = colaboradores.filter((u) => {
    if (
      q &&
      !u.nombre_completo.toLowerCase().includes(q) &&
      !(u.correo_electronico?.toLowerCase().includes(q) ?? false)
    )
      return false;
    if (filterEstatus && u.estatus_colaborador !== filterEstatus) return false;
    if (filterRoles.length > 0 && !filterRoles.includes(u.id_rol)) return false;
    return true;
  });

  return (
    <div>
      <AdminHeader title="Colaboradores" />

      <div className="px-8 pt-6 pb-4">
        <div className="relative">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            onAgregar={() => setModalOpen(true)}
            onFiltrar={() => setFilterOpen((v) => !v)}
          />
          {filterOpen && (
            <FiltrarColaboradoresPanel
              roles={roles}
              filterEstatus={filterEstatus}
              filterRoles={filterRoles}
              onEstatusChange={setFilterEstatus}
              onRolToggle={handleRolToggle}
              onReset={handleLimpiarFiltros}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>
        {statusError && (
          <p role="alert" className="mt-3 text-[14px] text-[#df2646]">
            {statusError}
          </p>
        )}
      </div>

      {loading && <p className="px-8 text-[#8e908f] text-[16px] font-ibm-plex">Cargando...</p>}

      {error && !loading && (
        <div className="px-8 flex flex-col gap-3">
          <p className="text-[#e42200] text-[16px] font-ibm-plex">{error}</p>
          <button
            onClick={() => setRetryAttempt((n) => n + 1)}
            className="self-start px-4 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[6px] hover:bg-[#f5f5f5] transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="px-8 pb-10">
          <div className="grid grid-cols-4 gap-5">
            {filtered.map((u) => (
              <UserCard
                key={u.id_usuario}
                user={{ ...u, estatus: u.estatus_colaborador }}
                onStatusChange={handleStatusChange}
                savingStatus={savingStatus === u.id_usuario}
                onEdit={openEditModal}
                onSucursalClick={openAsignarSucursal}
                onDelete={(id) => {
                  setDeletingColaborador({ id, name: u.nombre_completo });
                  setDeleteError(null);
                }}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-4 py-16 text-center font-ibm-plex text-[#888]">
                {q ? "Sin resultados para esa búsqueda." : "No hay colaboradores registrados."}
              </p>
            )}
          </div>
          <PaginacionControles page={page} totalPages={totalPages} onPageChange={setPage} />
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

      <AsignarSucursalModal
        isOpen={asignandoColaborador !== null}
        colaboradorId={asignandoColaborador?.id ?? null}
        colaboradorName={asignandoColaborador?.nombre ?? ""}
        currentSucursalId={asignandoColaborador?.id_sucursal ?? null}
        sucursales={sucursales}
        loading={asignarLoading}
        serverError={asignarError}
        onClose={() => {
          setAsignandoColaborador(null);
          setAsignarError(null);
        }}
        onSubmit={handleAsignarSucursal}
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
